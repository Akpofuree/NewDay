const API_URL =
  import.meta.env.VITE_API_URL || (typeof window !== "undefined" ? window.location.origin : "");

export function apiPath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return API_URL ? `${API_URL}${normalizedPath}` : normalizedPath;
  }

  if (
    typeof window !== "undefined" &&
    API_URL &&
    /^https?:\/\/(localhost|127\.0\.0\.1):3000\/?$/.test(API_URL)
  ) {
    // In local dev, route through the Vite proxy so the frontend can reach the API
    // even when the backend is restarted separately.
    return normalizedPath;
  }

  if (API_URL) {
    return `${API_URL}${normalizedPath}`;
  }
  return normalizedPath;
}

export function apiFetch(path: string, init: RequestInit = {}, options?: { retryOn429?: boolean }) {
  const retryOn429 = options?.retryOn429 ?? true;
  if (!API_URL && typeof window === "undefined") {
    throw new Error(
      "VITE_API_URL is not set in a non-browser environment. Please set VITE_API_URL or run the app in the browser with a proper backend proxy."
    );
  }

  // Exponential backoff for 429 responses with jitter
  const maxRetries = 5;
  const baseDelays = [2000, 4000, 8000, 16000, 30000]; // ms (cap last to 30s)

  const fetchWithRetry = async (): Promise<Response> => {
    let attempt = 0;
    while (true) {
      try {
        const res = await fetch(apiPath(path), {
          ...init,
          credentials: "include",
          headers: {
            ...(init.body ? { "Content-Type": "application/json" } : {}),
            ...init.headers,
          },
        });

        if (!retryOn429 || res.status !== 429) {
          if (attempt > 0 && typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("newday:retry", {
                detail: { phase: "stop", attempts: attempt },
              })
            );
          }
          return res;
        }

        // status 429 -> retry
        if (attempt === 0 && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("newday:retry", { detail: { phase: "start" } }));
        }

        if (attempt >= maxRetries) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("newday:retry", {
                detail: { phase: "stop", attempts: attempt },
              })
            );
          }
          return res;
        }

        const base = baseDelays[Math.min(attempt, baseDelays.length - 1)];
        const jitter = Math.floor(Math.random() * 1001) - 500; // -500..+500ms
        const waitMs = Math.max(0, Math.min(30000, base + jitter));
        attempt += 1;
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("newday:retry", {
              detail: { phase: "attempt", attempt, waitMs },
            })
          );
        }
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      } catch (err) {
        // network error — retry similarly
        attempt += 1;
        if (attempt > maxRetries) throw err;
        const base = baseDelays[Math.min(attempt - 1, baseDelays.length - 1)];
        const jitter = Math.floor(Math.random() * 1001) - 500;
        const waitMs = Math.max(0, Math.min(30000, base + jitter));
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("newday:retry", {
              detail: { phase: "attempt", attempt, waitMs },
            })
          );
        }
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }
  };

  return fetchWithRetry();
}

export async function readJsonResponse<T = any>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Time-aware multi-language greeting utility.
 */

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type Language = "en" | "fr" | "ha" | "yo" | "ig" | "ef" | "ur" | "ed";

interface GreetingConfig {
  name: string;
  language?: Language;
  timezone?: string;
  now?: Date;
}

const greetings: Record<TimeOfDay, Record<Language, string>> = {
  morning: {
    en: "Good morning",
    fr: "Bonjour",
    ha: "Ina kwana",
    yo: "Ẹ káàárọ̀",
    ig: "Ụtụtụ ọma",
    ef: "Mme usoro",
    ur: "Vwre ọfẹ",
    ed: "Ẹkiẹkọ ọghọ",
  },
  afternoon: {
    en: "Good afternoon",
    fr: "Bon après-midi",
    ha: "Ina yini",
    yo: "Ẹ káàsán",
    ig: "Ehihie ọma",
    ef: "Mme eyen",
    ur: "Ẹdẹ ọfẹ",
    ed: "Ẹdẹ ọghọ",
  },
  evening: {
    en: "Good evening",
    fr: "Bonsoir",
    ha: "Ina wuni",
    yo: "Ẹ kúrolẹ",
    ig: "Anyasị ọma",
    ef: "Mme efok",
    ur: "Ẹvẹningọ ọfẹ",
    ed: "Ẹvẹning ọghọ",
  },
  night: {
    en: "Good night",
    fr: "Bonne nuit",
    ha: "Mu kwana lafiya",
    yo: "Ó dàrọ̀",
    ig: "Ka chi foo",
    ef: "Emem ndito",
    ur: "Ọrẹ vwre",
    ed: "Ẹdẹ ọghọ rhie",
  },
};

export const supportedLanguages: Language[] = [
  "en",
  "fr",
  "ha",
  "yo",
  "ig",
  "ef",
  "ur",
  "ed",
];

export const languageNames: Record<Language, string> = {
  en: "English",
  fr: "Français",
  ha: "Hausa",
  yo: "Yoruba",
  ig: "Igbo",
  ef: "Efik",
  ur: "Urhobo",
  ed: "Edo",
};

export function getTimeOfDay(date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

function getDateInTimezone(date: Date, timezone: string): Date {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
    const minute = parseInt(
      parts.find((p) => p.type === "minute")?.value || "0",
    );
    const second = parseInt(
      parts.find((p) => p.type === "second")?.value || "0",
    );

    const result = new Date(date);
    result.setHours(hour, minute, second);
    return result;
  } catch {
    return date;
  }
}

export function getGreeting(config: GreetingConfig): string {
  const { name, language = "en", timezone, now = new Date() } = config;
  const date = timezone ? getDateInTimezone(now, timezone) : now;
  const timeOfDay = getTimeOfDay(date);
  const greeting = greetings[timeOfDay][language] || greetings[timeOfDay].en;

  return `${greeting}, ${name}`;
}

export function getUserLanguage(): Language {
  if (typeof window === "undefined") return "en";

  const stored = sessionStorage.getItem("greetingLang") as Language | null;
  if (stored && supportedLanguages.includes(stored)) return stored;

  const picked =
    supportedLanguages[Math.floor(Math.random() * supportedLanguages.length)];
  sessionStorage.setItem("greetingLang", picked);
  return picked;
}

export function setUserLanguage(language: Language): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("greetingLang", language);
}

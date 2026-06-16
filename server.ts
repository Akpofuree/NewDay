import { createServer } from "http";
import { Server } from "socket.io";

import { createApp } from "./src/server/app";
import { config } from "./src/server/config";
import { cookieName, getAuthUserFromToken, type AuthUser } from "./src/server/middleware/auth";
import { query } from "./src/server/db";

const localhostOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

type AuthedSocketData = {
  user: AuthUser;
};

function readCookie(header: string | undefined, name: string) {
  if (!header) return undefined;
  return header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function checkDueDates(io: Server) {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Update overdue tasks
    const overdueResult = await query(
      `UPDATE tasks
       SET status = 'overdue', updated_at = NOW()
       WHERE due_date < $1
         AND status NOT IN ('completed', 'overdue')
       RETURNING id, title, user_id`,
      [now]
    );

    if (overdueResult.rowCount > 0) {
      console.log(`Updated ${overdueResult.rowCount} tasks to overdue status`);
      // Emit tasks_updated event for each affected user
      const userIds = new Set(overdueResult.rows.map((row: any) => row.user_id));
      userIds.forEach((userId) => {
        io.emit("tasks_updated", { userId });
      });
    }

    // Log warnings for tasks due within 24 hours
    const warningResult = await query(
      `SELECT id, title, user_id, due_date
       FROM tasks
       WHERE due_date BETWEEN $1 AND $2
         AND status != 'completed'`,
      [now, in24Hours]
    );

    if (warningResult.rowCount > 0) {
      console.warn(
        `${warningResult.rowCount} tasks due within 24 hours:`,
        warningResult.rows.map((row: any) => `${row.title} (due: ${row.due_date})`)
      );
    }
  } catch (error) {
    console.error("Error checking due dates:", error);
  }
}

async function startServer() {
  const app = await createApp({ serveFrontend: false });
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          localhostOriginPattern.test(origin) ||
          config.allowedOrigins.includes(origin)
        ) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin not allowed by CORS"));
      },
      credentials: true,
    },
    // Add these optimizations for Render free tier
    pingTimeout: 60000, // 60 seconds (Render free tier sleeps after 15 min inactivity)
    pingInterval: 25000, // 25 seconds
    transports: ["websocket", "polling"], // Fallback to polling if WebSocket fails
    maxHttpBufferSize: 1e6, // 1MB
  });

  io.use(async (socket, next) => {
    try {
      const token = decodeURIComponent(
        readCookie(socket.handshake.headers.cookie, cookieName) || ""
      );
      const user = await getAuthUserFromToken(token);
      if (!user) {
        next(new Error("Authentication required."));
        return;
      }
      (socket.data as AuthedSocketData).user = user;
      await query("UPDATE users SET last_seen_at = NOW() WHERE id = $1", [user.id]);
      next();
    } catch {
      next(new Error("Invalid session."));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket.data as AuthedSocketData).user;
    console.log("User connected:", user.id, socket.id);
    io.emit("presence_update", {
      userId: user.id,
      status: "online",
      lastSeenAt: new Date().toISOString(),
    });

    socket.on("join_channel", (channelId: string) => {
      socket.join(channelId);
      query(
        `INSERT INTO channel_members (channel_id, user_id, last_read_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (channel_id, user_id) DO UPDATE SET last_read_at = NOW()`,
        [channelId, user.id]
      ).catch((error) => console.error("Failed to mark channel joined:", error));
      console.log(`${socket.id} joined channel ${channelId}`);
    });

    socket.on("leave_channel", (channelId: string) => {
      socket.leave(channelId);
      console.log(`${socket.id} left channel ${channelId}`);
    });

    socket.on("send_message", (messageData) => {
      const sanitizedMessage = {
        ...messageData,
        senderId: user.id,
        userName: user.name,
      };
      console.log("Message received:", sanitizedMessage.id);
      io.to(sanitizedMessage.channelId).emit("receive_message", sanitizedMessage);
    });

    socket.on("user_typing", ({ channelId }) => {
      if (!channelId) return;
      socket.to(channelId).emit("user_typing", {
        channelId,
        userId: user.id,
        userName: user.name,
      });
    });

    socket.on("user_stop_typing", ({ channelId }) => {
      if (!channelId) return;
      socket.to(channelId).emit("user_stop_typing", {
        channelId,
        userId: user.id,
        userName: user.name,
      });
    });

    socket.on("disconnect", () => {
      const lastSeenAt = new Date().toISOString();
      query("UPDATE users SET last_seen_at = NOW() WHERE id = $1", [user.id]).catch((error) =>
        console.error("Failed to update last seen:", error)
      );
      io.emit("presence_update", {
        userId: user.id,
        status: "offline",
        lastSeenAt,
      });
      console.log("User disconnected:", user.id, socket.id);
    });
  });

  const port = config.port || 4000;
  httpServer.listen(port, () => {
    const address = httpServer.address();
    const actualPort = typeof address === "object" && address !== null ? address.port : port;

    console.log(`Server running on port ${actualPort}`);
  });

  // Run due date check on startup and every 60 minutes
  await checkDueDates(io);
  setInterval(() => checkDueDates(io), 60 * 60 * 1000); // 60 minutes
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

import Echo from "laravel-echo";
import Pusher from "pusher-js";

(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

const echo = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
  wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "https") === "https",
  enabledTransports: ["ws", "wss"],
});

echo.connector.pusher.connection.bind("error", (err: unknown) => {
  console.warn("[Echo] WebSocket error:", err);
});

export default echo;

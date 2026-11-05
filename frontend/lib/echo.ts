import Echo from "laravel-echo";
import Pusher from "pusher-js";

export function createEcho() {
  const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
  const host = process.env.NEXT_PUBLIC_REVERB_HOST;

  const port = Number(
    process.env.NEXT_PUBLIC_REVERB_PORT ?? "8080"
  );

  const scheme =
    process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http";

  // Validate configuration
  if (
    !key ||
    !host ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    console.error("[Echo] Invalid Reverb configuration.");
    return null;
  }

  // Laravel Reverb uses the Pusher protocol
  Object.assign(window, { Pusher });

  const echo = new Echo({
    broadcaster: "reverb",

    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,

    forceTLS: scheme === "https",
    enabledTransports: ["ws", "wss"],

    // Private channel authorization
    channelAuthorization: {
      customHandler: async (
        { socketId, channelName },
        callback
      ) => {
        console.log(
          "[Echo] Authorizing channel:",
          channelName
        );

        try {
          const response = await fetch(
            "/api/broadcasting/auth",
            {
              method: "POST",
              credentials: "same-origin",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channelName,
              }),
            }
          );

          console.log(
            "[Echo] Authorization status:",
            response.status
          );

          if (!response.ok) {
            throw new Error(
              `Channel authorization failed: ${response.status}`
            );
          }

          const data: { auth: string } =
            await response.json();

          // Authorization successful
          callback(null, data);
        } catch (error: unknown) {
          console.error(
            "[Echo] Authorization error:",
            error
          );

          callback(
            error instanceof Error
              ? error
              : new Error("Authorization failed"),
            null
          );
        }
      },
    },
  });

  console.log("[Echo] Instance initialized.");

  return echo;
}

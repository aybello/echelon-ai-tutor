export interface ClosableDatabaseConnection {
  end(): Promise<void>;
  destroy(): void;
}

/**
 * Close a CLI database connection without leaving the process alive forever.
 * The socket is released after a graceful close too, because some remote MySQL
 * connections resolve end() before their handle has fully left the Node event
 * loop. This deliberately avoids an unsafe process.exit() while a write may
 * still be in flight.
 */
export async function closeDatabaseConnection(
  connection: ClosableDatabaseConnection,
  timeoutMs = 5_000,
): Promise<"closed" | "forced"> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      connection.end().then(() => "closed" as const),
      new Promise<"forced">(resolve => {
        timeout = setTimeout(() => resolve("forced"), timeoutMs);
      }),
    ]);
    connection.destroy();
    return result;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

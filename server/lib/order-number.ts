/**
 * Atomic Order Number Generator.
 *
 * Format: NOV-YYYYMMDD-NNNN (e.g., NOV-20260218-0042)
 *
 * Uses a single atomic raw SQL upsert to handle both the day-change
 * reset and counter increment in one operation. No read-then-write race.
 */
import { logger } from "./logger";

export async function generateOrderNumber(
  tx: { $queryRawUnsafe: <T>(query: string, ...values: unknown[]) => Promise<T> }
): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

  // Atomic upsert: if date matches, increment counter; if date changed, reset to 1.
  // Single SQL statement — no race condition possible.
  const result = await tx.$queryRawUnsafe<Array<{ counter: number }>>(
    `INSERT INTO "order_sequences" (id, date, counter)
     VALUES ('singleton', $1, 1)
     ON CONFLICT (id) DO UPDATE SET
       counter = CASE
         WHEN "order_sequences".date = $1 THEN "order_sequences".counter + 1
         ELSE 1
       END,
       date = $1
     RETURNING counter`,
    dateStr
  );

  const counter = result[0]?.counter ?? 1;
  const paddedCounter = String(counter).padStart(4, "0");
  const orderNumber = `NOV-${dateStr}-${paddedCounter}`;

  logger.debug("Order number generated", { orderNumber });
  return orderNumber;
}

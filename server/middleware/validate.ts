import { z } from "zod";
import { ValidationError } from "@/server/lib/errors";

/**
 * Validate a request body against a Zod schema.
 * Returns the parsed & typed data, or throws ValidationError.
 */
export async function validateBody<T extends z.ZodSchema>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ValidationError({ body: ["Invalid JSON payload"] });
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "_root";
      if (!errors[path]) errors[path] = [];
      errors[path].push(issue.message);
    }
    throw new ValidationError(errors);
  }

  return result.data;
}

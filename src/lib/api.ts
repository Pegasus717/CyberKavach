import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  // Normalize error message if it's a raw Postgres/Supabase error
  let humanMessage = message;
  let hint = extra?.hint as string | undefined;

  if (message.includes("Could not find the table")) {
    humanMessage = "Database setup is incomplete.";
    hint = "Please run supabase/schema.sql in your Supabase SQL editor.";
  }

  return NextResponse.json({ 
    error: humanMessage, 
    code: status,
    hint,
    ...extra 
  }, { status });
}

export function fromZod(error: ZodError) {
  return jsonError(error.issues[0]?.message || "Invalid input.", 400);
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

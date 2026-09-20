import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
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

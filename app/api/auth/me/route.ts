import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const username = cookieStore.get("username")?.value || null;

  if (!username) {
    return NextResponse.json({ username: null, avatarUrl: null });
  }

  const { rows } = await sql`SELECT avatar_url FROM users WHERE username = ${username}`;

  return NextResponse.json({
    username,
    avatarUrl: rows[0]?.avatar_url || null,
  });
}
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const recipient = cookieStore.get("username")?.value;

  if (!recipient) {
    return NextResponse.json([]);
  }

  const { rows } = await sql`
    SELECT * FROM notifications
    WHERE recipient = ${recipient}
    ORDER BY created_at DESC
    LIMIT 20
  `;

  return NextResponse.json(rows);
}

export async function PATCH() {
  const cookieStore = await cookies();
  const recipient = cookieStore.get("username")?.value;

  await sql`
    UPDATE notifications SET is_read = TRUE WHERE recipient = ${recipient}
  `;

  return NextResponse.json({ success: true });
}
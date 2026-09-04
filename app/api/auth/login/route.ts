import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  const { rows } = await sql`SELECT * FROM users WHERE username = ${username}`;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, rows[0].password_hash);

  if (!valid) {
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, username });
  response.cookies.set("username", username, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // неделя
  });

  return response;
}
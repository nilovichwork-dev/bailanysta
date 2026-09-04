import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Укажите имя пользователя и пароль" },
      { status: 400 }
    );
  }

  const existing = await sql`SELECT username FROM users WHERE username = ${username}`;
  if (existing.rows.length > 0) {
    return NextResponse.json(
      { error: "Пользователь с таким именем уже существует" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await sql`
    INSERT INTO users (username, password_hash)
    VALUES (${username}, ${passwordHash})
  `;

  return NextResponse.json({ success: true, username });
}
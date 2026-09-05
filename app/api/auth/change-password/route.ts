import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const username = cookieStore.get("username")?.value;

  if (!username) {
    return NextResponse.json({ error: "Нужно войти в аккаунт" }, { status: 401 });
  }

  const body = await request.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Заполните оба поля пароля" },
      { status: 400 }
    );
  }

  const { rows } = await sql`SELECT * FROM users WHERE username = ${username}`;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);

  if (!valid) {
    return NextResponse.json({ error: "Текущий пароль неверен" }, { status: 401 });
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await sql`
    UPDATE users SET password_hash = ${newHash} WHERE username = ${username}
  `;

  return NextResponse.json({ success: true });
}
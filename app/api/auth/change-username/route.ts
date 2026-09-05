import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const currentUsername = cookieStore.get("username")?.value;

  if (!currentUsername) {
    return NextResponse.json({ error: "Нужно войти в аккаунт" }, { status: 401 });
  }

  const body = await request.json();
  const newUsername = body.newUsername?.trim();

  if (!newUsername) {
    return NextResponse.json({ error: "Укажите новое имя" }, { status: 400 });
  }

  const existing = await sql`SELECT username FROM users WHERE username = ${newUsername}`;
  if (existing.rows.length > 0) {
    return NextResponse.json(
      { error: "Это имя уже занято" },
      { status: 400 }
    );
  }

  // Переносим все связанные данные на новое имя
  await sql`UPDATE users SET username = ${newUsername} WHERE username = ${currentUsername}`;
  await sql`UPDATE posts SET author = ${newUsername} WHERE author = ${currentUsername}`;
  await sql`UPDATE comments SET author = ${newUsername} WHERE author = ${currentUsername}`;
  await sql`UPDATE post_likes SET username = ${newUsername} WHERE username = ${currentUsername}`;
  await sql`UPDATE follows SET follower = ${newUsername} WHERE follower = ${currentUsername}`;
  await sql`UPDATE follows SET followed = ${newUsername} WHERE followed = ${currentUsername}`;
  await sql`UPDATE notifications SET recipient = ${newUsername} WHERE recipient = ${currentUsername}`;

  const response = NextResponse.json({ success: true, username: newUsername });
  response.cookies.set("username", newUsername, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
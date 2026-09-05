import { sql } from "@vercel/postgres";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const username = cookieStore.get("username")?.value;

  if (!username) {
    return NextResponse.json({ error: "Нужно войти в аккаунт" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  }

  const blob = await put(`avatars/${username}-${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  await sql`
    UPDATE users SET avatar_url = ${blob.url} WHERE username = ${username}
  `;

  return NextResponse.json({ url: blob.url });
}
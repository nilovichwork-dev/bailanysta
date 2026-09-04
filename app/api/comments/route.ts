import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  const { rows } = await sql`
    SELECT * FROM comments WHERE post_id = ${postId} ORDER BY created_at ASC
  `;

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const author = cookieStore.get("username")?.value;

  if (!author) {
    return NextResponse.json({ error: "Нужно войти в аккаунт" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.text || !body.text.trim()) {
    return NextResponse.json(
      { error: "Комментарий не может быть пустым" },
      { status: 400 }
    );
  }

  const id = Date.now();

  const { rows } = await sql`
    INSERT INTO comments (id, post_id, author, text)
    VALUES (${id}, ${body.postId}, ${author}, ${body.text})
    RETURNING *
  `;

  if (body.postAuthor && body.postAuthor !== author) {
    await sql`
      INSERT INTO notifications (id, recipient, message)
      VALUES (${Date.now() + 1}, ${body.postAuthor}, ${author + " прокомментировал(а) ваш пост"})
    `;
  }

  return NextResponse.json(rows[0], { status: 201 });
}
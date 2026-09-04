import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  const { rows } = await sql`SELECT * FROM posts ORDER BY id DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.text || !body.text.trim()) {
    return NextResponse.json(
      { error: "Текст поста не может быть пустым" },
      { status: 400 }
    );
  }

  const id = Date.now();
  const author = "Ты";

  const { rows } = await sql`
    INSERT INTO posts (id, author, text, likes)
    VALUES (${id}, ${author}, ${body.text}, 0)
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();

  const { rows } = await sql`
    UPDATE posts
    SET likes = likes + 1
    WHERE id = ${body.id}
    RETURNING *
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const { rows } = await sql`
    SELECT posts.*, COUNT(comments.id)::int AS comment_count
    FROM posts
    LEFT JOIN comments ON comments.post_id = posts.id
    GROUP BY posts.id
    ORDER BY posts.id DESC
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
      { error: "Текст поста не может быть пустым" },
      { status: 400 }
    );
  }

  const id = Date.now();

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

  const post = rows[0];

  const cookieStore = await cookies();
  const liker = cookieStore.get("username")?.value || "Гость";

  if (post.author !== liker) {
    await sql`
      INSERT INTO notifications (id, recipient, message)
      VALUES (${Date.now()}, ${post.author}, ${liker + " поставил(а) лайк вашему посту"})
    `;
  }

  return NextResponse.json(post);
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const currentUser = cookieStore.get("username")?.value;

  const body = await request.json();

  if (!body.text || !body.text.trim()) {
    return NextResponse.json(
      { error: "Текст поста не может быть пустым" },
      { status: 400 }
    );
  }

  const { rows } = await sql`
    UPDATE posts
    SET text = ${body.text}
    WHERE id = ${body.id} AND author = ${currentUser}
    RETURNING *
  `;

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Пост не найден или у вас нет прав на его редактирование" },
      { status: 404 }
    );
  }

  return NextResponse.json(rows[0]);
}
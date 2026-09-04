import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const follower = cookieStore.get("username")?.value;

  if (!follower) {
    return NextResponse.json([]);
  }

  const { rows } = await sql`
    SELECT followed FROM follows WHERE follower = ${follower}
  `;

  return NextResponse.json(rows.map((r) => r.followed));
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const follower = cookieStore.get("username")?.value;

  if (!follower) {
    return NextResponse.json({ error: "Нужно войти в аккаунт" }, { status: 401 });
  }

  const body = await request.json();
  const followed = body.followed;

  if (!followed) {
    return NextResponse.json({ error: "Не указан автор" }, { status: 400 });
  }

  await sql`
    INSERT INTO follows (follower, followed)
    VALUES (${follower}, ${followed})
    ON CONFLICT DO NOTHING
  `;

  await sql`
    INSERT INTO notifications (id, recipient, message)
    VALUES (${Date.now()}, ${followed}, ${follower + " подписался(-ась) на вас"})
  `;

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const follower = cookieStore.get("username")?.value;

  const body = await request.json();
  const followed = body.followed;

  await sql`
    DELETE FROM follows WHERE follower = ${follower} AND followed = ${followed}
  `;

  return NextResponse.json({ success: true });
}
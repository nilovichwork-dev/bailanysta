import { NextResponse } from "next/server";

type Post = {
  id: number;
  author: string;
  text: string;
};

// Временное хранилище постов в памяти сервера
let posts: Post[] = [
  { id: 1, author: "Автор поста", text: "Текст примера поста" },
];

export async function GET() {
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.text || !body.text.trim()) {
    return NextResponse.json(
      { error: "Текст поста не может быть пустым" },
      { status: 400 }
    );
  }

  const newPost: Post = {
    id: Date.now(),
    author: "Ты",
    text: body.text,
  };

  posts = [newPost, ...posts];
  return NextResponse.json(newPost, { status: 201 });
}
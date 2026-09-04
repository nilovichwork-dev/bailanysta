import { NextResponse } from "next/server";

type Post = {
  id: number;
  author: string;
  text: string;
  likes: number;
};

let posts: Post[] = [
  { id: 1, author: "Автор поста", text: "Текст примера поста", likes: 0 },
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
    likes: 0,
  };

  posts = [newPost, ...posts];
  return NextResponse.json(newPost, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const post = posts.find((p) => p.id === body.id);

  if (!post) {
    return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
  }

  post.likes += 1;
  return NextResponse.json(post);
}
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

type Post = {
  id: number;
  author: string;
  text: string;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  // Загружаем посты с сервера при открытии страницы
  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      });
  }, []);

  async function handlePublish() {
    if (!text.trim()) return;

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const newPost = await res.json();
    setPosts([newPost, ...posts]);
    setText("");
  }

  return (
    <main className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Bailanysta</h1>
<Link href="/profile" className="text-blue-500 underline block mb-4">
  Профиль →
</Link>
      <div className="border rounded-lg p-4 mb-6">
        <textarea
          className="w-full border rounded p-2 mb-2"
          placeholder="Что нового?"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={handlePublish}
        >
          Опубликовать
        </button>
      </div>

      <div className="space-y-4">
        {loading && <p>Загрузка...</p>}
        {posts.map((post) => (
          <div key={post.id} className="border rounded-lg p-4">
            <p className="font-semibold">{post.author}</p>
            <p>{post.text}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
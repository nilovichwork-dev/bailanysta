"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Post = {
  id: number;
  author: string;
  text: string;
  likes: number;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

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

  async function handleLike(id: number) {
    const res = await fetch("/api/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      const freshData = await fetch("/api/posts").then((r) => r.json());
      setPosts(freshData);
      return;
    }

    const updatedPost = await res.json();
    setPosts(posts.map((p) => (p.id === id ? updatedPost : p)));
  }

  const filteredPosts = posts.filter((post) =>
    post.text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="max-w-xl mx-auto py-10 px-4 dark:bg-gray-900 dark:text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Bailanysta</h1>

      <button
        onClick={() => setDarkMode(!darkMode)}
        className="mb-4 border rounded px-3 py-1 text-sm dark:border-gray-600"
      >
        {darkMode ? "☀️ Светлая тема" : "🌙 Тёмная тема"}
      </button>

      <Link href="/profile" className="text-blue-500 underline block mb-4">
        Профиль →
      </Link>

      <div className="border rounded-lg p-4 mb-6 dark:border-gray-600">
        <textarea
          className="w-full border rounded p-2 mb-2 dark:bg-gray-800 dark:border-gray-600"
          placeholder="Что нового?"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className="bg-black text-white px-4 py-2 rounded dark:bg-white dark:text-black"
          onClick={handlePublish}
        >
          Опубликовать
        </button>
      </div>

      <input
        type="text"
        placeholder="Поиск по постам..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded p-2 mb-4 dark:bg-gray-800 dark:border-gray-600"
      />

      <div className="space-y-4">
        {loading && (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border rounded-lg p-4 dark:border-gray-600 animate-pulse"
              >
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-3"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            ))}
          </>
        )}
        {filteredPosts.map((post) => (
          <div key={post.id} className="border rounded-lg p-4 dark:border-gray-600">
            <p className="font-semibold">{post.author}</p>
            <p className="mb-2">{post.text}</p>
            <button
              onClick={() => handleLike(post.id)}
              className="text-sm flex items-center gap-1"
            >
              ❤️ {post.likes}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Post = {
  id: number;
  author: string;
  text: string;
  likes: number;
  comment_count: number;
  liked_by_me: boolean;
};

type Comment = {
  id: number;
  post_id: number;
  author: string;
  text: string;
};

type Notification = {
  id: number;
  message: string;
  is_read: boolean;
};

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [following, setFollowing] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [openComments, setOpenComments] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.username) {
          router.push("/login");
        } else {
          setCurrentUser(data.username);
        }
        setCheckingAuth(false);
      });
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;

    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      });

    fetch("/api/follows")
      .then((res) => res.json())
      .then((data) => setFollowing(data));

    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setNotifications(data));
  }, [currentUser]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function handlePublish() {
    if (!text.trim()) return;

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const newPost = await res.json();
    setPosts([{ ...newPost, comment_count: 0, liked_by_me: false }, ...posts]);
    setText("");
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: text }),
      });
      const data = await res.json();
      if (data.text) {
        setText(data.text);
      }
    } finally {
      setGenerating(false);
    }
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
    setPosts(
      posts.map((p) =>
        p.id === id
          ? { ...updatedPost, comment_count: p.comment_count, liked_by_me: !p.liked_by_me }
          : p
      )
    );
  }

  async function handleDelete(id: number) {
    if (!confirm("Удалить этот пост?")) return;

    await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
    setPosts(posts.filter((p) => p.id !== id));
  }

  function startEdit(post: Post) {
    setEditingId(post.id);
    setEditText(post.text);
  }

  async function saveEdit(id: number) {
    if (!editText.trim()) return;

    const res = await fetch("/api/posts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, text: editText }),
    });

    const updatedPost = await res.json();
    setPosts(
      posts.map((p) =>
        p.id === id
          ? { ...updatedPost, comment_count: p.comment_count, liked_by_me: p.liked_by_me }
          : p
      )
    );
    setEditingId(null);
  }

  async function toggleFollow(author: string) {
    if (following.includes(author)) {
      await fetch("/api/follows", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followed: author }),
      });
      setFollowing(following.filter((f) => f !== author));
    } else {
      await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followed: author }),
      });
      setFollowing([...following, author]);
    }
  }

  async function openNotifications() {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    }
  }

  async function toggleComments(postId: number) {
    if (openComments === postId) {
      setOpenComments(null);
      return;
    }
    setOpenComments(postId);
    if (!comments[postId]) {
      const res = await fetch(`/api/comments?postId=${postId}`);
      const data = await res.json();
      setComments({ ...comments, [postId]: data });
    }
  }

  async function handleAddComment(post: Post) {
    if (!commentText.trim()) return;

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: post.id,
        text: commentText,
        postAuthor: post.author,
      }),
    });

    const newComment = await res.json();
    setComments({
      ...comments,
      [post.id]: [...(comments[post.id] || []), newComment],
    });
    setPosts(
      posts.map((p) =>
        p.id === post.id ? { ...p, comment_count: p.comment_count + 1 } : p
      )
    );
    setCommentText("");
  }

  if (checkingAuth) {
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredPosts = posts.filter((post) =>
    post.text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="max-w-xl mx-auto py-10 px-4 dark:bg-gray-900 dark:text-white min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Bailanysta</h1>

        <div className="relative">
          <button
            onClick={openNotifications}
            className="border rounded px-3 py-1 text-sm dark:border-gray-600"
          >
            🔔 {unreadCount > 0 && `(${unreadCount})`}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-64 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 shadow-lg p-3 z-10">
              {notifications.length === 0 && (
                <p className="text-sm text-gray-500">Нет уведомлений</p>
              )}
              {notifications.map((n) => (
                <p key={n.id} className="text-sm mb-2">
                  {n.message}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 text-sm">
        <span>
          Привет, <b>{currentUser}</b>!
        </span>
        <button onClick={handleLogout} className="text-blue-500 underline">
          Выйти
        </button>
      </div>

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
          placeholder="Что нового? (или тема для AI)"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            className="bg-black text-white px-4 py-2 rounded dark:bg-white dark:text-black"
            onClick={handlePublish}
          >
            Опубликовать
          </button>
          <button
            className="border px-4 py-2 rounded dark:border-gray-600"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? "Генерирую..." : "✨ Сгенерировать AI"}
          </button>
        </div>
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
            <div className="flex justify-between items-center">
              <p className="font-semibold">{post.author}</p>
              {post.author !== currentUser && (
                <button
                  onClick={() => toggleFollow(post.author)}
                  className="text-xs border rounded px-2 py-1 dark:border-gray-600"
                >
                  {following.includes(post.author) ? "Отписаться" : "Подписаться"}
                </button>
              )}
            </div>

            {editingId === post.id ? (
              <div className="mt-2">
                <textarea
                  className="w-full border rounded p-2 mb-2 dark:bg-gray-800 dark:border-gray-600"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={2}
                />
                <button
                  onClick={() => saveEdit(post.id)}
                  className="bg-black text-white px-3 py-1 rounded text-sm mr-2 dark:bg-white dark:text-black"
                >
                  Сохранить
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="border px-3 py-1 rounded text-sm dark:border-gray-600"
                >
                  Отмена
                </button>
              </div>
            ) : (
              <>
                <p className="mb-2">{post.text}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="text-sm flex items-center gap-1"
                  >
                    {post.liked_by_me ? "❤️" : "🤍"} {post.likes}
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="text-sm flex items-center gap-1"
                  >
                    💬 {post.comment_count} {openComments === post.id ? "(Скрыть)" : ""}
                  </button>
                  {post.author === currentUser && (
                    <>
                      <button
                        onClick={() => startEdit(post)}
                        className="text-sm text-blue-500 underline"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-sm text-red-500 underline"
                      >
                        Удалить
                      </button>
                    </>
                  )}
                </div>

                {openComments === post.id && (
                  <div className="mt-3 border-t pt-3 dark:border-gray-600">
                    {(comments[post.id] || []).map((c) => (
                      <div key={c.id} className="mb-2 text-sm">
                        <span className="font-semibold">{c.author}: </span>
                        {c.text}
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Написать комментарий..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 border rounded p-1 text-sm dark:bg-gray-800 dark:border-gray-600"
                      />
                      <button
                        onClick={() => handleAddComment(post)}
                        className="bg-black text-white px-3 py-1 rounded text-sm dark:bg-white dark:text-black"
                      >
                        Отправить
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
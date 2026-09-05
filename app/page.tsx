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
  image_url: string | null;
  avatar_url: string | null;
};

type Comment = {
  id: number;
  post_id: number;
  author: string;
  text: string;
  avatar_url: string | null;
};

type Notification = {
  id: number;
  message: string;
  is_read: boolean;
};

const AVATAR_COLORS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-fuchsia-500",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({
  name,
  avatarUrl,
  size = "w-9 h-9 text-sm",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: string;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${size} rounded-full object-cover shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full ${avatarColor(name)} flex items-center justify-center text-white font-semibold shrink-0`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.username) {
          router.push("/login");
        } else {
          setCurrentUser(data.username);
          setCurrentAvatarUrl(data.avatarUrl);
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

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  function removeImage() {
    setSelectedImage(null);
    setImagePreview(null);
  }

  async function handlePublish() {
    if (!text.trim()) return;

    let imageUrl = null;

    if (selectedImage) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedImage);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      imageUrl = uploadData.url;
      setUploading(false);
    }

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, imageUrl }),
    });

    const newPost = await res.json();
    setPosts([
      { ...newPost, comment_count: 0, liked_by_me: false, avatar_url: currentAvatarUrl },
      ...posts,
    ]);
    setText("");
    removeImage();
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
          ? {
              ...updatedPost,
              comment_count: p.comment_count,
              liked_by_me: !p.liked_by_me,
              avatar_url: p.avatar_url,
            }
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
          ? {
              ...updatedPost,
              comment_count: p.comment_count,
              liked_by_me: p.liked_by_me,
              avatar_url: p.avatar_url,
            }
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
      [post.id]: [
        ...(comments[post.id] || []),
        { ...newComment, avatar_url: currentAvatarUrl },
      ],
    });
    setPosts(
      posts.map((p) =>
        p.id === post.id ? { ...p, comment_count: p.comment_count + 1 } : p
      )
    );
    setCommentText("");
  }

  async function handleDeleteComment(postId: number, commentId: number) {
    await fetch(`/api/comments?id=${commentId}`, { method: "DELETE" });
    setComments({
      ...comments,
      [postId]: (comments[postId] || []).filter((c) => c.id !== commentId),
    });
    setPosts(
      posts.map((p) =>
        p.id === postId ? { ...p, comment_count: p.comment_count - 1 } : p
      )
    );
  }

  if (checkingAuth) {
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredPosts = posts.filter((post) =>
    post.text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F3EEFC] dark:bg-[#150F26] dark:text-white">
      <div className="max-w-xl mx-auto px-4">
        <header className="sticky top-0 z-20 -mx-4 px-4 py-3 mb-6 backdrop-blur-md bg-[#F3EEFC]/80 dark:bg-[#150F26]/80 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
          <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-[#FF5DA2] to-[#FFB238] bg-clip-text text-transparent">
            Bailanysta
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-10 h-10 rounded-full border border-black/10 dark:border-white/15 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title={darkMode ? "Светлая тема" : "Тёмная тема"}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <div className="relative">
              <button
                onClick={openNotifications}
                className="relative w-10 h-10 rounded-full border border-black/10 dark:border-white/15 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-[#FF5DA2] to-[#FFB238] text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-black/5 dark:border-white/10 bg-[#FCFAFF] dark:bg-[#1E1834] shadow-lg p-3 z-10">
                  {notifications.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 px-1 py-2">
                      Нет уведомлений
                    </p>
                  )}
                  {notifications.map((n) => (
                    <p
                      key={n.id}
                      className="text-sm mb-1.5 last:mb-0 text-gray-900 dark:text-white px-1"
                    >
                      {n.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Avatar name={currentUser || "?"} avatarUrl={currentAvatarUrl} />
            <div>
              <p className="font-semibold text-sm leading-tight text-gray-900 dark:text-white">
                {currentUser}
              </p>
              <Link
                href="/profile"
                className="text-xs text-[#FF5DA2] hover:underline"
              >
                Профиль
              </Link>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Выйти
          </button>
        </div>

        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-[#FCFAFF] dark:bg-[#1E1834] p-4 mb-6">
          <textarea
            className="w-full resize-none bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 mb-3 text-[15px] text-gray-900 dark:text-white"
            placeholder="Что нового? (или тема для AI)"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {imagePreview && (
            <div className="relative mb-3 inline-block">
              <img src={imagePreview} alt="preview" className="max-h-40 rounded-xl" />
              <button
                onClick={removeImage}
                className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex gap-2 items-center flex-wrap">
            <button
              className="rounded-full px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#FF5DA2] to-[#FFB238] hover:opacity-90 transition-opacity disabled:opacity-50"
              onClick={handlePublish}
              disabled={uploading}
            >
              {uploading ? "Загрузка..." : "Опубликовать"}
            </button>
            <button
              className="rounded-full px-4 py-2 text-sm font-medium border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-gray-900 dark:text-white"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? "Генерирую..." : "✨ AI"}
            </button>
            <label className="rounded-full px-4 py-2 text-sm font-medium border border-black/10 dark:border-white/15 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-gray-900 dark:text-white">
              📷 Фото
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <input
          type="text"
          placeholder="Поиск по постам..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-black/10 dark:border-white/15 bg-[#FCFAFF] dark:bg-[#1E1834] px-4 py-2.5 mb-5 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm text-gray-900 dark:text-white"
        />

        <div className="space-y-4 pb-16">
          {loading && (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-black/5 dark:border-white/10 bg-[#FCFAFF] dark:bg-[#1E1834] p-4 animate-pulse"
                >
                  <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-1/4 mb-3"></div>
                  <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-1/3"></div>
                </div>
              ))}
            </>
          )}
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="rounded-2xl border border-black/5 dark:border-white/10 bg-[#FCFAFF] dark:bg-[#1E1834] p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={post.author} avatarUrl={post.avatar_url} />
                <p className="font-semibold text-sm text-gray-900 dark:text-white">
                  {post.author}
                </p>
                {post.author !== currentUser && (
                  <button
                    onClick={() => toggleFollow(post.author)}
                    className="ml-auto text-xs font-medium rounded-full border border-black/10 dark:border-white/15 px-3 py-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-gray-900 dark:text-white"
                  >
                    {following.includes(post.author) ? "Отписаться" : "Подписаться"}
                  </button>
                )}
              </div>

              {editingId === post.id ? (
                <div className="mt-2">
                  <textarea
                    className="w-full border border-black/10 dark:border-white/15 rounded-xl p-2 mb-2 bg-transparent text-[15px] text-gray-900 dark:text-white"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                  />
                  <button
                    onClick={() => saveEdit(post.id)}
                    className="rounded-full bg-gradient-to-r from-[#FF5DA2] to-[#FFB238] text-white px-4 py-1.5 text-sm font-semibold mr-2"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-full border border-black/10 dark:border-white/15 px-4 py-1.5 text-sm text-gray-900 dark:text-white"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-3 text-[15px] leading-relaxed text-gray-900 dark:text-white">
                    {post.text}
                  </p>
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt="post"
                      className="max-h-96 rounded-xl mb-3 w-full object-cover"
                    />
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={
                        post.liked_by_me
                          ? "rounded-full px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-[#FF5DA2] to-[#FFB238] flex items-center gap-1"
                          : "rounded-full px-3 py-1.5 text-sm font-medium border border-black/10 dark:border-white/15 flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-gray-900 dark:text-white"
                      }
                    >
                      ❤ {post.likes}
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="rounded-full px-3 py-1.5 text-sm font-medium border border-black/10 dark:border-white/15 flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-gray-900 dark:text-white"
                    >
                      💬 {post.comment_count}
                    </button>
                    {post.author === currentUser && (
                      <>
                        <button
                          onClick={() => startEdit(post)}
                          className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-[#7C5CFC] transition-colors ml-1"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-rose-500 transition-colors"
                        >
                          Удалить
                        </button>
                      </>
                    )}
                  </div>

                  {openComments === post.id && (
                    <div className="mt-4 border-t border-black/5 dark:border-white/10 pt-4">
                      {(comments[post.id] || []).map((c) => (
                        <div key={c.id} className="flex items-start gap-2 mb-3">
                          <Avatar
                            name={c.author}
                            avatarUrl={c.avatar_url}
                            size="w-6 h-6 text-[10px]"
                          />
                          <div className="flex-1 text-sm text-gray-900 dark:text-white">
                            <span className="font-semibold">{c.author}: </span>
                            {c.text}
                          </div>
                          {c.author === currentUser && (
                            <button
                              onClick={() => handleDeleteComment(post.id, c.id)}
                              className="text-gray-400 hover:text-rose-500 text-xs shrink-0"
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          placeholder="Написать комментарий..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="flex-1 rounded-full border border-black/10 dark:border-white/15 bg-transparent px-3 py-1.5 text-sm outline-none text-gray-900 dark:text-white"
                        />
                        <button
                          onClick={() => handleAddComment(post)}
                          className="rounded-full bg-gradient-to-r from-[#FF5DA2] to-[#FFB238] text-white px-4 py-1.5 text-sm font-semibold"
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
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

export default function Profile() {
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [newUsername, setNewUsername] = useState("");
  const [usernameMsg, setUsernameMsg] = useState("");
  const [usernameErr, setUsernameErr] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUsername(data.username);
        setAvatarUrl(data.avatarUrl);
      });
  }, []);

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/auth/change-avatar", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.url) {
      setAvatarUrl(data.url);
    }
    setUploadingAvatar(false);
  }

  async function handleChangeUsername() {
    setUsernameErr("");
    setUsernameMsg("");

    const res = await fetch("/api/auth/change-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newUsername }),
    });
    const data = await res.json();

    if (!res.ok) {
      setUsernameErr(data.error);
      return;
    }

    setUsername(data.username);
    setNewUsername("");
    setUsernameMsg("Имя пользователя изменено");
  }

  async function handleChangePassword() {
    setPasswordErr("");
    setPasswordMsg("");

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();

    if (!res.ok) {
      setPasswordErr(data.error);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setPasswordMsg("Пароль изменён");
  }

  return (
    <div className="min-h-screen bg-[#F3EEFC] dark:bg-[#150F26] dark:text-white">
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-[#FF5DA2] to-[#FFB238] bg-clip-text text-transparent">
            Профиль
          </h1>
          <Link href="/" className="text-sm font-medium text-[#FF5DA2] hover:underline">
            ← Назад к ленте
          </Link>
        </div>

        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-[#FCFAFF] dark:bg-[#1E1834] p-6 mb-6 flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              className="w-16 h-16 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className={`w-16 h-16 rounded-full ${
                username ? avatarColor(username) : "bg-gray-300"
              } flex items-center justify-center text-white text-2xl font-semibold shrink-0`}
            >
              {username ? username.charAt(0).toUpperCase() : "?"}
            </div>
          )}
          <div className="flex-1">
            <p className="font-semibold text-lg text-gray-900 dark:text-white">
              {username || "..."}
            </p>
            <label className="text-sm text-[#FF5DA2] hover:underline cursor-pointer">
              {uploadingAvatar ? "Загрузка..." : "Изменить фото"}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
                disabled={uploadingAvatar}
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-[#FCFAFF] dark:bg-[#1E1834] p-6 mb-6">
          <h2 className="font-semibold mb-3 text-gray-900 dark:text-white">
            Сменить имя пользователя
          </h2>
          <input
            type="text"
            placeholder="Новое имя"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="w-full rounded-full border border-black/10 dark:border-white/15 bg-transparent px-4 py-2 mb-2 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          {usernameErr && <p className="text-rose-500 text-sm mb-2">{usernameErr}</p>}
          {usernameMsg && (
            <p className="text-teal-600 dark:text-teal-400 text-sm mb-2">{usernameMsg}</p>
          )}
          <button
            onClick={handleChangeUsername}
            className="rounded-full bg-gradient-to-r from-[#FF5DA2] to-[#FFB238] text-white px-5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Сохранить
          </button>
        </div>

        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-[#FCFAFF] dark:bg-[#1E1834] p-6">
          <h2 className="font-semibold mb-3 text-gray-900 dark:text-white">
            Сменить пароль
          </h2>
          <input
            type="password"
            placeholder="Текущий пароль"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-full border border-black/10 dark:border-white/15 bg-transparent px-4 py-2 mb-2 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          <input
            type="password"
            placeholder="Новый пароль"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-full border border-black/10 dark:border-white/15 bg-transparent px-4 py-2 mb-2 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          {passwordErr && <p className="text-rose-500 text-sm mb-2">{passwordErr}</p>}
          {passwordMsg && (
            <p className="text-teal-600 dark:text-teal-400 text-sm mb-2">{passwordMsg}</p>
          )}
          <button
            onClick={handleChangePassword}
            className="rounded-full bg-gradient-to-r from-[#FF5DA2] to-[#FFB238] text-white px-5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
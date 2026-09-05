"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit() {
    setError("");

    if (isRegister) {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#F3EEFC] dark:bg-[#150F26] dark:text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-center mb-1 bg-gradient-to-r from-[#FF5DA2] to-[#FFB238] bg-clip-text text-transparent">
          Bailanysta
        </h1>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8">
          {isRegister ? "Создай аккаунт" : "Рады видеть снова"}
        </p>

        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-[#FCFAFF] dark:bg-[#1E1834]
«Заменить p-6">
          <input
            type="text"
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-full border border-black/10 dark:border-white/15 bg-transparent px-4 py-2.5 mb-3 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border border-black/10 dark:border-white/15 bg-transparent px-4 py-2.5 mb-4 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
          />

          {error && (
            <p className="text-rose-500 text-sm mb-4 text-center">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            className="w-full rounded-full bg-gradient-to-r from-[#FF5DA2] to-[#FFB238] text-white py-2.5 text-sm font-semibold mb-4 hover:opacity-90 transition-opacity"
          >
            {isRegister ? "Зарегистрироваться" : "Войти"}
          </button>

          <button
            onClick={() => setIsRegister(!isRegister)}
            className="w-full text-sm text-[#FF5DA2] hover:underline"
          >
            {isRegister ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
          </button>
        </div>
      </div>
    </div>
  );
}
import Link from "next/link";

export default function Profile() {
  return (
    <main className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Профиль</h1>

      <div className="border rounded-lg p-4 mb-6">
        <p className="font-semibold">Ты</p>
        <p className="text-gray-500">Тестовое задание Bailanysta</p>
      </div>

      <Link href="/" className="text-blue-500 underline">
        ← Назад к ленте
      </Link>
    </main>
  );
}
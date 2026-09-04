import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const topic = body.topic || "";

  const prompt = topic
    ? `Напиши короткий пост для соцсети (2-3 предложения, дружелюбный тон) на тему: ${topic}`
    : "Придумай короткий интересный пост для соцсети (2-3 предложения, дружелюбный тон) на случайную тему";

  try {
    const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
  {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return NextResponse.json(
        { error: "Не удалось сгенерировать текст" },
        { status: 500 }
      );
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return NextResponse.json({ text });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Не удалось сгенерировать текст" },
      { status: 500 }
    );
  }
}
"use client";

import {  FormEvent, useState } from "react";
export default function Home() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setAnswer("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Request failed");
      }
      setAnswer(data.answer);
    } catch (error) {
      console.error(error);
      setAnswer("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold">ParcelPilot</h1>
          <p className="mt-2 text-slate-400">
            AI Support Assistant
          </p>
        </header>

        <div className="flex-1">
          {answer && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="whitespace-pre-wrap">{answer}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex gap-3">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask ParcelPilot..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-white px-5 py-3 font-medium text-black disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Send"}
          </button>
        </form>
      </div>
    </main>
  );
}
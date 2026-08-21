import { Ollama } from "ollama";

const ollama = new Ollama({
  host: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
});

export async function generateWithOllama(
  messages: { 
    role: "system" | "user" | "assistant" ,
    content: string 
}[],
) {
  const response = await ollama.chat({
    model: process.env.OLLAMA_CHAT_MODEL ?? "qwen3:8b",
    messages,
    stream: false,
  });
  return response.message.content;
}


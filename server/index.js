import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import { buildIndex, retrieve } from "./rag.js";

const app = express();
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY,
  baseURL: process.env.MOONSHOT_API_URL,
});

await buildIndex();

app.post("/api/chat", async (req, res) => {
  try {
    // Keep only role + content (the API may reject extra fields)
    const messages = req.body.messages.map(({ role, content }) => ({
      role,
      content,
    }));

    // Search using the last two user messages so follow-ups still make sense
    const query = messages
      .filter((m) => m.role === "user")
      .slice(-2)
      .map((m) => m.content)
      .join(" ");

    const chunks = await retrieve(query);
    const context = chunks
      .map((c, i) => `[${i + 1}] (${c.source})\n${c.text}`)
      .join("\n\n");

    const system = `You are the support assistant for Fresh Graduate IT.
    Answer about the current technologies and how they can be applied in the IT industry.
    Keep replies under 3 sentences. Limit technical jargon.
    Display reference on which sites they can apply here in the philippines.

    CONTEXT:
    ${context || "(no relevant documents found)"}`;

    const completion = await client.chat.completions.create({
      model: "kimi-k2.6",
      messages: [{ role: "system", content: system }, ...messages],
    });

    res.json({
      reply: completion.choices[0].message.content,
      sources: [...new Set(chunks.map((c) => c.source))],
    });
  } catch (err) {
    console.error("API error:", err.status, err.message);
    res.status(err.status || 500).json({
      error: err.message || "Something went wrong",
    });
  }
});

app.listen(3001, () => console.log("Server running on http://localhost:3001"));

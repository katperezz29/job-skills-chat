import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY,
  baseURL: process.env.MOONSHOT_API_URL,
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    const completion = await client.chat.completions.create({
      model: "kimi-k2.6",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        ...messages,
      ],
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("API error:", err.status, err.message);
    res.status(err.status || 500).json({
      error: err.message || "Something went wrong",
    });
  }
});

app.listen(3001, () => console.log("Server running on http://localhost:3001"));

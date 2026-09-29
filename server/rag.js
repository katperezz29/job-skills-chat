import fs from "fs";
import path from "path";

const DOCS_DIR = path.resolve("knowledge");
let chunks = []; // [{ text, source, tf, len }]
const df = new Map(); // term -> number of chunks containing it
let avgLen = 0;

const STOP = new Set(
  "a an the and or of to in on at is are was were be do does did i you we it this that for with as by from what how when where who which".split(
    " ",
  ),
);

function tokenize(text) {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(
    (w) => !STOP.has(w),
  );
}

function chunkText(text, size = 800, overlap = 150) {
  const out = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    const piece = text.slice(i, i + size).trim();
    if (piece) out.push(piece);
    if (i + size >= text.length) break;
  }
  return out;
}

export async function buildIndex() {
  chunks = [];
  df.clear();

  const files = fs
    .readdirSync(DOCS_DIR)
    .filter((f) => f.endsWith(".txt") || f.endsWith(".md"));

  for (const file of files) {
    const text = fs.readFileSync(path.join(DOCS_DIR, file), "utf8");
    for (const piece of chunkText(text)) {
      const tokens = tokenize(piece);
      const tf = new Map();
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
      chunks.push({ text: piece, source: file, tf, len: tokens.length });
    }
  }

  avgLen = chunks.reduce((s, c) => s + c.len, 0) / (chunks.length || 1);
  console.log(
    `RAG index ready: ${chunks.length} chunks from ${files.length} files`,
  );
}

export async function retrieve(query, k = 4) {
  const N = chunks.length;
  if (!N) return [];
  const qTerms = [...new Set(tokenize(query))];
  const k1 = 1.5;
  const b = 0.75;

  return chunks
    .map((c) => {
      let score = 0;
      for (const t of qTerms) {
        const f = c.tf.get(t);
        if (!f) continue;
        const n = df.get(t);
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
        score +=
          (idf * f * (k1 + 1)) / (f + k1 * (1 - b + (b * c.len) / avgLen));
      }
      return { ...c, score };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

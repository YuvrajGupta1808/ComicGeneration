// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { generateComic } from "./api/generate.js";
import { generateComicMock } from "./api/generateMock.js";
import { renderAll } from "./render/renderAll.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/generate-comic", async (req, res) => {
  try {
    const { prompt, artStyle } = req.body || {};

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log("📝 Incoming prompt:", prompt);
    console.log("🎨 Art style:", artStyle);

    const useMock = process.env.USE_MOCK_LEONARDO === "true";

    if (useMock) {
      console.log("🧪 MOCK MODE ENABLED — skipping Leonardo + renderAll");

      // Get mock panel images
      const sourceMap = await generateComicMock();

      // Turn panels directly into pages for the frontend
      const pages = Object.entries(sourceMap).map(([id, url], index) => ({
        page: index + 1,
        url,
      }));

      console.log("🧪 Returning mock pages:", pages);

      return res.json({ pages });
    }

    console.log("🤖 REAL MODE — calling Leonardo + renderAll");

    const sourceMap = await generateComic();
    const pages = await renderAll(sourceMap);

    res.json({ pages });
  } catch (err) {
    console.error("❌ /api/generate-comic failed:", err);
    res.status(500).json({ error: "Comic generation failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API server listening on http://localhost:${PORT}`);
});

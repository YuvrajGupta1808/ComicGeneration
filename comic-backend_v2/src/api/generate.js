// src/api/generate.js
import axios from "axios";
import dotenv from "dotenv";
import { LEONARDO } from "../config/leonardo.js";
import { PANELS } from "../data/panels.js";
import { REF_IMAGES } from "../data/references.js";
import { uploadBuffer } from "../utils/cloudinary.js";
import { uploadImage } from "./upload.js";
dotenv.config();

const API_KEY = process.env.LEONARDO_API_KEY;
const HEADERS = {
  accept: "application/json",
  "content-type": "application/json",
  authorization: `Bearer ${API_KEY}`,
};

// =======================
// Generate One Panel
// =======================
export async function generatePanel({
  prompt,
  panelNum,
  seed,
  width,
  height,
  contextImages,
}) {
  const body = {
    prompt,
    modelId: LEONARDO.MODEL_ID,
    styleUUID: LEONARDO.STYLE_UUID,
    width,
    height,
    num_images: 1,
    enhancePrompt: true,
    seed,
    contrastRatio: 0.5,
    ...(contextImages && { contextImages }),
  };

  const res = await axios.post(
    `${LEONARDO.API_URL}/generations`,
    body,
    { headers: HEADERS }
  );
  const genId = res.data.sdGenerationJob.generationId;

  console.log(`🕓 [Panel ${panelNum}] Generating → ${genId}`);
  await new Promise((r) => setTimeout(r, 40000));

  const fetchRes = await axios.get(
    `${LEONARDO.API_URL}/generations/${genId}`,
    { headers: HEADERS }
  );
  const img = fetchRes.data.generations_by_pk.generated_images?.[0];
  if (!img?.url) throw new Error("No image returned for generation.");

  // Ensure outputs directory exists
  // if (!fs.existsSync("outputs"))
  //   fs.mkdirSync("outputs", { recursive: true });

  const imageData = await axios.get(img.url, { responseType: "arraybuffer" });
  const buffer = Buffer.from(imageData.data);
  const uploaded = await uploadBuffer(buffer, `panel_${panelNum}`, "comic/panels");
  console.log(`☁️ Uploaded panel ${panelNum} → ${uploaded.secure_url}`);  // const fileName = `outputs/Panel_${panelNum}.jpg`;
  // fs.writeFileSync(fileName, imgData.data);
  // console.log(`💾 Saved ${fileName}`);

  return { panel: panelNum, id: img.id, url: uploaded.secure_url };
}

// =======================
// Main Comic Generation
// =======================
export async function generateComic() {
  try {
    console.log("📤 Uploading reference images...");
    const Character1Id = await uploadImage(REF_IMAGES.Character1);
    const Character2Id = await uploadImage(REF_IMAGES.Character2);
    const bgId = await uploadImage(REF_IMAGES.background);

    const contextMap = {
      Character1: { type: "UPLOADED", id: Character1Id },
      Character2: { type: "UPLOADED", id: Character2Id },
      background: { type: "UPLOADED", id: bgId },
    };

    const results = [];
    const sourceMap = {};

    for (let i = 0; i < PANELS.length; i++) {
      const panel = PANELS[i];
      let context = [];

      // Build context list based on panel definitions
      if (panel.contextImages?.length) {
        context = panel.contextImages
          .map((key) => {
            if (contextMap[key]) return contextMap[key]; // uploaded refs
            if (/^panel\d+$/.test(key)) {
              const num = Number(key.replace("panel", ""));
              const found = results.find((r) => r.panel === num);
              if (found) return { type: "GENERATED", id: found.id };
            }
            return null;
          })
          .filter(Boolean);
      }

      // Optional continuity fallback (auto use previous panel)
      if (!panel.contextImages?.length && i > 0) {
        const prev = results[i - 1];
        if (prev)
          context = [{ type: "GENERATED", id: prev.id }];
      }

      console.log(
        `🎨 [Panel ${i + 1}] Context:`,
        context.map((c) => `${c.type}:${c.id}`).join(", ") || "none"
      );

      const generated = await generatePanel({
        prompt: panel.prompt,
        width: panel.width,
        height: panel.height,
        panelNum: i + 1,
        seed: 17000 + i * 17,
        contextImages: context,
      });

      results.push({
        panel: generated.panel,
        id: generated.id,
        panelId: `panel${i + 1}`,
        url: generated.url
      });
      contextMap[`panel${i + 1}`] = { type: "GENERATED", id: generated.id };
      sourceMap[`panel${i + 1}`] = generated.url;

      if (i < PANELS.length - 1) {
        console.log("⏳ Waiting before next panel...");
        await new Promise((r) => setTimeout(r, 10000));
      }
    }

    // Save results JSON
    // if (!fs.existsSync("outputs"))
    //   fs.mkdirSync("outputs", { recursive: true });
    // fs.writeFileSync(
    //   "outputs/comic_panels.json",
    //   JSON.stringify(results, null, 2)
    // );
    // console.log("✅ All panels completed and saved to outputs/comic_panels.json");

    console.log("✅ All panels uploaded to Cloudinary!");
    console.table(results.map((r) => ({ panel: r.panel, url: r.url })));

    return sourceMap;
  } catch (err) {
    console.error(
      "🚨 Comic generation failed:",
      err.response?.data || err.message
    );
    throw err;
  }
}
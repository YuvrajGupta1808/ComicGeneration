import { GoogleGenerativeAI } from "@google/generative-ai";
import { DynamicStructuredTool } from "@langchain/core/tools";
import axios from "axios";
import canvas from "canvas";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "yaml";
import { z } from "zod";
import { drawBubbleFromPlacement } from "../utils/simpleTextRenderer.js";

const { createCanvas, loadImage } = canvas;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DialoguePlacementVisionLangChainTool {
  constructor() {
    this.name = "place_dialogue_with_vision";
    this.description =
      "Uses Gemini Vision to analyze comic panel images and determine optimal dialogue bubble positions.";
  }

  loadComicData() {
    try {
      const comicPath = path.join(__dirname, "../../config/comic.yaml");
      if (fs.existsSync(comicPath)) {
        return yaml.parse(fs.readFileSync(comicPath, "utf8"));
      }
    } catch (err) {
      console.warn("⚠️ Failed to load comic.yaml", err.message);
    }
    return { characters: [], panels: [] };
  }

  getTool() {
    return new DynamicStructuredTool({
      name: this.name,
      description: this.description,
      schema: z.object({
        panelId: z.string().optional(),
        sourceMap: z.record(z.string()).optional()
      }),
      func: async ({ panelId, sourceMap }) =>
        await this.execute(panelId, sourceMap)
    });
  }

  async imageUrlToInlineData(url) {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 20000
    });

    return {
      inlineData: {
        mimeType: res.headers["content-type"] || "image/jpeg",
        data: Buffer.from(res.data).toString("base64")
      }
    };
  }

  async execute(panelId = null, sourceMap = null) {
    try {
      const { panels } = this.loadComicData();
      if (!panels.length) {
        return JSON.stringify({
          success: false,
          error: "No panels found in comic.yaml",
          placements: []
        });
      }

      let analyze = panels;
      if (panelId) {
        analyze = analyze.filter((p) => p.id === panelId);
        if (!analyze.length) {
          return JSON.stringify({
            success: false,
            error: `Panel "${panelId}" not found.`,
            placements: []
          });
        }
      }

      analyze = analyze.filter((p) => p.dialogue?.length);
      if (!analyze.length)
        return JSON.stringify({
          success: false,
          error: "No panels with dialogue.",
          placements: []
        });

      // REAL MULTIMODAL GEMINI CLIENT
      const genAI = new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
      );
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash"
      });

      const outputs = [];

      for (const panel of analyze) {
        let url =
          sourceMap?.[panel.id] ||
          panel.imageUrl ||
          panel.cloudinaryUrl;

        if (!url) continue;

        const inlineData = await this.imageUrlToInlineData(url);

        const dialogueList = panel.dialogue
          .map((d, i) => `${i + 1}. ${d.speaker}: "${d.text}"`)
          .join("\n");

        const prompt = `
You are a professional comic book letterer. Analyze this comic panel image and determine the BEST positions for speech bubbles.

Panel ID: ${panel.id}
Panel Size: ${panel.width}x${panel.height}
Description: ${panel.description}

DIALOGUE TO PLACE:
${dialogueList}

CRITICAL RULES:
1. Place bubbles in EMPTY/CLEAR areas - avoid covering faces, important details, or action
2. Position bubbles NEAR the speaker's head/mouth area
3. Follow natural reading order: top-to-bottom, left-to-right
4. Leave adequate spacing between bubbles (minimum 20px)
5. Bubble dimensions should fit the text comfortably (width: 150-300px, height: 80-150px)
6. Tail should point directly at the speaker's mouth/head
7. Analyze the image carefully - identify where characters are positioned

Return ONLY valid JSON (no markdown, no explanation):
{
  "panelId": "${panel.id}",
  "panelWidth": ${panel.width},
  "panelHeight": ${panel.height},
  "placements": [
    {
      "type": "speech",
      "speaker": "character name",
      "text": "exact dialogue text",
      "position": { "x": number, "y": number, "width": number, "height": number },
      "tail": { "x": number, "y": number, "direction": "down|up|left|right" },
      "readingOrder": 1,
      "reasoning": "brief explanation of placement choice"
    }
  ]
}
        `;

        const result = await model.generateContent([
          { text: prompt },
          inlineData
        ]);

        const text = result.response.text();

        let json = null;
        try {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) json = JSON.parse(match[0]);
        } catch (_) {}

        if (json?.placements) outputs.push(json);
      }

      await this.savePlacements(outputs);

      // Render images with text
      const renderedImages = await this.renderDialogueImages(analyze, outputs);

      return JSON.stringify(
        {
          success: true,
          analyzedPanels: outputs.length,
          placements: outputs,
          renderedImages
        },
        null,
        2
      );
    } catch (err) {
      return JSON.stringify({
        success: false,
        error: err.message,
        placements: []
      });
    }
  }

  async savePlacements(list) {
    const comicPath = path.join(__dirname, "../../config/comic.yaml");
    let comic = yaml.parse(fs.readFileSync(comicPath, "utf8"));

    comic.panels = comic.panels.map((p) => {
      const found = list.find((o) => o.panelId === p.id);
      return found
        ? { ...p, dialoguePlacements: found.placements }
        : p;
    });

    await fs.writeFile(comicPath, yaml.stringify(comic, { indent: 2 }));
  }

  /**
   * Render dialogue on images and save to outputs folder
   */
  async renderDialogueImages(panels, placements) {
    const outputDir = path.join(__dirname, "../../outputs");
    await fs.ensureDir(outputDir);

    const results = [];

    for (const panel of panels) {
      try {
        const placement = placements.find(p => p.panelId === panel.id);
        if (!placement) continue;

        // Get image URL
        const imageUrl = panel.imageUrl || panel.cloudinaryUrl;
        if (!imageUrl) continue;

        // Load image
        const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
        const img = await loadImage(Buffer.from(response.data));

        // Create canvas
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext("2d");

        // Draw original image
        ctx.drawImage(img, 0, 0);
                
        // Draw each dialogue bubble
        for (const bubble of placement.placements) {
          drawBubbleFromPlacement(ctx, bubble);
        }

        // Save to outputs folder
        const outputPath = path.join(outputDir, `${panel.id}_with_text.png`);
        const buffer = canvas.toBuffer("image/png");
        await fs.writeFile(outputPath, buffer);

        results.push({
          panelId: panel.id,
          outputPath,
          bubbleCount: placement.placements.length
        });

        console.log(`✓ Rendered ${panel.id} → ${outputPath}`);
      } catch (err) {
        console.error(`✗ Failed to render ${panel.id}:`, err.message);
        results.push({
          panelId: panel.id,
          error: err.message
        });
      }
    }

    return results;
  }


}
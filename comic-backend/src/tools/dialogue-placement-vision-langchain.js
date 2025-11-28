import { GoogleGenerativeAI } from "@google/generative-ai";
import { DynamicStructuredTool } from "@langchain/core/tools";
import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "yaml";
import { z } from "zod";

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
      mimeType: res.headers["content-type"] || "image/jpeg",
      data: Buffer.from(res.data).toString("base64")
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
        model: "gemini-2.5-flash"
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
Analyze the image and return JSON specifying optimal speech bubble locations.

Panel ID: ${panel.id}
Panel Size: ${panel.width}x${panel.height}
Description: ${panel.description}

DIALOGUE:
${dialogueList}

Return ONLY JSON:
{
  "panelId": "...",
  "panelWidth": ...,
  "panelHeight": ...,
  "placements": [
    {
      "type": "speech",
      "speaker": "...",
      "text": "...",
      "position": { "x": ..., "y": ..., "width": ..., "height": ... },
      "tail": { "x": ..., "y": ..., "direction": "..." },
      "readingOrder": number,
      "reasoning": "..."
    }
  ]
}
        `;

        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                { inlineData }
              ]
            }
          ]
        });

        const text = result.response.text();

        let json = null;
        try {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) json = JSON.parse(match[0]);
        } catch (_) {}

        if (json?.placements) outputs.push(json);
      }

      await this.savePlacements(outputs);

      return JSON.stringify(
        {
          success: true,
          analyzedPanels: outputs.length,
          placements: outputs
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
}
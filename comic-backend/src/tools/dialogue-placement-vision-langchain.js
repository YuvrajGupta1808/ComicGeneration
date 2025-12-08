import { GoogleGenerativeAI } from "@google/generative-ai";
import { DynamicStructuredTool } from "@langchain/core/tools";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";
import { Canvas, loadImage } from "skia-canvas";
import { fileURLToPath } from "url";
import yaml from "yaml";
import { z } from "zod";
import { drawBubbleFromPlacement } from "../utils/simpleTextRenderer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

  loadDialogueData() {
    // Dialogue is now stored in comic.yaml, not dialogue.yaml
    // This method is kept for backwards compatibility but returns empty
    // The actual dialogue is loaded from comic.yaml in loadComicData()
    return [];
  }

  getTool() {
    return new DynamicStructuredTool({
      name: this.name,
      description: this.description,
      schema: z.object({
        panelId: z.string().optional(),
        sourceMap: z.union([
          z.record(z.string()),
          z.string()
        ]).optional()
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
      // Parse sourceMap if it's a string (JSON from Leonardo tool)
      if (typeof sourceMap === 'string') {
        try {
          const parsed = JSON.parse(sourceMap);
          // If it's the full Leonardo output, extract the sourceMap field
          if (parsed.sourceMap) {
            sourceMap = parsed.sourceMap;
          } else {
            // Otherwise assume it's already the sourceMap object
            sourceMap = parsed;
          }
        } catch (e) {
          console.warn('⚠️ Failed to parse sourceMap string, ignoring:', e.message);
          sourceMap = null;
        }
      }
      
      const comicData = this.loadComicData();
      
      if (!comicData.panels || !comicData.panels.length) {
        return JSON.stringify({
          success: false,
          error: "No panels found in comic.yaml",
          placements: []
        });
      }

      // Dialogue is already in comic.yaml panels (merged by dialogue generation tool)
      const panels = comicData.panels;

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

      // Filter panels that have any text content (title, dialogue, or narration)
      analyze = analyze.filter((p) => 
        p.title || (p.dialogue && p.dialogue.length > 0) || p.narration
      );
      
      if (!analyze.length)
        return JSON.stringify({
          success: false,
          error: "No panels with text content (title, dialogue, or narration).",
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
          panel.cloudinaryUrl ||
          panel.imageUrl;

        if (!url) continue;

        const inlineData = await this.imageUrlToInlineData(url);

        // Build text content list
        const textContent = [];
        
        if (panel.title) {
          textContent.push(`TITLE: "${panel.title}"`);
        }
        
        if (panel.dialogue && panel.dialogue.length > 0) {
          textContent.push("\nDIALOGUE:");
          panel.dialogue.forEach((d, i) => {
            textContent.push(`${i + 1}. ${d.speaker}: "${d.text}"`);
          });
        }
        
        if (panel.narration) {
          textContent.push(`\nNARRATION: "${panel.narration}"`);
        }

        const prompt = `
You are a PROFESSIONAL COMIC BOOK LETTERER with expert visual analysis skills. Analyze this panel image and determine the OPTIMAL positions for all text elements.

Panel ID: ${panel.id}
Canvas Size: ${panel.width}px × ${panel.height}px
Scene Description: ${panel.description}

TEXT CONTENT TO PLACE:
${textContent.join("\n")}

STEP 1: Analyze the image carefully and identify:
- Character positions (head, face, mouth/chin locations)
- Face directions (which way characters are looking)
- Empty/clear areas (sky, walls, backgrounds, corners)
- Visual focal points (action, important details to avoid covering)
- Spatial relationships (foreground/midground/background)
- Areas with high vs low visual density

STEP 2: For each text element PROVIDED (title, narration, and dialogue are all OPTIONAL), determine the BEST placement by considering:

FOR TITLES (if present):
- Titles are ALWAYS centered horizontally at the top
- X coordinate = ${Math.floor(panel.width / 2)} (exact horizontal center - FIXED)
- Y coordinate = 30 (FIXED - standard top position)
- This ensures consistent, professional title placement across all panels

FOR NARRATION (if present):
- Narration boxes are rectangular captions that provide story context
- Analyze the ENTIRE image to find the best corner or edge position
- Consider these factors:
  * Visual density: choose areas with less detail
  * Avoid covering faces, important action, or focal points
  * Don't overlap with title (if present)
  * Common positions: corners (top-left, top-right, bottom-left, bottom-right)
- X, Y = top-left corner of the narration box
- Choose the position that has the LEAST visual interference

FOR DIALOGUE (if present):
- Speech bubbles connect to the speaker via a tail
- Analyze where each speaker is located in the image
- For each dialogue:
  * Find the speaker's HEAD and MOUTH/CHIN location
  * Place bubble in EMPTY SPACE near the speaker
  * Bubble can be above, beside, or below the speaker - choose based on available space
  * tail.x, tail.y = EXACT pixel coordinates of the speaker's mouth/chin
  * X, Y = top-left corner of the speech bubble
- Maintain natural reading flow (generally left-to-right, top-to-bottom)
- Keep adequate spacing between bubbles to avoid crowding

STEP 3: Determine reading order based on:
- Natural eye flow through the composition
- Left-to-right, top-to-bottom convention
- Visual hierarchy: Title → Narration → Dialogue
- But be flexible - analyze what makes sense for THIS specific panel

Return ONLY this JSON structure (NO markdown, NO code blocks, NO explanations):

{
  "panelId": "${panel.id}",
  "panelWidth": ${panel.width},
  "panelHeight": ${panel.height},
  "placements": [
    {
      "type": "title",
      "text": "EXACT TITLE TEXT",
      "position": { "x": <number>, "y": <number> },
      "readingOrder": 1
    },
    {
      "type": "narration",
      "text": "EXACT NARRATION TEXT",
      "position": { "x": <number>, "y": <number> },
      "readingOrder": 2
    },
    {
      "type": "speech",
      "speaker": "CHARACTER_NAME",
      "text": "EXACT DIALOGUE TEXT",
      "position": { "x": <number>, "y": <number> },
      "tail": { "x": <number>, "y": <number> },
      "speakerLocation": "brief description of speaker location in image",
      "readingOrder": 3
    }
  ]
}

✓ ALL coordinates must be NUMBERS (not strings)
✓ Position x, y = TOP-LEFT corner of text element
✓ Tail x, y = EXACT speaker mouth/chin location
✓ Text must be EXACT copy from TEXT CONTENT above
✓ Type must be EXACTLY: "title", "narration", or "speech"
✓ Reading order must be SEQUENTIAL integers starting from 1
✓ Title has NO tail or speaker fields
✓ Narration has NO tail or speaker fields
✓ Speech MUST have tail and speaker fields
✓ Return ONLY the JSON object (no extra text)

BEGIN ANALYSIS AND RETURN JSON:
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

      // Render images with text
      const renderedImages = await this.renderDialogueImages(analyze, outputs);
      
      // Save placements with Cloudinary URLs
      await this.savePlacements(outputs, renderedImages);

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

  async savePlacements(list, renderedImages = []) {
    const comicPath = path.join(__dirname, "../../config/comic.yaml");
    let comic = yaml.parse(fs.readFileSync(comicPath, "utf8"));

    // Preserve all existing data, only add/update text placements
    comic.panels = comic.panels.map((p) => {
      const found = list.find((o) => o.panelId === p.id);
      const rendered = renderedImages.find((r) => r.panelId === p.id);
      
      if (found || rendered) {
        // Create updated panel preserving all existing fields
        const updated = { ...p };
        
        // Add/update text placements
        if (found) {
          updated.textPlacements = found.placements;
        }
        
        // Add/update Cloudinary URL for rendered image with text
        if (rendered && rendered.cloudinaryUrl) {
          updated.textImageUrl = rendered.cloudinaryUrl;
        }
        
        return updated;
      }
      return p;
    });

    await fs.writeFile(
      comicPath, 
      yaml.stringify(comic, { 
        indent: 2,
        lineWidth: 120,
        simpleKeys: false
      })
    );
    
    console.log(`✓ Saved text placements to comic.yaml`);
  }

  /**
   * Render dialogue on images, save to outputs folder, and upload to Cloudinary
   */
  async renderDialogueImages(panels, placements) {
    const outputDir = path.join(__dirname, "../../outputs");
    await fs.ensureDir(outputDir);

    const results = [];

    for (const panel of panels) {
      try {
        const placement = placements.find((p) => p.panelId === panel.id);
        if (!placement) continue;

        // Get image URL
        const imageUrl = panel.imageUrl || panel.cloudinaryUrl;
        if (!imageUrl) continue;

        // Load image
        const response = await axios.get(imageUrl, {
          responseType: "arraybuffer",
        });
        const img = await loadImage(Buffer.from(response.data));

        // Create canvas
        const canvas = new Canvas(img.width, img.height);
        const ctx = canvas.getContext("2d");

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Draw each dialogue bubble
        for (const bubble of placement.placements) {
          drawBubbleFromPlacement(ctx, bubble);
        }

        // Save to outputs folder
        const outputPath = path.join(
          outputDir,
          `${panel.id}_with_text.png`
        );
        const buffer = await canvas.toBuffer("image/png");
        await fs.writeFile(outputPath, buffer);

        // Upload to Cloudinary
        let cloudinaryUrl = null;
        try {
          console.log(`☁️  Uploading ${panel.id} to Cloudinary...`);
          const uploadResult = await cloudinary.uploader.upload(
            outputPath,
            {
              folder: "comic/panels_with_text",
              public_id: `${panel.id}_with_text`,
              overwrite: true,
              resource_type: "image",
            }
          );
          cloudinaryUrl = uploadResult.secure_url;
          console.log(
            `✓ Uploaded ${panel.id} to Cloudinary: ${cloudinaryUrl}`
          );
        } catch (uploadErr) {
          console.error(
            `✗ Failed to upload ${panel.id} to Cloudinary:`,
            uploadErr.message || uploadErr
          );
          console.error("Upload error details:", uploadErr);
        }

        results.push({
          panelId: panel.id,
          outputPath,
          cloudinaryUrl,
          bubbleCount: placement.placements.length,
        });

        console.log(`✓ Rendered ${panel.id} → ${outputPath}`);
      } catch (err) {
        console.error(`✗ Failed to render ${panel.id}:`, err.message);
        results.push({
          panelId: panel.id,
          error: err.message,
        });
      }
    }

    return results;
  }


}
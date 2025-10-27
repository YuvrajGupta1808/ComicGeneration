/**
 * 🌎 Full Cloud Comic Pipeline
 * Leonardo → Cloudinary panels → Cloudinary pages
 */
import { generateComic } from "../api/generate.js";
import { renderAll } from "../render/renderAll.js";

(async () => {
  console.log("🚀 Starting Leonardo + Cloudinary comic pipeline...\n");

  // Step 1: Generate panels on Leonardo → Upload to Cloudinary
  const sourceMap = await generateComic();
  console.log("\n✅ Step 1 done — Panels generated and uploaded to Cloudinary!");

  // Step 2: Render all pages using the uploaded panel URLs
  console.log("\n🖨️ Step 2 — Rendering A4 pages...");
  const pages = await renderAll(sourceMap);

  console.log("\n✨ Pipeline complete! Final Comic Pages:\n");
  pages.forEach((p) =>
    console.log(`📄 Page ${p.page}: ${p.url}`)
  );

  console.log("\n✅ All done!");
})();
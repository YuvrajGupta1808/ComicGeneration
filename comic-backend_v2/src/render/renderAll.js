// Full cloud-only pipeline: panels -> (text overlay) -> pages, all on Cloudinary
import { v2 as cloudinary } from "cloudinary";
import { LAYOUTS } from "../data/layouts.js"; // each panel in layout needs matching id + size,y,h,align...
import { PANELS } from "../data/panels.js"; // must have { id,width,height,... }
import { addTextToAllPanels } from "./drawText.js";
import { renderPage } from "./renderPage.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/*
  `sourceMap` must map panelId -> URL of the *base* panel image (from your generator).
  Example:
    {
      panel1: "https://res.cloudinary.com/.../panel1_base.jpg",
      panel2: "https://res.cloudinary.com/.../panel2_base.jpg",
      ...
    }
*/

export async function renderAll(sourceMap) {
  console.log("🎬 Cloud-only pipeline starting...");

  // 1) Create text-enhanced panel assets (uploaded to Cloudinary)
  console.log("📝 Adding text to panels (in-memory → Cloudinary)...");
  const panelAssets = await addTextToAllPanels(PANELS, sourceMap, "comic/panels");
  console.log("✅ Panels uploaded:", Object.keys(panelAssets).length);

  // 2) Compose pages and upload to Cloudinary
  console.log("🖨️ Composing pages (in-memory → Cloudinary)...");
  const pageUploads = [];
  for (const layout of LAYOUTS) {
    // layout.panels must reference `id` that exists in PANELS/TEXT/Assets
    const upload = await renderPage(layout, panelAssets, "comic/pages");
    pageUploads.push(upload);
    console.log(`✅ Page ${upload.page}: ${upload.url}`);
  }

  console.log("✨ Done. Page URLs:");
  return pageUploads; // [{page, url, publicId}, ...]
}
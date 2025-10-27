// src/main/simpleTest.js
/**
 * Simple Test - Leonardo AI + Static Text
 * Clean, simple approach without AI text generation
 */

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { LAYOUTS } from "../data/layouts.js";
import { SIMPLE_TEXT } from "../data/simpleText.js";
import { renderPage } from "../render/renderPage.js";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

(async () => {
  console.log("🎨 Simple Comic Generation - Leonardo AI + Static Text\n");
  console.log(`📝 Using simple static text (no AI generation)`);
  console.log(`   Total panels with text: ${Object.keys(SIMPLE_TEXT).length}\n`);

  // Panel URLs (existing panels)
  const panelAssets = {
    panel1: {
      id: "panel1",
      url: "https://res.cloudinary.com/ddzodimio/image/upload/v1760763663/comic/panels/panel_1.jpg",
      width: 832,
      height: 1248,
      text: SIMPLE_TEXT["panel1"]
    },
    panel2: {
      id: "panel2",
      url: "https://res.cloudinary.com/ddzodimio/image/upload/v1760763717/comic/panels/panel_2.jpg",
      width: 944,
      height: 1104,
      text: SIMPLE_TEXT["panel2"]
    },
    panel3: {
      id: "panel3",
      url: "https://res.cloudinary.com/ddzodimio/image/upload/v1760763770/comic/panels/panel_3.jpg",
      width: 832,
      height: 1248,
      text: SIMPLE_TEXT["panel3"]
    },
    panel4: {
      id: "panel4",
      url: "https://res.cloudinary.com/ddzodimio/image/upload/v1760763823/comic/panels/panel_4.jpg",
      width: 832,
      height: 1248,
      text: SIMPLE_TEXT["panel4"]
    },
    panel5: {
      id: "panel5",
      url: "https://res.cloudinary.com/ddzodimio/image/upload/v1760763878/comic/panels/panel_5.jpg",
      width: 944,
      height: 1104,
      text: SIMPLE_TEXT["panel5"]
    },
    panel6: {
      id: "panel6",
      url: "https://res.cloudinary.com/ddzodimio/image/upload/v1760763931/comic/panels/panel_6.jpg",
      width: 1456,
      height: 720,
      text: SIMPLE_TEXT["panel6"]
    },
    panel7: {
      id: "panel7",
      url: "https://res.cloudinary.com/ddzodimio/image/upload/v1760763985/comic/panels/panel_7.jpg",
      width: 1456,
      height: 720,
      text: SIMPLE_TEXT["panel7"]
    },
    panel8: {
      id: "panel8",
      url: "https://res.cloudinary.com/ddzodimio/image/upload/v1760764038/comic/panels/panel_8.jpg",
      width: 1456,
      height: 720,
      text: SIMPLE_TEXT["panel8"]
    },
  };

  try {
    console.log("📋 Layout Configuration:");
    LAYOUTS.forEach((layout) => {
      console.log(`   Page ${layout.page}: ${layout.panels.map(p => p.id).join(", ")}`);
    });
    
    console.log("\n📝 Text Content Preview:");
    Object.keys(SIMPLE_TEXT).slice(0, 3).forEach((panelId) => {
      const panel = SIMPLE_TEXT[panelId];
      console.log(`   ${panelId}:`);
      console.log(`      Title: "${panel.title}"`);
      if (panel.dialogues && panel.dialogues.length > 0) {
        panel.dialogues.forEach((d) => console.log(`      Dialogue: "${d.text}"`));
      }
    });
    console.log("");

    console.log("🖨️ Composing A4 pages...\n");
    const pageUploads = [];
    
    for (const layout of LAYOUTS) {
      console.log(`📄 Rendering Page ${layout.page}...`);
      
      // Check if all required panels exist
      const missingPanels = layout.panels.filter(p => !panelAssets[p.id]);
      if (missingPanels.length > 0) {
        console.warn(`   ⚠️  Missing panels: ${missingPanels.map(p => p.id).join(", ")}`);
      }
      
      console.log(`   ✓ Using panels: ${layout.panels.map(p => p.id).join(", ")}`);
      
      const uploadedPage = await renderPage(layout, panelAssets);
      pageUploads.push(uploadedPage);
    }

    console.log("\n✨ All pages rendered successfully!\n");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📚 FINAL COMIC PAGES:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    pageUploads.forEach((page) => {
      console.log(`   📄 Page ${page.page}: ${page.url}`);
    });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`✅ Total: ${pageUploads.length} pages created`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (error) {
    console.error("🚨 Page rendering failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();





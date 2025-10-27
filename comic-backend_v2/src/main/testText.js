// Test script to render A4 pages from text-enhanced panels using Leonardo AI generated text
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { LAYOUTS } from "../data/layouts.js";
import { renderPage } from "../render/renderPage.js";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Sample text data for Leonardo AI generated panels
const TEXT = {
  panel1: {
    title: "First Contact",
    narration: null,
    dialogues: [
      { speaker: "Rhea", text: "The surface looks more alien than I imagined...", type: "speech", x: 0.15, y: 0.15 },
      { speaker: "Eli", text: "(quietly) Time to make history.", type: "thought", x: 0.85, y: 0.75 }
    ]
  },
  panel2: {
    title: "The Signal", 
    narration: null,
    dialogues: [
      { speaker: "Rhea", text: "Mars doesn't just look different—it feels different.", type: "thought", x: 0.15, y: 0.45 },
      { speaker: "Rhea", text: "Every step kicks up dust as old as time itself.", type: "speech", x: 0.85, y: 0.15 }
    ]
  },
  panel3: {
    title: "Connection",
    narration: null,
    dialogues: [
      { speaker: "Rhea", text: "Mars... quieter than I imagined.", type: "thought", x: 0.15, y: 0.15 },
      { speaker: "Eli", text: "Time to gather what we came for.", type: "speech", x: 0.85, y: 0.45 }
    ]
  },
  panel4: {
    title: "Discovery",
    narration: null,
    dialogues: [
      { speaker: "Rhea", text: "The red horizon stretches endlessly...", type: "thought", x: 0.15, y: 0.75 }
    ]
  },
  panel5: {
    title: "Revelation",
    narration: null,
    dialogues: [
      { speaker: "Eli", text: "What did you find?", type: "speech", x: 0.85, y: 0.15 },
      { speaker: "Rhea", text: "Something impossible.", type: "speech", x: 0.15, y: 0.45 }
    ]
  },
  panel6: {
    title: "The Message",
    narration: null,
    dialogues: [
      { speaker: "Rhea", text: "This changes everything.", type: "speech", x: 0.15, y: 0.15 }
    ]
  },
  panel7: {
    title: "Decision",
    narration: null,
    dialogues: [
      { speaker: "Eli", text: "What will you do?", type: "speech", x: 0.85, y: 0.45 },
      { speaker: "Rhea", text: "What I came here to do.", type: "speech", x: 0.15, y: 0.75 }
    ]
  },
  panel8: {
    title: "Horizon",
    narration: null,
    dialogues: [
      { speaker: "Rhea", text: "The future awaits.", type: "thought", x: 0.5, y: 0.85 }
    ]
  }
};

(async () => {
  console.log("🖨️ Rendering A4 comic pages with Leonardo AI generated text...\n");
  console.log(`📝 Using Leonardo AI text data`);
  console.log(`   Total panels with text: ${Object.keys(TEXT).length}\n`);

  // Panel URLs (without text - text will be added from generated_text.js)
  const panelAssets = {
    panel1: {
      id: "panel1",
      url: "https://res.cloudinary.com/ddzodimio/image/upload/v1760763663/comic/panels/panel_1.jpg",
      width: 832,
      height: 1248,
      text: TEXT["panel1"] // Add AI-generated text
    },
    panel2: {
      id: "panel2",
      url: "https://res.cloudinary.com/ddzodimio/image/upload/v1760763717/comic/panels/panel_2.jpg",
      width: 944,
      height: 1104,
      text: TEXT["panel2"]
    },
    panel3: {
      id: "panel3",
      url: "https://res.cloudinary.com/ddzodimio/image/upload/v1760763770/comic/panels/panel_3.jpg",
      width: 832,
      height: 1248,
      text: TEXT["panel3"]
    },
    panel4: {
      id: "panel4",
      url: "https://res.cloudinary.com/ddzodimio/image/upload/v1760763823/comic/panels/panel_4.jpg",
      width: 832,
      height: 1248,
      text: TEXT["panel4"]
    },
    panel5: {
      id: "panel5",
      url: "https://res.cloudinary.com/ddzodimio/image/upload/v1760763878/comic/panels/panel_5.jpg",
      width: 944,
      height: 1104,
      text: TEXT["panel5"]
    },
    panel6: {
      id: "panel6",
      url: "https://res.cloudinary.com/ddzodimio/image/upload/v1760763931/comic/panels/panel_6.jpg",
      width: 1456,
      height: 720,
      text: TEXT["panel6"]
    },
    panel7: {
      id: "panel7",
      url: "https://res.cloudinary.com/ddzodimio/image/upload/v1760763985/comic/panels/panel_7.jpg",
      width: 1456,
      height: 720,
      text: TEXT["panel7"]
    },
    panel8: {
      id: "panel8",
      url: "https://res.cloudinary.com/ddzodimio/image/upload/v1760764038/comic/panels/panel_8.jpg",
      width: 1456,
      height: 720,
      text: TEXT["panel8"]
    },
  };

  try {
    console.log("📋 Layout Configuration:");
    LAYOUTS.forEach((layout) => {
      console.log(`   Page ${layout.page}: ${layout.panels.map(p => p.id).join(", ")}`);
    });
    
    console.log("\n📝 Text Content Preview:");
    Object.keys(TEXT).slice(0, 3).forEach((panelId) => {
      const panel = TEXT[panelId];
      console.log(`   ${panelId}:`);
      if (panel.title) console.log(`      Title: "${panel.title}"`);
      if (panel.narration) console.log(`      Narration: "${panel.narration}"`);
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
      
      const upload = await renderPage(layout, panelAssets, "comic/pages");
      pageUploads.push(upload);
      console.log(`   ✅ Uploaded: ${upload.url}\n`);
    }

    console.log("✨ All pages rendered successfully!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📚 FINAL COMIC PAGES:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    pageUploads.forEach((p) => {
      console.log(`   📄 Page ${p.page}: ${p.url}`);
    });
    
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`✅ Total: ${pageUploads.length} pages created`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (err) {
    console.error("🚨 Page rendering failed:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();


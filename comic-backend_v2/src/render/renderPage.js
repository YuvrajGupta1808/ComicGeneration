/**
 * Compose a full A4 page from text-enhanced panel assets and upload to Cloudinary
 */

import axios from "axios";
import { createCanvas, loadImage } from "canvas";
import { A4 } from "../config/a4.js";
import { uploadBuffer } from "../utils/cloudinary.js";
import { calculatePanelPosition } from "../utils/panelCalculator.js";
import { renderPanelText } from "../utils/simpleTextRenderer.js";

/**
 * Render a complete A4 comic page with panels and text
 * @param {Object} layout - Page layout definition
 * @param {Object} panelAssets - Panel assets with URLs and text data
 * @param {string} folder - Cloudinary folder path
 * @returns {Object} Upload result with page number and URL
 */
export async function renderPage(layout, panelAssets, folder = "comic/pages") {
  // Create A4 canvas
  const canvas = createCanvas(A4.width, A4.height);
  const ctx = canvas.getContext("2d");

  // Draw background
  ctx.fillStyle = A4.bg;
  ctx.fillRect(0, 0, A4.width, A4.height);

  // Draw page border
  ctx.strokeStyle = A4.borderColor;
  ctx.lineWidth = A4.borderWidth;
  ctx.strokeRect(A4.margin, A4.margin, A4.width - A4.margin * 2, A4.height - A4.margin * 2);

  // Render each panel
  for (const layoutPanel of layout.panels) {
    const asset = panelAssets[layoutPanel.id];
    if (!asset?.url) continue;

    // Calculate panel position and size
    const { x, y, width, height } = calculatePanelPosition(A4, layoutPanel);

    // Load and draw panel image
    const imageData = (await axios.get(asset.url, { responseType: "arraybuffer" })).data;
    const img = await loadImage(Buffer.from(imageData));
    ctx.drawImage(img, x, y, width, height);

    // Draw panel border
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Render simple text on panel
    if (asset.text) {
      renderPanelText(ctx, x, y, width, height, asset.text);
    }
  }

  // Draw page number
  ctx.fillStyle = "#666";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`Page ${layout.page}`, A4.width / 2, A4.height - 10);

  // Upload to Cloudinary
  const buffer = canvas.toBuffer("image/png");
  const uploaded = await uploadBuffer(buffer, `page_${layout.page}`, folder, "png");
  
  return { 
    page: layout.page, 
    url: uploaded.secure_url, 
    publicId: uploaded.public_id 
  };
}

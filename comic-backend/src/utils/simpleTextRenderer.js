// src/utils/simpleTextRenderer.js
/**
 * Skia Canvas Text Renderer - Professional Comic Speech Bubbles, Titles, and Narration
 */

import path from "path";
import { FontLibrary } from "skia-canvas";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load comic fonts
const fontPath = path.join(__dirname, "../../config/font/ACMESecretAgentBB_Reg.otf");
const fontBoldPath = path.join(__dirname, "../../config/font/ACMESecretAgentBB_BoldItal.otf");
const fontItalicPath = path.join(__dirname, "../../config/font/ACMESecretAgentBB_Ital.otf");

try {
  FontLibrary.use("ACME Secret Agent", [fontPath, fontBoldPath, fontItalicPath]);
} catch (err) {
  console.warn("⚠️ Could not load comic fonts:", err.message);
}

/**
 * Draw text element from placement data with professional comic styling
 * Handles: speech bubbles, titles, and narration boxes
 */
export function drawBubbleFromPlacement(ctx, element) {
  // Route to appropriate renderer based on type
  if (element.type === "title") {
    return drawTitleFromPlacement(ctx, element);
  } else if (element.type === "narration") {
    return drawNarrationFromPlacement(ctx, element);
  } else {
    return drawSpeechBubbleFromPlacement(ctx, element);
  }
}

/**
 * Draw speech bubble from placement data
 */
function drawSpeechBubbleFromPlacement(ctx, bubble) {
  const { position, text, tail } = bubble;
  const { x, y } = position;

  ctx.save();

  // Professional comic bubble styling
  const radius = 15;
  const strokeWidth = 4.5;
  const paddingX = 24;
  const paddingY = 18;
  const fontSize = 36;

  // Set font for measuring
  ctx.font = `${fontSize}px "ACME Secret Agent", "Comic Sans MS", cursive`;

  // Smart word wrapping - auto-calculate optimal width
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";
  const maxLineWidth = 280; // Max width for readability

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxLineWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Calculate actual bubble dimensions based on text
  let maxTextWidth = 0;
  lines.forEach((line) => {
    const metrics = ctx.measureText(line);
    if (metrics.width > maxTextWidth) maxTextWidth = metrics.width;
  });

  const bubbleWidth = maxTextWidth + paddingX * 2;
  const lineHeight = fontSize * 1.3;
  const bubbleHeight = lines.length * lineHeight + paddingY * 2 + 5;

  // Calculate tail attachment point based on actual tail position
  let tailBaseX = x + bubbleWidth / 2;
  let tailBaseY = y + bubbleHeight;
  let tailDirection = "down";

  if (tail) {
    // Determine which side of bubble is closest to tail target
    const dx = tail.x - (x + bubbleWidth / 2);
    const dy = tail.y - (y + bubbleHeight / 2);

    // Find closest edge
    if (Math.abs(dy) > Math.abs(dx)) {
      // Top or bottom
      if (dy > 0) {
        tailDirection = "down";
        tailBaseX = x + bubbleWidth / 2 + Math.max(-40, Math.min(40, dx * 0.3));
        tailBaseY = y + bubbleHeight;
      } else {
        tailDirection = "up";
        tailBaseX = x + bubbleWidth / 2 + Math.max(-40, Math.min(40, dx * 0.3));
        tailBaseY = y;
      }
    } else {
      // Left or right
      if (dx > 0) {
        tailDirection = "right";
        tailBaseX = x + bubbleWidth;
        tailBaseY = y + bubbleHeight / 2 + Math.max(-30, Math.min(30, dy * 0.3));
      } else {
        tailDirection = "left";
        tailBaseX = x;
        tailBaseY = y + bubbleHeight / 2 + Math.max(-30, Math.min(30, dy * 0.3));
      }
    }
  }

  // Draw tail first (behind bubble) with better shape
  if (tail) {
    ctx.beginPath();

    const tailWidth = 20;

    if (tailDirection === "down") {
      ctx.moveTo(tailBaseX - tailWidth, tailBaseY - 2);
      ctx.lineTo(tail.x, tail.y);
      ctx.lineTo(tailBaseX + tailWidth, tailBaseY - 2);
      ctx.lineTo(tailBaseX, tailBaseY - 2);
    } else if (tailDirection === "up") {
      ctx.moveTo(tailBaseX - tailWidth, tailBaseY + 2);
      ctx.lineTo(tail.x, tail.y);
      ctx.lineTo(tailBaseX + tailWidth, tailBaseY + 2);
      ctx.lineTo(tailBaseX, tailBaseY + 2);
    } else if (tailDirection === "left") {
      ctx.moveTo(tailBaseX + 2, tailBaseY - tailWidth);
      ctx.lineTo(tail.x, tail.y);
      ctx.lineTo(tailBaseX + 2, tailBaseY + tailWidth);
      ctx.lineTo(tailBaseX + 2, tailBaseY);
    } else if (tailDirection === "right") {
      ctx.moveTo(tailBaseX - 2, tailBaseY - tailWidth);
      ctx.lineTo(tail.x, tail.y);
      ctx.lineTo(tailBaseX - 2, tailBaseY + tailWidth);
      ctx.lineTo(tailBaseX - 2, tailBaseY);
    }

    ctx.closePath();
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // Draw rounded rectangle bubble
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + bubbleWidth - radius, y);
  ctx.arcTo(x + bubbleWidth, y, x + bubbleWidth, y + radius, radius);
  ctx.lineTo(x + bubbleWidth, y + bubbleHeight - radius);
  ctx.arcTo(
    x + bubbleWidth,
    y + bubbleHeight,
    x + bubbleWidth - radius,
    y + bubbleHeight,
    radius
  );
  ctx.lineTo(x + radius, y + bubbleHeight);
  ctx.arcTo(x, y + bubbleHeight, x, y + bubbleHeight - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();

  // Fill and stroke bubble
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  // Draw text
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.letterSpacing = "0.5px";

  const startY = y + paddingY;

  lines.forEach((line, i) => {
    const yPos = startY + i * lineHeight;
    ctx.fillText(line, x + bubbleWidth / 2, yPos);
  });

  ctx.restore();
}

/**
 * Draw title from placement data - Large, centered, no box
 */
function drawTitleFromPlacement(ctx, titleElement) {
  const { position, text } = titleElement;
  const { x, y } = position;

  ctx.save();

  const fontSize = 64;
  const strokeWidth = 6;

  // Set font - bold for titles
  ctx.font = `bold ${fontSize}px "ACME Secret Agent", "Impact", "Arial Black", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.letterSpacing = "2px";

  // X position is already the center point from VLM
  const centerX = x;

  // Draw text with white outline for readability
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "round";
  ctx.strokeText(text, centerX, y);

  // Draw black text on top
  ctx.fillStyle = "#000000";
  ctx.fillText(text, centerX, y);

  ctx.restore();
}

/**
 * Draw narration box from placement data - Parchment style with serif font
 */
function drawNarrationFromPlacement(ctx, narrationElement) {
  const { position, text } = narrationElement;
  const { x, y } = position;

  ctx.save();

  const fontSize = 32;
  const strokeWidth = 3;
  const paddingX = 20;
  const paddingY = 15;
  const maxLineWidth = 600;
  const cornerRadius = 8; // Less rounded than speech bubbles

  // Set font - italic serif for narration
  ctx.font = `italic ${fontSize}px Georgia, "Times New Roman", serif`;

  // Word wrapping
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxLineWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Calculate box dimensions
  let maxTextWidth = 0;
  lines.forEach((line) => {
    const metrics = ctx.measureText(line);
    if (metrics.width > maxTextWidth) maxTextWidth = metrics.width;
  });

  const boxWidth = maxTextWidth + paddingX * 2;
  const lineHeight = fontSize * 1.35;
  const boxHeight = lines.length * lineHeight + paddingY * 2;

  // Draw rounded rectangle with less rounded corners
  ctx.beginPath();
  ctx.moveTo(x + cornerRadius, y);
  ctx.lineTo(x + boxWidth - cornerRadius, y);
  ctx.arcTo(x + boxWidth, y, x + boxWidth, y + cornerRadius, cornerRadius);
  ctx.lineTo(x + boxWidth, y + boxHeight - cornerRadius);
  ctx.arcTo(
    x + boxWidth,
    y + boxHeight,
    x + boxWidth - cornerRadius,
    y + boxHeight,
    cornerRadius
  );
  ctx.lineTo(x + cornerRadius, y + boxHeight);
  ctx.arcTo(x, y + boxHeight, x, y + boxHeight - cornerRadius, cornerRadius);
  ctx.lineTo(x, y + cornerRadius);
  ctx.arcTo(x, y, x + cornerRadius, y, cornerRadius);
  ctx.closePath();

  // Fill with warm parchment tone
  ctx.fillStyle = "#F3ECCB";
  ctx.fill();

  // Draw 3px black border
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "miter"; // Sharp corners for rectangular feel
  ctx.stroke();

  // Draw text in serif italic
  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.letterSpacing = "0.3px";

  const startY = y + paddingY;

  lines.forEach((line, i) => {
    const yPos = startY + i * lineHeight;
    ctx.fillText(line, x + paddingX, yPos);
  });

  ctx.restore();
}

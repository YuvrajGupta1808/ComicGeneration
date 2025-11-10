// src/utils/simpleTextRenderer.js
/**
 * Simple Text Renderer - No AI, Just Clean Text
 */

/**
 * Draw simple speech bubble
 */
export function drawSimpleBubble(ctx, panelX, panelY, panelW, panelH, text, x, y) {
  const bubbleX = panelX + (x * panelW);
  const bubbleY = panelY + (y * panelH);
  const bubbleW = Math.min(panelW * 0.4, 200);
  const bubbleH = 60;
  
  // Draw bubble
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  
  // Rounded rectangle
  ctx.beginPath();
  ctx.roundRect(bubbleX - bubbleW/2, bubbleY - bubbleH/2, bubbleW, bubbleH, 10);
  ctx.fill();
  ctx.stroke();
  
  // Draw text
  ctx.fillStyle = "#000";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, bubbleX, bubbleY);
}

/**
 * Draw simple title
 */
export function drawSimpleTitle(ctx, panelX, panelY, panelW, panelH, title) {
  const titleX = panelX + panelW/2;
  const titleY = panelY + 30;
  
  // Draw title background
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(panelX, panelY, panelW, 50);
  
  // Draw title text
  ctx.fillStyle = "#fff";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, titleX, titleY);
}

/**
 * Render all text for a panel
 */
export function renderPanelText(ctx, panelX, panelY, panelW, panelH, textData) {
  if (!textData) return;
  
  // Draw title
  if (textData.title) {
    drawSimpleTitle(ctx, panelX, panelY, panelW, panelH, textData.title);
  }
  
  // Draw dialogues
  if (textData.dialogues) {
    textData.dialogues.forEach(dialogue => {
      drawSimpleBubble(
        ctx, panelX, panelY, panelW, panelH,
        dialogue.text,
        dialogue.x,
        dialogue.y
      );
    });
  }
}


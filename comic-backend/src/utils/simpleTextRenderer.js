// src/utils/simpleTextRenderer.js
/**
 * Simple Text Renderer - No AI, Just Clean Text
 */

/**
 * Draw speech bubble from placement data - WHITE background with BLACK text
 */
export function drawBubbleFromPlacement(ctx, bubble) {
  const { position, text, tail } = bubble;
  const { x, y, width, height } = position;

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  const radius = 15;

  // We'll draw the tail after getting imageData below

  // Get current canvas image data
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;

  // Helper to set pixel
  const setPixel = (px, py, r, g, b, a = 255) => {
    if (px < 0 || px >= canvasWidth || py < 0 || py >= canvasHeight) return;
    const index = (py * canvasWidth + px) * 4;
    data[index] = r;
    data[index + 1] = g;
    data[index + 2] = b;
    data[index + 3] = a;
  };

  // Helper to check if point is inside rounded rectangle
  const isInsideRoundedRect = (px, py) => {
    if (px >= x + radius && px <= x + width - radius && py >= y && py <= y + height) return true;
    if (px >= x && px <= x + width && py >= y + radius && py <= y + height - radius) return true;
    
    const corners = [
      { cx: x + radius, cy: y + radius },
      { cx: x + width - radius, cy: y + radius },
      { cx: x + radius, cy: y + height - radius },
      { cx: x + width - radius, cy: y + height - radius }
    ];
    
    for (const corner of corners) {
      const dx = px - corner.cx;
      const dy = py - corner.cy;
      if (dx * dx + dy * dy <= radius * radius) return true;
    }
    return false;
  };

  // Draw white bubble fill using putImageData
  for (let py = Math.floor(y); py < Math.ceil(y + height); py++) {
    for (let px = Math.floor(x); px < Math.ceil(x + width); px++) {
      if (isInsideRoundedRect(px, py)) {
        setPixel(px, py, 255, 255, 255, 255);
      }
    }
  }

  // Draw black border (3px thick)
  for (let py = Math.floor(y - 2); py < Math.ceil(y + height + 2); py++) {
    for (let px = Math.floor(x - 2); px < Math.ceil(x + width + 2); px++) {
      const isInside = isInsideRoundedRect(px, py);
      const isNearEdge = 
        isInsideRoundedRect(px - 1, py) || isInsideRoundedRect(px + 1, py) ||
        isInsideRoundedRect(px, py - 1) || isInsideRoundedRect(px, py + 1) ||
        isInsideRoundedRect(px - 2, py) || isInsideRoundedRect(px + 2, py) ||
        isInsideRoundedRect(px, py - 2) || isInsideRoundedRect(px, py + 2);
      
      if (!isInside && isNearEdge) {
        setPixel(px, py, 0, 0, 0, 255);
      }
    }
  }

  // Draw tail if present
  if (tail) {
    const tailBaseX = x + width / 2;
    const tailBaseY = y + height;
    
    // Draw filled triangle for tail using barycentric coordinates
    const drawTriangle = (x1, y1, x2, y2, x3, y3, r, g, b) => {
      const minY = Math.floor(Math.min(y1, y2, y3));
      const maxY = Math.ceil(Math.max(y1, y2, y3));
      const minX = Math.floor(Math.min(x1, x2, x3));
      const maxX = Math.ceil(Math.max(x1, x2, x3));
      
      for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
          const denom = ((y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3));
          if (denom === 0) continue;
          
          const a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denom;
          const b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denom;
          const c = 1 - a - b;
          
          if (a >= 0 && b >= 0 && c >= 0) {
            setPixel(px, py, r, g, b, 255);
          }
        }
      }
    };
    
    drawTriangle(tailBaseX - 15, tailBaseY, tail.x, tail.y, tailBaseX + 15, tailBaseY, 255, 255, 255);
  }

  // Put the modified image data back
  ctx.putImageData(imageData, 0, 0);

  // Draw BLACK text on white
  ctx.fillStyle = "black";
  ctx.font = "bold 22px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Word wrapping
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";
  const maxWidth = width - 40;

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Draw text lines
  const lineHeight = 28;
  const totalHeight = lines.length * lineHeight;
  const startY = y + height / 2 - totalHeight / 2 + lineHeight / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, x + width / 2, startY + i * lineHeight);
  });

  ctx.restore();
}

/**
 * Draw simple speech bubble - WHITE background with BLACK text
 */
export function drawSimpleBubble(ctx, panelX, panelY, panelW, panelH, text, x, y) {
  const bubbleX = panelX + (x * panelW);
  const bubbleY = panelY + (y * panelH);
  const bubbleW = Math.min(panelW * 0.4, 200);
  const bubbleH = 60;
  
  // Draw WHITE bubble with BLACK border
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 3;
  
  // Rounded rectangle
  ctx.beginPath();
  ctx.roundRect(bubbleX - bubbleW/2, bubbleY - bubbleH/2, bubbleW, bubbleH, 10);
  ctx.fill();
  ctx.stroke();
  
  // Draw BLACK text
  ctx.fillStyle = "black";
  ctx.font = "bold 16px Arial, sans-serif";
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
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
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


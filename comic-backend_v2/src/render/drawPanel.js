// Places a single panel image onto the page canvas (image provided as Buffer or URL)
import { loadImage } from "canvas";

export async function drawPanel(ctx, cfg, layoutPanel, imageInput) {
  const usableW = cfg.width - cfg.margin * 2;
  const usableH = cfg.height - cfg.margin * 2;

  const y = cfg.margin + layoutPanel.y * usableH;
  const boxH = layoutPanel.h * usableH;

  const [pw, ph] = layoutPanel.size.split("x").map(Number);
  const ratio = pw / ph;
  const boxW = boxH * ratio;

  let x;
  if (layoutPanel.align === "left") x = cfg.margin;
  else if (layoutPanel.align === "right") x = cfg.width - cfg.margin - boxW;
  else x = cfg.margin + (usableW - boxW) / 2;
  if (layoutPanel.offsetX) x += layoutPanel.offsetX * usableW;

  const img = await loadImage(imageInput);
  ctx.drawImage(img, x, y, boxW, boxH);

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, boxW, boxH);
}
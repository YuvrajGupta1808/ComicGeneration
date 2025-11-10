/**
 * Calculate panel position and dimensions on A4 page
 */

/**
 * Calculate panel coordinates and dimensions
 * @param {Object} config - A4 configuration
 * @param {Object} layoutPanel - Layout panel definition
 * @returns {Object} Panel coordinates and dimensions { x, y, width, height }
 */
export function calculatePanelPosition(config, layoutPanel) {
  const usableW = config.width - config.margin * 2;
  const usableH = config.height - config.margin * 2;
  
  // Calculate panel height based on layout
  const panelY = config.margin + layoutPanel.y * usableH;
  const panelH = layoutPanel.h * usableH;
  
  // Calculate panel width based on aspect ratio
  const [pw, ph] = layoutPanel.size.split("x").map(Number);
  const ratio = pw / ph;
  const panelW = panelH * ratio;
  
  // Calculate X position based on alignment
  let panelX;
  if (layoutPanel.align === "left") {
    panelX = config.margin;
  } else if (layoutPanel.align === "right") {
    panelX = config.width - config.margin - panelW;
  } else {
    panelX = config.margin + (usableW - panelW) / 2;
  }
  
  // Apply offset if specified
  if (layoutPanel.offsetX) {
    panelX += layoutPanel.offsetX * usableW;
  }
  
  return {
    x: panelX,
    y: panelY,
    width: panelW,
    height: panelH
  };
}


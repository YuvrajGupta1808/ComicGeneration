// src/render/drawText.js

//This File is only used for mock mode wtihout leonardo api key

import { PANELS } from "../data/panels.js";

/*
  Very simple mock text overlay step.
 */
export async function addTextToAllPanels(panels = PANELS, sourceMap, folder = "comic/panels") {
  const panelAssets = {};

  for (const panel of panels) {
    const id = panel.id;

    if (!sourceMap[id]) {
      console.warn(`⚠️ No source image URL found for panel id "${id}" in sourceMap`);
      continue;
    }

    panelAssets[id] = {

      url: sourceMap[id],
      textData: {
        title: "",
        bubbles: [],
      },
    };
  }

  console.log("📝 addTextToAllPanels stub returning panelAssets:");
  console.table(
    Object.entries(panelAssets).map(([id, asset]) => ({
      id,
      url: asset.url,
    }))
  );

  return panelAssets;
}

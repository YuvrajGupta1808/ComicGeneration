// src/api/generateMock.js

//this file is only for mock mode with leonardo api key

import { PANELS } from "../data/panels.js";

export async function generateComicMock() {
  const sourceMap = {};

  PANELS.forEach((panel, index) => {
    // Seeded so the same panel id always gets the same image
    sourceMap[panel.id] =
      `https://picsum.photos/seed/${encodeURIComponent(panel.id)}/832/1248`;
  });

  console.log("🧪 Using MOCK panels from Picsum:");
  console.table(
    Object.entries(sourceMap).map(([id, url]) => ({ id, url }))
  );

  return sourceMap;
}

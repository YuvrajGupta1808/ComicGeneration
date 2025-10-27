export const PANELS = [
    // 🟥 PAGE 1 — COVER / INTRO
    {
      id: "panel1",
      prompt:
        "Tall cover shot — Astronaut Rhea stands on the Martian plateau at dusk, the blue glow of Earth faintly reflected in her visor. In the sky, a shimmering hologram of Eli’s face flickers softly, formed from static light. Red dust swirls in the low gravity. Epic cinematic sci-fi atmosphere, painterly anime-comic tone, glowing rim light. No text",
      width: 832,
      height: 1248,
      contextImages: ["Rhea", "Eli", "background"],
    },
  
    // 🟦 PAGE 2 — MAIN STORY
    {
      id: "panel2",
      prompt:
        "Wide establishing shot — Inside the Mars outpost, Rhea adjusts a comm terminal as faint static hums. On the holographic screen, Eli’s face appears clearly for the first time, softly illuminated by blue-white light. Behind Rhea, the window shows the rust-red horizon. Detailed sci-fi environment with reflective surfaces and soft depth of field. No text",
      width: 944,
      height: 1104,
      contextImages: ["panel1"],
    },
    {
      id: "panel3",
      prompt:
        "Close shot — Rhea through her visor, her reflection showing Eli’s holographic image on the screen beside her. Her eyes carry both exhaustion and warmth. The light from Eli’s image reflects faintly on her faceplate. Emotional and cinematic sci-fi comic art. No text",
      width: 832,
      height: 1248,
      contextImages: ["panel2", "Rhea", "Eli"],
    },
    {
      id: "panel4",
      prompt:
        "Close shot — Eli’s holographic projection, flickering with static but smiling gently. His background shows the inside of a dim Earth control room filled with cables and soft blue monitors. Half his face is cut by glitching lines of digital interference, conveying fragility. No text",
      width: 832,
      height: 1248,
      contextImages: ["Eli", "panel3", "background"],
    },
    {
      id: "panel5",
      prompt:
        "Wide mid shot — Both Rhea and Eli’s holographic form face each other across the comm feed. Rhea’s gloved hand rests near the screen, reaching toward his fading image. Their lights — orange from Mars and blue from Earth — blend together at the center. Painterly sci-fi tone with quiet intimacy. No text",
      width: 944,
      height: 1104,
      contextImages: ["panel3", "panel4"],
    },
  
    // 🟩 PAGE 3 — ENDING / EPILOGUE
    {
      id: "panel6",
      prompt:
        "Wide shot — Rhea walks away from the outpost toward the Martian ridge, the comm tower’s antenna glowing faintly blue behind her. In the distance, the hologram of Eli flickers one last time before fading into the twilight. Stars appear above. Cinematic sci-fi closure. No text",
      width: 1456,
      height: 720,
      contextImages: ["panel5"],
    },
    {
      id: "panel7",
      prompt:
        "Wide mid shot — From behind, Rhea pauses on the ridge, her figure small against the horizon. On her wrist, a final message flickers: 'Signal received.' The glow illuminates her gloved hand. Painterly, emotional tone. No text",
      width: 1456,
      height: 720,
      contextImages: ["panel6"],
    },
    {
      id: "panel8",
      prompt:
        "Wide closing shot — The Martian night sky filled with stars, the outpost darkened. A faint pulse of blue light shines once from the sky — Earth reflecting back. Quiet, emotional, cinematic closing frame. No text",
      width: 1456,
      height: 720,
      contextImages: ["panel7"],
    },
  ];
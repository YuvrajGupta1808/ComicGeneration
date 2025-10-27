// src/data/text.js
/**
 * Text templates and configurations for comic panels
 */

export const TEXT_TEMPLATES = {
  title: {
    font: "bold 84px 'Orbitron', 'Arial Black', sans-serif",
    color: "#ffffff",
    strokeColor: "#000000",
    strokeWidth: 6,
    shadow: true,
    align: "center",
    size: 0.075
  },
  narration: {
    font: "bold 24px 'Arial', sans-serif",
    color: "#ffffff",
    strokeColor: "#000000",
    strokeWidth: 2,
    shadow: true,
    align: "center",
    size: 0.04
  },
  dialogue: {
    font: "bold 20px 'Arial', sans-serif",
    color: "#000000",
    strokeColor: "#ffffff",
    strokeWidth: 1,
    shadow: false,
    align: "center",
    size: 0.035
  },
  sfx: {
    font: "bold 32px 'Impact', 'Arial Black', sans-serif",
    color: "#ff0000",
    strokeColor: "#ffffff",
    strokeWidth: 3,
    shadow: true,
    align: "center",
    size: 0.06
  }
};

export const TEXT_POSITIONS = {
  top: { x: 0.5, y: 0.1 },
  middle: { x: 0.5, y: 0.5 },
  bottom: { x: 0.5, y: 0.9 },
  left: { x: 0.2, y: 0.5 },
  right: { x: 0.8, y: 0.5 }
};

export const TEXT_PLACEMENT_ZONES = {
  safe: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
  top: { x: 0.1, y: 0.05, width: 0.8, height: 0.2 },
  bottom: { x: 0.1, y: 0.75, width: 0.8, height: 0.2 },
  left: { x: 0.05, y: 0.2, width: 0.25, height: 0.6 },
  right: { x: 0.7, y: 0.2, width: 0.25, height: 0.6 },
  center: { x: 0.3, y: 0.3, width: 0.4, height: 0.4 }
};

export const SAMPLE_TEXT = {
  title: "MARS ADVENTURE",
  narration: "On the red planet, an astronaut discovers something unexpected...",
  dialogue: [
    "What is this?",
    "I've never seen anything like it before.",
    "The signal is getting stronger...",
    "This changes everything."
  ],
  sfx: ["BEEP", "WHOOSH", "CRACKLE", "SILENCE"]
};

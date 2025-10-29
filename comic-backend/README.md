# 🎨 Leonardo Comic Generator

Automatically generate comic panels using Leonardo AI and combine them with dialogue bubbles!

## 📋 Features

- ✨ Generate 3 comic panels using Leonardo AI
- 🎭 **Character consistency** using Leonardo Phoenix 1.0 + init images
- 🖼️ Optional character reference images for even better consistency
- 💬 Automatically add speech bubbles with dialogue
- 📐 Two layout options: vertical or grid
- 🎯 Customizable characters, scenes, and dialogue
- 🤖 **AI Story Generation** with Claude API or FREE local Ollama mode
- 📝 Interactive CLI for comic creation workflows
- 🎨 Character and dialogue generation

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Choose AI Mode

**Option A: Use Claude API (requires API key)**
```bash
# Create .env file
echo "ANTHROPIC_API_KEY=your_api_key_here" > .env
```

**Option B: Use Ollama (FREE local mode)**
```bash
# Run the setup script
npm run setup-ollama
```

This will:
- Check if Ollama is installed
- Install the recommended model (llama3.2)
- Configure the environment for local mode

### 3. Set Up Environment

**For Claude API mode:**
Create a `.env` file with your API key:
```bash
ANTHROPIC_API_KEY=your_api_key_here
```

**For Ollama mode:**
The setup script automatically configures `USE_OLLAMA=true` in your `.env` file.

### 4. Generate Comic Page

**Option A: Use the CLI Agent (AI-powered workflow)**

```bash
# Start interactive mode
comic-agent interactive

# Or create a comic directly
comic-agent create --prompt "A superhero saves the city"
```

**Option B: Generate panels AND combine automatically (original method)**

```bash
npm run generate
```

This will:
1. Generate 3 panels using Leonardo AI
2. Automatically combine them with dialogue
3. Save as `comic_page_complete.png`

**Option C: Manually combine existing panels**

```bash
npm run combine          # Vertical layout
npm run combine:grid     # Grid layout (horizontal)
```

## 🤖 AI Modes

### Claude API Mode (Default)
- Requires `ANTHROPIC_API_KEY` environment variable
- High-quality story and character generation
- Fast response times
- Requires internet connection

### Ollama Mode (FREE Local)
- Set `USE_OLLAMA=true` in your `.env` file
- Completely free to use
- Runs locally on your machine
- No internet required after setup
- Uses Llama 3.2 model by default

**To switch to Ollama mode:**
```bash
npm run setup-ollama
```

**To switch back to Claude:**
```bash
# Remove or comment out USE_OLLAMA from .env
# Set ANTHROPIC_API_KEY=your_key_here
```

## 🎭 Character Consistency

The script uses **two techniques** to maintain character consistency across panels:

### 1. Panel-to-Panel Reference (Automatic) ✅
Each panel uses the previous panel as a style reference via `init_generation_image_id`. This is already enabled by default!

### 2. Character Reference Image (Advanced) 🎯

For **even better consistency**, upload a character reference image:

**Step 1: Upload your character reference**
```bash
npm run upload-reference character.png
```

**Step 2: Copy the Image ID and add it to `comic-cover.js`:**
```javascript
const CHARACTER_REFERENCE_IMAGE_ID = "your-image-id-here";
const CHARACTER_REFERENCE_WEIGHT = 0.5; // 0.0 to 1.0 (higher = stronger)
```

**Step 3: Generate!**
```bash
npm run generate
```

### Best Models for Character Consistency

The script now uses **Leonardo Phoenix 1.0** (best model). Alternatives in `comic-cover.js`:

- `de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3` - **Leonardo Phoenix 1.0** (recommended)
- `5c232a9e-9061-4777-980a-dddc8e65647c6` - Leonardo Vision XL
- `aa77f04e-3eec-4034-9c07-d0f619684628` - Leonardo Kino XL
- `e71afc2f-4f80-4800-934f-2c68979d8cc8` - Leonardo Anime XL (anime style)

## ⚙️ Configuration

### Modify Comic Content

Edit `comic-cover.js`:

```javascript
// Change characters
const CHARACTER_1 = "your character description...";
const CHARACTER_2 = "another character description...";

// Change scene
const SCENE = "your scene description...";

// Change panel prompts
const PANELS = [
  "Panel 1 description...",
  "Panel 2 description...",
  "Panel 3 description..."
];

// Enable/disable auto-combine
const AUTO_COMBINE_PANELS = true; // Set to false to skip auto-combine
const LAYOUT_TYPE = "vertical";   // "vertical" or "grid"
```

### Modify Dialogue

Edit `combine-panels.js`:

```javascript
const DIALOGUES = [
  {
    panel: 1,
    bubbles: [
      { x: 300, y: 100, text: "Your text here!", speaker: "Character" },
      { x: 900, y: 150, text: "Reply text", speaker: "Character2" }
    ]
  },
  // ... more panels
];
```

**Position Guidelines:**
- `x`: Horizontal position (0 to 1344 for vertical layout)
- `y`: Vertical position (0 to 576 for vertical layout)
- `text`: Use `\n` for line breaks

### Customize Appearance

Edit `combine-panels.js`:

```javascript
// Layout configuration
const LAYOUT_CONFIG = {
  spacing: 20,              // Space between panels
  borderWidth: 3,           // Border thickness
  backgroundColor: "#ffffff",
  panelBorderColor: "#000000"
};

// Speech bubble style
const BUBBLE_STYLE = {
  padding: 20,
  fontSize: 28,
  fontFamily: "Arial",
  backgroundColor: "#FFFFFF",
  borderColor: "#000000",
  borderWidth: 3,
  cornerRadius: 15,
  tailSize: 20
};
```

## 📁 Output Files

- `Panel_1.png`, `Panel_2.png`, `Panel_3.png` - Individual panels from Leonardo AI
- `panels.json` - Metadata with public URLs for each panel
- `comic_page_complete.png` - Final combined comic page (vertical layout)
- `comic_page_grid.png` - Final combined comic page (grid layout)

## 🎯 Workflow

### First Time Setup
1. Configure your characters and scene in `comic-cover.js`
2. Set your dialogue in `combine-panels.js`
3. Run `npm run generate`

### Tweaking Dialogue
If you just want to adjust dialogue positions or text without regenerating panels:

```bash
npm run combine
```

This is much faster since it doesn't call the Leonardo AI API!

### Trying Different Layouts
```bash
npm run combine          # Vertical
npm run combine:grid     # Horizontal grid
```

## 💡 Tips

1. **Character Consistency**:
   - Keep character descriptions **identical** across all panel prompts
   - Use `init_strength` between 0.3-0.4 (already optimized)
   - For multiple characters, use a reference image of each character
   - Add "consistent character design" to your prompts

2. **Dialogue Positioning**: Start with the provided coordinates and adjust incrementally

3. **Multi-line Text**: Use `\n` in your dialogue for better readability

4. **Layout Choice**: 
   - Vertical = Traditional comic strip format
   - Grid = Modern webcomic format

5. **Cost Savings**: Once you have good panels, experiment with dialogue using `npm run combine` instead of regenerating

6. **Public URLs**: If you set `public: true` in `BASE_SETTINGS`, you can share the Leonardo AI URLs directly

7. **Model Selection**:
   - Phoenix 1.0 = Best overall, great consistency
   - Vision XL = Detailed illustrations
   - Kino XL = Cinematic/realistic
   - Anime XL = Anime/manga style

## 🛠️ Advanced Usage

### Custom Layouts

You can modify the layout logic in `combine-panels.js` to create:
- 2x2 grids
- Staggered panels
- Different panel sizes
- Custom borders and backgrounds

### Adding More Panels

1. Add more prompts to the `PANELS` array in `comic-cover.js`
2. Add corresponding dialogue in `DIALOGUES` array in `combine-panels.js`
3. Update the loop in `combinePanelsVertical()` or `combinePanelsGrid()`

## 📝 License

ISC

## 🤝 Contributing

Feel free to customize and extend this project for your own comic creation needs!


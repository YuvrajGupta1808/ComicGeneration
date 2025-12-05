# 🎨 Comic Backend - LangChain Agent

Professional CLI agent for AI-powered comic generation workflows using LangChain and Google Gemini.

## 📋 Features

- **Interactive CLI** - Conversational interface for comic creation
- **🧠 Memory System** - Persistent and volatile memory for learning from experience
- **🤖 Decision Engine** - Intelligent retry logic and failure recovery
- **Story Generation** - AI-powered story ideas and expansion
- **Panel Generation** - Create detailed panel descriptions with camera angles
- **Character Creation** - Generate consistent character designs
- **Layout Selection** - Automatic layout selection from templates
- **Dialogue Generation** - Create dialogue, narration, and sound effects
- **Dialogue Placement (Vision)** - AI vision-based optimal dialogue bubble positioning with normalized coordinates
- **Dialogue Rendering** - Draw speech bubbles with text on panel images (white bubbles, black text)
- **Leonardo AI Integration** - Generate images using Leonardo Phoenix 1.0 with automatic retries
- **Page Composition** - Combine panels into A4 comic pages
- **Edit Tools** - Modify panels and characters after generation

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file:

```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Leonardo AI
LEONARDO_API_KEY=your_leonardo_api_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### Run the Agent

```bash
npm run langchain
```

## 🧠 Memory & Decision System

The agent now includes intelligent memory and decision-making capabilities:

### Features
- **Persistent Memory** - Learns from past successes and failures across sessions
- **Volatile Memory** - Tracks attempts and results within current session
- **Automatic Retries** - Intelligently retries failed operations with different strategies
- **Partial Success Handling** - Continues with successful panels, retries failed ones individually
- **Leonardo-Specific Strategies** - Reduces context, changes seeds, simplifies prompts on retry

### Commands
```bash
memory          # View memory status
clear session   # Reset session memory (keeps learned patterns)
```

### How It Works
When Leonardo AI or other tools fail:
1. **Evaluates error** - Determines if recoverable
2. **Decides strategy** - Reduces context, changes seed, or simplifies prompt
3. **Applies modifications** - Updates parameters automatically
4. **Retries** - Executes with new parameters (up to 3 attempts for Leonardo)
5. **Learns** - Records success/failure for future use

See [MEMORY_SYSTEM.md](./MEMORY_SYSTEM.md) for detailed documentation.

## 💬 Usage

The agent provides an interactive CLI where you can:

1. **Generate Story Ideas**
   ```
   > Give me 3 sci-fi comic story ideas
   ```

2. **Create Panels**
   ```
   > Generate panels for a 3-page space adventure story
   ```

3. **Generate Characters**
   ```
   > Create characters for the story
   ```

4. **Add Dialogue**
   ```
   > Generate dialogue with a dramatic tone
   ```

5. **Generate Images**
   ```
   > Generate images with Leonardo AI
   ```

6. **Place Dialogue (Vision)**
   ```
   > Place the dialogue on the panels using vision
   ```

7. **Compose Pages**
   ```
   > Compose the panels into pages
   ```

7. **Edit Content**
   ```
   > Change the description of panel 7
   > Update the dialogue in panel 2
   ```

## 🛠️ Available Tools

### Panel Generation
- Generates panel descriptions with camera angles
- Determines context images for visual continuity
- Saves to `config/comic.yaml`

### Character Generation
- Creates character descriptions from panel content
- Generates full-body reference images
- Saves to `config/characters.yaml` and `config/comic.yaml`

### Layout Selection
- Selects appropriate layout from `config/layouts.yaml`
- Supports 3-page, 4-page, and 5-page stories
- Returns panel dimensions and structure

### Dialogue Generation
- Creates dialogue, narration, and sound effects
- Generates cover page titles
- Context-aware based on characters and panels

### Dialogue Placement (Vision) ✨ NEW
- Uses Gemini Vision to analyze panel images
- Determines optimal dialogue bubble positions
- Normalized coordinates (0-1 range) for any panel size
- Calculates speech tail directions
- Maintains proper reading order
- Avoids covering faces and important visuals

### Dialogue Rendering ✨ NEW
- Renders dialogue bubbles with text on panel images
- Multiple bubble types: speech, narration, title, thought
- White bubbles with black text for readability
- Automatic word wrapping
- Uploads to Cloudinary (`comic/panels_with_text/`)
- See [DIALOGUE_RENDERING_SUMMARY.md](./DIALOGUE_RENDERING_SUMMARY.md) for details

### Leonardo Image Generation
- Generates character reference images
- Creates panel images with context
- Uploads to Cloudinary automatically

### Page Composition
- Combines panels into A4 pages
- Uses layouts from `config/layouts.yaml`
- Uploads final pages to Cloudinary

### Edit Panel
- Modify any field in comic.yaml
- Update descriptions, dialogue, narration, titles
- Works for both panels and characters

## 📁 Configuration Files

- `config/agent.yaml` - Agent configuration
- `config/comic.yaml` - Generated comic data (panels, characters, dialogue)
- `config/layouts.yaml` - Page layout templates
- `config/characters.yaml` - Character definitions
- `config/dialogue.yaml` - Dialogue templates
- `config/panels.yaml` - Panel templates

## 🎯 Workflow

1. **Story & Panels** → Generate story ideas and panel descriptions
2. **Characters** → Create character designs based on panels
3. **Dialogue** → Add dialogue, narration, and sound effects
4. **Images** → Generate images with Leonardo AI
5. **Dialogue Placement** → Use vision to position dialogue bubbles
6. **Render Dialogue** → Draw text bubbles on panel images
7. **Pages** → Compose panels into final comic pages
8. **Edit** → Refine any aspect as needed

## 🔧 Scripts

```bash
npm start              # Run basic agent
npm run dev            # Run with nodemon (auto-reload)
npm run langchain      # Run LangChain agent (recommended)
npm test               # Run tests
```

## 📝 Dependencies

- **LangChain** - AI orchestration framework
- **Google Gemini** - LLM for agent intelligence
- **Leonardo AI** - Image generation
- **Cloudinary** - Image storage and CDN
- **Canvas** - Image processing
- **Sharp** - Image manipulation
- **YAML** - Configuration management

## 💡 Tips

- Start with story ideas to get inspiration
- Generate panels before characters for best results
- Use dialogue generation after characters are created
- Edit specific panels/characters as needed before image generation
- The agent maintains conversation context for natural interaction

## 🛠️ Advanced Usage

### Custom Layouts

Edit `config/layouts.yaml` to add custom page layouts with different panel arrangements.

### Character Templates

Modify character descriptions in `config/comic.yaml` to adjust appearance and style.

### Dialogue Customization

Use genre and tone parameters when generating dialogue:
```
> Generate dialogue with a humorous tone for a fantasy genre
```

## 📝 License

ISC

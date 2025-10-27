# 🎨 Comic Generation CLI Agent - 1 Week Implementation Plan

## 📋 Project Overview

A professional CLI agent with context memory that orchestrates comic generation workflows using existing Leonardo AI and Cloudinary infrastructure. The agent provides intelligent tool integration for comic generation, layout selection, dialogue management, and page rendering.

## 🏗️ Architecture Overview

### **Core Components**
```
comic-backend/
├── src/
│   ├── core/
│   │   ├── agent.js              # Main orchestrator
│   │   ├── memory.js             # Context memory system
│   │   ├── cli.js                # CLI interface
│   │   └── tool-registry.js      # Tool management
│   ├── tools/
│   │   ├── comic-generation.js   # Leonardo AI integration
│   │   ├── layout-selection.js   # Template-based layout selection
│   │   ├── dialogue-generation.js # AI dialogue creation
│   │   ├── dialogue-insert.js    # Text placement & styling
│   │   └── show-pages.js         # Preview & export
│   ├── templates/
│   │   ├── layouts/              # Fixed layout templates
│   │   ├── stories/              # Story templates
│   │   └── characters/           # Character templates
│   └── utils/
│       ├── config.js             # Configuration management
│       ├── logger.js             # Professional logging
│       └── validators.js         # Input validation
├── config/
│   ├── agent.yaml                # Agent configuration
│   └── layouts.yaml              # Layout template definitions
└── package.json
```

## 🛠️ Technology Stack

### **Core Frameworks & Libraries**
- **Node.js** (v18+) - Runtime environment
- **Commander.js** - CLI framework and command parsing
- **Inquirer.js** - Interactive prompts and user input
- **Chalk** - Terminal colors and styling
- **Ora** - Spinners and progress indicators
- **YAML** - Configuration file parsing
- **fs-extra** - Enhanced file system operations

### **Integration Libraries**
- **Axios** - HTTP client for API calls
- **Canvas** - Image processing and rendering
- **Sharp** - Image optimization and manipulation
- **PDF-lib** - PDF generation and manipulation

### **Existing System Integration**
- **Leonardo AI API** - Panel generation (existing)
- **Cloudinary** - Image storage and processing (existing)
- **Existing Backend** - Panel calculation and rendering (existing)

## 🎯 Fixed Layout Template System

### **Layout Template Structure**
```yaml
# layouts.yaml
layouts:
  single-panel:
    name: "Single Panel Cover"
    pages: 1
    panels_per_page: 1
    template: "cover"
    dimensions: "832x1248"
    
  two-page-story:
    name: "Two Page Story"
    pages: 2
    panels_per_page: [1, 4]
    template: "story"
    layouts:
      page1: [{ id: "panel1", size: "832x1248", y: 0.02, h: 0.96 }]
      page2: [
        { id: "panel2", size: "832x1248", y: 0.05, h: 0.41, align: "left" },
        { id: "panel3", size: "944x1104", y: 0.05, h: 0.41, align: "right" },
        { id: "panel4", size: "944x1104", y: 0.50, h: 0.41, align: "left" },
        { id: "panel5", size: "832x1248", y: 0.50, h: 0.41, align: "right" }
      ]
      
  three-page-story:
    name: "Three Page Story"
    pages: 3
    panels_per_page: [1, 4, 3]
    template: "story"
    layouts:
      page1: [{ id: "panel1", size: "832x1248", y: 0.02, h: 0.96 }]
      page2: [
        { id: "panel2", size: "832x1248", y: 0.05, h: 0.41, align: "left" },
        { id: "panel3", size: "944x1104", y: 0.05, h: 0.41, align: "right" },
        { id: "panel4", size: "944x1104", y: 0.50, h: 0.41, align: "left" },
        { id: "panel5", size: "832x1248", y: 0.50, h: 0.41, align: "right" }
      ]
      page3: [
        { id: "panel6", size: "1456x720", y: 0.03, h: 0.30 },
        { id: "panel7", size: "1456x720", y: 0.35, h: 0.30 },
        { id: "panel8", size: "1456x720", y: 0.67, h: 0.30 }
      ]
```

### **Layout Selection Logic**
```javascript
class LayoutSelectionTool {
  constructor() {
    this.templates = this.loadLayoutTemplates();
  }

  selectLayout(pageCount, storyType = 'general') {
    const availableLayouts = this.templates.filter(
      layout => layout.pages === pageCount
    );
    
    if (availableLayouts.length === 0) {
      throw new Error(`No layout template found for ${pageCount} pages`);
    }
    
    // Return the first matching layout or allow user selection
    return availableLayouts[0];
  }

  listAvailableLayouts() {
    return this.templates.map(layout => ({
      name: layout.name,
      pages: layout.pages,
      panels: layout.panels_per_page
    }));
  }
}
```

## 🧠 Context Memory System

### **Memory Architecture**
```javascript
class ContextMemory {
  constructor() {
    this.sessionData = new Map();
    this.projectData = new Map();
    this.userPreferences = new Map();
    this.actionHistory = [];
    this.toolStates = new Map();
  }

  // Core memory operations
  setContext(key, value, scope = 'session') {
    const target = this.getScopeMap(scope);
    target.set(key, value);
    this.saveContext();
  }

  getContext(key, scope = 'session') {
    const target = this.getScopeMap(scope);
    return target.get(key);
  }

  // Project-specific context
  setProject(projectName, data) {
    this.projectData.set(projectName, data);
  }

  getProject(projectName) {
    return this.projectData.get(projectName);
  }

  // Action history tracking
  addAction(action, params, result) {
    this.actionHistory.push({
      timestamp: new Date(),
      action,
      params,
      result,
      success: result.success !== false
    });
  }

  // Persistence
  saveContext() {
    const contextData = {
      sessionData: Object.fromEntries(this.sessionData),
      projectData: Object.fromEntries(this.projectData),
      userPreferences: Object.fromEntries(this.userPreferences),
      actionHistory: this.actionHistory.slice(-100) // Keep last 100 actions
    };
    fs.writeFileSync('.comic-agent-context.json', JSON.stringify(contextData, null, 2));
  }

  loadContext() {
    if (fs.existsSync('.comic-agent-context.json')) {
      const contextData = JSON.parse(fs.readFileSync('.comic-agent-context.json'));
      this.sessionData = new Map(Object.entries(contextData.sessionData || {}));
      this.projectData = new Map(Object.entries(contextData.projectData || {}));
      this.userPreferences = new Map(Object.entries(contextData.userPreferences || {}));
      this.actionHistory = contextData.actionHistory || [];
    }
  }
}
```

## 🔧 Tool Implementation

### **1. Comic Generation Tool**
```javascript
class ComicGenerationTool {
  constructor() {
    this.name = 'comic-generation';
    this.description = 'Generate comic panels using Leonardo AI';
    this.requiredParams = ['story', 'characters'];
    this.optionalParams = ['style', 'referenceImages'];
  }

  async execute(params, context) {
    const { story, characters, style = 'cinematic', referenceImages } = params;
    
    // Load existing Leonardo workflow
    const { generateComic } = await import('../api/generate.js');
    
    // Generate panels based on story structure
    const panels = this.createPanelPrompts(story, characters, style);
    const result = await generateComic(panels, referenceImages);
    
    // Store in context
    context.setContext('generatedPanels', result.panels, 'project');
    context.addAction('comic-generation', params, result);
    
    return {
      success: true,
      panels: result.panels,
      urls: result.urls,
      message: `Generated ${result.panels.length} panels successfully`
    };
  }

  createPanelPrompts(story, characters, style) {
    // Convert story structure to panel prompts
    // Use existing panel generation logic
    return story.scenes.map((scene, index) => ({
      id: `panel${index + 1}`,
      prompt: this.buildPrompt(scene, characters, style),
      width: this.getPanelWidth(scene),
      height: this.getPanelHeight(scene),
      contextImages: scene.references || []
    }));
  }
}
```

### **2. Layout Selection Tool**
```javascript
class LayoutSelectionTool {
  constructor() {
    this.name = 'layout-selection';
    this.description = 'Select layout template based on page count';
    this.templates = this.loadLayoutTemplates();
  }

  async execute(params, context) {
    const { pageCount, storyType = 'general' } = params;
    
    const selectedLayout = this.selectLayout(pageCount, storyType);
    
    if (!selectedLayout) {
      return {
        success: false,
        error: `No layout template found for ${pageCount} pages`
      };
    }
    
    // Store in context
    context.setContext('selectedLayout', selectedLayout, 'project');
    context.addAction('layout-selection', params, { layout: selectedLayout });
    
    return {
      success: true,
      layout: selectedLayout,
      message: `Selected ${selectedLayout.name} layout`
    };
  }

  selectLayout(pageCount, storyType) {
    return this.templates.find(
      layout => layout.pages === pageCount && 
      (layout.template === storyType || layout.template === 'general')
    );
  }

  loadLayoutTemplates() {
    const yaml = require('yaml');
    const layoutsConfig = fs.readFileSync('./config/layouts.yaml', 'utf8');
    return yaml.parse(layoutsConfig).layouts;
  }
}
```

### **3. Dialogue Generation Tool**
```javascript
class DialogueGenerationTool {
  constructor() {
    this.name = 'dialogue-generation';
    this.description = 'Generate contextual dialogue for panels';
  }

  async execute(params, context) {
    const { panels, storyContext, characters } = params;
    
    // Generate dialogue based on panel content and story context
    const dialogues = panels.map((panel, index) => {
      return this.generateDialogueForPanel(panel, storyContext, characters, index);
    });
    
    // Store in context
    context.setContext('generatedDialogues', dialogues, 'project');
    context.addAction('dialogue-generation', params, { dialogues });
    
    return {
      success: true,
      dialogues,
      message: `Generated dialogue for ${dialogues.length} panels`
    };
  }

  generateDialogueForPanel(panel, storyContext, characters, index) {
    // Simple dialogue generation based on story context
    // In a real implementation, this would use AI/LLM
    const sceneDialogue = storyContext.scenes[index]?.dialogue || [];
    
    return {
      panelId: panel.id,
      bubbles: sceneDialogue.map(bubble => ({
        text: bubble.text,
        speaker: bubble.speaker,
        x: bubble.x || this.calculateDefaultX(panel),
        y: bubble.y || this.calculateDefaultY(panel),
        style: bubble.style || 'speech'
      }))
    };
  }
}
```

### **4. Dialogue Insert Tool**
```javascript
class DialogueInsertTool {
  constructor() {
    this.name = 'dialogue-insert';
    this.description = 'Insert and style dialogue bubbles';
  }

  async execute(params, context) {
    const { panels, dialogues } = params;
    
    // Use existing text rendering system
    const { addTextToAllPanels } = await import('../render/drawText.js');
    
    const enhancedPanels = await addTextToAllPanels(panels, dialogues);
    
    // Store in context
    context.setContext('panelsWithDialogue', enhancedPanels, 'project');
    context.addAction('dialogue-insert', params, { enhancedPanels });
    
    return {
      success: true,
      enhancedPanels,
      message: `Added dialogue to ${enhancedPanels.length} panels`
    };
  }
}
```

### **5. Show Pages Tool**
```javascript
class ShowPagesTool {
  constructor() {
    this.name = 'show-pages';
    this.description = 'Preview and export comic pages';
  }

  async execute(params, context) {
    const { format = 'preview', layout } = params;
    
    // Get panels from context
    const panels = context.getContext('panelsWithDialogue', 'project');
    const selectedLayout = layout || context.getContext('selectedLayout', 'project');
    
    if (!panels || !selectedLayout) {
      return {
        success: false,
        error: 'Missing panels or layout data'
      };
    }
    
    // Use existing rendering system
    const { renderAll } = await import('../render/renderAll.js');
    
    const pages = await renderAll(panels, selectedLayout);
    
    // Store in context
    context.setContext('finalPages', pages, 'project');
    context.addAction('show-pages', params, { pages });
    
    return {
      success: true,
      pages,
      message: `Generated ${pages.length} pages successfully`
    };
  }
}
```

## 🖥️ CLI Interface

### **Command Structure**
```javascript
// cli.js
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

class ComicCLI {
  constructor() {
    this.program = new Command();
    this.context = new ContextMemory();
    this.tools = new ToolRegistry();
    this.setupCommands();
  }

  setupCommands() {
    // Main workflow commands
    this.program
      .command('generate <story-file>')
      .description('Generate comic from story file')
      .option('-l, --layout <type>', 'Layout template type')
      .option('-s, --style <style>', 'Art style')
      .action(this.handleGenerate.bind(this));

    this.program
      .command('layout')
      .description('Select layout template')
      .option('-p, --pages <count>', 'Number of pages')
      .action(this.handleLayout.bind(this));

    this.program
      .command('dialogue')
      .description('Generate dialogue for panels')
      .option('-m, --mode <mode>', 'Dialogue generation mode')
      .action(this.handleDialogue.bind(this));

    this.program
      .command('preview')
      .description('Preview generated pages')
      .action(this.handlePreview.bind(this));

    this.program
      .command('export <format>')
      .description('Export comic in specified format')
      .action(this.handleExport.bind(this));

    // Context management commands
    this.program
      .command('context')
      .description('Manage context memory')
      .action(this.handleContext.bind(this));

    this.program
      .command('history')
      .description('Show command history')
      .action(this.handleHistory.bind(this));
  }

  async handleGenerate(storyFile, options) {
    const spinner = ora('Generating comic panels...').start();
    
    try {
      // Load story file
      const story = this.loadStoryFile(storyFile);
      
      // Generate panels
      const result = await this.tools.execute('comic-generation', {
        story,
        style: options.style || 'cinematic'
      }, this.context);
      
      spinner.succeed(chalk.green(`Generated ${result.panels.length} panels`));
      
      // Auto-select layout if not specified
      if (!options.layout) {
        const layoutResult = await this.tools.execute('layout-selection', {
          pageCount: story.pages || 3
        }, this.context);
        
        console.log(chalk.blue(`Selected layout: ${layoutResult.layout.name}`));
      }
      
    } catch (error) {
      spinner.fail(chalk.red(`Generation failed: ${error.message}`));
    }
  }

  async handleLayout(options) {
    const pageCount = options.pages || await this.promptPageCount();
    
    const result = await this.tools.execute('layout-selection', {
      pageCount: parseInt(pageCount)
    }, this.context);
    
    if (result.success) {
      console.log(chalk.green(`✓ Selected layout: ${result.layout.name}`));
      console.log(chalk.blue(`  Pages: ${result.layout.pages}`));
      console.log(chalk.blue(`  Panels per page: ${result.layout.panels_per_page.join(', ')}`));
    } else {
      console.log(chalk.red(`✗ Layout selection failed: ${result.error}`));
    }
  }

  async promptPageCount() {
    const { pageCount } = await inquirer.prompt([{
      type: 'number',
      name: 'pageCount',
      message: 'How many pages do you want?',
      default: 3,
      validate: (value) => value > 0 && value <= 10
    }]);
    return pageCount;
  }
}
```

## 📅 1-Week Implementation Timeline

### **Day 1: Foundation & Setup**
- [ ] **Morning**: Project setup, package.json, dependencies installation
- [ ] **Afternoon**: Core agent structure, CLI framework setup
- [ ] **Evening**: Basic command structure and help system

### **Day 2: Context Memory System**
- [ ] **Morning**: Context memory implementation
- [ ] **Afternoon**: Persistence and session management
- [ ] **Evening**: Action history tracking

### **Day 3: Layout Templates & Selection**
- [ ] **Morning**: Layout template system implementation
- [ ] **Afternoon**: Layout selection tool
- [ ] **Evening**: Template validation and error handling

### **Day 4: Comic Generation Integration**
- [ ] **Morning**: Comic generation tool implementation
- [ ] **Afternoon**: Integration with existing Leonardo workflow
- [ ] **Evening**: Panel prompt generation and optimization

### **Day 5: Dialogue System**
- [ ] **Morning**: Dialogue generation tool
- [ ] **Afternoon**: Dialogue insert tool
- [ ] **Evening**: Text positioning and styling

### **Day 6: Preview & Export**
- [ ] **Morning**: Show pages tool implementation
- [ ] **Afternoon**: Preview system and export functionality
- [ ] **Evening**: Integration testing

### **Day 7: Polish & Testing**
- [ ] **Morning**: Error handling and validation
- [ ] **Afternoon**: User experience improvements
- [ ] **Evening**: Documentation and final testing

## 🎯 Success Criteria

### **Functional Requirements**
- [ ] All 5 core tools implemented and functional
- [ ] Context memory persists across sessions
- [ ] Layout templates work for 1-5 page comics
- [ ] Integration with existing backend maintains functionality
- [ ] CLI responds to commands in <3 seconds

### **User Experience Requirements**
- [ ] Intuitive command structure
- [ ] Clear error messages and help text
- [ ] Professional output formatting
- [ ] Context-aware suggestions
- [ ] Comprehensive help system

## 🔧 Configuration Files

### **package.json**
```json
{
  "name": "comic-cli-agent",
  "version": "1.0.0",
  "description": "Professional CLI agent for comic generation",
  "main": "src/core/agent.js",
  "bin": {
    "comic-agent": "./bin/comic-agent.js"
  },
  "scripts": {
    "start": "node src/core/agent.js",
    "dev": "nodemon src/core/agent.js",
    "test": "jest",
    "build": "pkg . --out-path dist"
  },
  "dependencies": {
    "commander": "^11.1.0",
    "inquirer": "^9.2.12",
    "chalk": "^5.3.0",
    "ora": "^7.0.1",
    "yaml": "^2.3.4",
    "fs-extra": "^11.2.0",
    "axios": "^1.6.0",
    "canvas": "^2.11.2",
    "sharp": "^0.33.0",
    "pdf-lib": "^1.17.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "jest": "^29.7.0",
    "pkg": "^5.8.0"
  }
}
```

### **agent.yaml**
```yaml
agent:
  name: "Comic Generation Agent"
  version: "1.0.0"
  description: "Professional CLI agent for comic generation workflows"
  
memory:
  persistence: true
  maxHistory: 1000
  autoSave: true
  contextFile: ".comic-agent-context.json"
  
tools:
  comic-generation:
    enabled: true
    timeout: 300000
    retries: 3
    defaultStyle: "cinematic"
    
  layout-selection:
    enabled: true
    templatesFile: "./config/layouts.yaml"
    
  dialogue-generation:
    enabled: true
    defaultMode: "context-aware"
    
  dialogue-insert:
    enabled: true
    defaultStyle: "speech"
    
  show-pages:
    enabled: true
    defaultFormat: "preview"
    
logging:
  level: "info"
  format: "colored"
  file: "comic-agent.log"
```

## 🚀 Getting Started

### **Installation**
```bash
# Navigate to comic-backend directory
cd comic-backend

# Install dependencies
npm install

# Make executable
chmod +x bin/comic-agent.js

# Test installation
node bin/comic-agent.js --help
```

### **AI Setup (Required for Full Functionality)**
```bash
# If you already have ANTHROPIC_API_KEY in your environment, skip this step
# Otherwise, get API key from https://console.anthropic.com/
# Set environment variable
export ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# Verify AI integration
node bin/comic-agent.js characters --count 2
```

### **Running the CLI Agent**

#### **Method 1: Direct Node Execution**
```bash
# From comic-backend directory
node bin/comic-agent.js [command] [options]

# Examples:
node bin/comic-agent.js --help
node bin/comic-agent.js layout --pages 3
node bin/comic-agent.js interactive
```

#### **Method 2: Using npm scripts**
```bash
# Start the agent
npm start

# Development mode with auto-restart
npm run dev

# Build executable
npm run build
```

#### **Method 3: Global Installation (Optional)**
```bash
# Install globally
npm install -g .

# Then use from anywhere
comic-agent --help
comic-agent layout --pages 3
```

### **Basic Usage**
```bash
# Generate characters using AI
node bin/comic-agent.js characters --count 3 --genre fantasy

# Generate comic from story (with AI-enhanced panels)
node bin/comic-agent.js generate story.json

# Select layout template
node bin/comic-agent.js layout --pages 3

# Generate dialogue using AI
node bin/comic-agent.js dialogue --mode context-aware

# Preview pages
node bin/comic-agent.js preview

# Export final comic
node bin/comic-agent.js export pdf

# Show context
node bin/comic-agent.js context --show

# View history
node bin/comic-agent.js history
```

### **Interactive Mode**
```bash
# Start interactive session with AI assistant
node bin/comic-agent.js interactive

# Commands available in interactive mode:
# CLI Commands:
#   characters --count 3 --genre fantasy
#   generate <story-file>
#   layout --pages 3
#   dialogue --mode context-aware
#   preview
#   export <format>
#   context show
#   history
#   help
#   exit

# AI Conversation (when API key is set):
#   "Help me create a superhero story"
#   "What makes good comic dialogue?"
#   "Suggest character ideas for a fantasy comic"
#   "How do I improve my story pacing?"
```

### **Configuration**
The agent uses configuration files in the `config/` directory:
- `config/agent.yaml` - Agent settings, tool configurations, and Anthropic API settings
- `config/layouts.yaml` - Layout templates for different page counts

Context is automatically saved to `.comic-agent-context.json` in the current directory.

### **Environment Variables**
```bash
# Required for AI features (if not already set)
# export ANTHROPIC_API_KEY="your-anthropic-api-key"

# Optional: Override default model
export ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"

# Optional: Set log level
export LOG_LEVEL="info"
```

## 🛠️ Utility Files

### **Configuration Management (`src/utils/config.js`)**
- `ConfigManager` class for loading and managing configuration files
- Supports YAML and JSON formats
- Automatic validation and error handling
- Default configuration fallbacks
- Import/export functionality

### **Input Validation (`src/utils/validators.js`)**
- `Validators` class with static validation methods
- Validates story files, panels, dialogues, layouts
- File path and format validation
- Character and art style validation
- Comprehensive error and warning reporting

### **Professional Logging (`src/utils/logger.js`)**
- `Logger` class with multiple log levels
- Colored console output
- File logging with rotation
- Structured log entries with metadata
- Configurable log levels and formats

## 📝 Story File Format

### **story.json**
```json
{
  "title": "Mars Adventure",
  "pages": 3,
  "characters": [
    {
      "name": "Rhea",
      "description": "Astronaut on Mars",
      "references": ["rhea_ref.png"]
    },
    {
      "name": "Eli",
      "description": "Mission control operator",
      "references": ["eli_ref.png"]
    }
  ],
  "scenes": [
    {
      "panel": 1,
      "description": "Rhea stands on Martian plateau at dusk",
      "dialogue": [
        {
          "speaker": "Rhea",
          "text": "Another day on Mars...",
          "x": 300,
          "y": 100
        }
      ]
    },
    {
      "panel": 2,
      "description": "Inside Mars outpost, Rhea adjusts comm terminal",
      "dialogue": [
        {
          "speaker": "Eli",
          "text": "Rhea, can you hear me?",
          "x": 400,
          "y": 150
        }
      ]
    }
  ]
}
```

This plan provides a comprehensive, week-long implementation strategy for a professional CLI agent that leverages the existing comic generation infrastructure while adding intelligent context memory and tool orchestration capabilities.

# 🎨 Comic Generation Platform

An AI-powered comic generation platform that combines Leonardo AI image generation with intelligent layout composition and dialogue management.

## 📁 Project Structure

This monorepo contains three main components:

- **comic-backend** - LangChain-based CLI agent for comic generation workflows
- **comic-backend_v2** - Leonardo AI comic generator with advanced rendering
- **comic-frontend** - React-based web interface for comic creation

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Leonardo AI API key
- Cloudinary account (for image storage)
- Google Gemini API key (for comic-backend)

### Installation

```bash
# Install all dependencies
npm install --prefix comic-backend
npm install --prefix comic-backend_v2
npm install --prefix comic-frontend
```

### Environment Setup

Each project requires its own `.env` file. See individual project READMEs for details.

### Running the Application

**Manual Startup (Simple)**

Open two terminal windows:

**Terminal 1 - Start Backend Server:**
```bash
cd comic-backend
npm run langchain
```
Wait for the message: `✓ Server running on http://localhost:8000`

**Terminal 2 - Start Frontend:**
```bash
cd comic-frontend
npm start
```
The frontend will open automatically at `http://localhost:3000`

**That's it!** The frontend connects to the backend at `http://localhost:8000`

## 🎯 Features

- **AI-Powered Panel Generation** - Generate comic panels with Leonardo AI
- **Character Consistency** - Maintain character appearance across panels
- **Smart Layouts** - Automatic page composition with multiple layout options
- **Dialogue Management** - Add speech bubbles, narration, and sound effects
- **Interactive CLI** - Conversational agent for comic creation
- **Web Interface** - User-friendly frontend for comic generation
- **Cloudinary Integration** - Direct display of generated panels in the frontend

## 🎨 Workflow: From Generation to Display

### Simple 3-Step Workflow

#### 1️⃣ Start Both Servers

**Terminal 1 - Backend:**
```bash
cd comic-backend
npm run langchain
```

**Terminal 2 - Frontend:**
```bash
cd comic-frontend
npm start
```

Open `http://localhost:3000` in your browser.

#### 2️⃣ Generate Your Comic

In the frontend chat, have a conversation with the agent:

```
You: "Create a sci-fi comic about a space explorer"

Agent: 
✅ Generated 8 panels successfully!
▸ Panel 1 (establishing-shot): [description]
▸ Panel 2 (medium-shot): [description]
...

You: "Generate characters"

Agent:
✅ Generated 2 characters successfully!
👤 Character 1 (char_1): [details]
👤 Character 2 (char_2): [details]

You: "Generate images"

Agent:
✅ Comic panels generated! Your comic grid is now displayed in the frontend.
```

#### 3️⃣ View Your Comic

**That's it!** The comic grid automatically appears with all your generated panels. 🎉

The system automatically:
- Generates images with Leonardo AI
- Uploads to Cloudinary
- Sends URLs to the frontend
- Displays the comic grid

No copying, pasting, or manual steps needed!

## 📚 Documentation

- [comic-backend README](./comic-backend/README.md) - LangChain agent documentation
- [comic-backend_v2 README](./comic-backend_v2/README.md) - Leonardo generator documentation
- [comic-frontend README](./comic-frontend/README.md) - Frontend documentation

## 🛠️ Tech Stack

- **Backend**: Node.js, LangChain, Leonardo AI, Cloudinary
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **AI Models**: Google Gemini, Leonardo Phoenix 1.0
- **Image Processing**: Sharp, Canvas

## 📝 License

ISC

## 🤝 Contributing

Contributions are welcome! Please check individual project READMEs for specific guidelines.

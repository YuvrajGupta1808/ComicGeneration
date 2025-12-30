# 🎨 Comic Generation Platform

An AI-powered comic generation platform that combines Leonardo AI image generation with intelligent layout composition and dialogue management.

## 📁 Project Structure

This monorepo contains two main components:

- **comic-backend** - LangChain-based agent for comic generation with Leonardo AI
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
npm install --prefix comic-frontend
```

### Environment Setup

Each project requires its own `.env` file. See individual project READMEs for details.

### Running the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd comic-backend
npm run langchain
```
Wait for: `✓ Server running on http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
cd comic-frontend
npm start
```
Opens automatically at `http://localhost:3000`

## 🎯 Features

- **AI-Powered Panel Generation** - Generate comic panels with Leonardo AI
- **Character Consistency** - Maintain character appearance across panels
- **Smart Layouts** - Automatic page composition with multiple layout options
- **Dialogue Management** - Add speech bubbles, narration, and sound effects
- **Interactive Agent** - Conversational interface for comic creation
- **Web Interface** - User-friendly frontend for comic generation
- **Cloudinary Integration** - Direct display of generated panels

## 🎨 Usage

Chat with the agent in the frontend:

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

The system automatically generates images with Leonardo AI, uploads to Cloudinary, and displays your comic grid. No manual steps needed!

## 📚 Documentation

- [comic-backend README](./comic-backend/README.md) - LangChain agent documentation
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

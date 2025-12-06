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

### For testing frontend + backend
```bash
cd comic-frontend
npm start

cd comic-backend_v2
npm run server
```

### Environment Setup
```bash
# For Backend_v2 env file
## Backend Port
PORT=4000

## Disable mock mode (use real Leonardo + real Cloudinary)
USE_MOCK_LEONARDO=false

## Leonardo API Key (required for real AI generation)
LEONARDO_API_KEY=your leonardo api key here

## Cloudinary credentials (for uploading generated images)
CLOUDINARY_CLOUD_NAME=your cloudinary cloud name here
CLOUDINARY_API_KEY=your cloudinary api key here
CLOUDINARY_API_SECRET=your cloudinary api secret here
```
```bash
# For Front End env file
## URL of the backend server
REACT_APP_API_BASE_URL=http://localhost:4000

## Use real backend, not mock mode. 
REACT_APP_USE_MOCK=false
```

## 🎯 Features

- **AI-Powered Panel Generation** - Generate comic panels with Leonardo AI
- **Character Consistency** - Maintain character appearance across panels
- **Smart Layouts** - Automatic page composition with multiple layout options
- **Dialogue Management** - Add speech bubbles, narration, and sound effects
- **Interactive CLI** - Conversational agent for comic creation
- **Web Interface** - User-friendly frontend for comic generation

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

# LangChain Comic Agent

AI-powered comic generation assistant using LangChain and Google Gemini.

## Overview

The LangChain Comic Agent is an interactive CLI tool that helps with comic book creation tasks using Google's Gemini Flash model through LangChain. It provides conversational AI assistance for:

- Story development and plot structure
- Character design and development
- Dialogue writing
- Layout and composition suggestions
- Art style guidance
- World building
- Theme and symbolism

## Prerequisites

1. **Google Gemini API Key**: Get your API key from Google AI Studio
   - Visit: https://makersuite.google.com/app/apikey
   - Or: https://aistudio.google.com/app/apikey

2. **Dependencies**: All required packages are in `package.json`

## Installation

```bash
cd comic-backend
npm install
```

## Usage

### Interactive Mode (Default)

Start an interactive chat session:

```bash
npm run langchain
# or
node bin/langchain-agent.js
```

This starts a conversational interface where you can chat with the assistant about comic creation.

### Single Prompt Mode

Send a single prompt and get a response:

```bash
npm run langchain -- chat "How do I create compelling dialogue?"
# or
node bin/langchain-agent.js chat "How do I create compelling dialogue?"
```

### Direct Script Execution

Run the core agent directly:

```bash
npm run langchain-agent
# or
node src/core/langchain-agent.js
```

## Configuration

### Environment Variables

Create a `.env` file or set environment variables:

```bash
# Gemini API configuration
GEMINI_API_KEY=your-api-key-here          # Required
# or
GOOGLE_API_KEY=your-api-key-here          # Alternative name
```

### Features

- **Conversational Memory**: Maintains context across multiple exchanges (last 10 messages)
- **Colored Output**: Enhanced CLI experience with chalk
- **Error Handling**: Graceful error messages and recovery
- **Simple & Fast**: Streamlined Gemini integration
- **Context-Aware**: Remembers previous conversation

## Example Conversations

### Story Development
```
> Create a short sci-fi story about a robot finding emotions

> What are some tips for pacing a 3-page comic?

> How should I structure my story arc?
```

### Character Development
```
> Help me design a superhero with unique powers

> How do I make my villain more compelling?

> What makes a character relatable to readers?
```

### Technical Advice
```
> What panel layout works best for action scenes?

> How do I create visual tension in a comic?

> What art styles work well for horror comics?
```

## Architecture

### Core Components

- **`src/core/langchain-agent.js`**: Main agent class with LangChain integration
- **`bin/langchain-agent.js`**: CLI entry point with commander
- Uses `@langchain/google-genai` for Gemini model integration
- Simple conversational interface with LangChain

### Conversation Flow

1. User input received via readline
2. Input added to conversation history
3. System prompt + history sent to Gemini via LangChain
4. Gemini generates response
5. Response displayed and added to history
6. Session continues until "exit" or "quit"

## Troubleshooting

### API Key Issues

If you get authentication errors:

```bash
# Check if API key is set
echo $GEMINI_API_KEY

# Or check .env file
cat .env

# Make sure it's set in .env
echo "GEMINI_API_KEY=your-key-here" >> .env
```

### Gemini API Errors

If you get rate limit or API errors:

- Check your API key is valid at https://makersuite.google.com/app/apikey
- Ensure you have quota remaining
- Check your network connection

### Dependencies Issues

If modules are missing:

```bash
npm install
```

## Differences from Main Agent

The LangChain agent focuses on:
- **Conversational AI**: Pure chat interface for creative assistance
- **No complex workflows**: Simpler, more focused on dialogue
- **LangChain integration**: Uses LangChain's Gemini integration
- **Cloud-based**: Uses Google Gemini API (internet required)

The main `comic-agent` provides:
- **Complex workflows**: Story → Character → Comic generation
- **Structured tools**: File generation, layout selection, etc.
- **Context memory**: Persistent session data
- **Multiple providers**: Anthropic + Ollama (local and cloud)

## Development

### Adding New Features

To extend the agent:

1. Update `src/core/langchain-agent.js`:
   - Add new methods to `LangChainComicAgent`
   - Extend `generateResponse()` for specialized prompts
   - Add conversation state management

2. Update `bin/langchain-agent.js`:
   - Add new commands with commander
   - Integrate with new agent methods

### Testing

```bash
# Interactive testing
npm run langchain

# Single prompt testing
npm run langchain -- chat "test prompt"

# Development with auto-reload (requires nodemon)
npm run dev -- bin/langchain-agent.js
```

## License

Part of the ComicGeneration project.


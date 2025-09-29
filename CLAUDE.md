# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that implements an interactive chess game. It exposes chess functionality through MCP tools and provides a web-based chessboard interface using MCP-UI.

## Development Commands

- `npm run dev` - Start the development server (runs `tsx src/server.ts`)
- `npm run format` - Format code with Biome
- `npm run lint` - Lint and fix code with Biome

The server runs on `http://localhost:3000/mcp`

## Architecture

### MCP Server with Express Integration

This project uses a **custom MCP middleware framework** that integrates MCP servers with Express.js. Understanding this architecture is critical:

1. **Server Creation Pattern** (`src/server.ts:76-130`):
   - `newServer()` creates a new `McpServer` instance for each session
   - Tools are registered using `server.registerTool()` with Zod schemas for validation
   - Tool handlers receive arguments and a context object with `sessionId`

2. **Custom MCP Middleware** (`src/lib/mcp/middleware.ts`):
   - `Middleware(newServer)` function wraps the server creation function
   - Manages session lifecycle and transport layer
   - Maps HTTP requests to MCP protocol using `StreamableHTTPServerTransport`
   - Session IDs come from `mcp-session-id` header (see `src/lib/mcp/header.ts`)
   - Maintains a registry of active transports keyed by session ID

3. **Game State Management** (`src/lib/store.ts`):
   - Games persist to `./games/{sessionId}.json` as FEN strings
   - `loadGame(sessionId)` retrieves existing games or returns null
   - `saveGame(sessionId, game)` persists the current game state
   - Session ID from MCP context ties games to specific clients

### MCP Tool Implementation

Two tools are exposed:

- **`chess_get_board_state`**: Returns current board state (no arguments)
- **`chess_move`**: Makes a move or starts new game
  - Takes `move` string (algebraic notation like "e4" or "new")
  - Validates moves using chess.js library

### Response Format

Tool responses include two content types:
1. **Text content**: ASCII board + FEN + valid moves list
2. **UI resource**: Interactive chessboard using ChessBoard.js
   - Board allows drag-and-drop moves
   - Moves trigger `chess_move` tool via `window.parent.postMessage`
   - Created with `@mcp-ui/server` package's `createUIResource()`

## Key Dependencies

- **@modelcontextprotocol/sdk**: Core MCP protocol implementation
- **@mcp-ui/server**: Creates embeddable UI resources for MCP responses
- **chess.js**: Chess game logic and move validation
- **express**: HTTP server framework
- **tsx**: TypeScript execution for development

## Workshop Structure

The `./workshop` directory contains step-by-step implementations (step1 through step5). Each step is a self-contained workspace with its own package.json and demonstrates progressive feature additions.
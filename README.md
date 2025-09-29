# Chess MCP Server

A Model Context Protocol (MCP) server that provides an interactive chess game experience using MCP-UI. This server exposes chess game functionality through MCP tools and provides a web-based chessboard interface for playing games.

## Features

- ♟️ **Full Chess Game**: Complete chess implementation using chess.js
- 🔧 **MCP Tools**: Chess game actions exposed as MCP tools
- 🎮 **Interactive UI**: Web-based chessboard using ChessBoard.js
- 💾 **Game State Management**: Persistent game state with session-based saves

## Architecture

This MCP server is built using Express.js with integrated MCP capabilities:

### Key Components

- **MCP Server** (`src/server.ts`): Main server with chess tools and UI generation
- **Store** (`src/lib/store.ts`): Game state persistence using file system
- **MCP Framework** (`src/lib/mcp/`): Custom MCP middleware implementation with Express integration

### MCP Tools Available

- `chess_get_board_state`: Get the current state of the chess board with visual representation
- `chess_move`: Make a move in standard algebraic notation (e.g., e4, Nf3, O-O) or start a new game

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The server will be available at:

- MCP endpoint: `http://localhost:3000/mcp`

### Development Commands

- `npm run dev` - Start development server

## Usage

### As an MCP Server

The server exposes MCP tools that can be consumed by MCP clients:

```typescript
// Get current board state
{
  "method": "tools/call",
  "params": {
    "name": "chess_get_board_state",
    "arguments": {}
  }
}

// Make a move
{
  "method": "tools/call",
  "params": {
    "name": "chess_move",
    "arguments": {
      "move": "e4"
    }
  }
}

// Start a new game
{
  "method": "tools/call",
  "params": {
    "name": "chess_move",
    "arguments": {
      "move": "new"
    }
  }
}
```

### Interactive Chessboard

When using the MCP tools, each response includes:
- **Text representation**: ASCII board and FEN notation with valid moves
- **Interactive UI**: Drag-and-drop chessboard that allows moves via mouse interaction

## Game Rules

- Standard chess rules apply
- Uses chess.js for move validation and game logic
- Supports all legal chess moves including castling, en passant, and pawn promotion
- Game state persists per session ID

## Project Structure

```
src/
├── lib/
│   ├── mcp/           # Custom MCP middleware framework
│   │   ├── index.ts   # Main exports
│   │   ├── middleware.ts  # Express middleware integration
│   │   ├── header.ts  # HTTP header utilities
│   │   └── uuid.ts    # UUID validation
│   └── store.ts       # Game state persistence
├── server.ts          # Main server with chess tools and UI
games/                 # Persistent game files (FEN notation)
```

## Game State Persistence

- Each chess game is saved to a JSON file in the `games/` directory
- Games are identified by MCP session ID
- Game state is stored as FEN (Forsyth-Edwards Notation) strings
- Games automatically resume when reconnecting with the same session

## Dependencies

- **chess.js**: Chess game logic and move validation
- **@chrisoakman/chessboardjs**: Interactive chessboard UI
- **@mcp-ui/server**: MCP UI resource creation
- **@modelcontextprotocol/sdk**: MCP server implementation
- **express**: Web server framework

## License

Apache 2.0 License - see LICENSE file for details.

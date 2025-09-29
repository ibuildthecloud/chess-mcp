# Chess MCP Server Workshop

Build a fully functional Chess MCP (Model Context Protocol) server with an interactive UI that allows AI agents to play chess!

## Workshop Overview

In this workshop, you'll build a Chess MCP server from the ground up, learning how to:
- Create MCP servers with HTTP transport
- Register tools that AI agents can use
- Implement stateful sessions
- Add interactive UIs to MCP responses
- Integrate with AI agents using nanobot

## Prerequisites

- Node.js 20+ installed
- Basic TypeScript knowledge
- Text editor or IDE
- Terminal/command line access
- Nanobot installed `brew install nanobot-ai/tap/nanobot` or download from [here](https://github.com/nanobot-ai/nanobot/releases)

## What We'll Build

By the end of this workshop, you'll have created a Chess MCP server that:
- Accepts chess moves in algebraic notation
- Maintains game state across sessions
- Displays the board in ASCII and graphical format
- Allows AI agents (and users) to play interactive chess games
- Provides an interactive chessboard UI with drag-and-drop moves

---

## Step 1: Basic MCP Server Setup

In this step, you'll create a minimal MCP server with a simple tool to understand the fundamentals.

### What You'll Learn
- MCP server structure and configuration
- How to register tools with the MCP SDK
- HTTP transport middleware setup
- Basic request/response handling

### Implementation

1. **Initialize the project:**

```bash
mkdir chess && cd chess
npm init -y
```

2. **Install dependencies:**

```bash
npm install @modelcontextprotocol/sdk express zod
npm install -D @biomejs/biome @types/express @types/node tsx typescript
```

3. **Create tsconfig.json:**

```json
{
  "include": ["src/**/*"],
  "exclude": ["src/**/*.test.ts", "src/**/*.spec.ts"],
  "compilerOptions": {
    "allowJs": true,
    "baseUrl": ".",
    "checkJs": true,
    "composite": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ES2022",
    "moduleResolution": "bundler",
    "noEmit": true,
    "resolveJsonModule": true,
    "rootDirs": ["."],
    "skipLibCheck": true,
    "strict": true,
    "target": "ES2022",
    "types": ["vite/client", "node"],
    "verbatimModuleSyntax": true
  }
}
```

4. **Update package.json scripts:**

```json
"scripts": {
  "dev": "tsx src/server.ts",
  "format": "npx @biomejs/biome format --write ./src",
  "lint": "npx @biomejs/biome lint --write ./src"
}
```

5. **Create the MCP middleware** (`src/lib/mcp/middleware.ts`, `header.ts`, `uuid.ts`, `index.ts`)

The middleware handles HTTP transport for MCP. Copy the middleware implementation from the step1 folder, which includes:
- Session management with UUIDs
- Request routing (POST/GET/DELETE)
- Transport lifecycle handling
- Error responses for invalid sessions

6. **Create your first server** (`src/server.ts`):

```typescript
import express from "express";
import { Middleware } from "./lib/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

function newServer() {
  const server = new McpServer({
    name: "Sample MCP Server",
    version: "0.0.1",
  });

  server.registerTool(
    "add_numbers",
    {
      description: "A tool to add two numbers",
      inputSchema: {
        left: z.number().describe("The left operand"),
        right: z.number().describe("The right operand")
      },
    },
    async ({ left, right }) => {
      return {
        content: [{
          type: "text",
          text: `The sum of ${left} and ${right} is ${left + right}`,
        }]
      };
    },
  );

  return server;
}

const app = express();
app.use("/mcp", Middleware(newServer));

console.log("Starting server on http://localhost:3000/mcp");
app.listen(3000);
```

7. **Create nanobot.yaml** for testing:

```yaml
agents:
  main:
    name: Sample
    model: gpt-4.1
    instructions: |
      You are a sample agent. If the user asks to add two numbers ALWAYS use your tool.
    mcpServers: test

mcpServers:
  test:
    url: http://localhost:3000/mcp
```

### Test It Out

1. Start the server: `npm run dev`
2. Run nanobot: `nanobot run ./nanobot.yaml` and open browser to http://localhost:8080
3. Open browser to http://localhost:8080
4. Ask: "What is 5 + 3?"
5. The agent should use the `add_numbers` tool!

### Key Concepts

- **MCP Server**: Core server instance that manages tools and resources
- **Tool Registration**: `server.registerTool(name, schema, handler)`
- **Input Schema**: Uses Zod for type-safe parameter validation
- **Middleware**: Handles HTTP transport and session management
- **Response Format**: Returns content array with text or other types

---

## Step 2: Adding Chess Functionality

Now let's replace the simple addition tool with actual chess functionality!

### What You'll Learn
- Using third-party libraries (chess.js)
- Implementing domain-specific tools
- Handling chess move validation
- Returning formatted game state

### Implementation

1. **Install chess.js:**

```bash
npm install chess.js
```

2. **Update server.ts:**

Replace the `add_numbers` tool with a `chess_move` tool:

```typescript
import express from "express";
import { Middleware } from "./lib/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Chess } from "chess.js";

function newServer() {
  const server = new McpServer({
    name: "Chess MCP Server",
    version: "0.0.1",
  });

  server.registerTool(
    "chess_move",
    {
      description:
        "Make a move in standard algebraic notation (e.g., e4, Nf3, O-O)",
      inputSchema: {
        move: z
          .string()
          .describe(
            "The chess move in standard algebraic notation, or the string 'new' to start a new game",
          ),
      },
    },
    async ({ move }, ctx) => {
      const game = new Chess();
      game.move(move.trim());

      return {
        content: [{
          type: "text",
          text: `Current board state:
          FEN: ${game.fen()}
          VALID MOVES: ${game.moves()}

          ${game.ascii()}`,
        }]
      }
    },
  );

  return server;
}

const app = express();
app.use("/mcp", Middleware(newServer));

console.log("Starting server on http://localhost:3000/mcp");
app.listen(3000);
```

### Test It Out

1. Restart the server: `npm run dev`
2. Run nanobot: `nanobot run ./nanobot.yaml` and open browser to http://localhost:8080
3. Try: "Make the move e4"
4. You should see the chess board in ASCII!

### Problems with This Approach

**Issue**: Each request creates a new game! The game state doesn't persist between moves.

**Solution**: We need to implement state management (coming in Step 3).

### Key Concepts

- **chess.js**: Full chess library with move validation
- **FEN notation**: Standard format for chess positions
- **ASCII board**: Text representation using `game.ascii()`
- **Valid moves**: `game.moves()` returns all legal moves
- **Context**: The `ctx` parameter (which we'll use in the next step)

---

## Step 3: Adding State Management

Let's persist game state between moves so we can play complete games!

### What You'll Learn
- Session-based state management
- File system storage for persistence
- Loading and saving game state
- Handling "new game" vs "continue game" scenarios

### Implementation

1. **Create store.ts** (`src/lib/store.ts`):

```typescript
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { Chess } from "chess.js";

export async function saveGame(
  sessionId: string | undefined,
  game: Chess,
): Promise<void> {
  // Ensure games directory exists
  if (!existsSync("./games")) {
    await mkdir("./games", { recursive: true });
  }

  await writeFile(
    `./games/${sessionId}.json`,
    JSON.stringify(game.fen(), null, 2),
  );
}

export async function loadGame(sessionId?: string): Promise<Chess | null> {
  if (!existsSync(`./games/${sessionId}.json`) || !sessionId) {
    return null;
  }

  const data = await readFile(`./games/${sessionId}.json`, "utf-8");
  const fen = JSON.parse(data) as string;
  return new Chess(fen);
}
```

2. **Update server.ts:**

```typescript
import express from "express";
import { Middleware } from "./lib/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Chess } from "chess.js";
import { loadGame, saveGame } from "./lib/store";

function newServer() {
  const server = new McpServer({
    name: "Chess MCP Server",
    version: "0.0.1"
  });

  server.registerTool(
    "chess_move",
    {
      description:
        "Make a move in standard algebraic notation (e.g., e4, Nf3, O-O)",
      inputSchema: {
        move: z
          .string()
          .describe(
            "The chess move in standard algebraic notation, or the string 'new' to start a new game"
          )
      }
    },
    async ({ move }, ctx) => {
      let game = await loadGame(ctx.sessionId);
      if (move === "new") {
        game = new Chess();
      } else if (!game) {
        game = new Chess();
      }

      game.move(move.trim());
      await saveGame(ctx.sessionId, game);

      return {
        content: [{
          type: "text",
          text: `Current board state:
          FEN: ${game.fen()}
          VALID MOVES: ${game.moves()}

          ${game.ascii()}`
        }]
      };
    }
  );

  return server;
}

const app = express();
app.use("/mcp", Middleware(newServer));

console.log("Starting server on http://localhost:3000/mcp");
app.listen(3000);
```

3. **Update nanobot.yaml:**

```yaml
agents:
  main:
    name: Chess Master
    icon: https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg
    model: gpt-4.1
    starterMessages:
    - Let's play, I'll go first as white.
    - Let's play, you can go first as white.
    instructions: |
      You are a chess master playing a game of chess with the user. The user will tell you if they are playing white or black.
      If not ask them. You always respond in valid PGN format. You always use your tool to make a move.
      If the user makes an invalid move, you respond with "Invalid move, please try again." and wait for
      the user to provide a valid move.
    mcpServers: chess

mcpServers:
  chess:
    url: http://localhost:3000/mcp
```

### Test It Out

1. Restart the server: `npm run dev`
2. Run nanobot: `nanobot run ./nanobot.yaml` and open browser to http://localhost:8080
3. Try: "Let's play chess, you go first as white"
4. The agent should make a move, then you can respond!
5. The game state persists between moves!

### How It Works

- **Session ID**: Each nanobot session gets a unique ID via `ctx.sessionId`
- **File Storage**: Games are saved as JSON files in `./games/` directory
- **FEN Format**: We only save the FEN string (position), not full game history
- **Load on Request**: Each move loads the current game state first
- **Save After Move**: After making a move, we save the new state

### Key Concepts

- **Context Object**: `ctx.sessionId` identifies the current session
- **Persistence**: File-based storage for simplicity (could use database)
- **State Flow**: Load → Modify → Save pattern
- **Graceful Defaults**: Create new game if none exists

---

## Step 4: Adding Basic UI Components

Let's add a visual representation of the board using MCP UI resources!

### What You'll Learn
- MCP UI resources
- HTML content in tool responses
- Frame sizing and metadata
- Multiple content types in responses

### Implementation

1. **Install @mcp-ui/server:**

```bash
npm install @mcp-ui/server
```

2. **Update server.ts:**

Add UI resource to the response:

```typescript
import express from "express";
import { Middleware } from "./lib/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Chess } from "chess.js";
import { loadGame, saveGame } from "./lib/store";
import { createUIResource } from "@mcp-ui/server";

function newServer() {
  const server = new McpServer({
    name: "Chess MCP Server",
    version: "0.0.1"
  });

  server.registerTool(
    "chess_move",
    {
      description:
        "Make a move in standard algebraic notation (e.g., e4, Nf3, O-O)",
      inputSchema: {
        move: z
          .string()
          .describe(
            "The chess move in standard algebraic notation, or the string 'new' to start a new game"
          )
      }
    },
    async ({ move }, ctx) => {
      let game = await loadGame(ctx.sessionId);
      if (move === "new") {
        game = new Chess();
      } else if (!game) {
        game = new Chess();
      }

      game.move(move.trim());
      await saveGame(ctx.sessionId, game);

      return {
        content: [{
          type: "text",
          text: `Current board state:
          FEN: ${game.fen()}
          VALID MOVES: ${game.moves()}

          ${game.ascii()}`
        }, createUIResource({
          uri: `ui://board/${game.fen()}`,
          encoding: "text",
          content: {
            type: "rawHtml",
            htmlString: `<pre>${game.ascii()}</pre>`
          },
          uiMetadata: {
            "preferred-frame-size": ["700px", "300px"]
          },
        })]
      };
    }
  );

  return server;
}

const app = express();
app.use("/mcp", Middleware(newServer));

console.log("Starting server on http://localhost:3000/mcp");
app.listen(3000);
```

### Test It Out

1. Restart the server: `npm run dev`
2. Run nanobot: `nanobot run ./nanobot.yaml`
3. Play some moves - you should see a formatted ASCII board in a UI panel!

### Key Concepts

- **UI Resources**: Special content type that renders in nanobot's UI
- **Multiple Content Items**: Responses can include text + UI resources
- **URI Scheme**: `ui://` URIs identify UI resources
- **Metadata**: Frame size hints for the UI renderer
- **HTML Content**: Raw HTML can be embedded in responses

---

## Step 5: Interactive Chessboard UI

Let's create a beautiful, interactive chessboard with drag-and-drop functionality!

### What You'll Learn
- Advanced UI with external libraries
- Interactive UI components
- Bidirectional communication (UI → Tool)
- Using chessboard.js for visualization

### Implementation

1. **Update server.ts:**

Replace the simple UI with an interactive chessboard:

```typescript
import express from "express";
import { Middleware } from "./lib/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Chess } from "chess.js";
import { loadGame, saveGame } from "./lib/store";
import { createUIResource } from "@mcp-ui/server";

function gameUI(fen: string) {
  return createUIResource({
    uri: `ui://chess_board/${fen}`,
    uiMetadata: {
      "preferred-frame-size": ["500px", "500px"]
    },
    encoding: "text",
    content: {
      type: "rawHtml",
      htmlString: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="stylesheet"
        href="https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.css"
        integrity="sha384-q94+BZtLrkL1/ohfjR8c6L+A6qzNH9R2hBLwyoAfu3i/WCvQjzL2RQJ3uNHDISdU"
        crossorigin="anonymous">
</head>
<body>
<div id="myBoard" style="width: 400px"></div>
<script src="https://code.jquery.com/jquery-3.5.1.min.js"
        integrity="sha384-ZvpUoO/+PpLXR1lu4jmpXWu80pZlYUAfxl5NsBMWOEPSjUn/6Z/hRTt8+pR6L4N2"
        crossorigin="anonymous"></script>
<script src="https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.js"
        integrity="sha384-8Vi8VHwn3vjQ9eUHUxex3JSN/NFqUg3QbPyX8kWyb93+8AC/pPWTzj+nHtbC5bxD"
        crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.2/chess.js"
        integrity="sha384-s3XgLpvmHyscVpijnseAmye819Ee3yaGa8NxstkJVyA6nuDFjt59u1QvuEl/mecz"
        crossorigin="anonymous"></script>
<script>
  var pos =  '${fen}'
  var board = Chessboard('myBoard', {
    position: pos,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    draggable: true,
    dropOffBoard: 'snapback',
    showNotation: true,
    onDrop: function (source, target) {
      window.parent.postMessage({
        type: 'tool',
        payload: {
          toolName: 'chess_move',
          params: {
            move: source + "-" + target
          }
        }
      }, '*')
    }
  })
</script>
</body>`
    }
  });
}

function newServer() {
  const server = new McpServer({
    name: "Chess MCP Server",
    version: "0.0.1"
  });

  server.registerTool(
    "chess_move",
    {
      description:
        "Make a move in standard algebraic notation (e.g., e4, Nf3, O-O)",
      inputSchema: {
        move: z
          .string()
          .describe(
            "The chess move in standard algebraic notation, or the string 'new' to start a new game"
          )
      }
    },
    async ({ move }, ctx) => {
      let game = await loadGame(ctx.sessionId);
      if (move === "new") {
        game = new Chess();
      } else if (!game) {
        game = new Chess();
      }

      game.move(move.trim());
      await saveGame(ctx.sessionId, game);

      return {
        content: [{
          type: "text",
          text: `Current board state:
          FEN: ${game.fen()}
          VALID MOVES: ${game.moves()}

          ${game.ascii()}`
        }, gameUI(game.fen())
        ]
      };
    }
  );

  return server;
}

const app = express();
app.use("/mcp", Middleware(newServer));

console.log("Starting server on http://localhost:3000/mcp");
app.listen(3000);
```

2. **Update nanobot.yaml** with better instructions:

```yaml
agents:
  main:
    name: Chess Master
    icon: https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg
    model: gpt-4.1
    starterMessages:
    - Let's play, I'll go first as white.
    - Let's play, you can go first as white.
    instructions: |
      You are a chess master playing a game of chess with the user. The user will tell you if they are playing white or black.
      If not ask them. You always respond in valid PGN format. You always use your tool to make a move.
      If the user makes an invalid move, you respond with "Invalid move, please try again." and wait for
      the user to provide a valid move.

      After each player, analyze the board and tell the user if the move was good or not and why. Then
      take your turn. After each move you make explain why you made that move.
    mcpServers: chess

mcpServers:
  chess:
    url: http://localhost:3000/mcp
```

### Test It Out

1. Restart the server: `npm run dev`
2. Run nanobot: `nanobot`
3. Start a game - you should see a beautiful chessboard!
4. **Try dragging pieces!** When you drag a piece, it sends the move back to the tool!

### How Interactive UI Works

1. **Chessboard.js**: External library for rendering and interaction
2. **onDrop Handler**: Captures drag-and-drop events
3. **postMessage**: Sends move data to the parent window (nanobot)
4. **Tool Invocation**: Nanobot receives the message and calls `chess_move` tool
5. **UI Update**: New board state is rendered

### Key Concepts

- **External Libraries**: Can load CSS/JS from CDNs
- **Event Handlers**: JavaScript in UI can respond to user actions
- **postMessage API**: Standard way to communicate with parent window
- **Tool Callback**: UI can trigger tool calls programmatically
- **Dynamic FEN**: UI updates with current position via template strings

---

## Congratulations! 🎉

You've built a complete Chess MCP server with:
- ✅ HTTP transport and session management
- ✅ Tool registration and validation
- ✅ Stateful game persistence
- ✅ Interactive UI components
- ✅ Bidirectional communication

## Next Steps

### Enhancements You Could Add

1. **Multiple Tools**:
   - `get_valid_moves` - Get all legal moves for a position
   - `undo_move` - Take back the last move
   - `get_game_history` - View move history in PGN format
   - `analyze_position` - Get position evaluation

2. **Advanced Features**:
   - Save multiple games per session
   - Export games as PGN
   - Load games from PGN
   - Add time controls
   - Support for chess puzzles

3. **Better Storage**:
   - Use SQLite or PostgreSQL
   - Store full game history, not just current position
   - Add game metadata (players, dates, etc.)

4. **Enhanced UI**:
   - Move history panel
   - Captured pieces display
   - Position evaluation bar
   - Suggested moves

5. **Multi-User**:
   - Support games between two human players
   - Spectator mode
   - Game sharing via URLs

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP SDK Reference](https://github.com/modelcontextprotocol/sdk)
- [chess.js Library](https://github.com/jhlywa/chess.js)
- [chessboard.js Library](https://chessboardjs.com/)
- [Nanobot Documentation](https://github.com/anthropics/nanobot)

## Troubleshooting

### Server won't start
- Check that port 3000 is available
- Verify all dependencies are installed: `npm install`
- Check Node.js version: `node --version` (should be 20+)

### Agent not using the tool
- Verify nanobot.yaml is in the correct location
- Check that the server is running: `curl http://localhost:3000/mcp`
- Make sure instructions mention using the tool

### UI not displaying
- Verify @mcp-ui/server is installed
- Check browser console for JavaScript errors
- Ensure HTML is properly formatted

### State not persisting
- Check that `./games` directory is created
- Verify file permissions for writing
- Ensure sessionId is being passed correctly

## Questions or Issues?

Open an issue in the workshop repository or check the MCP documentation for more help!

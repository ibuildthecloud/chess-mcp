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

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

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
			description:
				"A tool to add two numbers",
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

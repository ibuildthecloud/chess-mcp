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

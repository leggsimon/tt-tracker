export type Player = {
	id: string;
	username: string;
};

export type Game = {
	id: string;
	player1Id: string;
	player2Id: string;
	player1Score: number;
	player2Score: number;
	startingPlayerId: string;
	playedAt: Date | string;
	player1: Player;
	player2: Player;
	isDeleted: boolean;
};

export type PlayerNormalisedGame = {
	id: string;
	player: Player;
	opponent: Player;
	playerScore: number;
	opponentScore: number;
	startingServer: 'player' | 'opponent';
	playedAt: string;
};
export function normaliseGame(
	game: Game,
	playerId: string,
): PlayerNormalisedGame {
	return {
		id: game.id,
		player: game.player1Id === playerId ? game.player1 : game.player2,
		opponent: game.player1Id === playerId ? game.player2 : game.player1,
		playerScore:
			game.player1Id === playerId ? game.player1Score : game.player2Score,
		opponentScore:
			game.player1Id === playerId ? game.player2Score : game.player1Score,
		startingServer: game.startingPlayerId === playerId ? 'player' : 'opponent',
		playedAt: new Date(game.playedAt).toLocaleDateString('en-GB'),
	};
}

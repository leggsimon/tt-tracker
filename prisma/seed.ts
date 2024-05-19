import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function seed() {
	const [player1, player2] = await Promise.all([
		db.user.create({
			data: {
				username: 'Simon',
				password: 'simonpassword',
			},
		}),
		db.user.create({
			data: {
				username: 'Quinn',
				password: 'quinnpassword',
			},
		}),
	]);

	const games = [
		{
			player1Id: player1.id,
			player2Id: player2.id,
			player1Score: 11,
			player2Score: 8,
			startingPlayerId: player1.id,
		},
		{
			player1Id: player1.id,
			player2Id: player2.id,
			player1Score: 12,
			player2Score: 14,
			startingPlayerId: player2.id,
		},
	];

	await Promise.all(games.map((game) => db.game.create({ data: game })));
}

seed();

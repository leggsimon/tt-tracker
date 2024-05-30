import { LoaderFunctionArgs, json, type MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import Header from '~/components/Header/Header';
import { getUser } from '~/utils/session.server';
import { db } from '~/utils/db.server';

export const meta: MetaFunction = () => {
	return [
		{ title: '🏓 Table Tennis Tracker' },
		{
			name: 'description',
			content: 'Track your ping pong games with your friends!',
		},
	];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const user = await getUser(request);
	if (!user) {
		throw new Response('Unauthorized', { status: 401 });
	}
	const games = user
		? await db.game.findMany({
				where: {
					OR: [{ player1Id: user.id }, { player2Id: user.id }],
				},
				orderBy: {
					playedAt: 'desc',
				},
				include: {
					player1: true,
					player2: true,
				},
			})
		: [];

	return json({
		user,
		games: games.filter((game) => !game.isDeleted),
		deletedGames: games.filter((game) => game.isDeleted),
	});
};

export default function GamesIndex() {
	const data = useLoaderData<typeof loader>();
	const { totalPointsFor, totalPointsAgainst } = data.games.reduce(
		(acc, game) => {
			if (game.player1Id === data.user.id) {
				return {
					totalPointsFor: acc.totalPointsFor + game.player1Score,
					totalPointsAgainst: acc.totalPointsAgainst + game.player2Score,
				};
			} else {
				return {
					totalPointsFor: acc.totalPointsFor + game.player2Score,
					totalPointsAgainst: acc.totalPointsAgainst + game.player1Score,
				};
			}
		},
		{
			totalPointsFor: 0,
			totalPointsAgainst: 0,
		},
	);

	const gamesGroupedByByDate = data.games.reduce(
		(acc, game) => {
			const playedAtDate = new Date(game.playedAt).toLocaleDateString('en-GB');
			if (!acc[playedAtDate]) {
				acc[playedAtDate] = [];
			}
			acc[playedAtDate].push(game);
			return acc;
		},
		{} as Record<string, typeof data.games>,
	);

	return (
		<>
			<Header user={data.user} />
			<main className="mx-auto flex max-w-96 flex-col px-6">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">Games</h1>

					<Link
						className="border-3 border-black bg-orange px-6 py-2 text-sm font-bold shadow-md hover:bg-sand focus:bg-sand"
						to="/games/new"
					>
						New Game
					</Link>
				</div>
				<dl className="my-12 grid grid-cols-2 gap-4 text-center" role="table">
					<dt className="font-bold">Total Points For</dt>
					<dd className="row-start-2 text-4xl font-bold">{totalPointsFor}</dd>
					<dt className="font-bold">Total Points Against</dt>
					<dd className="row-start-2 text-4xl font-bold">
						{totalPointsAgainst}
					</dd>
					<dt className="font-bold">Total Wins</dt>
					<dd className="row-start-4 text-4xl font-bold">{7}</dd>
					<dt className="font-bold">Total Losses</dt>
					<dd className="row-start-4 text-4xl font-bold">{7}</dd>
				</dl>

				{Object.entries(gamesGroupedByByDate).map(([date, games]) => {
					const gamesGroupedByOpponent = games.reduce(
						(acc, game) => {
							const opponentId =
								game.player1Id === data.user.id
									? game.player2Id
									: game.player1Id;
							if (!acc[opponentId]) {
								acc[opponentId] = [];
							}
							acc[opponentId].push(game);
							return acc;
						},
						{} as Record<string, typeof games>,
					);
					return (
						<section
							className="my-8 border-4 bg-white p-4 shadow-xl"
							key={date}
						>
							<h2 className="mb-4 text-xl font-bold">{date}</h2>
							{Object.entries(gamesGroupedByOpponent).map(
								([opponentId, games]) => {
									const opponent =
										games[0].player1Id === data.user.id
											? games[0].player2
											: games[0].player1;
									return (
										<table key={opponentId} className="border-3 w-full">
											<thead className="">
												<tr className="border-3 border-black bg-sand text-lg font-bold">
													<th className="p-2">You</th>
													<th className="p-2">{opponent.username}</th>
													<th className="sr-only">Link to game</th>
												</tr>
											</thead>
											<tbody className="">
												{games.map((game) => {
													const yourScore =
														game.player1Id === data.user.id
															? game.player1Score
															: game.player2Score;
													const oppScore =
														game.player1Id === data.user.id
															? game.player2Score
															: game.player1Score;
													const player1ServedFirst =
														game.startingPlayerId === game.player1Id;
													return (
														<tr
															key={game.id}
															className="border-b border-casal/15 bg-linen"
														>
															<td
																className={`p-4 text-center ${
																	yourScore > oppScore ? 'font-bold' : ''
																}`}
															>
																{yourScore}
																{player1ServedFirst ? '*' : ''}
															</td>
															<td
																className={`p-4 text-center ${yourScore < oppScore ? 'font-bold' : ''}`}
															>
																{oppScore}
																{player1ServedFirst ? '' : '*'}
															</td>
															<td className="pr-4 text-right text-xs">
																<Link to={`/games/${game.id}`}>View</Link>
															</td>
														</tr>
													);
												})}
												<tr className="border-3 border-black bg-sand text-left text-lg font-bold">
													<th colSpan={3} className="px-6 py-2">
														Totals
													</th>
												</tr>
												<tr className="bg-peach">
													<td className="p-4 text-center">
														{games.reduce((acc, game) => {
															if (game.player1Id === data.user.id) {
																return acc + game.player1Score;
															} else {
																return acc + game.player2Score;
															}
														}, 0)}
													</td>
													<td className="p-4 text-center">
														{games.reduce((acc, game) => {
															if (game.player1Id === data.user.id) {
																return acc + game.player2Score;
															} else {
																return acc + game.player1Score;
															}
														}, 0)}
													</td>
													<td></td>
												</tr>
											</tbody>
										</table>
									);
								},
							)}
						</section>
					);
				})}

				{data.deletedGames.length > 0 ? (
					<details className="">
						<summary className="">Deleted Games</summary>
						<table className="">
							<thead className="">
								<tr className="">
									<th className="">Opponent</th>
									<th className="">Your Score</th>
									<th className="">Opponent’s Score</th>
									<th className=""></th>
								</tr>
							</thead>
							<tbody className="">
								{data.deletedGames.map((game) => {
									const opponent =
										game.player1Id === data.user.id
											? game.player2
											: game.player1;
									return (
										<tr key={game.id}>
											<td className="">{opponent.username}</td>
											<td className="">
												{game.player1Id === data.user.id
													? game.player1Score
													: game.player2Score}
											</td>
											<td className="">
												{game.player1Id === data.user.id
													? game.player2Score
													: game.player1Score}
											</td>
											<td className="">
												<Link to={`/games/${game.id}`}>View</Link>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</details>
				) : null}
			</main>
		</>
	);
}

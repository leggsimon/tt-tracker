import { LinksFunction, LoaderFunctionArgs, json, type MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import Header from '~/components/Header/Header';
import { getUser } from '~/utils/session.server';
import stylesUrl from '~/styles/games.css?url';
import { db } from '~/utils/db.server';

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stylesUrl }];

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

	const gamesGroupedByByDate = data.games.reduce((acc, game) => {
		const playedAtDate = new Date(game.playedAt).toLocaleDateString('en-GB');
		if (!acc[playedAtDate]) {
			acc[playedAtDate] = [];
		}
		acc[playedAtDate].push(game);
		return acc;
	}, {} as Record<string, typeof data.games>);

	return (
		<>
			<Header user={data.user} />
			<main>
				<div className='header-row'>
					<h1>Games</h1>

					<Link to='/games/new'>New Game</Link>
				</div>
				<dl>
					<dt>Total Points For</dt>
					<dd>{totalPointsFor}</dd>
					<dt>Total Points Against</dt>
					<dd>{totalPointsAgainst}</dd>
				</dl>

				{Object.entries(gamesGroupedByByDate).map(([date, games]) => {
					const gamesGroupedByOpponent = games.reduce((acc, game) => {
						const opponentId = game.player1Id === data.user.id ? game.player2Id : game.player1Id;
						if (!acc[opponentId]) {
							acc[opponentId] = [];
						}
						acc[opponentId].push(game);
						return acc;
					}, {} as Record<string, typeof games>);
					return (
						<section className='card' key={date}>
							<h2>{date}</h2>
							{Object.entries(gamesGroupedByOpponent).map(([opponentId, games]) => {
								const opponent =
									games[0].player1Id === data.user.id ? games[0].player2 : games[0].player1;
								return (
									<table key={opponentId}>
										<thead>
											<tr>
												<th>You</th>
												<th>{opponent.username}</th>
											</tr>
										</thead>
										<tbody>
											{games.map((game) => {
												const yourScore =
													game.player1Id === data.user.id ? game.player1Score : game.player2Score;
												const oppScore =
													game.player1Id === data.user.id ? game.player2Score : game.player1Score;
												const player1ServedFirst = game.startingPlayerId === game.player1Id;
												return (
													<tr key={game.id}>
														<td className={yourScore > oppScore ? 'winner' : 'loser'}>
															<Link to={`/games/${game.id}`}>
																<span className='tabular-nums'>
																	{yourScore}
																	{player1ServedFirst ? '*' : ''}
																</span>
															</Link>
														</td>
														<td className={yourScore < oppScore ? 'winner' : 'loser'}>
															<Link to={`/games/${game.id}`}>
																<span className='tabular-nums'>
																	{oppScore}
																	{player1ServedFirst ? '' : '*'}
																</span>
															</Link>
														</td>
													</tr>
												);
											})}
											<tr>
												<td colSpan={2}>Totals</td>
											</tr>
											<tr>
												<td>
													<span className='tabular-nums'>
														{games.reduce((acc, game) => {
															if (game.player1Id === data.user.id) {
																return acc + game.player1Score;
															} else {
																return acc + game.player2Score;
															}
														}, 0)}
													</span>
												</td>
												<td>
													<span className='tabular-nums'>
														{games.reduce((acc, game) => {
															if (game.player1Id === data.user.id) {
																return acc + game.player2Score;
															} else {
																return acc + game.player1Score;
															}
														}, 0)}
													</span>
												</td>
											</tr>
										</tbody>
									</table>
								);
							})}
						</section>
					);
				})}

				{data.deletedGames.length > 0 ? (
					<details>
						<summary>Deleted Games</summary>
						<table>
							<thead>
								<tr>
									<th>Opponent</th>
									<th>Your Score</th>
									<th>Opponent’s Score</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{data.deletedGames.map((game) => {
									const opponent = game.player1Id === data.user.id ? game.player2 : game.player1;
									return (
										<tr key={game.id}>
											<td>{opponent.username}</td>
											<td>
												{game.player1Id === data.user.id ? game.player1Score : game.player2Score}
											</td>
											<td>
												{game.player1Id === data.user.id ? game.player2Score : game.player1Score}
											</td>
											<td>
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

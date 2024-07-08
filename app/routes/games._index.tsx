import React from 'react';
import { LoaderFunctionArgs, json, type MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import groupBy from 'lodash/groupBy';
import Header from '~/components/Header/Header';
import { getUser } from '~/utils/session.server';
import { db } from '~/utils/db.server';
import { Button } from '~/components/Button/Button';
import { Main } from '~/components/Main/Main';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeaderCell,
	TableHeaderRow,
	TableRow,
} from '~/components/Table/Table';
import { useLocalStorageState } from '~/hooks/useLocalStorage';
import {
	Game,
	Player,
	PlayerNormalisedGame,
	normaliseGame,
} from '~/utils/game';

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
	const games: Game[] = user
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

	const opponentIds: string[] = [
		...new Set(
			games
				.flatMap((game) => {
					return [game.player1Id, game.player2Id];
				})
				.filter((id) => id !== user.id),
		),
	];

	const opponents: Player[] = await db.user.findMany({
		select: {
			id: true,
			username: true,
		},
		where: {
			id: {
				in: opponentIds,
			},
		},
	});

	return json({
		user,
		opponents,
		games: games.filter((game) => !game.isDeleted),
		deletedGames: games.filter((game) => game.isDeleted),
	});
};

export default function GamesIndex() {
	const data = useLoaderData<typeof loader>();
	const [filterPlayer, setFilterPlayer] = useLocalStorageState<string>('');

	const includesFilterPlayer = (game: PlayerNormalisedGame) => {
		if (!filterPlayer) {
			return true;
		}

		return game.opponent.id === filterPlayer;
	};

	const games = data.games
		.map((game) => normaliseGame(game, data.user.id))
		.filter(includesFilterPlayer);

	const totalPointsFor = games.reduce((acc, game) => {
		return acc + game.playerScore;
	}, 0);

	const totalPointsAgainst = games.reduce((acc, game) => {
		return acc + game.opponentScore;
	}, 0);

	const totalWins = games.filter(
		(game) => game.playerScore > game.opponentScore,
	).length;

	const totalLosses = games.length - totalWins;

	const gamesGroupedByDate = groupBy(games, 'playedAt');

	const handleFilterSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
		setFilterPlayer(event.target.value === 'all' ? '' : event.target.value);
	};

	return (
		<>
			<Header user={data.user} />
			<Main>
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">Games</h1>

					<Button as={Link} to="/games/new">
						New Game
					</Button>
				</div>
				<div className="my-4 flex">
					<select
						onChange={handleFilterSelect}
						defaultValue={filterPlayer || 'all'}
						className="w-full cursor-pointer border-3 border-black bg-linen px-6 py-2 text-sm font-bold shadow-md hover:bg-sand focus:bg-sand"
					>
						<option value={'all'}>All</option>
						{data.opponents.map((opponent) => {
							return (
								<option key={opponent.id} value={opponent.id}>
									{opponent.username}
								</option>
							);
						})}
					</select>
				</div>
				<dl className="my-12 grid grid-cols-2 gap-4 text-center" role="table">
					<dt className="font-bold">Total Points For</dt>
					<dd className="row-start-2 text-4xl font-bold">{totalPointsFor}</dd>
					<dt className="font-bold">Total Points Against</dt>
					<dd className="row-start-2 text-4xl font-bold">
						{totalPointsAgainst}
					</dd>
					<dt className="font-bold">Total Wins</dt>
					<dd className="row-start-4 text-4xl font-bold">{totalWins}</dd>
					<dt className="font-bold">Total Losses</dt>
					<dd className="row-start-4 text-4xl font-bold">{totalLosses}</dd>
				</dl>

				{Object.entries(gamesGroupedByDate).map(([date, games]) => {
					const gamesGroupedByOpponent = groupBy(games, 'opponent.id');

					return (
						<section
							className="my-8 border-4 bg-white p-4 shadow-xl"
							key={date}
						>
							<h2 className="mb-4 text-xl font-bold">{date}</h2>
							{Object.entries(gamesGroupedByOpponent).map(
								([opponentId, games]) => {
									return (
										<Table key={opponentId}>
											<TableHead>
												<TableHeaderRow>
													<TableHeaderCell>You</TableHeaderCell>
													<TableHeaderCell>
														{games[0].opponent.username}
													</TableHeaderCell>
													<TableHeaderCell className="sr-only">
														Link to game
													</TableHeaderCell>
												</TableHeaderRow>
											</TableHead>
											<TableBody>
												{games.map((game) => {
													return (
														<TableRow key={game.id}>
															<TableCell>
																<span
																	className={
																		game.playerScore > game.opponentScore
																			? 'font-bold'
																			: ''
																	}
																>
																	{game.playerScore}
																	{game.startingServer === 'player' && '*'}
																</span>
															</TableCell>
															<TableCell>
																<span
																	className={
																		game.playerScore < game.opponentScore
																			? 'font-bold'
																			: ''
																	}
																>
																	{game.opponentScore}
																	{game.startingServer === 'opponent' && '*'}
																</span>
															</TableCell>
															<TableCell className="pr-4 text-right text-xs">
																<Link to={`/games/${game.id}`}>View</Link>
															</TableCell>
														</TableRow>
													);
												})}
												<TableHeaderRow className="border-3 border-black bg-sand text-left text-lg font-bold">
													<th colSpan={3} className="px-6 py-2">
														Totals
													</th>
												</TableHeaderRow>
												<TableRow className="bg-peach">
													<TableCell>
														{games.reduce((acc, game) => {
															return acc + game.playerScore;
														}, 0)}
													</TableCell>
													<TableCell>
														{games.reduce((acc, game) => {
															return acc + game.opponentScore;
														}, 0)}
													</TableCell>
													<td></td>
												</TableRow>
											</TableBody>
										</Table>
									);
								},
							)}
						</section>
					);
				})}

				{data.deletedGames.length > 0 ? (
					<details>
						<summary className="font-bold">Deleted Games</summary>
						<Table>
							<TableHead>
								<TableHeaderRow className="border-3 border-black bg-sand text-sm font-bold">
									<TableHeaderCell>Opponent</TableHeaderCell>
									<TableHeaderCell>Your Score</TableHeaderCell>
									<TableHeaderCell>Opponent’s Score</TableHeaderCell>
									<TableHeaderCell className="sr-only">
										Link to game
									</TableHeaderCell>
								</TableHeaderRow>
							</TableHead>
							<TableBody>
								{data.deletedGames.map((game) => {
									const opponent =
										game.player1Id === data.user.id
											? game.player2
											: game.player1;
									return (
										<TableRow key={game.id}>
											<TableCell>
												<span className="text-sm">{opponent.username}</span>
											</TableCell>
											<TableCell>
												<span className="text-sm">
													{game.player1Id === data.user.id
														? game.player1Score
														: game.player2Score}
												</span>
											</TableCell>
											<TableCell>
												<span className="text-sm">
													{game.player1Id === data.user.id
														? game.player2Score
														: game.player1Score}
												</span>
											</TableCell>
											<TableCell className="pr-4 text-right text-xs">
												<Link to={`/games/${game.id}`}>View</Link>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</details>
				) : null}
			</Main>
		</>
	);
}

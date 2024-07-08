import React from 'react';
import { LoaderFunctionArgs, json, type MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
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

type Game = {
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

type Player = {
	id: string;
	username: string;
};

export default function GamesIndex() {
	const data = useLoaderData<typeof loader>();
	const [filterPlayer, setFilterPlayer] = useLocalStorageState<string>('');

	const includesFilterPlayer = (game: Game & { playedAt: string }) => {
		if (!filterPlayer) {
			return true;
		}

		return game.player1Id === filterPlayer || game.player2Id === filterPlayer;
	};

	const games = data.games.filter(includesFilterPlayer);

	const { totalPointsFor, totalPointsAgainst } = games.reduce(
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

	const totalWins = games.filter((game) => {
		if (game.player1Id === data.user.id) {
			return game.player1Score > game.player2Score;
		} else {
			return game.player2Score > game.player1Score;
		}
	}).length;

	const totalLosses = games.length - totalWins;

	const gamesGroupedByDate = games.reduce(
		(acc, game) => {
			const playedAtDate = new Date(game.playedAt).toLocaleDateString('en-GB');
			if (!acc[playedAtDate]) {
				acc[playedAtDate] = [];
			}
			acc[playedAtDate].push(game);
			return acc;
		},
		{} as Record<string, Game[]>,
	);

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
						className="w-full cursor-pointer border-3 border-black bg-linen px-6 py-2 text-sm font-bold shadow-md hover:bg-sand focus:bg-sand"
					>
						<option selected={!filterPlayer} value={'all'}>
							All
						</option>
						{data.opponents.map((opponent) => {
							return (
								<option
									selected={filterPlayer === opponent.id}
									key={opponent.id}
									value={opponent.id}
								>
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
										<Table key={opponentId}>
											<TableHead>
												<TableHeaderRow>
													<TableHeaderCell>You</TableHeaderCell>
													<TableHeaderCell>{opponent.username}</TableHeaderCell>
													<TableHeaderCell className="sr-only">
														Link to game
													</TableHeaderCell>
												</TableHeaderRow>
											</TableHead>
											<TableBody>
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
														<TableRow key={game.id}>
															<TableCell>
																<span
																	className={
																		yourScore > oppScore ? 'font-bold' : ''
																	}
																>
																	{yourScore}
																	{player1ServedFirst ? '*' : ''}
																</span>
															</TableCell>
															<TableCell>
																<span
																	className={
																		yourScore < oppScore ? 'font-bold' : ''
																	}
																>
																	{oppScore}
																	{player1ServedFirst ? '' : '*'}
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
															if (game.player1Id === data.user.id) {
																return acc + game.player1Score;
															} else {
																return acc + game.player2Score;
															}
														}, 0)}
													</TableCell>
													<TableCell>
														{games.reduce((acc, game) => {
															if (game.player1Id === data.user.id) {
																return acc + game.player2Score;
															} else {
																return acc + game.player1Score;
															}
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

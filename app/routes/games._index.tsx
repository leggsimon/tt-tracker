import { LinksFunction, LoaderFunctionArgs, json, type MetaFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import Header from '~/components/Header/Header';
import { getUser } from '~/utils/session.server';
import stylesUrl from '~/styles/index.css?url';
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
				include: {
					player1: true,
					player2: true,
				},
		  })
		: [];

	return json({ user, games });
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

	return (
		<>
			<Header user={data.user} />
			<main>
				<p>All Games</p>

				<Link to='/games/new'>New Game</Link>

				<dl>
					<dt>Total Points For</dt>
					<dd>{totalPointsFor}</dd>
					<dt>Total Points Against</dt>
					<dd>{totalPointsAgainst}</dd>
				</dl>
				<ul>
					{data.games.map((game) => {
						const playedAtDateString = new Date(game.playedAt).toLocaleDateString('en-GB');
						return (
							<li key={game.id}>
								{playedAtDateString} -{' '}
								<Link to={`/games/${game.id}`}>
									{game.player1.username} {game.player1Score} vs {game.player2Score}{' '}
									{game.player2.username}
								</Link>
							</li>
						);
					})}
				</ul>
			</main>
		</>
	);
}

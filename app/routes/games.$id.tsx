import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { isRouteErrorResponse, Link, useLoaderData, useRouteError } from '@remix-run/react';

import { db } from '~/utils/db.server';
import { getUser } from '~/utils/session.server';

import stylesUrl from '~/styles/new-game.css?url';
import Header from '~/components/Header/Header';

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stylesUrl }];

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const game = await db.game.findFirst({
		where: {
			id: params.id,
		},
		include: {
			player1: true,
			player2: true,
		},
	});
	const user = await getUser(request);
	if (!user) {
		throw new Response('Unauthorized', { status: 401 });
	}
	return json({ user, game });
};

export default function GameRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<>
			<Header user={data.user} />
			<main>
				<p>Game</p>
				{data.game ? (
					<table>
						<thead>
							<tr>
								<th>{data.game.player1.username}</th>
								<th>{data.game.player2.username}</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>
									{data.game.player1Score}
									{data.game.startingPlayerId === data.game.player1Id ? '*' : ''}
								</td>
								<td>
									{data.game.player2Score}
									{data.game.startingPlayerId === data.game.player2Id ? '*' : ''}
								</td>
							</tr>
						</tbody>
					</table>
				) : (
					<p>Game not found</p>
				)}
			</main>
		</>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();

	if (isRouteErrorResponse(error) && error.status === 401) {
		return (
			<div className='error-container'>
				<p>You must be logged in to view this game.</p>
				<Link to='/login'>Login</Link>
			</div>
		);
	}

	return <div className='error-container'>Something unexpected went wrong. Sorry about that.</div>;
}

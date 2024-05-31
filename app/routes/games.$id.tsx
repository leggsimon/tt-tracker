import type {
	ActionFunctionArgs,
	LinksFunction,
	LoaderFunctionArgs,
} from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
	isRouteErrorResponse,
	Link,
	useLoaderData,
	useRouteError,
} from '@remix-run/react';

import { db } from '~/utils/db.server';
import { getUser, requireUserId } from '~/utils/session.server';

import Header from '~/components/Header/Header';
import React from 'react';

export const links: LinksFunction = () => [
	{ rel: 'stylesheet', href: stylesUrl },
];

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

export const action = async ({ params, request }: ActionFunctionArgs) => {
	const form = await request.formData();
	const intent = form.get('intent');
	if (intent !== 'delete' && intent !== 'undelete') {
		throw new Response(`The intent ${intent} is not supported`, {
			status: 400,
		});
	}
	const userId = await requireUserId(request);
	const game = await db.game.findUnique({
		where: { id: params.id },
	});
	if (!game) {
		throw new Response("Can't delete what does not exist", {
			status: 404,
		});
	}

	console.log({ game, userId });
	if (game.player1Id !== userId && game.player2Id !== userId) {
		throw new Response("Pssh, nice try. That's not your game", { status: 403 });
	}
	await db.game.update({
		where: { id: params.id },
		data: { isDeleted: intent === 'delete' },
	});
	return redirect('/games');
};

export default function GameRoute() {
	const data = useLoaderData<typeof loader>();

	const [date, setDate] = React.useState('');
	React.useEffect(() => {
		const playedAtDate = new Date(data.game?.playedAt);
		setDate(playedAtDate.toLocaleString());
	}, [data.game?.playedAt]);

	return (
		<>
			<Header user={data.user} />
			{data.game ? (
				<main>
					<p>Game</p>
					<p>Played on: {date}</p>
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
									<span className="tabular-nums">{data.game.player1Score}</span>
									{data.game.startingPlayerId === data.game.player1Id
										? '*'
										: ''}
								</td>
								<td>
									<span className="tabular-nums">{data.game.player2Score}</span>
									{data.game.startingPlayerId === data.game.player2Id
										? '*'
										: ''}
								</td>
							</tr>
						</tbody>
					</table>
					<form method="post">
						{data.game.isDeleted ? (
							<button
								className="button"
								name="intent"
								type="submit"
								value="undelete"
							>
								Undelete
							</button>
						) : (
							<button
								className="button"
								name="intent"
								type="submit"
								value="delete"
							>
								Delete
							</button>
						)}
					</form>
				</main>
			) : (
				<main>
					<p>Game not found</p>
				</main>
			)}
		</>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();

	console.error(error);

	if (isRouteErrorResponse(error) && error.status === 401) {
		return (
			<div className="error-container">
				<p>You must be logged in to view this game.</p>
				<Link to="/login">Login</Link>
			</div>
		);
	}

	return (
		<div className="error-container">
			Something unexpected went wrong. Sorry about that.
		</div>
	);
}

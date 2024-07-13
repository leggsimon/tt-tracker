import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
	isRouteErrorResponse,
	Link,
	useLoaderData,
	useRouteError,
} from '@remix-run/react';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeaderCell,
	TableHeaderRow,
	TableRow,
} from '~/components/Table/Table';
import { db } from '~/utils/db.server';
import { getUser, requireUserId } from '~/utils/session.server';

import Header from '~/components/Header/Header';
import React from 'react';
import { Main } from '~/components/Main/Main';
import { Button } from '~/components/Button/Button';

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

	if (!game) {
		throw new Response('Game not found', { status: 404 });
	}

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
			<Main>
				<h1 className="mb-4 text-3xl font-bold">Game</h1>
				<p>
					<span className="font-bold">Played on: </span>
					{date}
				</p>
				<Table>
					<TableHead>
						<TableHeaderRow>
							<TableHeaderCell>{data.game.player1.username}</TableHeaderCell>
							<TableHeaderCell>{data.game.player2.username}</TableHeaderCell>
							<TableHeaderCell className="sr-only">
								Link to edit game
							</TableHeaderCell>
						</TableHeaderRow>
					</TableHead>
					<TableBody>
						<TableRow>
							<TableCell>
								<span>{data.game.player1Score}</span>
								{data.game.startingPlayerId === data.game.player1Id ? '*' : ''}
							</TableCell>
							<TableCell>
								<span>{data.game.player2Score}</span>
								{data.game.startingPlayerId === data.game.player2Id ? '*' : ''}
							</TableCell>
							<TableCell className="pr-4 text-right text-xs">
								<Link to={`/games/${data.game.id}/edit`}>Edit</Link>
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
				<form method="post" className="my-6 flex justify-center">
					{data.game.isDeleted ? (
						<Button name="intent" type="submit" value="undelete">
							Undelete
						</Button>
					) : (
						<Button name="intent" type="submit" value="delete">
							Delete
						</Button>
					)}
				</form>
			</Main>
		</>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();

	console.error(error);

	let content = (
		<div className="text-thunderbird">
			Something unexpected went wrong. Sorry about that.
		</div>
	);

	if (isRouteErrorResponse(error) && error.status === 401) {
		content = (
			<>
				<p className="text-thunderbird">You must be logged in to add a game.</p>
				<Button as={Link} to="/login">
					Login
				</Button>
			</>
		);
	}

	return (
		<>
			<Header user={null} />
			<Main>
				<div className="flex flex-col items-center">{content}</div>
			</Main>
		</>
	);
}

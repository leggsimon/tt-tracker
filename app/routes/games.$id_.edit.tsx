import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
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
import { Main } from '~/components/Main/Main';
import { Button } from '~/components/Button/Button';
import { GameForm } from '~/components/GameForm/GameForm';
import { validateScore } from '~/utils/validations.server';
import { badRequest } from '~/utils/request.server';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const user = await getUser(request);
	if (!user) {
		throw new Response('Unauthorized', { status: 401 });
	}

	const game = await db.game.findFirst({
		where: {
			id: params.id,
		},
		select: {
			id: true,
			player1Id: true,
			player2Id: true,
			player1Score: true,
			player2Score: true,
			startingPlayerId: true,
			player1: {
				select: {
					username: true,
				},
			},
			player2: {
				select: {
					username: true,
				},
			},
		},
	});

	if (!game) {
		throw new Response('Game not found', { status: 404 });
	}

	const opponents = await db.user.findMany({
		where: {
			NOT: { id: user.id },
		},
		select: { id: true, username: true },
	});

	return json({ user, game, opponents });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
	const userId = await requireUserId(request);
	const form = await request.formData();
	const game = await db.game.findUnique({
		where: { id: params.id },
	});
	if (!game) {
		throw new Response("Can't update what does not exist", {
			status: 404,
		});
	}

	if (game.player1Id !== userId && game.player2Id !== userId) {
		throw new Response("Pssh, nice try. That's not your game", { status: 403 });
	}

	const player1Id = form.get('player1Id') as string | null;
	const player2Id = form.get('player2Id') as string | null;

	const player1Score = form.get('player1Score') as string | null;
	const player2Score = form.get('player2Score') as string | null;

	const startingServerPlayerId = form.get('startingServerPlayerId') as
		| string
		| null;

	// ignore playedat until i can figure out the timezones
	// const playedAt = form.get('playedAt') as string | null;

	const fields = {
		player1Id,
		player2Id,
		player1Score,
		player2Score,
		startingServerPlayerId,
	};

	if (
		typeof player1Id !== 'string' ||
		typeof player2Id !== 'string' ||
		typeof player1Score !== 'string' ||
		typeof player2Score !== 'string' ||
		typeof startingServerPlayerId !== 'string'
	) {
		return badRequest({
			fieldErrors: null,
			fields: null,
			formError: 'Form not submitted correctly.',
		});
	}

	const fieldErrors = {
		player1Score: validateScore(player1Score),
		player2Score: validateScore(player2Score),
		player2Id:
			player2Id === player1Id ? 'Opponent must be different' : undefined,
	};

	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({
			fieldErrors,
			fields,
			formError: null,
		});
	}

	await db.game.update({
		where: { id: params.id },
		data: {
			player1Id: player1Id,
			player2Id: player2Id,
			player1Score: parseInt(player1Score, 10),
			player2Score: parseInt(player2Score, 10),
			startingPlayerId:
				startingServerPlayerId === 'player' ? player1Id : player2Id,
		},
	});

	return redirect(`/games/${params.id}`);
};

export default function GameEditRoute() {
	const data = useLoaderData<typeof loader>();
	return (
		<>
			<Header user={data.user} />
			<Main>
				<h1 className="mb-4 text-3xl font-bold">Edit Game</h1>
				<GameForm
					hideDateField={true}
					user={data.user}
					fields={{
						player1Id: data.game.player1Id,
						player2Id: data.game.player2Id,
						player1Score: data.game.player1Score.toString(),
						player2Score: data.game.player2Score.toString(),
						startingServerPlayerId:
							data.game.startingPlayerId === data.game.player1Id
								? 'player'
								: 'opponent',
					}}
					fieldErrors={{
						player2Id: null,
						player1Score: null,
						player2Score: null,
					}}
					formError=""
					handleSubmit={() => {}}
					players={data.opponents}
				/>
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
				<p className="text-thunderbird">
					You must be logged in to edit this game.
				</p>
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

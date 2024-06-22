import React from 'react';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
	isRouteErrorResponse,
	Link,
	useActionData,
	useLoaderData,
	useRouteError,
} from '@remix-run/react';

import { db } from '~/utils/db.server';
import { badRequest } from '~/utils/request.server';
import { getUser, requireUserId } from '~/utils/session.server';

import Header from '~/components/Header/Header';
import { Button } from '~/components/Button/Button';
import { Main } from '~/components/Main/Main';
import { GameForm } from '~/components/GameForm/GameForm';
import { useLocalStorageState } from '~/hooks/useLocalStorage';
import { validateScore } from '~/utils/validations.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const user = await getUser(request);
	if (!user) {
		throw new Response('Unauthorized', { status: 401 });
	}
	const players = await db.user.findMany({
		where: {
			NOT: { id: user.id },
		},
		select: { id: true, username: true },
	});
	return json({ user, players });
};

export const action = async ({ request }: ActionFunctionArgs) => {
	await requireUserId(request);

	const form = await request.formData();

	const player1Id = form.get('player1Id') as string | null;
	const player2Id = form.get('player2Id') as string | null;

	const player1Score = form.get('player1Score') as string | null;
	const player2Score = form.get('player2Score') as string | null;

	const startingServerPlayerId = form.get('startingServerPlayerId') as
		| string
		| null;
	const playedAt = form.get('playedAt') as string | null;

	const fields = {
		player1Id,
		player2Id,
		player1Score,
		player2Score,
		startingServerPlayerId,
		playedAt,
	};
	console.log({ fields });

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

	await db.game.create({
		data: {
			player1Id: player1Id,
			player2Id: player2Id,
			player1Score: parseInt(player1Score, 10),
			player2Score: parseInt(player2Score, 10),
			startingPlayerId:
				startingServerPlayerId === 'player' ? player1Id : player2Id,
			playedAt: playedAt ? new Date(playedAt) : new Date(),
		},
	});

	return redirect(`/games`);
};

export default function NewGameRoute() {
	const data = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const [nextServer, setNextServer] = useLocalStorageState<
		'player' | 'opponent' | null
	>('nextServer', 'player');

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		const formData = new FormData(event.currentTarget);

		const startingServerPlayerId = formData.get('startingServerPlayerId') as
			| string
			| null;

		if (startingServerPlayerId === 'player') {
			setNextServer('opponent');
		} else if (startingServerPlayerId === 'opponent') {
			setNextServer('player');
		}
	}

	return (
		<>
			<Header user={data.user} />
			<Main>
				<h1 className="text-3xl font-bold">Add a new game</h1>
				<GameForm
					handleSubmit={handleSubmit}
					players={data.players}
					user={data.user}
					fields={{
						player1Id: data.user.id,
						player2Id: actionData?.fields?.player2Id,
						player1Score: actionData?.fields?.player1Score,
						player2Score: actionData?.fields?.player2Score,
						startingServerPlayerId:
							actionData?.fields?.startingServerPlayerId || nextServer,
						playedAt: actionData?.fields?.playedAt,
					}}
					fieldErrors={{
						player2Id: actionData?.fieldErrors?.player2Id || undefined,
						player1Score: actionData?.fieldErrors?.player1Score || undefined,
						player2Score: actionData?.fieldErrors?.player2Score || undefined,
					}}
					formError={actionData?.formError || undefined}
				/>
			</Main>
		</>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();

	const content =
		isRouteErrorResponse(error) && error.status === 401 ? (
			<>
				<p className="text-thunderbird">You must be logged in to add a game.</p>
				<Button as={Link} to="/login">
					Login
				</Button>
			</>
		) : (
			<div className="text-thunderbird">
				Something unexpected went wrong. Sorry about that.
			</div>
		);
	return (
		<>
			<Header user={null} />
			<Main>
				<div className="flex flex-col items-center">{content}</div>
			</Main>
		</>
	);
}

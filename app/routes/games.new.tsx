import React from 'react';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
	Form,
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

function validateScore(score: string) {
	const int = parseInt(score, 10);
	if (isNaN(int)) {
		return 'Score must be a number';
	} else if (int < 0) {
		return 'Score must be a positive number';
	}
}

export const action = async ({ request }: ActionFunctionArgs) => {
	await requireUserId(request);

	const form = await request.formData();
	console.log([...form.entries()]);

	const player1Id = form.get('player1Id');
	const player2Id = form.get('player2Id');

	const player1Score = form.get('player1Score');
	const player2Score = form.get('player2Score');

	const startingServerPlayerId = form.get('startingServerPlayerId');
	const playedAt = form.get('playedAt');

	const fields = {
		player1Id,
		player2Id,
		player1Score,
		player2Score,
		startingServerPlayerId,
	};
	console.log({ fields });

	if (
		typeof player1Id !== 'string' ||
		typeof player2Id !== 'string' ||
		typeof player1Score !== 'string' ||
		typeof player2Score !== 'string' ||
		typeof startingServerPlayerId !== 'string' ||
		typeof playedAt !== 'string'
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
			playedAt: new Date(playedAt),
		},
	});

	return redirect(`/games`);
};

export default function NewGameRoute() {
	const data = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	const [nowDateString, setNowDateString] = React.useState('');
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	React.useEffect(() => {
		setNowDateString(
			new Date(new Date().toString().split('GMT')[0] + ' UTC')
				.toISOString()
				.split('.')[0],
		);
	}, []);

	function handleSubmit() {
		setIsSubmitting(true);
	}

	return (
		<>
			<Header user={data.user} />
			<main className="mx-auto flex max-w-96 flex-col px-6">
				<h1 className="text-3xl font-bold">Add a new game</h1>
				<Form method="post" className="card" onSubmit={handleSubmit}>
					<input type="hidden" name="player1Id" value={data.user.id} />

					<div className="my-2 mb-4 flex flex-col gap-2">
						<label className="text-sm font-bold" htmlFor="player2Id">
							Opponent
						</label>
						<select
							className="h-12 rounded-none border-2 border-black bg-sand px-2 py-1 text-lg"
							id="player2Id"
							name="player2Id"
							required
						>
							{data.players
								.filter((player) => player.id !== data.user.id)
								.map((player) => (
									<option key={player.id} value={player.id}>
										{player.username}
									</option>
								))}
						</select>
					</div>

					<div className="my-2 mb-4 flex flex-col gap-2">
						<label className="text-sm font-bold" htmlFor="player1Score">
							Your score
						</label>
						<input
							className="h-12 rounded-none border-2 border-black bg-sand px-2 py-1 text-lg"
							id="player1Score"
							required
							min={0}
							type="number"
							name="player1Score"
							defaultValue={actionData?.fields?.player1Score}
						/>
					</div>

					<div className="my-2 mb-4 flex flex-col gap-2">
						<label className="text-sm font-bold" htmlFor="player2Score">
							Opponent’s score
						</label>
						<input
							className="h-12 rounded-none border-2 border-black bg-sand px-2 py-1 text-lg"
							id="player2Score"
							required
							min={0}
							type="number"
							name="player2Score"
							defaultValue={actionData?.fields?.player2Score}
						/>
					</div>

					<div className="my-2 mb-4 flex flex-col gap-2">
						<p className="text-sm font-bold">Who served first?</p>
						<div className="flex justify-between gap-4">
							<label
								className="flex h-12 basis-1/2 items-center gap-4 rounded-xl border-2 border-black bg-sand px-2 py-1 text-lg"
								htmlFor="startingServerPlayer1"
							>
								<input
									className="size-8 rounded-sm border-2 accent-orange"
									id="startingServerPlayer1"
									type="radio"
									name="startingServerPlayerId"
									value="player"
									defaultChecked={
										actionData?.fields?.startingServerPlayerId === 'player'
									}
								/>
								You
							</label>
							<label
								className="flex basis-1/2 items-center gap-4 rounded-xl border-2 border-black bg-sand px-2 py-1 text-lg"
								htmlFor="startingServerPlayer2"
							>
								<input
									className="size-8 rounded-sm border-2 accent-orange"
									id="startingServerPlayer2"
									type="radio"
									name="startingServerPlayerId"
									value="opponent"
									defaultChecked={
										actionData?.fields?.startingServerPlayerId === 'opponent'
									}
								/>
								Opponent
							</label>
						</div>
					</div>

					<div className="my-2 mb-4 flex flex-col gap-2">
						<label className="text-sm font-bold" htmlFor="playedAt">
							Played on
						</label>
						<input
							className="h-12 appearance-none rounded-none border-2 border-black bg-sand px-2 py-1 text-lg"
							id="playedAt"
							type="datetime-local"
							name="playedAt"
							defaultValue={nowDateString}
						/>
					</div>

					<div className="mt-8 flex flex-col items-center">
						{actionData?.formError ? (
							<p className="my-2 font-bold text-thunderbird" role="alert">
								{actionData.formError}
							</p>
						) : null}

						<Button type="submit" disabled={isSubmitting}>
							Submit
						</Button>
					</div>
				</Form>
			</main>
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
			<main className="mx-auto flex max-w-96 flex-col px-6">
				<div className="flex flex-col items-center">{content}</div>
			</main>
		</>
	);
}

import type { ActionFunctionArgs, LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
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

import stylesUrl from '~/styles/new-game.css?url';
import Header from '~/components/Header/Header';

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stylesUrl }];

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
	const fields = { player1Id, player2Id, player1Score, player2Score, startingServerPlayerId };

	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({
			fieldErrors,
			fields,
			formError: null,
		});
	}

	const game = await db.game.create({
		data: {
			player1Id: player1Id,
			player2Id: player2Id,
			player1Score: parseInt(player1Score, 10),
			player2Score: parseInt(player2Score, 10),
			startingPlayerId: startingServerPlayerId === 'player' ? player1Id : player2Id,
			playedAt: new Date(playedAt),
		},
	});

	return redirect(`/games/${game.id}`);
};

export default function NewGameRoute() {
	const data = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	return (
		<>
			<Header user={data.user} />
			<main>
				<p>Add a new game</p>
				<form method='post' className='new-game-form'>
					<input type='hidden' name='player1Id' value={data.user.id} />
					<div>
						<label>
							Opponent:
							<select name='player2Id' required>
								{data.players
									.filter((player) => player.id !== data.user.id)
									.map((player) => (
										<option key={player.id} value={player.id}>
											{player.username}
										</option>
									))}
							</select>
						</label>
					</div>

					<div>
						<label>
							Your score:
							<input
								required
								min={0}
								type='number'
								name='player1Score'
								defaultValue={actionData?.fields?.player1Score}
							/>
						</label>
					</div>

					<div>
						<label>
							Opponent’s score:
							<input
								required
								min={0}
								type='number'
								name='player2Score'
								defaultValue={actionData?.fields?.player2Score}
							/>
						</label>
					</div>

					<div>
						<p>Who served first?</p>
						<label>
							<input
								type='radio'
								name='startingServerPlayerId'
								value='player'
								defaultChecked={actionData?.fields?.startingServerPlayerId === 'player'}
							/>
							You
						</label>
						<label>
							<input
								type='radio'
								name='startingServerPlayerId'
								value='opponent'
								defaultChecked={actionData?.fields?.startingServerPlayerId === 'opponent'}
							/>
							Opponent
						</label>
					</div>

					<label>
						Played On:
						<input type='datetime-local' name='playedAt' />
					</label>

					<div>
						{actionData?.formError ? (
							<p className='form-validation-error' role='alert'>
								{actionData.formError}
							</p>
						) : null}

						<button type='submit'>Submit</button>
					</div>
				</form>
			</main>
		</>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();

	if (isRouteErrorResponse(error) && error.status === 401) {
		return (
			<div className='error-container'>
				<p>You must be logged in to add a game.</p>
				<Link to='/login'>Login</Link>
			</div>
		);
	}

	return <div className='error-container'>Something unexpected went wrong. Sorry about that.</div>;
}

import React from 'react';
import { Form } from '@remix-run/react';
import { Button } from '../Button/Button';
import { SelectInput, NumberInput, Input } from '../Form/Form';

type GameFormProps = {
	fields: {
		player1Id?: string | null;
		player2Id?: string | null;
		player1Score?: string | null;
		player2Score?: string | null;
		startingServerPlayerId?: string | null;
		playedAt?: string | null;
	};
	fieldErrors: {
		player2Id?: string | null;
		player1Score?: string | null;
		player2Score?: string | null;
	};
	players: { id: string; username: string }[];
	user: { id: string };
	formError?: string;
};

export function GameForm({
	fieldErrors,
	players,
	fields,
	user,
	formError,
}: GameFormProps) {
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	return (
		<Form
			method="post"
			onSubmit={() => {
				setIsSubmitting(true);
			}}
		>
			<input type="hidden" name="player1Id" value={user.id} />

			<div className="my-2 mb-4 flex flex-col gap-2">
				<SelectInput
					label="Opponent"
					name="player2Id"
					required
					error={fieldErrors?.player2Id}
					defaultValue={fields?.player2Id || undefined}
				>
					{players
						.filter((player) => player.id !== user.id)
						.map((player) => (
							<option key={player.id} value={player.id}>
								{player.username}
							</option>
						))}
				</SelectInput>
			</div>

			<div className="my-2 mb-4 flex flex-col gap-2">
				<NumberInput
					label="Your score"
					name="player1Score"
					required
					min={0}
					type="number"
					defaultValue={
						typeof fields?.player1Score === 'string'
							? fields.player1Score
							: undefined
					}
					error={fieldErrors?.player1Score}
				/>
			</div>

			<div className="my-2 mb-4 flex flex-col gap-2">
				<NumberInput
					label="Opponent’s score"
					name="player2Score"
					required
					min={0}
					type="number"
					defaultValue={
						typeof fields?.player2Score === 'string'
							? fields.player2Score
							: undefined
					}
					error={fieldErrors?.player2Score}
				/>
			</div>

			<fieldset className="my-2 mb-4 flex flex-col gap-2">
				<legend className="text-sm font-bold">Who served first?</legend>
				<div className="flex justify-between gap-4">
					<label
						className="text-md flex h-12 basis-1/2 items-center gap-4 rounded-xl border-2 border-black bg-sand px-2 py-1"
						htmlFor="startingServerPlayer1"
					>
						<input
							className="size-8 rounded-sm border-2 accent-orange"
							id="startingServerPlayer1"
							type="radio"
							name="startingServerPlayerId"
							value="player"
							defaultChecked={fields?.startingServerPlayerId === 'player'}
						/>
						You
					</label>
					<label
						className="text-md flex basis-1/2 items-center gap-4 rounded-xl border-2 border-black bg-sand px-2 py-1"
						htmlFor="startingServerPlayer2"
					>
						<input
							className="size-8 rounded-sm border-2 accent-orange"
							id="startingServerPlayer2"
							type="radio"
							name="startingServerPlayerId"
							value="opponent"
							defaultChecked={fields?.startingServerPlayerId === 'opponent'}
						/>
						Opponent
					</label>
				</div>
			</fieldset>

			<div className="mb-4 mt-2">
				<Input
					label="Played on"
					id="playedAt"
					type="datetime-local"
					name="playedAt"
					defaultValue={fields?.playedAt || undefined}
				/>
			</div>

			<div className="mt-8 flex flex-col items-center">
				{formError ? (
					<p className="text-thunderbird my-2 font-bold" role="alert">
						{formError}
					</p>
				) : null}

				<Button type="submit" disabled={isSubmitting}>
					Submit
				</Button>
			</div>
		</Form>
	);
}

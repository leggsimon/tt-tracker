import {
	LoaderFunctionArgs,
	json,
	redirect,
	type MetaFunction,
} from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import Header from '~/components/Header/Header';
import { getUser } from '~/utils/session.server';

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

	if (user) {
		return redirect('/games'); // FIXME: Redirect to the games index page
	}

	return json({ user });
};

export default function Index() {
	const data = useLoaderData<typeof loader>();

	return (
		<>
			<Header user={data.user} />
			<main>
				<h1>🏓 Table Tennis Tracker!</h1>
			</main>
		</>
	);
}

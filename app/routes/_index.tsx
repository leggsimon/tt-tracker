import { LinksFunction, LoaderFunctionArgs, json, type MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import Header from '~/components/Header/Header';
import { getUser } from '~/utils/session.server';
import stylesUrl from '~/styles/index.css?url';

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

	return json({ user });
};

export default function Index() {
	const data = useLoaderData<typeof loader>();

	return (
		<>
			<Header user={data.user} />
			<div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.8' }}>
				<h1>Welcome to Remix</h1>
				<ul>
					<li>
						<a target='_blank' href='https://remix.run/tutorials/blog' rel='noreferrer'>
							We only deploy commited code now
						</a>
					</li>
					<li>
						<a target='_blank' href='https://remix.run/tutorials/jokes' rel='noreferrer'>
							Deep Dive Jokes App Tutorial
						</a>
					</li>
					<li>
						<a target='_blank' href='https://remix.run/docs' rel='noreferrer'>
							Remix Docs
						</a>
					</li>
				</ul>
			</div>
		</>
	);
}

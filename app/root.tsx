import { captureRemixErrorBoundaryError } from '@sentry/remix';
import { LinksFunction } from '@remix-run/node';
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteError,
} from '@remix-run/react';
import stylesheet from '~/styles/tailwind.css?url';

export const links: LinksFunction = () => [
	{ rel: 'stylesheet', href: stylesheet },
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="bg-linen">
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export const ErrorBoundary = () => {
	const error = useRouteError();
	captureRemixErrorBoundaryError(error);
	return <div>Something went wrong</div>;
};

export default function App() {
	return <Outlet />;
}

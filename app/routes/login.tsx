import type { ActionFunctionArgs, MetaFunction } from '@remix-run/node';
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react';
import { Button } from '~/components/Button/Button';
import { PasswordInput, Input } from '~/components/Form/Form';
import { Main } from '~/components/Main/Main';

import { db } from '~/utils/db.server';
import { badRequest } from '~/utils/request.server';
import { createUserSession, login, register } from '~/utils/session.server';

function validateUsername(username: string) {
	if (username.length < 3) {
		return 'Usernames must be at least 3 characters long';
	}
}

function validatePassword(password: string) {
	if (password.length < 6) {
		return 'Passwords must be at least 6 characters long';
	}
}

function validateUrl(url: string) {
	const urls = ['/', 'https://remix.run'];
	if (urls.includes(url)) {
		return url;
	}
	return '/';
}

export const action = async ({ request }: ActionFunctionArgs) => {
	const form = await request.formData();
	const loginType = form.get('loginType');
	const password = form.get('password');
	const username = form.get('username');
	const redirectTo = validateUrl((form.get('redirectTo') as string) || '/');
	console.log({ username, loginType }); // FIXME: remove

	if (
		typeof loginType !== 'string' ||
		typeof password !== 'string' ||
		typeof username !== 'string'
	) {
		return badRequest({
			fieldErrors: null,
			fields: null,
			formError: 'Form not submitted correctly.',
		});
	}

	const fields = { loginType, password, username };
	const fieldErrors = {
		password: validatePassword(password),
		username: validateUsername(username),
	};
	if (Object.values(fieldErrors).some(Boolean)) {
		return badRequest({
			fieldErrors,
			fields,
			formError: null,
		});
	}

	switch (loginType) {
		case 'login': {
			const user = await login({ username, password });
			console.log({ user }); // TODO: remove
			if (!user) {
				return badRequest({
					fieldErrors: null,
					fields,
					formError: 'Username/Password combination is incorrect',
				});
			}

			return createUserSession(user.id, redirectTo);
		}
		case 'register': {
			const userExists = await db.user.findFirst({
				where: { username },
			});
			if (userExists) {
				return badRequest({
					fieldErrors: null,
					fields,
					formError: `User with username ${username} already exists`,
				});
			}

			const user = await register({ username, password });
			if (!user) {
				return badRequest({
					fieldErrors: null,
					fields,
					formError: 'Something went wrong trying to create a new user.',
				});
			}
			return createUserSession(user.id, redirectTo);
		}
		default: {
			return badRequest({
				fieldErrors: null,
				fields,
				formError: `Login type invalid. Got "${loginType}"`,
			});
		}
	}
};

export default function Login() {
	const actionData = useActionData<typeof action>();
	const [searchParams] = useSearchParams();
	return (
		<Main>
			<div className="grid h-screen place-content-center gap-6">
				<div className="border-4 bg-linen p-4 shadow-xl">
					<h1 className="mb-6 text-3xl font-bold">Login</h1>
					<Form method="post">
						<input
							type="hidden"
							name="redirectTo"
							value={searchParams.get('redirectTo') ?? undefined}
						/>
						<fieldset className="flex justify-between gap-4">
							<legend className="sr-only">Login or Register?</legend>
							<label className="text-md flex h-12 basis-1/2 items-center gap-4 rounded-xl border-2 border-black bg-sand px-2 py-1">
								<input
									className="size-8 rounded-sm border-2 accent-orange"
									type="radio"
									name="loginType"
									value="login"
									data-1p-ignore
									defaultChecked={
										!actionData?.fields?.loginType ||
										actionData?.fields?.loginType === 'login'
									}
								/>{' '}
								Login
							</label>
							<label className="text-md flex h-12 basis-1/2 items-center gap-4 rounded-xl border-2 border-black bg-sand px-2 py-1">
								<input
									className="size-8 rounded-sm border-2 accent-orange"
									type="radio"
									name="loginType"
									value="register"
									data-1p-ignore
									defaultChecked={actionData?.fields?.loginType === 'register'}
								/>{' '}
								Register
							</label>
						</fieldset>
						<div className="mb-4 mt-2">
							<Input
								label="Username"
								required
								id="username-input"
								name="username"
								defaultValue={actionData?.fields?.username}
								error={actionData?.fieldErrors?.username}
							/>
						</div>
						<div className="mb-4 mt-2">
							<PasswordInput
								label="Password"
								required
								id="password-input"
								name="password"
								defaultValue={actionData?.fields?.password}
								error={actionData?.fieldErrors?.password}
							/>
						</div>
						<div className="mt-8 flex flex-col items-center">
							{actionData?.formError ? (
								<p className="text-thunderbird my-2 font-bold" role="alert">
									{actionData.formError}
								</p>
							) : null}
							<Button type="submit" className="button">
								Submit
							</Button>
						</div>
					</Form>
				</div>
				<ul className="flex justify-center">
					<li>
						<Link className="text-xs" to="/">
							Home
						</Link>
					</li>
				</ul>
			</div>
		</Main>
	);
}

export const meta: MetaFunction = () => {
	return [{ title: 'Login | 🏓 Table Tennis Tracker' }];
};

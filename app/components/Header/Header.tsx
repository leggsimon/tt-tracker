import { Form, Link } from '@remix-run/react';
import React from 'react';
import { Button } from '../Button/Button';

interface HeaderProps {
	user: {
		id: string;
		username: string;
	} | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
	return (
		<header className="mb-8 flex flex-row items-center border-b-2 bg-linen px-4 py-4 md:mb-16 md:px-24">
			<div className="flex w-full items-center">
				<div className="font-display text-2xl font-bold uppercase">🏓</div>
				<nav className="mx-6 flex-grow">
					<ul className="flex flex-row items-center gap-5">
						<li className="text-sm">
							<Link to="/games">Games</Link>
						</li>
					</ul>
				</nav>
				<div className="flex flex-row items-center gap-6 place-self-end">
					{user ? (
						<>
							<span className="text-sm">Hi, {user.username}!</span>
							<Form action="/logout" method="post">
								<Button type="submit">Logout</Button>
							</Form>
						</>
					) : (
						<Button as={Link} to="/login">
							Login
						</Button>
					)}
				</div>
			</div>
		</header>
	);
};

export default Header;

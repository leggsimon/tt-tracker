import { Form, Link } from '@remix-run/react';
import React from 'react';
import './Header.css';

interface HeaderProps {
	user: {
		id: string;
		username: string;
	} | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
	return (
		<header className='Header'>
			<div className='Header-NavContainer'>
				<div className='logo'>Logo</div>
				<nav className='Header-NavigationLinksContainer'>
					<ul className='Header-NavigationLinks'>
						<li>
							<Link to='/'>Home</Link>
						</li>
					</ul>
				</nav>
				<div className='Header-UserActions'>
					{user ? (
						<>
							<span>Hi, {user.username}!</span>
							<Form action='/logout' method='post'>
								<button type='submit' className='button'>
									Logout
								</button>
							</Form>
						</>
					) : (
						<Link to='/login'>Login</Link>
					)}
				</div>
			</div>
		</header>
	);
};

export default Header;

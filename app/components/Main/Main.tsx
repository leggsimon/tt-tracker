export function Main({ children }: { children: React.ReactNode }) {
	return (
		<main className="mx-auto flex max-w-96 flex-col px-6">{children}</main>
	);
}

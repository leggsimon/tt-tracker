// Define the base props for the Button component
interface BaseProps {
	children: React.ReactNode;
}

// Create a utility type for merging props
type PolymorphicProps<E extends React.ElementType, P> = P & {
	as?: E;
} & Omit<React.ComponentPropsWithoutRef<E>, keyof P>;

export function Button<C extends React.ElementType = 'button'>({
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	className,
	children,
	as,
	...props
}: PolymorphicProps<C, BaseProps>) {
	const Component = as || 'button';
	return (
		<Component
			{...props}
			className="border-3 border-black bg-orange px-6 py-2 text-sm font-bold shadow-md hover:bg-sand focus:bg-sand"
		>
			{children}
		</Component>
	);
}

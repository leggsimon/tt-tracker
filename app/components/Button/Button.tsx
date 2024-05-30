type ButtonProps = React.ComponentProps<'button'> & {
	as?: React.ElementType;
};
export function Button({
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	className,
	children,
	as: Component = 'button',
	...props
}: ButtonProps) {
	return (
		<Component
			{...props}
			className="border-3 border-black bg-orange px-6 py-2 text-sm font-bold shadow-md hover:bg-sand focus:bg-sand"
		>
			{children}
		</Component>
	);
}

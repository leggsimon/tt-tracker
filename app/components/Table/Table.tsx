export function Table({
	children,
	...props
}: React.HTMLAttributes<HTMLTableElement>) {
	return (
		<table className="border-3 my-6 w-full" {...props}>
			{children}
		</table>
	);
}

export function TableHead({
	children,
	...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
	return <thead {...props}>{children}</thead>;
}

export function TableHeaderRow({
	children,
	...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
	return (
		<tr className="border-3 border-black bg-sand text-lg font-bold" {...props}>
			{children}
		</tr>
	);
}

export function TableHeaderCell({
	children,
	...props
}: React.HTMLAttributes<HTMLTableCellElement>) {
	return (
		<th className="p-2" {...props}>
			{children}
		</th>
	);
}

export function TableBody({
	children,
	...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
	return <tbody {...props}>{children}</tbody>;
}

export function TableRow({
	children,
	...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
	return (
		<tr className="border-b border-casal/15 bg-linen" {...props}>
			{children}
		</tr>
	);
}

export function TableCell({
	children,
	...props
}: React.HTMLAttributes<HTMLTableCellElement>) {
	return (
		<td className="p-4 text-center" {...props}>
			{children}
		</td>
	);
}

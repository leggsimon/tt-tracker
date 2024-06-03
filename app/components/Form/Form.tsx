import React from 'react';
import { v4 as uuidv4 } from 'uuid'; // Using this instead of crypto.randomUUID() because crypto.randomUUID() is not available in iOS Safari over localhost http

type InputProps = React.DetailedHTMLProps<
	React.InputHTMLAttributes<HTMLInputElement>,
	HTMLInputElement
> & {
	label: string;
	error?: string | null;
	type?: React.InputHTMLAttributes<HTMLInputElement>['type'];
};

export function Input({
	label,
	error,
	type = 'text',
	...inputProps
}: InputProps) {
	const inputRef = React.useRef(inputProps?.id || uuidv4());
	const errorRef = React.useRef<string>(
		inputProps?.id ? `${inputProps.id}-error` : uuidv4(),
	);

	return (
		<div className="flex flex-col">
			<label className="mb-2 text-sm font-bold" htmlFor={inputRef.current}>
				{label}
			</label>
			<input
				{...inputProps}
				id={inputRef.current}
				className={`h-12 rounded-none border-2 ${error ? 'border-thunderbird' : 'border-black'} bg-sand px-2 py-1 text-lg`}
				type={type}
				aria-invalid={Boolean(error)}
				aria-errormessage={error ? errorRef.current : undefined}
			/>
			{error ? <FieldError id={errorRef.current}>{error}</FieldError> : null}
		</div>
	);
}

export function TextInput(props: InputProps) {
	return <Input {...props} type="text" />;
}

export function PasswordInput(props: InputProps) {
	return <Input {...props} type="password" />;
}

export function NumberInput(props: InputProps) {
	return <Input {...props} type="number" />;
}

type SelectProps = React.DetailedHTMLProps<
	React.SelectHTMLAttributes<HTMLSelectElement>,
	HTMLSelectElement
> & {
	label: string;
	error?: string | null;
};

export function SelectInput({
	label,
	error,
	children,
	...inputProps
}: SelectProps) {
	const inputRef = React.useRef(inputProps?.id || uuidv4());
	const errorRef = React.useRef<string>(
		inputProps?.id ? `${inputProps.id}-error` : uuidv4(),
	);

	return (
		<div className="flex flex-col">
			<label className="mb-2 text-sm font-bold" htmlFor={inputRef.current}>
				{label}
			</label>
			<select
				{...inputProps}
				id={inputRef.current}
				className={`h-12 rounded-none border-2 ${error ? 'border-thunderbird' : 'border-black'} bg-sand px-2 py-1 text-lg`}
				aria-invalid={Boolean(error)}
				aria-errormessage={error ? errorRef.current : undefined}
			>
				{children}
			</select>
			{error ? <FieldError id={errorRef.current}>{error}</FieldError> : null}
		</div>
	);
}

function FieldError({
	id,
	children,
}: {
	id: string;
	children: React.ReactNode;
}) {
	return (
		<p id={id} className="text-thunderbird font-bold" role="alert">
			{children}
		</p>
	);
}

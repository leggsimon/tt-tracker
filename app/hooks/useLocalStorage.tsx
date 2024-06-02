import React from 'react';

export function useLocalStorageState<T>(
	key: string,
	initialValue?: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
	const [state, setState] = React.useState(() => {
		const value =
			typeof window !== 'undefined' && window?.localStorage?.getItem(key);
		if (value) {
			return JSON.parse(value);
		}
		return initialValue;
	});

	React.useEffect(() => {
		if (typeof window !== 'undefined') {
			window?.localStorage?.setItem(key, JSON.stringify(state));
		}
	}, [key, state]);

	return [state, setState];
}

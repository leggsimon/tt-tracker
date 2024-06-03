export function validateScore(score: string) {
	const int = parseInt(score, 10);
	if (isNaN(int)) {
		return 'Score must be a number';
	} else if (int < 0) {
		return 'Score must be a positive number';
	}
}

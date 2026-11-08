export const cn = (...classes: (string | undefined | null | false)[]): string => {
	return classes.filter(Boolean).join(' ');
};

export const formatNumber = (num: number): string => {
	return new Intl.NumberFormat('en-US').format(num);
};

export const formatDate = (date: Date | string): string => {
	const d = new Date(date);
	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	}).format(d);
};

export const debounce = <T extends (...args: any[]) => any>(
	func: T,
	wait: number
): ((...args: Parameters<T>) => void) => {
	let timeout: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
};

export const truncate = (str: string, length: number): string => {
	return str.length > length ? str.slice(0, length) + '...' : str;
};

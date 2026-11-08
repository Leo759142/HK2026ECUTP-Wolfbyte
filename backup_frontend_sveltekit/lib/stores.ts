import { writable } from 'svelte/store';

export const theme = writable<'light' | 'dark'>('light');

export const toggleTheme = () => {
	theme.update((t: 'light' | 'dark') => (t === 'light' ? 'dark' : 'light'));
};

export const sidebarOpen = writable(false);

export const user = writable<{
	id: string;
	name: string;
	email: string;
	avatar?: string;
} | null>(null);

export const notifications = writable<
	{
		id: string;
		type: 'success' | 'error' | 'warning' | 'info';
		message: string;
	}[]
>([]);

export const addNotification = (
	type: 'success' | 'error' | 'warning' | 'info',
	message: string
) => {
	const id = Math.random().toString(36).slice(2);
	notifications.update((n) => [...n, { id, type, message }]);
	setTimeout(() => {
		notifications.update((n) => n.filter((x) => x.id !== id));
	}, 5000);
};
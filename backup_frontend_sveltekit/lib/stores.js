import { writable } from 'svelte/store';

export const theme = writable('light');

export const toggleTheme = () => {
	theme.update((t) => (t === 'light' ? 'dark' : 'light'));
};

export const sidebarOpen = writable(false);

export const user = writable(null);

export const notifications = writable([]);

export const addNotification = (type, message) => {
	const id = Math.random().toString(36).slice(2);
	notifications.update((n) => [...n, { id, type, message }]);
	setTimeout(() => {
		notifications.update((n) => n.filter((x) => x.id !== id));
	}, 5000);
};
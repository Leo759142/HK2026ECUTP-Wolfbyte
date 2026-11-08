import { writable } from 'svelte/store';

export const theme = writable('light');

export const toggleTheme = () => {
	theme.update((t) => (t === 'light' ? 'dark' : 'light'));
};

export const sidebarOpen = writable(false);

export const user = writable(null);
export const session = writable(null);

export function hydrateSession() {
	if (typeof localStorage === 'undefined') return null;
	try {
		const value = JSON.parse(localStorage.getItem('ayni:v1:session') || 'null');
		if (!value?.usuarioId || (value.expiraEn && Date.now() >= value.expiraEn)) {
			localStorage.removeItem('ayni:v1:session');
			return null;
		}
		session.set(value);
		user.set(value);
		return value;
	} catch {
		localStorage.removeItem('ayni:v1:session');
		return null;
	}
}

export function persistSession(value) {
	session.set(value);
	user.set(value);
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('ayni:v1:session', JSON.stringify(value));
	}
}

export function clearSession() {
	session.set(null);
	user.set(null);
	if (typeof localStorage !== 'undefined') localStorage.removeItem('ayni:v1:session');
}

export const notifications = writable([]);

export const addNotification = (type, message) => {
	const id = Math.random().toString(36).slice(2);
	notifications.update((n) => [...n, { id, type, message }]);
	setTimeout(() => {
		notifications.update((n) => n.filter((x) => x.id !== id));
	}, 5000);
};

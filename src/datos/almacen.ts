import { browser } from '$app/env';

export interface AlmacenKV {
	get<T>(key: string): Promise<T | null>;
	set<T>(key: string, value: T): Promise<void>;
	del(key: string): Promise<void>;
	keys(prefix?: string): Promise<string[]>;
}

class MemoriaKV implements AlmacenKV {
	private data = new Map<string, unknown>();
	async get<T>(key: string) {
		return this.data.has(key) ? (this.data.get(key) as T) : null;
	}
	async set<T>(key: string, value: T) {
		this.data.set(key, value);
	}
	async del(key: string) {
		this.data.delete(key);
	}
	async keys(prefix = '') {
		return [...this.data.keys()].filter((k) => k.startsWith(prefix));
	}
}

class LocalStorageKV implements AlmacenKV {
	constructor(private ns: string) {}
	private k(key: string) {
		return `${this.ns}:${key}`;
	}
	async get<T>(key: string): Promise<T | null> {
		try {
			const raw = globalThis.localStorage?.getItem(this.k(key));
			return raw ? (JSON.parse(raw) as T) : null;
		} catch {
			return null;
		}
	}
	async set<T>(key: string, value: T): Promise<void> {
		globalThis.localStorage?.setItem(this.k(key), JSON.stringify(value));
	}
	async del(key: string): Promise<void> {
		globalThis.localStorage?.removeItem(this.k(key));
	}
	async keys(prefix = ''): Promise<string[]> {
		const out: string[] = [];
		const p = this.k(prefix);
		const ls = globalThis.localStorage;
		if (!ls) return out;
		for (let i = 0; i < ls.length; i++) {
			const key = ls.key(i);
			if (key?.startsWith(p)) out.push(key.slice(this.ns.length + 1));
		}
		return out;
	}
}

class IndexedDbKV implements AlmacenKV {
	private dbp: Promise<IDBDatabase> | null = null;
	constructor(
		private name: string,
		private store = 'kv'
	) {}
	private db() {
		if (this.dbp) return this.dbp;
		this.dbp = new Promise((resolve, reject) => {
			const req = indexedDB.open(this.name, 1);
			req.onupgradeneeded = () => {
				if (!req.result.objectStoreNames.contains(this.store))
					req.result.createObjectStore(this.store);
			};
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
		return this.dbp;
	}
	private async tx<T>(
		mode: IDBTransactionMode,
		fn: (store: IDBObjectStore) => IDBRequest<T>
	): Promise<T> {
		const db = await this.db();
		return new Promise((resolve, reject) => {
			const t = db.transaction(this.store, mode);
			const req = fn(t.objectStore(this.store));
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
	}
	async get<T>(key: string): Promise<T | null> {
		const v = await this.tx('readonly', (s) => s.get(key));
		return (v ?? null) as T | null;
	}
	async set<T>(key: string, value: T): Promise<void> {
		await this.tx('readwrite', (s) => s.put(value as unknown, key));
	}
	async del(key: string): Promise<void> {
		await this.tx('readwrite', (s) => s.delete(key));
	}
	async keys(prefix = ''): Promise<string[]> {
		const db = await this.db();
		return new Promise((resolve, reject) => {
			const t = db.transaction(this.store, 'readonly');
			const req = t.objectStore(this.store).getAllKeys();
			req.onsuccess = () =>
				resolve((req.result as string[]).filter((k) => String(k).startsWith(prefix)));
			req.onerror = () => reject(req.error);
		});
	}
}

let _kv: AlmacenKV | null = null;
export function obtenerAlmacenKV(): AlmacenKV {
	if (_kv) return _kv;
	if (!browser) _kv = new MemoriaKV();
	else if (typeof indexedDB !== 'undefined') _kv = new IndexedDbKV('proyecto_onedrive_v1');
	else if (typeof localStorage !== 'undefined') _kv = new LocalStorageKV('pod');
	else _kv = new MemoriaKV();
	return _kv;
}

export async function transaccionLocal<T>(fn: (kv: AlmacenKV) => Promise<T>): Promise<T> {
	return fn(obtenerAlmacenKV());
}

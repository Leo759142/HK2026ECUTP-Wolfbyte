/* ==================================================================
 *  AYNI · Logger estructurado para debug console
 *  Niveles: debug, info, warn, error
 *  Categorías: auth, sync, network, render, storage, api
 * ===================================================================== */

export const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const DEFAULT_LEVEL = import.meta.env.DEV ? 'debug' : 'warn';

export const CATEGORIES = ['auth', 'sync', 'network', 'render', 'storage', 'api'];

class Logger {
  constructor() {
    this.level = DEFAULT_LEVEL;
    this.enabledCategories = new Set(CATEGORIES);
    this.logs = [];
    this.maxLogs = 500;
    this.subscribers = new Set();
  }

  setLevel(level) {
    if (level in LOG_LEVELS) this.level = level;
  }

  setCategory(category, enabled) {
    if (enabled) this.enabledCategories.add(category);
    else this.enabledCategories.delete(category);
  }

  shouldLog(level, category) {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level] && this.enabledCategories.has(category);
  }

  log(level, category, message, data = {}) {
    if (!this.shouldLog(level, category)) return;

    const entry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      userId: null, // Se llena desde app si está disponible
      route: null,
      action: null,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs.shift();

    this.subscribers.forEach(fn => fn(entry));

    // También log a consola nativa
    const prefix = `[AYNI:${category}]`;
    console[level](prefix, message, data);
  }

  debug(category, message, data) { this.log('debug', category, message, data); }
  info(category, message, data) { this.log('info', category, message, data); }
  warn(category, message, data) { this.log('warn', category, message, data); }
  error(category, message, data) { this.log('error', category, message, data); }

  subscribe(fn) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  getLogs({ level, category, since, limit = 100 } = {}) {
    let filtered = this.logs;
    if (level) filtered = filtered.filter(l => l.level === level);
    if (category) filtered = filtered.filter(l => l.category === category);
    if (since) filtered = filtered.filter(l => l.timestamp >= since);
    return filtered.slice(-limit);
  }

  clear() {
    this.logs = [];
    this.subscribers.forEach(fn => fn({ type: 'clear' }));
  }
}

export const logger = new Logger();

/* Helpers con contexto automático */
export function logAuth(level, message, data = {}) {
  logger.log(level, 'auth', message, { ...data, userId: data.userId });
}

export function logSync(level, message, data = {}) {
  logger.log(level, 'sync', message, data);
}

export function logNetwork(level, message, data = {}) {
  logger.log(level, 'network', message, data);
}

export function logRender(level, message, data = {}) {
  logger.log(level, 'render', message, data);
}

export function logStorage(level, message, data = {}) {
  logger.log(level, 'storage', message, data);
}

export function logApi(level, message, data = {}) {
  logger.log(level, 'api', message, data);
}
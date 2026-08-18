/**
 * Structured logging.
 *
 * STDOUT IS THE PROTOCOL CHANNEL. On the stdio transport, one stray
 * `console.log` corrupts the JSON-RPC stream and the session dies with an
 * unhelpful parse error. Every log line this server emits therefore goes
 * to stderr, and every line passes through value-based redaction on the
 * way out.
 */

import { redactValue } from './redact.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export interface LoggerOptions {
  level?: LogLevel;
  /** Injected in tests; defaults to stderr. */
  sink?: (line: string) => void;
  /** Fields merged into every record from this logger. */
  base?: Record<string, unknown>;
  /** Fixed clock for deterministic tests. */
  now?: () => Date;
}

export class Logger {
  private readonly level: LogLevel;
  private readonly sink: (line: string) => void;
  private readonly base: Record<string, unknown>;
  private readonly now: () => Date;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? 'info';
    this.sink = options.sink ?? ((line) => process.stderr.write(line + '\n'));
    this.base = options.base ?? {};
    this.now = options.now ?? (() => new Date());
  }

  child(fields: Record<string, unknown>): Logger {
    return new Logger({ level: this.level, sink: this.sink, base: { ...this.base, ...fields }, now: this.now });
  }

  debug(message: string, fields?: Record<string, unknown>): void { this.write('debug', message, fields); }
  info(message: string, fields?: Record<string, unknown>): void { this.write('info', message, fields); }
  warn(message: string, fields?: Record<string, unknown>): void { this.write('warn', message, fields); }
  error(message: string, fields?: Record<string, unknown>): void { this.write('error', message, fields); }

  private write(level: LogLevel, message: string, fields?: Record<string, unknown>): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.level]) return;
    const record = redactValue({
      ts: this.now().toISOString(),
      level,
      msg: message,
      ...this.base,
      ...(fields ?? {}),
    });
    this.sink(JSON.stringify(record));
  }
}

/** A logger that discards everything — for tests that do not assert on logs. */
export const silentLogger = new Logger({ level: 'error', sink: () => {} });

/**
 * Defines the available logging severity levels
 */
export enum Severity {
  // eslint-disable-next-line no-unused-vars
  Info = "info",
  // eslint-disable-next-line no-unused-vars
  Warning = "warn",
  // eslint-disable-next-line no-unused-vars
  Error = "error"
}

/**
 * Defines a stream which can be used for logging
 */
export interface LoggingStream {
  info(message?: unknown, ...optionalParams: unknown[]);
  warn(message?: unknown, ...optionalParams: unknown[]);
  error(message?: unknown, ...optionalParams: unknown[]);
  df?;
}

/**
 * Responsible for logging messages using a given stream and an optional source
 */
export class Logger {
  /** Stream to use when logging messages */
  readonly stream: LoggingStream;

  /** An optional source tag */
  readonly source: string;

  /**
   * Creates a new {@link Logger} instance
   * @param stream The {@link LoggingStream} to use when logging messages
   * @param source An optional source tag (used for identifying different sections of code)
   */
  constructor(stream: LoggingStream = console, source: string) {
    this.stream = stream;
    this.source = source;
  }

  /**
   * Logs a message to the {@link LoggingStream}
   * @param severity The severity of the message
   * @param message The message to log
   */
  log(severity: Severity | string, ...message: unknown[]) {
    if (this.source) {
      message = [`[${this.source}]`, ...message];
    }

    if (!Severity[severity]) {
      severity = Severity.Info;
    }

    if (this.stream?.df?.isReplaying) return;

    this.stream[severity](...message);
  }
}

export class RepositoryError extends Error {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "RepositoryError";
    this.cause = cause;
  }
}

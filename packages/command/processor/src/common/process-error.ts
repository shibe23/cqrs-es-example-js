abstract class ProcessError extends Error { }
class ProcessInternalError extends ProcessError {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "ProcessError";
    this.cause = cause;
  }
}
class ProcessNotFoundError extends ProcessError {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "ProcessError";
    this.cause = cause;
  }
}

export {
  ProcessError,
  ProcessInternalError,
  ProcessNotFoundError,
};
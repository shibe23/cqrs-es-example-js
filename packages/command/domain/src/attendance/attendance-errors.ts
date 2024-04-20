abstract class AttendanceError extends Error {}

const AttendancePostMessageErrorTypeSymbol = Symbol("AttendancePostError");

class AttendancePostMessageError extends AttendanceError {
  symbol: typeof AttendancePostMessageErrorTypeSymbol =
    AttendancePostMessageErrorTypeSymbol;

  private constructor(message: string, error?: Error) {
    super(message, error);
  }

  static of(message: string, error?: Error): AttendancePostMessageError {
    return new AttendancePostMessageError(message, error);
  }
}
export {
  AttendanceError,
  AttendancePostMessageError,
  AttendancePostMessageErrorTypeSymbol,
};

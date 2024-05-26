abstract class AttendanceStampError extends Error {}

const AttendancePostMessageErrorTypeSymbol = Symbol("AttendancePostError");

class AttendanceStampPostedError extends AttendanceStampError {
  symbol: typeof AttendancePostMessageErrorTypeSymbol =
    AttendancePostMessageErrorTypeSymbol;

  private constructor(message: string, error?: Error) {
    super(message, error);
  }

  static of(message: string, error?: Error): AttendanceStampPostedError {
    return new AttendanceStampPostedError(message, error);
  }
}
export {
  AttendanceStampError,
  AttendanceStampPostedError,
  AttendancePostMessageErrorTypeSymbol,
};
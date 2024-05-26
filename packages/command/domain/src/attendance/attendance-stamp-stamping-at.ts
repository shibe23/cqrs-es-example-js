import * as E from "fp-ts/lib/Either";

const AttendanceStampStampingAtTypeSymbol = Symbol("AttendanceStampStampingAt");
const ATTENDANCE_PREFIX: string = "Attendance";
class AttendanceStampStampingAt {
  readonly symbol: typeof AttendanceStampStampingAtTypeSymbol = AttendanceStampStampingAtTypeSymbol;
  readonly typeName = ATTENDANCE_PREFIX;

  private constructor(public readonly value: Date) {
    if (!value.getTime()) {
      throw new Error("Invalid attendance stampingAt");
    }
  }

  toJSON() {
    return {
      value: this.value,
    };
  }

  asString() {
    return this.value;
  }
  toString() {
    return `AttendanceStampStampingAt(${this.value})`;
  }
  equals(anotherTime: AttendanceStampStampingAt): boolean {
    return this.value === anotherTime.value;
  }

  static validate(value: Date): E.Either<string, AttendanceStampStampingAt> {
    try {
      return E.right(new AttendanceStampStampingAt(value));
    } catch (error) {
      if (error instanceof Error) {
        return E.left(error.message);
      } else {
        throw error;
      }
    }
  }

  static of(value: Date): AttendanceStampStampingAt {
    return new AttendanceStampStampingAt(value);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertJSONToAttendanceStampStampingAt(json: any): AttendanceStampStampingAt {
  return AttendanceStampStampingAt.of(new Date(json.value));
}

export { AttendanceStampStampingAt, AttendanceStampStampingAtTypeSymbol, convertJSONToAttendanceStampStampingAt };
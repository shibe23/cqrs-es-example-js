import * as U from "ulidx";
import * as E from "fp-ts/lib/Either";
import * as Infrastructure from "cqrs-es-example-js-infrastructure";

const AttendanceIdTypeSymbol = Symbol("AttendanceId");
const ATTENDANCE_PREFIX: string = "Attendance";
class AttendanceId {
  readonly symbol: typeof AttendanceIdTypeSymbol = AttendanceIdTypeSymbol;
  readonly typeName = ATTENDANCE_PREFIX;

  private constructor(public readonly value: string) {
    if (!U.isValid(value)) {
      throw new Error("Invalid attendance id");
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
    return `AttendanceId(${this.value})`;
  }
  equals(anotherId: AttendanceId): boolean {
    return this.value === anotherId.value;
  }

  static validate(value: string): E.Either<string, AttendanceId> {
    try {
      return E.right(new AttendanceId(value));
    } catch (error) {
      if (error instanceof Error) {
        return E.left(error.message);
      } else {
        throw error;
      }
    }
  }

  static of(value: string): AttendanceId {
    return new AttendanceId(value);
  }

  static generate(): AttendanceId {
    return new AttendanceId(Infrastructure.generateULID());
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertJSONToAttendanceId(json: any): AttendanceId {
  return AttendanceId.of(json.value);
}

export { AttendanceId, AttendanceIdTypeSymbol, convertJSONToAttendanceId };

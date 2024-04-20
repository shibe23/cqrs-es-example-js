import * as U from "ulidx";
import * as E from "fp-ts/lib/Either";
import * as Infrastructure from "cqrs-es-example-js-infrastructure";

const AttendanceStampIdTypeSymbol = Symbol("AttendanceStampId");

class AttendanceStampId {
  readonly symbol: typeof AttendanceStampIdTypeSymbol = AttendanceStampIdTypeSymbol;

  private constructor(public readonly value: string) {
    if (!U.isValid(value)) {
      throw new Error("Invalid attendance stamp id");
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
    return `AttendanceStampId(${this.value})`;
  }
  equals(anotherId: AttendanceStampId): boolean {
    return this.value === anotherId.value;
  }

  static validate(value: string): E.Either<string, AttendanceStampId> {
    try {
      return E.right(new AttendanceStampId(value));
    } catch (error) {
      if (error instanceof Error) {
        return E.left(error.message);
      } else {
        throw error;
      }
    }
  }

  static of(value: string): AttendanceStampId {
    return new AttendanceStampId(value);
  }

  static generate(): AttendanceStampId {
    return new AttendanceStampId(Infrastructure.generateULID());
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertJSONToAttendanceStampId(json: any): AttendanceStampId {
  return AttendanceStampId.of(json.value);
}

export { AttendanceStampId, AttendanceStampIdTypeSymbol, convertJSONToAttendanceStampId };

import { AttendanceId } from "./attendance-id";
import { convertJSONToAttendanceStamp, AttendanceStamp } from "./attendance-stamp";
import * as O from "fp-ts/Option";

const AttendanceStampsTypeSymbol = Symbol("AttendanceStamps");

class AttendanceStamps {
  readonly symbol: typeof AttendanceStampsTypeSymbol = AttendanceStampsTypeSymbol;
  constructor(public readonly values: Map<string, AttendanceStamp>) {
    this.values = values;
  }

  toJSON() {
    return {
      values: this.toArray().map((m) => m.toJSON()),
    };
  }

  addAttendanceStamp(attendanceStamp: AttendanceStamp) {
    return new AttendanceStamps(
      new Map(this.values).set(attendanceStamp.id.asString(), attendanceStamp),
    );
  }

  removeAttendanceStampById(attendanceStampId: AttendanceId): O.Option<[AttendanceStamps, AttendanceStamp]> {
    const attendanceStamp = this.values.get(attendanceStampId.value);
    if (attendanceStamp === undefined) {
      return O.none;
    }
    const newMap = new Map(this.values);
    newMap.delete(attendanceStampId.value);
    return O.some([new AttendanceStamps(newMap), attendanceStamp]);
  }

  containsById(attendanceStampId: AttendanceId): boolean {
    return this.values.has(attendanceStampId.value);
  }

  findById(attendanceStampId: AttendanceId): AttendanceStamp | undefined {
    return this.values.get(attendanceStampId.value);
  }

  toArray(): AttendanceStamp[] {
    return Array.from(this.values.values());
  }

  toMap(): Map<AttendanceId, AttendanceStamp> {
    return new Map(
      Array.from(this.values.entries()).map(([k, v]) => [AttendanceId.of(k), v]),
    );
  }

  size(): number {
    return this.values.size;
  }

  asString() {
    return this.values
  }


  toString() {
    return `AttendanceStamps(${JSON.stringify(this.toArray().map((m) => m.toString()))})`;
  }

  equals(anotherAttendanceStamps: AttendanceStamps) {
    return (
      this.size() === anotherAttendanceStamps.size() &&
      this.toArray().every((attendanceStamp, index) =>
        attendanceStamp.equals(anotherAttendanceStamps.toArray()[index]),
      )
    );
  }

  static ofEmpty(): AttendanceStamps {
    return new AttendanceStamps(new Map());
  }

  static ofSingle(attendanceStamp: AttendanceStamp): AttendanceStamps {
    return new AttendanceStamps(new Map([[attendanceStamp.id.asString(), attendanceStamp]]));
  }

  static fromArray(attendanceStamps: AttendanceStamp[]): AttendanceStamps {
    return new AttendanceStamps(
      new Map(attendanceStamps.map((attendanceStamp) => [attendanceStamp.id.asString(), attendanceStamp])),
    );
  }

  static fromMap(attendanceStamps: Map<AttendanceId, AttendanceStamp>): AttendanceStamps {
    return new AttendanceStamps(
      new Map(
        Array.from(attendanceStamps.entries()).map(([k, v]) => [k.asString(), v]),
      ),
    );
  }
}
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
function convertJSONToAttendanceStamps(json: any): AttendanceStamps {
  // console.log("convertJSONToAttendanceStamps = ", obj);
  return AttendanceStamps.fromArray(
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    json.values.map((v: any) => convertJSONToAttendanceStamp(v)),
  );
}
export { AttendanceStamps, AttendanceStampsTypeSymbol, convertJSONToAttendanceStamps };
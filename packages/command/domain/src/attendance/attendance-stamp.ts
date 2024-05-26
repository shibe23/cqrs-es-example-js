import { convertJSONToUserAccountId, UserAccountId } from "../user-account";
import * as E from "fp-ts/lib/Either";
import { AttendanceStampStampingAt, convertJSONToAttendanceStampStampingAt } from "./attendance-stamp-stamping-at";
import { AttendanceId, convertJSONToAttendanceId } from "./attendance-id";
import { AttendanceStampEvent, AttendanceStampPosted, AttendanceStampPostedTypeSymbol } from "./attendance-events";
import { AttendanceStampPostedError } from "./attendance-errors";

type AttendanceStampStatus = "ENABLED" | "DISABLED";

const AttendanceStampTypeSymbol = Symbol("AttendanceStamp");
interface AttendanceStampParams {
  id: AttendanceId;
  executorId: UserAccountId;
  stampingAt: AttendanceStampStampingAt;
  status: AttendanceStampStatus;
  sequenceNumber: number;
  version: number;
}
class AttendanceStamp {
  readonly symbol: typeof AttendanceStampTypeSymbol = AttendanceStampTypeSymbol;
readonly typeName = "AttendanceStamp";
  readonly id: AttendanceId;
  readonly executorId: UserAccountId;
  readonly stampingAt: AttendanceStampStampingAt;
  readonly status: AttendanceStampStatus;
  readonly sequenceNumber: number;
  readonly version: number;
  constructor(params: AttendanceStampParams) {
    this.id = params.id;
    this.executorId = params.executorId;
    this.stampingAt = params.stampingAt;
    this.status = params.status;
    this.sequenceNumber = params.sequenceNumber;
    this.version = params.version;
  }

  toJSON() {
    return {
      id: this.id.toJSON(),
      executorId: this.executorId.toJSON(),
      stampingAt: this.stampingAt.toJSON(),
      status: this.status,
      sequenceNumber: this.sequenceNumber,
      version: this.version,
    };
  }

  toString() {
    return `AttendanceStamp(${this.id.toString()}, ${this.executorId.toString()}, ${this.stampingAt.toString()}, ${this.status})`;
  }

  equals(anotherAttendanceStamp: AttendanceStamp): boolean {
    return (
      this.id.equals(anotherAttendanceStamp.id) &&
      this.executorId.equals(anotherAttendanceStamp.executorId) &&
      this.stampingAt === anotherAttendanceStamp.stampingAt &&
      this.status === anotherAttendanceStamp.status &&
      this.sequenceNumber === anotherAttendanceStamp.sequenceNumber &&
      this.version === anotherAttendanceStamp.version
    );
  }
  applyEvent(event: AttendanceStampEvent): AttendanceStamp {
    switch (event.symbol) {
      case AttendanceStampPostedTypeSymbol: {
        const typedEvent = event as AttendanceStampPosted;
        const result = this.postAttendanceStamp(typedEvent.stampingAt, event.executorId);
        if (E.isLeft(result)) {
          throw new Error(result.left.message);
        }
        return result.right[0];
      }
      default: {
        throw new Error("Unknown event");
      }
    }
  }
  postAttendanceStamp(
    stampingAt: AttendanceStampStampingAt,
    executorId: UserAccountId,
  ): E.Either<AttendanceStampPostedError, [AttendanceStamp, AttendanceStampPosted]> {
    const newSequenceNumber = this.sequenceNumber + 1;
    const newAttendanceStamp: AttendanceStamp = new AttendanceStamp({
      ...this,
      stampingAt: stampingAt,
      sequenceNumber: newSequenceNumber,
    });
    const event = AttendanceStampPosted.of(
      this.id,
      stampingAt,
      executorId,
      newSequenceNumber,
    );
    return E.right([newAttendanceStamp, event]);
  }

  withVersion(version: number): AttendanceStamp {
    return new AttendanceStamp({ ...this, version });
  }

  updateVersion(versionF: (value: number) => number): AttendanceStamp {
    return new AttendanceStamp({ ...this, version: versionF(this.version) });
  }
  static replay(events: AttendanceStampEvent[], snapshot: AttendanceStamp): AttendanceStamp {
    return events.reduce(
      (attendanceStamp, event) => attendanceStamp.applyEvent(event),
      snapshot,
    );
  }
  static create(
    id: AttendanceId,
    executorId: UserAccountId,
    stampingAt: AttendanceStampStampingAt
  ): [AttendanceStamp, AttendanceStampPosted] {
    const status: AttendanceStampStatus = "ENABLED";
    const sequenceNumber = 1;
    const version = 1;
    return [
      new AttendanceStamp({
        id,
        executorId,
        stampingAt,
        status,
        sequenceNumber,
        version
      }),
      AttendanceStampPosted.of(id, stampingAt, executorId, sequenceNumber),
    ];
  }
  static of(
    params: AttendanceStampParams
    ): AttendanceStamp {
    return new AttendanceStamp(params);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertJSONToAttendanceStamp(json: any): AttendanceStamp {
  const id = convertJSONToAttendanceId(json.id);
  const executorId = convertJSONToUserAccountId(json.executorId);
  const stampingAt = convertJSONToAttendanceStampStampingAt(json.stampingAt);
  return new AttendanceStamp({
    id,
    executorId,
    stampingAt,
    status:json.status,
    sequenceNumber: json.sequenceNumber,
    version: json.version,
  });
}

export { AttendanceStamp, AttendanceStampTypeSymbol, convertJSONToAttendanceStamp };
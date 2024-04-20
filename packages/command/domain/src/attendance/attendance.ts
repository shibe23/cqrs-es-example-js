import { convertJSONToAttendanceId, AttendanceId } from "./attendance-id";
import {
  AttendanceCreated,
  AttendanceEvent,
  AttendanceStampPosted,
  AttendanceStampPostedTypeSymbol,
} from "./attendance-events";
import { UserAccountId, convertJSONToUserAccountId } from "../user-account";
import * as E from "fp-ts/lib/Either";
import {
  AttendancePostMessageError,
} from "./attendance-errors";
import { convertJSONToAttendanceStamps, AttendanceStamps } from "./attendance-stamps";
import { Aggregate } from "event-store-adapter-js";
import { AttendanceStamp } from "./attendance-stamp";

const AttendanceTypeSymbol = Symbol("Attendance");

interface AttendanceParams {
  id: AttendanceId;
  deleted: boolean;
  userAccountId: UserAccountId;
  attendanceStamps: AttendanceStamps;
  sequenceNumber: number;
  version: number;
}

class Attendance implements Aggregate<Attendance, AttendanceId> {
  readonly symbol: typeof AttendanceTypeSymbol = AttendanceTypeSymbol;
  readonly typeName = "Attendance";

  public readonly id: AttendanceId;
  public readonly deleted: boolean;
  public readonly userAccountId: UserAccountId;
  public readonly attendanceStamps: AttendanceStamps;
  public readonly sequenceNumber: number;
  public readonly version: number;

  private constructor(params: AttendanceParams) {
    this.id = params.id;
    this.deleted = params.deleted;
    this.userAccountId = params.userAccountId;
    this.attendanceStamps = params.attendanceStamps;
    this.sequenceNumber = params.sequenceNumber;
    this.version = params.version;
  }

  toJSON() {
    return {
      id: this.id.toJSON(),
      deleted: this.deleted,
      userAccountId: this.userAccountId.toJSON(),
      messages: this.attendanceStamps.toJSON(),
      sequenceNumber: this.sequenceNumber,
      version: this.version,
    };
  }

  postAttendanceStamp(
    attendanceStamp: AttendanceStamp,
    executorId: UserAccountId,
  ): E.Either<AttendancePostMessageError, [Attendance, AttendanceStampPosted]> {
    if (this.deleted) {
      return E.left(AttendancePostMessageError.of("The group chat is deleted"));
    }
    if (!this.userAccountId.equals(executorId)) {
      return E.left(
        AttendancePostMessageError.of(
          "The executorId is not the member of the attendance",
        ),
      );
    }
    if (!this.userAccountId.equals(attendanceStamp.senderId)) {
      return E.left(
        AttendancePostMessageError.of(
          "The sender id is not the member of the attendance",
        ),
      );
    }
    if (this.attendanceStamps.containsById(attendanceStamp.id)) {
      return E.left(
        AttendancePostMessageError.of(
          "The attendance stamp id is already exists in the attendance stamps",
        ),
      );
    }
    const newSequenceNumber = this.sequenceNumber + 1;
    const newAttendanceStamps = this.attendanceStamps.addAttendanceStamp(attendanceStamp)
    const newAttendance: Attendance = new Attendance({
      ...this,
      attendanceStamps: newAttendanceStamps,
      sequenceNumber: newSequenceNumber,
    });
    const event = AttendanceStampPosted.of(
      this.id,
      attendanceStamp,
      executorId,
      newSequenceNumber,
    );
    return E.right([newAttendance, event]);
  }
  withVersion(version: number): Attendance {
    return new Attendance({ ...this, version });
  }

  updateVersion(versionF: (value: number) => number): Attendance {
    return new Attendance({ ...this, version: versionF(this.version) });
  }

  toString() {
    return `Attendance(${this.id.toString()}, ${this.deleted}, ${this.userAccountId.toString()}, ${this.attendanceStamps.toString()}, ${this.sequenceNumber}, ${this.version})`;
  }

  equals(other: Attendance) {
    return (
      this.id.equals(other.id) &&
      this.deleted === other.deleted &&
      this.userAccountId.equals(other.userAccountId) &&
      this.sequenceNumber === other.sequenceNumber &&
      this.version === other.version
    );
  }

  applyEvent(event: AttendanceEvent): Attendance {
    switch (event.symbol) {
      case AttendanceStampPostedTypeSymbol: {
        const typedEvent = event as AttendanceStampPosted;
        const result = this.postAttendanceStamp(typedEvent.attendanceStamp, event.executorId);
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

  static create(
    id: AttendanceId,
    executorId: UserAccountId,
  ): [Attendance, AttendanceCreated] {
    const userAccountId = executorId;
    const sequenceNumber = 1;
    const version = 1;
    return [
      new Attendance({
        id,
        deleted: false,
        userAccountId: userAccountId,
        attendanceStamps: AttendanceStamps.ofEmpty(),
        sequenceNumber,
        version,
      }),
      AttendanceCreated.of(id, userAccountId, executorId, sequenceNumber),
    ];
  }

  static replay(events: AttendanceEvent[], snapshot: Attendance): Attendance {
    return events.reduce(
      (groupChat, event) => groupChat.applyEvent(event),
      snapshot,
    );
  }

  static of(params: AttendanceParams): Attendance {
    return new Attendance(params);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertJSONToAttendance(json: any): Attendance {
  const id = convertJSONToAttendanceId(json.data.id);
  const userAccountId = convertJSONToUserAccountId(json.data.members);
  const attendanceStamps = convertJSONToAttendanceStamps(json.data.messages);
  return Attendance.of({
    id,
    deleted: json.data.deleted,
    userAccountId,
    attendanceStamps: attendanceStamps,
    sequenceNumber: json.data.sequenceNumber,
    version: json.data.version,
  });
}

export { Attendance, AttendanceTypeSymbol, convertJSONToAttendance };

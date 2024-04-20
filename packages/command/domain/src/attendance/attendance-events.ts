import { Event } from "event-store-adapter-js";
import { convertJSONToAttendanceId, AttendanceId } from "./attendance-id";
import { convertJSONToUserAccountId, UserAccountId } from "../user-account";
import * as Infrastructure from "cqrs-es-example-js-infrastructure";
import { AttendanceStamp } from "./attendance-stamp";

type AttendanceEventTypeSymbol =
  | typeof AttendanceCreatedTypeSymbol
  | typeof AttendanceStampPostedTypeSymbol

interface AttendanceEvent extends Event<AttendanceId> {
  symbol: AttendanceEventTypeSymbol;
  executorId: UserAccountId;
  toString: () => string;
}

const AttendanceCreatedTypeSymbol = Symbol("AttendanceCreated");

class AttendanceCreated implements AttendanceEvent {
  readonly symbol: typeof AttendanceCreatedTypeSymbol =
    AttendanceCreatedTypeSymbol;
  readonly typeName = "AttendanceCreated";

  private constructor(
    public readonly id: string,
    public readonly aggregateId: AttendanceId,
    public readonly userAccountId: UserAccountId,
    public readonly executorId: UserAccountId,
    public readonly sequenceNumber: number,
    public readonly occurredAt: Date,
  ) {}

  isCreated: boolean = true;

  toString() {
    return `AttendanceCreated(${this.id.toString()}, ${this.aggregateId.toString()}, ${this.userAccountId.toString()}, ${this.executorId.toString()}, ${this.sequenceNumber}, ${this.occurredAt.toISOString()})`;
  }

  static of(
    aggregateId: AttendanceId,
    userAccountId: UserAccountId,
    executorId: UserAccountId,
    sequenceNumber: number,
  ): AttendanceCreated {
    return new AttendanceCreated(
      Infrastructure.generateULID(),
      aggregateId,
      userAccountId,
      executorId,
      sequenceNumber,
      new Date(),
    );
  }
}

const AttendanceStampPostedTypeSymbol = Symbol("AttendanceStampPosted");

class AttendanceStampPosted implements AttendanceEvent {
  readonly symbol: typeof AttendanceStampPostedTypeSymbol =
    AttendanceStampPostedTypeSymbol;
  readonly typeName = "AttendanceStampPosted";

  private constructor(
    public readonly id: string,
    public readonly aggregateId: AttendanceId,
    public readonly attendanceStamp: AttendanceStamp,
    public readonly executorId: UserAccountId,
    public readonly sequenceNumber: number,
    public readonly occurredAt: Date,
  ) {}

  isCreated: boolean = false;

  toString() {
    return `AttendanceMessagePosted(${this.id.toString()}, ${this.aggregateId.toString()}, ${this.attendanceStamp.toString()}, ${this.executorId.toString()}, ${this.sequenceNumber}, ${this.occurredAt.toISOString()})`;
  }

  static of(
    aggregateId: AttendanceId,
    attendanceStamp: AttendanceStamp,
    executorId: UserAccountId,
    sequenceNumber: number,
  ): AttendanceStampPosted {
    return new AttendanceStampPosted(
      Infrastructure.generateULID(),
      aggregateId,
      attendanceStamp,
      executorId,
      sequenceNumber,
      new Date(),
    );
  }
}

class AttendanceEventFactory {
  static ofAttendanceCreated(
    aggregateId: AttendanceId,
    userAccountId: UserAccountId,
    executorId: UserAccountId,
    sequenceNumber: number,
  ): AttendanceCreated {
    return AttendanceCreated.of(
      aggregateId,
      userAccountId,
      executorId,
      sequenceNumber,
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertJSONToAttendanceEvent(json: any): AttendanceEvent {
  const id = convertJSONToAttendanceId(json.data.aggregateId);
  const userAccountId = convertJSONToUserAccountId(json.data.userAccountId);
  const executorId = convertJSONToUserAccountId(json.data.executorId);
  switch (json.type) {
    case "AttendanceCreated": {
      return AttendanceCreated.of(
        id,
        userAccountId,
        executorId,
        json.data.sequenceNumber,
      );
    }
    default:
      throw new Error(`Unknown type: ${json.type}`);
  }
}

export {
  AttendanceEvent,
  AttendanceEventTypeSymbol,
  AttendanceCreated,
  AttendanceCreatedTypeSymbol,
  AttendanceStampPosted,
  AttendanceStampPostedTypeSymbol,
  AttendanceEventFactory,
  convertJSONToAttendanceEvent,
};

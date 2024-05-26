import { Event } from "event-store-adapter-js";
import { convertJSONToAttendanceId, AttendanceId } from "./attendance-id";
import { convertJSONToUserAccountId, UserAccountId } from "../user-account";
import * as Infrastructure from "cqrs-es-example-js-infrastructure";
import { AttendanceStampStampingAt, convertJSONToAttendanceStampStampingAt } from "./attendance-stamp-stamping-at";

type AttendanceStampEventTypeSymbol =
  | typeof AttendanceStampPostedTypeSymbol

interface AttendanceStampEvent extends Event<AttendanceId> {
  symbol: AttendanceStampEventTypeSymbol;
  executorId: UserAccountId;
  toString: () => string;
}

const AttendanceStampPostedTypeSymbol = Symbol("AttendanceStampPosted");

class AttendanceStampPosted implements AttendanceStampEvent {
  readonly symbol: typeof AttendanceStampPostedTypeSymbol =
    AttendanceStampPostedTypeSymbol;
  readonly typeName = "AttendanceStampPosted";

  private constructor(
    public readonly id: string,
    public readonly aggregateId: AttendanceId,
    public readonly stampingAt: AttendanceStampStampingAt,
    public readonly status : string, // TODO: domain object化
    public readonly executorId: UserAccountId,
    public readonly sequenceNumber: number,
    public readonly occurredAt: Date,
  ) {}

  isCreated: boolean = true;

  toString() {
    return `AttendanceStampPosted(${this.id.toString()}, ${this.aggregateId.toString()},${this.stampingAt.toString()},  ${this.status.toString()}, ${this.executorId.toString()}, ${this.sequenceNumber}, ${this.occurredAt.toISOString()})`;
  }

  static of(
    aggregateId: AttendanceId,
    stampingAt: AttendanceStampStampingAt,
    executorId: UserAccountId,
    sequenceNumber: number,
  ): AttendanceStampPosted {
    return new AttendanceStampPosted(
      Infrastructure.generateULID(),
      aggregateId,
      stampingAt,
      "ENABLED",
      executorId,
      sequenceNumber,
      new Date(),
    );
  }
}

class AttendanceEventFactory {
  static ofAttendanceStampPosted(
    aggregateId: AttendanceId,
    executorId: UserAccountId,
    stampingAt: AttendanceStampStampingAt,
    sequenceNumber: number,
  ): AttendanceStampPosted {
    return AttendanceStampPosted.of(
      aggregateId,
      stampingAt,
      executorId,
      sequenceNumber,
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertJSONToAttendanceStampEvent(json: any): AttendanceStampEvent {
  const id = convertJSONToAttendanceId(json.data.aggregateId);
  const stampingAt = convertJSONToAttendanceStampStampingAt(json.data.stampingAt);
  const executorId = convertJSONToUserAccountId(json.data.executorId);
  switch (json.type) {
    case "AttendanceStampPosted": {
      return AttendanceStampPosted.of(
        id,
        stampingAt,
        executorId,
        json.data.sequenceNumber,
      );
    }
    default:
      throw new Error(`Unknown type: ${json.type}`);
  }
}

export {
  AttendanceStampEvent,
  AttendanceStampEventTypeSymbol,
  AttendanceStampPosted,
  AttendanceStampPostedTypeSymbol,
  AttendanceEventFactory,
  convertJSONToAttendanceStampEvent,
};
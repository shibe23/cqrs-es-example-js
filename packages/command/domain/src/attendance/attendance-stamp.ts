import { convertJSONToUserAccountId, UserAccountId } from "../user-account";
import { convertJSONToAttendanceStampId, AttendanceStampId } from "./attendance-stamp-id";
import * as E from "fp-ts/lib/Either";

const AttendanceStampTypeSymbol = Symbol("AttendanceStamp");
interface AttendanceStampParams {
  id: AttendanceStampId;
  content: string;
  senderId: UserAccountId;
  sentAt: Date;
}
class AttendanceStamp {
  readonly symbol: typeof AttendanceStampTypeSymbol = AttendanceStampTypeSymbol;
  readonly id: AttendanceStampId;
  readonly content: string;
  readonly senderId: UserAccountId;
  readonly sentAt: Date;

  constructor(params: AttendanceStampParams) {
    this.id = params.id;
    this.content = params.content;
    this.senderId = params.senderId;
    this.sentAt = params.sentAt;
  }

  toJSON() {
    return {
      id: this.id.toJSON(),
      content: this.content,
      senderId: this.senderId.toJSON(),
      sentAt: this.sentAt.toISOString(),
    };
  }

  toString() {
    return `AttendanceStamp(${this.id.toString()}, ${this.content}, ${this.senderId.toString()}, ${this.sentAt.toISOString()})`;
  }

  equals(anotherAttendanceStamp: AttendanceStamp): boolean {
    return (
      this.id.equals(anotherAttendanceStamp.id) &&
      this.content === anotherAttendanceStamp.content &&
      this.senderId.equals(anotherAttendanceStamp.senderId) &&
      this.sentAt.getTime() === anotherAttendanceStamp.sentAt.getTime()
    );
  }

  static validate(
    id: AttendanceStampId,
    content: string,
    senderId: UserAccountId,
    sentAt: Date,
  ): E.Either<string, AttendanceStamp> {
    try {
      return E.right(new AttendanceStamp({ id, content, senderId, sentAt }));
    } catch (e) {
      if (e instanceof Error) {
        return E.left(e.message);
      } else {
        throw e;
      }
    }
  }

  static of(
    id: AttendanceStampId,
    content: string,
    senderId: UserAccountId,
    sentAt: Date,
  ): AttendanceStamp {
    return new AttendanceStamp({ id, content, senderId, sentAt });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertJSONToAttendanceStamp(json: any): AttendanceStamp {
  const id = convertJSONToAttendanceStampId(json.id);
  const senderId = convertJSONToUserAccountId(json.senderId);
  return new AttendanceStamp({
    id,
    content: json.content,
    senderId,
    sentAt: new Date(json.sentAt),
  });
}

export { AttendanceStamp, AttendanceStampTypeSymbol, convertJSONToAttendanceStamp };

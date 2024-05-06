import { AttendanceStamp } from 'cqrs-es-example-js-command-domain/dist/attendance/attendance-stamp';
import {
  AttendanceId,
  AttendanceStampEvent,
} from "cqrs-es-example-js-command-domain";
import * as TE from "fp-ts/TaskEither";
import { RepositoryError } from "../common";

interface AttendanceRepository {
  withRetention(numberOfEvents: number): AttendanceRepository;

  storeEvent(
    event: AttendanceStampEvent,
    version: number,
  ): TE.TaskEither<RepositoryError, void>;

  storeEventAndSnapshot(
    event: AttendanceStampEvent,
    snapshot: AttendanceStamp,
  ): TE.TaskEither<RepositoryError, void>;

  store(
    event: AttendanceStampEvent,
    snapshot: AttendanceStamp,
  ): TE.TaskEither<RepositoryError, void>;

  findById(
    id: AttendanceId,
  ): TE.TaskEither<RepositoryError, AttendanceStamp | undefined>;
}

export { AttendanceRepository, RepositoryError };

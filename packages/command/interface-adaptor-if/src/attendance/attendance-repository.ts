import {
  Attendance,
  AttendanceEvent,
  AttendanceId,
} from "cqrs-es-example-js-command-domain";
import * as TE from "fp-ts/TaskEither";
import { RepositoryError } from "../common";

interface AttendanceRepository {
  withRetention(numberOfEvents: number): AttendanceRepository;

  storeEvent(
    event: AttendanceEvent,
    version: number,
  ): TE.TaskEither<RepositoryError, void>;

  storeEventAndSnapshot(
    event: AttendanceEvent,
    snapshot: Attendance,
  ): TE.TaskEither<RepositoryError, void>;

  store(
    event: AttendanceEvent,
    snapshot: Attendance,
  ): TE.TaskEither<RepositoryError, void>;

  findById(
    id: AttendanceId,
  ): TE.TaskEither<RepositoryError, Attendance | undefined>;
}

export { AttendanceRepository, RepositoryError };

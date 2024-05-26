import {
  AttendanceId,
  AttendanceStamp,
  AttendanceStampEvent,
  AttendanceStampStampingAt,
  UserAccountId,
} from "cqrs-es-example-js-command-domain";
import {
  AttendanceRepository,
  RepositoryError,
} from "cqrs-es-example-js-command-interface-adaptor-if";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";
import { ProcessError, ProcessInternalError } from "../common";

class AttendanceCommandProcessor {
  private constructor(
    private readonly attendanceRepository: AttendanceRepository,
  ) {}
  createAttendanceStamp(
    executorId: UserAccountId,
    stampingAt: AttendanceStampStampingAt,
  ): TE.TaskEither<ProcessError, AttendanceStampEvent> {
    return pipe(
      TE.right(AttendanceId.generate()),
      TE.chain((id) => TE.right(AttendanceStamp.create(id, executorId, stampingAt))),
      TE.chain(([attendanceStamp, attendanceStampPosted]) =>
        pipe(
          this.attendanceRepository.store(attendanceStampPosted, attendanceStamp),
          TE.map(() => attendanceStampPosted),
        ),
      ),
      TE.mapLeft(this.convertToProcessError),
      TE.mapLeft(this.convertToProcessError),
    );
  }

  static of(
    attendanceRepository: AttendanceRepository,
  ): AttendanceCommandProcessor {
    return new AttendanceCommandProcessor(attendanceRepository);
  }

  private convertToProcessError(e: unknown): ProcessError {
    if (e instanceof ProcessError) {
      return e;
    } else if (e instanceof RepositoryError) {
      return new ProcessInternalError("Failed to delete attendance", e);
    }
    throw e;
  }
}

export {
  AttendanceCommandProcessor,
};
import {
  Attendance,
  AttendanceEvent,
  AttendanceId,
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
  createAttendance(
    executorId: UserAccountId,
  ): TE.TaskEither<ProcessError, AttendanceEvent> {
    return pipe(
      TE.right(AttendanceId.generate()),
      TE.chain((id) => TE.right(Attendance.create(id, executorId))),
      TE.chain(([attendance, attendanceCreated]) =>
        pipe(
          this.attendanceRepository.store(attendanceCreated, attendance),
          TE.map(() => attendanceCreated),
        ),
      ),
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

  // private getOrError(
  //   attendanceOpt: Attendance | undefined,
  // ): TE.TaskEither<ProcessError, Attendance> {
  //   return attendanceOpt === undefined
  //     ? TE.left(new ProcessNotFoundError("Attendance not found"))
  //     : TE.right(attendanceOpt);
  // }

  // private postMessageAsync(
  //   attendance: Attendance,
  //   attendanceStamp: AttendanceStamp,
  //   executorId: UserAccountId,
  // ) {
  //   return TE.fromEither(attendance.postAttendanceStamp(attendanceStamp, executorId));
  // }
}

export {
  AttendanceCommandProcessor,
};

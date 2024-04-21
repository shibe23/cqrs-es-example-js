import { EventStore, OptimisticLockError } from "event-store-adapter-js";
import {
  AttendanceEvent,
  Attendance,
  AttendanceId,
} from "cqrs-es-example-js-command-domain";
import {
  AttendanceRepository,
  RepositoryError,
} from "cqrs-es-example-js-command-interface-adaptor-if";
import * as TE from "fp-ts/TaskEither";

type SnapshotDecider = (event: AttendanceEvent, snapshot: Attendance) => boolean;

class AttendanceRepositoryImpl implements AttendanceRepository {
  private constructor(
    public readonly eventStore: EventStore<
      AttendanceId,
      Attendance,
      AttendanceEvent
    >,
    private readonly snapshotDecider: SnapshotDecider | undefined,
  ) {}

  store(
    event: AttendanceEvent,
    snapshot: Attendance,
  ): TE.TaskEither<RepositoryError, void> {
    if (
      event.isCreated ||
      (this.snapshotDecider !== undefined &&
        this.snapshotDecider(event, snapshot))
    ) {
      return this.storeEventAndSnapshot(event, snapshot);
    } else {
      return this.storeEvent(event, snapshot.version);
    }
  }

  storeEvent(
    event: AttendanceEvent,
    version: number,
  ): TE.TaskEither<RepositoryError, void> {
    return TE.tryCatch(
      () => this.eventStore.persistEvent(event, version),
      (reason) => {
        if (reason instanceof OptimisticLockError) {
          return new RepositoryError(
            "Failed to store event and snapshot due to optimistic lock error",
            reason,
          );
        } else if (reason instanceof Error) {
          return new RepositoryError(
            "Failed to store event and snapshot due to error",
            reason,
          );
        }
        return new RepositoryError(String(reason));
      },
    );
  }

  storeEventAndSnapshot(
    event: AttendanceEvent,
    snapshot: Attendance,
  ): TE.TaskEither<RepositoryError, void> {
    return TE.tryCatch(
      () => this.eventStore.persistEventAndSnapshot(event, snapshot),
      (reason) => {
        if (reason instanceof OptimisticLockError) {
          return new RepositoryError(
            "Failed to store event and snapshot due to optimistic lock error",
            reason,
          );
        } else if (reason instanceof Error) {
          return new RepositoryError(
            "Failed to store event and snapshot due to error",
            reason,
          );
        }
        return new RepositoryError(String(reason));
      },
    );
  }

  findById(
    id: AttendanceId,
  ): TE.TaskEither<RepositoryError, Attendance | undefined> {
    return TE.tryCatch(
      async () => {
        const snapshot = await this.eventStore.getLatestSnapshotById(id);
        if (snapshot === undefined) {
          return undefined;
        } else {
          const events = await this.eventStore.getEventsByIdSinceSequenceNumber(
            id,
            snapshot.sequenceNumber + 1,
          );
          return Attendance.replay(events, snapshot);
        }
      },
      (reason) => {
        if (reason instanceof Error) {
          return new RepositoryError("Failed to find by id to error", reason);
        }
        return new RepositoryError(String(reason));
      },
    );
  }

  static of(
    eventStore: EventStore<AttendanceId, Attendance, AttendanceEvent>,
    snapshotDecider: SnapshotDecider | undefined = undefined,
  ): AttendanceRepository {
    return new AttendanceRepositoryImpl(eventStore, snapshotDecider);
  }

  withRetention(numberOfEvents: number): AttendanceRepository {
    return new AttendanceRepositoryImpl(
      this.eventStore,
      AttendanceRepositoryImpl.retentionCriteriaOf(numberOfEvents),
    );
  }

  static retentionCriteriaOf(numberOfEvents: number): SnapshotDecider {
    return (event: AttendanceEvent, _: Attendance) => {
      return event.sequenceNumber % numberOfEvents == 0;
    };
  }
}

export { AttendanceRepositoryImpl, RepositoryError };

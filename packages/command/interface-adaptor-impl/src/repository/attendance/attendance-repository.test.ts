import { describe } from "node:test";
import * as E from "fp-ts/lib/Either";
import {
  AttendanceId,
  AttendanceStamp,
  UserAccountId,
  AttendanceStampEvent,
  convertJSONToAttendanceStampEvent,
  convertJSONToAttendanceStamp,
  AttendanceStampStampingAt,
} from "cqrs-es-example-js-command-domain";
import {
  GenericContainer,
  StartedTestContainer,
  TestContainer,
  Wait,
} from "testcontainers";
import { EventStore, EventStoreFactory } from "event-store-adapter-js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  createDynamoDBClient,
  createJournalTable,
  createSnapshotTable,
} from "../../test/dynamodb-utils";
import { AttendanceStampRepositoryImpl } from "./attendance-repository";

afterEach(() => {
  jest.useRealTimers();
});

describe("AttendanceStampRepository", () => {
  const TEST_TIME_FACTOR = parseFloat(process.env.TEST_TIME_FACTOR ?? "1.0");
  const TIMEOUT: number = 10 * 1000 * TEST_TIME_FACTOR;

  let container: TestContainer;
  let startedContainer: StartedTestContainer;
  let eventStore: EventStore<AttendanceId, AttendanceStamp, AttendanceStampEvent>;

  const JOURNAL_TABLE_NAME = "journal";
  const SNAPSHOT_TABLE_NAME = "snapshot";
  const JOURNAL_AID_INDEX_NAME = "journal-aid-index";
  const SNAPSHOTS_AID_INDEX_NAME = "snapshots-aid-index";

  function createEventStore(
    dynamodbClient: DynamoDBClient,
  ): EventStore<AttendanceId, AttendanceStamp, AttendanceStampEvent> {
    return EventStoreFactory.ofDynamoDB<AttendanceId, AttendanceStamp, AttendanceStampEvent>(
      dynamodbClient,
      JOURNAL_TABLE_NAME,
      SNAPSHOT_TABLE_NAME,
      JOURNAL_AID_INDEX_NAME,
      SNAPSHOTS_AID_INDEX_NAME,
      32,
      convertJSONToAttendanceStampEvent,
      convertJSONToAttendanceStamp,
    );
  }

  beforeAll(async () => {
    container = new GenericContainer("localstack/localstack:2.1.0")
      .withEnvironment({
        SERVICES: "dynamodb",
        DEFAULT_REGION: "us-west-1",
        EAGER_SERVICE_LOADING: "1",
        DYNAMODB_SHARED_DB: "1",
        DYNAMODB_IN_MEMORY: "1",
      })
      .withWaitStrategy(Wait.forLogMessage("Ready."))
      .withExposedPorts(4566);
    startedContainer = await container.start();
    const dynamodbClient = createDynamoDBClient(startedContainer);
    await createJournalTable(
      dynamodbClient,
      JOURNAL_TABLE_NAME,
      JOURNAL_AID_INDEX_NAME,
    );
    await createSnapshotTable(
      dynamodbClient,
      SNAPSHOT_TABLE_NAME,
      SNAPSHOTS_AID_INDEX_NAME,
    );
    eventStore = createEventStore(dynamodbClient);
  }, TIMEOUT);

  afterAll(async () => {
    if (startedContainer !== undefined) {
      await startedContainer.stop();
    }
  }, TIMEOUT);

  test("store and reply", async () => {
    const repository = AttendanceStampRepositoryImpl.of(eventStore);

    const id = AttendanceId.generate();
    const userId = UserAccountId.generate();
    const stampingAt = AttendanceStampStampingAt.of(new Date());
    const [attendanceStamp1, attendanceStampCreated] = AttendanceStamp.create(id, userId, stampingAt);
    const result = await repository.storeEventAndSnapshot(
      attendanceStampCreated,
      attendanceStamp1,
    )();
    if (E.isLeft(result)) {
      throw new Error(result.left.message);
    }

    const attendanceStamp3Either = await repository.findById(id)();
    if (E.isLeft(attendanceStamp3Either)) {
      throw new Error(
        `attendanceStamp3Either is left: ${attendanceStamp3Either.left.stack?.toString()}`,
      );
    }
    const attendanceStamp3 = attendanceStamp3Either.right;
    if (attendanceStamp3 === undefined) {
      throw new Error("attendanceStamp2 is undefined");
    }

    expect(attendanceStamp3.id.equals(id)).toEqual(true);
  });

  test("store and reply: store method calling only", async () => {
    const repository = AttendanceStampRepositoryImpl.of(eventStore).withRetention(3);

    const id = AttendanceId.generate();
    const userId = UserAccountId.generate();
    const stampingAt = AttendanceStampStampingAt.of(new Date());
    const [attendanceStamp1, attendanceStampCreated] = AttendanceStamp.create(id, userId, stampingAt);
    expect(attendanceStamp1.version).toEqual(1);

    const result1Either = await repository.store(
      attendanceStampCreated,
      attendanceStamp1,
    )();
    if (E.isLeft(result1Either)) {
      throw new Error(result1Either.left.message);
    }

    const attendanceStamp2Either = await repository.findById(id)();
    if (E.isLeft(attendanceStamp2Either)) {
      throw new Error(attendanceStamp2Either.left.message);
    }
    const attendanceStamp2 = attendanceStamp2Either.right!;
    expect(attendanceStamp2.version).toEqual(1);


    const attendanceStamp3Either = await repository.findById(id)();
    if (E.isLeft(attendanceStamp3Either)) {
      throw new Error(
        `attendanceStamp3Either is left: ${attendanceStamp3Either.left.stack?.toString()}`,
      );
    }
    const attendanceStamp4 = attendanceStamp3Either.right!;
    expect(attendanceStamp4.id.equals(id)).toEqual(true);
    expect(attendanceStamp4.version).toEqual(2);
  });
});

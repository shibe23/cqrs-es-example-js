import { describe } from "node:test";
import { AttendanceRepositoryImpl } from "./attendance-repository";
import * as E from "fp-ts/lib/Either";
import {
  AttendanceId,
  Attendance,
  UserAccountId,
  AttendanceEvent,
  convertJSONToAttendanceEvent,
  convertJSONToAttendance,
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

afterEach(() => {
  jest.useRealTimers();
});

describe("AttendanceRepository", () => {
  const TEST_TIME_FACTOR = parseFloat(process.env.TEST_TIME_FACTOR ?? "1.0");
  const TIMEOUT: number = 10 * 1000 * TEST_TIME_FACTOR;

  let container: TestContainer;
  let startedContainer: StartedTestContainer;
  let eventStore: EventStore<AttendanceId, Attendance, AttendanceEvent>;

  const JOURNAL_TABLE_NAME = "journal";
  const SNAPSHOT_TABLE_NAME = "snapshot";
  const JOURNAL_AID_INDEX_NAME = "journal-aid-index";
  const SNAPSHOTS_AID_INDEX_NAME = "snapshots-aid-index";

  function createEventStore(
    dynamodbClient: DynamoDBClient,
  ): EventStore<AttendanceId, Attendance, AttendanceEvent> {
    return EventStoreFactory.ofDynamoDB<AttendanceId, Attendance, AttendanceEvent>(
      dynamodbClient,
      JOURNAL_TABLE_NAME,
      SNAPSHOT_TABLE_NAME,
      JOURNAL_AID_INDEX_NAME,
      SNAPSHOTS_AID_INDEX_NAME,
      32,
      convertJSONToAttendanceEvent,
      convertJSONToAttendance,
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
    const repository = AttendanceRepositoryImpl.of(eventStore);

    const id = AttendanceId.generate();
    const adminId = UserAccountId.generate();
    const [groupChat1, groupChatCreated] = Attendance.create(id, adminId);
    const result = await repository.storeEventAndSnapshot(
      groupChatCreated,
      groupChat1,
    )();
    if (E.isLeft(result)) {
      throw new Error(result.left.message);
    }

    const groupChat3Either = await repository.findById(id)();
    if (E.isLeft(groupChat3Either)) {
      throw new Error(
        `groupChat3Either is left: ${groupChat3Either.left.stack?.toString()}`,
      );
    }
    const groupChat3 = groupChat3Either.right;
    if (groupChat3 === undefined) {
      throw new Error("groupChat2 is undefined");
    }

    expect(groupChat3.id.equals(id)).toEqual(true);
  });

  test("store and reply: store method calling only", async () => {
    const repository = AttendanceRepositoryImpl.of(eventStore).withRetention(3);

    const id = AttendanceId.generate();
    const adminId = UserAccountId.generate();
    const [groupChat1, groupChatCreated] = Attendance.create(id, adminId);
    expect(groupChat1.version).toEqual(1);

    const result1Either = await repository.store(
      groupChatCreated,
      groupChat1,
    )();
    if (E.isLeft(result1Either)) {
      throw new Error(result1Either.left.message);
    }

    const groupChat2Either = await repository.findById(id)();
    if (E.isLeft(groupChat2Either)) {
      throw new Error(groupChat2Either.left.message);
    }
    const groupChat2 = groupChat2Either.right!;
    expect(groupChat2.version).toEqual(1);


    const groupChat3Either = await repository.findById(id)();
    if (E.isLeft(groupChat3Either)) {
      throw new Error(
        `groupChat3Either is left: ${groupChat3Either.left.stack?.toString()}`,
      );
    }
    const groupChat4 = groupChat3Either.right!;
    expect(groupChat4.id.equals(id)).toEqual(true);
    expect(groupChat4.version).toEqual(2);
  });
});

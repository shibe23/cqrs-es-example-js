import {
  CommandContext,
  createCommandSchema,
  GroupChatRepositoryImpl,
  AttendanceStampRepositoryImpl
} from "cqrs-es-example-js-command-interface-adaptor-impl";
import { AttendanceCommandProcessor, GroupChatCommandProcessor } from "cqrs-es-example-js-command-processor";
import { EventStoreFactory } from "event-store-adapter-js";
import {
  AttendanceId,
  AttendanceStamp,
  AttendanceStampEvent,
  convertJSONToAttendanceStamp,
  convertJSONToAttendanceStampEvent,
  convertJSONToGroupChat,
  convertJSONToGroupChatEvent,
  GroupChat,
  GroupChatEvent,
  GroupChatId,
} from "cqrs-es-example-js-command-domain";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { logger } from "./index";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

async function writeApiMain() {
  const apiHost =
    process.env.API_HOST !== undefined ? process.env.API_HOST : "localhost";
  const apiPort =
    process.env.API_PORT !== undefined ? parseInt(process.env.API_PORT) : 3000;

  const journalTableName =
    process.env.PERSISTENCE_JOURNAL_TABLE_NAME !== undefined
      ? process.env.PERSISTENCE_JOURNAL_TABLE_NAME
      : "journal";
  const snapshotTableName =
    process.env.PERSISTENCE_SNAPSHOT_TABLE_NAME !== undefined
      ? process.env.PERSISTENCE_SNAPSHOT_TABLE_NAME
      : "snapshot";
  const journalAidIndexName =
    process.env.PERSISTENCE_JOURNAL_AID_INDEX_NAME !== undefined
      ? process.env.PERSISTENCE_JOURNAL_AID_INDEX_NAME
      : "journal-aid-index";
  const snapshotAidIndexName =
    process.env.PERSISTENCE_SNAPSHOT_AID_INDEX_NAME !== undefined
      ? process.env.PERSISTENCE_SNAPSHOT_AID_INDEX_NAME
      : "snapshots-aid-index";
  const shardCount =
    process.env.PERSISTENCE_SHARD_COUNT !== undefined
      ? parseInt(process.env.PERSISTENCE_SHARD_COUNT)
      : 32;

  const awsRegion = process.env.AWS_REGION;
  const awsDynamodbEndpointUrl = process.env.AWS_DYNAMODB_ENDPOINT_URL;
  const awsDynamodbAccessKeyId = process.env.AWS_DYNAMODB_ACCESS_KEY_ID;
  const awsDynamodbSecretAccessKey = process.env.AWS_DYNAMODB_SECRET_ACCESS_KEY;

  logger.info("Starting write API server");
  logger.info(`API_HOST: ${apiHost}`);
  logger.info(`API_PORT: ${apiPort}`);
  logger.info(`PERSISTENCE_JOURNAL_TABLE_NAME: ${journalTableName}`);
  logger.info(`PERSISTENCE_SNAPSHOT_TABLE_NAME: ${snapshotTableName}`);
  logger.info(`PERSISTENCE_JOURNAL_AID_INDEX_NAME: ${journalAidIndexName}`);
  logger.info(`PERSISTENCE_SNAPSHOT_AID_INDEX_NAME: ${snapshotAidIndexName}`);
  logger.info(`PERSISTENCE_SHARD_COUNT: ${shardCount}`);
  logger.info(`AWS_REGION: ${awsRegion}`);
  logger.info(`AWS_DYNAMODB_ENDPOINT_URL: ${awsDynamodbEndpointUrl}`);
  logger.info(`AWS_DYNAMODB_ACCESS_KEY_ID: ${awsDynamodbAccessKeyId}`);
  logger.info(`AWS_DYNAMODB_SECRET_ACCESS_KEY: ${awsDynamodbSecretAccessKey}`);

  let dynamodbClient: DynamoDBClient;
  if (
    awsRegion &&
    awsDynamodbEndpointUrl &&
    awsDynamodbAccessKeyId &&
    awsDynamodbSecretAccessKey
  ) {
    dynamodbClient = new DynamoDBClient({
      region: awsRegion,
      endpoint: awsDynamodbEndpointUrl,
      credentials: {
        accessKeyId: awsDynamodbAccessKeyId,
        secretAccessKey: awsDynamodbSecretAccessKey,
      },
    });
  } else {
    dynamodbClient = new DynamoDBClient();
  }

  const groupChatEventStore = EventStoreFactory.ofDynamoDB<
    GroupChatId,
    GroupChat,
    GroupChatEvent
  >(
    dynamodbClient,
    journalTableName,
    snapshotTableName,
    journalAidIndexName,
    snapshotAidIndexName,
    shardCount,
    convertJSONToGroupChatEvent,
    convertJSONToGroupChat,
  );
  const attendanceEventStore = EventStoreFactory.ofDynamoDB<
    AttendanceId,
    AttendanceStamp,
    AttendanceStampEvent
  >(
    dynamodbClient,
    journalTableName,
    snapshotTableName,
    journalAidIndexName,
    snapshotAidIndexName,
    shardCount,
    convertJSONToAttendanceStampEvent,
    convertJSONToAttendanceStamp,
  );
  const groupChatRepository =
    GroupChatRepositoryImpl.of(groupChatEventStore).withRetention(100);
  const groupChatCommandProcessor =
    GroupChatCommandProcessor.of(groupChatRepository);

  const attendanceRepository = AttendanceStampRepositoryImpl.of(attendanceEventStore);
  const attendanceCommandProcessor =
    AttendanceCommandProcessor.of(attendanceRepository);

  const schema = await createCommandSchema();
  const server = new ApolloServer<CommandContext>({ schema });
  const { url } = await startStandaloneServer(server, {
    context: async (): Promise<CommandContext> => ({
      groupChatCommandProcessor,
      attendanceCommandProcessor
    }),
    listen: { host: apiHost, port: apiPort },
  });
  logger.info(`🚀 Server ready at ${url}`);
}

export { writeApiMain };

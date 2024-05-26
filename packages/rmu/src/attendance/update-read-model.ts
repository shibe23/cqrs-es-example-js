import { DynamoDBStreamEvent } from "aws-lambda";
import {
  AttendanceStampPosted,
  AttendanceStampPostedTypeSymbol,
  convertJSONToAttendanceStampEvent,
} from "cqrs-es-example-js-command-domain";
import { ILogObj, Logger } from "tslog";
import { TextDecoder } from "node:util";
import { AttendanceStampDao } from "./attendance-stamp-dao";

// import {Callback} from "aws-lambda/handler";

// const lambdaHandler: Handler<DynamoDBStreamEvent, void> = async (event: DynamoDBStreamEvent, context: Context, callback: Callback<void>) => {
//
// }

class AttendanceReadModelUpdater {
  private logger: Logger<ILogObj> = new Logger();
  private decoder: TextDecoder = new TextDecoder("utf-8");

  private constructor(private readonly attendanceStampDao: AttendanceStampDao) {}

  async updateReadModel(event: DynamoDBStreamEvent): Promise<void> {
    this.logger.info("EVENT: \n" + JSON.stringify(event, null, 2));
    event.Records.forEach((record) => {
      if (!record.dynamodb) {
        this.logger.warn("No DynamoDB record");
        return;
      }
      const attributeValues = record.dynamodb.NewImage;
      if (!attributeValues) {
        this.logger.warn("No NewImage");
        return;
      }
      const base64EncodedPayload = attributeValues.payload.B;
      if (!base64EncodedPayload) {
        this.logger.warn("No payload");
        return;
      }
      const payload = this.decoder.decode(
        new Uint8Array(base64EncodedPayload.split(",").map(Number)),
      );
      const payloadJson = JSON.parse(payload);

      const attendanceStampEvent = convertJSONToAttendanceStampEvent(payloadJson)
      switch (attendanceStampEvent.symbol) {
        case AttendanceStampPostedTypeSymbol: {
          const typedEvent = attendanceStampEvent as AttendanceStampPosted
          this.logger.debug(`event = ${typedEvent.toString()}`);
          this.attendanceStampDao.insertAttendanceStamp(
            typedEvent.aggregateId,
            typedEvent.executorId,
            typedEvent.stampingAt,
            new Date(),
          );
          this.logger.debug("inserted attendance");
          break;
        }
      }
    });
  }

  static of(attendanceStampDao: AttendanceStampDao): AttendanceReadModelUpdater {
    return new AttendanceReadModelUpdater(attendanceStampDao);
  }
}

export { AttendanceReadModelUpdater };
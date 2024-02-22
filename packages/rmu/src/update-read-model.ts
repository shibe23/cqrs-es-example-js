import { DynamoDBStreamEvent } from "aws-lambda";
import { GroupChatDao } from "./group-chat-dao";

// function convertAttributeValueToString(attributeValue: AttributeValue): string {
//   if (attributeValue.S !== undefined) {
//     return attributeValue.S.toString();
//   }
//   if (attributeValue.B !== undefined) {
//     return attributeValue.B.toString();
//   }
//   throw new Error("Unexpected attribute value");
// }

interface ReadModelUpdater {
  updateReadModel: (event: DynamoDBStreamEvent) => Promise<void>;
}

const ReadModelUpdater = {
  of(_: GroupChatDao): ReadModelUpdater {
    const decoder = new TextDecoder("utf-8");
    return {
      updateReadModel: async (event: DynamoDBStreamEvent) => {
        console.log("EVENT: \n" + JSON.stringify(event, null, 2));
        event.Records.forEach((record) => {
          if (!record.dynamodb) {
            console.log("No DynamoDB record");
            return;
          }
          console.log("record: %j", record.dynamodb);
          const attributeValues = record.dynamodb.NewImage;
          if (!attributeValues) {
            console.log("No NewImage");
            return;
          }
          console.log("attributeValues: %j", attributeValues);
          const base64EncodedPayload = attributeValues.payload.B;
          if (!base64EncodedPayload) {
            console.log("No payload");
            return;
          }
          const byteArray = base64EncodedPayload.split(",").map(Number);
          const uint8Array = new Uint8Array(byteArray);
          const payload = decoder.decode(uint8Array);
          console.log("payload: %s", payload);
          const payloadJson = JSON.parse(payload);
          console.log("payloadJson: %j", payloadJson);
          const typeName = payloadJson.type;
          switch (typeName) {
            case "GroupChatCreated": {
              const groupChatId = payloadJson.data.aggregateId.value;
              const name = payloadJson.data.name.value;
              console.log(
                `GroupChatCreated: groupChatId = ${groupChatId}, name = ${name}`,
              );
              break;
            }
            case "GroupChatDeleted": {
              const groupChatId = payloadJson.data.aggregateId.value;
              console.log(`GroupChatDeleted: groupChatId = ${groupChatId}`);
              break;
            }
          }
        });
      },
    };
  },
};

export { ReadModelUpdater };

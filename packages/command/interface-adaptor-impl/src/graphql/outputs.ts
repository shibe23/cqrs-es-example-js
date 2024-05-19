import { Field, ObjectType } from "type-graphql";

@ObjectType()
class GroupChatOutput {
  @Field()
  groupChatId!: string;
}

@ObjectType()
class AttendanceOutput {
  @Field()
  attendanceId!: string;
  @Field()
  executorId!: string;
}

@ObjectType()
class MessageOutput {
  @Field()
  groupChatId!: string;
  @Field()
  messageId!: string;
}

@ObjectType()
class HealthCheckOutput {
  @Field()
  value!: string;
}

export { GroupChatOutput, AttendanceOutput, MessageOutput, HealthCheckOutput };

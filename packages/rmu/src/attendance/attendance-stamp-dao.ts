import {
  AttendanceId,
  AttendanceStampStampingAt,
  UserAccountId,
} from "cqrs-es-example-js-command-domain";
import { PrismaClient } from "@prisma/client";

class AttendanceStampDao {
  private constructor(private readonly prismaClient: PrismaClient) {}

  async insertAttendanceStamp(
    aggregateId: AttendanceId,
    userAccountId: UserAccountId,
    stampingAt: AttendanceStampStampingAt,
    createdAt: Date,
  ) {
    return await this.prismaClient.attendanceStamp.create({
      data: {
        id: aggregateId.asString(),
        userAccountId: userAccountId.asString(),
        stampingAt: stampingAt.asString(),
        status: "ENABLED",
        createdAt: createdAt,
        updatedAt: createdAt,
      },
    });
  }

  static of(prismaClient: PrismaClient) {
    return new AttendanceStampDao(prismaClient);
  }
}

export { AttendanceStampDao };
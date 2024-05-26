import { PrismaClient } from "@prisma/client";
import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { AttendanceStampOutput, GroupChatOutput, MemberOutput, MessageOutput } from "./outputs";
import { ILogObj, Logger } from "tslog";

interface QueryContext {
  prisma: PrismaClient;
}

@Resolver()
class GroupChatQueryResolver {
  private readonly logger: Logger<ILogObj> = new Logger();

  @Query(() => GroupChatOutput)
  async getGroupChat(
    @Ctx() { prisma }: QueryContext,
    @Arg("groupChatId") groupChatId: string,
    @Arg("userAccountId") userAccountId: string,
  ): Promise<GroupChatOutput> {
    const groupChats: GroupChatOutput[] = await prisma.$queryRaw<
      GroupChatOutput[]
    >`
        SELECT
            gc.id as id,
            gc.name as name,
            gc.owner_id as ownerId,
            gc.created_at as createdAt,
            gc.updated_at as updatedAt
        FROM
            group_chats AS gc JOIN members AS m ON gc.id = m.group_chat_id 
        WHERE
            gc.disabled = 'false' AND m.group_chat_id = ${groupChatId} AND m.user_account_id = ${userAccountId}`;
    this.logger.debug("getGroupChats:", groupChats);
    if (!groupChats.length) {
      throw new Error("not found");
    }
    this.logger.debug("getGroupChat:", groupChats[0]);
    return groupChats[0];
  }

  @Query(() => [GroupChatOutput])
  async getGroupChats(
    @Ctx() { prisma }: QueryContext,
    @Arg("userAccountId") userAccountId: string,
  ): Promise<GroupChatOutput[]> {
    const groupChats: GroupChatOutput[] = await prisma.$queryRaw<
      GroupChatOutput[]
    >`
        SELECT
            gc.id as id,
            gc.name as name,
            gc.owner_id as ownerId,
            gc.created_at as createdAt,
            gc.updated_at as updatedAt
	FROM
	    group_chats AS gc JOIN members AS m ON gc.id = m.group_chat_id
        WHERE
            gc.disabled = 'false' AND m.user_account_id = ${userAccountId}`;
    this.logger.debug("getGroupChats:", groupChats);
    return groupChats;
  }

  @Query(() => MemberOutput)
  async getMember(
    @Ctx() { prisma }: QueryContext,
    @Arg("groupChatId") groupChatId: string,
    @Arg("userAccountId") userAccountId: string,
  ): Promise<MemberOutput> {
    const members: MemberOutput[] = await prisma.$queryRaw<MemberOutput[]>`
        SELECT
            m.id as id,
            m.group_chat_id as groupChatId,
            m.user_account_id as userAccountId,
            m.role as role,
            m.created_at as createdAt,
            m.updated_at as updatedAt
	FROM
	    group_chats AS gc JOIN members AS m ON gc.id = m.group_chat_id
	WHERE
	    gc.disabled = 'false' AND m.group_chat_id = ${groupChatId} AND m.user_account_id = ${userAccountId}`;
    if (!members.length) {
      throw new Error("not found");
    }
    this.logger.debug("member:", members[0]);
    return members[0];
  }

  @Query(() => [MemberOutput])
  async getMembers(
    @Ctx() { prisma }: QueryContext,
    @Arg("groupChatId") groupChatId: string,
    @Arg("userAccountId") userAccountId: string,
  ): Promise<MemberOutput[]> {
    const members: MemberOutput[] = await prisma.$queryRaw<MemberOutput[]>`
        SELECT
            m.id as id,
            m.group_chat_id as groupChatId,
            m.user_account_id as userAccountId,
            m.role as role,
            m.created_at as createdAt,
            m.updated_at as updatedAt
        FROM
            group_chats AS gc JOIN members AS m ON gc.id = m.group_chat_id
        WHERE
            gc.disabled = 'false' AND m.group_chat_id = ${groupChatId}
		    AND EXISTS (
		        SELECT 1 
		        FROM
		            members AS m2
		        WHERE
		            m2.group_chat_id = m.group_chat_id AND m2.user_account_id = ${userAccountId})`;
    this.logger.debug("members:", members);
    return members;
  }

  @Query(() => MessageOutput)
  async getMessage(
    @Ctx() { prisma }: QueryContext,
    @Arg("messageId") messageId: string,
    @Arg("userAccountId") userAccountId: string,
  ): Promise<MessageOutput> {
    const messages: MessageOutput[] = await prisma.$queryRaw<MessageOutput[]>`
        SELECT
	    m.id as id,
            m.group_chat_id as groupChatId,
            m.user_account_id as userAccountId,
            m.text as text,
            m.created_at as createdAt,
            m.updated_at as updatedAt
	FROM
	    group_chats AS gc JOIN messages AS m ON gc.id = m.group_chat_id
        WHERE
            gc.disabled = 'false' AND m.disabled = 'false' AND m.id = ${messageId}
            AND EXISTS (
                SELECT 1
                FROM
                    members AS mem
                WHERE
                    mem.group_chat_id = m.group_chat_id AND mem.user_account_id = ${userAccountId})`;
    if (!messages.length) {
      throw new Error("not found");
    }
    this.logger.debug("message:", messages[0]);
    return messages[0];
  }

  @Query(() => [MessageOutput])
  async getMessages(
    @Ctx() { prisma }: QueryContext,
    @Arg("groupChatId") groupChatId: string,
    @Arg("userAccountId") userAccountId: string,
  ): Promise<MessageOutput[]> {
    const messages: MessageOutput[] = await prisma.$queryRaw<MessageOutput[]>`
        SELECT
            m.id as id,
            m.group_chat_id as groupChatId,
            m.user_account_id as userAccountId,
            m.text as text,
            m.created_at as createdAt,
            m.updated_at as updatedAt
	FROM
	    group_chats AS gc JOIN messages AS m ON gc.id = m.group_chat_id
        WHERE
            gc.disabled = 'false' AND m.disabled = 'false' AND m.group_chat_id = ${groupChatId}
            AND EXISTS (
                SELECT 1
                FROM
                    members AS mem
                WHERE
                    mem.group_chat_id = m.group_chat_id AND mem.user_account_id = ${userAccountId})`;
    this.logger.debug("messages:", messages);
    return messages;
  }
}

@Resolver()
class AttendanceStampQueryResolver {
  private readonly logger: Logger<ILogObj> = new Logger();

  @Query(() => [AttendanceStampOutput])
  async getAttendanceStamps(
    @Ctx() { prisma }: QueryContext,
    @Arg("userAccountId") userAccountId: string,
  ): Promise<AttendanceStampOutput[]> {
    const attendanceStamps: AttendanceStampOutput[] = await prisma.$queryRaw<
    AttendanceStampOutput[]
    >`
        SELECT
            at.id as id,
            at.user_account_id as userAccountId,
            at.stamping_at as stampingAt,
            at.created_at as createdAt,
            at.updated_at as updatedAt
        FROM
            attendance_stamp AS at
        WHERE
            at.status = 'ENABLED' AND at.user_account_id = ${userAccountId}`;
    this.logger.debug("getAttendanceStamp:", attendanceStamps);
    if (!attendanceStamps.length) {
      throw new Error("not found");
    }
    this.logger.debug("getAttendanceStamps:", attendanceStamps);
    return attendanceStamps;
  }

}
export { QueryContext, GroupChatQueryResolver, AttendanceStampQueryResolver };
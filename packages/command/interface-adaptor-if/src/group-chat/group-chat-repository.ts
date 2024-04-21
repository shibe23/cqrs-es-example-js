import {
  GroupChat,
  GroupChatEvent,
  GroupChatId,
} from "cqrs-es-example-js-command-domain";
import * as TE from "fp-ts/TaskEither";
import { RepositoryError } from "../common";

interface GroupChatRepository {
  withRetention(numberOfEvents: number): GroupChatRepository;

  storeEvent(
    event: GroupChatEvent,
    version: number,
  ): TE.TaskEither<RepositoryError, void>;

  storeEventAndSnapshot(
    event: GroupChatEvent,
    snapshot: GroupChat,
  ): TE.TaskEither<RepositoryError, void>;

  store(
    event: GroupChatEvent,
    snapshot: GroupChat,
  ): TE.TaskEither<RepositoryError, void>;

  findById(
    id: GroupChatId,
  ): TE.TaskEither<RepositoryError, GroupChat | undefined>;
}

export { GroupChatRepository, RepositoryError };

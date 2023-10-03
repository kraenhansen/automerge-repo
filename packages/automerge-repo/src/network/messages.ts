import { DocumentId, PeerId, SessionId } from "../types.js"

type MessageBase = {
  /** The peer ID of the sender of this message */
  senderId: PeerId

  /** The peer ID of the recipient of this message */
  targetId: PeerId
}

/**
 * A sync message for a particular document
 */
export type SyncMessage = MessageBase & {
  type: "sync"

  /** The automerge sync message */
  data: Uint8Array

  /** The document ID of the document this message is for */
  documentId: DocumentId
}

/** An ephemeral message
 *
 * @remarks
 * Ephemeral messages are not persisted anywhere and have no particular
 * structure. `automerge-repo` will gossip them around, in order to avoid
 * eternal loops of ephemeral messages every message has a session ID, which
 * is a random number generated by the sender at startup time, and a sequence
 * number. The combination of these two things allows us to discard messages
 * we have already seen.
 * */
export type EphemeralMessage = MessageBase & {
  type: "ephemeral"

  /** A sequence number which must be incremented for each message sent by this peer */
  count: number

  /** The ID of the session this message is part of. The sequence number for a given session always increases */
  sessionId: SessionId

  /** The document ID this message pertains to */
  documentId: DocumentId

  /** The actual data of the message */
  data: Uint8Array
}

/** Sent by a {@link Repo} to indicate that it does not have the document and none of it's connected peers do either */
export type DocumentUnavailableMessage = MessageBase & {
  type: "doc-unavailable"

  /** The document which the peer claims it doesn't have */
  documentId: DocumentId
}

/** Sent by a {@link Repo} to request a document from a peer
 *
 * @remarks
 * This is identical to a {@link SyncMessage} except that it is sent by a {@link Repo}
 * as the initial sync message when asking the other peer if it has the document.
 * */
export type RequestMessage = MessageBase & {
  type: "request"

  /** The initial automerge sync message */
  data: Uint8Array

  /** The document ID this message requests */
  documentId: DocumentId
}

/** Notify the network that we have arrived so everyone knows our peer ID */
export type ArriveMessage = MessageBase & {
  type: "arrive"

  targetId: never
}

/** Respond to an arriving peer with our peer ID */
export type WelcomeMessage = MessageBase & {
  type: "welcome"
}

/** The type of messages that {@link Repo} sends and receive to {@link NetworkAdapter}s */
export type Message =
  | SyncMessage
  | EphemeralMessage
  | RequestMessage
  | DocumentUnavailableMessage

/**
 * The contents of a message, without the sender ID or other properties added by the {@link NetworkSubsystem})
 */
export type MessageContents<T extends Message = Message> =
  T extends EphemeralMessage
    ? Omit<T, "senderId" | "count" | "sessionId">
    : Omit<T, "senderId">

/** The type of messages that {@link NetworkAdapter}s send and receive to each other
 *
 * @remarks
 * It is not _required_ that a {@link NetworkAdapter} use this message type.
 * NetworkAdapters are free to use whatever message type makes sense for their
 * transport. However, this type is a useful default.
 * */
export type NetworkAdapterMessage = Message | ArriveMessage | WelcomeMessage

// TYPE GUARDS

export function isValidMessage(
  message: NetworkAdapterMessage
): message is
  | SyncMessage
  | EphemeralMessage
  | RequestMessage
  | DocumentUnavailableMessage {
  return (
    typeof message === "object" &&
    typeof message.type === "string" &&
    typeof message.senderId === "string" &&
    (isSyncMessage(message) ||
      isEphemeralMessage(message) ||
      isRequestMessage(message) ||
      isDocumentUnavailableMessage(message))
  )
}

export function isDocumentUnavailableMessage(
  message: NetworkAdapterMessage
): message is DocumentUnavailableMessage {
  return message.type === "doc-unavailable"
}

export function isRequestMessage(
  message: NetworkAdapterMessage
): message is RequestMessage {
  return message.type === "request"
}

export function isSyncMessage(
  message: NetworkAdapterMessage
): message is SyncMessage {
  return message.type === "sync"
}

export function isEphemeralMessage(
  message: NetworkAdapterMessage
): message is EphemeralMessage {
  return message.type === "ephemeral"
}

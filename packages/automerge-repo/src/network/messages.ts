import { SyncState } from "@automerge/automerge"
import { DocumentId, PeerId, SessionId } from "../types.js"
import { StorageId } from "../storage/types.js"

export type Message = {
  type: string

  /** The peer ID of the sender of this message */
  senderId: PeerId

  /** The peer ID of the recipient of this message */
  targetId: PeerId
}

/**
 * A sync message for a particular document
 */
export type SyncMessage = {
  type: "sync"
  senderId: PeerId
  targetId: PeerId

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
export type EphemeralMessage = {
  type: "ephemeral"
  senderId: PeerId
  targetId: PeerId

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
export type DocumentUnavailableMessage = {
  type: "doc-unavailable"
  senderId: PeerId
  targetId: PeerId

  /** The document which the peer claims it doesn't have */
  documentId: DocumentId
}

/** Sent by a {@link Repo} to request a document from a peer
 *
 * @remarks
 * This is identical to a {@link SyncMessage} except that it is sent by a {@link Repo}
 * as the initial sync message when asking the other peer if it has the document.
 * */
export type RequestMessage = {
  type: "request"
  senderId: PeerId
  targetId: PeerId
  data: Uint8Array
  documentId: DocumentId
}

export type RemoteSubscriptionControlMessage = {
  type: "remote-subscription-change"
  senderId: PeerId
  targetId: PeerId
  add?: StorageId[]
  remove?: StorageId[]
}

export type RemoteHeadsChanged = {
  type: "remote-heads-changed"
  senderId: PeerId
  targetId: PeerId
  documentId: DocumentId
  newHeads: { [key: StorageId]: { heads: string[]; timestamp: number } }
}

/** These are message types that a {@link NetworkAdapter} surfaces to a {@link Repo}. */
export type RepoMessage =
  | SyncMessage
  | EphemeralMessage
  | RequestMessage
  | DocumentUnavailableMessage
  | RemoteSubscriptionControlMessage
  | RemoteHeadsChanged

/** These are message types that pertain to a specific `documentId`. */
export type DocMessage =
  | SyncMessage
  | EphemeralMessage
  | RequestMessage
  | DocumentUnavailableMessage

/**
 * The contents of a message, without the sender ID or other properties added by the {@link NetworkSubsystem})
 */
export type MessageContents<T extends Message = RepoMessage> =
  T extends EphemeralMessage
    ? Omit<T, "senderId" | "count" | "sessionId">
    : Omit<T, "senderId">

// TYPE GUARDS

export const isValidRepoMessage = (message: Message): message is RepoMessage =>
  typeof message === "object" &&
  typeof message.type === "string" &&
  typeof message.senderId === "string" &&
  (isSyncMessage(message) ||
    isEphemeralMessage(message) ||
    isRequestMessage(message) ||
    isDocumentUnavailableMessage(message) ||
    isRemoteSubscriptionControlMessage(message) ||
    isRemoteHeadsChanged(message))

// prettier-ignore
export const isDocumentUnavailableMessage = (msg: Message): msg is DocumentUnavailableMessage => 
  msg.type === "doc-unavailable"

export const isRequestMessage = (msg: Message): msg is RequestMessage =>
  msg.type === "request"

export const isSyncMessage = (msg: Message): msg is SyncMessage =>
  msg.type === "sync"

export const isEphemeralMessage = (msg: Message): msg is EphemeralMessage =>
  msg.type === "ephemeral"

// prettier-ignore
export const isRemoteSubscriptionControlMessage = (msg: Message): msg is RemoteSubscriptionControlMessage =>
  msg.type === "remote-subscription-change"

export const isRemoteHeadsChanged = (msg: Message): msg is RemoteHeadsChanged =>
  msg.type === "remote-heads-changed"

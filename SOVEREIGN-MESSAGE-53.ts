/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-MESSAGE-53
 * ============================================================
 *
 * Sovereign Internal Messaging Engine.
 *
 * Responsibilities:
 * - Create and route sovereign internal messages.
 * - Support direct, group and system messaging.
 * - Track message delivery and acknowledgement.
 * - Support expiration and deduplication.
 * - Support retry and dead-letter handling.
 * - Preserve correlation and causation chains.
 * - Integrate with Queue, Worker, Event Bus, Stream and Signal.
 *
 * MESSAGE ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

/* ============================================================
 * 1. MESSAGE PRIORITY
 * ============================================================
 */

export type SovereignMessagePriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

/* ============================================================
 * 2. MESSAGE STATUS
 * ============================================================
 */

export type SovereignMessageStatus =
  | "CREATED"
  | "ROUTING"
  | "DELIVERED"
  | "PARTIAL"
  | "ACKNOWLEDGED"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED";

/* ============================================================
 * 3. MESSAGE SCOPE
 * ============================================================
 */

export type SovereignMessageScope =
  | "DIRECT"
  | "GROUP"
  | "SYSTEM";

/* ============================================================
 * 4. DELIVERY STATUS
 * ============================================================
 */

export type SovereignMessageDeliveryStatus =
  | "PENDING"
  | "DELIVERING"
  | "DELIVERED"
  | "ACKNOWLEDGED"
  | "FAILED"
  | "DEAD_LETTERED";

/* ============================================================
 * 5. MESSAGE
 * ============================================================
 */

export interface SovereignMessage {
  id: string;

  type: string;

  source: string;

  scope: SovereignMessageScope;

  priority: SovereignMessagePriority;

  status: SovereignMessageStatus;

  recipients: string[];

  payload: unknown;

  correlationId?: string;

  causationId?: string;

  replyTo?: string;

  deduplicationKey?: string;

  createdAt: string;

  expiresAt?: string;

  completedAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. DELIVERY
 * ============================================================
 */

export interface SovereignMessageDelivery {
  id: string;

  messageId: string;

  recipientId: string;

  status: SovereignMessageDeliveryStatus;

  attempt: number;

  maxAttempts: number;

  createdAt: string;

  deliveredAt?: string;

  acknowledgedAt?: string;

  failedAt?: string;

  error?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. DEAD LETTER
 * ============================================================
 */

export interface SovereignMessageDeadLetter {
  id: string;

  messageId: string;

  deliveryId: string;

  recipientId: string;

  reason: string;

  createdAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 8. CONTEXT
 * ============================================================
 */

export interface SovereignMessageContext {
  actorId: string;

  authority:
    | "OWNER"
    | "STEWARD"
    | "CORE"
    | "SYSTEM";

  authenticated: boolean;

  policyChecked: boolean;

  securityChecked: boolean;

  authorizationChecked: boolean;

  permissions: string[];

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 9. STORE
 * ============================================================
 */

export interface SovereignMessageStore {
  saveMessage(
    message: SovereignMessage
  ): Promise<void>;

  getMessage(
    messageId: string
  ): Promise<SovereignMessage | undefined>;

  listMessages(
    limit?: number
  ): Promise<SovereignMessage[]>;

  findByDeduplicationKey?(
    key: string
  ): Promise<SovereignMessage | undefined>;

  saveDelivery(
    delivery: SovereignMessageDelivery
  ): Promise<void>;

  getDelivery(
    deliveryId: string
  ): Promise<SovereignMessageDelivery | undefined>;

  listDeliveries(
    messageId: string
  ): Promise<SovereignMessageDelivery[]>;

  findDelivery?(
    messageId: string,
    recipientId: string
  ): Promise<SovereignMessageDelivery | undefined>;

  saveDeadLetter(
    deadLetter: SovereignMessageDeadLetter
  ): Promise<void>;
}

/* ============================================================
 * 10. DELIVERY BRIDGE
 * ============================================================
 */

export interface SovereignMessageDeliveryBridge {
  deliver(input: {
    message: SovereignMessage;

    recipientId: string;

    delivery: SovereignMessageDelivery;
  }): Promise<{
    success: boolean;

    reason?: string;

    metadata?: Record<string, unknown>;
  }>;
}

/* ============================================================
 * 11. POLICY BRIDGE
 * ============================================================
 */

export interface SovereignMessagePolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignMessageContext["authority"];

    operation:
      | "SEND"
      | "ACKNOWLEDGE"
      | "RETRY"
      | "CANCEL"
      | "READ";

    messageId?: string;

    priority?: SovereignMessagePriority;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

/* ============================================================
 * 12. EVENT BRIDGE
 * ============================================================
 */

export interface SovereignMessageEventBridge {
  publish(event: {
    id: string;

    type: string;

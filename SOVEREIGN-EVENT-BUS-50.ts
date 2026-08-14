/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-EVENT-BUS-50
 * ============================================================
 *
 * Sovereign Internal Event Bus.
 *
 * Responsibilities:
 * - Publish sovereign internal events.
 * - Subscribe platform components to event streams.
 * - Route events without tight component coupling.
 * - Preserve event identity and ordering metadata.
 * - Prevent duplicate event processing.
 * - Support retry and dead-letter handling.
 * - Maintain event delivery records.
 * - Integrate Queue, Worker, Scheduler and Automation.
 *
 * EVENT BUS IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

/* ============================================================
 * 1. EVENT PRIORITY
 * ============================================================
 */

export type SovereignEventPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

/* ============================================================
 * 2. EVENT STATUS
 * ============================================================
 */

export type SovereignEventStatus =
  | "CREATED"
  | "PUBLISHED"
  | "DELIVERING"
  | "DELIVERED"
  | "PARTIAL"
  | "FAILED"
  | "DEAD_LETTERED";

/* ============================================================
 * 3. DELIVERY STATUS
 * ============================================================
 */

export type SovereignEventDeliveryStatus =
  | "PENDING"
  | "DELIVERING"
  | "DELIVERED"
  | "FAILED"
  | "DEAD_LETTERED";

/* ============================================================
 * 4. SUBSCRIBER STATUS
 * ============================================================
 */

export type SovereignEventSubscriberStatus =
  | "ACTIVE"
  | "PAUSED"
  | "DISABLED";

/* ============================================================
 * 5. EVENT
 * ============================================================
 */

export interface SovereignEvent {
  id: string;

  type: string;

  source: string;

  subjectId?: string;

  correlationId?: string;

  causationId?: string;

  priority: SovereignEventPriority;

  status: SovereignEventStatus;

  payload: Record<string, unknown>;

  sequence?: number;

  createdAt: string;

  publishedAt?: string;

  completedAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. SUBSCRIBER
 * ============================================================
 */

export interface SovereignEventSubscriber {
  id: string;

  name: string;

  eventTypes: string[];

  status: SovereignEventSubscriberStatus;

  maxAttempts: number;

  sovereignControlled: boolean;

  createdBy: string;

  createdAt: string;

  updatedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. DELIVERY
 * ============================================================
 */

export interface SovereignEventDelivery {
  id: string;

  eventId: string;

  subscriberId: string;

  status: SovereignEventDeliveryStatus;

  attempt: number;

  maxAttempts: number;

  createdAt: string;

  startedAt?: string;

  deliveredAt?: string;

  failedAt?: string;

  error?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 8. DEAD LETTER
 * ============================================================
 */

export interface SovereignEventDeadLetter {
  id: string;

  eventId: string;

  subscriberId: string;

  deliveryId: string;

  reason: string;

  createdAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 9. CONTEXT
 * ============================================================
 */

export interface SovereignEventBusContext {
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
 * 10. STORE
 * ============================================================
 */

export interface SovereignEventBusStore {
  saveEvent(
    event: SovereignEvent
  ): Promise<void>;

  getEvent(
    eventId: string
  ): Promise<SovereignEvent | undefined>;

  listEvents(
    limit?: number
  ): Promise<SovereignEvent[]>;

  saveSubscriber(
    subscriber: SovereignEventSubscriber
  ): Promise<void>;

  getSubscriber(
    subscriberId: string
  ): Promise<SovereignEventSubscriber | undefined>;

  listSubscribers():
    Promise<SovereignEventSubscriber[]>;

  saveDelivery(
    delivery: SovereignEventDelivery
  ): Promise<void>;

  getDelivery(
    deliveryId: string
  ): Promise<SovereignEventDelivery | undefined>;

  listDeliveries(
    eventId: string
  ): Promise<SovereignEventDelivery[]>;

  findDelivery?(
    eventId: string,
    subscriberId: string
  ): Promise<SovereignEventDelivery | undefined>;

  saveDeadLetter(
    deadLetter: SovereignEventDeadLetter
  ): Promise<void>;
}

/* ============================================================
 * 11. DELIVERY HANDLER
 * ============================================================
 */

export interface SovereignEventDeliveryHandler {
  deliver(input: {
    event: SovereignEvent;

    subscriber: SovereignEventSubscriber;

    delivery: SovereignEventDelivery;
  }): Promise<{
    success: boolean;

    reason?: string;

    metadata?: Record<string, unknown>;
  }>;
}

/* ============================================================
 * 12. POLICY BRIDGE
 * ============================================================
 */

export interface SovereignEventBusPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignEventBusContext["authority"];

    operation:
      | "PUBLISH"
      | "SUBSCRIBE"
      | "PAUSE_SUBSCRIBER"
      | "RESUME_SUBSCRIBER"
      | "DISABLE_SUBSCRIBER"
      | "RETRY_DELIVERY";

    subjectId?: string;
  }): Promise<{
   

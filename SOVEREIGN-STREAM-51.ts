/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-STREAM-51
 * ============================================================
 *
 * Sovereign Stream Engine.
 *
 * Responsibilities:
 * - Manage internal sovereign data/event streams.
 * - Create and register streams.
 * - Publish ordered stream records.
 * - Manage consumers and consumer offsets.
 * - Support partitions and ordered processing.
 * - Track acknowledgements and failures.
 * - Support replay and retention policies.
 * - Integrate with Event Bus, Queue, Worker and Automation.
 *
 * STREAM IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

/* ============================================================
 * 1. STREAM STATUS
 * ============================================================
 */

export type SovereignStreamStatus =
  | "ACTIVE"
  | "PAUSED"
  | "SEALED"
  | "DISABLED";

/* ============================================================
 * 2. CONSUMER STATUS
 * ============================================================
 */

export type SovereignStreamConsumerStatus =
  | "ACTIVE"
  | "PAUSED"
  | "DISABLED";

/* ============================================================
 * 3. RECORD STATUS
 * ============================================================
 */

export type SovereignStreamRecordStatus =
  | "AVAILABLE"
  | "PROCESSING"
  | "ACKNOWLEDGED"
  | "FAILED";

/* ============================================================
 * 4. RETENTION POLICY
 * ============================================================
 */

export interface SovereignStreamRetentionPolicy {
  maxAgeSeconds?: number;

  maxRecords?: number;

  retainAcknowledged: boolean;
}

/* ============================================================
 * 5. STREAM
 * ============================================================
 */

export interface SovereignStream {
  id: string;

  name: string;

  status: SovereignStreamStatus;

  partitions: number;

  retention: SovereignStreamRetentionPolicy;

  sovereignControlled: boolean;

  createdBy: string;

  createdAt: string;

  updatedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. RECORD
 * ============================================================
 */

export interface SovereignStreamRecord {
  id: string;

  streamId: string;

  partition: number;

  offset: number;

  key?: string;

  type: string;

  status: SovereignStreamRecordStatus;

  payload: unknown;

  correlationId?: string;

  causationId?: string;

  createdAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. CONSUMER
 * ============================================================
 */

export interface SovereignStreamConsumer {
  id: string;

  streamId: string;

  name: string;

  status: SovereignStreamConsumerStatus;

  offsets: Record<number, number>;

  sovereignControlled: boolean;

  createdBy: string;

  createdAt: string;

  updatedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 8. DELIVERY
 * ============================================================
 */

export interface SovereignStreamDelivery {
  id: string;

  streamId: string;

  consumerId: string;

  recordId: string;

  partition: number;

  offset: number;

  attempt: number;

  acknowledged: boolean;

  createdAt: string;

  acknowledgedAt?: string;

  failedAt?: string;

  error?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 9. CONTEXT
 * ============================================================
 */

export interface SovereignStreamContext {
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

export interface SovereignStreamStore {
  saveStream(
    stream: SovereignStream
  ): Promise<void>;

  getStream(
    streamId: string
  ): Promise<SovereignStream | undefined>;

  listStreams():
    Promise<SovereignStream[]>;

  saveRecord(
    record: SovereignStreamRecord
  ): Promise<void>;

  getRecord(
    recordId: string
  ): Promise<SovereignStreamRecord | undefined>;

  readRecords(input: {
    streamId: string;

    partition: number;

    afterOffset: number;

    limit: number;
  }): Promise<SovereignStreamRecord[]>;

  getLastOffset(
    streamId: string,
    partition: number
  ): Promise<number>;

  saveConsumer(
    consumer: SovereignStreamConsumer
  ): Promise<void>;

  getConsumer(
    consumerId: string
  ): Promise<SovereignStreamConsumer | undefined>;

  listConsumers(
    streamId: string
  ): Promise<SovereignStreamConsumer[]>;

  saveDelivery(
    delivery: SovereignStreamDelivery
  ): Promise<void>;

  listDeliveries(
    consumerId: string,
    limit?: number
  ): Promise<SovereignStreamDelivery[]>;
}

/* ============================================================
 * 11. POLICY BRIDGE
 * ============================================================
 */

export interface SovereignStreamPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignStreamContext["authority"];

    operation:
      | "CREATE"
      | "PUBLISH"
      | "CONSUME"
      | "ACKNOWLEDGE"
      | "REPLAY"
      | "PAUSE"
      | "RESUME"
      | "SEAL";

    streamId?: string;

    consumerId?: string;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

/* ============================================================
 * 12. EVENT BRIDGE
 * ============================================================
 */

export interface SovereignStreamEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    streamId?: string;

    consumerId?: string;

    recordId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 13. AUDIT
 * ============================================================
 */

export interface SovereignStreamAudit {
  record(
    operation

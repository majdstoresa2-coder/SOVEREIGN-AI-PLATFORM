/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-SIGNAL-52
 * ============================================================
 *
 * Sovereign Signal Engine.
 *
 * Responsibilities:
 * - Emit internal sovereign signals.
 * - Route operational and system signals.
 * - Support targeted and broadcast delivery.
 * - Track signal acknowledgement.
 * - Support expiry and deduplication.
 * - Protect signal integrity.
 * - Integrate with Runtime, Worker, Security and Event Bus.
 *
 * SIGNAL IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

/* ============================================================
 * 1. SIGNAL PRIORITY
 * ============================================================
 */

export type SovereignSignalPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL"
  | "EMERGENCY";

/* ============================================================
 * 2. SIGNAL STATUS
 * ============================================================
 */

export type SovereignSignalStatus =
  | "CREATED"
  | "ACTIVE"
  | "ACKNOWLEDGED"
  | "EXPIRED"
  | "CANCELLED";

/* ============================================================
 * 3. SIGNAL SCOPE
 * ============================================================
 */

export type SovereignSignalScope =
  | "TARGET"
  | "GROUP"
  | "SYSTEM";

/* ============================================================
 * 4. SIGNAL
 * ============================================================
 */

export interface SovereignSignal {
  id: string;

  type: string;

  source: string;

  scope: SovereignSignalScope;

  priority: SovereignSignalPriority;

  status: SovereignSignalStatus;

  targetIds: string[];

  payload: Record<string, unknown>;

  correlationId?: string;

  causationId?: string;

  deduplicationKey?: string;

  createdAt: string;

  expiresAt?: string;

  acknowledgedAt?: string;

  cancelledAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 5. ACKNOWLEDGEMENT
 * ============================================================
 */

export interface SovereignSignalAcknowledgement {
  id: string;

  signalId: string;

  actorId: string;

  targetId?: string;

  acknowledgedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. CONTEXT
 * ============================================================
 */

export interface SovereignSignalContext {
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
 * 7. STORE
 * ============================================================
 */

export interface SovereignSignalStore {
  saveSignal(
    signal: SovereignSignal
  ): Promise<void>;

  getSignal(
    signalId: string
  ): Promise<SovereignSignal | undefined>;

  listSignals(
    limit?: number
  ): Promise<SovereignSignal[]>;

  findByDeduplicationKey?(
    key: string
  ): Promise<SovereignSignal | undefined>;

  saveAcknowledgement(
    acknowledgement: SovereignSignalAcknowledgement
  ): Promise<void>;

  listAcknowledgements(
    signalId: string
  ): Promise<SovereignSignalAcknowledgement[]>;
}

/* ============================================================
 * 8. DELIVERY BRIDGE
 * ============================================================
 */

export interface SovereignSignalDeliveryBridge {
  deliver(input: {
    signal: SovereignSignal;

    targetId?: string;
  }): Promise<{
    success: boolean;

    reason?: string;
  }>;
}

/* ============================================================
 * 9. POLICY BRIDGE
 * ============================================================
 */

export interface SovereignSignalPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignSignalContext["authority"];

    operation:
      | "EMIT"
      | "ACKNOWLEDGE"
      | "CANCEL"
      | "READ";

    signalId?: string;

    priority?: SovereignSignalPriority;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

/* ============================================================
 * 10. EVENT BRIDGE
 * ============================================================
 */

export interface SovereignSignalEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    signalId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 11. AUDIT
 * ============================================================
 */

export interface SovereignSignalAudit {
  record(
    operation: string,
    subjectId: string | undefined,
    result:
      | "SUCCESS"
      | "FAILED"
      | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 12. ENGINE
 * ============================================================
 */

export class SovereignSignalEngine {
  public readonly id =
    "SOVEREIGN-SIGNAL-52";

  public readonly version =
    "1.0.0";

  private store?: SovereignSignalStore;

  private deliveryBridge?: SovereignSignalDeliveryBridge;

  private policyBridge?: SovereignSignalPolicyBridge;

  private eventBridge?: SovereignSignalEventBridge;

  private audit?: SovereignSignalAudit;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setStore(
    store: SovereignSignalStore
  ): void {
    this.store = store;
  }

  setDeliveryBridge(
    bridge: SovereignSignalDeliveryBridge
  ): void {
    this.deliveryBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignSignalPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignSignalEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignSignalAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * EMIT SIGNAL
   * ==========================================================
   */

  async emit(
    input: {
      id?: string;

      type: string;

      source: string;

      scope?: SovereignSignalScope;

      priority?: SovereignSignalPriority;

      targetIds?: string[];

      payload: Record<string, unknown>;

      correlationId?: string;

      causationId?: string;

      deduplicationKey?: string;

      ttlSeconds?: number;

      metadata?: Record<string, unknown>;
    },
    context: SovereignSignalContext
  ): Promise<SovereignSignal> {
    this.requireContext(context);

    if (!input.type.trim()) {
      throw new Error(
        "Signal type is required."
      );
    }

    if (!input.source.trim()) {
      throw new Error(
        "Signal source is required."
      );
    }

    const priority =
      input.priority ?? "NORMAL";

    const signalId =
      input.id ??
      this.createId("SIGNAL");

    await this.requireAuthorized(
      context,
      "EMIT",
      signalId,
      priority
    );

    if (
      input.ttlSeconds !== undefined &&
      (
        !Number.isInteger(input.ttlSeconds) ||
        input.ttlSeconds < 1
      )
    ) {
      throw new Error(
        "Signal ttlSeconds must be greater than zero."
      );
    }

    if (
      input.deduplicationKey &&
      this.requireStore()
        .findByDeduplicationKey
    ) {
      const existing =
        await this.requireStore()
          .findByDeduplicationKey!(
            input.deduplicationKey
          );

      if (
        existing &&
        existing.status === "ACTIVE" &&
        !this.isExpired(existing)
      ) {
        return existing;
      }
    }

    const scope =
      input.scope ?? "SYSTEM";

    const targets =
      [...new Set(
        input.targetIds ?? []
      )];

    if (
      scope === "TARGET" &&
      targets.length !== 1
    ) {
      throw new Error(
        "TARGET signal requires exactly one target."
      );
    }

    if (
      scope === "GROUP" &&
      targets.length === 0
    ) {
      throw new Error(
        "GROUP signal requires targets."
      );
    }

    const now =
      new Date();

    const signal:
      SovereignSignal = {
      id: signalId,

      type: input.type,

      source: input.source,

      scope,

      priority,

      status: "CREATED",

      targetIds: targets,

      payload: input.payload,

      correlationId:
        input.correlationId,

      causationId:
        input.causationId,

      deduplicationKey:
        input.deduplicationKey,

      createdAt:
        now.toISOString(),

      expiresAt:
        input.ttlSeconds
          ? new Date(
              now.getTime() +
              input.ttlSeconds * 1000
            ).toISOString()
          : undefined,

      metadata:
        input.metadata,
    };

    await this.requireStore()
      .saveSignal(signal);

    signal.status =
      "ACTIVE";

    await this.requireStore()
      .

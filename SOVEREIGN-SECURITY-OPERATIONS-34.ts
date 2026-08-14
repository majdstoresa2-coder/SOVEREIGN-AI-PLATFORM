/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-SECURITY-OPERATIONS-34
 * ============================================================
 *
 * Central Sovereign Security Operations Engine.
 *
 * Responsibilities:
 * - Receive sovereign security events.
 * - Correlate risk, threat and incident signals.
 * - Create operational security alerts.
 * - Prioritize security work.
 * - Escalate dangerous conditions.
 * - Coordinate containment requests.
 * - Track security operational state.
 * - Preserve immutable operational evidence references.
 *
 * SECURITY OPERATIONS IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. SEVERITY
 * ============================================================
 */

export type SovereignSecurityOpsSeverity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

/* ============================================================
 * 2. EVENT TYPE
 * ============================================================
 */

export type SovereignSecurityOpsEventType =
  | "AUTHENTICATION"
  | "AUTHORIZATION"
  | "ZERO_TRUST"
  | "RISK"
  | "THREAT"
  | "INCIDENT"
  | "NETWORK"
  | "DEVICE"
  | "SERVICE"
  | "AGENT"
  | "DATA"
  | "INTEGRITY"
  | "SYSTEM";

/* ============================================================
 * 3. ALERT STATUS
 * ============================================================
 */

export type SovereignSecurityOpsAlertStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "INVESTIGATING"
  | "CONTAINING"
  | "CONTAINED"
  | "RESOLVED"
  | "FALSE_POSITIVE"
  | "CLOSED";

/* ============================================================
 * 4. ACTION
 * ============================================================
 */

export type SovereignSecurityOpsAction =
  | "MONITOR"
  | "INVESTIGATE"
  | "CHALLENGE"
  | "RESTRICT"
  | "ISOLATE"
  | "REVOKE_SESSION"
  | "ROTATE_SECRET"
  | "ROTATE_KEY"
  | "BLOCK"
  | "ESCALATE";

/* ============================================================
 * 5. SECURITY EVENT
 * ============================================================
 */

export interface SovereignSecurityOpsEvent {
  id: string;

  type: SovereignSecurityOpsEventType;

  source: string;

  subjectId?: string;

  resourceId?: string;

  severity: SovereignSecurityOpsSeverity;

  confidence: number;

  title: string;

  description: string;

  timestamp: string;

  evidenceRefs?: string[];

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. ALERT
 * ============================================================
 */

export interface SovereignSecurityOpsAlert {
  id: string;

  status: SovereignSecurityOpsAlertStatus;

  severity: SovereignSecurityOpsSeverity;

  score: number;

  title: string;

  description: string;

  subjectIds: string[];

  resourceIds: string[];

  eventIds: string[];

  recommendedActions: SovereignSecurityOpsAction[];

  assignedTo?: string;

  createdAt: string;

  updatedAt: string;

  acknowledgedAt?: string;

  containedAt?: string;

  resolvedAt?: string;

  closedAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. CONTEXT
 * ============================================================
 */

export interface SovereignSecurityOpsContext {
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
 * 8. CORRELATION RESULT
 * ============================================================
 */

export interface SovereignSecurityOpsCorrelation {
  correlated: boolean;

  score: number;

  severity: SovereignSecurityOpsSeverity;

  title: string;

  description: string;

  recommendedActions: SovereignSecurityOpsAction[];
}

/* ============================================================
 * 9. CORRELATOR
 * ============================================================
 */

export interface SovereignSecurityOpsCorrelator {
  correlate(
    events: SovereignSecurityOpsEvent[]
  ): Promise<SovereignSecurityOpsCorrelation>;
}

/* ============================================================
 * 10. INCIDENT BRIDGE
 * ============================================================
 */

export interface SovereignSecurityOpsIncidentBridge {
  createIncident(input: {
    alertId: string;

    severity: SovereignSecurityOpsSeverity;

    title: string;

    description: string;

    subjectIds: string[];

    eventIds: string[];

    metadata?: Record<string, unknown>;
  }): Promise<{
    incidentId: string;
  }>;
}

/* ============================================================
 * 11. CONTAINMENT BRIDGE
 * ============================================================
 */

export interface SovereignSecurityOpsContainmentBridge {
  request(input: {
    alertId: string;

    subjectIds: string[];

    resourceIds: string[];

    actions: SovereignSecurityOpsAction[];

    requestedBy: string;
  }): Promise<{
    accepted: boolean;

    referenceId?: string;

    reason?: string;
  }>;
}

/* ============================================================
 * 12. STORE
 * ============================================================
 */

export interface SovereignSecurityOpsStore {
  saveEvent(
    event: SovereignSecurityOpsEvent
  ): Promise<void>;

  getEvent(
    eventId: string
  ): Promise<SovereignSecurityOpsEvent | undefined>;

  createAlert(
    alert: SovereignSecurityOpsAlert
  ): Promise<void>;

  updateAlert(
    alert: SovereignSecurityOpsAlert
  ): Promise<void>;

  getAlert(
    alertId: string
  ): Promise<SovereignSecurityOpsAlert | undefined>;

  listAlerts():
    Promise<SovereignSecurityOpsAlert[]>;
}

/* ============================================================
 * 13. EVENT BUS
 * ============================================================
 */

export interface SovereignSecurityOpsEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    alertId?: string;

    subjectId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 14. AUDIT
 * ============================================================
 */

export interface SovereignSecurityOpsAudit {
  record(
    operation: string,
    subjectId: string | undefined,
    result: "SUCCESS" | "FAILED" | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 15. ENGINE
 * ============================================================
 */

export class SovereignSecurityOperationsEngine {
  public readonly id =
    "SOVEREIGN-SECURITY-OPERATIONS-34";

  public readonly version = "1.0.0";

  private store?: SovereignSecurityOpsStore;

  private correlator?: SovereignSecurityOpsCorrelator;

  private incidentBridge?: SovereignSecurityOpsIncidentBridge;

  private containmentBridge?: SovereignSecurityOpsContainmentBridge;

  private eventBus?: SovereignSecurityOpsEventBus;

  private audit?: SovereignSecurityOpsAudit;

  setStore(
    store: SovereignSecurityOpsStore
  ): void {
    this.store = store;
  }

  setCorrelator(
    correlator: SovereignSecurityOpsCorrelator
  ): void {
    this.correlator = correlator;
  }

  setIncidentBridge(
    bridge: SovereignSecurityOpsIncidentBridge
  ): void {
    this.incidentBridge = bridge;
  }

  setContainmentBridge(
    bridge: SovereignSecurityOpsContainmentBridge
  ): void {
    this.containmentBridge = bridge;
  }

  setEventBus(
    eventBus: SovereignSecurityOpsEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignSecurityOpsAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * INGEST EVENT
   * ==========================================================
   */

  async ingest(
    event: SovereignSecurityOpsEvent
  ): Promise<void> {
    this.validateEvent(event);

    await this.requireStore()
      .saveEvent(event);

    await this.publish(
      "security-operations.event.received",
      undefined,
      event.subjectId,
      {
        eventId: event.id,
        type: event.type,
        severity: event.severity,
      }
    );
  }

  /* ==========================================================
   * CREATE ALERT
   * ==========================================================
   */

  async createAlert(
    eventIds: string[],
    context: SovereignSecurityOpsContext
  ): Promise<SovereignSecurityOpsAlert> {
    this.requireContext(context);

    if (eventIds.length === 0) {
      throw new Error(
        "Security alert requires at least one event."
      );
    }

    const events: SovereignSecurityOpsEvent[] = [];

    for (const eventId of [...new Set(eventIds)]) {
      const event =
        await this.requireStore()
          .getEvent(eventId);

      if (!event) {
        throw new Error(
          `Security event not found: ${eventId}`
        );
      }

      events.push(event);
    }

    const correlation =
      this.correlator
        ? await this.correlator.correlate(events)
        : this.defaultCorrelation(events);

    const now = this.now();

    const alert: SovereignSecurityOpsAlert = {
      id:
        this.createId("SEC-ALERT"),

      status: "OPEN",

      severity:
        correlation.severity,

      score:
        this.clamp(
          correlation.score,
          0,
          100
        ),

      title:
        correlation.title,

      description:
        correlation.description,

      subjectIds:
        this.unique(
          events
            .map((event) => event.subjectId)
            .filter(
              (value): value is string =>
                Boolean(value)
            )
        ),

      resourceIds:
        this.unique(
          events
            .map((event) => event.resourceId)
            .filter(
              (value): value is string =>
                Boolean(value)
            )
        ),

      eventIds:
        events.map((event) => event.id),

      recommendedActions:
        correlation.recommendedActions,

      createdAt: now,

      updatedAt: now,
    };

    await this.requireStore()
      .createAlert(alert);

    await this.publish(
      "security-operations.alert.created",
      alert.id,
      undefined,
      {
        severity: alert.severity,
        score: alert.score,
        eventCount: alert.eventIds.length,
      }
    );

    if (
      alert.severity === "CRITICAL" &&
      this.incidentBridge
    ) {
      const incident =
        await this.incidentBridge
          .createIncident({
            alertId: alert.id,
            severity: alert.severity,
            title: alert.title,
            description: alert.description,
            subjectIds: alert.subjectIds,
            eventIds: alert.eventIds,
            metadata: {
              createdBy:
                this.id,
            },
          });

      alert.metadata = {
        ...(alert.metadata ?? {}),
        incidentId:
          incident.incidentId,
      };

      await this.requireStore()
        .updateAlert(alert);
    }

    await this.recordAudit(
      "security-operations.alert.create",
      undefined,
      "SUCCESS",
      {
        alertId: alert.id,
        actorId: context.actorId,
        severity: alert.severity,
      }
    );

    return alert;
  }

  /* ==========================================================
   * ACKNOWLEDGE
   * ==========================================================
   */

  async acknowledge(
    alertId: string,
    context: SovereignSecurityOpsContext
  ): Promise<SovereignSecurityOpsAlert> {
    this.requireContext(context);

    const alert =
      await this.requireAlert(alertId);

    if (
      alert.status === "CLOSED" ||
      alert.status === "RESOLVED"
    ) {
      throw new Error(
        "Closed or resolved alert cannot be acknowledged."
      );
    }

    alert.status =
      "ACKNOWLEDGED";

    alert.assignedTo =
      context.actorId;

    alert.acknowledgedAt =
      this.now();

    alert.updatedAt =
      alert.acknowledgedAt;

    await this.requireStore()
      .updateAlert(alert);

    await this.publish(
      "security-operations.alert.acknowledged",
      alert.id,
      undefined,
      {
        actorId: context.actorId,
      }
    );

    return alert;
  }

  /* ==========================================================
   * INVESTIGATE
   * ==========================================================
   */

  async investigate(
    alertId: string,
    context: SovereignSecurityOpsContext
  ): Promise<SovereignSecurityOpsAlert> {
    this.requireContext(context);

    const alert =
      await this.requireAlert(alertId);

    if (
      alert.status === "CLOSED" ||
      alert.status === "RESOLVED"
    ) {
      throw new Error(
        "Closed or resolved alert cannot enter investigation."
      );
    }

    alert.status =
      "INVESTIGATING";

    alert.assignedTo =
      context.actorId;

    alert.updatedAt =
      this.now();

    await this.requireStore()
      .updateAlert(alert);

    return alert;
  }

  /* ==========================================================
   * REQUEST CONTAINMENT
   * ==========================================================
   */

  async requestContainment(
    alertId: string,
    context: SovereignSecurityOpsContext
  ): Promise<{
    alert: SovereignSecurityOpsAlert;
    accepted: boolean;
    referenceId?: string;
    reason?: string;
  }> {
    this.requireContext(context);

    const alert =
      await this.requireAlert(alertId);

    if (!this.containmentBridge) {
      throw new Error(
        "Security containment bridge is not configured."
      );
    }

    if (
      alert.status === "CLOSED" ||
      alert.status === "RESOLVED"
    ) {
      throw new Error(
        "Containment cannot be requested for a completed alert."
      );
    }

    alert.status =
      "CONTAINING";

    alert.updatedAt =
      this.now();

    await this.requireStore()
      .updateAlert(alert);

    const result =
      await this.containmentBridge
        .request({
          alertId: alert.id,
          subjectIds: alert.subjectIds,
          resourceIds: alert.resourceIds,
          actions:
            alert.recommendedActions,
          requestedBy:
            context.actorId,
        });

    if (result.accepted) {
      alert.status =
        "CONTAINED";

      alert.containedAt =
        this.now();

      alert.updatedAt =
        alert.containedAt;

      alert.metadata = {
        ...(alert.metadata ?? {}),
        containmentReference:
          result.referenceId,
      };

      await this.requireStore()
        .updateAlert(alert);
    } else {
      alert.status =
        "INVESTIGATING";

      alert.updatedAt =
        this.now();

      await this.requireStore()
        .updateAlert(alert);
    }

    await this.publish(
      result.accepted
        ? "security-operations.containment.accepted"
        : "security-operations.containment.rejected",
      alert.id,
      undefined,
      {
        referenceId:
          result.referenceId,
        reason:
          result.reason,
      }
    );

    return {
      alert,
      ...result,
    };
  }

  /* ==========================================================
   * RESOLVE
   * ==========================================================
   */

  async resolve(
    alertId: string,
    context: SovereignSecurityOpsContext
  ): Promise<SovereignSecurityOpsAlert> {
    this.requireContext(context);

    const alert =
      await this.requireAlert(alertId);

    if (
      alert.status === "CLOSED"
    ) {
      throw new Error(
        "Closed alert cannot be resolved again."
      );
    }

    alert.status =
      "RESOLVED";

    alert.resolvedAt =
      this.now();

    alert.updatedAt =
      alert.resolvedAt;

    await this.require

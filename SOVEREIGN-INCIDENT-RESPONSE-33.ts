/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-INCIDENT-RESPONSE-33
 * ============================================================
 *
 * Central Sovereign Security Incident Response Engine.
 *
 * Responsibilities:
 * - Create and manage security incidents.
 * - Receive confirmed threat/risk signals.
 * - Coordinate containment and isolation.
 * - Preserve incident evidence.
 * - Track incident lifecycle.
 * - Coordinate recovery.
 * - Prevent unsafe automatic recovery.
 * - Maintain sovereign audit history.
 *
 * INCIDENT RESPONSE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. INCIDENT TYPE
 * ============================================================
 */

export type SovereignIncidentType =
  | "SECURITY_BREACH"
  | "ACCOUNT_COMPROMISE"
  | "MALWARE"
  | "INTRUSION"
  | "PRIVILEGE_ABUSE"
  | "DATA_EXPOSURE"
  | "DATA_EXFILTRATION"
  | "SERVICE_ATTACK"
  | "DENIAL_OF_SERVICE"
  | "CERTIFICATE_COMPROMISE"
  | "KEY_COMPROMISE"
  | "SECRET_COMPROMISE"
  | "NODE_COMPROMISE"
  | "AGENT_COMPROMISE"
  | "SUPPLY_CHAIN"
  | "INSIDER"
  | "UNKNOWN";

/* ============================================================
 * 2. SEVERITY
 * ============================================================
 */

export type SovereignIncidentSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

/* ============================================================
 * 3. STATUS
 * ============================================================
 */

export type SovereignIncidentStatus =
  | "OPEN"
  | "TRIAGE"
  | "INVESTIGATING"
  | "CONTAINING"
  | "CONTAINED"
  | "ERADICATING"
  | "RECOVERING"
  | "RESOLVED"
  | "CLOSED";

/* ============================================================
 * 4. ACTION
 * ============================================================
 */

export type SovereignIncidentAction =
  | "MONITOR"
  | "RESTRICT"
  | "ISOLATE"
  | "BLOCK"
  | "REVOKE_SESSION"
  | "REVOKE_CERTIFICATE"
  | "ROTATE_KEY"
  | "ROTATE_SECRET"
  | "DISABLE_IDENTITY"
  | "DISABLE_AGENT"
  | "DISABLE_SERVICE"
  | "ISOLATE_NODE"
  | "RESTORE"
  | "CUSTOM";

/* ============================================================
 * 5. EVIDENCE
 * ============================================================
 */

export interface SovereignIncidentEvidence {
  id: string;

  type:
    | "THREAT"
    | "RISK"
    | "AUDIT"
    | "LOG"
    | "NETWORK"
    | "IDENTITY"
    | "SESSION"
    | "DEVICE"
    | "CERTIFICATE"
    | "KEY"
    | "SECRET"
    | "SYSTEM";

  source: string;

  referenceId?: string;

  integrityHash?: string;

  description: string;

  collectedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. RESPONSE ACTION RECORD
 * ============================================================
 */

export interface SovereignIncidentActionRecord {
  id: string;

  action: SovereignIncidentAction;

  targetId: string;

  requestedBy: string;

  status:
    | "PENDING"
    | "RUNNING"
    | "COMPLETED"
    | "FAILED"
    | "DENIED";

  reason: string;

  createdAt: string;

  completedAt?: string;

  error?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. INCIDENT
 * ============================================================
 */

export interface SovereignIncidentRecord {
  id: string;

  type: SovereignIncidentType;

  severity: SovereignIncidentSeverity;

  status: SovereignIncidentStatus;

  title: string;

  description: string;

  affectedSubjects: string[];

  threatIds: string[];

  riskIds: string[];

  evidence: SovereignIncidentEvidence[];

  actions: SovereignIncidentActionRecord[];

  openedBy: string;

  openedAt: string;

  updatedAt: string;

  containedAt?: string;

  resolvedAt?: string;

  closedAt?: string;

  resolution?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 8. CREATE REQUEST
 * ============================================================
 */

export interface SovereignIncidentCreateRequest {
  id?: string;

  type: SovereignIncidentType;

  severity: SovereignIncidentSeverity;

  title: string;

  description: string;

  affectedSubjects?: string[];

  threatIds?: string[];

  riskIds?: string[];

  evidence?: SovereignIncidentEvidence[];

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 9. CONTEXT
 * ============================================================
 */

export interface SovereignIncidentContext {
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
 * 10. RESPONSE EXECUTOR
 * ============================================================
 */

export interface SovereignIncidentResponseExecutor {
  execute(input: {
    incidentId: string;

    action: SovereignIncidentAction;

    targetId: string;

    reason: string;

    actorId: string;

    metadata?: Record<string, unknown>;
  }): Promise<{
    success: boolean;

    error?: string;

    metadata?: Record<string, unknown>;
  }>;
}

/* ============================================================
 * 11. STORE
 * ============================================================
 */

export interface SovereignIncidentStore {
  create(
    incident: SovereignIncidentRecord
  ): Promise<void>;

  update(
    incident: SovereignIncidentRecord
  ): Promise<void>;

  get(
    incidentId: string
  ): Promise<SovereignIncidentRecord | undefined>;

  list():
    Promise<SovereignIncidentRecord[]>;
}

/* ============================================================
 * 12. EVENT BUS
 * ============================================================
 */

export interface SovereignIncidentEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    incidentId?: string;

    actorId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 13. AUDIT
 * ============================================================
 */

export interface SovereignIncidentAudit {
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
 * 14. ENGINE
 * ============================================================
 */

export class SovereignIncidentResponseEngine {
  public readonly id =
    "SOVEREIGN-INCIDENT-RESPONSE-33";

  public readonly version =
    "1.0.0";

  private store?: SovereignIncidentStore;

  private executor?:
    SovereignIncidentResponseExecutor;

  private eventBus?:
    SovereignIncidentEventBus;

  private audit?: SovereignIncidentAudit;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setStore(
    store: SovereignIncidentStore
  ): void {
    this.store = store;
  }

  setExecutor(
    executor: SovereignIncidentResponseExecutor
  ): void {
    this.executor = executor;
  }

  setEventBus(
    eventBus: SovereignIncidentEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignIncidentAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * OPEN INCIDENT
   * ==========================================================
   */

  async open(
    request: SovereignIncidentCreateRequest,
    context: SovereignIncidentContext
  ): Promise<SovereignIncidentRecord> {
    this.requireContext(context);

    if (!request.title.trim()) {
      throw new Error(
        "Incident title is required."
      );
    }

    if (!request.description.trim()) {
      throw new Error(
        "Incident description is required."
      );
    }

    const id =
      request.id ??
      this.createId("INCIDENT");

    const existing =
      await this.requireStore().get(id);

    if (existing) {
      throw new Error(
        `Incident already exists: ${id}`
      );
    }

    const now = this.now();

    const incident:
      SovereignIncidentRecord = {
      id,

      type: request.type,

      severity:
        request.severity,

      status: "OPEN",

      title: request.title,

      description:
        request.description,

      affectedSubjects: [
        ...(request.affectedSubjects ?? []),
      ],

      threatIds: [
        ...(request.threatIds ?? []),
      ],

      riskIds: [
        ...(request.riskIds ?? []),
      ],

      evidence: [
        ...(request.evidence ?? []),
      ],

      actions: [],

      openedBy:
        context.actorId,

      openedAt: now,

      updatedAt: now,

      metadata:
        request.metadata,
    };

    await this.requireStore()
      .create(incident);

    await this.publish(
      "incident.opened",
      incident.id,
      context.actorId,
      {
        type:
          incident.type,

        severity:
          incident.severity,
      }
    );

    await this.recordAudit(
      "incident.open",
      incident.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,

        severity:
          incident.severity,
      }
    );

    return incident;
  }

  /* ==========================================================
   * STATUS TRANSITION
   * ==========================================================
   */

  async transition(
    incidentId: string,
    status: SovereignIncidentStatus,
    context: SovereignIncidentContext
  ): Promise<SovereignIncidentRecord> {
    this.requireContext(context);

    const incident =
      await this.requireIncident(
        incidentId
      );

    this.validateTransition(
      incident.status,
      status
    );

    incident.status = status;

    incident.updatedAt =
      this.now();

    if (status === "CONTAINED") {
      incident.containedAt =
        incident.updatedAt;
    }

    if (status === "RESOLVED") {
      incident.resolvedAt =
        incident.updatedAt;
    }

    if (status === "CLOSED") {
      incident.closedAt =
        incident.updatedAt;
    }

    await this.requireStore()
      .update(incident);

    await this.publish(
      "incident.status.changed",
      incident.id,
      context.actorId,
      {
        status,
      }
    );

    return incident;
  }

  /* ==========================================================
   * ADD EVIDENCE
   * ==========================================================
   */

  async addEvidence(
    incidentId: string,
    evidence: SovereignIncidentEvidence,
    context: SovereignIncidentContext
  ): Promise<SovereignIncidentRecord> {
    this.requireContext(context);

    const incident =
      await this.requireIncident(
        incidentId
      );

    if (!evidence.id.trim()) {
      throw new Error(
        "Incident evidence ID is required."
      );
    }

    if (
      incident.evidence.some(
        (item) =>
          item.id === evidence.id
      )
    ) {
      throw new Error(
        `Evidence already exists: ${evidence.id}`
      );
    }

    incident.evidence.push(
      evidence
    );

    incident.updatedAt =
      this.now();

    await this.requireStore()
      .update(incident);

    await this.publish(
      "incident.evidence.added",
      incident.id,
      context.actorId,
      {
        evidenceId:
          evidence.id,

        evidenceType:
          evidence.type,
      }
    );

    return incident;
  }

  /* ==========================================================
   * EXECUTE RESPONSE
   * ==========================================================
   */

  async executeAction(
    incidentId: string,
    action: SovereignIncidentAction,
    targetId: string,
    reason: string,
    context: SovereignIncidentContext,
    metadata?: Record<string, unknown>
  ): Promise<SovereignIncidentActionRecord> {
    this.requireContext(context);

    const incident =
      await this.requireIncident(
        incidentId
      );

    if (
      incident.status === "CLOSED"
    ) {
      throw new Error(
        "Cannot execute response action on a closed incident."
      );
    }

    this.requireDangerousActionAuthority(
      action,
      context
    );

    const actionRecord:
      SovereignIncidentActionRecord = {
      id:
        this.createId(
          "INCIDENT-ACTION"
        ),

      action,

      targetId,

      requestedBy:
        context.actorId,

      status: "PENDING",

      reason,

      createdAt:
        this.now(),

      metadata,
    };

    incident.actions.push(
      actionRecord
    );

    incident.updatedAt =
      this.now();

    await this.requireStore()
      .update(incident);

    const executor =
      this.requireExecutor();

    actionRecord.status =
      "RUNNING";

    await this.requireStore()
      .update(incident);

    try {
      const result =
        await executor.execute({
          incidentId,

          action,

          targetId,

          reason,

          actorId:
            context.actorId,

          metadata,
        });

      actionRecord.status =
        result.success
          ? "COMPLETED"
          : "FAILED";

      actionRecord.error =
        result.error;

      actionRecord.completedAt =
        this.now();

      incident.updatedAt =
        actionRecord.completedAt;

      await this.requireStore()
        .update(incident);

      await this.publish(
        result.success
          ? "incident.action.completed"
          : "incident.action.failed",
        incident.id,
        context.actorId,
        {
          actionId:
            actionRecord.id,

          action,

          targetId,

          error:
            result.error,
        }
      );

      await this.recordAudit(
        "incident.action",
        targetId,
        result.success
          ? "SUCCESS"
          : "FAILED",
        {
          incidentId,

          action,

          actorId:
            context.actorId,
        }
      );

      return actionRecord;
    } catch (error) {
      actionRecord.status =
        "FAILED";

      actionRecord.error =
        error instanceof Error
          ? error.message
          : "UNKNOWN_ERROR";

      actionRecord.completedAt =
        this.now();

      incident.updatedAt =
        actionRecord.completedAt;

      await this.requireStore()
        .update(incident);

      throw error;
    }
  }

  /* ==========================================================
   * RESOLVE
   * ==========================================================
   */

  async resolve(
    incidentId: string,
    resolution: string,
    context: SovereignIncidentContext
  ): Promise<SovereignIncidentRecord> {
    this.requireContext(context);

    const incident =
      await this.requireIncident(
        incidentId
      );

    if (!resolution.trim()) {
      throw new Error(
        "Incident resolution is required."
      );
    }

    if (
      incident.status !== "CONTAINED" &&
      incident.status !== "RECOVERING" &&
      incident.status !== "ERADICATING"
    ) {
      throw new Error(
        "Incident must be contained, eradicating or recovering before resolution."
      );
    }

    incident.status =
      "RESOLVED";

    incident.resolution =
      resolution;

    incident.resolvedAt =
      this.now();

    incident.updatedAt =
      incident.resolvedAt;

    await this.requireStore()
      .update(incident);

    await this.publish(
      "incident.resolved",
      incident.id,
      context.actorId,
      {
        resolution,
      }
    );

    await this.recordAudit(
      "incident.resolve",
      incident.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,
      }
    );

    return incident;
  }

  /* ==========================================================
   * CLOSE
   * ==========================================================
   */

  async close(
    incidentId: string,
    context: SovereignIncidentContext
  ): Promise<SovereignIncidentRecord> {
    this.requireContext(context);

    const incident =
      await this.requireIncident(
        incidentId
      );

    if (
      incident.status !== "RESOLVED"
    ) {
      throw new Error(
        "Only resolved incidents may be closed."
      );
    }

    incident.status =
      "CLOSED";

    incident.closedAt =
      this.now();

    incident.updatedAt =
      incident.closedAt;

    await this.requireStore()
      .update(incident);

    await this.publish(
      "incident.closed",
      incident.id,
      context.actorId,
      {}
    );

    return incident;
  }

  /* ==========================================================
   * GET / LIST
   * ==========================================================
   */

  async get(
    incidentId: string,
    context: SovereignIncidentContext
  ): Promise<SovereignIncidentRecord> {
    this.requireContext(context);

    return this.requireIncident(
      incidentId
    );
  }

  async list(
    context: SovereignIncidentContext
  ): Promise<SovereignIncidentRecord[]> {
    this.requireContext(context);

    return this.requireStore()
      .list();
  }

  /* ==========================================================
   * DANGEROUS ACTION AUTHORITY
   * ==========================================================
   */

  private requireDangerousActionAuthority(
    action: SovereignIncidentAction,
    context: SovereignIncidentContext
  ): void {
    const dangerous:
      SovereignIncidentAction[] = [
        "REVOKE_CERTIFICATE",
        "ROTATE_KEY",
        "ROTATE_SECRET",
        "DISABLE_IDENTITY",
        "DISABLE_AGENT",
        "DISABLE_SERVICE",
        "ISOLATE_NODE",
      ];

    if (
      !dangerous.includes(action)
    ) {
      return;
    }

    if (
      context.authority !== "OWNER" &&
      context.authority !== "STEWARD"
    ) {
      throw new Error(
        "Dangerous incident response action requires OWNER or delegated STEWARD authority."
      );
    }
  }

  /* ==========================================================
   * TRANSITIONS
   * ==========================================================
   */

  private validateTransition(
    current: SovereignIncidentStatus,
    next: SovereignIncidentStatus
  ): void {
    const transitions:
      Record<
        SovereignIncidentStatus,
        SovereignIncidentStatus[]
      > = {
      OPEN: [
        "TRIAGE",
        "INVESTIGATING",
      ],

      TRIAGE: [
        "INVESTIGATING",
        "CONTAINING",
      ],

      INVESTIGATING: [
        "CONTAINING",
      ],

      CONTAINING: [
        "CONTAINED",
      ],

      CONTAINED: [
        "ERADICATING",
        "RECOVERING",
        "RESOLVED",
      ],

      ERADICATING: [
        "RECOVERING",
        "RESOLVED",
      ],

      RECOVERING: [
        "RESOLVED",
      ],

      RESOLVED: [
        "CLOSED",
      ],

      CLOSED: [],
    };

    if (
      !transitions[current].includes(
        next
      )
    ) {
      throw new Error(
        `Invalid incident transition: ${current} -> ${next}`
      );
    }
  }

  /* ==========================================================
   * CONTEXT
   * ==========================================================
   */

  private requireContext(
    context: SovereignIncidentContext
  ): void {
    if (!context.authenticated) {
      throw new Error(
        "Incid

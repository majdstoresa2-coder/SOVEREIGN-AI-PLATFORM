/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-RELIABILITY-GATE-97
 * ============================================================
 *
 * Sovereign Reliability Gate.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * GATE HAS NO AUTHORITY.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignReliabilityGateStatus =
  | "REGISTERED"
  | "EVALUATING"
  | "OPEN"
  | "RESTRICTED"
  | "BLOCKED"
  | "FAILED"
  | "ARCHIVED";

export type SovereignReliabilityCriticality =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignReliabilityEvidence {
  sloHealthy: boolean;
  sliVerified: boolean;
  errorBudgetRemainingPercent: number;
  burnRate: number;
  burnRateCritical: boolean;
  controllerHealthy: boolean;
  securityHealthy: boolean;
  dependenciesHealthy: boolean;
  measuredAt: string;
  metadata?: Record<string, unknown>;
}

export interface SovereignReliabilityDecision {
  allowed: boolean;

  status:
    | "OPEN"
    | "RESTRICTED"
    | "BLOCKED";

  reasons: string[];

  evaluatedAt: string;
}

export interface SovereignReliabilityGateRecord {
  id: string;

  serviceId: string;

  sloId?: string;
  sliId?: string;
  errorBudgetId?: string;
  burnRateId?: string;
  burnRateControllerId?: string;

  criticality:
    SovereignReliabilityCriticality;

  status:
    SovereignReliabilityGateStatus;

  minimumErrorBudgetPercent: number;
  maximumBurnRate: number;

  evidence?: SovereignReliabilityEvidence;
  decision?: SovereignReliabilityDecision;

  createdBy: string;
  evaluatedBy?: string;

  correlationId?: string;
  causationId?: string;

  createdAt: string;
  updatedAt: string;

  evaluatedAt?: string;
  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignReliabilityGateContext {
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

  correlationId?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignReliabilityGateStore {
  save(
    record: SovereignReliabilityGateRecord
  ): Promise<void>;

  get(
    recordId: string
  ): Promise<
    SovereignReliabilityGateRecord | undefined
  >;

  list(
    limit?: number
  ): Promise<SovereignReliabilityGateRecord[]>;
}

export interface SovereignReliabilityEvidenceBridge {
  collect(input: {
    recordId: string;
    serviceId: string;

    sloId?: string;
    sliId?: string;
    errorBudgetId?: string;
    burnRateId?: string;
    burnRateControllerId?: string;

    context: SovereignReliabilityGateContext;
  }): Promise<SovereignReliabilityEvidence>;
}

export interface SovereignReliabilityPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignReliabilityGateContext["authority"];

    operation:
      | "REGISTER_RELIABILITY_GATE"
      | "EVALUATE_RELIABILITY_GATE"
      | "READ_RELIABILITY_GATE"
      | "ARCHIVE_RELIABILITY_GATE";

    recordId?: string;
    serviceId?: string;

    criticality?:
      SovereignReliabilityCriticality;
  }): Promise<{
    allowed: boolean;
    reason?: string;
  }>;
}

export interface SovereignReliabilityEventBridge {
  publish(event: {
    id: string;
    type: string;
    source: string;

    recordId?: string;
    serviceId?: string;

    timestamp: string;
    correlationId?: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignReliabilityAudit {
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

export class SovereignReliabilityGate {
  public readonly id =
    "SOVEREIGN-RELIABILITY-GATE-97";

  public readonly version = "1.0.0";

  private store?: SovereignReliabilityGateStore;

  private evidenceBridge?:
    SovereignReliabilityEvidenceBridge;

  private policyBridge?:
    SovereignReliabilityPolicyBridge;

  private eventBridge?:
    SovereignReliabilityEventBridge;

  private audit?: SovereignReliabilityAudit;

  private processing = new Set<string>();

  setStore(
    store: SovereignReliabilityGateStore
  ): void {
    this.store = store;
  }

  setEvidenceBridge(
    bridge: SovereignReliabilityEvidenceBridge
  ): void {
    this.evidenceBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignReliabilityPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignReliabilityEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignReliabilityAudit
  ): void {
    this.audit = audit;
  }

  async register(
    input: {
      id?: string;

      serviceId: string;

      sloId?: string;
      sliId?: string;
      errorBudgetId?: string;
      burnRateId?: string;
      burnRateControllerId?: string;

      criticality:
        SovereignReliabilityCriticality;

      minimumErrorBudgetPercent?: number;
      maximumBurnRate?: number;

      correlationId?: string;
      causationId?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignReliabilityGateContext
  ): Promise<SovereignReliabilityGateRecord> {
    this.requireContext(context);

    if (!input.serviceId.trim()) {
      throw new Error(
        "Reliability gate serviceId is required."
      );
    }

    const minimumErrorBudgetPercent =
      input.minimumErrorBudgetPercent ?? 10;

    const maximumBurnRate =
      input.maximumBurnRate ?? 1;

    this.validatePercent(
      minimumErrorBudgetPercent
    );

    if (
      !Number.isFinite(maximumBurnRate) ||
      maximumBurnRate < 0
    ) {
      throw new Error(
        "maximumBurnRate must be zero or greater."
      );
    }

    const id =
      input.id ??
      this.createId("RELIABILITY-GATE");

    await this.requireAuthorized(
      context,
      "REGISTER_RELIABILITY_GATE",
      id,
      input.serviceId,
      input.criticality
    );

    const now = this.now();

    const record:
      SovereignReliabilityGateRecord = {
      id,

      serviceId: input.serviceId,

      sloId: input.sloId,
      sliId: input.sliId,
      errorBudgetId: input.errorBudgetId,
      burnRateId: input.burnRateId,

      burnRateControllerId:
        input.burnRateControllerId,

      criticality:
        input.criticality,

      status: "REGISTERED",

      minimumErrorBudgetPercent,
      maximumBurnRate,

      createdBy: context.actorId,

      correlationId:
        input.correlationId ??
        context.correlationId,

      causationId:
        input.causationId,

      createdAt: now,
      updatedAt: now,

      metadata: input.metadata,
    };

    await this.requireStore().save(record);

    await this.publish(
      "reliability-gate.registered",
      record,
      {
        criticality:
          record.criticality,
      }
    );

    await this.recordAudit(
      "reliability-gate.register",
      record.id,
      "SUCCESS",
      {
        actorId: context.actorId,
      }
    );

    return record;
  }

  async evaluate(
    recordId: string,
    context: SovereignReliabilityGateContext
  ): Promise<SovereignReliabilityGateRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(recordId);

    await this.requireAuthorized(
      context,
      "EVALUATE_RELIABILITY_GATE",
      record.id,
      record.serviceId,
      record.criticality
    );

    if (record.status === "ARCHIVED") {
      throw new Error(
        "Archived reliability gate cannot be evaluated."
      );
    }

    this.acquire(record.id);

    record.status = "EVALUATING";
    record.updatedAt = this.now();

    await this.requireStore().save(record);

    try {
      const evidence =
        await this.requireEvidenceBridge()
          .collect({
            recordId: record.id,
            serviceId: record.serviceId,

            sloId: record.sloId,
            sliId: record.sliId,

            errorBudgetId:
              record.errorBudgetId,

            burnRateId:
              record.burnRateId,

            burnRateControllerId:
              record.burnRateControllerId,

            context,
          });

      this.validateEvidence(evidence);

      const reasons: string[] = [];

      let status:
        SovereignReliabilityDecision["status"] =
          "OPEN";

      if (!evidence.securityHealthy) {
        reasons.push(
          "SECURITY_NOT_HEALTHY"
        );

        status = "BLOCKED";
      }

      if (!evidence.sliVerified) {
        reasons.push(
          "SLI_NOT_VERIFIED"
        );

        status = "BLOCKED";
      }

      if (!evidence.sloHealthy) {
        reasons.push(
          "SLO_NOT_HEALTHY"
        );

        if (status !== "BLOCKED") {
          status = "RESTRICTED";
        }
      }

      if (
        evidence.errorBudgetRemainingPercent <=
        0
      ) {
        reasons.push(
          "ERROR_BUDGET_EXHAUSTED"
        );

        status = "BLOCKED";
      } else if (
        evidence.errorBudgetRemainingPercent <
        record.minimumErrorBudgetPercent
      ) {
        reasons.push(
          "ERROR_BUDGET_LOW"
        );

        if (status !== "BLOCKED") {
          status = "RESTRICTED";
        }
      }

      if (
        evidence.burnRateCritical ||
        evidence.burnRate >
          record.maximumBurnRate
      ) {
        reasons.push(
          "UNSAFE_BURN_RATE"
        );

        if (status !== "BLOCKED") {
          status = "RESTRICTED";
        }
      }

      if (!evidence.controllerHealthy) {
        reasons.push(
          "BURN_RATE_CONTROLLER_NOT_HEALTHY"
        );

        if (status !== "BLOCKED") {
          status = "RESTRICTED";
        }
      }

      if (!evidence.dependenciesHealthy) {
        reasons.push(
          "DEPENDENCY_HEALTH_FAILURE"
        );

        if (status !== "BLOCKED") {
          status = "RESTRICTED";
        }
      }

      const decision:
        SovereignReliabilityDecision = {
        allowed:
          status === "OPEN",

        status,

        reasons:
          [...new Set(reasons)],

        evaluatedAt:
          this.now(),
      };

      record.evidence = evidence;
      record.decision = decision;
      record.status = status;

      record.evaluatedBy =
        context.actorId;

      record.evaluatedAt =
        this.now();

      record.updatedAt =
        this.now();

      await this.requireStore().save(record);

      await this.publish(
        "reliability-gate.evaluated",
        record,
        {
          status,
          allowed: decision.allowed,
          reasons: decision.reasons,
        }
      );

      await this.recordAudit(
        "reliability-gate.evaluate",
        record.id,
        "SUCCESS",
        {
          actorId: context.actorId,
          status,
        }
      );

      return record;
    } catch (error) {
      record.status = "FAILED";
      record.updatedAt = this.now();

      await this.requireStore().save(record);

      await this.recordAudit(
        "reliability-gate.evaluate",
        record.id,
        "FAILED",
        {
          actorId: context.actorId,
          error:
            this.errorMessage(error),
        }
      );

      throw error;
    } finally {
      this.release(record.id);
    }
  }

  async getRecord(
    recordId: string,
    context: SovereignReliabilityGateContext
  ): Promise<SovereignReliabilityGateRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(recordId);

    await this.requireAuthorized(
      context,
      "READ_RELIABILITY_GATE",
      record.id,
      record.serviceId,
      record.criticality
    );

    return record;
  }

  async listRecords(
    context: SovereignReliabilityGateContext,
    limit = 100
  ): Promise<SovereignReliabilityGateRecord[]> {
    this.requireContext(context);

    await this.requireAuthorized(
      context,
      "READ_RELIABILITY_GATE"
    );

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000
    ) {
      throw new Error(
        "Reliability gate limit must be between 1 and 1000."
      );
    }

    return this.requireStore().list(limit);
  }

  async archive(
    recordId: string,
    context: SovereignReliabilityGateContext
  ): Promise<SovereignReliabilityGateRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(recordId);

    await this.requireAuthorized(
      context,
      "ARCHIVE_RELIABILITY_GATE",
      record.id,
      record.serviceId,
      record.criticality
    );

    if (record.status === "EVALUATING") {
      throw new Error(
        "Active reliability evaluation cannot be archived."
      );
    }

    record.status = "ARCHIVED";
    record.archivedAt = this.now();
    record.updatedAt = this.now();

    await this.requireStore().save(record);

    await this.publish(
      "reliability-gate.archived",
      record,
      {
        actorId: context.actorId,
      }
    );

    return record;
  }

  private validateEvidence(
    evidence: SovereignReliabilityEvidence
  ): void {
    this.validatePercent(
      evidence.errorBudgetRemainingPercent
    );

    if (
      !Number.isFinite(
        evidence.burnRate
      ) ||
      evidence.burnRate < 0
    ) {
      throw new Error(
        "Reliability evidence burnRate is invalid."
      );
    }

    const measured =
      new Date(
        evidence.measuredAt
      ).getTime();

    if (Number.isNaN(measured)) {
      throw new Error(
        "Reliability evidence measuredAt is invalid."
      );
    }

    if (measured > Date.now()) {
      throw new Error(
        "Reliability evidence cannot originate in the future."
      );
    }
  }

  private validatePercent(
    value: number
  ): void {
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      value > 100
    ) {
      throw new Error(
        "Percentage must be between 0 and 100."
      );
    }
  }

  private acquire(
    recordId: string
  ): void {
    if (this.processing.has(recordId)) {
      throw new Error(
        "Reliability evaluation is already running."
      );
    }

    this.processing.add(recordId);
  }

  private release(
    recordId: string
  ): void {
    this.processing.delete(recordId);
  }

  private async requireAuthorized(
    context: SovereignReliabilityGateContext,
    operation:
      | "REGISTER_RELIABILITY_GATE"
      | "EVALUATE_RELIABILITY_GATE"
      | "READ_RELIABILITY_GATE"
      | "ARCHIVE_RELIABILITY_GATE",
    recordId?: string,
    serviceId?: string,
    criticality?:
      SovereignReliabilityCriticality
  ): Promise<void> {
    const result =
      await this.requirePolicyBridge()
        .authorize({
          actorId: context.actorId,
          authority: context.authority,
          operation,
          recordId,
          serviceId,
          criticality,
        });

    if (!result.allowed) {
      await this.recordAudit(
        `reliability-gate.${operation.toLowerCase()}`,
        recordId,
        "DENIED",
        {
          actorId: context.actorId,
          reason: result.reason,
        }
      );

      throw new Error(
        result.reason ??
          `Reliability gate operation denied: ${operation}`
      );
    }
  }

  private requireContext(
    context: SovereignReliabilityGateContext
  ): void {
    if (!context.authenticated) {
      throw new Error(
        "Reliability gate requires authentication."
      );
    }

    if (!context.policyChecked) {
      throw new Error(
        "Reliability gate requires policy verification."
      );
    }

    if (!context.securityChecked) {
      throw new Error(
        "Reliability gate requires security verification."
      );
    }

    if (!context.authorizationChecked) {
      throw new Error(
        "Reliability gate requires authorization verification."
      );
    }
  }

  private requireStore():
    SovereignReliabilityGateStore {
    if (!this.store) {
      throw new Error(
        "Sovereign reliability gate store is not configured."
      );
    }

    return this.store;
  }

  private requireEvidenceBridge():
    SovereignReliabilityEvidenceBridge {
    if (!this.evidenceBridge) {
      throw new Error(
        "Sovereign reliability evidence bridge is not configured."
      );
    }

    return this.evidenceBridge;
  }

  private requirePolicyBridge():
    SovereignReliabilityPolicyBridge {
    if (!this.policyBridge) {
      throw new Error(
        "Sovereign reliability policy bridge is not configured."
      );
    }

    return this.policyBridge;
  }

  private async requireRecord(
    recordId: string
  ): Promise<SovereignReliabilityGateRecord> {
    const record =
      await this.requireStore().get(
        recordId
      );

    if (!record) {
      throw new Error(
        `Reliability gate not found: ${recordId}`
      );
    }

    return record;
  }

  private async publish(
    type: string,
    record: SovereignReliabilityGateRecord,
    payload: Record<string, unknown>
  ): Promise<void> {
    if (!this.eventBridge) {
      return;
    }

    await this.eventBridge.publish({
      id:
        this.createId(
          "RELIABILITY-GATE-EVENT"
        ),

      type,

      source: this.id,

      recordId: record.id,
      serviceId: record.serviceId,

      timestamp: this.now(),

      correlationId:
        record.correlationId,

      payload,
    });
  }

  private async recordAudit(
    operation: string,
    subjectId: string | undefined,
    result:
      | "SUCCESS"
      | "FAILED"
      | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.audit) {
      return;
    }

    await this.audit.record(
      operation,
      subjectId,
      result,
      metadata
    );
  }

  private errorMessage(
    error: unknown
  ): string {
    return error instanceof Error
      ? error.message
      : String(error);
  }

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${randomUUID()}`;
  }

  private now(): string {
    return new Date().toISOString();
  }
}

export function createSovereignReliabilityGate():
  SovereignReliabilityGate {
  return new SovereignReliabilityGate();
}

export const SOVEREIGN_RELIABILITY_GATE_CONTRACT = {
  id:
    "SOVEREIGN-RELIABILITY-GATE-97",

  role:
    "CENTRAL_SOVEREIGN_RELIABILITY_GATE",

  authority:
    "NONE",

  ownerAuthority:
    "SUPREME",

  stewardAuthority:
    "DELEGATED",

  sloIntegrated:
    true,

  sliIntegrated:
    true,

  errorBudgetIntegrated:
    true,

  burnRateIntegrated:
    true,

  burnRateControllerIntegrated:
    true,

  securityEvidenceRequired:
    true,

  dependencyEvidenceRequired:
    true,

  falseHealthyStateBlocked:
    true,

  unsafeOperationsRestricted:
    true,

  automaticPrivilegeElevation:
    false,

  gateCanCreateAuthority:
    false,

  gateCanOverrideOwner:
    false,

  stewardCanOverrideOwner:
    false,

  externalReliabilitySaaSRequired:
    false,

  status:
    "FOUNDATION",
} as const;

/* ============================================================
 * END OF SOVEREIGN-RELIABILITY-GATE-97
 * ============================================================
 */

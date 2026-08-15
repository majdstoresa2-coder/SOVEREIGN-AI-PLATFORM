/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-CHANGE-GATE-98
 * ============================================================
 *
 * Sovereign Change Gate.
 *
 * Responsibilities:
 * - Govern operational change admission.
 * - Evaluate reliability evidence before change execution.
 * - Block unsafe production changes.
 * - Classify change risk.
 * - Preserve OWNER supremacy.
 *
 * CHANGE GATE IS NOT AUTHORITY.
 * CHANGE GATE DOES NOT OVERRIDE OWNER.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignChangeGateStatus =
  | "REGISTERED"
  | "EVALUATING"
  | "APPROVED"
  | "RESTRICTED"
  | "BLOCKED"
  | "FAILED"
  | "ARCHIVED";

export type SovereignChangeRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignChangeType =
  | "CONFIGURATION"
  | "APPLICATION"
  | "DATABASE"
  | "INFRASTRUCTURE"
  | "SECURITY"
  | "NETWORK"
  | "RUNTIME"
  | "EMERGENCY";

export interface SovereignChangeEvidence {
  reliabilityGateOpen: boolean;

  securityHealthy: boolean;

  dependenciesHealthy: boolean;

  rollbackAvailable: boolean;

  backupVerified: boolean;

  errorBudgetRemainingPercent: number;

  burnRate: number;

  activeIncident: boolean;

  measuredAt: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignChangeDecision {
  allowed: boolean;

  status:
    | "APPROVED"
    | "RESTRICTED"
    | "BLOCKED";

  reasons: string[];

  evaluatedAt: string;
}

export interface SovereignChangeGateRecord {
  id: string;

  serviceId: string;

  changeId: string;

  changeType: SovereignChangeType;

  risk: SovereignChangeRisk;

  status: SovereignChangeGateStatus;

  reliabilityGateId?: string;

  requestedBy: string;

  evidence?: SovereignChangeEvidence;

  decision?: SovereignChangeDecision;

  correlationId?: string;

  causationId?: string;

  createdAt: string;

  updatedAt: string;

  evaluatedAt?: string;

  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignChangeGateContext {
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

export interface SovereignChangeGateStore {
  save(
    record: SovereignChangeGateRecord
  ): Promise<void>;

  get(
    recordId: string
  ): Promise<
    SovereignChangeGateRecord | undefined
  >;

  list(
    limit?: number
  ): Promise<SovereignChangeGateRecord[]>;
}

export interface SovereignChangeEvidenceBridge {
  collect(input: {
    recordId: string;

    serviceId: string;

    changeId: string;

    reliabilityGateId?: string;

    context: SovereignChangeGateContext;
  }): Promise<SovereignChangeEvidence>;
}

export interface SovereignChangeGatePolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignChangeGateContext["authority"];

    operation:
      | "REGISTER_CHANGE"
      | "EVALUATE_CHANGE"
      | "READ_CHANGE"
      | "ARCHIVE_CHANGE";

    recordId?: string;

    serviceId?: string;

    risk?: SovereignChangeRisk;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

export interface SovereignChangeGateEventBridge {
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

export interface SovereignChangeGateAudit {
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

export class SovereignChangeGate {
  public readonly id =
    "SOVEREIGN-CHANGE-GATE-98";

  public readonly version =
    "1.0.0";

  private store?:
    SovereignChangeGateStore;

  private evidenceBridge?:
    SovereignChangeEvidenceBridge;

  private policyBridge?:
    SovereignChangeGatePolicyBridge;

  private eventBridge?:
    SovereignChangeGateEventBridge;

  private audit?:
    SovereignChangeGateAudit;

  private processing =
    new Set<string>();

  setStore(
    store: SovereignChangeGateStore
  ): void {
    this.store = store;
  }

  setEvidenceBridge(
    bridge: SovereignChangeEvidenceBridge
  ): void {
    this.evidenceBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignChangeGatePolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignChangeGateEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignChangeGateAudit
  ): void {
    this.audit = audit;
  }

  async register(
    input: {
      id?: string;

      serviceId: string;

      changeId: string;

      changeType: SovereignChangeType;

      risk: SovereignChangeRisk;

      reliabilityGateId?: string;

      correlationId?: string;

      causationId?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignChangeGateContext
  ): Promise<SovereignChangeGateRecord> {
    this.requireContext(context);

    if (!input.serviceId.trim()) {
      throw new Error(
        "Change gate serviceId is required."
      );
    }

    if (!input.changeId.trim()) {
      throw new Error(
        "Change gate changeId is required."
      );
    }

    const recordId =
      input.id ??
      this.createId("CHANGE-GATE");

    await this.requireAuthorized(
      context,
      "REGISTER_CHANGE",
      recordId,
      input.serviceId,
      input.risk
    );

    const now = this.now();

    const record:
      SovereignChangeGateRecord = {
      id: recordId,

      serviceId:
        input.serviceId,

      changeId:
        input.changeId,

      changeType:
        input.changeType,

      risk:
        input.risk,

      status:
        "REGISTERED",

      reliabilityGateId:
        input.reliabilityGateId,

      requestedBy:
        context.actorId,

      correlationId:
        input.correlationId ??
        context.correlationId,

      causationId:
        input.causationId,

      createdAt:
        now,

      updatedAt:
        now,

      metadata:
        input.metadata,
    };

    await this.requireStore()
      .save(record);

    await this.publish(
      "change-gate.registered",
      record,
      {
        changeId:
          record.changeId,

        changeType:
          record.changeType,

        risk:
          record.risk,
      }
    );

    await this.recordAudit(
      "change-gate.register",
      record.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,
      }
    );

    return record;
  }

  async evaluate(
    recordId: string,
    context: SovereignChangeGateContext
  ): Promise<SovereignChangeGateRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "EVALUATE_CHANGE",
      record.id,
      record.serviceId,
      record.risk
    );

    if (
      record.status === "ARCHIVED"
    ) {
      throw new Error(
        "Archived change cannot be evaluated."
      );
    }

    this.acquire(
      record.id
    );

    record.status =
      "EVALUATING";

    record.updatedAt =
      this.now();

    await this.requireStore()
      .save(record);

    try {
      const evidence =
        await this.requireEvidenceBridge()
          .collect({
            recordId:
              record.id,

            serviceId:
              record.serviceId,

            changeId:
              record.changeId,

            reliabilityGateId:
              record.reliabilityGateId,

            context,
          });

      this.validateEvidence(
        evidence
      );

      const reasons:
        string[] = [];

      let status:
        SovereignChangeDecision["status"] =
          "APPROVED";

      if (
        !evidence.securityHealthy
      ) {
        reasons.push(
          "SECURITY_NOT_HEALTHY"
        );

        status =
          "BLOCKED";
      }

      if (
        evidence.activeIncident
      ) {
        reasons.push(
          "ACTIVE_INCIDENT"
        );

        status =
          "BLOCKED";
      }

      if (
        !evidence.reliabilityGateOpen
      ) {
        reasons.push(
          "RELIABILITY_GATE_NOT_OPEN"
        );

        if (
          status !== "BLOCKED"
        ) {
          status =
            "RESTRICTED";
        }
      }

      if (
        !evidence.dependenciesHealthy
      ) {
        reasons.push(
          "DEPENDENCIES_NOT_HEALTHY"
        );

        if (
          status !== "BLOCKED"
        ) {
          status =
            "RESTRICTED";
        }
      }

      if (
        !evidence.rollbackAvailable
      ) {
        reasons.push(
          "ROLLBACK_NOT_AVAILABLE"
        );

        if (
          record.risk === "HIGH" ||
          record.risk === "CRITICAL"
        ) {
          status =
            "BLOCKED";
        } else if (
          status !== "BLOCKED"
        ) {
          status =
            "RESTRICTED";
        }
      }

      if (
        (
          record.changeType ===
            "DATABASE" ||
          record.changeType ===
            "INFRASTRUCTURE"
        ) &&
        !evidence.backupVerified
      ) {
        reasons.push(
          "BACKUP_NOT_VERIFIED"
        );

        status =
          "BLOCKED";
      }

      if (
        evidence.errorBudgetRemainingPercent <=
        0
      ) {
        reasons.push(
          "ERROR_BUDGET_EXHAUSTED"
        );

        status =
          "BLOCKED";
      } else if (
        evidence.errorBudgetRemainingPercent <
        10
      ) {
        reasons.push(
          "ERROR_BUDGET_LOW"
        );

        if (
          status !== "BLOCKED"
        ) {
          status =
            "RESTRICTED";
        }
      }

      if (
        evidence.burnRate > 1
      ) {
        reasons.push(
          "UNSAFE_BURN_RATE"
        );

        if (
          record.risk ===
          "CRITICAL"
        ) {
          status =
            "BLOCKED";
        } else if (
          status !== "BLOCKED"
        ) {
          status =
            "RESTRICTED";
        }
      }

      if (
        record.risk ===
          "CRITICAL" &&
        !evidence.rollbackAvailable
      ) {
        reasons.push(
          "CRITICAL_CHANGE_WITHOUT_ROLLBACK"
        );

        status =
          "BLOCKED";
      }

      const decision:
        SovereignChangeDecision = {
        allowed:
          status === "APPROVED",

        status,

        reasons:
          [
            ...new Set(
              reasons
            ),
          ],

        evaluatedAt:
          this.now(),
      };

      record.evidence =
        evidence;

      record.decision =
        decision;

      record.status =
        status;

      record.evaluatedAt =
        this.now();

      record.updatedAt =
        this.now();

      await this.requireStore()
        .save(record);

      await this.publish(
        "change-gate.evaluated",
        record,
        {
          status:
            decision.status,

          allowed:
            decision.allowed,

          reasons:
            decision.reasons,
        }
      );

      await this.recordAudit(
        "change-gate.evaluate",
        record.id,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          status:
            decision.status,
        }
      );

      return record;
    } catch (error) {
      record.status =
        "FAILED";

      record.updatedAt =
        this.now();

      await this.requireStore()
        .save(record);

      await this.recordAudit(
        "change-gate.evaluate",
        record.id,
        "FAILED",
        {
          actorId:
            context.actorId,

          error:
            this.errorMessage(
              error
            ),
        }
      );

      throw error;
    } finally {
      this.release(
        record.id
      );
    }
  }

  async getRecord(
    recordId: string,
    context: SovereignChangeGateContext
  ): Promise<SovereignChangeGateRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "READ_CHANGE",
      record.id,
      record.serviceId,
      record.risk
    );

    return record;
  }

  async listRecords(
    context: SovereignChangeGateContext,
    limit = 100
  ): Promise<SovereignChangeGateRecord[]> {
    this.requireContext(context);

    await this.requireAuthorized(
      context,
      "READ_CHANGE"
    );

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000
    ) {
      throw new Error(
        "Change gate limit must be between 1 and 1000."
      );
    }

    return this.requireStore()
      .list(limit);
  }

  async archive(
    recordId: string,
    context: SovereignChangeGateContext
  ): Promise<SovereignChangeGateRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "ARCHIVE_CHANGE",
      record.id,
      record.serviceId,
      record.risk
    );

    if (
      record.status ===
      "EVALUATING"
    ) {
      throw new Error(
        "Active change evaluation cannot be archived."
      );
    }

    record.status =
      "ARCHIVED";

    record.archivedAt =
      this.now();

    record.updatedAt =
      this.now();

    await this.requireStore()
      .save(record);

    await this.publish(
      "change-gate.archived",
      record,
      {
        actorId:
          context.actorId,
      }
    );

    return record;
  }

  private validateEvidence(
    evidence:
      SovereignChangeEvidence
  ): void {
    if (
      !Number.isFinite(
        evidence.errorBudgetRemainingPercent
      ) ||
      evidence.errorBudgetRemainingPercent <
        0 ||
      evidence.errorBudgetRemainingPercent >
        100
    ) {
      throw new Error(
        "Invalid error-budget percentage."
      );
    }

    if (
      !Number.isFinite(
        evidence.burnRate
      ) ||
      evidence.burnRate < 0
    ) {
      throw new Error(
        "Invalid burn rate."
      );
    }

    const measuredAt =
      new Date(
        evidence.measuredAt
      ).getTime();

    if (
      Number.isNaN(
        measuredAt
      )
    ) {
      throw new Error(
        "Invalid evidence timestamp."
      );
    }

    if (
      measuredAt >
      Date.now()
    ) {
      throw new Error(
        "Evidence cannot originate in the future."
      );
    }
  }

  private acquire(
    recordId: string
  ): void {
    if (
      this.processing.has(
        recordId
      )
    ) {
      throw new Error(
        "Change evaluation is already running."
      );
    }

    this.processing.add(
      recordId
    );
  }

  private release(
    recordId: string
  ): void {
    this.processing.delete(
      recordId
    );
  }

  private async requireAuthorized(
    context:
      SovereignChangeGateContext,
    operation:
      | "REGISTER_CHANGE"
      | "EVALUATE_CHANGE"
      | "READ_CHANGE"
      | "ARCHIVE_CHANGE",
    recordId?: string,
    serviceId?: string,
    risk?: SovereignChangeRisk
  ): Promise<void> {
    const result =
      await this.requirePolicyBridge()
        .authorize({
          actorId:
            context.actorId,

          authority:
            context.authority,

          operation,

          recordId,

          serviceId,

          risk,
        });

    if (
      !result.allowed
    ) {
      await this.recordAudit(
        `change-gate.${operation.toLowerCase()}`,
        recordId,
        "DENIED",
        {
          actorId:
            context.actorId,

          reason:
            result.reason,
        }
      );

      throw new Error(
        result.reason ??
        `Change gate operation denied: ${operation}`
      );
    }
  }

  private requireContext(
    context:
      SovereignChangeGateContext
  ): void {
    if (
      !context.authenticated
    ) {
      throw new Error(
        "Change gate requires authentication."
      );
    }

    if (
      !context.policyChecked
    ) {
      throw new Error(
        "Change gate requires policy verification."
      );
    }

    if (
      !context.securityChecked
    ) {
      throw new Error(
        "Change gate requires security verification."
      );
    }

    if (
      !context.authorizationChecked
    ) {
      throw new Error(
        "Change gate requires authorization verification."
      );
    }
  }

  private requireStore():
    SovereignChangeGateStore {
    if (!this.store) {
      throw new Error(
        "Sovereign change gate store is not configured."
      );
    }

    return this.store;
  }

  private requireEvidenceBridge():
    SovereignChangeEvidenceBridge {
    if (
      !this.evidenceBridge
    ) {
      throw new Error(
        "Sovereign change evidence bridge is not configured."
      );
    }

    return this.evidenceBridge;
  }

  private requirePolicyBridge():
    SovereignChangeGatePolicyBridge {
    if (
      !this.policyBridge
    ) {
      throw new Error(
        "Sovereign change gate policy bridge is not configured."
      );
    }

    return this.policyBridge;
  }

  private async requireRecord(
    recordId: string
  ): Promise<SovereignChangeGateRecord> {
    const record =
      await this.requireStore()
        .get(recordId);

    if (!record) {
      throw new Error(
        `Change gate record not found: ${recordId}`
      );
    }

    return record;
  }

  private async publish(
    type: string,
    record:
      SovereignChangeGateRecord,
    payload:
      Record<string, unknown>
  ): Promise<void> {
    if (
      !this.eventBridge
    ) {
      return;
    }

    await this.eventBridge.publish({
      id:
        this.createId(
          "CHANGE-GATE-EVENT"
        ),

      type,

      source:
        this.id,

      recordId:
        record.id,

      serviceId:
        record.serviceId,

      timestamp:
        this.now(),

      correlationId:
        record.correlationId,

      payload,
    });
  }

  private async recordAudit(
    operation: string,
    subjectId:
      string | undefined,
    result:
      | "SUCCESS"
      | "FAILED"
      | "DENIED",
    metadata?:
      Record<string, unknown>
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

export function createSovereignChangeGate():
  SovereignChangeGate {
  return new SovereignChangeGate();
}

export const SOVEREIGN_CHANGE_GATE_CONTRACT = {
  id:
    "SOVEREIGN-CHANGE-GATE-98",

  role:
    "CENTRAL_SOVEREIGN_CHANGE_GATE",

  authority:
    "NONE",

  ownerAuthority:
    "SUPREME",

  stewardAuthority:
    "DELEGATED",

  reliabilityGateIntegrated:
    true,

  sloIntegrated:
    true,

  sliIntegrated:
    true,

  errorBudgetIntegrated:
    true,

  burnRateIntegrated:
    true,

  rollbackVerification:
    true,

  backupVerification:
    true,

  securityEvidenceRequired:
    true,

  incidentAwareness:
    true,

  unsafeChangeBlocking:
    true,

  criticalChangeProtection:
    true,

  autom

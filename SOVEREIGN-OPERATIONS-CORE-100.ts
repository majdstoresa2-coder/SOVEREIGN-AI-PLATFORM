/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-OPERATIONS-CORE-100
 * ============================================================
 *
 * Central Sovereign Operations Core.
 *
 * Responsibilities:
 * - Coordinate sovereign operational gates.
 * - Aggregate reliability, change and deployment state.
 * - Prevent unsafe operational execution.
 * - Preserve evidence and auditability.
 * - Maintain strict authority boundaries.
 *
 * THIS CORE IS NOT AUTHORITY.
 * THIS CORE DOES NOT GRANT PRIVILEGES.
 * THIS CORE DOES NOT OVERRIDE OWNER.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignOperationsStatus =
  | "REGISTERED"
  | "EVALUATING"
  | "READY"
  | "RESTRICTED"
  | "BLOCKED"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED"
  | "PAUSED"
  | "ARCHIVED";

export type SovereignOperationsCriticality =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignOperationsAction =
  | "OBSERVE"
  | "CHANGE"
  | "DEPLOY"
  | "ROLLBACK"
  | "RECOVER"
  | "MAINTENANCE";

export interface SovereignOperationsEvidence {
  reliabilityGateOpen: boolean;

  changeGateApproved: boolean;

  deploymentGateApproved: boolean;

  securityHealthy: boolean;

  dependenciesHealthy: boolean;

  monitoringHealthy: boolean;

  diagnosticsHealthy: boolean;

  backupVerified: boolean;

  rollbackAvailable: boolean;

  replicationHealthy: boolean;

  activeIncident: boolean;

  measuredAt: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignOperationsDecision {
  allowed: boolean;

  status:
    | "READY"
    | "RESTRICTED"
    | "BLOCKED";

  reasons: string[];

  evaluatedAt: string;
}

export interface SovereignOperationsRecord {
  id: string;

  serviceId: string;

  operationId: string;

  action: SovereignOperationsAction;

  criticality:
    SovereignOperationsCriticality;

  status:
    SovereignOperationsStatus;

  reliabilityGateId?: string;

  changeGateId?: string;

  deploymentGateId?: string;

  evidence?: SovereignOperationsEvidence;

  decision?: SovereignOperationsDecision;

  requestedBy: string;

  evaluatedBy?: string;

  executedBy?: string;

  correlationId?: string;

  causationId?: string;

  createdAt: string;

  updatedAt: string;

  evaluatedAt?: string;

  executedAt?: string;

  completedAt?: string;

  pausedAt?: string;

  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignOperationsContext {
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

export interface SovereignOperationsStore {
  save(
    record: SovereignOperationsRecord
  ): Promise<void>;

  get(
    recordId: string
  ): Promise<
    SovereignOperationsRecord | undefined
  >;

  list(
    limit?: number
  ): Promise<SovereignOperationsRecord[]>;
}

export interface SovereignOperationsEvidenceBridge {
  collect(input: {
    recordId: string;

    serviceId: string;

    operationId: string;

    action: SovereignOperationsAction;

    reliabilityGateId?: string;

    changeGateId?: string;

    deploymentGateId?: string;

    context: SovereignOperationsContext;
  }): Promise<SovereignOperationsEvidence>;
}

export interface SovereignOperationsExecutionBridge {
  execute(input: {
    recordId: string;

    serviceId: string;

    operationId: string;

    action: SovereignOperationsAction;

    context: SovereignOperationsContext;
  }): Promise<{
    accepted: boolean;

    executionId?: string;

    reason?: string;
  }>;
}

export interface SovereignOperationsPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignOperationsContext["authority"];

    operation:
      | "REGISTER_OPERATION"
      | "EVALUATE_OPERATION"
      | "EXECUTE_OPERATION"
      | "READ_OPERATION"
      | "PAUSE_OPERATION"
      | "ARCHIVE_OPERATION";

    recordId?: string;

    serviceId?: string;

    action?: SovereignOperationsAction;

    criticality?:
      SovereignOperationsCriticality;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

export interface SovereignOperationsEventBridge {
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

export interface SovereignOperationsAudit {
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

export class SovereignOperationsCore {
  public readonly id =
    "SOVEREIGN-OPERATIONS-CORE-100";

  public readonly version = "1.0.0";

  private store?: SovereignOperationsStore;

  private evidenceBridge?:
    SovereignOperationsEvidenceBridge;

  private executionBridge?:
    SovereignOperationsExecutionBridge;

  private policyBridge?:
    SovereignOperationsPolicyBridge;

  private eventBridge?:
    SovereignOperationsEventBridge;

  private audit?: SovereignOperationsAudit;

  private processing = new Set<string>();

  setStore(
    store: SovereignOperationsStore
  ): void {
    this.store = store;
  }

  setEvidenceBridge(
    bridge: SovereignOperationsEvidenceBridge
  ): void {
    this.evidenceBridge = bridge;
  }

  setExecutionBridge(
    bridge: SovereignOperationsExecutionBridge
  ): void {
    this.executionBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignOperationsPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignOperationsEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignOperationsAudit
  ): void {
    this.audit = audit;
  }

  async register(
    input: {
      id?: string;

      serviceId: string;

      operationId: string;

      action: SovereignOperationsAction;

      criticality:
        SovereignOperationsCriticality;

      reliabilityGateId?: string;

      changeGateId?: string;

      deploymentGateId?: string;

      correlationId?: string;

      causationId?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignOperationsContext
  ): Promise<SovereignOperationsRecord> {
    this.requireContext(context);

    if (!input.serviceId.trim()) {
      throw new Error(
        "Operations serviceId is required."
      );
    }

    if (!input.operationId.trim()) {
      throw new Error(
        "Operations operationId is required."
      );
    }

    const recordId =
      input.id ??
      this.createId(
        "SOVEREIGN-OPERATION"
      );

    await this.requireAuthorized(
      context,
      "REGISTER_OPERATION",
      recordId,
      input.serviceId,
      input.action,
      input.criticality
    );

    const now = this.now();

    const record: SovereignOperationsRecord = {
      id: recordId,

      serviceId: input.serviceId,

      operationId: input.operationId,

      action: input.action,

      criticality: input.criticality,

      status: "REGISTERED",

      reliabilityGateId:
        input.reliabilityGateId,

      changeGateId:
        input.changeGateId,

      deploymentGateId:
        input.deploymentGateId,

      requestedBy:
        context.actorId,

      correlationId:
        input.correlationId ??
        context.correlationId,

      causationId:
        input.causationId,

      createdAt: now,

      updatedAt: now,

      metadata:
        input.metadata,
    };

    await this.requireStore()
      .save(record);

    await this.publish(
      "operations.registered",
      record,
      {
        action:
          record.action,

        criticality:
          record.criticality,
      }
    );

    await this.recordAudit(
      "operations.register",
      record.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,

        serviceId:
          record.serviceId,
      }
    );

    return record;
  }

  async evaluate(
    recordId: string,
    context: SovereignOperationsContext
  ): Promise<SovereignOperationsRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "EVALUATE_OPERATION",
      record.id,
      record.serviceId,
      record.action,
      record.criticality
    );

    if (
      record.status === "ARCHIVED"
    ) {
      throw new Error(
        "Archived operation cannot be evaluated."
      );
    }

    if (
      record.status === "PAUSED"
    ) {
      throw new Error(
        "Paused operation cannot be evaluated."
      );
    }

    this.acquire(record.id);

    record.status = "EVALUATING";
    record.updatedAt = this.now();

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

            operationId:
              record.operationId,

            action:
              record.action,

            reliabilityGateId:
              record.reliabilityGateId,

            changeGateId:
              record.changeGateId,

            deploymentGateId:
              record.deploymentGateId,

            context,
          });

      this.validateEvidence(
        evidence
      );

      const reasons: string[] = [];

      let status:
        SovereignOperationsDecision["status"] =
          "READY";

      if (!evidence.securityHealthy) {
        reasons.push(
          "SECURITY_NOT_HEALTHY"
        );

        status = "BLOCKED";
      }

      if (evidence.activeIncident) {
        reasons.push(
          "ACTIVE_INCIDENT"
        );

        if (
          record.action === "DEPLOY" ||
          record.action === "CHANGE"
        ) {
          status = "BLOCKED";
        }
      }

      if (
        !evidence.reliabilityGateOpen
      ) {
        reasons.push(
          "RELIABILITY_GATE_NOT_OPEN"
        );

        if (
          record.action === "DEPLOY"
        ) {
          status = "BLOCKED";
        } else if (
          status !== "BLOCKED"
        ) {
          status = "RESTRICTED";
        }
      }

      if (
        record.action === "CHANGE" &&
        !evidence.changeGateApproved
      ) {
        reasons.push(
          "CHANGE_GATE_NOT_APPROVED"
        );

        status = "BLOCKED";
      }

      if (
        record.action === "DEPLOY" &&
        !evidence.deploymentGateApproved
      ) {
        reasons.push(
          "DEPLOYMENT_GATE_NOT_APPROVED"
        );

        status = "BLOCKED";
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
          status = "RESTRICTED";
        }
      }

      if (
        !evidence.monitoringHealthy
      ) {
        reasons.push(
          "MONITORING_NOT_HEALTHY"
        );

        if (
          record.criticality === "CRITICAL"
        ) {
          status = "BLOCKED";
        } else if (
          status !== "BLOCKED"
        ) {
          status = "RESTRICTED";
        }
      }

      if (
        !evidence.diagnosticsHealthy
      ) {
        reasons.push(
          "DIAGNOSTICS_NOT_HEALTHY"
        );

        if (
          status !== "BLOCKED"
        ) {
          status = "RESTRICTED";
        }
      }

      if (
        !evidence.replicationHealthy
      ) {
        reasons.push(
          "REPLICATION_NOT_HEALTHY"
        );

        if (
          record.criticality === "CRITICAL"
        ) {
          status = "BLOCKED";
        } else if (
          status !== "BLOCKED"
        ) {
          status = "RESTRICTED";
        }
      }

      if (
        (
          record.action === "DEPLOY" ||
          record.action === "CHANGE"
        ) &&
        !evidence.rollbackAvailable
      ) {
        reasons.push(
          "ROLLBACK_NOT_AVAILABLE"
        );

        if (
          record.criticality === "HIGH" ||
          record.criticality === "CRITICAL"
        ) {
          status = "BLOCKED";
        } else if (
          status !== "BLOCKED"
        ) {
          status = "RESTRICTED";
        }
      }

      if (
        (
          record.action === "DEPLOY" ||
          record.action === "CHANGE"
        ) &&
        record.criticality === "CRITICAL" &&
        !evidence.backupVerified
      ) {
        reasons.push(
          "CRITICAL_OPERATION_BACKUP_NOT_VERIFIED"
        );

        status = "BLOCKED";
      }

      const decision:
        SovereignOperationsDecision = {
        allowed:
          status === "READY",

        status,

        reasons:
          [...new Set(reasons)],

        evaluatedAt:
          this.now(),
      };

      record.evidence =
        evidence;

      record.decision =
        decision;

      record.status =
        status;

      record.evaluatedBy =
        context.actorId;

      record.evaluatedAt =
        this.now();

      record.updatedAt =
        this.now();

      await this.requireStore()
        .save(record);

      await this.publish(
        "operations.evaluated",
        record,
        {
          allowed:
            decision.allowed,

          status:
            decision.status,

          reasons:
            decision.reasons,
        }
      );

      await this.recordAudit(
        "operations.evaluate",
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
      record.status = "FAILED";
      record.updatedAt = this.now();

      await this.requireStore()
        .save(record);

      await this.recordAudit(
        "operations.evaluate",
        record.id,
        "FAILED",
        {
          actorId:
            context.actorId,

          error:
            this.errorMessage(error),
        }
      );

      throw error;
    } finally {
      this.release(record.id);
    }
  }

  async execute(
    recordId: string,
    context: SovereignOperationsContext
  ): Promise<SovereignOperationsRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "EXECUTE_OPERATION",
      record.id,
      record.serviceId,
      record.action,
      record.criticality
    );

    if (
      !record.decision?.allowed ||
      record.status !== "READY"
    ) {
      throw new Error(
        "Sovereign operation is not ready for execution."
      );
    }

    this.acquire(record.id);

    try {
      record.status =
        "EXECUTING";

      record.executedBy =
        context.actorId;

      record.executedAt =
        this.now();

      record.updatedAt =
        this.now();

      await this.requireStore()
        .save(record);

      const result =
        await this.requireExecutionBridge()
          .execute({
            recordId:
              record.id,

            serviceId:
              record.serviceId,

            operationId:
              record.operationId,

            action:
              record.action,

            context,
          });

      if (!result.accepted) {
        throw new Error(
          result.reason ??
          "Sovereign operation execution rejected."
        );
      }

      record.status =
        "COMPLETED";

      record.completedAt =
        this.now();

      record.updatedAt =
        this.now();

      await this.requireStore()
        .save(record);

      await this.publish(
        "operations.completed",
        record,
        {
          executionId:
            result.executionId,

          action:
            record.action,
        }
      );

      await this.recordAudit(
        "operations.execute",
        record.id,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          executionId:
            result.executionId,
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
        "operations.execute",
        record.id,
        "FAILED",
        {
          actorId:
            context.actorId,

          error:
            this.errorMessage(error),
        }
      );

      throw error;
    } finally {
      this.release(record.id);
    }
  }

  async pause(
    recordId: string,
    context: SovereignOperationsContext
  ): Promise<SovereignOperationsRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "PAUSE_OPERATION",
      record.id,
      record.serviceId,
      record.action,
      record.criticality
    );

    if (
      record.status === "ARCHIVED"
    ) {
      throw new Error(
        "Archived operation cannot be paused."
      );
    }

    if (
      record.status === "EXECUTING"
    ) {
      throw new Error(
        "Executing operation cannot be paused."
      );
    }

    record.status =
      "PAUSED";

    record.pausedAt =
      this.now();

    record.updatedAt =
      this.now();

    await this.requireStore()
      .save(record);

    await this.publish(
      "operations.paused",
      record,
      {
        actorId:
          context.actorId,
      }
    );

    return record;
  }

  async getRecord(
    recordId: string,
    context: SovereignOperationsContext
  ): Promise<SovereignOperationsRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(recordId);

    await this.requireAuthorized(
      context,
      "READ_OPERATION",
      record.id,
      record.serviceId,
      record.action,
      record.criticality
    );

    return record;
  }

  async listRecords(
    context: SovereignOperationsContext,
    limit = 100
  ): Promise<SovereignOperationsRecord[]> {
    this.requireContext(context);

    await this.requireAuthorized(
      context,
      "READ_OPERATION"
    );

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000
    ) {
      throw new Error(
        "Operations limit must be between 1 and 1000."
      );
    }

    return this.requireStore()
      .list(limit);
  }

  async archive(
    recordId: string,
    context: SovereignOperationsContext
  ): Promise<SovereignOperationsRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "ARCHIVE_OPERATION",
      record.id,
      record.serviceId,
      record.action,
      record.criticality
    );

    if (
      record.status === "EVALUATING" ||
      record.status === "EXECUTING"
    ) {
      throw new Error(
        "Active sovereign operation cannot be archived."
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
      "operations.archived",
      record,
      {
        actorId:
          context.actorId,
      }
    );

    return record;
  }

  private validateEvidence(
    evidence: SovereignOperationsEvidence
  ): void {
    const measured =
      new Date(
        evidence.me

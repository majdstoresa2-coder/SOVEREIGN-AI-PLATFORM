/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-DEPLOYMENT-GATE-99
 * ============================================================
 *
 * Sovereign Deployment Gate.
 *
 * Responsibilities:
 * - Govern deployment admission.
 * - Verify change-gate approval.
 * - Verify build and artifact integrity.
 * - Require rollback readiness.
 * - Block unsafe production deployment.
 * - Preserve sovereign deployment evidence.
 *
 * DEPLOYMENT GATE IS NOT AUTHORITY.
 * DEPLOYMENT GATE DOES NOT OVERRIDE OWNER.
 * DEPLOYMENT GATE DOES NOT GRANT PRIVILEGES.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignDeploymentGateStatus =
  | "REGISTERED"
  | "EVALUATING"
  | "APPROVED"
  | "RESTRICTED"
  | "BLOCKED"
  | "DEPLOYING"
  | "DEPLOYED"
  | "FAILED"
  | "ARCHIVED";

export type SovereignDeploymentEnvironment =
  | "DEVELOPMENT"
  | "TEST"
  | "STAGING"
  | "PRODUCTION";

export type SovereignDeploymentRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignDeploymentEvidence {
  changeGateApproved: boolean;

  reliabilityGateOpen: boolean;

  buildVerified: boolean;

  testsPassed: boolean;

  artifactVerified: boolean;

  artifactChecksum?: string;

  securityScanPassed: boolean;

  dependenciesHealthy: boolean;

  rollbackAvailable: boolean;

  backupVerified: boolean;

  activeIncident: boolean;

  measuredAt: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignDeploymentDecision {
  allowed: boolean;

  status:
    | "APPROVED"
    | "RESTRICTED"
    | "BLOCKED";

  reasons: string[];

  evaluatedAt: string;
}

export interface SovereignDeploymentGateRecord {
  id: string;

  serviceId: string;

  deploymentId: string;

  changeGateId: string;

  environment:
    SovereignDeploymentEnvironment;

  risk:
    SovereignDeploymentRisk;

  artifactId: string;

  expectedChecksum?: string;

  status:
    SovereignDeploymentGateStatus;

  evidence?:
    SovereignDeploymentEvidence;

  decision?:
    SovereignDeploymentDecision;

  requestedBy: string;

  evaluatedBy?: string;

  correlationId?: string;

  causationId?: string;

  createdAt: string;

  updatedAt: string;

  evaluatedAt?: string;

  deployedAt?: string;

  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignDeploymentGateContext {
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

export interface SovereignDeploymentGateStore {
  save(
    record: SovereignDeploymentGateRecord
  ): Promise<void>;

  get(
    recordId: string
  ): Promise<
    SovereignDeploymentGateRecord | undefined
  >;

  list(
    limit?: number
  ): Promise<SovereignDeploymentGateRecord[]>;
}

export interface SovereignDeploymentEvidenceBridge {
  collect(input: {
    recordId: string;

    serviceId: string;

    deploymentId: string;

    changeGateId: string;

    artifactId: string;

    environment:
      SovereignDeploymentEnvironment;

    context:
      SovereignDeploymentGateContext;
  }): Promise<SovereignDeploymentEvidence>;
}

export interface SovereignDeploymentExecutionBridge {
  deploy(input: {
    recordId: string;

    serviceId: string;

    deploymentId: string;

    artifactId: string;

    environment:
      SovereignDeploymentEnvironment;

    context:
      SovereignDeploymentGateContext;
  }): Promise<{
    accepted: boolean;

    operationId?: string;

    reason?: string;
  }>;
}

export interface SovereignDeploymentPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignDeploymentGateContext["authority"];

    operation:
      | "REGISTER_DEPLOYMENT"
      | "EVALUATE_DEPLOYMENT"
      | "EXECUTE_DEPLOYMENT"
      | "READ_DEPLOYMENT"
      | "ARCHIVE_DEPLOYMENT";

    recordId?: string;

    serviceId?: string;

    environment?:
      SovereignDeploymentEnvironment;

    risk?: SovereignDeploymentRisk;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

export interface SovereignDeploymentEventBridge {
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

export interface SovereignDeploymentAudit {
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

export class SovereignDeploymentGate {
  public readonly id =
    "SOVEREIGN-DEPLOYMENT-GATE-99";

  public readonly version =
    "1.0.0";

  private store?:
    SovereignDeploymentGateStore;

  private evidenceBridge?:
    SovereignDeploymentEvidenceBridge;

  private executionBridge?:
    SovereignDeploymentExecutionBridge;

  private policyBridge?:
    SovereignDeploymentPolicyBridge;

  private eventBridge?:
    SovereignDeploymentEventBridge;

  private audit?:
    SovereignDeploymentAudit;

  private processing =
    new Set<string>();

  setStore(
    store: SovereignDeploymentGateStore
  ): void {
    this.store = store;
  }

  setEvidenceBridge(
    bridge: SovereignDeploymentEvidenceBridge
  ): void {
    this.evidenceBridge = bridge;
  }

  setExecutionBridge(
    bridge: SovereignDeploymentExecutionBridge
  ): void {
    this.executionBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignDeploymentPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignDeploymentEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignDeploymentAudit
  ): void {
    this.audit = audit;
  }

  async register(
    input: {
      id?: string;

      serviceId: string;

      deploymentId: string;

      changeGateId: string;

      environment:
        SovereignDeploymentEnvironment;

      risk:
        SovereignDeploymentRisk;

      artifactId: string;

      expectedChecksum?: string;

      correlationId?: string;

      causationId?: string;

      metadata?: Record<string, unknown>;
    },
    context:
      SovereignDeploymentGateContext
  ): Promise<SovereignDeploymentGateRecord> {
    this.requireContext(context);

    if (!input.serviceId.trim()) {
      throw new Error(
        "Deployment serviceId is required."
      );
    }

    if (!input.deploymentId.trim()) {
      throw new Error(
        "deploymentId is required."
      );
    }

    if (!input.changeGateId.trim()) {
      throw new Error(
        "changeGateId is required."
      );
    }

    if (!input.artifactId.trim()) {
      throw new Error(
        "artifactId is required."
      );
    }

    const recordId =
      input.id ??
      this.createId(
        "DEPLOYMENT-GATE"
      );

    await this.requireAuthorized(
      context,
      "REGISTER_DEPLOYMENT",
      recordId,
      input.serviceId,
      input.environment,
      input.risk
    );

    const now = this.now();

    const record:
      SovereignDeploymentGateRecord = {
      id: recordId,

      serviceId:
        input.serviceId,

      deploymentId:
        input.deploymentId,

      changeGateId:
        input.changeGateId,

      environment:
        input.environment,

      risk:
        input.risk,

      artifactId:
        input.artifactId,

      expectedChecksum:
        input.expectedChecksum,

      status:
        "REGISTERED",

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
      "deployment-gate.registered",
      record,
      {
        environment:
          record.environment,

        risk:
          record.risk,

        artifactId:
          record.artifactId,
      }
    );

    return record;
  }

  async evaluate(
    recordId: string,
    context:
      SovereignDeploymentGateContext
  ): Promise<SovereignDeploymentGateRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "EVALUATE_DEPLOYMENT",
      record.id,
      record.serviceId,
      record.environment,
      record.risk
    );

    if (
      record.status === "ARCHIVED"
    ) {
      throw new Error(
        "Archived deployment cannot be evaluated."
      );
    }

    this.acquire(record.id);

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

            deploymentId:
              record.deploymentId,

            changeGateId:
              record.changeGateId,

            artifactId:
              record.artifactId,

            environment:
              record.environment,

            context,
          });

      this.validateEvidence(
        evidence
      );

      const reasons:
        string[] = [];

      let status:
        SovereignDeploymentDecision["status"] =
          "APPROVED";

      if (
        !evidence.changeGateApproved
      ) {
        reasons.push(
          "CHANGE_GATE_NOT_APPROVED"
        );

        status =
          "BLOCKED";
      }

      if (
        !evidence.securityScanPassed
      ) {
        reasons.push(
          "SECURITY_SCAN_FAILED"
        );

        status =
          "BLOCKED";
      }

      if (
        !evidence.buildVerified
      ) {
        reasons.push(
          "BUILD_NOT_VERIFIED"
        );

        status =
          "BLOCKED";
      }

      if (
        !evidence.testsPassed
      ) {
        reasons.push(
          "TESTS_NOT_PASSED"
        );

        status =
          "BLOCKED";
      }

      if (
        !evidence.artifactVerified
      ) {
        reasons.push(
          "ARTIFACT_NOT_VERIFIED"
        );

        status =
          "BLOCKED";
      }

      if (
        record.expectedChecksum &&
        evidence.artifactChecksum !==
          record.expectedChecksum
      ) {
        reasons.push(
          "ARTIFACT_CHECKSUM_MISMATCH"
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
        !evidence.reliabilityGateOpen
      ) {
        reasons.push(
          "RELIABILITY_GATE_NOT_OPEN"
        );

        if (
          record.environment ===
            "PRODUCTION"
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
        !evidence.rollbackAvailable
      ) {
        reasons.push(
          "ROLLBACK_NOT_AVAILABLE"
        );

        if (
          record.environment ===
            "PRODUCTION" ||
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
        record.environment ===
          "PRODUCTION" &&
        !evidence.backupVerified
      ) {
        reasons.push(
          "PRODUCTION_BACKUP_NOT_VERIFIED"
        );

        status =
          "BLOCKED";
      }

      const decision:
        SovereignDeploymentDecision = {
        allowed:
          status ===
          "APPROVED",

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
        "deployment-gate.evaluated",
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

      return record;
    } catch (error) {
      record.status =
        "FAILED";

      record.updatedAt =
        this.now();

      await this.requireStore()
        .save(record);

      await this.recordAudit(
        "deployment-gate.evaluate",
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
      this.release(record.id);
    }
  }

  async deploy(
    recordId: string,
    context:
      SovereignDeploymentGateContext
  ): Promise<SovereignDeploymentGateRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "EXECUTE_DEPLOYMENT",
      record.id,
      record.serviceId,
      record.environment,
      record.risk
    );

    if (
      !record.decision?.allowed ||
      record.status !== "APPROVED"
    ) {
      throw new Error(
        "Deployment is not approved."
      );
    }

    this.acquire(record.id);

    try {
      record.status =
        "DEPLOYING";

      record.updatedAt =
        this.now();

      await this.requireStore()
        .save(record);

      const result =
        await this.requireExecutionBridge()
          .deploy({
            recordId:
              record.id,

            serviceId:
              record.serviceId,

            deploymentId:
              record.deploymentId,

            artifactId:
              record.artifactId,

            environment:
              record.environment,

            context,
          });

      if (!result.accepted) {
        throw new Error(
          result.reason ??
          "Deployment execution rejected."
        );
      }

      record.status =
        "DEPLOYED";

      record.deployedAt =
        this.now();

      record.updatedAt =
        this.now();

      await this.requireStore()
        .save(record);

      await this.publish(
        "deployment-gate.deployed",
        record,
        {
          operationId:
            result.operationId,
        }
      );

      await this.recordAudit(
        "deployment-gate.deploy",
        record.id,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          operationId:
            result.operationId,
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
        "deployment-gate.deploy",
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
      this.release(record.id);
    }
  }

  async getRecord(
    recordId: string,
    context:
      SovereignDeploymentGateContext
  ): Promise<SovereignDeploymentGateRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "READ_DEPLOYMENT",
      record.id,
      record.serviceId,
      record.environment,
      record.risk
    );

    return record;
  }

  async listRecords(
    context:
      SovereignDeploymentGateContext,
    limit = 100
  ): Promise<SovereignDeploymentGateRecord[]> {
    this.requireContext(context);

    await this.requireAuthorized(
      context,
      "READ_DEPLOYMENT"
    );

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000
    ) {
      throw new Error(
        "Deployment limit must be between 1 and 1000."
      );
    }

    return this.requireStore()
      .list(limit);
  }

  async archive(
    recordId: string,
    context:
      SovereignDeploymentGateContext
  ): Promise<SovereignDeploymentGateRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "ARCHIVE_DEPLOYMENT",
      record.id,
      record.serviceId,
      record.environment,
      record.risk
    );

    if (
      record.status ===
        "EVALUATING" ||
      record.status ===
        "DEPLOYING"
    ) {
      throw new Error(
        "Active deployment cannot be archived."
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

    return record;
  }

  private validateEvidence(
    evidence:
      SovereignDeploymentEvidence
  ): void {
    const measured =
      new Date(
        evidence.measuredAt
      ).getTime();

    if (
      Number.isNaN(measured)
    ) {
      throw new Error(
        "Deployment evidence timestamp is invalid."
      );
    }

    if (
      measured > Date.now()
    ) {
      throw new Error(
        "Deployment evidence cannot originate in the future."
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
        "Deployment operation is already running."
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
      SovereignDeploymentGateContext,
    operation:
      | "REGISTER_DEPLOYMENT"
      | "EVALUATE_DEPLOYMENT"
      | "EXECUTE_DEPLOYMENT"
      | "READ_DEPLOYMENT"
      | "ARCHIVE_DEPLOYMENT",
    recordId?: string,
    serviceId?: string,
    environment?:
      SovereignDeploymentEnvironment,
    risk?:
      SovereignDeploymentRisk
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

          environment,

          risk,
        });

    if (!result.allowed) {
      await this.recordAudit(
        `deployment-gate.${operation.toLowerCase()}`,
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
        `Deployment operation denied: ${operation}`
      );
    }
  }

  private requireContext(
    context:
      SovereignDeploymentGateContext
  ): void {
    if (!context.authenticated) {
      throw new Error(
       

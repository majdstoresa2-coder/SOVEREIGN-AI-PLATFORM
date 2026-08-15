/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-SLA-90
 * ============================================================
 *
 * Sovereign Service Level Agreement Engine.
 *
 * Responsibilities:
 * - Define sovereign service-level objectives.
 * - Measure compliance against approved targets.
 * - Detect SLA violations.
 * - Track availability, reliability and latency objectives.
 * - Preserve SLA evidence and violation history.
 * - Prevent false compliance declarations.
 *
 * SLA ENGINE IS NOT AUTHORITY.
 * SLA ENGINE DOES NOT OVERRIDE OWNER.
 * SLA ENGINE DOES NOT GRANT PRIVILEGES.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignSLAStatus =
  | "REGISTERED"
  | "EVALUATING"
  | "COMPLIANT"
  | "AT_RISK"
  | "VIOLATED"
  | "FAILED"
  | "ARCHIVED";

export type SovereignSLACriticality =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignSLATargets {
  availabilityPercent: number;
  reliabilityPercent: number;
  maximumLatencyMs: number;
  maximumErrorRatePercent: number;
}

export interface SovereignSLAMetrics {
  availabilityPercent: number;
  reliabilityPercent: number;
  averageLatencyMs: number;
  errorRatePercent: number;

  observationWindowSeconds: number;
  measuredAt: string;
}

export interface SovereignSLAViolation {
  id: string;

  objective:
    | "AVAILABILITY"
    | "RELIABILITY"
    | "LATENCY"
    | "ERROR_RATE";

  expected: number;
  actual: number;

  detectedAt: string;
}

export interface SovereignSLARecord {
  id: string;

  serviceId: string;

  criticality: SovereignSLACriticality;

  status: SovereignSLAStatus;

  targets: SovereignSLATargets;

  metrics: SovereignSLAMetrics;

  violations: SovereignSLAViolation[];

  complianceScore: number;

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

export interface SovereignSLAContext {
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

export interface SovereignSLAStore {
  saveRecord(
    record: SovereignSLARecord
  ): Promise<void>;

  getRecord(
    recordId: string
  ): Promise<SovereignSLARecord | undefined>;

  listRecords(
    limit?: number
  ): Promise<SovereignSLARecord[]>;
}

export interface SovereignSLAMetricsBridge {
  collect(input: {
    recordId: string;
    serviceId: string;
    context: SovereignSLAContext;
  }): Promise<SovereignSLAMetrics>;
}

export interface SovereignSLAPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignSLAContext["authority"];

    operation:
      | "REGISTER_SLA"
      | "EVALUATE_SLA"
      | "READ_SLA"
      | "ARCHIVE_SLA";

    recordId?: string;
    serviceId?: string;
    criticality?: SovereignSLACriticality;
  }): Promise<{
    allowed: boolean;
    reason?: string;
  }>;
}

export interface SovereignSLAEventBridge {
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

export interface SovereignSLAAudit {
  record(
    operation: string,
    subjectId: string | undefined,
    result: "SUCCESS" | "FAILED" | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

export class SovereignSLAEngine {
  public readonly id =
    "SOVEREIGN-SLA-90";

  public readonly version = "1.0.0";

  private store?: SovereignSLAStore;
  private metricsBridge?: SovereignSLAMetricsBridge;
  private policyBridge?: SovereignSLAPolicyBridge;
  private eventBridge?: SovereignSLAEventBridge;
  private audit?: SovereignSLAAudit;

  private processing = new Set<string>();

  setStore(store: SovereignSLAStore): void {
    this.store = store;
  }

  setMetricsBridge(
    bridge: SovereignSLAMetricsBridge
  ): void {
    this.metricsBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignSLAPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignSLAEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(audit: SovereignSLAAudit): void {
    this.audit = audit;
  }

  async register(
    input: {
      id?: string;

      serviceId: string;

      criticality: SovereignSLACriticality;

      targets: SovereignSLATargets;

      correlationId?: string;
      causationId?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignSLAContext
  ): Promise<SovereignSLARecord> {
    this.requireContext(context);

    if (!input.serviceId.trim()) {
      throw new Error(
        "SLA serviceId is required."
      );
    }

    this.validateTargets(input.targets);

    const recordId =
      input.id ??
      this.createId("SLA");

    await this.requireAuthorized(
      context,
      "REGISTER_SLA",
      recordId,
      input.serviceId,
      input.criticality
    );

    const now = this.now();

    const record: SovereignSLARecord = {
      id: recordId,

      serviceId: input.serviceId,

      criticality: input.criticality,

      status: "REGISTERED",

      targets: input.targets,

      metrics: {
        availabilityPercent: 0,
        reliabilityPercent: 0,
        averageLatencyMs: 0,
        errorRatePercent: 0,
        observationWindowSeconds: 0,
        measuredAt: now,
      },

      violations: [],

      complianceScore: 0,

      createdBy: context.actorId,

      correlationId:
        input.correlationId ??
        context.correlationId,

      causationId: input.causationId,

      createdAt: now,
      updatedAt: now,

      metadata: input.metadata,
    };

    await this.requireStore()
      .saveRecord(record);

    await this.publishEvent(
      "sla.registered",
      record,
      {
        targets: record.targets,
      }
    );

    await this.recordAudit(
      "sla.register",
      record.id,
      "SUCCESS",
      {
        actorId: context.actorId,
        serviceId: record.serviceId,
      }
    );

    return record;
  }

  async evaluate(
    recordId: string,
    context: SovereignSLAContext
  ): Promise<SovereignSLARecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(recordId);

    await this.requireAuthorized(
      context,
      "EVALUATE_SLA",
      record.id,
      record.serviceId,
      record.criticality
    );

    if (record.status === "ARCHIVED") {
      throw new Error(
        "Archived SLA cannot be evaluated."
      );
    }

    this.acquire(record.id);

    record.status = "EVALUATING";
    record.updatedAt = this.now();

    await this.requireStore()
      .saveRecord(record);

    try {
      const metrics =
        await this.requireMetricsBridge()
          .collect({
            recordId: record.id,
            serviceId: record.serviceId,
            context,
          });

      this.validateMetrics(metrics);

      record.metrics = metrics;

      const violations:
        SovereignSLAViolation[] = [];

      if (
        metrics.availabilityPercent <
        record.targets.availabilityPercent
      ) {
        violations.push(
          this.createViolation(
            "AVAILABILITY",
            record.targets.availabilityPercent,
            metrics.availabilityPercent
          )
        );
      }

      if (
        metrics.reliabilityPercent <
        record.targets.reliabilityPercent
      ) {
        violations.push(
          this.createViolation(
            "RELIABILITY",
            record.targets.reliabilityPercent,
            metrics.reliabilityPercent
          )
        );
      }

      if (
        metrics.averageLatencyMs >
        record.targets.maximumLatencyMs
      ) {
        violations.push(
          this.createViolation(
            "LATENCY",
            record.targets.maximumLatencyMs,
            metrics.averageLatencyMs
          )
        );
      }

      if (
        metrics.errorRatePercent >
        record.targets.maximumErrorRatePercent
      ) {
        violations.push(
          this.createViolation(
            "ERROR_RATE",
            record.targets.maximumErrorRatePercent,
            metrics.errorRatePercent
          )
        );
      }

      record.violations = violations;

      record.complianceScore =
        this.calculateComplianceScore(
          violations.length
        );

      if (violations.length === 0) {
        record.status = "COMPLIANT";
      } else if (violations.length === 1) {
        record.status = "AT_RISK";
      } else {
        record.status = "VIOLATED";
      }

      record.evaluatedBy =
        context.actorId;

      record.evaluatedAt =
        this.now();

      record.updatedAt =
        this.now();

      await this.requireStore()
        .saveRecord(record);

      await this.publishEvent(
        "sla.evaluated",
        record,
        {
          status: record.status,

          complianceScore:
            record.complianceScore,

          violations:
            record.violations,
        }
      );

      await this.recordAudit(
        "sla.evaluate",
        record.id,
        "SUCCESS",
        {
          actorId: context.actorId,

          status: record.status,

          complianceScore:
            record.complianceScore,
        }
      );

      return record;
    } catch (error) {
      record.status = "FAILED";
      record.updatedAt = this.now();

      await this.requireStore()
        .saveRecord(record);

      await this.recordAudit(
        "sla.evaluate",
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
    context: SovereignSLAContext
  ): Promise<SovereignSLARecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(recordId);

    await this.requireAuthorized(
      context,
      "READ_SLA",
      record.id,
      record.serviceId,
      record.criticality
    );

    return record;
  }

  async listRecords(
    context: SovereignSLAContext,
    limit = 100
  ): Promise<SovereignSLARecord[]> {
    this.requireContext(context);

    await this.requireAuthorized(
      context,
      "READ_SLA"
    );

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000
    ) {
      throw new Error(
        "SLA limit must be between 1 and 1000."
      );
    }

    return this.requireStore()
      .listRecords(limit);
  }

  async archive(
    recordId: string,
    context: SovereignSLAContext
  ): Promise<SovereignSLARecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(recordId);

    await this.requireAuthorized(
      context,
      "ARCHIVE_SLA",
      record.id,
      record.serviceId,
      record.criticality
    );

    if (record.status === "EVALUATING") {
      throw new Error(
        "Active SLA evaluation cannot be archived."
      );
    }

    record.status = "ARCHIVED";
    record.archivedAt = this.now();
    record.updatedAt = this.now();

    await this.requireStore()
      .saveRecord(record);

    await this.publishEvent(
      "sla.archived",
      record,
      {
        actorId: context.actorId,
      }
    );

    return record;
  }

  private createViolation(
    objective:
      SovereignSLAViolation["objective"],
    expected: number,
    actual: number
  ): SovereignSLAViolation {
    return {
      id:
        this.createId(
          "SLA-VIOLATION"
        ),

      objective,

      expected,

      actual,

      detectedAt:
        this.now(),
    };
  }

  private calculateComplianceScore(
    violationCount: number
  ): number {
    const totalObjectives = 4;

    return Math.max(
      0,
      Math.round(
        (
          (totalObjectives -
            violationCount) /
          totalObjectives
        ) * 100
      )
    );
  }

  private validateTargets(
    targets: SovereignSLATargets
  ): void {
    this.validatePercent(
      targets.availabilityPercent,
      "availabilityPercent"
    );

    this.validatePercent(
      targets.reliabilityPercent,
      "reliabilityPercent"
    );

    this.validatePercent(
      targets.maximumErrorRatePercent,
      "maximumErrorRatePercent"
    );

    if (
      !Number.isFinite(
        targets.maximumLatencyMs
      ) ||
      targets.maximumLatencyMs < 0
    ) {
      throw new Error(
        "maximumLatencyMs must be zero or greater."
      );
    }
  }

  private validateMetrics(
    metrics: SovereignSLAMetrics
  ): void {
    this.validatePercent(
      metrics.availabilityPercent,
      "availabilityPercent"
    );

    this.validatePercent(
      metrics.reliabilityPercent,
      "reliabilityPercent"
    );

    this.validatePercent(
      metrics.errorRatePercent,
      "errorRatePercent"
    );

    if (
      !Number.isFinite(
        metrics.averageLatencyMs
      ) ||
      metrics.averageLatencyMs < 0
    ) {
      throw new Error(
        "averageLatencyMs must be zero or greater."
      );
    }

    if (
      !Number.isFinite(
        metrics.observationWindowSeconds
      ) ||
      metrics.observationWindowSeconds <= 0
    ) {
      throw new Error(
        "observationWindowSeconds must be greater than zero."
      );
    }
  }

  private validatePercent(
    value: number,
    field: string
  ): void {
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      value > 100
    ) {
      throw new Error(
        `${field} must be between 0 and 100.`
      );
    }
  }

  private acquire(recordId: string): void {
    if (this.processing.has(recordId)) {
      throw new Error(
        "SLA evaluation is already running."
      );
    }

    this.processing.add(recordId);
  }

  private release(recordId: string): void {
    this.processing.delete(recordId);
  }

  private async requireAuthorized(
    context: SovereignSLAContext,
    operation:
      | "REGISTER_SLA"
      | "EVALUATE_SLA"
      | "READ_SLA"
      | "ARCHIVE_SLA",
    recordId?: string,
    serviceId?: string,
    criticality?: SovereignSLACriticality
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
        `sla.${operation.toLowerCase()}`,
        recordId,
        "DENIED",
        {
          actorId: context.actorId,
          reason: result.reason,
        }
      );

      throw new Error(
        result.reason ??
        `SLA operation denied: ${operation}`
      );
    }
  }

  private requireContext(
    context: SovereignSLAContext
  ): void {
    if (!context.authenticated) {
      throw new Error(
        "SLA requires authentication."
      );
    }

    if (!context.policyChecked) {
      throw new Error(
        "SLA requires policy verification."
      );
    }

    if (!context.securityChecked) {
      throw new Error(
        "SLA requires security verification."
      );
    }

    if (
      !context.authorizationChecked
    ) {
      throw new Error(
        "SLA requires authorization verification."
      );
    }
  }

  private requireStore():
    SovereignSLAStore {
    if (!this.store) {
      throw new Error(
        "Sovereign SLA store is not configured."
      );
    }

    return this.store;
  }

  private requireMetricsBridge():
    SovereignSLAMetricsBridge {
    if (!this.metricsBridge) {
      throw new Error(
        "Sovereign SLA metrics bridge is not configured."
      );
    }

    return this.metricsBridge;
  }

  private requirePolicyBridge():
    SovereignSLAPolicyBridge {
    if (!this.policyBridge) {
      throw new Error(
        "Sovereign SLA policy bridge is not configured."
      );
    }

    return this.policyBridge;
  }

  private async requireRecord(
    recordId: string
  ): Promise<SovereignSLARecord> {
    const record =
      await this.requireStore()
        .getRecord(recordId);

    if (!record) {
      throw new Error(
        `SLA record not found: ${recordId}`
      );
    }

    return record;
  }

  private async publishEvent(
    type: string,
    record: SovereignSLARecord,
    payload: Record<string, unknown>
  ): Promise<void> {
    if (!this.eventBridge) {
      return;
    }

    await this.eventBridge.publish({
      id:
        this.createId(
          "SLA-EVENT"
        ),

      type,

      source: this.id,

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

  private createId(prefix: string): string {
    return `${prefix}-${randomUUID()}`;
  }

  private now(): string {
    return new Date().toISOString();
  }
}

export function createSovereignSLAEngine():
  SovereignSLAEngine {
  return new SovereignSLAEngine();
}

export const SOVEREIGN_SLA_CONTRACT = {
  id:
    "SOVEREIGN-SLA-90",

  role:
    "CENTRAL_SOVEREIGN_SLA_ENGINE",

  authority:
    "NONE",

  ownerAuthority:
    "SUPREME",

  stewardAuthority:
    "DELEGATED",

  availabilityIntegrated:
    true,

  reliabilityIntegrated:
    true,

  availabilityObjective:
    true,

  reliabilityObjective:
    true,

  latencyObjective:
    true,

  errorRateObjective:
    true,

  complianceScoring:
    true,

  violationDetection:
    true,

  evidenceRequired:
    true,

  falseComplianceBlocked:
    true,

  policyAuthorizationRequired:
    true,

  securityVerificationRequired:
    true,

  auditRequired:
    true,

  directAuthorityModification:
    false,

  directPolicyModification:
    false,

  automaticPrivilegeElevation:
    false,

  slaCanCreateAuthority:
    false,

  slaCanOverrideOwner:
    false,

  stewardCanOverrideOwner:
    false,

  externalSLASaaSRequired:
    false,

  status:
    "FOUNDATION",
} as const;

/* ============================================================
 * END OF SOVEREIGN-SLA-90
 * ============================================================
 */

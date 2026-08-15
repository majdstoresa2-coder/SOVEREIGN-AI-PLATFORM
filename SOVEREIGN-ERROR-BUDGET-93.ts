/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-ERROR-BUDGET-93
 * ============================================================
 *
 * Sovereign Error Budget Engine.
 *
 * Responsibilities:
 * - Define sovereign error budgets.
 * - Calculate allowed failure budgets from SLO targets.
 * - Measure consumed and remaining budget.
 * - Detect exhaustion and unsafe burn rates.
 * - Preserve error-budget evidence.
 * - Prevent false healthy-budget declarations.
 *
 * ERROR BUDGET ENGINE IS NOT AUTHORITY.
 * ERROR BUDGET ENGINE DOES NOT OVERRIDE OWNER.
 * ERROR BUDGET ENGINE DOES NOT GRANT PRIVILEGES.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignErrorBudgetStatus =
  | "REGISTERED"
  | "EVALUATING"
  | "HEALTHY"
  | "AT_RISK"
  | "EXHAUSTED"
  | "FAILED"
  | "ARCHIVED";

export type SovereignErrorBudgetCriticality =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignErrorBudgetMetrics {
  totalEvents: number;
  failedEvents: number;

  observationWindowSeconds: number;

  allowedFailurePercent: number;
  actualFailurePercent: number;

  allowedFailures: number;

  consumedBudgetPercent: number;
  remainingBudgetPercent: number;

  burnRate: number;

  measuredAt: string;

  evidence?: Record<string, unknown>;
}

export interface SovereignErrorBudgetRecord {
  id: string;

  serviceId: string;
  sloId: string;

  criticality:
    SovereignErrorBudgetCriticality;

  status:
    SovereignErrorBudgetStatus;

  sloTargetPercent: number;

  metrics?: SovereignErrorBudgetMetrics;

  violations: string[];

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

export interface SovereignErrorBudgetContext {
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

export interface SovereignErrorBudgetStore {
  saveRecord(
    record: SovereignErrorBudgetRecord
  ): Promise<void>;

  getRecord(
    recordId: string
  ): Promise<SovereignErrorBudgetRecord | undefined>;

  listRecords(
    limit?: number
  ): Promise<SovereignErrorBudgetRecord[]>;
}

export interface SovereignErrorBudgetMetricsBridge {
  collect(input: {
    recordId: string;
    serviceId: string;
    sloId: string;

    context:
      SovereignErrorBudgetContext;
  }): Promise<{
    totalEvents: number;
    failedEvents: number;

    observationWindowSeconds: number;

    measuredAt: string;

    evidence?: Record<string, unknown>;
  }>;
}

export interface SovereignErrorBudgetPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignErrorBudgetContext["authority"];

    operation:
      | "REGISTER_ERROR_BUDGET"
      | "EVALUATE_ERROR_BUDGET"
      | "READ_ERROR_BUDGET"
      | "ARCHIVE_ERROR_BUDGET";

    recordId?: string;
    serviceId?: string;

    criticality?:
      SovereignErrorBudgetCriticality;
  }): Promise<{
    allowed: boolean;
    reason?: string;
  }>;
}

export interface SovereignErrorBudgetEventBridge {
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

export interface SovereignErrorBudgetAudit {
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

export class SovereignErrorBudgetEngine {
  public readonly id =
    "SOVEREIGN-ERROR-BUDGET-93";

  public readonly version = "1.0.0";

  private store?: SovereignErrorBudgetStore;

  private metricsBridge?:
    SovereignErrorBudgetMetricsBridge;

  private policyBridge?:
    SovereignErrorBudgetPolicyBridge;

  private eventBridge?:
    SovereignErrorBudgetEventBridge;

  private audit?: SovereignErrorBudgetAudit;

  private processing = new Set<string>();

  setStore(
    store: SovereignErrorBudgetStore
  ): void {
    this.store = store;
  }

  setMetricsBridge(
    bridge: SovereignErrorBudgetMetricsBridge
  ): void {
    this.metricsBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignErrorBudgetPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignErrorBudgetEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignErrorBudgetAudit
  ): void {
    this.audit = audit;
  }

  async register(
    input: {
      id?: string;

      serviceId: string;
      sloId: string;

      criticality:
        SovereignErrorBudgetCriticality;

      sloTargetPercent: number;

      correlationId?: string;
      causationId?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignErrorBudgetContext
  ): Promise<SovereignErrorBudgetRecord> {
    this.requireContext(context);

    if (!input.serviceId.trim()) {
      throw new Error(
        "Error budget serviceId is required."
      );
    }

    if (!input.sloId.trim()) {
      throw new Error(
        "Error budget sloId is required."
      );
    }

    if (
      !Number.isFinite(
        input.sloTargetPercent
      ) ||
      input.sloTargetPercent < 0 ||
      input.sloTargetPercent > 100
    ) {
      throw new Error(
        "sloTargetPercent must be between 0 and 100."
      );
    }

    const recordId =
      input.id ??
      this.createId("ERROR-BUDGET");

    await this.requireAuthorized(
      context,
      "REGISTER_ERROR_BUDGET",
      recordId,
      input.serviceId,
      input.criticality
    );

    const now = this.now();

    const record:
      SovereignErrorBudgetRecord = {
      id: recordId,

      serviceId: input.serviceId,
      sloId: input.sloId,

      criticality:
        input.criticality,

      status: "REGISTERED",

      sloTargetPercent:
        input.sloTargetPercent,

      violations: [],

      createdBy:
        context.actorId,

      correlationId:
        input.correlationId ??
        context.correlationId,

      causationId:
        input.causationId,

      createdAt: now,
      updatedAt: now,

      metadata: input.metadata,
    };

    await this.requireStore()
      .saveRecord(record);

    await this.publishEvent(
      "error-budget.registered",
      record,
      {
        sloId: record.sloId,
        sloTargetPercent:
          record.sloTargetPercent,
      }
    );

    await this.recordAudit(
      "error-budget.register",
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
    context: SovereignErrorBudgetContext
  ): Promise<SovereignErrorBudgetRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(recordId);

    await this.requireAuthorized(
      context,
      "EVALUATE_ERROR_BUDGET",
      record.id,
      record.serviceId,
      record.criticality
    );

    if (record.status === "ARCHIVED") {
      throw new Error(
        "Archived error budget cannot be evaluated."
      );
    }

    this.acquire(record.id);

    record.status = "EVALUATING";
    record.updatedAt = this.now();

    await this.requireStore()
      .saveRecord(record);

    try {
      const raw =
        await this.requireMetricsBridge()
          .collect({
            recordId: record.id,
            serviceId: record.serviceId,
            sloId: record.sloId,
            context,
          });

      this.validateRawMetrics(raw);

      const allowedFailurePercent =
        100 - record.sloTargetPercent;

      const actualFailurePercent =
        raw.totalEvents === 0
          ? 0
          : (
              raw.failedEvents /
              raw.totalEvents
            ) * 100;

      const allowedFailures =
        (
          raw.totalEvents *
          allowedFailurePercent
        ) / 100;

      const consumedBudgetPercent =
        allowedFailures === 0
          ? raw.failedEvents === 0
            ? 0
            : 100
          : Math.min(
              100,
              (
                raw.failedEvents /
                allowedFailures
              ) * 100
            );

      const remainingBudgetPercent =
        Math.max(
          0,
          100 -
            consumedBudgetPercent
        );

      const burnRate =
        allowedFailurePercent === 0
          ? actualFailurePercent === 0
            ? 0
            : Number.POSITIVE_INFINITY
          : actualFailurePercent /
            allowedFailurePercent;

      const metrics:
        SovereignErrorBudgetMetrics = {
        totalEvents:
          raw.totalEvents,

        failedEvents:
          raw.failedEvents,

        observationWindowSeconds:
          raw.observationWindowSeconds,

        allowedFailurePercent:
          this.round(
            allowedFailurePercent
          ),

        actualFailurePercent:
          this.round(
            actualFailurePercent
          ),

        allowedFailures:
          this.round(
            allowedFailures
          ),

        consumedBudgetPercent:
          this.round(
            consumedBudgetPercent
          ),

        remainingBudgetPercent:
          this.round(
            remainingBudgetPercent
          ),

        burnRate:
          Number.isFinite(burnRate)
            ? this.round(burnRate)
            : burnRate,

        measuredAt:
          raw.measuredAt,

        evidence:
          raw.evidence,
      };

      record.metrics = metrics;

      const violations: string[] = [];

      if (raw.totalEvents === 0) {
        violations.push(
          "NO_OPERATIONAL_EVIDENCE"
        );
      }

      if (
        actualFailurePercent >
        allowedFailurePercent
      ) {
        violations.push(
          "ERROR_BUDGET_EXCEEDED"
        );
      }

      if (
        remainingBudgetPercent === 0 &&
        raw.failedEvents > 0
      ) {
        violations.push(
          "ERROR_BUDGET_EXHAUSTED"
        );
      }

      if (
        Number.isFinite(burnRate) &&
        burnRate >= 1
      ) {
        violations.push(
          "UNSAFE_BURN_RATE"
        );
      }

      if (!Number.isFinite(burnRate)) {
        violations.push(
          "ZERO_TOLERANCE_FAILURE"
        );
      }

      record.violations =
        violations;

      if (
        violations.includes(
          "ERROR_BUDGET_EXHAUSTED"
        ) ||
        violations.includes(
          "ZERO_TOLERANCE_FAILURE"
        )
      ) {
        record.status =
          "EXHAUSTED";
      } else if (
        burnRate >= 0.8 ||
        remainingBudgetPercent <= 20
      ) {
        record.status =
          "AT_RISK";
      } else {
        record.status =
          "HEALTHY";
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
        "error-budget.evaluated",
        record,
        {
          status:
            record.status,

          consumedBudgetPercent:
            metrics.consumedBudgetPercent,

          remainingBudgetPercent:
            metrics.remainingBudgetPercent,

          burnRate:
            metrics.burnRate,

          violations:
            record.violations,
        }
      );

      await this.recordAudit(
        "error-budget.evaluate",
        record.id,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          status:
            record.status,

          remainingBudgetPercent:
            metrics.remainingBudgetPercent,
        }
      );

      return record;
    } catch (error) {
      record.status =
        "FAILED";

      record.updatedAt =
        this.now();

      await this.requireStore()
        .saveRecord(record);

      await this.recordAudit(
        "error-budget.evaluate",
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

  async getRecord(
    recordId: string,
    context: SovereignErrorBudgetContext
  ): Promise<SovereignErrorBudgetRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(recordId);

    await this.requireAuthorized(
      context,
      "READ_ERROR_BUDGET",
      record.id,
      record.serviceId,
      record.criticality
    );

    return record;
  }

  async listRecords(
    context: SovereignErrorBudgetContext,
    limit = 100
  ): Promise<SovereignErrorBudgetRecord[]> {
    this.requireContext(context);

    await this.requireAuthorized(
      context,
      "READ_ERROR_BUDGET"
    );

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000
    ) {
      throw new Error(
        "Error budget limit must be between 1 and 1000."
      );
    }

    return this.requireStore()
      .listRecords(limit);
  }

  async archive(
    recordId: string,
    context: SovereignErrorBudgetContext
  ): Promise<SovereignErrorBudgetRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(recordId);

    await this.requireAuthorized(
      context,
      "ARCHIVE_ERROR_BUDGET",
      record.id,
      record.serviceId,
      record.criticality
    );

    if (
      record.status === "EVALUATING"
    ) {
      throw new Error(
        "Active error-budget evaluation cannot be archived."
      );
    }

    record.status = "ARCHIVED";
    record.archivedAt = this.now();
    record.updatedAt = this.now();

    await this.requireStore()
      .saveRecord(record);

    await this.publishEvent(
      "error-budget.archived",
      record,
      {
        actorId: context.actorId,
      }
    );

    return record;
  }

  private validateRawMetrics(
    metrics: {
      totalEvents: number;
      failedEvents: number;
      observationWindowSeconds: number;
      measuredAt: string;
    }
  ): void {
    if (
      !Number.isInteger(
        metrics.totalEvents
      ) ||
      metrics.totalEvents < 0
    ) {
      throw new Error(
        "totalEvents must be a non-negative integer."
      );
    }

    if (
      !Number.isInteger(
        metrics.failedEvents
      ) ||
      metrics.failedEvents < 0
    ) {
      throw new Error(
        "failedEvents must be a non-negative integer."
      );
    }

    if (
      metrics.failedEvents >
      metrics.totalEvents
    ) {
      throw new Error(
        "failedEvents cannot exceed totalEvents."
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

    if (
      Number.isNaN(
        new Date(
          metrics.measuredAt
        ).getTime()
      )
    ) {
      throw new Error(
        "Error-budget measuredAt is invalid."
      );
    }
  }

  private acquire(
    recordId: string
  ): void {
    if (
      this.processing.has(recordId)
    ) {
      throw new Error(
        "Error-budget evaluation is already running."
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
    context: SovereignErrorBudgetContext,
    operation:
      | "REGISTER_ERROR_BUDGET"
      | "EVALUATE_ERROR_BUDGET"
      | "READ_ERROR_BUDGET"
      | "ARCHIVE_ERROR_BUDGET",
    recordId?: string,
    serviceId?: string,
    criticality?:
      SovereignErrorBudgetCriticality
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

          criticality,
        });

    if (!result.allowed) {
      await this.recordAudit(
        `error-budget.${operation.toLowerCase()}`,
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
        `Error-budget operation denied: ${operation}`
      );
    }
  }

  private requireContext(
    context: SovereignErrorBudgetContext
  ): void {
    if (!context.authenticated) {
      throw new Error(
        "Error budget requires authentication."
      );
    }

    if (!context.policyChecked) {
      throw new Error(
        "Error budget requires policy verification."
      );
    }

    if (!context.securityChecked) {
      throw new Error(
        "Error budget requires security verification."
      );
    }

    if (
      !context.authorizationChecked
    ) {
      throw new Error(
        "Error budget requires authorization verification."
      );
    }
  }

  private requireStore():
    SovereignErrorBudgetStore {
    if (!this.store) {
      throw new Error(
        "Sovereign error-budget store is not configured."
      );
    }

    return this.store;
  }

  private requireMetricsBridge():
    SovereignErrorBudgetMetricsBridge {
    if (!this.metricsBridge) {
      throw new Error(
        "Sovereign error-budget metrics bridge is not configured."
      );
    }

    return this.metricsBridge;
  }

  private requirePolicyBridge():
    SovereignErrorBudgetPolicyBridge {
    if (!this.policyBridge) {
      throw new Error(
        "Sovereign error-budget policy bridge is not configured."
      );
    }

    return this.policyBridge;
  }

  private async requireRecord(
    recordId: string
  ): Promise<SovereignErrorBudgetRecord> {
    const record =
      await this.requireStore()
        .getRecord(recordId);

    if (!record) {
      throw new Error(
        `Error-budget record not found: ${recordId}`
      );
    }

    return record;
  }

  private async publishEvent(
    type: string,
    record: SovereignErrorBudgetRecord,
    payload: Record<string, unknown>
  ): Promise<void> {
    if (!this.eventBridge) {
      return;
    }

    await this.eventBridge.publish({
      id:
        this.createId(
          "ERROR-BUDGET-EVENT"
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

  private round(
    value: number
  ): number {
    return Number(
      value.toFixed(4)
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

export function createSovereignErrorBudget

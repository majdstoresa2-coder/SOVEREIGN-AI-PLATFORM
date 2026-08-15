/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-BURN-RATE-94
 * ============================================================
 *
 * Sovereign Burn Rate Engine.
 *
 * Responsibilities:
 * - Measure sovereign error-budget burn rate.
 * - Detect unsafe budget consumption.
 * - Evaluate short and long observation windows.
 * - Detect imminent error-budget exhaustion.
 * - Produce trusted burn-rate assessments.
 * - Preserve evidence and audit records.
 *
 * BURN RATE ENGINE IS NOT AUTHORITY.
 * BURN RATE ENGINE DOES NOT OVERRIDE OWNER.
 * BURN RATE ENGINE DOES NOT GRANT PRIVILEGES.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignBurnRateStatus =
  | "REGISTERED"
  | "EVALUATING"
  | "HEALTHY"
  | "ELEVATED"
  | "CRITICAL"
  | "EXHAUSTION_IMMINENT"
  | "FAILED"
  | "ARCHIVED";

export type SovereignBurnRateCriticality =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignBurnRateWindow {
  id: string;

  name: string;

  durationSeconds: number;

  totalEvents: number;

  failedEvents: number;

  failureRatePercent: number;

  burnRate: number;

  measuredAt: string;

  evidence?: Record<string, unknown>;
}

export interface SovereignBurnRateRecord {
  id: string;

  serviceId: string;

  sloId: string;

  errorBudgetId: string;

  criticality: SovereignBurnRateCriticality;

  status: SovereignBurnRateStatus;

  allowedFailurePercent: number;

  remainingBudgetPercent: number;

  warningBurnRate: number;

  criticalBurnRate: number;

  windows: SovereignBurnRateWindow[];

  highestBurnRate: number;

  projectedExhaustionSeconds?: number;

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

export interface SovereignBurnRateContext {
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

export interface SovereignBurnRateStore {
  saveRecord(
    record: SovereignBurnRateRecord
  ): Promise<void>;

  getRecord(
    recordId: string
  ): Promise<SovereignBurnRateRecord | undefined>;

  listRecords(
    limit?: number
  ): Promise<SovereignBurnRateRecord[]>;
}

export interface SovereignBurnRateMetricsBridge {
  collect(input: {
    recordId: string;

    serviceId: string;

    sloId: string;

    errorBudgetId: string;

    context: SovereignBurnRateContext;
  }): Promise<{
    remainingBudgetPercent: number;

    windows: Array<{
      name: string;

      durationSeconds: number;

      totalEvents: number;

      failedEvents: number;

      measuredAt: string;

      evidence?: Record<string, unknown>;
    }>;
  }>;
}

export interface SovereignBurnRatePolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignBurnRateContext["authority"];

    operation:
      | "REGISTER_BURN_RATE"
      | "EVALUATE_BURN_RATE"
      | "READ_BURN_RATE"
      | "ARCHIVE_BURN_RATE";

    recordId?: string;

    serviceId?: string;

    criticality?: SovereignBurnRateCriticality;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

export interface SovereignBurnRateEventBridge {
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

export interface SovereignBurnRateAudit {
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

export class SovereignBurnRateEngine {
  public readonly id =
    "SOVEREIGN-BURN-RATE-94";

  public readonly version =
    "1.0.0";

  private store?: SovereignBurnRateStore;

  private metricsBridge?:
    SovereignBurnRateMetricsBridge;

  private policyBridge?:
    SovereignBurnRatePolicyBridge;

  private eventBridge?:
    SovereignBurnRateEventBridge;

  private audit?: SovereignBurnRateAudit;

  private processing =
    new Set<string>();

  setStore(
    store: SovereignBurnRateStore
  ): void {
    this.store = store;
  }

  setMetricsBridge(
    bridge: SovereignBurnRateMetricsBridge
  ): void {
    this.metricsBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignBurnRatePolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignBurnRateEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignBurnRateAudit
  ): void {
    this.audit = audit;
  }

  async register(
    input: {
      id?: string;

      serviceId: string;

      sloId: string;

      errorBudgetId: string;

      criticality:
        SovereignBurnRateCriticality;

      allowedFailurePercent: number;

      warningBurnRate?: number;

      criticalBurnRate?: number;

      correlationId?: string;

      causationId?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignBurnRateContext
  ): Promise<SovereignBurnRateRecord> {
    this.requireContext(context);

    if (!input.serviceId.trim()) {
      throw new Error(
        "Burn-rate serviceId is required."
      );
    }

    if (!input.sloId.trim()) {
      throw new Error(
        "Burn-rate sloId is required."
      );
    }

    if (!input.errorBudgetId.trim()) {
      throw new Error(
        "Burn-rate errorBudgetId is required."
      );
    }

    this.validatePercent(
      input.allowedFailurePercent,
      "allowedFailurePercent"
    );

    const warningBurnRate =
      input.warningBurnRate ?? 1;

    const criticalBurnRate =
      input.criticalBurnRate ?? 2;

    this.validateBurnThreshold(
      warningBurnRate,
      "warningBurnRate"
    );

    this.validateBurnThreshold(
      criticalBurnRate,
      "criticalBurnRate"
    );

    if (
      criticalBurnRate <
      warningBurnRate
    ) {
      throw new Error(
        "criticalBurnRate cannot be lower than warningBurnRate."
      );
    }

    const recordId =
      input.id ??
      this.createId(
        "BURN-RATE"
      );

    await this.requireAuthorized(
      context,
      "REGISTER_BURN_RATE",
      recordId,
      input.serviceId,
      input.criticality
    );

    const now =
      this.now();

    const record:
      SovereignBurnRateRecord = {
      id:
        recordId,

      serviceId:
        input.serviceId,

      sloId:
        input.sloId,

      errorBudgetId:
        input.errorBudgetId,

      criticality:
        input.criticality,

      status:
        "REGISTERED",

      allowedFailurePercent:
        input.allowedFailurePercent,

      remainingBudgetPercent:
        100,

      warningBurnRate,

      criticalBurnRate,

      windows:
        [],

      highestBurnRate:
        0,

      violations:
        [],

      createdBy:
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
      .saveRecord(record);

    await this.publishEvent(
      "burn-rate.registered",
      record,
      {
        warningBurnRate:
          record.warningBurnRate,

        criticalBurnRate:
          record.criticalBurnRate,
      }
    );

    await this.recordAudit(
      "burn-rate.register",
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
    context: SovereignBurnRateContext
  ): Promise<SovereignBurnRateRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "EVALUATE_BURN_RATE",
      record.id,
      record.serviceId,
      record.criticality
    );

    if (
      record.status ===
      "ARCHIVED"
    ) {
      throw new Error(
        "Archived burn-rate record cannot be evaluated."
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
      .saveRecord(record);

    try {
      const raw =
        await this.requireMetricsBridge()
          .collect({
            recordId:
              record.id,

            serviceId:
              record.serviceId,

            sloId:
              record.sloId,

            errorBudgetId:
              record.errorBudgetId,

            context,
          });

      this.validatePercent(
        raw.remainingBudgetPercent,
        "remainingBudgetPercent"
      );

      if (
        raw.windows.length === 0
      ) {
        throw new Error(
          "Burn-rate evaluation requires at least one observation window."
        );
      }

      record.remainingBudgetPercent =
        raw.remainingBudgetPercent;

      record.windows =
        raw.windows.map(
          (window) =>
            this.buildWindow(
              window,
              record.allowedFailurePercent
            )
        );

      record.highestBurnRate =
        Math.max(
          ...record.windows.map(
            (window) =>
              window.burnRate
          )
        );

      record.projectedExhaustionSeconds =
        this.projectExhaustion(
          record
        );

      const violations:
        string[] = [];

      if (
        record.remainingBudgetPercent <=
        0
      ) {
        violations.push(
          "ERROR_BUDGET_EXHAUSTED"
        );
      }

      if (
        record.highestBurnRate >=
        record.warningBurnRate
      ) {
        violations.push(
          "ELEVATED_BURN_RATE"
        );
      }

      if (
        record.highestBurnRate >=
        record.criticalBurnRate
      ) {
        violations.push(
          "CRITICAL_BURN_RATE"
        );
      }

      if (
        record.projectedExhaustionSeconds !==
          undefined &&
        record.projectedExhaustionSeconds <=
          3600
      ) {
        violations.push(
          "ERROR_BUDGET_EXHAUSTION_IMMINENT"
        );
      }

      record.violations =
        [
          ...new Set(
            violations
          ),
        ];

      if (
        record.remainingBudgetPercent <=
        0
      ) {
        record.status =
          "EXHAUSTION_IMMINENT";
      } else if (
        record.violations.includes(
          "ERROR_BUDGET_EXHAUSTION_IMMINENT"
        )
      ) {
        record.status =
          "EXHAUSTION_IMMINENT";
      } else if (
        record.highestBurnRate >=
        record.criticalBurnRate
      ) {
        record.status =
          "CRITICAL";
      } else if (
        record.highestBurnRate >=
        record.warningBurnRate
      ) {
        record.status =
          "ELEVATED";
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
        "burn-rate.evaluated",
        record,
        {
          status:
            record.status,

          highestBurnRate:
            record.highestBurnRate,

          remainingBudgetPercent:
            record.remainingBudgetPercent,

          projectedExhaustionSeconds:
            record.projectedExhaustionSeconds,

          violations:
            record.violations,
        }
      );

      await this.recordAudit(
        "burn-rate.evaluate",
        record.id,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          status:
            record.status,

          highestBurnRate:
            record.highestBurnRate,
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
        "burn-rate.evaluate",
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
    context: SovereignBurnRateContext
  ): Promise<SovereignBurnRateRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "READ_BURN_RATE",
      record.id,
      record.serviceId,
      record.criticality
    );

    return record;
  }

  async listRecords(
    context: SovereignBurnRateContext,
    limit = 100
  ): Promise<SovereignBurnRateRecord[]> {
    this.requireContext(context);

    await this.requireAuthorized(
      context,
      "READ_BURN_RATE"
    );

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000
    ) {
      throw new Error(
        "Burn-rate limit must be between 1 and 1000."
      );
    }

    return this.requireStore()
      .listRecords(limit);
  }

  async archive(
    recordId: string,
    context: SovereignBurnRateContext
  ): Promise<SovereignBurnRateRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "ARCHIVE_BURN_RATE",
      record.id,
      record.serviceId,
      record.criticality
    );

    if (
      record.status ===
      "EVALUATING"
    ) {
      throw new Error(
        "Active burn-rate evaluation cannot be archived."
      );
    }

    record.status =
      "ARCHIVED";

    record.archivedAt =
      this.now();

    record.updatedAt =
      this.now();

    await this.requireStore()
      .saveRecord(record);

    await this.publishEvent(
      "burn-rate.archived",
      record,
      {
        actorId:
          context.actorId,
      }
    );

    return record;
  }

  private buildWindow(
    input: {
      name: string;

      durationSeconds: number;

      totalEvents: number;

      failedEvents: number;

      measuredAt: string;

      evidence?: Record<string, unknown>;
    },
    allowedFailurePercent: number
  ): SovereignBurnRateWindow {
    if (!input.name.trim()) {
      throw new Error(
        "Burn-rate window name is required."
      );
    }

    if (
      !Number.isFinite(
        input.durationSeconds
      ) ||
      input.durationSeconds <= 0
    ) {
      throw new Error(
        "Burn-rate window durationSeconds must be greater than zero."
      );
    }

    if (
      !Number.isInteger(
        input.totalEvents
      ) ||
      input.totalEvents < 0
    ) {
      throw new Error(
        "Burn-rate totalEvents must be a non-negative integer."
      );
    }

    if (
      !Number.isInteger(
        input.failedEvents
      ) ||
      input.failedEvents < 0
    ) {
      throw new Error(
        "Burn-rate failedEvents must be a non-negative integer."
      );
    }

    if (
      input.failedEvents >
      input.totalEvents
    ) {
      throw new Error(
        "Burn-rate failedEvents cannot exceed totalEvents."
      );
    }

    if (
      Number.isNaN(
        new Date(
          input.measuredAt
        ).getTime()
      )
    ) {
      throw new Error(
        "Burn-rate measuredAt is invalid."
      );
    }

    const failureRatePercent =
      input.totalEvents === 0
        ? 0
        : (
            input.failedEvents /
            input.totalEvents
          ) *
          100;

    const burnRate =
      allowedFailurePercent === 0
        ? failureRatePercent === 0
          ? 0
          : Number.POSITIVE_INFINITY
        : failureRatePercent /
          allowedFailurePercent;

    return {
      id:
        this.createId(
          "BURN-RATE-WINDOW"
        ),

      name:
        input.name,

      durationSeconds:
        input.durationSeconds,

      totalEvents:
        input.totalEvents,

      failedEvents:
        input.failedEvents,

      failureRatePercent:
        this.round(
          failureRatePercent
        ),

      burnRate:
        Number.isFinite(
          burnRate
        )
          ? this.round(
              burnRate
            )
          : burnRate,

      measuredAt:
        input.measuredAt,

      evidence:
        input.evidence,
    };
  }

  private projectExhaustion(
    record: SovereignBurnRateRecord
  ): number | undefined {
    if (
      record.remainingBudgetPercent <=
      0
    ) {
      return 0;
    }

    const finiteWindows =
      record.windows.filter(
        (window) =>
          Number.isFinite(
            window.burnRate
          ) &&
          window.burnRate > 0
      );

    if (
      finiteWindows.length === 0
    ) {
      return undefined;
    }

    const fastest =
      finiteWindows.sort(
        (a, b) =>
          b.burnRate -
          a.burnRate
      )[0];

    const budgetFraction =
      record.remainingBudgetPercent /
      100;

    return Math.round(
      (
        budgetFraction /
        fastest.burnRate
      ) *
      fastest.durationSeconds
    );
  }

  private validatePercent(
    value: number,
    field: string
  ): void {
    if (
      !Number.isFinite(
        value
      ) ||
      value < 0 ||
      value > 100
    ) {
      throw new Error(
        `${field} must be between 0 and 100.`
      );
    }
  }

  private validateBurnThreshold(
    value: number,
    field: string
  ): void {
    if (
      !Number.isFinite(
        value
      ) ||
      value <= 0
    ) {
      throw new Error(
        `${field} must be greater than zero.`
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
       

/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-BURN-RATE-CONTROLLER-96
 * ============================================================
 *
 * Sovereign Burn Rate Controller.
 *
 * Responsibilities:
 * - Coordinate sovereign burn-rate evaluations.
 * - Consume trusted burn-rate measurements.
 * - Classify operational burn conditions.
 * - Detect error-budget exhaustion risk.
 * - Produce controlled mitigation recommendations.
 * - Preserve evidence, events and audit records.
 *
 * CONTROLLER IS NOT AUTHORITY.
 * CONTROLLER DOES NOT OVERRIDE OWNER.
 * CONTROLLER DOES NOT GRANT PRIVILEGES.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignBurnRateControllerStatus =
  | "REGISTERED"
  | "EVALUATING"
  | "HEALTHY"
  | "WARNING"
  | "CRITICAL"
  | "EXHAUSTION_IMMINENT"
  | "FAILED"
  | "PAUSED"
  | "ARCHIVED";

export type SovereignBurnRateControllerCriticality =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignBurnRateAction =
  | "NONE"
  | "OBSERVE"
  | "RESTRICT_RISKY_CHANGE"
  | "FREEZE_NON_CRITICAL_CHANGE"
  | "ESCALATE";

export interface SovereignBurnRateControllerWindow {
  id: string;

  name: string;

  durationSeconds: number;

  burnRate: number;

  measuredAt: string;

  verified: boolean;

  evidence?: Record<string, unknown>;
}

export interface SovereignBurnRateControllerAssessment {
  highestBurnRate: number;

  remainingBudgetPercent: number;

  projectedExhaustionSeconds?: number;

  recommendedAction: SovereignBurnRateAction;

  reasons: string[];

  assessedAt: string;
}

export interface SovereignBurnRateControllerRecord {
  id: string;

  serviceId: string;

  sloId: string;

  errorBudgetId: string;

  burnRateRecordId?: string;

  criticality:
    SovereignBurnRateControllerCriticality;

  status:
    SovereignBurnRateControllerStatus;

  warningThreshold: number;

  criticalThreshold: number;

  exhaustionWindowSeconds: number;

  windows: SovereignBurnRateControllerWindow[];

  assessment?: SovereignBurnRateControllerAssessment;

  createdBy: string;

  evaluatedBy?: string;

  correlationId?: string;

  causationId?: string;

  createdAt: string;

  updatedAt: string;

  evaluatedAt?: string;

  pausedAt?: string;

  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignBurnRateControllerContext {
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

export interface SovereignBurnRateControllerStore {
  saveRecord(
    record: SovereignBurnRateControllerRecord
  ): Promise<void>;

  getRecord(
    recordId: string
  ): Promise<
    SovereignBurnRateControllerRecord | undefined
  >;

  listRecords(
    limit?: number
  ): Promise<SovereignBurnRateControllerRecord[]>;
}

export interface SovereignBurnRateControllerMetricsBridge {
  collect(input: {
    recordId: string;

    serviceId: string;

    sloId: string;

    errorBudgetId: string;

    burnRateRecordId?: string;

    context: SovereignBurnRateControllerContext;
  }): Promise<{
    remainingBudgetPercent: number;

    projectedExhaustionSeconds?: number;

    windows: Array<{
      name: string;

      durationSeconds: number;

      burnRate: number;

      measuredAt: string;

      verified: boolean;

      evidence?: Record<string, unknown>;
    }>;
  }>;
}

export interface SovereignBurnRateControllerPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignBurnRateControllerContext["authority"];

    operation:
      | "REGISTER_BURN_RATE_CONTROLLER"
      | "EVALUATE_BURN_RATE_CONTROLLER"
      | "READ_BURN_RATE_CONTROLLER"
      | "PAUSE_BURN_RATE_CONTROLLER"
      | "ARCHIVE_BURN_RATE_CONTROLLER";

    recordId?: string;

    serviceId?: string;

    criticality?:
      SovereignBurnRateControllerCriticality;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

export interface SovereignBurnRateControllerEventBridge {
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

export interface SovereignBurnRateControllerAudit {
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

export class SovereignBurnRateController {
  public readonly id =
    "SOVEREIGN-BURN-RATE-CONTROLLER-96";

  public readonly version =
    "1.0.0";

  private store?:
    SovereignBurnRateControllerStore;

  private metricsBridge?:
    SovereignBurnRateControllerMetricsBridge;

  private policyBridge?:
    SovereignBurnRateControllerPolicyBridge;

  private eventBridge?:
    SovereignBurnRateControllerEventBridge;

  private audit?:
    SovereignBurnRateControllerAudit;

  private processing =
    new Set<string>();

  setStore(
    store: SovereignBurnRateControllerStore
  ): void {
    this.store = store;
  }

  setMetricsBridge(
    bridge: SovereignBurnRateControllerMetricsBridge
  ): void {
    this.metricsBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignBurnRateControllerPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignBurnRateControllerEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignBurnRateControllerAudit
  ): void {
    this.audit = audit;
  }

  async register(
    input: {
      id?: string;

      serviceId: string;

      sloId: string;

      errorBudgetId: string;

      burnRateRecordId?: string;

      criticality:
        SovereignBurnRateControllerCriticality;

      warningThreshold?: number;

      criticalThreshold?: number;

      exhaustionWindowSeconds?: number;

      correlationId?: string;

      causationId?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignBurnRateControllerContext
  ): Promise<SovereignBurnRateControllerRecord> {
    this.requireContext(context);

    if (!input.serviceId.trim()) {
      throw new Error(
        "Burn-rate controller serviceId is required."
      );
    }

    if (!input.sloId.trim()) {
      throw new Error(
        "Burn-rate controller sloId is required."
      );
    }

    if (!input.errorBudgetId.trim()) {
      throw new Error(
        "Burn-rate controller errorBudgetId is required."
      );
    }

    const warningThreshold =
      input.warningThreshold ?? 1;

    const criticalThreshold =
      input.criticalThreshold ?? 2;

    const exhaustionWindowSeconds =
      input.exhaustionWindowSeconds ?? 3600;

    this.validateThreshold(
      warningThreshold,
      "warningThreshold"
    );

    this.validateThreshold(
      criticalThreshold,
      "criticalThreshold"
    );

    if (
      criticalThreshold <
      warningThreshold
    ) {
      throw new Error(
        "criticalThreshold cannot be lower than warningThreshold."
      );
    }

    if (
      !Number.isFinite(
        exhaustionWindowSeconds
      ) ||
      exhaustionWindowSeconds <= 0
    ) {
      throw new Error(
        "exhaustionWindowSeconds must be greater than zero."
      );
    }

    const recordId =
      input.id ??
      this.createId(
        "BURN-RATE-CONTROLLER"
      );

    await this.requireAuthorized(
      context,
      "REGISTER_BURN_RATE_CONTROLLER",
      recordId,
      input.serviceId,
      input.criticality
    );

    const now =
      this.now();

    const record:
      SovereignBurnRateControllerRecord = {
      id: recordId,

      serviceId:
        input.serviceId,

      sloId:
        input.sloId,

      errorBudgetId:
        input.errorBudgetId,

      burnRateRecordId:
        input.burnRateRecordId,

      criticality:
        input.criticality,

      status:
        "REGISTERED",

      warningThreshold,

      criticalThreshold,

      exhaustionWindowSeconds,

      windows:
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
      "burn-rate-controller.registered",
      record,
      {
        warningThreshold:
          record.warningThreshold,

        criticalThreshold:
          record.criticalThreshold,
      }
    );

    await this.recordAudit(
      "burn-rate-controller.register",
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
    context: SovereignBurnRateControllerContext
  ): Promise<SovereignBurnRateControllerRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "EVALUATE_BURN_RATE_CONTROLLER",
      record.id,
      record.serviceId,
      record.criticality
    );

    if (
      record.status === "ARCHIVED"
    ) {
      throw new Error(
        "Archived burn-rate controller cannot be evaluated."
      );
    }

    if (
      record.status === "PAUSED"
    ) {
      throw new Error(
        "Paused burn-rate controller cannot be evaluated."
      );
    }

    this.acquire(record.id);

    record.status =
      "EVALUATING";

    record.updatedAt =
      this.now();

    await this.requireStore()
      .saveRecord(record);

    try {
      const result =
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

            burnRateRecordId:
              record.burnRateRecordId,

            context,
          });

      this.validatePercent(
        result.remainingBudgetPercent,
        "remainingBudgetPercent"
      );

      if (
        result.windows.length === 0
      ) {
        throw new Error(
          "Burn-rate controller requires at least one measurement window."
        );
      }

      record.windows =
        result.windows.map(
          (window) =>
            this.validateAndCreateWindow(
              window
            )
        );

      const highestBurnRate =
        Math.max(
          ...record.windows.map(
            (window) =>
              window.burnRate
          )
        );

      const reasons:
        string[] = [];

      let recommendedAction:
        SovereignBurnRateAction =
          "NONE";

      let status:
        SovereignBurnRateControllerStatus =
          "HEALTHY";

      if (
        result.remainingBudgetPercent <= 0
      ) {
        status =
          "EXHAUSTION_IMMINENT";

        recommendedAction =
          "ESCALATE";

        reasons.push(
          "ERROR_BUDGET_EXHAUSTED"
        );
      } else if (
        result.projectedExhaustionSeconds !==
          undefined &&
        result.projectedExhaustionSeconds <=
          record.exhaustionWindowSeconds
      ) {
        status =
          "EXHAUSTION_IMMINENT";

        recommendedAction =
          "FREEZE_NON_CRITICAL_CHANGE";

        reasons.push(
          "PROJECTED_ERROR_BUDGET_EXHAUSTION"
        );
      } else if (
        highestBurnRate >=
        record.criticalThreshold
      ) {
        status =
          "CRITICAL";

        recommendedAction =
          "FREEZE_NON_CRITICAL_CHANGE";

        reasons.push(
          "CRITICAL_BURN_RATE"
        );
      } else if (
        highestBurnRate >=
        record.warningThreshold
      ) {
        status =
          "WARNING";

        recommendedAction =
          "RESTRICT_RISKY_CHANGE";

        reasons.push(
          "ELEVATED_BURN_RATE"
        );
      } else {
        status =
          "HEALTHY";

        recommendedAction =
          "OBSERVE";
      }

      const unverified =
        record.windows.filter(
          (window) =>
            !window.verified
        );

      if (
        unverified.length > 0
      ) {
        reasons.push(
          "UNVERIFIED_MEASUREMENT_EVIDENCE"
        );

        if (
          status === "HEALTHY"
        ) {
          status =
            "WARNING";

          recommendedAction =
            "RESTRICT_RISKY_CHANGE";
        }
      }

      record.status =
        status;

      record.assessment = {
        highestBurnRate,

        remainingBudgetPercent:
          result.remainingBudgetPercent,

        projectedExhaustionSeconds:
          result.projectedExhaustionSeconds,

        recommendedAction,

        reasons:
          [
            ...new Set(
              reasons
            ),
          ],

        assessedAt:
          this.now(),
      };

      record.evaluatedBy =
        context.actorId;

      record.evaluatedAt =
        this.now();

      record.updatedAt =
        this.now();

      await this.requireStore()
        .saveRecord(record);

      await this.publishEvent(
        "burn-rate-controller.evaluated",
        record,
        {
          status:
            record.status,

          assessment:
            record.assessment,
        }
      );

      await this.recordAudit(
        "burn-rate-controller.evaluate",
        record.id,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          status:
            record.status,

          recommendedAction:
            record.assessment
              .recommendedAction,
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
        "burn-rate-controller.evaluate",
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

  async pause(
    recordId: string,
    context: SovereignBurnRateControllerContext
  ): Promise<SovereignBurnRateControllerRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "PAUSE_BURN_RATE_CONTROLLER",
      record.id,
      record.serviceId,
      record.criticality
    );

    if (
      record.status === "ARCHIVED"
    ) {
      throw new Error(
        "Archived burn-rate controller cannot be paused."
      );
    }

    if (
      record.status === "EVALUATING"
    ) {
      throw new Error(
        "Active burn-rate evaluation cannot be paused."
      );
    }

    record.status =
      "PAUSED";

    record.pausedAt =
      this.now();

    record.updatedAt =
      this.now();

    await this.requireStore()
      .saveRecord(record);

    await this.publishEvent(
      "burn-rate-controller.paused",
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
    context: SovereignBurnRateControllerContext
  ): Promise<SovereignBurnRateControllerRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "READ_BURN_RATE_CONTROLLER",
      record.id,
      record.serviceId,
      record.criticality
    );

    return record;
  }

  async listRecords(
    context: SovereignBurnRateControllerContext,
    limit = 100
  ): Promise<SovereignBurnRateControllerRecord[]> {
    this.requireContext(context);

    await this.requireAuthorized(
      context,
      "READ_BURN_RATE_CONTROLLER"
    );

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000
    ) {
      throw new Error(
        "Burn-rate controller limit must be between 1 and 1000."
      );
    }

    return this.requireStore()
      .listRecords(limit);
  }

  async archive(
    recordId: string,
    context: SovereignBurnRateControllerContext
  ): Promise<SovereignBurnRateControllerRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "ARCHIVE_BURN_RATE_CONTROLLER",
      record.id,
      record.serviceId,
      record.criticality
    );

    if (
      record.status === "EVALUATING"
    ) {
      throw new Error(
        "Active burn-rate controller cannot be archived."
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
      "burn-rate-controller.archived",
      record,
      {
        actorId:
          context.actorId,
      }
    );

    return record;
  }

  private validateAndCreateWindow(
    input: {
      name: string;

      durationSeconds: number;

      burnRate: number;

      measuredAt: string;

      verified: boolean;

      evidence?: Record<string, unknown>;
    }
  ): SovereignBurnRateControllerWindow {
    if (!input.name.trim()) {
      throw new Error(
        "Burn-rate controller window name is required."
      );
    }

    if (
      !Number.isFinite(
        input.durationSeconds
      ) ||
      input.durationSeconds <= 0
    ) {
      throw new Error(
        "Burn-rate controller durationSeconds must be greater than zero."
      );
    }

    if (
      !Number.isFinite(
        input.burnRate
      ) ||
      input.burnRate < 0
    ) {
      throw new Error(
        "Burn-rate value must be zero or greater."
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

    return {
      id:
        this.createId(
          "BURN-RATE-CONTROLLER-WINDOW"
        ),

      name:
        input.name,

      durationSeconds:
        input.durationSeconds,

      burnRate:
        input.burnRate,

      measuredAt:
        input.measuredAt,

      verified:
        input.verified,

      evidence:
        input.evidence,
    };
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

  private validateThreshold(
    value: number,
    field: string
  ): void {
    if (
      !Number.isFinite(value) ||
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
        "Burn-rate controller evaluation is already running."
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
    context: SovereignBur

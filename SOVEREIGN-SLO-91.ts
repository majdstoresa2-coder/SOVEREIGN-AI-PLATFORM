/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-SLO-91
 * ============================================================
 *
 * Sovereign Service Level Objective Engine.
 *
 * Responsibilities:
 * - Define sovereign service-level objectives.
 * - Measure objective compliance.
 * - Track objective achievement over time.
 * - Detect objective degradation and violations.
 * - Preserve objective evidence.
 * - Prevent false objective-compliance declarations.
 *
 * SLO ENGINE IS NOT AUTHORITY.
 * SLO ENGINE DOES NOT OVERRIDE OWNER.
 * SLO ENGINE DOES NOT GRANT PRIVILEGES.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignSLOStatus =
  | "REGISTERED"
  | "EVALUATING"
  | "ACHIEVED"
  | "AT_RISK"
  | "VIOLATED"
  | "FAILED"
  | "ARCHIVED";

export type SovereignSLOCriticality =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignSLOMetric =
  | "AVAILABILITY"
  | "RELIABILITY"
  | "LATENCY"
  | "ERROR_RATE"
  | "SUCCESS_RATE"
  | "THROUGHPUT";

export type SovereignSLOComparator =
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN_OR_EQUAL";

export interface SovereignSLOObjective {
  id: string;

  name: string;

  metric: SovereignSLOMetric;

  comparator: SovereignSLOComparator;

  target: number;

  weight: number;

  required: boolean;

  achieved: boolean;

  actual?: number;

  evaluatedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignSLORecord {
  id: string;

  serviceId: string;

  criticality: SovereignSLOCriticality;

  status: SovereignSLOStatus;

  objectives: SovereignSLOObjective[];

  achievementScore: number;

  requiredObjectivesPassed: boolean;

  violatedObjectiveIds: string[];

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

export interface SovereignSLOContext {
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

export interface SovereignSLOStore {
  saveRecord(
    record: SovereignSLORecord
  ): Promise<void>;

  getRecord(
    recordId: string
  ): Promise<SovereignSLORecord | undefined>;

  listRecords(
    limit?: number
  ): Promise<SovereignSLORecord[]>;
}

export interface SovereignSLOMetricsBridge {
  measure(input: {
    recordId: string;

    serviceId: string;

    metric: SovereignSLOMetric;

    context: SovereignSLOContext;
  }): Promise<{
    value: number;

    measuredAt: string;

    evidence?: Record<string, unknown>;
  }>;
}

export interface SovereignSLOPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignSLOContext["authority"];

    operation:
      | "REGISTER_SLO"
      | "EVALUATE_SLO"
      | "READ_SLO"
      | "ARCHIVE_SLO";

    recordId?: string;
    serviceId?: string;

    criticality?: SovereignSLOCriticality;
  }): Promise<{
    allowed: boolean;
    reason?: string;
  }>;
}

export interface SovereignSLOEventBridge {
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

export interface SovereignSLOAudit {
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

export class SovereignSLOEngine {
  public readonly id =
    "SOVEREIGN-SLO-91";

  public readonly version =
    "1.0.0";

  private store?: SovereignSLOStore;

  private metricsBridge?: SovereignSLOMetricsBridge;

  private policyBridge?: SovereignSLOPolicyBridge;

  private eventBridge?: SovereignSLOEventBridge;

  private audit?: SovereignSLOAudit;

  private processing =
    new Set<string>();

  setStore(
    store: SovereignSLOStore
  ): void {
    this.store = store;
  }

  setMetricsBridge(
    bridge: SovereignSLOMetricsBridge
  ): void {
    this.metricsBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignSLOPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignSLOEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignSLOAudit
  ): void {
    this.audit = audit;
  }

  async register(
    input: {
      id?: string;

      serviceId: string;

      criticality:
        SovereignSLOCriticality;

      objectives: Array<{
        id?: string;

        name: string;

        metric: SovereignSLOMetric;

        comparator:
          SovereignSLOComparator;

        target: number;

        weight: number;

        required: boolean;

        metadata?: Record<string, unknown>;
      }>;

      correlationId?: string;
      causationId?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignSLOContext
  ): Promise<SovereignSLORecord> {
    this.requireContext(context);

    if (!input.serviceId.trim()) {
      throw new Error(
        "SLO serviceId is required."
      );
    }

    if (input.objectives.length === 0) {
      throw new Error(
        "SLO requires at least one objective."
      );
    }

    const totalWeight =
      input.objectives.reduce(
        (sum, objective) =>
          sum + objective.weight,
        0
      );

    if (
      !Number.isFinite(totalWeight) ||
      totalWeight <= 0
    ) {
      throw new Error(
        "SLO objective weights must total more than zero."
      );
    }

    for (
      const objective of
      input.objectives
    ) {
      this.validateObjective(
        objective
      );
    }

    const recordId =
      input.id ??
      this.createId("SLO");

    await this.requireAuthorized(
      context,
      "REGISTER_SLO",
      recordId,
      input.serviceId,
      input.criticality
    );

    const now = this.now();

    const record: SovereignSLORecord = {
      id: recordId,

      serviceId:
        input.serviceId,

      criticality:
        input.criticality,

      status:
        "REGISTERED",

      objectives:
        input.objectives.map(
          (objective) => ({
            id:
              objective.id ??
              this.createId(
                "SLO-OBJECTIVE"
              ),

            name:
              objective.name,

            metric:
              objective.metric,

            comparator:
              objective.comparator,

            target:
              objective.target,

            weight:
              objective.weight,

            required:
              objective.required,

            achieved:
              false,

            metadata:
              objective.metadata,
          })
        ),

      achievementScore:
        0,

      requiredObjectivesPassed:
        false,

      violatedObjectiveIds:
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
      "slo.registered",
      record,
      {
        objectiveCount:
          record.objectives.length,
      }
    );

    await this.recordAudit(
      "slo.register",
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
    context: SovereignSLOContext
  ): Promise<SovereignSLORecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "EVALUATE_SLO",
      record.id,
      record.serviceId,
      record.criticality
    );

    if (
      record.status === "ARCHIVED"
    ) {
      throw new Error(
        "Archived SLO cannot be evaluated."
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
      for (
        const objective of
        record.objectives
      ) {
        const result =
          await this.requireMetricsBridge()
            .measure({
              recordId:
                record.id,

              serviceId:
                record.serviceId,

              metric:
                objective.metric,

              context,
            });

        if (
          !Number.isFinite(
            result.value
          )
        ) {
          throw new Error(
            `Invalid SLO metric value: ${objective.metric}`
          );
        }

        objective.actual =
          result.value;

        objective.evaluatedAt =
          result.measuredAt;

        objective.achieved =
          this.evaluateObjective(
            objective.comparator,
            result.value,
            objective.target
          );

        if (result.evidence) {
          objective.metadata = {
            ...objective.metadata,

            evidence:
              result.evidence,
          };
        }
      }

      const totalWeight =
        record.objectives.reduce(
          (sum, objective) =>
            sum +
            objective.weight,
          0
        );

      const achievedWeight =
        record.objectives
          .filter(
            (objective) =>
              objective.achieved
          )
          .reduce(
            (sum, objective) =>
              sum +
              objective.weight,
            0
          );

      record.achievementScore =
        Number(
          (
            (
              achievedWeight /
              totalWeight
            ) *
            100
          ).toFixed(2)
        );

      const requiredObjectives =
        record.objectives.filter(
          (objective) =>
            objective.required
        );

      record.requiredObjectivesPassed =
        requiredObjectives.every(
          (objective) =>
            objective.achieved
        );

      record.violatedObjectiveIds =
        record.objectives
          .filter(
            (objective) =>
              !objective.achieved
          )
          .map(
            (objective) =>
              objective.id
          );

      if (
        record.requiredObjectivesPassed &&
        record.achievementScore === 100
      ) {
        record.status =
          "ACHIEVED";
      } else if (
        record.requiredObjectivesPassed &&
        record.achievementScore >= 80
      ) {
        record.status =
          "AT_RISK";
      } else {
        record.status =
          "VIOLATED";
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
        "slo.evaluated",
        record,
        {
          status:
            record.status,

          achievementScore:
            record.achievementScore,

          requiredObjectivesPassed:
            record.requiredObjectivesPassed,

          violatedObjectiveIds:
            record.violatedObjectiveIds,
        }
      );

      await this.recordAudit(
        "slo.evaluate",
        record.id,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          status:
            record.status,

          achievementScore:
            record.achievementScore,
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
        "slo.evaluate",
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
    context: SovereignSLOContext
  ): Promise<SovereignSLORecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "READ_SLO",
      record.id,
      record.serviceId,
      record.criticality
    );

    return record;
  }

  async listRecords(
    context: SovereignSLOContext,
    limit = 100
  ): Promise<SovereignSLORecord[]> {
    this.requireContext(context);

    await this.requireAuthorized(
      context,
      "READ_SLO"
    );

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000
    ) {
      throw new Error(
        "SLO limit must be between 1 and 1000."
      );
    }

    return this.requireStore()
      .listRecords(limit);
  }

  async archive(
    recordId: string,
    context: SovereignSLOContext
  ): Promise<SovereignSLORecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "ARCHIVE_SLO",
      record.id,
      record.serviceId,
      record.criticality
    );

    if (
      record.status ===
      "EVALUATING"
    ) {
      throw new Error(
        "Active SLO evaluation cannot be archived."
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
      "slo.archived",
      record,
      {
        actorId:
          context.actorId,
      }
    );

    return record;
  }

  private validateObjective(
    objective: {
      name: string;
      metric: SovereignSLOMetric;
      comparator: SovereignSLOComparator;
      target: number;
      weight: number;
      required: boolean;
    }
  ): void {
    if (!objective.name.trim()) {
      throw new Error(
        "SLO objective name is required."
      );
    }

    if (
      !Number.isFinite(
        objective.target
      )
    ) {
      throw new Error(
        "SLO objective target must be finite."
      );
    }

    if (
      !Number.isFinite(
        objective.weight
      ) ||
      objective.weight <= 0
    ) {
      throw new Error(
        "SLO objective weight must be greater than zero."
      );
    }
  }

  private evaluateObjective(
    comparator:
      SovereignSLOComparator,
    actual: number,
    target: number
  ): boolean {
    if (
      comparator ===
      "GREATER_THAN_OR_EQUAL"
    ) {
      return actual >= target;
    }

    return actual <= target;
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
        "SLO evaluation is already running."
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
    context: SovereignSLOContext,
    operation:
      | "REGISTER_SLO"
      | "EVALUATE_SLO"
      | "READ_SLO"
      | "ARCHIVE_SLO",
    recordId?: string,
    serviceId?: string,
    criticality?:
      SovereignSLOCriticality
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
        `slo.${operation.toLowerCase()}`,
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
        `SLO operation denied: ${operation}`
      );
    }
  }

  private requireContext(
    context: SovereignSLOContext
  ): void {
    if (!context.authenticated) {
      throw new Error(
        "SLO requires authentication."
      );
    }

    if (!context.policyChecked) {
      throw new Error(
        "SLO requires policy verification."
      );
    }

    if (!context.securityChecked) {
      throw new Error(
        "SLO requires security verification."
      );
    }

    if (
      !context.authorizationChecked
    ) {
      throw new Error(
        "SLO requires authorization verification."
      );
    }
  }

  private requireStore():
    SovereignSLOStore {
    if (!this.store) {
      throw new Error(
        "Sovereign SLO store is not configured."
      );
    }

    return this.store;
  }

  private requireMetricsBridge():
    SovereignSLOMetricsBridge {
    if (!this.metricsBridge) {
      throw new Error(
        "Sovereign SLO metrics bridge is not configured."
      );
    }

    return this.metricsBridge;
  }

  private requirePolicyBridge():
    SovereignSLOPolicyBridge {
    if (!this.policyBridge) {
      throw new Error(
        "Sovereign SLO policy bridge is not configured."
      );
    }

    return this.policyBridge;
  }

  private async requireRecord(
    recordId: string
  ): Promise<SovereignSLORecord> {
    const record =
      await this.requireStore()
        .getRecord(recordId);

    if (!record) {
      throw new Error(
        `SLO record not found: ${recordId}`
      );
    }

    return record;
  }

  private async publishEvent(
    type: string,
    record: SovereignSLORecord,
    payload: Record<string, unknown>
  ): Promise<void> {
    if (!this.eventBridge) {
      return;
    }

    await this.eventBridge.publish({
      id:
        this.createId(
          "SLO-EVENT"
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

export function createSovereignSLOEngine():
  SovereignSLOEngine {
  return new SovereignSLOEngine();
}

export const SOVEREIGN_SLO_CONTRACT = {
  id:
    "SOVEREIGN-SLO-91",

  role:
    "CENTRAL_SOVEREIGN_SLO_ENGINE",

  authority:
    "NONE",

  ownerAuthority:
    "SUPREME",

  stewardAuthority:
    "DELEGATED",

  slaIntegrated:
    true,

  availabilityObjectives:
    true,

  reliabilityObjectives:
    true,

  latencyObjectives:
    true,

  errorRateObjectives:
    true,

  successRateObjectives:
    true,

  throughputObjectives:
    true,

  weightedObjectives:
    true,

  requiredObjectiveEnforcement:
    true,

  

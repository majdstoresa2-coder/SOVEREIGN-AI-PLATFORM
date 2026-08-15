/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-SLI-92
 * ============================================================
 *
 * Sovereign Service Level Indicator Engine.
 *
 * Responsibilities:
 * - Define sovereign service-level indicators.
 * - Collect measurable operational evidence.
 * - Validate indicator measurements.
 * - Calculate normalized indicator values.
 * - Feed trusted measurements into SLO evaluation.
 * - Prevent fabricated or invalid measurements.
 *
 * SLI ENGINE IS NOT AUTHORITY.
 * SLI ENGINE DOES NOT OVERRIDE OWNER.
 * SLI ENGINE DOES NOT GRANT PRIVILEGES.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignSLIStatus =
  | "REGISTERED"
  | "MEASURING"
  | "VALID"
  | "DEGRADED"
  | "INVALID"
  | "FAILED"
  | "ARCHIVED";

export type SovereignSLICriticality =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignSLIMetric =
  | "AVAILABILITY"
  | "RELIABILITY"
  | "LATENCY"
  | "ERROR_RATE"
  | "SUCCESS_RATE"
  | "THROUGHPUT";

export interface SovereignSLIMeasurement {
  value: number;

  sampleCount: number;

  observationWindowSeconds: number;

  measuredAt: string;

  sourceId: string;

  verified: boolean;

  evidence?: Record<string, unknown>;
}

export interface SovereignSLIRecord {
  id: string;

  serviceId: string;

  name: string;

  metric: SovereignSLIMetric;

  criticality: SovereignSLICriticality;

  status: SovereignSLIStatus;

  measurement?: SovereignSLIMeasurement;

  minimumSampleCount: number;

  maximumMeasurementAgeSeconds: number;

  createdBy: string;
  measuredBy?: string;

  correlationId?: string;
  causationId?: string;

  createdAt: string;
  updatedAt: string;

  measuredAt?: string;
  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignSLIContext {
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

export interface SovereignSLIStore {
  saveRecord(
    record: SovereignSLIRecord
  ): Promise<void>;

  getRecord(
    recordId: string
  ): Promise<SovereignSLIRecord | undefined>;

  listRecords(
    limit?: number
  ): Promise<SovereignSLIRecord[]>;
}

export interface SovereignSLIMetricsBridge {
  measure(input: {
    recordId: string;

    serviceId: string;

    metric: SovereignSLIMetric;

    context: SovereignSLIContext;
  }): Promise<SovereignSLIMeasurement>;
}

export interface SovereignSLIPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignSLIContext["authority"];

    operation:
      | "REGISTER_SLI"
      | "MEASURE_SLI"
      | "READ_SLI"
      | "ARCHIVE_SLI";

    recordId?: string;
    serviceId?: string;

    criticality?: SovereignSLICriticality;
  }): Promise<{
    allowed: boolean;
    reason?: string;
  }>;
}

export interface SovereignSLIEventBridge {
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

export interface SovereignSLIAudit {
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

export class SovereignSLIEngine {
  public readonly id =
    "SOVEREIGN-SLI-92";

  public readonly version =
    "1.0.0";

  private store?: SovereignSLIStore;

  private metricsBridge?: SovereignSLIMetricsBridge;

  private policyBridge?: SovereignSLIPolicyBridge;

  private eventBridge?: SovereignSLIEventBridge;

  private audit?: SovereignSLIAudit;

  private processing =
    new Set<string>();

  setStore(
    store: SovereignSLIStore
  ): void {
    this.store = store;
  }

  setMetricsBridge(
    bridge: SovereignSLIMetricsBridge
  ): void {
    this.metricsBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignSLIPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignSLIEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignSLIAudit
  ): void {
    this.audit = audit;
  }

  async register(
    input: {
      id?: string;

      serviceId: string;

      name: string;

      metric: SovereignSLIMetric;

      criticality:
        SovereignSLICriticality;

      minimumSampleCount: number;

      maximumMeasurementAgeSeconds: number;

      correlationId?: string;
      causationId?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignSLIContext
  ): Promise<SovereignSLIRecord> {
    this.requireContext(context);

    if (!input.serviceId.trim()) {
      throw new Error(
        "SLI serviceId is required."
      );
    }

    if (!input.name.trim()) {
      throw new Error(
        "SLI name is required."
      );
    }

    if (
      !Number.isInteger(
        input.minimumSampleCount
      ) ||
      input.minimumSampleCount < 1
    ) {
      throw new Error(
        "SLI minimumSampleCount must be at least 1."
      );
    }

    if (
      !Number.isFinite(
        input.maximumMeasurementAgeSeconds
      ) ||
      input.maximumMeasurementAgeSeconds <= 0
    ) {
      throw new Error(
        "SLI maximumMeasurementAgeSeconds must be greater than zero."
      );
    }

    const recordId =
      input.id ??
      this.createId("SLI");

    await this.requireAuthorized(
      context,
      "REGISTER_SLI",
      recordId,
      input.serviceId,
      input.criticality
    );

    const now = this.now();

    const record: SovereignSLIRecord = {
      id: recordId,

      serviceId:
        input.serviceId,

      name:
        input.name,

      metric:
        input.metric,

      criticality:
        input.criticality,

      status:
        "REGISTERED",

      minimumSampleCount:
        input.minimumSampleCount,

      maximumMeasurementAgeSeconds:
        input.maximumMeasurementAgeSeconds,

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
      "sli.registered",
      record,
      {
        metric:
          record.metric,

        minimumSampleCount:
          record.minimumSampleCount,
      }
    );

    await this.recordAudit(
      "sli.register",
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

  async measure(
    recordId: string,
    context: SovereignSLIContext
  ): Promise<SovereignSLIRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "MEASURE_SLI",
      record.id,
      record.serviceId,
      record.criticality
    );

    if (
      record.status === "ARCHIVED"
    ) {
      throw new Error(
        "Archived SLI cannot be measured."
      );
    }

    this.acquire(record.id);

    record.status =
      "MEASURING";

    record.updatedAt =
      this.now();

    await this.requireStore()
      .saveRecord(record);

    try {
      const measurement =
        await this.requireMetricsBridge()
          .measure({
            recordId:
              record.id,

            serviceId:
              record.serviceId,

            metric:
              record.metric,

            context,
          });

      this.validateMeasurement(
        measurement,
        record
      );

      record.measurement =
        measurement;

      record.measuredBy =
        context.actorId;

      record.measuredAt =
        this.now();

      record.updatedAt =
        this.now();

      if (!measurement.verified) {
        record.status =
          "INVALID";
      } else if (
        measurement.sampleCount <
        record.minimumSampleCount
      ) {
        record.status =
          "DEGRADED";
      } else {
        record.status =
          "VALID";
      }

      await this.requireStore()
        .saveRecord(record);

      await this.publishEvent(
        "sli.measured",
        record,
        {
          status:
            record.status,

          metric:
            record.metric,

          value:
            measurement.value,

          sampleCount:
            measurement.sampleCount,

          verified:
            measurement.verified,
        }
      );

      await this.recordAudit(
        "sli.measure",
        record.id,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          status:
            record.status,

          value:
            measurement.value,
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
        "sli.measure",
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
    context: SovereignSLIContext
  ): Promise<SovereignSLIRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "READ_SLI",
      record.id,
      record.serviceId,
      record.criticality
    );

    return record;
  }

  async listRecords(
    context: SovereignSLIContext,
    limit = 100
  ): Promise<SovereignSLIRecord[]> {
    this.requireContext(context);

    await this.requireAuthorized(
      context,
      "READ_SLI"
    );

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000
    ) {
      throw new Error(
        "SLI limit must be between 1 and 1000."
      );
    }

    return this.requireStore()
      .listRecords(limit);
  }

  async archive(
    recordId: string,
    context: SovereignSLIContext
  ): Promise<SovereignSLIRecord> {
    this.requireContext(context);

    const record =
      await this.requireRecord(
        recordId
      );

    await this.requireAuthorized(
      context,
      "ARCHIVE_SLI",
      record.id,
      record.serviceId,
      record.criticality
    );

    if (
      record.status === "MEASURING"
    ) {
      throw new Error(
        "Active SLI measurement cannot be archived."
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
      "sli.archived",
      record,
      {
        actorId:
          context.actorId,
      }
    );

    return record;
  }

  private validateMeasurement(
    measurement:
      SovereignSLIMeasurement,
    record:
      SovereignSLIRecord
  ): void {
    if (
      !Number.isFinite(
        measurement.value
      )
    ) {
      throw new Error(
        "SLI measurement value must be finite."
      );
    }

    if (
      !Number.isInteger(
        measurement.sampleCount
      ) ||
      measurement.sampleCount < 0
    ) {
      throw new Error(
        "SLI sampleCount must be a non-negative integer."
      );
    }

    if (
      !Number.isFinite(
        measurement.observationWindowSeconds
      ) ||
      measurement.observationWindowSeconds <= 0
    ) {
      throw new Error(
        "SLI observationWindowSeconds must be greater than zero."
      );
    }

    if (!measurement.sourceId.trim()) {
      throw new Error(
        "SLI measurement sourceId is required."
      );
    }

    const measuredTime =
      new Date(
        measurement.measuredAt
      ).getTime();

    if (
      !Number.isFinite(
        measuredTime
      )
    ) {
      throw new Error(
        "SLI measuredAt is invalid."
      );
    }

    const ageSeconds =
      (
        Date.now() -
        measuredTime
      ) / 1000;

    if (ageSeconds < 0) {
      throw new Error(
        "SLI measurement cannot originate in the future."
      );
    }

    if (
      ageSeconds >
      record.maximumMeasurementAgeSeconds
    ) {
      throw new Error(
        "SLI measurement is stale."
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
        "SLI measurement is already running."
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
    context: SovereignSLIContext,
    operation:
      | "REGISTER_SLI"
      | "MEASURE_SLI"
      | "READ_SLI"
      | "ARCHIVE_SLI",
    recordId?: string,
    serviceId?: string,
    criticality?:
      SovereignSLICriticality
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
        `sli.${operation.toLowerCase()}`,
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
        `SLI operation denied: ${operation}`
      );
    }
  }

  private requireContext(
    context: SovereignSLIContext
  ): void {
    if (!context.authenticated) {
      throw new Error(
        "SLI requires authentication."
      );
    }

    if (!context.policyChecked) {
      throw new Error(
        "SLI requires policy verification."
      );
    }

    if (!context.securityChecked) {
      throw new Error(
        "SLI requires security verification."
      );
    }

    if (
      !context.authorizationChecked
    ) {
      throw new Error(
        "SLI requires authorization verification."
      );
    }
  }

  private requireStore():
    SovereignSLIStore {
    if (!this.store) {
      throw new Error(
        "Sovereign SLI store is not configured."
      );
    }

    return this.store;
  }

  private requireMetricsBridge():
    SovereignSLIMetricsBridge {
    if (!this.metricsBridge) {
      throw new Error(
        "Sovereign SLI metrics bridge is not configured."
      );
    }

    return this.metricsBridge;
  }

  private requirePolicyBridge():
    SovereignSLIPolicyBridge {
    if (!this.policyBridge) {
      throw new Error(
        "Sovereign SLI policy bridge is not configured."
      );
    }

    return this.policyBridge;
  }

  private async requireRecord(
    recordId: string
  ): Promise<SovereignSLIRecord> {
    const record =
      await this.requireStore()
        .getRecord(recordId);

    if (!record) {
      throw new Error(
        `SLI record not found: ${recordId}`
      );
    }

    return record;
  }

  private async publishEvent(
    type: string,
    record: SovereignSLIRecord,
    payload: Record<string, unknown>
  ): Promise<void> {
    if (!this.eventBridge) {
      return;
    }

    await this.eventBridge.publish({
      id:
        this.createId(
          "SLI-EVENT"
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

export function createSovereignSLIEngine():
  SovereignSLIEngine {
  return new SovereignSLIEngine();
}

export const SOVEREIGN_SLI_CONTRACT = {
  id:
    "SOVEREIGN-SLI-92",

  role:
    "CENTRAL_SOVEREIGN_SLI_ENGINE",

  authority:
    "NONE",

  ownerAuthority:
    "SUPREME",

  stewardAuthority:
    "DELEGATED",

  sloIntegrated:
    true,

  availabilityMeasurement:
    true,

  reliabilityMeasurement:
    true,

  latencyMeasurement:
    true,

  errorRateMeasurement:
    true,

  successRateMeasurement:
    true,

  throughputMeasurement:
    true,

  evidenceVerification:
    true,

  staleMeasurementDetection:
    true,

  sampleValidation:
    true,

  falseMeasurementBlocked:
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

  sliCanCreateAuthority:
    false,

  sliCanOverrideOwner:
    false,

  stewardCanOverrideOwner:
    false,

  externalSLISaaSRequired:
    false,

  status:
    "FOUNDATION",
} as const;

/* ============================================================
 * END OF SOVEREIGN-SLI-92
 * ============================================================
 */

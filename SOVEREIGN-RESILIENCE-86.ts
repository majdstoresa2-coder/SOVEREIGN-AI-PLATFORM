/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-RESILIENCE-86
 * ============================================================
 *
 * Sovereign Resilience Engine.
 *
 * Responsibilities:
 * - Measure sovereign service resilience.
 * - Evaluate continuity, failover, redundancy,
 *   replication and recovery readiness.
 * - Detect resilience weaknesses.
 * - Block false readiness declarations.
 * - Produce resilience assessments.
 *
 * RESILIENCE ENGINE IS NOT AUTHORITY.
 * RESILIENCE ENGINE DOES NOT OVERRIDE OWNER.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignResilienceStatus =
  | "CREATED"
  | "ASSESSING"
  | "RESILIENT"
  | "DEGRADED"
  | "CRITICAL"
  | "FAILED"
  | "ARCHIVED";

export type SovereignResilienceCriticality =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignResilienceSignals {
  continuityReady: boolean;
  failoverReady: boolean;
  redundancyReady: boolean;
  replicationReady: boolean;
  recoveryReady: boolean;

  healthyReplicaCount: number;

  replicationLagSeconds: number;

  recoveryVerified: boolean;

  singlePointOfFailure: boolean;
}

export interface SovereignResilienceAssessment {
  id: string;

  serviceId: string;

  criticality: SovereignResilienceCriticality;

  status: SovereignResilienceStatus;

  score: number;

  signals: SovereignResilienceSignals;

  weaknesses: string[];

  assessedBy?: string;

  correlationId?: string;
  causationId?: string;

  createdAt: string;
  updatedAt: string;
  assessedAt?: string;
  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignResilienceContext {
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

export interface SovereignResilienceStore {
  saveAssessment(
    assessment: SovereignResilienceAssessment
  ): Promise<void>;

  getAssessment(
    assessmentId: string
  ): Promise<SovereignResilienceAssessment | undefined>;

  listAssessments(
    limit?: number
  ): Promise<SovereignResilienceAssessment[]>;
}

export interface SovereignResilienceProbeBridge {
  collect(input: {
    assessmentId: string;
    serviceId: string;
    context: SovereignResilienceContext;
  }): Promise<SovereignResilienceSignals>;
}

export interface SovereignResiliencePolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignResilienceContext["authority"];

    operation:
      | "CREATE_RESILIENCE"
      | "ASSESS_RESILIENCE"
      | "READ_RESILIENCE"
      | "ARCHIVE_RESILIENCE";

    assessmentId?: string;

    serviceId?: string;

    criticality?: SovereignResilienceCriticality;
  }): Promise<{
    allowed: boolean;
    reason?: string;
  }>;
}

export interface SovereignResilienceEventBridge {
  publish(event: {
    id: string;
    type: string;
    source: string;

    assessmentId?: string;
    serviceId?: string;

    timestamp: string;
    correlationId?: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignResilienceAudit {
  record(
    operation: string,
    subjectId: string | undefined,
    result: "SUCCESS" | "FAILED" | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

export class SovereignResilienceEngine {
  public readonly id =
    "SOVEREIGN-RESILIENCE-86";

  public readonly version = "1.0.0";

  private store?: SovereignResilienceStore;

  private probeBridge?: SovereignResilienceProbeBridge;

  private policyBridge?: SovereignResiliencePolicyBridge;

  private eventBridge?: SovereignResilienceEventBridge;

  private audit?: SovereignResilienceAudit;

  private processing = new Set<string>();

  setStore(store: SovereignResilienceStore): void {
    this.store = store;
  }

  setProbeBridge(
    bridge: SovereignResilienceProbeBridge
  ): void {
    this.probeBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignResiliencePolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignResilienceEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(audit: SovereignResilienceAudit): void {
    this.audit = audit;
  }

  async createAssessment(
    input: {
      id?: string;

      serviceId: string;

      criticality: SovereignResilienceCriticality;

      correlationId?: string;
      causationId?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignResilienceContext
  ): Promise<SovereignResilienceAssessment> {
    this.requireContext(context);

    if (!input.serviceId.trim()) {
      throw new Error(
        "Resilience serviceId is required."
      );
    }

    const assessmentId =
      input.id ??
      this.createId("RESILIENCE");

    await this.requireAuthorized(
      context,
      "CREATE_RESILIENCE",
      assessmentId,
      input.serviceId,
      input.criticality
    );

    const now = this.now();

    const assessment: SovereignResilienceAssessment = {
      id: assessmentId,

      serviceId: input.serviceId,

      criticality: input.criticality,

      status: "CREATED",

      score: 0,

      signals: {
        continuityReady: false,
        failoverReady: false,
        redundancyReady: false,
        replicationReady: false,
        recoveryReady: false,
        healthyReplicaCount: 0,
        replicationLagSeconds: 0,
        recoveryVerified: false,
        singlePointOfFailure: true,
      },

      weaknesses: [],

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
      .saveAssessment(assessment);

    await this.publishEvent(
      "resilience.created",
      assessment,
      {
        criticality:
          assessment.criticality,
      }
    );

    return assessment;
  }

  async assess(
    assessmentId: string,
    context: SovereignResilienceContext
  ): Promise<SovereignResilienceAssessment> {
    this.requireContext(context);

    const assessment =
      await this.requireAssessment(
        assessmentId
      );

    await this.requireAuthorized(
      context,
      "ASSESS_RESILIENCE",
      assessment.id,
      assessment.serviceId,
      assessment.criticality
    );

    if (assessment.status === "ARCHIVED") {
      throw new Error(
        "Archived resilience assessment cannot run."
      );
    }

    this.acquire(assessment.id);

    assessment.status = "ASSESSING";
    assessment.updatedAt = this.now();

    await this.requireStore()
      .saveAssessment(assessment);

    try {
      const signals =
        await this.requireProbeBridge()
          .collect({
            assessmentId:
              assessment.id,

            serviceId:
              assessment.serviceId,

            context,
          });

      this.validateSignals(signals);

      assessment.signals = signals;

      const weaknesses: string[] = [];

      if (!signals.continuityReady) {
        weaknesses.push(
          "CONTINUITY_NOT_READY"
        );
      }

      if (!signals.failoverReady) {
        weaknesses.push(
          "FAILOVER_NOT_READY"
        );
      }

      if (!signals.redundancyReady) {
        weaknesses.push(
          "REDUNDANCY_NOT_READY"
        );
      }

      if (!signals.replicationReady) {
        weaknesses.push(
          "REPLICATION_NOT_READY"
        );
      }

      if (!signals.recoveryReady) {
        weaknesses.push(
          "RECOVERY_NOT_READY"
        );
      }

      if (signals.singlePointOfFailure) {
        weaknesses.push(
          "SINGLE_POINT_OF_FAILURE"
        );
      }

      if (signals.healthyReplicaCount < 2) {
        weaknesses.push(
          "INSUFFICIENT_HEALTHY_REPLICAS"
        );
      }

      if (!signals.recoveryVerified) {
        weaknesses.push(
          "RECOVERY_NOT_VERIFIED"
        );
      }

      assessment.weaknesses = weaknesses;

      assessment.score =
        this.calculateScore(signals);

      if (
        assessment.score >= 90 &&
        weaknesses.length === 0
      ) {
        assessment.status =
          "RESILIENT";
      } else if (
        assessment.score >= 60
      ) {
        assessment.status =
          "DEGRADED";
      } else {
        assessment.status =
          "CRITICAL";
      }

      assessment.assessedBy =
        context.actorId;

      assessment.assessedAt =
        this.now();

      assessment.updatedAt =
        this.now();

      await this.requireStore()
        .saveAssessment(assessment);

      await this.publishEvent(
        "resilience.assessed",
        assessment,
        {
          status:
            assessment.status,

          score:
            assessment.score,

          weaknesses:
            assessment.weaknesses,
        }
      );

      await this.recordAudit(
        "resilience.assess",
        assessment.id,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          score:
            assessment.score,

          status:
            assessment.status,
        }
      );

      return assessment;
    } catch (error) {
      assessment.status =
        "FAILED";

      assessment.updatedAt =
        this.now();

      await this.requireStore()
        .saveAssessment(assessment);

      await this.recordAudit(
        "resilience.assess",
        assessment.id,
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
      this.release(assessment.id);
    }
  }

  async getAssessment(
    assessmentId: string,
    context: SovereignResilienceContext
  ): Promise<SovereignResilienceAssessment> {
    this.requireContext(context);

    const assessment =
      await this.requireAssessment(
        assessmentId
      );

    await this.requireAuthorized(
      context,
      "READ_RESILIENCE",
      assessment.id,
      assessment.serviceId,
      assessment.criticality
    );

    return assessment;
  }

  async listAssessments(
    context: SovereignResilienceContext,
    limit = 100
  ): Promise<SovereignResilienceAssessment[]> {
    this.requireContext(context);

    await this.requireAuthorized(
      context,
      "READ_RESILIENCE"
    );

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000
    ) {
      throw new Error(
        "Resilience limit must be between 1 and 1000."
      );
    }

    return this.requireStore()
      .listAssessments(limit);
  }

  async archive(
   

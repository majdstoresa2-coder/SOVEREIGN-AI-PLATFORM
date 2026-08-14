/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-OPTIMIZATION-70
 * ============================================================
 *
 * Sovereign Optimization Engine.
 *
 * Responsibilities:
 * - Optimize accepted sovereign adaptations.
 * - Compare multiple optimization candidates.
 * - Score quality, risk, cost, performance and impact.
 * - Select the strongest eligible candidate.
 * - Preserve evidence and provenance.
 * - Route recommendations to sovereign decision flow.
 *
 * OPTIMIZATION ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignOptimizationStatus =
  | "CREATED"
  | "ANALYZING"
  | "OPTIMIZED"
  | "REJECTED"
  | "ARCHIVED";

export type SovereignOptimizationRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignOptimizationCandidate {
  id: string;

  proposalId: string;

  title: string;

  description: string;

  qualityScore: number;

  performanceScore: number;

  efficiencyScore: number;

  impactScore: number;

  costScore: number;

  riskScore: number;

  confidenceScore: number;

  totalScore: number;

  risk: SovereignOptimizationRisk;

  eligible: boolean;

  requiresOwner: boolean;

  rationale: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignOptimization {
  id: string;

  adaptationId: string;

  learningId: string;

  feedbackId: string;

  resultId: string;

  executionId: string;

  decisionId: string;

  planId?: string;

  strategyId?: string;

  source: string;

  status: SovereignOptimizationStatus;

  candidates: SovereignOptimizationCandidate[];

  selectedCandidateId?: string;

  requestedBy: string;

  optimizedBy?: string;

  correlationId?: string;

  causationId?: string;

  idempotencyKey?: string;

  createdAt: string;

  optimizedAt?: string;

  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignOptimizationContext {
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

  metadata?: Record<string, unknown>;
}

export interface SovereignOptimizationStore {
  saveOptimization(
    optimization: SovereignOptimization
  ): Promise<void>;

  getOptimization(
    optimizationId: string
  ): Promise<SovereignOptimization | undefined>;

  listOptimizations(
    limit?: number
  ): Promise<SovereignOptimization[]>;

  findByAdaptationId?(
    adaptationId: string
  ): Promise<SovereignOptimization | undefined>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignOptimization | undefined>;
}

export interface SovereignOptimizationAdaptationBridge {
  getAdaptation(
    adaptationId: string
  ): Promise<{
    id: string;

    learningId: string;

    feedbackId: string;

    resultId: string;

    executionId: string;

    decisionId: string;

    planId?: string;

    strategyId?: string;

    status:
      | "CREATED"
      | "ANALYZING"
      | "PROPOSED"
      | "ACCEPTED"
      | "REJECTED"
      | "ARCHIVED";

    proposals: Array<{
      id: string;

      target: string;

      title: string;

      description: string;

      rationale: string;

      lessonIds: string[];

      confidence: number;

      expectedImpact: number;

      risk:
        | "LOW"
        | "MEDIUM"
        | "HIGH"
        | "CRITICAL";

      requiresOwner: boolean;

      metadata?: Record<string, unknown>;
    }>;
  }>;
}

export interface SovereignOptimizationAnalysisBridge {
  optimize(input: {
    optimization: SovereignOptimization;

    adaptation: Awaited<
      ReturnType<
        SovereignOptimizationAdaptationBridge["getAdaptation"]
      >
    >;

    context: SovereignOptimizationContext;
  }): Promise<{
    candidates: Array<{
      proposalId: string;

      title: string;

      description: string;

      qualityScore: number;

      performanceScore: number;

      efficiencyScore: number;

      impactScore: number;

      costScore: number;

      riskScore: number;

      confidenceScore: number;

      risk: SovereignOptimizationRisk;

      requiresOwner?: boolean;

      rationale: string;

      metadata?: Record<string, unknown>;
    }>;
  }>;
}

export interface SovereignOptimizationPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignOptimizationContext["authority"];

    operation:
      | "CREATE_OPTIMIZATION"
      | "RUN_OPTIMIZATION"
      | "READ_OPTIMIZATION"
      | "ARCHIVE_OPTIMIZATION";

    optimizationId?: string;

    adaptationId?: string;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

export interface SovereignOptimizationEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    optimizationId?: string;

    adaptationId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignOptimizationAudit {
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

export class SovereignOptimizationEngine {
  public readonly id =
    "SOVEREIGN-OPTIMIZATION-70";

  public readonly version =
    "1.0.0";

  private store?: SovereignOptimizationStore;

  private adaptationBridge?:
    SovereignOptimizationAdaptationBridge;

  private analysisBridge?:
    SovereignOptimizationAnalysisBridge;

  private policyBridge?:
    SovereignOptimizationPolicyBridge;

  private eventBridge?:
    SovereignOptimizationEventBridge;

  private audit?: SovereignOptimizationAudit;

  private optimizing =
    new Set<string>();

  setStore(
    store: SovereignOptimizationStore
  ): void {
    this.store = store;
  }

  setAdaptationBridge(
    bridge: SovereignOptimizationAdaptationBridge
  ): void {
    this.adaptationBridge = bridge;
  }

  setAnalysisBridge(
    bridge: SovereignOptimizationAnalysisBridge
  ): void {
    this.analysisBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignOptimizationPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignOptimizationEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignOptimizationAudit
  ): void {
    this.audit = audit;
  }

  async createOptimization(
    input: {
      id?: string;

      adaptationId: string;

      source: string;

      correlationId?: string;

      causationId?: string;

      idempotencyKey?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignOptimizationContext
  ): Promise<SovereignOptimization> {
    this.requireContext(context);

    if (!input.adaptationId.trim()) {
      throw new Error(
        "Optimization adaptationId is required."
      );
    }

    if (!input.source.trim()) {
      throw new Error(
        "Optimization source is required."
      );
    }

    const adaptation =
      await this.requireAdaptationBridge()
        .getAdaptation(
          input.adaptationId
        );

    if (
      adaptation.status !== "ACCEPTED"
    ) {
      throw new Error(
        `Adaptation is not eligible for optimization: ${adaptation.status}`
      );
    }

    if (
      adaptation.proposals.length === 0
    ) {
      throw new Error(
        "Accepted adaptation contains no proposals."
      );
    }

    const optimizationId =
      input.id ??
      this.createId("OPTIMIZATION");

    await this.requireAuthorized(
      context,
      "CREATE_OPTIMIZATION",
      optimizationId,
      adaptation.id
    );

    if (
      input.idempotencyKey &&
      this.requireStore()
        .findByIdempotencyKey
    ) {
      const existing =
        await this.requireStore()
          .findByIdempotencyKey!(
            input.idempotencyKey
          );

      if (existing) {
        return existing;
      }
    }

    if (
      this.requireStore()
        .findByAdaptationId
    ) {
      const existing =
        await this.requireStore()
          .findByAdaptationId!(
            adaptation.id
          );

      if (existing) {
        return existing;
      }
    }

    const optimization:
      SovereignOptimization = {
      id:
        optimizationId,

      adaptationId:
        adaptation.id,

      learningId:
        adaptation.learningId,

      feedbackId:
        adaptation.feedbackId,

      resultId:
        adaptation.resultId,

      executionId:
        adaptation.executionId,

      decisionId:
        adaptation.decisionId,

      planId:
        adaptation.planId,

      strategyId:
        adaptation.strategyId,

      source:
        input.source,

      status:
        "CREATED",

      candidates:
        [],

      requestedBy:
        context.actorId,

      correlationId:
        input.correlationId,

      causationId:
        input.causationId,

      idempotencyKey:
        input.idempotencyKey,

      createdAt:
        this.now(),

      metadata:
        input.metadata,
    };

    await this.requireStore()
      .saveOptimization(
        optimization
      );

    await this.publishEvent(
      "optimization.created",
      optimization,
      {}
    );

    await this.recordAudit(
      "optimization.create",
      optimization.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,

        adaptationId:
          adaptation.id,
      }
    );

    return optimization;
  }

  async optimize(
    optimizationId: string,
    context: SovereignOptimizationContext
  ): Promise<SovereignOptimization> {
    this.requireContext(context);

    const optimization =
      await this.requireOptimization(
        optimizationId
      );

    if (
      optimization.status ===
      "OPTIMIZED"
    ) {
      return optimization;
    }

    if (
      optimization.status ===
        "REJECTED" ||
      optimization.status ===
        "ARCHIVED"
    ) {
      throw new Error(
        `Optimization cannot run from status: ${optimization.status}`
      );
    }

    await this.requireAuthorized(
      context,
      "RUN_OPTIMIZATION",
      optimization.id,
      optimization.adaptationId
    );

    if (
      this.optimizing.has(
        optimization.id
      )
    ) {
      throw new Error(
        "Optimization is already running."
      );
    }

    this.optimizing.add(
      optimization.id
    );

    optimization.status =
      "ANALYZING";

    await this.requireStore()
      .saveOptimization(
        optimization
      );

    try {
      const adaptation =
        await this.requireAdaptationBridge()
          .getAdaptation(
            optimization.adaptationId
          );

      if (
        adaptation.status !==
        "ACCEPTED"
      ) {
        throw new Error(
          "Optimization source adaptation is no longer ACCEPTED."
        );
      }

      const analysis =
        await this.requireAnalysisBridge()
          .optimize({
            optimization,
            adaptation,
            context,
          });

      const validProposalIds =
        new Set(
          adaptation.proposals.map(
            (proposal) =>
              proposal.id
          )
        );

      optimization.candidates =
        analysis.candidates.map(
          (candidate) => {
            if (
              !validProposalIds.has(
                candidate.proposalId
              )
            ) {
              throw new Error(
                `Unknown optimization proposal: ${candidate.proposalId}`
              );
            }

            this.validateScore(
              candidate.qualityScore,
              "qualityScore"
            );

            this.validateScore(
              candidate.performanceScore,
              "performanceScore"
            );

            this.validateScore(
              candidate.efficiencyScore,
              "efficiencyScore"
            );

            this.validateScore(
              candidate.impactScore,
              "impactScore"
            );

            this.validateScore(
              candidate.costScore,
              "costScore"
            );

            this.validateScore(
              candidate.riskScore,
              "riskScore"
            );

            this.validateScore(
              candidate.confidenceScore,
              "confidenceScore"
            );

            if (
              !candidate.title.trim() ||
              !candidate.description.trim() ||
              !candidate.rationale.trim()
            ) {
              throw new Error(
                "Optimization candidate requires title, description and rationale."
              );
            }

            const totalScore =
              this.calculateTotalScore(
                candidate
              );

            const requiresOwner =
              candidate.requiresOwner ===
                true ||
              candidate.risk ===
                "CRITICAL";

            const eligible =
              candidate.confidenceScore >=
                0.5 &&
              candidate.riskScore <=
                0.85;

            return {
              id:
                this.createId(
                  "OPTIMIZATION-CANDIDATE"
                ),

              proposalId:
                candidate.proposalId,

              title:
                candidate.title,

              description:
                candidate.description,

              qualityScore:
                candidate.qualityScore,

              performanceScore:
                candidate.performanceScore,

              efficiencyScore:
                candidate.efficiencyScore,

              impactScore:
                candidate.impactScore,

              costScore:
                candidate.costScore,

              riskScore:
                candidate.riskScore,

              confidenceScore:
                candidate.confidenceScore,

              totalScore,

              risk:
                candidate.risk,

              eligible,

              requiresOwner,

              rationale:
                candidate.rationale,

              metadata:
                candidate.metadata,
            };
          }
        );

      const eligible =
        optimization.candidates
          .filter(
            (candidate) =>
              candidate.eligible
          )
          .sort(
            (a, b) =>
              b.totalScore -
              a.totalScore
          );

      if (eligible.length === 0) {
        throw new Error(
          "Optimization produced no eligible candidates."
        );
      }

      optimization.selectedCandidateId =
        eligible[0].id;

      optimization.status =
        "OPTIMIZED";

      optimization.optimizedBy =
        context.actorId;

      optimization.optimizedAt =
        this.now();

      await this.requireStore()
        .saveOptimization(
          optimization
        );

      await this.publishEvent(
        "optimization.completed",
        optimization,
        {
          candidates:
            optimization.candidates.length,

          selectedCandidateId:
            optimization.selectedCandidateId,

          selectedScore:
            eligible[0].totalScore,

          requiresOwner:
            eligible[0].requiresOwner,
        }
      );

      await this.recordAudit(
        "optimization.run",
        optimization.id,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          selectedCandidateId:
            optimization.selectedCandidateId,
        }
      );

      return optimization;
    } catch (error) {
      optimization.status =
        "REJECTED";

      await this.requireStore()
        .saveOptimization(
          optimization
        );

      await this.recordAudit(
        "optimization.run",
        optimization.id,
        "FAILED",
        {
          actorId:
            context.actorId,

          error:
            error instanceof Error
              ? error.message
              : String(error),
        }
      );

      throw error;
    } finally {
      this.optimizing.delete(
        optimization.id
      );
    }
  }

  async getSelectedCandidate(
    optimizationId: string,
    context: SovereignOptimizationContext
  ): Promise<SovereignOptimizationCandidate> {
    const optimization =
      await this.getOptimization(
        optimizationId,
        context
      );

    if (
      optimization.status !==
        "OPTIMIZED" ||
      !optimization.selectedCandidateId
    ) {
      throw new Error(
        "Optimization has no selected candidate."
      );
    }

    const candidate =
      optimization.candidates.find(
        (item) =>
          item.id ===
          optimization.selectedCandidateId
      );

    if (!candidate) {
      throw new Error(
        "Selected optimization candidate was not found."
      );
    }

    return candidate;
  }

  async archive(
    optimizationId: string,
    context: SovereignOptimizationContext
  ): Promise<SovereignOptimization> {
    this.requireContext(context);

    const optimization =
      await this.requireOptimization(
        optimizationId
      );

    await this.requireAuthorized(
      context,
      "ARCHIVE_OPTIMIZATION",
      optimization.id,
      optimization.adaptationId
    );

    optimization.status =
      "ARCHIVED";

    optimization.archivedAt =
      this.now();

    await this.requireStore()
      .saveOptimization(
        optimization
      );

    await this.publishEvent(
      "optimization.archived",
      optimization,
      {
        actorId:
          context.actorId,
      }
    );

    return optimization;
  }

  async getOptimization(
    optimizationId: string,
    context: SovereignOptimizationContext
  ): Promise<SovereignOptimization> {
    this.requireContext(context);

    const optimization =
      await this.requireOptimization(
        optimizationId
      );

    await this.requireAuthorized(
      context,
      "READ_OPTIMIZATION",
      optimization.id,
      optimization.adaptationId
    );

    return optimization;
  }

  async listOptimizations(
    context: SovereignOptimizationContext,
    limit = 100
  ): Promise<SovereignOptimization[]> {
    this.requireContext(context);

    await this.requireAuthorized(
      context,
      "READ_OPTIMIZATION"
    );

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000
    ) {
      throw new Error(
        "Optimization limit must be between 1 and 1000."
      );
    }

    return this.requireStore()
      .listOptimizations(limit);
  }

  private calculateTotalScore(
    candidate: {
      qualityScore: number;
      performanceScore: number;
      efficiencyScore: number;
      impactScore: number;
      costScore: number;
      riskScore: number;
      confidenceScore: number;
    }
  ): number {
    const positive =
      candidate.qualityScore * 0.2 +
      candidate.performanceScore * 0.15 +
      candidate.efficiencyScore * 0.15 +
      candidate.impactScore * 0.2 +
      candidate.costScore * 0.1 +
      candidate.confidenceScore * 0.2;

    const penalty =
      candidate.riskScore * 0.25;

    return Number(
      Math.max(
        0,
        Math.min(
          1,
          positive - penalty
        )
      ).toFixed(6)
    );
  }

  private validateScore(
    value: number,
    field: string
  ): void {
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      value > 1
    ) {
      throw new Error(
        `Optimization ${field} must be between 0 and 1.`
      );
    }
  }

  private async requireAuthorized(
    context: SovereignOptimizationContext,
    operation:
      | "CREATE_OPTIMIZA

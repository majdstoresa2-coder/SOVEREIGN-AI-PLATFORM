/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-VALIDATION-71
 * ============================================================
 *
 * Sovereign Validation Engine.
 *
 * Responsibilities:
 * - Validate optimized sovereign candidates.
 * - Enforce security, policy, quality and evidence gates.
 * - Reject unsafe or unverifiable candidates.
 * - Preserve validation provenance.
 * - Prevent validation from granting authority.
 *
 * VALIDATION ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignValidationStatus =
  | "CREATED"
  | "VALIDATING"
  | "PASSED"
  | "FAILED"
  | "REJECTED"
  | "ARCHIVED";

export type SovereignValidationGate =
  | "AUTHORITY"
  | "POLICY"
  | "SECURITY"
  | "QUALITY"
  | "EVIDENCE"
  | "RISK"
  | "INTEGRITY";

export interface SovereignValidationCheck {
  id: string;

  gate: SovereignValidationGate;

  passed: boolean;

  required: boolean;

  score?: number;

  reason?: string;

  evidenceIds: string[];

  checkedAt: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignValidation {
  id: string;

  optimizationId: string;

  candidateId: string;

  adaptationId: string;

  learningId: string;

  feedbackId: string;

  resultId: string;

  executionId: string;

  decisionId: string;

  source: string;

  status: SovereignValidationStatus;

  checks: SovereignValidationCheck[];

  requestedBy: string;

  validatedBy?: string;

  correlationId?: string;

  causationId?: string;

  idempotencyKey?: string;

  createdAt: string;

  validatedAt?: string;

  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignValidationContext {
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

export interface SovereignValidationStore {
  saveValidation(
    validation: SovereignValidation
  ): Promise<void>;

  getValidation(
    validationId: string
  ): Promise<SovereignValidation | undefined>;

  listValidations(
    limit?: number
  ): Promise<SovereignValidation[]>;

  findByOptimizationId?(
    optimizationId: string
  ): Promise<SovereignValidation | undefined>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignValidation | undefined>;
}

export interface SovereignValidationOptimizationBridge {
  getOptimization(
    optimizationId: string
  ): Promise<{
    id: string;

    adaptationId: string;

    learningId: string;

    feedbackId: string;

    resultId: string;

    executionId: string;

    decisionId: string;

    status:
      | "CREATED"
      | "ANALYZING"
      | "OPTIMIZED"
      | "REJECTED"
      | "ARCHIVED";

    selectedCandidateId?: string;

    candidates: Array<{
      id: string;

      proposalId: string;

      title: string;

      description: string;

      totalScore: number;

      risk:
        | "LOW"
        | "MEDIUM"
        | "HIGH"
        | "CRITICAL";

      riskScore: number;

      confidenceScore: number;

      eligible: boolean;

      requiresOwner: boolean;

      rationale: string;

      metadata?: Record<string, unknown>;
    }>;
  }>;
}

export interface SovereignValidationEngineBridge {
  validate(input: {
    validation: SovereignValidation;

    candidate: {
      id: string;

      proposalId: string;

      title: string;

      description: string;

      totalScore: number;

      risk:
        | "LOW"
        | "MEDIUM"
        | "HIGH"
        | "CRITICAL";

      riskScore: number;

      confidenceScore: number;

      eligible: boolean;

      requiresOwner: boolean;

      rationale: string;

      metadata?: Record<string, unknown>;
    };

    context: SovereignValidationContext;
  }): Promise<{
    checks: Array<{
      gate: SovereignValidationGate;

      passed: boolean;

      required?: boolean;

      score?: number;

      reason?: string;

      evidenceIds?: string[];

      metadata?: Record<string, unknown>;
    }>;
  }>;
}

export interface SovereignValidationPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignValidationContext["authority"];

    operation:
      | "CREATE_VALIDATION"
      | "RUN_VALIDATION"
      | "READ_VALIDATION"
      | "ARCHIVE_VALIDATION";

    validationId?: string;

    optimizationId?: string;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

export interface SovereignValidationEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    validationId?: string;

    optimizationId?: string;

    candidateId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignValidationAudit {
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

export class SovereignValidationEngine {
  public readonly id =
    "SOVEREIGN-VALIDATION-71";

  public readonly version =
    "1.0.0";

  private store?: SovereignValidationStore;

  private optimizationBridge?:
    SovereignValidationOptimizationBridge;

  private validationBridge?:
    SovereignValidationEngineBridge;

  private policyBridge?:
    SovereignValidationPolicyBridge;

  private eventBridge?:
    SovereignValidationEventBridge;

  private audit?: SovereignValidationAudit;

  private validating =
    new Set<string>();

  setStore(
    store: SovereignValidationStore
  ): void {
    this.store = store;
  }

  setOptimizationBridge(
    bridge: SovereignValidationOptimizationBridge
  ): void {
    this.optimizationBridge = bridge;
  }

  setValidationBridge(
    bridge: SovereignValidationEngineBridge
  ): void {
    this.validationBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignValidationPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignValidationEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignValidationAudit
  ): void {
    this.audit = audit;
  }

  async createValidation(
    input: {
      id?: string;

      optimizationId: string;

      source: string;

      correlationId?: string;

      causationId?: string;

      idempotencyKey?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignValidationContext
  ): Promise<SovereignValidation> {
    this.requireContext(context);

    if (!input.optimizationId.trim()) {
      throw new Error(
        "Validation optimizationId is required."
      );
    }

    if (!input.source.trim()) {
      throw new Error(
        "Validation source is required."
      );
    }

    const optimization =
      await this.requireOptimizationBridge()
        .getOptimization(
          input.optimizationId
        );

    if (
      optimization.status !== "OPTIMIZED"
    ) {
      throw new Error(
        `Optimization is not eligible for validation: ${optimization.status}`
      );
    }

    if (
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

    if (!candidate.eligible) {
      throw new Error(
        "Selected optimization candidate is not eligible."
      );
    }

    const validationId =
      input.id ??
      this.createId("VALIDATION");

    await this.requireAuthorized(
      context,
      "CREATE_VALIDATION",
      validationId,
      optimization.id
    );

    if (
      input.idempotencyKey &&
      this.requireStore().findByIdempotencyKey
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
      this.requireStore().findByOptimizationId
    ) {
      const existing =
        await this.requireStore()
          .findByOptimizationId!(
            optimization.id
          );

      if (existing) {
        return existing;
      }
    }

    const validation:
      SovereignValidation = {
      id:
        validationId,

      optimizationId:
        optimization.id,

      candidateId:
        candidate.id,

      adaptationId:
        optimization.adaptationId,

      learningId:
        optimization.learningId,

      feedbackId:
        optimization.feedbackId,

      resultId:
        optimization.resultId,

      executionId:
        optimization.executionId,

      decisionId:
        optimization.decisionId,

      source:
        input.source,

      status:
        "CREATED",

      checks:
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
      .saveValidation(validation);

    await this.publishEvent(
      "validation.created",
      validation,
      {}
    );

    await this.recordAudit(
      "validation.create",
      validation.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,

        optimizationId:
          optimization.id,

        candidateId:
          candidate.id,
      }
    );

    return validation;
  }

  async validate(
    validationId: string,
    context: SovereignValidationContext
  ): Promise<SovereignValidation> {
    this.requireContext(context);

    const validation =
      await this.requireValidation(
        validationId
      );

    if (
      validation.status === "PASSED"
    ) {
      return validation;
    }

    if (
      validation.status === "FAILED" ||
      validation.status === "REJECTED" ||
      validation.status === "ARCHIVED"
    ) {
      throw new Error(
        `Validation cannot run from status: ${validation.status}`
      );
    }

    await this.requireAuthorized(
      context,
      "RUN_VALIDATION",
      validation.id,
      validation.optimizationId
    );

    if (
      this.validating.has(
        validation.id
      )
    ) {
      throw new Error(
        "Validation is already running."
      );
    }

    this.validating.add(
      validation.id
    );

    validation.status =
      "VALIDATING";

    await this.requireStore()
      .saveValidation(validation);

    try {
      const optimization =
        await this.requireOptimizationBridge()
          .getOptimization(
            validation.optimizationId
          );

      if (
        optimization.status !==
        "OPTIMIZED"
      ) {
        throw new Error(
          "Validation source optimization is no longer OPTIMIZED."
        );
      }

      const candidate =
        optimization.candidates.find(
          (item) =>
            item.id ===
            validation.candidateId
        );

      if (!candidate) {
        throw new Error(
          "Validation candidate was not found."
        );
      }

      if (!candidate.eligible) {
        throw new Error(
          "Validation candidate is no longer eligible."
        );
      }

      if (
        candidate.requiresOwner &&
        context.authority !== "OWNER"
      ) {
        throw new Error(
          "Candidate requires OWNER validation."
        );
      }

      const result =
        await this.requireValidationBridge()
          .validate({
            validation,
            candidate,
            context,
          });

      if (result.checks.length === 0) {
        throw new Error(
          "Validation produced no checks."
        );
      }

      validation.checks =
        result.checks.map(
          (check) => {
            if (
              check.score !== undefined
            ) {
              this.validateScore(
                check.score
              );
            }

            return {
              id:
                this.createId(
                  "VALIDATION-CHECK"
                ),

              gate:
                check.gate,

              passed:
                check.passed,

              required:
                check.required !== false,

              score:
                check.score,

              reason:
                check.reason,

              evidenceIds:
                [
                  ...new Set(
                    check.evidenceIds ??
                      []
                  ),
                ],

              checkedAt:
                this.now(),

              metadata:
                check.metadata,
            };
          }
        );

      this.requireMandatoryGates(
        validation.checks
      );

      const failedRequired =
        validation.checks.filter(
          (check) =>
            check.required &&
            !check.passed
        );

      validation.validatedBy =
        context.actorId;

      validation.validatedAt =
        this.now();

      if (
        failedRequired.length > 0
      ) {
        validation.status =
          "FAILED";

        await this.requireStore()
          .saveValidation(validation);

        await this.publishEvent(
          "validation.failed",
          validation,
          {
            failedChecks:
              failedRequired.map(
                (check) => ({
                  id:
                    check.id,

                  gate:
                    check.gate,

                  reason:
                    check.reason,
                })
              ),
          }
        );

        await this.recordAudit(
          "validation.run",
          validation.id,
          "FAILED",
          {
            actorId:
              context.actorId,

            failedRequired:
              failedRequired.length,
          }
        );

        return validation;
      }

      validation.status =
        "PASSED";

      await this.requireStore()
        .saveValidation(validation);

      await this.publishEvent(
        "validation.passed",
        validation,
        {
          candidateId:
            validation.candidateId,

          checks:
            validation.checks.length,
        }
      );

      await this.recordAudit(
        "validation.run",
        validation.id,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          candidateId:
            validation.candidateId,
        }
      );

      return validation;
    } catch (error) {
      validation.status =
        "REJECTED";

      validation.validatedBy =
        context.actorId;

      validation.validatedAt =
        this.now();

      await this.requireStore()
        .saveValidation(validation);

      await this.recordAudit(
        "validation.run",
        validation.id,
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
      this.validating.delete(
        validation.id
      );
    }
  }

  async archive(
    validationId: string,
    context: SovereignValidationContext
  ): Promise<SovereignValidation> {
    this.requireContext(context);

    const validation =
      await this.requireValidation(
        validationId
      );

    await this.requireAuthorized(
      context,
      "ARCHIVE_VALIDATION",
      validation.id,
      validation.optimizationId
    );

    validation.status =
      "ARCHIVED";

    validation.archivedAt =
      this.now();

    await this.requireStore()
      .saveValidation(validation);

    await this.publishEvent(
      "validation.archived",
      validation,
      {
        actorId:
          context.actorId,
      }
    );

    return validation;
  }

  async getValidation(
    validationId: string,
    context: SovereignValidationContext
  ): Promise<SovereignValidation> {
    this.requireContext(context);

    const validation =
      await this.requireValidation(
        validationId
      );

    await this.requireAuthorized(
      context,
      "READ_VALIDATION",
      validation.id,
      validation.optimizationId
    );

    return validation;
  }

  async listValidations(
    context: SovereignValidationContext,
    limit = 100
  ): Promise<SovereignValidation[]> {
    this.requireContext(context);

    await this.requireAuthorized(
      context,
      "READ_VALIDATION"
    );

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000
    ) {
      throw new Error(
        "Validation limit must be between 1 and 1000."
      );
    }

    return this.requireStore()
      .listValidations(limit);
  }

  private requireMandatoryGates(
    checks: SovereignValidationCheck[]
  ): void {
    const mandatory:
      SovereignValidationGate[] = [
      "AUTHORITY",
      "POLICY",
      "SECURITY",
      "QUALITY",
      "EVIDENCE",
      "RISK",
      "INTEGRITY",
    ];

    const present =
      new Set(
        checks.map(
          (check) => check.gate
        )
      );

    for (const gate of mandatory) {
      if (!present.has(gate)) {
        throw new Error(
          `Mandatory validation gate missing: ${gate}`
        );
      }
    }
  }

  private validateScore(
    value: number
  ): void {
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      value > 1
    ) {
      throw new Error(
        "Validation score must be between 0 and 1."
      );
    }
  }

  private async requireAuthorized(
    context: SovereignValidationContext,
    operation:
      | "CREATE_VALIDATION"
      | "RUN_VALIDATION"
      | "READ_VALIDATION"
      | "ARCHIVE_VALIDATION",
    validationId?: string,
    optimizationId?: string
  ): Promise<void> {
    const authorization =
      await this.requirePolicyBridge()
        .authorize({
          actorId:
            context.actorId,

          authority:
            context.authority,

          operation,

          validationId,

          optimizationId,
        });

    if (!authorization.allowed) {
      await this.recordAudit(
        `validation.${operation.toLowerCase()}`,
        validationId,
        "DENIED",
        {
          actorId:
            context.actorId,

          reason:
            authorization.reason,
        }
      );

      throw new Error(
        authorization.reason ??
        `Validation operation denied: ${operation}`
      );
    }
  }

  private requireContext(
    context: SovereignValidationContext
  ): void {
    if (!context.authenticated) {
      throw new Error(
        "Validation requires authentication."
      );
    }

    if (!context.policyChecked) {
      throw new Error(
        "Validation requires policy verification."
      );
    }

    if (!context.securityChecked) {
      throw new Error(
        "Validation requires security verification."
      );
    }

    if (
      !context.authorizationChecked
    ) {
      throw new Error(
        "Validation requires authorization verification."
      );
    }
  }

  private requireStore():
    SovereignValidationStore {
    if (!this.store) {
      throw new Error(
        "Sovereign validation store is not configured."
      );
    }

    return this.store;
  }

  private requireOptimizationBridge():
    SovereignValidationOptimizationBridge {
    if (!this.optimizationBridge) {
      throw 

/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-DECISION-64
 * ============================================================
 *
 * Sovereign Decision Engine.
 *
 * Responsibilities:
 * - Create sovereign decisions.
 * - Evaluate decision inputs and constraints.
 * - Bind decisions to plans and strategies.
 * - Enforce policy and authority boundaries.
 * - Track decision rationale and evidence.
 * - Support approval requirements.
 * - Support accepted, rejected and deferred decisions.
 * - Preserve auditability and traceability.
 *
 * DECISION ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

/* ============================================================
 * 1. TYPES
 * ============================================================
 */

export type SovereignDecisionPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type SovereignDecisionStatus =
  | "CREATED"
  | "EVALUATING"
  | "APPROVED"
  | "REJECTED"
  | "DEFERRED"
  | "CANCELLED";

export type SovereignDecisionOutcome =
  | "PROCEED"
  | "REJECT"
  | "DEFER"
  | "REQUIRE_OWNER";

/* ============================================================
 * 2. CONSTRAINT
 * ============================================================
 */

export interface SovereignDecisionConstraint {
  id: string;

  description: string;

  required: boolean;

  satisfied: boolean;

  evidence?: Record<string, unknown>;
}

/* ============================================================
 * 3. DECISION
 * ============================================================
 */

export interface SovereignDecision {
  id: string;

  type: string;

  title: string;

  description: string;

  source: string;

  priority: SovereignDecisionPriority;

  status: SovereignDecisionStatus;

  outcome?: SovereignDecisionOutcome;

  planId?: string;

  strategyId?: string;

  goalId?: string;

  constraints: SovereignDecisionConstraint[];

  requestedBy: string;

  decidedBy?: string;

  rationale?: string;

  evidence?: Record<string, unknown>;

  correlationId?: string;

  causationId?: string;

  idempotencyKey?: string;

  createdAt: string;

  decidedAt?: string;

  cancelledAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 4. CONTEXT
 * ============================================================
 */

export interface SovereignDecisionContext {
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

/* ============================================================
 * 5. STORE
 * ============================================================
 */

export interface SovereignDecisionStore {
  saveDecision(
    decision: SovereignDecision
  ): Promise<void>;

  getDecision(
    decisionId: string
  ): Promise<SovereignDecision | undefined>;

  listDecisions(
    limit?: number
  ): Promise<SovereignDecision[]>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignDecision | undefined>;
}

/* ============================================================
 * 6. EVALUATION BRIDGE
 * ============================================================
 */

export interface SovereignDecisionEvaluationBridge {
  evaluate(input: {
    decision: SovereignDecision;

    context: SovereignDecisionContext;
  }): Promise<{
    outcome: SovereignDecisionOutcome;

    rationale: string;

    evidence?: Record<string, unknown>;

    requiresOwner?: boolean;
  }>;
}

/* ============================================================
 * 7. POLICY BRIDGE
 * ============================================================
 */

export interface SovereignDecisionPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignDecisionContext["authority"];

    operation:
      | "CREATE_DECISION"
      | "EVALUATE_DECISION"
      | "FINALIZE_DECISION"
      | "CANCEL_DECISION"
      | "READ_DECISION";

    decisionId?: string;

    decisionType?: string;

    priority?: SovereignDecisionPriority;

    requestedOutcome?: SovereignDecisionOutcome;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

/* ============================================================
 * 8. EVENT BRIDGE
 * ============================================================
 */

export interface SovereignDecisionEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    decisionId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 9. AUDIT
 * ============================================================
 */

export interface SovereignDecisionAudit {
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

/* ============================================================
 * 10. ENGINE
 * ============================================================
 */

export class SovereignDecisionEngine {
  public readonly id =
    "SOVEREIGN-DECISION-64";

  public readonly version =
    "1.0.0";

  private store?: SovereignDecisionStore;

  private evaluationBridge?: SovereignDecisionEvaluationBridge;

  private policyBridge?: SovereignDecisionPolicyBridge;

  private eventBridge?: SovereignDecisionEventBridge;

  private audit?: SovereignDecisionAudit;

  private evaluating =
    new Set<string>();

  setStore(
    store: SovereignDecisionStore
  ): void {
    this.store = store;
  }

  setEvaluationBridge(
    bridge: SovereignDecisionEvaluationBridge
  ): void {
    this.evaluationBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignDecisionPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignDecisionEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignDecisionAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * CREATE DECISION
   * ==========================================================
   */

  async createDecision(
    input: {
      id?: string;

      type: string;

      title: string;

      description: string;

      source: string;

      priority?: SovereignDecisionPriority;

      planId?: string;

      strategyId?: string;

      goalId?: string;

      constraints?: Array<{
        id?: string;
        description: string;
        required?: boolean;
        satisfied?: boolean;
        evidence?: Record<string, unknown>;
      }>;

      correlationId?: string;

      causationId?: string;

      idempotencyKey?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignDecisionContext
  ): Promise<SovereignDecision> {
    this.requireContext(context);

    if (!input.type.trim()) {
      throw new Error(
        "Decision type is required."
      );
    }

    if (!input.title.trim()) {
      throw new Error(
        "Decision title is required."
      );
    }

    if (!input.description.trim()) {
      throw new Error(
        "Decision description is required."
      );
    }

    if (!input.source.trim()) {
      throw new Error(
        "Decision source is required."
      );
    }

    const decisionId =
      input.id ??
      this.createId("DECISION");

    const priority =
      input.priority ??
      "NORMAL";

    await this.requireAuthorized(
      context,
      "CREATE_DECISION",
      decisionId,
      input.type,
      priority
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

    const seen =
      new Set<string>();

    const constraints:
      SovereignDecisionConstraint[] =
      (input.constraints ?? [])
        .map(
          (constraint, index) => {
            const id =
              constraint.id ??
              `CONSTRAINT-${index + 1}`;

            if (seen.has(id)) {
              throw new Error(
                `Duplicate decision constraint: ${id}`
              );
            }

            if (
              !constraint.description.trim()
            ) {
              throw new Error(
                `Constraint description is required: ${id}`
              );
            }

            seen.add(id);

            return {
              id,

              description:
                constraint.description,

              required:
                constraint.required !== false,

              satisfied:
                constraint.satisfied === true,

              evidence:
                constraint.evidence,
            };
          }
        );

    const decision:
      SovereignDecision = {
      id:
        decisionId,

      type:
        input.type,

      title:
        input.title,

      description:
        input.description,

      source:
        input.source,

      priority,

      status:
        "CREATED",

      planId:
        input.planId,

      strategyId:
        input.strategyId,

      goalId:
        input.goalId,

      constraints,

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
      .saveDecision(decision);

    await this.publishEvent(
      "decision.created",
      decision.id,
      {
        type:
          decision.type,

        priority:
          decision.priority,

        constraints:
          decision.constraints.length,
      }
    );

    await this.recordAudit(
      "decision.create",
      decision.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,
      }
    );

    return decision;
  }

  /* ==========================================================
   * EVALUATE
   * ==========================================================
   */

  async evaluate(
    decisionId: string,
    context: SovereignDecisionContext
  ): Promise<SovereignDecision> {
    this.requireContext(context);

    const decision =
      await this.requireDecision(
        decisionId
      );

    if (
      decision.status ===
        "APPROVED" ||
      decision.status ===
        "REJECTED" ||
      decision.status ===
        "CANCELLED"
    ) {
      return decision;
    }

    await this.requireAuthorized(
      context,
      "EVALUATE_DECISION",
      decision.id,
      decision.type,
      decision.priority
    );

    if (
      this.evaluating.has(
        decision.id
      )
    ) {
      throw new Error(
        "Decision is already being evaluated."
      );
    }

    const unsatisfiedRequired =
      decision.constraints.filter(
        (constraint) =>
          constraint.required &&
          !constraint.satisfied
      );

    if (
      unsatisfiedRequired.length > 0
    ) {
      decision.status =
        "DEFERRED";

      decision.outcome =
        "DEFER";

      decision.rationale =
        "Required decision constraints are not satisfied.";

      decision.decidedBy =
        context.actorId;

      decision.decidedAt =
        this.now();

      await this.requireStore()
        .saveDecision(decision);

      await this.publishEvent(
        "decision.deferred",
        decision.id,
        {
          unsatisfiedConstraints:
            unsatisfiedRequired.map(
              (item) =>
                item.id
            ),
        }
      );

      return decision;
    }

    this.evaluating.add(
      decision.id
    );

    decision.status =
      "EVALUATING";

    await this.requireStore()
      .saveDecision(decision);

    try {
      const result =
        await this.requireEvaluationBridge()
          .evaluate({
            decision,
            context,
          });

      if (
        result.requiresOwner ||
        result.outcome ===
          "REQUIRE_OWNER"
      ) {
        decision.status =
          "DEFERRED";

        decision.outcome =
          "REQUIRE_OWNER";

        decision.rationale =
          result.rationale;

        decision.evidence =
          result.evidence;

        decision.decidedBy =
          context.actorId;

        decision.decidedAt =
          this.now();

        await this.requireStore()
          .saveDecision(decision);

        await this.publishEvent(
          "decision.owner-required",
          decision.id,
          {
            rationale:
              decision.rationale,
          }
        );

        return decision;
      }

      if (
        result.outcome ===
        "DEFER"
      ) {
        decision.status =
          "DEFERRED";
      } else if (
        result.outcome ===
        "REJECT"
      ) {
        decision.status =
          "REJECTED";
      } else {
        decision.status =
          "APPROVED";
      }

      decision.outcome =
        result.outcome;

      decision.rationale =
        result.rationale;

      decision.evidence =
        result.evidence;

      decision.decidedBy =
        context.actorId;

      decision.decidedAt =
        this.now();

      await this.requireStore()
        .saveDecision(decision);

      await this.publishEvent(
        decision.status ===
          "APPROVED"
          ? "decision.approved"
          : decision.status ===
              "REJECTED"
          ? "decision.rejected"
          : "decision.deferred",
        decision.id,
        {
          outcome:
            decision.outcome,

          rationale:
            decision.rationale,
        }
      );

      await this.recordAudit(
        "decision.evaluate",
        decision.id,
        decision.status ===
          "APPROVED"
          ? "SUCCESS"
          : "FAILED",
        {
          actorId:
            context.actorId,

          outcome:
            decision.outcome,
        }
      );

      return decision;
    } finally {
      this.evaluating.delete(
        decision.id
      );
    }
  }

  /* ==========================================================
   * FINALIZE OWNER DECISION
   * ==========================================================
   */

  async finalizeOwnerDecision(
    decisionId: string,
    outcome:
      | "PROCEED"
      | "REJECT"
      | "DEFER",
    rationale: string,
    context: SovereignDecisionContext
  ): Promise<SovereignDecision> {
    this.requireContext(context);

    if (
      context.authority !==
      "OWNER"
    ) {
      throw new Error(
        "Only OWNER can finalize an owner-required decision."
      );
    }

    const decision =
      await this.requireDecision(
        decisionId
      );

    await this.requireAuthorized(
      context,
      "FINALIZE_DECISION",
      decision.id,
      decision.type,
      decision.priority,
      outcome
    );

    if (!rationale.trim()) {
      throw new Error(
        "Decision rationale is required."
      );
    }

    if (
      decision.status ===
        "CANCELLED"
    ) {
      throw new Error(
        "Cancelled decision cannot be finalized."
      );
    }

    decision.outcome =
      outcome;

    decision.status =
      outcome === "PROCEED"
        ? "APPROVED"
        : outcome === "REJECT"
        ? "REJECTED"
        : "DEFERRED";

    decision.rationale =
      rationale;

    decision.decidedBy =
      context.actorId;

    decision.decidedAt =
      this.now();

    await this.requireStore()
      .saveDecision(decision);

    await this.publishEvent(
      "decision.owner-finalized",
      decision.id,
      {
        outcome,
      }
    );

    await this.recordAudit(
      "decision.owner.finalize",
      decision.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,

        outcome,
      }
    );

    return decision;
  }

  /* ==========================================================
   * UPDATE CONSTRAINT
   * ==========================================================
   */

  async updateConstraint(
    decisionId: string,
    constraintId: string,
    satisfied: boolean,
    evidence: Record<string, unknown> | undefined,
    context: SovereignDecisionContext
  ): Promise<SovereignDecision> {
    this.requireContext(context);

    const decision =
      await this.requireDecision(
        decisionId
      );

    await this.requireAuthorized(
      context,
      "EVALUATE_DECISION",
      decision.id,
      decision.type,
      decision.priority
    );

    const constraint =
      decision.constraints.find(
        (item) =>
          item.id === constraintId
      );

    if (!constraint) {
      throw new Error(
        `Decision constraint not found: ${constraintId}`
      );
    }

    constraint.satisfied =
      satisfied;

    constraint.evidence =
      evidence;

    await this.requireStore()
      .saveDecision(decision);

    await this.publishEvent(
      "decision.constraint.updated",
      decision.id,
      {
        constraintId,
        satisfied,
      }
    );

    return decision;
  }

  /* ==========================================================
   * CANCEL
   * ==========================================================
   */

  async cancel(
    decisionId: string,
    context: SovereignDecisionContext
  ): Promise<SovereignDecision> {
    this.requireContext(context);

    const decision =
      await this.requireDecision(
        decisionId
      );

    await this.requireAuthorized(
      context,
      "CANCEL_DECISION",
      decision.id,
      decision.type,
      decision.priority
    );

    if (
      decision.status ===
        "APPROVED" ||
      decision.status ===
        "REJECTED" ||
      decision.status ===
        "CANCELLED"
    ) {
      return decision;
    }

    decision.status =
      "CANCELLED";

    decision.cancelledAt =
      this.now();

    await this.requireStore()
      .saveDecision(decision);

    await this.publishEvent(
      "decision.cancelled",
      decision.id,
      {
        actorId:
          context.actorId,
      }
    );

    await this.recordAudit(
      "decision.cancel",
      decision.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,
      }
    );

    return decision;
  }

  /* ==========================================================
   * GET / LIST
   * ==========================================================
   */

  async getDecision(
    decisionId: string,
    context: SovereignDecisionContext
  ): Promise<SovereignDecision> {
    this.requireContext(context);

    const decision =
      await this.requireDecision(
        decisionId
      );

    await this.requireAuthorized(
      context,
      "READ_DECISION",
      decision.id,
      decision.type,

/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-PLANNING-06
 * ============================================================
 *
 * Purpose:
 * Sovereign Planning Layer.
 *
 * Responsibility:
 * Request → Analysis → Plan → Policy Check → Execution
 *
 * Planning creates traceable execution plans.
 * Planning does NOT execute operations and does NOT grant authority.
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. TYPES
 * ============================================================
 */

export type PlanningStatus =
  | "ANALYZING"
  | "DRAFT"
  | "POLICY_CHECK"
  | "APPROVED"
  | "REJECTED"
  | "READY"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED";

export type PlanPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

/* ============================================================
 * 2. REQUEST CONTRACT
 * ============================================================
 */

export interface PlanningRequest {
  id: string;
  actorId: string;
  actorType: string;

  type: string;
  description: string;

  input: Record<string, unknown>;

  priority: PlanPriority;

  createdAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 3. ANALYSIS CONTRACT
 * ============================================================
 */

export interface PlanningAnalysis {
  requestId: string;

  objective: string;

  requirements: string[];

  constraints: string[];

  risks: string[];

  requiredCapabilities: string[];

  requiredAgents: string[];

  assumptions: string[];

  analyzedAt: string;
}

/* ============================================================
 * 4. PLAN STEP
 * ============================================================
 */

export interface PlanningStep {
  id: string;

  order: number;

  name: string;

  description: string;

  agentId?: string;

  capabilityId?: string;

  input: Record<string, unknown>;

  expectedOutput?: Record<string, unknown>;

  dependencies: string[];

  requiresApproval: boolean;

  policyChecked: boolean;

  status:
    | "PENDING"
    | "READY"
    | "RUNNING"
    | "COMPLETED"
    | "FAILED"
    | "SKIPPED";
}

/* ============================================================
 * 5. PLAN CONTRACT
 * ============================================================
 */

export interface SovereignPlanningPlan {
  id: string;

  requestId: string;

  status: PlanningStatus;

  priority: PlanPriority;

  objective: string;

  analysis: PlanningAnalysis;

  steps: PlanningStep[];

  createdAt: string;

  updatedAt: string;

  approvedAt?: string;

  completedAt?: string;

  rejectionReason?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. POLICY RESULT
 * ============================================================
 */

export interface PlanningPolicyResult {
  allowed: boolean;

  requiresApproval: boolean;

  checkedSteps: string[];

  deniedSteps: string[];

  restrictions: string[];

  reason?: string;

  checkedAt: string;
}

/* ============================================================
 * 7. PLANNING ENGINE
 * ============================================================
 */

export class SovereignPlanningEngine {
  public readonly id = "SOVEREIGN-PLANNING-06";

  public readonly version = "1.0.0";

  private plans = new Map<string, SovereignPlanningPlan>();

  /* ==========================================================
   * CREATE PLAN
   * ==========================================================
   */

  createPlan(request: PlanningRequest): SovereignPlanningPlan {
    const analysis = this.analyze(request);

    const plan: SovereignPlanningPlan = {
      id: this.createId("PLAN"),
      requestId: request.id,
      status: "DRAFT",
      priority: request.priority,
      objective: analysis.objective,
      analysis,
      steps: [],
      createdAt: this.now(),
      updatedAt: this.now(),
    };

    this.plans.set(plan.id, plan);

    return plan;
  }

  /* ==========================================================
   * ANALYSIS
   * ==========================================================
   */

  analyze(request: PlanningRequest): PlanningAnalysis {
    return {
      requestId: request.id,

      objective: request.description,

      requirements: [
        `Process request type: ${request.type}`,
      ],

      constraints: [
        "Execution must remain outside the Planning Layer.",
        "All execution remains subject to Policy and Permission checks.",
        "Planning cannot grant authority.",
      ],

      risks: [],

      requiredCapabilities: [],

      requiredAgents: [],

      assumptions: [],

      analyzedAt: this.now(),
    };
  }

  /* ==========================================================
   * ADD STEP
   * ==========================================================
   */

  addStep(
    planId: string,
    step: Omit<PlanningStep, "id" | "order" | "policyChecked">
  ): PlanningStep {
    const plan = this.requirePlan(planId);

    const newStep: PlanningStep = {
      ...step,

      id: this.createId("STEP"),

      order: plan.steps.length + 1,

      policyChecked: false,
    };

    plan.steps.push(newStep);

    plan.updatedAt = this.now();

    return newStep;
  }

  /* ==========================================================
   * POLICY CHECK
   * ==========================================================
   */

  checkPolicy(
    planId: string,
    evaluator: (
      step: PlanningStep
    ) => {
      allowed: boolean;
      requiresApproval?: boolean;
      restrictions?: string[];
      reason?: string;
    }
  ): PlanningPolicyResult {
    const plan = this.requirePlan(planId);

    plan.status = "POLICY_CHECK";

    const checkedSteps: string[] = [];
    const deniedSteps: string[] = [];
    const restrictions: string[] = [];

    let requiresApproval = false;

    for (const step of plan.steps) {
      const result = evaluator(step);

      step.policyChecked = true;

      checkedSteps.push(step.id);

      if (!result.allowed) {
        deniedSteps.push(step.id);
      }

      if (result.requiresApproval) {
        step.requiresApproval = true;
        requiresApproval = true;
      }

      if (result.restrictions) {
        restrictions.push(...result.restrictions);
      }
    }

    const allowed = deniedSteps.length === 0;

    if (!allowed) {
      plan.status = "REJECTED";

      plan.rejectionReason =
        "One or more planning steps failed policy validation.";
    } else if (requiresApproval) {
      plan.status = "APPROVED";
    } else {
      plan.status = "READY";
    }

    plan.updatedAt = this.now();

    return {
      allowed,

      requiresApproval,

      checkedSteps,

      deniedSteps,

      restrictions,

      reason: allowed
        ? undefined
        : plan.rejectionReason,

      checkedAt: this.now(),
    };
  }

  /* ==========================================================
   * APPROVAL
   * ==========================================================
   */

  approvePlan(planId: string): SovereignPlanningPlan {
    const plan = this.requirePlan(planId);

    if (plan.status === "REJECTED") {
      throw new Error(
        "Rejected plans cannot be approved."
      );
    }

    for (const step of plan.steps) {
      if (!step.policyChecked) {
        throw new Error(
          `Step ${step.id} has not completed policy checking.`
        );
      }
    }

    plan.status = "APPROVED";

    plan.approvedAt = this.now();

    plan.updatedAt = this.now();

    return plan;
  }

  /* ==========================================================
   * READY FOR EXECUTION
   * ==========================================================
   */

  markReady(planId: string): SovereignPlanningPlan {
    const plan = this.requirePlan(planId);

    if (plan.status !== "APPROVED") {
      throw new Error(
        "Only approved plans can become ready for execution."
      );
    }

    plan.status = "READY";

    plan.updatedAt = this.now();

    return plan;
  }

  /* ==========================================================
   * READ PLAN
   * ==========================================================
   */

  getPlan(planId: string): SovereignPlanningPlan | undefined {
    return this.plans.get(planId);
  }

  /* ==========================================================
   * LIST PLANS
   * ==========================================================
   */

  listPlans(): SovereignPlanningPlan[] {
    return Array.from(this.plans.values());
  }

  /* ==========================================================
   * INTERNAL HELPERS
   * ==========================================================
   */

  private requirePlan(
    planId: string
  ): SovereignPlanningPlan {
    const plan = this.plans.get(planId);

    if (!plan) {
      throw new Error(
        `Planning plan not found: ${planId}`
      );
    }

    return plan;
  }

  private createId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  private now(): string {
    return new Date().toISOString();
  }
}

/* ============================================================
 * 8. FACTORY
 * ============================================================
 */

export function createSovereignPlanningEngine(): SovereignPlanningEngine {
  return new SovereignPlanningEngine();
}

/* ============================================================
 * 9. ARCHITECTURAL BOUNDARY
 * ============================================================
 *
 * Planning Layer:
 *
 * DOES:
 * - Analyze requests.
 * - Create plans.
 * - Organize steps.
 * - Check policy results.
 * - Track plan state.
 *
 * DOES NOT:
 * - Execute tools.
 * - Execute jobs.
 * - Grant permissions.
 * - Bypass policy.
 * - Directly control Runtime.
 *
 * Execution remains the responsibility of the
 * Sovereign Execution Layer.
 * ============================================================
 */

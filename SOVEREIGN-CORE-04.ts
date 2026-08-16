/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-CORE-04
 * ============================================================
 *
 * Purpose:
 * Central intelligence coordination core for the
 * Sovereign AI Platform.
 *
 * Responsibilities:
 * - Receive sovereign requests.
 * - Maintain execution context.
 * - Coordinate planning.
 * - Coordinate agents and capabilities.
 * - Create and track jobs.
 * - Enforce policy/permission boundaries.
 * - Coordinate runtime execution.
 * - Process results and failures.
 * - Trigger diagnostics when required.
 * - Publish sovereign events.
 *
 * IMPORTANT:
 * The Core does NOT own supreme authority.
 * OWNER remains the highest authority.
 *
 * The Core cannot bypass:
 * Authority → Policy → Permission → Runtime → Execution
 *
 * Game Factory is NOT part of the Core.
 * Game Factory will later exist as a Capability.
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. TYPES
 * ============================================================
 */

export type CoreStatus =
  | "INITIALIZING"
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "DEGRADED"
  | "FAILED"
  | "STOPPED"
  | "RECOVERING";

export type CoreDecision =
  | "ACCEPT"
  | "PLAN"
  | "EXECUTE"
  | "WAIT"
  | "RETRY"
  | "REJECT"
  | "ESCALATE"
  | "COMPLETE";

export type CoreExecutionStatus =
  | "PENDING"
  | "PLANNING"
  | "POLICY_CHECK"
  | "APPROVED"
  | "EXECUTING"
  | "VERIFYING"
  | "COMPLETED"
  | "FAILED"
  | "REJECTED"
  | "ESCALATED";

export interface CoreRequest {
  id: string;
  actorId: string;
  actorType: string;

  type: string;
  description: string;

  input: Record<string, unknown>;

  priority:
    | "LOW"
    | "NORMAL"
    | "HIGH"
    | "CRITICAL";

  createdAt: string;

  metadata?: Record<string, unknown>;
}

export interface CoreContext {
  requestId: string;

  correlationId: string;

  ownerId: string;

  stewardId?: string;

  createdAt: string;

  updatedAt: string;

  data: Record<string, unknown>;

  decisions: CoreDecision[];

  events: string[];

  errors: string[];
}

export interface CorePlan {
  id: string;

  requestId: string;

  steps: CorePlanStep[];

  status:
    | "DRAFT"
    | "POLICY_CHECK"
    | "APPROVED"
    | "REJECTED"
    | "EXECUTING"
    | "COMPLETED"
    | "FAILED";

  createdAt: string;
}

export interface CorePlanStep {
  id: string;

  order: number;

  name: string;

  description: string;

  agentId?: string;

  capabilityId?: string;

  input: Record<string, unknown>;

  requiresApproval: boolean;

  policyChecked: boolean;

  status: CoreExecutionStatus;
}

export interface CoreJob {
  id: string;

  requestId: string;

  planId?: string;

  parentJobId?: string;

  agentId?: string;

  capabilityId?: string;

  status: CoreExecutionStatus;

  attempts: number;

  input: Record<string, unknown>;

  output?: Record<string, unknown>;

  error?: CoreError;

  createdAt: string;

  startedAt?: string;

  completedAt?: string;
}

export interface CoreError {
  code: string;

  message: string;

  component: string;

  retryable: boolean;

  severity:
    | "INFO"
    | "WARNING"
    | "ERROR"
    | "CRITICAL";

  occurredAt: string;

  details?: Record<string, unknown>;
}

export interface CoreEvent {
  id: string;

  type: string;

  source: string;

  timestamp: string;

  requestId?: string;

  jobId?: string;

  agentId?: string;

  capabilityId?: string;

  payload: Record<string, unknown>;
}

export interface CorePolicyDecision {
  allowed: boolean;

  requiresApproval: boolean;

  reason: string;

  permissions: string[];

  restrictions: string[];
}

export interface CoreExecutionResult {
  success: boolean;

  status: CoreExecutionStatus;

  output?: Record<string, unknown>;

  error?: CoreError;

  jobId: string;
}

/* ============================================================
 * 2. DEPENDENCY CONTRACTS
 * ============================================================
 */

export interface CoreAuthority {
  getAuthority(): {
    ownerId: string;
    stewardId?: string;

    ownerAuthority: "SUPREME";
    stewardAuthority: "DELEGATED";

    delegationEnabled: boolean;

    delegationScope: string[];
  };

  validateActor(actorId: string, actorType: string): boolean;

  canDelegate(
    actorId: string,
    action: string,
  ): boolean;
}

export interface CorePolicyEngine {
  evaluate(
    request: CoreRequest,
    context: CoreContext,
  ): Promise<CorePolicyDecision>;
}

export interface CorePlanner {
  createPlan(
    request: CoreRequest,
    context: CoreContext,
  ): Promise<CorePlan>;
}

export interface CoreRuntime {
  createJob(
    job: CoreJob,
  ): Promise<CoreJob>;

  executeJob(
    job: CoreJob,
    context: CoreContext,
  ): Promise<CoreExecutionResult>;

  cancelJob(
    jobId: string,
  ): Promise<boolean>;

  retryJob(
    jobId: string,
  ): Promise<CoreExecutionResult>;
}

export interface CoreAgentRegistry {
  getAgent(
    agentId: string,
  ): Promise<Record<string, unknown> | undefined>;

  findAgentForStep(
    step: CorePlanStep,
  ): Promise<string | undefined>;
}

export interface CoreCapabilityRegistry {
  getCapability(
    capabilityId: string,
  ): Promise<Record<string, unknown> | undefined>;

  validateCapability(
    capabilityId: string,
  ): Promise<boolean>;
}

export interface CoreMemory {
  save(
    key: string,
    value: unknown,
  ): Promise<void>;

  get(
    key: string,
  ): Promise<unknown>;

  delete(
    key: string,
  ): Promise<void>;
}

export interface CoreEventBus {
  publish(
    event: CoreEvent,
  ): Promise<void>;
}

export interface CoreDiagnostics {
  diagnose(
    error: CoreError,
    context: CoreContext,
  ): Promise<{
    diagnosis: string;
    recommendedAction:
      | "RETRY"
      | "ROLLBACK"
      | "ESCALATE"
      | "STOP";
  }>;
}

/* ============================================================
 * 3. CORE CONFIGURATION
 * ============================================================
 */

export interface SovereignCoreConfig {
  ownerId: string;

  stewardId?: string;

  maxConcurrentJobs: number;

  maxRetryAttempts: number;

  requirePolicyCheck: boolean;

  requireVerification: boolean;
}

/* ============================================================
 * 4. CORE CLASS
 * ============================================================
 */

export class SovereignCore {
  public readonly id = "SOVEREIGN-CORE-04";

  public readonly version = "1.0.0";

  private status: CoreStatus =
    "INITIALIZING";

  private readonly config: SovereignCoreConfig;

  private readonly authority: CoreAuthority;

  private readonly policy: CorePolicyEngine;

  private readonly planner: CorePlanner;

  private readonly runtime: CoreRuntime;

  private readonly agents: CoreAgentRegistry;

  private readonly capabilities: CoreCapabilityRegistry;

  private readonly memory: CoreMemory;

  private readonly events: CoreEventBus;

  private readonly diagnostics: CoreDiagnostics;

  private activeJobs = new Map<
    string,
    CoreJob
  >();

  private contexts = new Map<
    string,
    CoreContext
  >();

  constructor(
    config: SovereignCoreConfig,
    dependencies: {
      authority: CoreAuthority;
      policy: CorePolicyEngine;
      planner: CorePlanner;
      runtime: CoreRuntime;
      agents: CoreAgentRegistry;
      capabilities: CoreCapabilityRegistry;
      memory: CoreMemory;
      events: CoreEventBus;
      diagnostics: CoreDiagnostics;
    },
  ) {
    this.config = config;

    this.authority =
      dependencies.authority;

    this.policy =
      dependencies.policy;

    this.planner =
      dependencies.planner;

    this.runtime =
      dependencies.runtime;

    this.agents =
      dependencies.agents;

    this.capabilities =
      dependencies.capabilities;

    this.memory =
      dependencies.memory;

    this.events =
      dependencies.events;

    this.diagnostics =
      dependencies.diagnostics;
  }

  /* ========================================================
   * 5. INITIALIZATION
   * ========================================================
   */

  public async initialize(): Promise<void> {
    this.status = "INITIALIZING";

    await this.publishEvent(
      "core.initializing",
      {
        coreId: this.id,
        version: this.version,
      },
    );

    this.status = "READY";

    await this.publishEvent(
      "core.ready",
      {
        coreId: this.id,
        version: this.version,
      },
    );
  }

  /* ========================================================
   * 6. STATUS
   * ========================================================
   */

  public getStatus(): CoreStatus {
    return this.status;
  }

  public getHealth(): {
    id: string;
    status: CoreStatus;
    activeJobs: number;
    timestamp: string;
  } {
    return {
      id: this.id,
      status: this.status,
      activeJobs: this.activeJobs.size,
      timestamp: new Date().toISOString(),
    };
  }

  /* ========================================================
   * 7. REQUEST ENTRY
   * ========================================================
   */

  public async processRequest(
    request: CoreRequest,
  ): Promise<CoreExecutionResult> {
    if (
      this.status !== "READY" &&
      this.status !== "RUNNING"
    ) {
      return this.rejectRequest(
        request,
        "CORE_NOT_READY",
        "Sovereign Core is not ready.",
      );
    }

    if (
      !this.authority.validateActor(
        request.actorId,
        request.actorType,
      )
    ) {
      return this.rejectRequest(
        request,
        "ACTOR_NOT_AUTHORIZED",
        "Actor is not authorized by the Sovereign Authority.",
      );
    }

    if (
      this.activeJobs.size >=
      this.config.maxConcurrentJobs
    ) {
      return this.rejectRequest(
        request,
        "CAPACITY_LIMIT",
        "Core concurrency limit reached.",
      );
    }

    this.status = "RUNNING";

    const context =
      await this.createContext(request);

    try {
      await this.publishEvent(
        "request.accepted",
        {
          requestId: request.id,
          actorId: request.actorId,
        },
      );

      const policyDecision =
        await this.policy.evaluate(
          request,
          context,
        );

      await this.publishEvent(
        "policy.evaluated",
        {
          requestId: request.id,
          allowed:
            policyDecision.allowed,
          requiresApproval:
            policyDecision.requiresApproval,
        },
      );

      if (!policyDecision.allowed) {
        return this.rejectRequest(
          request,
          "POLICY_DENIED",
          policyDecision.reason,
        );
      }

      if (
        policyDecision.requiresApproval
      ) {
        return this.escalateRequest(
          request,
          "APPROVAL_REQUIRED",
        );
      }

      const plan =
        await this.planner.createPlan(
          request,
          context,
        );

      await this.memory.save(
        `plan:${plan.id}`,
        plan,
      );

      await this.publishEvent(
        "plan.created",
        {
          requestId: request.id,
          planId: plan.id,
        },
      );

      const policyValidatedPlan =
        await this.validatePlan(
          plan,
          request,
          context,
        );

      if (!policyValidatedPlan) {
        return this.rejectRequest(
          request,
          "PLAN_POLICY_REJECTED",
          "Plan failed policy validation.",
        );
      }

      return this.executePlan(
        plan,
        request,
        context,
      );
    } catch (error) {
      return this.handleUnexpectedError(
        error,
        request,
        context,
      );
    }
  }

  /* ========================================================
   * 8. CONTEXT
   * ========================================================
   */

  private async createContext(
    request: CoreRequest,
  ): Promise<CoreContext> {
    const now =
      new Date().toISOString();

    const context: CoreContext = {
      requestId: request.id,

      correlationId:
        this.generateId("CORR"),

      ownerId:
        this.config.ownerId,

      stewardId:
        this.config.stewardId,

      createdAt: now,

      updatedAt: now,

      data: {
        request,
      },

      decisions: [
        "ACCEPT",
      ],

      events: [],

      errors: [],
    };

    this.contexts.set(
      request.id,
      context,
    );

    return context;
  }

  /* ========================================================
   * 9. PLAN VALIDATION
   * ========================================================
   */

  private async validatePlan(
    plan: CorePlan,
    request: CoreRequest,
    context: CoreContext,
  ): Promise<boolean> {
    if (!plan.steps.length) {
      return false;
    }

    for (const step of plan.steps) {
      if (
        step.capabilityId
      ) {
        const valid =
          await this.capabilities
            .validateCapability(
              step.capabilityId,
            );

        if (!valid) {
          await this.publishEvent(
            "capability.validation.failed",
            {
              requestId: request.id,
              planId: plan.id,
              capabilityId:
                step.capabilityId,
            },
          );

          return false;
        }
      }

      if (!step.agentId) {
        const agentId =
          await this.agents
            .findAgentForStep(step);

        if (agentId) {
          step.agentId =
            agentId;
        }
      }

      step.policyChecked = true;
    }

    context.decisions.push(
      "EXECUTE",
    );

    context.updatedAt =
      new Date().toISOString();

    return true;
  }

  /* ========================================================
   * 10. PLAN EXECUTION
   * ========================================================
   */

  private async executePlan(
    plan: CorePlan,
    request: CoreRequest,
    context: CoreContext,
  ): Promise<CoreExecutionResult> {
    plan.status = "EXECUTING";

    await this.publishEvent(
      "plan.execution.started",
      {
        requestId: request.id,
        planId: plan.id,
      },
    );

    let finalOutput:
      Record<string, unknown> = {};

    for (const step of plan.steps) {
      step.status =
        "EXECUTING";

      const job =
        await this.createJob(
          plan,
          step,
          request,
        );

      const result =
        await this.executeJob(
          job,
          context,
        );

      if (!result.success) {
        plan.status = "FAILED";

        return this.handleJobFailure(
          result,
          request,
          context,
        );
      }

      finalOutput = {
        ...finalOutput,
        ...(
          result.output ?? {}
        ),
      };

      step.status =
        "COMPLETED";
    }

    plan.status =
      "COMPLETED";

    context.decisions.push(
      "COMPLETE",
    );

    await this.memory.save(
      `result:${request.id}`,
      finalOutput,
    );

    await this.publishEvent(
      "plan.completed",
      {
        requestId: request.id,
        planId: plan.id,
      },
    );

    this.status =
      "READY";

    return {
      success: true,
      status: "COMPLETED",
      output: finalOutput,
      jobId: `PLAN:${plan.id}`,
    };
  }

  /* ========================================================
   * 11. JOB CREATION
   * ========================================================
   */

  private async createJob(
    plan: CorePlan,
    step: CorePlanStep,
    request: CoreRequest,
  ): Promise<CoreJob> {
    const job: CoreJob = {
      id: this.generateId("JOB"),

      requestId:
        request.id,

      planId:
        plan.id,

      agentId:
        step.agentId,

      capabilityId:
        step.capabilityId,

      status:
        "PENDING",

      attempts: 0,

      input:
        step.input,

      createdAt:
        new Date().toISOString(),
    };

    this.activeJobs.set(
      job.id,
      job,
    );

    await this.runtime.createJob(
      job,
    );

    await this.publishEvent(
      "job.created",
      {
        requestId:
          request.id,
        jobId:
          job.id,
        planId:
          plan.id,
      },
    );

    return job;
  }

  /* ========================================================
   * 12. JOB EXECUTION
   * ========================================================
   */

  private async executeJob(
    job: CoreJob,
    context: CoreContext,
  ): Promise<CoreExecutionResult> {
    job.status =
      "EXECUTING";

    job.startedAt =
      new Date().toISOString();

    job.attempts += 1;

    await this.publishEvent(
      "job.started",
      {
        jobId: job.id,
        requestId:
          job.requestId,
      },
    );

    try {
      const result =
        await this.runtime.executeJob(
          job,
          context,
        );

      if (result.success) {
        job.status =
          "VERIFYING";

        await this.publishEvent(
          "job.verifying",
          {
            jobId: job.id,
          },
        );

        job.output =
          result.output;

        job.status =
          "COMPLETED";

        job.completedAt =
          new Date().toISOString();

        await this.publishEvent(
          "job.completed",
          {
            jobId: job.id,
            requestId:
              job.requestId,
          },
        );
      } else {
        job.status =
          "FAILED";

        job.error =
          result.error;
      }

      this.activeJobs.delete(
        job.id,
      );

      return result;
    } catch (error) {
      const coreError =
        this.normalizeError(
          error,
          "RUNTIME_EXECUTION_ERROR",
          "RUNTIME",
        );

      job.status =
        "FAILED";

      job.error =
        coreError;

      this.activeJobs.delete(
        job.id,
      );

      await this.publishEvent(
        "job.failed",
        {
          jobId: job.id,
          requestId:
            job.requestId,
          error:
            coreError,
        },
      );

      return {
        success: false,
        status: "FAILED",
        error: coreError,
        jobId: job.id,
      };
    }
  }

  /* ========================================================
   * 13. FAILURE HANDLING
   * ========================================================
   */

  private async handleJobFailure(
    result: CoreExecutionResult,
    request: CoreRequest,
    context: CoreContext,
  ): Promise<CoreExecutionResult> {
    if (!result.error) {
      return result;
    }

    context.errors.push(
      result.error.code,
    );

    const diagnosis =
      await this.diagnostics.diagnose(
        result.error,
        context,
      );

    await this.publishEvent(
      "diagnostics.completed",
      {
        requestId: request.id,
        jobId: result.jobId,
        diagnosis:
          diagnosis.diagnosis,
        recommendedAction:
          diagnosis.recommendedAction,
      },
    );

    if (
      diagnosis.recommendedAction ===
        "RETRY" &&
      result.error.retryable
    ) {
      if (
        this.canRetry(
          result.error,
        )
      ) {
        const retry =
          await this.runtime.retryJob(
            result.jobId,
          );

        if (retry.success) {
          return retry;
        }
      }
    }

    if (
      diagnosis.recommendedAction ===
      "ESCALATE"
    ) {
      return this.escalateRequest(
        request,
        diagnosis.diagnosis,
      );
    }

    if (
      diagnosis.recommendedAction ===
      "STOP"
    ) {
      this.status =
        "DEGRADED";
    }
return (
  error.retryable === true &&
  this.co
    return result;
  }
  private canRetry(
    error: CoreError,
  ): boolean {
        return result;
  }

  private canRetry(
    error: CoreError,
  ): boolean {
    return (
      error.retryable === true &&
      this.config.maxRetryAttempts > 0
    );
  }

  /* ========================================================
   * 14. REQUEST REJECTION
   * ========================================================
   */

  private async rejectRequest(
    request: CoreRequest,
    code: string,
    message: string,
  ): Promise<CoreExecutionResult> {
    const error: CoreError = {
      code,
      message,
      component: this.id,
      retryable: false,
      severity: "ERROR",
      occurredAt: new Date().toISOString(),
    };

    await this.publishEvent(
      "request.rejected",
      {
        requestId: request.id,
        error,
      },
    );

    this.status = "READY";

    return {
      success: false,
      status: "REJECTED",
      error,
      jobId: `REQUEST:${request.id}`,
    };
  }

  /* ========================================================
   * 15. REQUEST ESCALATION
   * ========================================================
   */

  private async escalateRequest(
    request: CoreRequest,
    reason: string,
  ): Promise<CoreExecutionResult> {
    const error: CoreError = {
      code: "ESCALATION_REQUIRED",
      message: reason,
      component: this.id,
      retryable: false,
      severity: "WARNING",
      occurredAt: new Date().toISOString(),
    };

    await this.publishEvent(
      "request.escalated",
      {
        requestId: request.id,
        reason,
      },
    );

    this.status = "READY";

    return {
      success: false,
      status: "ESCALATED",
      error,
      jobId: `REQUEST:${request.id}`,
    };
  }

  /* ========================================================
   * 16. UNEXPECTED ERROR HANDLING
   * ========================================================
   */

  private async handleUnexpectedError(
    error: unknown,
    request: CoreRequest,
    context: CoreContext,
  ): Promise<CoreExecutionResult> {
    const coreError =
      this.normalizeError(
        error,
        "CORE_UNEXPECTED_ERROR",
        this.id,
      );

    context.errors.push(
      coreError.code,
    );

    await this.publishEvent(
      "core.error",
      {
        requestId: request.id,
        error: coreError,
      },
    );

    this.status = "DEGRADED";

    return {
      success: false,
      status: "FAILED",
      error: coreError,
      jobId: `REQUEST:${request.id}`,
    };
  }

  /* ========================================================
   * 17. ERROR NORMALIZATION
   * ========================================================
   */

  private normalizeError(
    error: unknown,
    code: string,
    component: string,
  ): CoreError {
    return {
      code,
      message:
        error instanceof Error
          ? error.message
          : String(error),
      component,
      retryable: true,
      severity: "ERROR",
      occurredAt:
        new Date().toISOString(),
    };
  }

  /* ========================================================
   * 18. EVENT PUBLISHING
   * ========================================================
   */

  private async publishEvent(
    type: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const event: CoreEvent = {
      id: this.generateId("EVENT"),
      type,
      source: this.id,
      timestamp:
        new Date().toISOString(),
      payload,
    };

    await this.events.publish(
      event,
    );
  }

  /* ========================================================
   * 19. ID GENERATION
   * ========================================================
   */

  private generateId(
    prefix: string,
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

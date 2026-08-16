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
 * IMPORTANT:
 * OWNER remains the highest authority.
 *
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
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
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

  validateActor(
    actorId: string,
    actorType: string,
  ): boolean;

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
 * 3. CONFIGURATION
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
 * 4. SOVEREIGN CORE
 * ============================================================
 */

export class SovereignCore {
  public readonly id = "SOVEREIGN-CORE-04";
  public readonly version = "1.0.0";

  private status: CoreStatus = "INITIALIZING";

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

  private readonly activeJobs =
    new Map<string, CoreJob>();

  private readonly contexts =
    new Map<string, CoreContext>();

  private readonly retryCounts =
    new Map<string, number>();

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
    this.authority = dependencies.authority;
    this.policy = dependencies.policy;
    this.planner = dependencies.planner;
    this.runtime = dependencies.runtime;
    this.agents = dependencies.agents;
    this.capabilities = dependencies.capabilities;
    this.memory = dependencies.memory;
    this.events = dependencies.events;
    this.diagnostics = dependencies.diagnostics;
  }

  /* ==========================================================
   * INITIALIZATION
   * ==========================================================
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

  /* ==========================================================
   * STATUS
   * ==========================================================
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

  /* ==========================================================
   * REQUEST ENTRY
   * ==========================================================
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
          allowed: policyDecision.allowed,
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

      if (policyDecision.requiresApproval) {
        return this.escalateRequest(
          request,
          "APPROVAL_REQUIRED",
        );
      }

      context.decisions.push("PLAN");

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

      const valid =
        await this.validatePlan(
          plan,
          request,
          context,
        );

      if (!valid) {
        return this.rejectRequest(
          request,
          "PLAN_POLICY_REJECTED",
          "Plan failed policy validation.",
        );
      }

      return await this.executePlan(
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

  /* ==========================================================
   * CONTEXT
   * ==========================================================
   */

  private async createContext(
    request: CoreRequest,
  ): Promise<CoreContext> {
    const now = new Date().toISOString();

    const authority =
      this.authority.getAuthority();

    const context: CoreContext = {
      requestId: request.id,
      correlationId:
        this.generateId("CORR"),
      ownerId:
        authority.ownerId ||
        this.config.ownerId,
      stewardId:
        authority.stewardId ??
        this.config.stewardId,
      createdAt: now,
      updatedAt: now,
      data: {
        request,
      },
      decisions: ["ACCEPT"],
      events: [],
      errors: [],
    };

    this.contexts.set(
      request.id,
      context,
    );

    await this.memory.save(
      `context:${request.id}`,
      context,
    );

    return context;
  }

  /* ==========================================================
   * PLAN VALIDATION
   * ==========================================================
   */

  private async validatePlan(
    plan: CorePlan,
    request: CoreRequest,
    context: CoreContext,
  ): Promise<boolean> {
    if (!plan.steps.length) {
      return false;
    }

    plan.status = "POLICY_CHECK";

    const orderedSteps =
      [...plan.steps].sort(
        (a, b) => a.order - b.order,
      );

    for (const step of orderedSteps) {
      if (step.capabilityId) {
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

          plan.status = "REJECTED";

          return false;
        }
      }

      if (!step.agentId) {
        const agentId =
          await this.agents
            .findAgentForStep(step);

        if (agentId) {
          step.agentId = agentId;
        }
      } else {
        const agent =
          await this.agents.getAgent(
            step.agentId,
          );

        if (!agent) {
          await this.publishEvent(
            "agent.validation.failed",
            {
              requestId: request.id,
              planId: plan.id,
              agentId: step.agentId,
            },
          );

          plan.status = "REJECTED";

          return false;
        }
      }

      step.policyChecked = true;
      step.status = "APPROVED";
    }

    plan.status = "APPROVED";

    context.decisions.push(
      "EXECUTE",
    );

    context.updatedAt =
      new Date().toISOString();

    await this.memory.save(
      `plan:${plan.id}`,
      plan,
    );

    return true;
  }

  /* ==========================================================
   * PLAN EXECUTION
   * ==========================================================
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

    const orderedSteps =
      [...plan.steps].sort(
        (a, b) => a.order - b.order,
      );

    for (const step of orderedSteps) {
      step.status = "EXECUTING";

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

        await this.memory.save(
          `plan:${plan.id}`,
          plan,
        );

        return this.handleJobFailure(
          result,
          request,
          context,
        );
      }

      finalOutput = {
        ...finalOutput,
        ...(result.output ?? {}),
      };

      step.status = "COMPLETED";
    }

    plan.status = "COMPLETED";

    context.decisions.push(
      "COMPLETE",
    );

    context.updatedAt =
      new Date().toISOString();

    await this.memory.save(
      `plan:${plan.id}`,
      plan,
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

    this.status = "READY";

    return {
      success: true,
      status: "COMPLETED",
      output: finalOutput,
      jobId: `PLAN:${plan.id}`,
    };
  }

  /* ==========================================================
   * JOB CREATION
   * ==========================================================
   */

  private async createJob(
    plan: CorePlan,
    step: CorePlanStep,
    request: CoreRequest,
  ): Promise<CoreJob> {
    const job: CoreJob = {
      id: this.generateId("JOB"),
      requestId: request.id,
      planId: plan.id,
      agentId: step.agentId,
      capabilityId:
        step.capabilityId,
      status: "PENDING",
      attempts: 0,
      input: {
        ...step.input,
      },
      createdAt:
        new Date().toISOString(),
    };

    this.activeJobs.set(
      job.id,
      job,
    );

    const created =
      await this.runtime.createJob(
        job,
      );

    this.activeJobs.set(
      created.id,
      created,
    );

    await this.publishEvent(
      "job.created",
      {
        requestId: request.id,
        jobId: created.id,
        planId: plan.id,
      },
    );

    return created;
  }

  /* ==========================================================
   * JOB EXECUTION
   * ==========================================================
   */

  private async executeJob(
    job: CoreJob,
    context: CoreContext,
  ): Promise<CoreExecutionResult> {
    job.status = "EXECUTING";
    job.startedAt =
      new Date().toISOString();
    job.attempts += 1;

    await this.publishEvent(
      "job.started",
      {
        jobId: job.id,
        requestId: job.requestId,
      },
    );

    try {
      const result =
        await this.runtime.executeJob(
          job,
          context,
        );

      if (result.success) {
        if (
          this.config.requireVerification
        ) {
          job.status = "VERIFYING";

          await this.publishEvent(
            "job.verifying",
            {
              jobId: job.id,
              requestId:
                job.requestId,
            },
          );
        }

        job.output =
          result.output;

        job.status = "COMPLETED";
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
        job.status = "FAILED";
        job.error = result.error;
        job.completedAt =
          new Date().toISOString();

        await this.publishEvent(
          "job.failed",
          {
            jobId: job.id,
            requestId:
              job.requestId,
            error:
              result.error,
          },
        );
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

      job.status = "FAILED";
      job.error = coreError;
      job.completedAt =
        new Date().toISOString();

      this.activeJobs.delete(
        job.id,
      );

      await this.publishEvent(
        "job.failed",
        {
          jobId: job.id,
          requestId:
            job.requestId,
          error: coreError,
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

  /* ==========================================================
   * FAILURE HANDLING
   * ==========================================================
   */

  private async handleJobFailure(
    result: CoreExecutionResult,
    request: CoreRequest,
    context: CoreContext,
  ): Promise<CoreExecutionResult> {
    if (!result.error) {
      this.status = "DEGRADED";
      return result;
    }

    context.errors.push(
      result.error.code,
    );

  context.updatedAt =
  new Date().toISOString();

  

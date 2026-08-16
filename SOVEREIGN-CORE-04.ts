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
        this.config.requirePolicyCheck
          ? await this.policy.evaluate(
              request,
              context,
            )
          : {
              allowed: true,
              requiresApproval: false,
              reason: "Policy check disabled by core configuration.",
              permissions: [],
              restrictions: [],
            };

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
          "Plan failed validation.",
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

      if (step.requiresApproval) {
        await this.publishEvent(
          "step.approval.required",
          {
            requestId: request.id,
            planId: plan.id,
            stepId: step.id,
          },
        );

        plan.status = "REJECTED";
        return false;
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

    await this.memory.save(
      `context:${request.id}`,
      context,
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
      `context:${request.id}`,
      context,
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

      return {
        ...result,
        jobId: result.jobId || job.id,
      };
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

      context.updatedAt =
        new Date().toISOString();

      await this.memory.save(
        `context:${request.id}`,
        context,
      );

      return result;
    }

    context.errors.push(
      result.error.code,
    );

    context.updatedAt =
      new Date().toISOString();

    await this.memory.save(
      `context:${request.id}`,
      context,
    );

    const diagnosis =
      await this.diagnostics.diagnose(
        result.error,
        context,
      );

    await this.publishEvent(
      "failure.diagnosed",
      {
        requestId: request.id,
        jobId: result.jobId,
        diagnosis:
          diagnosis.diagnosis,
        recommendedAction:
          diagnosis.recommendedAction,
      },
    );

    switch (
      diagnosis.recommendedAction
    ) {
      case "RETRY":
        return this.retryFailedJob(
          result,
          request,
          context,
        );

      case "ROLLBACK":
        this.status = "DEGRADED";

        context.decisions.push(
          "ESCALATE",
        );

        await this.publishEvent(
          "rollback.required",
          {
            requestId: request.id,
            jobId: result.jobId,
          },
        );

        return {
          ...result,
          status: "ESCALATED",
        };

      case "ESCALATE":
        return this.escalateRequest(
          request,
          result.error.message,
          result.jobId,
        );

      case "STOP":
        this.status = "FAILED";

        await this.publishEvent(
          "core.execution.stopped",
          {
            requestId: request.id,
            jobId: result.jobId,
            reason:
              result.error.message,
          },
        );

        return result;
    }
  }

  /* ==========================================================
   * RETRY
   * ==========================================================
   */

  private async retryFailedJob(
    result: CoreExecutionResult,
    request: CoreRequest,
    context: CoreContext,
  ): Promise<CoreExecutionResult> {
    const current =
      this.retryCounts.get(
        result.jobId,
      ) ?? 0;

    if (
      current >=
      this.config.maxRetryAttempts
    ) {
      return this.escalateRequest(
        request,
        "MAX_RETRY_ATTEMPTS_REACHED",
        result.jobId,
      );
    }

    const next =
      current + 1;

    this.retryCounts.set(
      result.jobId,
      next,
    );

    context.decisions.push(
      "RETRY",
    );

    context.updatedAt =
      new Date().toISOString();

    await this.memory.save(
      `context:${request.id}`,
      context,
    );

    await this.publishEvent(
      "job.retrying",
      {
        requestId: request.id,
        jobId: result.jobId,
        attempt: next,
      },
    );

    try {
      const retried =
        await this.runtime.retryJob(
          result.jobId,
        );

      if (retried.success) {
        this.retryCounts.delete(
          result.jobId,
        );

        this.status = "READY";

        await this.publishEvent(
          "job.retry.completed",
          {
            requestId:
              request.id,
            jobId:
              result.jobId,
            attempt: next,
          },
        );

        return retried;
      }

      return this.handleJobFailure(
        retried,
        request,
        context,
      );
    } catch (error) {
      const coreError =
        this.normalizeError(
          error,
          "RUNTIME_RETRY_ERROR",
          "RUNTIME",
        );

      return this.handleJobFailure(
        {
          success: false,
          status: "FAILED",
          error: coreError,
          jobId: result.jobId,
        },
        request,
        context,
      );
    }
  }

  /* ==========================================================
   * REJECTION / ESCALATION
   * ==========================================================
   */

  private async rejectRequest(
    request: CoreRequest,
    code: string,
    message: string,
  ): Promise<CoreExecutionResult> {
    const error: CoreError = {
      code,
      message,
      component: "CORE",
      retryable: false,
      severity: "ERROR",
      occurredAt:
        new Date().toISOString(),
      details: {
        requestId: request.id,
      },
    };

    const context =
      this.contexts.get(
        request.id,
      );

    if (context) {
      context.decisions.push(
        "REJECT",
      );

      context.errors.push(
        code,
      );

      context.updatedAt =
        new Date().toISOString();

      await this.memory.save(
        `context:${request.id}`,
        context,
      );
    }

    await this.publishEvent(
      "request.rejected",
      {
        requestId: request.id,
        code,
        message,
      },
    );

    this.restoreReadyStatus();

    return {
      success: false,
      status: "REJECTED",
      error,
      jobId: `REQUEST:${request.id}`,
    };
  }

  private async escalateRequest(
    request: CoreRequest,
    reason: string,
    jobId?: string,
  ): Promise<CoreExecutionResult> {
    const error: CoreError = {
      code: "ESCALATION_REQUIRED",
      message: reason,
      component: "CORE",
      retryable: false,
      severity: "WARNING",
      occurredAt:
        new Date().toISOString(),
      details: {
        requestId: request.id,
        jobId,
      },
    };

    const context =
      this.contexts.get(
        request.id,
      );

    if (context) {
      context.decisions.push(
        "ESCALATE",
      );

      context.updatedAt =
        new Date().toISOString();

      await this.memory.save(
        `context:${request.id}`,
        context,
      );
    }

    await this.publishEvent(
      "request.escalated",
      {
        requestId: request.id,
        jobId,
        reason,
      },
    );

    this.restoreReadyStatus();

    return {
      success: false,
      status: "ESCALATED",
      error,
      jobId:
        jobId ??
        `REQUEST:${request.id}`,
    };
  }

  /* ==========================================================
   * UNEXPECTED ERROR
   * ==========================================================
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
        "CORE",
      );

    context.errors.push(
      coreError.code,
    );

    context.updatedAt =
      new Date().toISOString();

    await this.memory.save(
      `context:${request.id}`,
      context,
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
      jobId:
        `REQUEST:${request.id}`,
    };
  }

  /* ==========================================================
   * CONTROL
   * ==========================================================
   */

  public async pause(): Promise<void> {
    this.status = "PAUSED";

    await this.publishEvent(
      "core.paused",
      {
        coreId: this.id,
      },
    );
  }

  public async resume(): Promise<void> {
    if (
      this.status !== "PAUSED" &&
      this.status !== "DEGRADED" &&
      this.status !== "RECOVERING"
    ) {
      return;
    }

    this.status = "READY";

    await this.publishEvent(
      "core.resumed",
      {
        coreId: this.id,
      },
    );
  }

  public async stop(): Promise<void> {
    this.status = "STOPPED";

    const jobs =
      [...this.activeJobs.keys()];

    for (const jobId of jobs) {
      try {
        await this.runtime.cancelJob(
          jobId,
        );
      } catch {
        // Continue stopping remaining jobs.
      }

      this.activeJobs.delete(
        jobId,
      );
    }

    await this.publishEvent(
      "core.stopped",
      {
        coreId: this.id,
      },
    );
  }

  /* ==========================================================
   * EVENT SYSTEM
   * ==========================================================
   */

  private async publishEvent(
    type: string,
    payload:
      Record<string, unknown>,
  ): Promise<void> {
    const event: CoreEvent = {
      id: this.generateId(
        "EVENT",
      ),
      type,
      source: this.id,
      timestamp:
        new Date().toISOString(),
      requestId:
        typeof payload.requestId ===
        "string"
          ? payload.requestId
          : undefined,
      jobId:
        typeof payload.jobId ===
        "string"
          ? payload.jobId
          : undefined,
      agentId:
        typeof payload.agentId ===
        "string"
          ? payload.agentId
          : undefined,
      capabilityId:
        typeof payload.capabilityId ===
        "string"
          ? payload.capabilityId
          : undefined,
      payload: {
        ...payload,
      },
    };

    if (event.requestId) {
      const context =
        this.contexts.get(
          event.requestId,
        );

      if (context) {
        context.events.push(
          event.id,
        );

        context.updatedAt =
          event.timestamp;
      }
    }

    await this.events.publish(
      event,
    );
  }

  /* ==========================================================
   * ERROR NORMALIZATION
   * ==========================================================
   */

  private normalizeError(
    error: unknown,
    code: string,
    component: string,
  ): CoreError {
    if (
      this.isCoreError(error)
    ) {
      return {
        ...error,
        details:
          error.details
            ? {
                ...error.details,
              }
            : undefined,
      };
    }

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
      details:
        error instanceof Error
          ? {
              name:
                error.name,
              stack:
                error.stack,
            }
          : undefined,
    };
  }

  private isCoreError(
    value: unknown,
  ): value is CoreError {
    if (
      typeof value !==
        "object" ||
      value === null
    ) {
      return false;
    }

    const candidate =
      value as Partial<CoreError>;

    return (
      typeof candidate.code ===
        "string" &&
      typeof candidate.message ===
        "string" &&
      typeof candidate.component ===
        "string" &&
      typeof candidate.retryable ===
        "boolean" &&
      typeof candidate.occurredAt ===
        "string"
    );
  }

  /* ==========================================================
   * UTILITIES
   * ==========================================================
   */

  private restoreReadyStatus(): void {
    if (
      this.status !== "STOPPED" &&
      this.status !== "FAILED" &&
      this.activeJobs.size === 0
    ) {
      this.status = "READY";
    }
  }

  private generateId(
    prefix: string,
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

export default SovereignCore;

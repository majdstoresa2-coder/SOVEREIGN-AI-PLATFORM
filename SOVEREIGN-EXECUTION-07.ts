/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-EXECUTION-07
 * ============================================================
 *
 * Purpose:
 * Sovereign Execution Layer.
 *
 * Responsibility:
 * Convert an approved Sovereign Plan into controlled Jobs.
 *
 * Flow:
 *
 * Approved Plan
 *      ↓
 * Execution Validation
 *      ↓
 * Job Creation
 *      ↓
 * Runtime Dispatch
 *      ↓
 * Result / Error
 *      ↓
 * Verification
 *
 * This layer does NOT grant permissions.
 * This layer does NOT bypass Policy.
 * This layer does NOT execute unauthorized operations.
 * Runtime remains responsible for actual process execution.
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. TYPES
 * ============================================================
 */

export type ExecutionStatus =
  | "PENDING"
  | "VALIDATING"
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "BLOCKED";

export type ExecutionResultStatus =
  | "SUCCESS"
  | "FAILED"
  | "PARTIAL"
  | "CANCELLED";

/* ============================================================
 * 2. EXECUTION REQUEST
 * ============================================================
 */

export interface ExecutionRequest {
  planId: string;

  requestedBy: string;

  approved: boolean;

  approvalReference?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 3. EXECUTION STEP
 * ============================================================
 */

export interface ExecutionStep {
  id: string;

  planStepId: string;

  order: number;

  name: string;

  status: ExecutionStatus;

  agentId?: string;

  capabilityId?: string;

  input: Record<string, unknown>;

  output?: Record<string, unknown>;

  error?: ExecutionError;

  attempts: number;

  startedAt?: string;

  completedAt?: string;

  dependencies: string[];
}

/* ============================================================
 * 4. EXECUTION ERROR
 * ============================================================
 */

export interface ExecutionError {
  code: string;

  message: string;

  component: string;

  retryable: boolean;

  severity:
    | "WARNING"
    | "ERROR"
    | "CRITICAL";

  occurredAt: string;

  details?: Record<string, unknown>;
}

/* ============================================================
 * 5. EXECUTION JOB
 * ============================================================
 */

export interface SovereignExecutionJob {
  id: string;

  planId: string;

  status: ExecutionStatus;

  createdAt: string;

  startedAt?: string;

  completedAt?: string;

  steps: ExecutionStep[];

  attempts: number;

  result?: ExecutionResult;

  error?: ExecutionError;

  parentJobId?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. EXECUTION RESULT
 * ============================================================
 */

export interface ExecutionResult {
  status: ExecutionResultStatus;

  jobId: string;

  completedSteps: string[];

  failedSteps: string[];

  skippedSteps: string[];

  output: Record<string, unknown>;

  completedAt: string;
}

/* ============================================================
 * 7. RUNTIME DISPATCH CONTRACT
 * ============================================================
 *
 * Execution does not directly control operating-system
 * processes. It sends validated execution instructions
 * to the Runtime layer.
 * ============================================================
 */

export interface RuntimeDispatchRequest {
  jobId: string;

  stepId: string;

  capabilityId?: string;

  agentId?: string;

  input: Record<string, unknown>;

  metadata?: Record<string, unknown>;
}

export interface RuntimeDispatchResult {
  accepted: boolean;

  jobId: string;

  stepId: string;

  output?: Record<string, unknown>;

  error?: ExecutionError;
}

/* ============================================================
 * 8. POLICY VALIDATION CONTRACT
 * ============================================================
 */

export interface ExecutionPolicyValidator {
  validate(
    request: ExecutionRequest,
    plan: {
      id: string;
      status: string;
      steps: Array<{
        id: string;
        requiresApproval: boolean;
        policyChecked: boolean;
      }>;
    }
  ): {
    allowed: boolean;

    reason?: string;

    restrictions?: string[];
  };
}

/* ============================================================
 * 9. EXECUTION ENGINE
 * ============================================================
 */

export class SovereignExecutionEngine {
  public readonly id = "SOVEREIGN-EXECUTION-07";

  public readonly version = "1.0.0";

  private jobs = new Map<string, SovereignExecutionJob>();

  private runtimeDispatcher?:
    (
      request: RuntimeDispatchRequest
    ) => Promise<RuntimeDispatchResult>;

  private policyValidator?:
    ExecutionPolicyValidator;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setRuntimeDispatcher(
    dispatcher: (
      request: RuntimeDispatchRequest
    ) => Promise<RuntimeDispatchResult>
  ): void {
    this.runtimeDispatcher = dispatcher;
  }

  setPolicyValidator(
    validator: ExecutionPolicyValidator
  ): void {
    this.policyValidator = validator;
  }

  /* ==========================================================
   * CREATE EXECUTION JOB
   * ==========================================================
   */

  createJob(
    request: ExecutionRequest,
    plan: {
      id: string;
      status: string;
      steps: Array<{
        id: string;
        order: number;
        name: string;
        requiresApproval: boolean;
        policyChecked: boolean;
        agentId?: string;
        capabilityId?: string;
        input: Record<string, unknown>;
        dependencies?: string[];
      }>;
    }
  ): SovereignExecutionJob {
    this.validateExecutionRequest(request, plan);

    const steps: ExecutionStep[] =
      plan.steps.map((step) => ({
        id: this.createId("EXEC-STEP"),

        planStepId: step.id,

        order: step.order,

        name: step.name,

        status: "PENDING",

        agentId: step.agentId,

        capabilityId: step.capabilityId,

        input: step.input,

        attempts: 0,

        dependencies: step.dependencies ?? [],
      }));

    const job: SovereignExecutionJob = {
      id: this.createId("JOB"),

      planId: plan.id,

      status: "READY",

      createdAt: this.now(),

      steps,

      attempts: 0,

      metadata: request.metadata,
    };

    this.jobs.set(job.id, job);

    return job;
  }

  /* ==========================================================
   * EXECUTE JOB
   * ==========================================================
   */

  async executeJob(
    jobId: string
  ): Promise<SovereignExecutionJob> {
    const job = this.requireJob(jobId);

    if (job.status !== "READY") {
      throw new Error(
        `Job ${jobId} is not ready for execution.`
      );
    }

    if (!this.runtimeDispatcher) {
      throw new Error(
        "Runtime dispatcher is not configured."
      );
    }

    job.status = "RUNNING";

    job.startedAt = this.now();

    job.attempts += 1;

    for (const step of job.steps) {
      if (step.status === "COMPLETED") {
        continue;
      }

      if (!this.dependenciesCompleted(job, step)) {
        step.status = "BLOCKED";

        job.status = "BLOCKED";

        job.error = {
          code: "EXECUTION_DEPENDENCY_BLOCKED",

          message:
            `Dependencies for step ${step.id} are not completed.`,

          component: this.id,

          retryable: false,

          severity: "ERROR",

          occurredAt: this.now(),
        };

        return job;
      }

      step.status = "RUNNING";

      step.startedAt = this.now();

      step.attempts += 1;

      const result =
        await this.runtimeDispatcher({
          jobId: job.id,

          stepId: step.id,

          capabilityId: step.capabilityId,

          agentId: step.agentId,

          input: step.input,

          metadata: job.metadata,
        });

      if (!result.accepted || result.error) {
        step.status = "FAILED";

        step.error =
          result.error ?? {
            code: "RUNTIME_DISPATCH_FAILED",

            message:
              "Runtime rejected the execution request.",

            component: this.id,

            retryable: true,

            severity: "ERROR",

            occurredAt: this.now(),
          };

        job.status = "FAILED";

        job.error = step.error;

        return job;
      }

      step.output = result.output;

      step.status = "COMPLETED";

      step.completedAt = this.now();
    }

    job.status = "COMPLETED";

    job.completedAt = this.now();

    job.result = {
      status: "SUCCESS",

      jobId: job.id,

      completedSteps: job.steps
        .filter(
          (step) =>
            step.status === "COMPLETED"
        )
        .map((step) => step.id),

      failedSteps: job.steps
        .filter(
          (step) =>
            step.status === "FAILED"
        )
        .map((step) => step.id),

      skippedSteps: job.steps
        .filter(
          (step) =>
            step.status === "SKIPPED"
        )
        .map((step) => step.id),

      output: this.collectOutputs(job),

      completedAt: this.now(),
    };

    return job;
  }

  /* ==========================================================
   * PAUSE
   * ==========================================================
   */

  pauseJob(jobId: string): SovereignExecutionJob {
    const job = this.requireJob(jobId);

    if (job.status !== "RUNNING") {
      throw new Error(
        "Only running jobs can be paused."
      );
    }

    job.status = "PAUSED";

    return job;
  }

  /* ==========================================================
   * CANCEL
   * ==========================================================
   */

  cancelJob(jobId: string): SovereignExecutionJob {
    const job = this.requireJob(jobId);

    if (
      job.status === "COMPLETED" ||
      job.status === "CANCELLED"
    ) {
      return job;
    }

    job.status = "CANCELLED";

    job.completedAt = this.now();

    return job;
  }

  /* ==========================================================
   * GET JOB
   * ==========================================================
   */

  getJob(
    jobId: string
  ): SovereignExecutionJob | undefined {
    return this.jobs.get(jobId);
  }

  /* ==========================================================
   * LIST JOBS
   * ==========================================================
   */

  listJobs(): SovereignExecutionJob[] {
    return Array.from(this.jobs.values());
  }

  /* ==========================================================
   * VALIDATE EXECUTION
   * ==========================================================
   */

  private validateExecutionRequest(
    request: ExecutionRequest,
    plan: {
      id: string;
      status: string;
      steps: Array<{
        requiresApproval: boolean;
        policyChecked: boolean;
      }>;
    }
  ): void {
    if (plan.status !== "APPROVED" &&
        plan.status !== "READY") {
      throw new Error(
        "Only approved or ready plans can be executed."
      );
    }

    for (const step of plan.steps) {
      if (!step.policyChecked) {
        throw new Error(
          "Execution blocked: a plan step has not passed policy checking."
        );
      }
    }

    const approvalRequired =
      plan.steps.some(
        (step) =>
          step.requiresApproval
      );

    if (
      approvalRequired &&
      !request.approved
    ) {
      throw new Error(
        "Execution requires an explicit approval."
      );
    }

    if (this.policyValidator) {
      const result =
        this.policyValidator.validate(
          request,
          plan
        );

      if (!result.allowed) {
        throw new Error(
          result.reason ??
          "Execution rejected by policy."
        );
      }
    }
  }

  /* ==========================================================
   * DEPENDENCY CHECK
   * ==========================================================
   */

  private dependenciesCompleted(
    job: SovereignExecutionJob,
    step: ExecutionStep
  ): boolean {
    return step.dependencies.every(
      (dependencyId) => {
        const dependency =
          job.steps.find(
            (candidate) =>
              candidate.id === dependencyId
          );

        return (
          dependency !== undefined &&
          dependency.status === "COMPLETED"
        );
      }
    );
  }

  /* ==========================================================
   * OUTPUT COLLECTION
   * ==========================================================
   */

  private collectOutputs(
    job: SovereignExecutionJob
  ): Record<string, unknown> {
    const output: Record<string, unknown> = {};

    for (const step of job.steps) {
      if (step.output) {
        output[step.id] = step.output;
      }
    }

    return output;
  }

  /* ==========================================================
   * INTERNAL HELPERS
   * ==========================================================
   */

  private requireJob(
    jobId: string
  ): SovereignExecutionJob {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new Error(
        `Execution job not found: ${jobId}`
      );
    }

    return job;
  }

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  private now(): string {
    return new Date().toISOString();
  }
}

/* ============================================================
 * 10. FACTORY
 * ============================================================
 */

export function createSovereignExecutionEngine():
  SovereignExecutionEngine {
  return new SovereignExecutionEngine();
}

/* ============================================================
 * 11. ARCHITECTURAL BOUNDARY
 * ============================================================
 *
 * EXECUTION-07:
 *
 * DOES:
 * - Validate approved plans.
 * - Create traceable execution jobs.
 * - Track execution steps.
 * - Dispatch approved work to Runtime.
 * - Track attempts.
 * - Track errors.
 * - Track outputs.
 * - Support pause/cancel.
 *
 * DOES NOT:
 * - Grant authority.
 * - Grant permissions.
 * - Bypass Policy.
 * - Directly execute operating-system commands.
 * - Replace Runtime.
 *
 * Runtime remains the controlled execution environment.
 * ============================================================
 */

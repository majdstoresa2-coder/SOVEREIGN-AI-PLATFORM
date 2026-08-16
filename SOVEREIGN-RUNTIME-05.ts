/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-RUNTIME-05
 * ============================================================
 *
 * Purpose:
 * Central execution runtime for the Sovereign AI Platform.
 *
 * Responsibilities:
 * - Create jobs.
 * - Start jobs.
 * - Pause jobs.
 * - Resume jobs.
 * - Cancel jobs.
 * - Retry jobs.
 * - Track execution state.
 * - Track attempts.
 * - Track resources.
 * - Emit runtime events.
 * - Normalize execution errors.
 * - Preserve execution history.
 *
 * Authority Boundary:
 *
 * OWNER
 *   ↓
 * STEWARD
 *   ↓
 * CORE
 *   ↓
 * RUNTIME
 *   ↓
 * EXECUTION
 *
 * Runtime NEVER becomes sovereign authority.
 * Runtime NEVER bypasses policy.
 * Runtime NEVER bypasses permissions.
 * Runtime NEVER overrides Owner authority.
 *
 * Game Factory is NOT part of Runtime.
 * Game Factory will later exist as a Capability.
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. TYPES
 * ============================================================
 */

export type RuntimeStatus =
  | "INITIALIZING"
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "DEGRADED"
  | "FAILED"
  | "STOPPED"
  | "RECOVERING";

export type JobStatus =
  | "PENDING"
  | "QUEUED"
  | "STARTING"
  | "RUNNING"
  | "PAUSED"
  | "VERIFYING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "RETRYING"
  | "STOPPED";

export type JobPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type ExecutionAction =
  | "START"
  | "PAUSE"
  | "RESUME"
  | "CANCEL"
  | "RETRY"
  | "STOP";

export interface RuntimeJob {
  id: string;

  type: string;

  status: JobStatus;

  priority: JobPriority;

  createdAt: string;

  queuedAt?: string;

  startedAt?: string;

  completedAt?: string;

  pausedAt?: string;

  cancelledAt?: string;

  attempts: number;

  maxAttempts: number;

  input: Record<string, unknown>;

  output?: Record<string, unknown>;

  error?: RuntimeError;

  logs: string[];

  parentJobId?: string;

  requestId?: string;

  planId?: string;

  agentId?: string;

  capabilityId?: string;

  metadata?: Record<string, unknown>;
}

export interface RuntimeError {
  code: string;

  message: string;

  component: string;

  severity:
    | "INFO"
    | "WARNING"
    | "ERROR"
    | "CRITICAL";

  retryable: boolean;

  occurredAt: string;

  details?: Record<string, unknown>;
}

export interface RuntimeEvent {
  id: string;

  type: string;

  source: string;

  timestamp: string;

  jobId?: string;

  requestId?: string;

  planId?: string;

  agentId?: string;

  capabilityId?: string;

  payload: Record<string, unknown>;
}

export interface RuntimeResource {
  id: string;

  type:
    | "CPU"
    | "MEMORY"
    | "STORAGE"
    | "NETWORK"
    | "GPU"
    | "PROCESS";

  total: number;

  used: number;

  available: number;

  unit: string;

  status:
    | "HEALTHY"
    | "DEGRADED"
    | "EXHAUSTED";
}

export interface RuntimeExecutionContext {
  requestId?: string;

  planId?: string;

  jobId: string;

  agentId?: string;

  capabilityId?: string;

  permissions: string[];

  restrictions: string[];

  environment: Record<string, unknown>;

  metadata?: Record<string, unknown>;
}

export interface RuntimeExecutionResult {
  success: boolean;

  status: JobStatus;

  output?: Record<string, unknown>;

  error?: RuntimeError;

  jobId: string;

  attempts: number;

  durationMs?: number;
}

export interface RuntimePolicyGuard {
  validateExecution(
    job: RuntimeJob,
    context: RuntimeExecutionContext,
  ): Promise<{
    allowed: boolean;

    reason: string;

    restrictions: string[];
  }>;
}

export interface RuntimeExecutor {
  execute(
    job: RuntimeJob,
    context: RuntimeExecutionContext,
  ): Promise<RuntimeExecutionResult>;

  stop(
    job: RuntimeJob,
    context: RuntimeExecutionContext,
  ): Promise<boolean>;

  cleanup(
    job: RuntimeJob,
    context: RuntimeExecutionContext,
  ): Promise<void>;
}

export interface RuntimeEventBus {
  publish(
    event: RuntimeEvent,
  ): Promise<void>;
}

export interface RuntimeResourceManager {
  getResources(): Promise<
    RuntimeResource[]
  >;

  reserve(
    job: RuntimeJob,
  ): Promise<boolean>;

  release(
    job: RuntimeJob,
  ): Promise<void>;
}

export interface RuntimeAudit {
  record(
    operation: string,
    job: RuntimeJob,
    result:
      | "SUCCESS"
      | "FAILED"
      | "DENIED",
    metadata?: Record<string, unknown>,
  ): Promise<void>;
}

/* ============================================================
 * 2. CONFIGURATION
 * ============================================================
 */

export interface SovereignRuntimeConfig {
  maxConcurrentJobs: number;

  defaultMaxAttempts: number;

  requirePolicyValidation: boolean;

  requireResourceValidation: boolean;

  autoRetryEnabled: boolean;

  preserveLogs: boolean;
}

/* ============================================================
 * 3. RUNTIME CLASS
 * ============================================================
 */

export class SovereignRuntime {
  public readonly id =
    "SOVEREIGN-RUNTIME-05";

  public readonly version =
    "1.0.0";

  private status: RuntimeStatus =
    "INITIALIZING";

  private readonly config:
    SovereignRuntimeConfig;

  private readonly policy:
    RuntimePolicyGuard;

  private readonly executor:
    RuntimeExecutor;

  private readonly events:
    RuntimeEventBus;

  private readonly resources:
    RuntimeResourceManager;

  private readonly audit:
    RuntimeAudit;

  private jobs =
    new Map<string, RuntimeJob>();

  private activeJobs =
    new Set<string>();

  constructor(
    config: SovereignRuntimeConfig,
    dependencies: {
      policy: RuntimePolicyGuard;

      executor: RuntimeExecutor;

      events: RuntimeEventBus;

      resources: RuntimeResourceManager;

      audit: RuntimeAudit;
    },
  ) {
    this.config = config;

    this.policy =
      dependencies.policy;

    this.executor =
      dependencies.executor;

    this.events =
      dependencies.events;

    this.resources =
      dependencies.resources;

    this.audit =
      dependencies.audit;
  }

  /* ==========================================================
   * 4. INITIALIZATION
   * ==========================================================
   */

  public async initialize(): Promise<void> {
    this.status =
      "INITIALIZING";

    await this.publishEvent(
      "runtime.initializing",
      {
        runtimeId: this.id,

        version: this.version,
      },
    );

    this.status =
      "READY";

    await this.publishEvent(
      "runtime.ready",
      {
        runtimeId: this.id,

        version: this.version,
      },
    );
  }

  /* ==========================================================
   * 5. STATUS
   * ==========================================================
   */

  public getStatus():
    RuntimeStatus {
    return this.status;
  }

  public getHealth(): {
    id: string;

    status: RuntimeStatus;

    activeJobs: number;

    totalJobs: number;

    timestamp: string;
  } {
    return {
      id: this.id,

      status: this.status,

      activeJobs:
        this.activeJobs.size,

      totalJobs:
        this.jobs.size,

      timestamp:
        new Date().toISOString(),
    };
  }

  /* ==========================================================
   * 6. CREATE JOB
   * ==========================================================
   */

  public async createJob(
    input: {
      type: string;

      priority?: JobPriority;

      input: Record<string, unknown>;

      requestId?: string;

      planId?: string;

      parentJobId?: string;

      agentId?: string;

      capabilityId?: string;

      maxAttempts?: number;

      metadata?: Record<string, unknown>;
    },
  ): Promise<RuntimeJob> {
    if (
      this.status !== "READY" &&
      this.status !== "RUNNING"
    ) {
      throw new Error(
        "RUNTIME_NOT_READY",
      );
    }

    const job: RuntimeJob = {
      id:
        this.generateId("JOB"),

      type:
        input.type,

      status:
        "PENDING",

      priority:
        input.priority ??
        "NORMAL",

      createdAt:
        new Date().toISOString(),

      attempts: 0,

      maxAttempts:
        input.maxAttempts ??
        this.config
          .defaultMaxAttempts,

      input:
        input.input,

      logs: [],

      requestId:
        input.requestId,

      planId:
        input.planId,

      parentJobId:
        input.parentJobId,

      agentId:
        input.agentId,

      capabilityId:
        input.capabilityId,

      metadata:
        input.metadata,
    };

    this.jobs.set(
      job.id,
      job,
    );

    this.log(
      job,
      "Job created.",
    );

    await this.publishEvent(
      "job.created",
      {
        jobId:
          job.id,

        type:
          job.type,
      },
    );

    return job;
  }

  /* ==========================================================
   * 7. START JOB
   * ==========================================================
   */

  public async startJob(
    jobId: string,
    context: RuntimeExecutionContext,
  ): Promise<RuntimeExecutionResult> {
    const job =
      this.requireJob(jobId);

    if (
      this.status === "PAUSED" ||
      this.status === "STOPPED"
    ) {
      return this.failResult(
        job,
        "RUNTIME_NOT_EXECUTABLE",
        "Runtime is paused or stopped.",
      );
    }

    if (
      this.activeJobs.size >=
      this.config.maxConcurrentJobs
    ) {
      job.status =
        "QUEUED";

      job.queuedAt =
        new Date().toISOString();

      this.log(
        job,
        "Job queued because runtime capacity is full.",
      );

      await this.publishEvent(
        "job.queued",
        {
          jobId:
            job.id,
        },
      );

      return {
        success: false,

        status:
          "QUEUED",

        jobId:
          job.id,

        attempts:
          job.attempts,
      };
    }

    return this.executeJob(
      job,
      context,
    );
  }

  /* ==========================================================
   * 8. EXECUTE JOB
   * ==========================================================
   */

  private async executeJob(
    job: RuntimeJob,
    context: RuntimeExecutionContext,
  ): Promise<RuntimeExecutionResult> {
    const policy =
      await this.validatePolicy(
        job,
        context,
      );

    if (!policy.allowed) {
      job.status =
        "FAILED";

      job.error = {
        code:
          "EXECUTION_POLICY_DENIED",

        message:
          policy.reason,

        component:
          this.id,

        severity:
          "WARNING",

        retryable:
          false,

        occurredAt:
          new Date().toISOString(),

        details: {
          restrictions:
            policy.restrictions,
        },
      };

      await this.audit.record(
        "job.execute",
        job,
        "DENIED",
      );

      await this.publishEvent(
        "job.policy.denied",
        {
          jobId:
            job.id,

          reason:
            policy.reason,
        },
      );

      return {
        success: false,

        status:
          "FAILED",

        error:
          job.error,

        jobId:
          job.id,

        attempts:
          job.attempts,
      };
    }

    if (
      this.config
        .requireResourceValidation
    ) {
      const reserved =
        await this.resources
          .reserve(job);

      if (!reserved) {
        return this.failResult(
          job,
          "RESOURCE_UNAVAILABLE",
          "Required runtime resources are unavailable.",
          true,
        );
      }
    }

    this.activeJobs.add(
      job.id,
    );

    job.status =
      "STARTING";

    job.startedAt =
      new Date().toISOString();

    job.attempts += 1;

    this.status =
      "RUNNING";

    this.log(
      job,
      `Execution attempt ${job.attempts} started.`,
    );

    await this.publishEvent(
      "job.started",
      {
        jobId:
          job.id,

        attempt:
          job.attempts,
      },
    );

    const started =
      Date.now();

    try {
      job.status =
        "RUNNING";

      const result =
        await this.executor.execute(
          job,
          context,
        );

      const durationMs =
        Date.now() - started;

      if (result.success) {
        job.output =
          result.output;

        job.status =
          "VERIFYING";

        await this.publishEvent(
          "job.verifying",
          {
            jobId:
              job.id,
          },
        );

        job.status =
          "COMPLETED";

        job.completedAt =
          new Date().toISOString();

        this.log(
          job,
          "Job completed successfully.",
        );

        await this.audit.record(
          "job.execute",
          job,
          "SUCCESS",
        );

        await this.publishEvent(
          "job.completed",
          {
            jobId:
              job.id,

            durationMs,
          },
        );

        return {
          success: true,

          status:
            "COMPLETED",

          output:
            job.output,

          jobId:
            job.id,

          attempts:
            job.attempts,

          durationMs,
        };
      }

      return this.handleExecutionFailure(
        job,
        result.error,
        context,
        durationMs,
      );
    } catch (error) {
      const runtimeError =
        this.normalizeError(
          error,
          "RUNTIME_EXECUTION_ERROR",
        );

      return this.handleExecutionFailure(
        job,
        runtimeError,
        context,
        Date.now() - started,
      );
    } finally {
      this.activeJobs.delete(
        job.id,
      );

      await this.resources.release(
        job,
      );

      await this.safeCleanup(
        job,
        context,
      );

      if (
        this.activeJobs.size === 0 &&
        this.status === "RUNNING"
      ) {
        this.status =
          "READY";
      }
    }
  }

  /* ==========================================================
   * 9. FAILURE HANDLING
   * ==========================================================
   */

  private async handleExecutionFailure(
    job: RuntimeJob,
    error:
      | RuntimeError
      | undefined,
    context: RuntimeExecutionContext,
    durationMs: number,
  ): Promise<RuntimeExecutionResult> {
    const runtimeError =
      error ??
      {
        code:
          "UNKNOWN_EXECUTION_ERROR",

        message:
          "Execution failed without a supplied error.",

        component:
          this.id,

        severity:
          "ERROR",

        retryable:
          false,

        occurredAt:
          new Date().toISOString(),
      };

    job.error =
      runtimeError;

    job.status =
      "FAILED";

    this.log(
      job,
      `Job failed: ${runtimeError.code}`,
    );

    await this.audit.record(
      "job.execute",
      job,
      "FAILED",
      {
        durationMs,
      },
    );

    await this.publishEvent(
      "job.failed",
      {
        jobId:
          job.id,

        error:
          runtimeError,

        durationMs,
      },
    );

    if (
      this.config.autoRetryEnabled &&
      runtimeError.retryable &&
      job.attempts <
        job.maxAttempts
    ) {
      return this.retryJob(
        job.id,
        context,
      );
    }

    return {
      success: false,

      status:
        "FAILED",

      error:
        runtimeError,

      jobId:
        job.id,

      attempts:
        job.attempts,

      durationMs,
    };
  }

  /* ==========================================================
   * 10. RETRY
   * ==========================================================
   */

  public async retryJob(
    jobId: string,
    context?: RuntimeExecutionContext,
  ): Promise<RuntimeExecutionResult> {
    const job =
      this.requireJob(jobId);

    if (
      !job.error
    ) {
      return this.failResult(
        job,
        "NO_RETRY_REASON",
        "Job has no recorded error.",
      );
    }

    if (
      !job.error.retryable
    ) {
      return this.failResult(
        job,
        "RETRY_NOT_ALLOWED",
        "The recorded error is not retryable.",
      );
    }

    if (
      job.attempts >=
      job.maxAttempts
    ) {
      return this.failResult(
        job,
        "MAX_ATTEMPTS_REACHED",
        "Maximum retry attempts reached.",
      );
    }

    job.status =
      "RETRYING";

    this.log(
      job,
      "Job retry requested.",
    );

    await this.publishEvent(
      "job.retrying",
      {
        jobId:
          job.id,

        attempt:
          job.attempts + 1,
      },
    );

    const executionContext:
      RuntimeExecutionContext =
      context ?? {
        jobId:
          job.id,

        permissions: [],

        restrictions: [],

        environment: {},
      };

    return this.executeJob(
      job,
      executionContext,
    );
  }

  /* ==========================================================
   * 11. PAUSE
   * ==========================================================
   */

  public async pauseJob(
    jobId: string,
  ): Promise<boolean> {
    const job =
      this.requireJob(jobId);

    if (
      job.status !== "RUNNING"
    ) {
      return false;
    }

    job.status =
      "PAUSED";

    job.pausedAt =
      new Date().toISOString();

    this.log(
      job,
      "Job paused.",
    );

    await this.publishEvent(
      "job.paused",
      {
        jobId:
          job.id,
      },
    );

    return true;
  }

  /* ==========================================================
   * 12. RESUME
   * ==========================================================
   */

  public async resumeJob(
    jobId: string,
    context: RuntimeExecutionContext,
  ): Promise<RuntimeExecutionResult> {
    const job =
      this.requireJob(jobId);

    if (
      job.status !== "PAUSED"
    ) {
      return this.failResult(
        job,
        "JOB_NOT_PAUSED",
        "Job is not currently paused.",
      );
    }

    this.log(
      job,
      "Job resumed.",
    );

    return this.executeJob(
      job,
      context,
    );
  }

  /* ==========================================================
   * 13. CANCEL
   * ==========================================================
   */

  public async cancelJob(
    jobId: string,
    context: RuntimeExecutionContext,
  ): Promise<boolean> {
    const job =
      this.requireJob(jobId);

    if (
      job.status ===
        "COMPLETED" ||
      job.status ===
        "CANCELLED"
    ) {
      return false;
    }

    const stopped =
      await this.executor.stop(
        job,
        context,
      );

    if (!stopped) {
      return false;
    }

    job.status =
      "CANCELLED";

    job.cancelledAt =
      new Date().toISOString();

    this.activeJobs.delete(
      job.id,
    );

    await this.resources.release(
      job,
    );

    this.log(
      job,
      "Job cancelled.",
    );

    await this.audit.record(
      "job.cancel",
      job,
      "SUCCESS",
    );

    await this.publishEvent(
      "job.cancelled",
      {
        jobId:
          job.id,
      },
    );

    return true;
  }

  /* ==========================================================
   * 14. STOP
   * ==========================================================
   */

  public async stopJob(
    jobId: string,
    context: RuntimeExecutionContext,
  ): Promise<boolean> {
    const job =
      this.requireJob(jobId);

    const stopped =
      await this.executor.stop(
        job,
        context,
      );

    if (!stopped) {
      return false;
    }

    job.status =
      "STOPPED";

    this.activeJobs.delete(
      job.id,
    );

        await this.resources.release(
      job,
    );

    await this.safeCleanup(
      job,
      context,
    );

    this.log(
      job,
      "Job stopped.",
    );

    await this.audit.record(
      "job.stop",
      job,
      "SUCCESS",
    );

    await this.publishEvent(
      "job.stopped",
      {
        jobId:
          job.id,
      },
    );

    return true;
  }

  /* ==========================================================
   * 15. RUNTIME CONTROL
   * ==========================================================
   */

  public async pauseRuntime(): Promise<void> {
    if (
      this.status === "STOPPED"
    ) {
      throw new Error(
        "RUNTIME_STOPPED",
      );
    }

    this.status =
      "PAUSED";

    await this.publishEvent(
      "runtime.paused",
      {
        runtimeId:
          this.id,
      },
    );
  }

  public async resumeRuntime(): Promise<void> {
    if (
      this.status !== "PAUSED"
    ) {
      return;
    }

    this.status =
      "READY";

    await this.publishEvent(
      "runtime.resumed",
      {
        runtimeId:
          this.id,
      },
    );
  }

  public async stopRuntime(): Promise<void> {
    this.status =
      "STOPPED";

    await this.publishEvent(
      "runtime.stopped",
      {
        runtimeId:
          this.id,

        activeJobs:
          this.activeJobs.size,
      },
    );
  }

  /* ==========================================================
   * 16. JOB ACCESS
   * ==========================================================
   */

  public getJob(
    jobId: string,
  ): RuntimeJob | undefined {
    const job =
      this.jobs.get(jobId);

    return job
      ? this.cloneJob(job)
      : undefined;
  }

  public getJobs():
    RuntimeJob[] {
    return Array.from(
      this.jobs.values(),
    ).map(
      job =>
        this.cloneJob(job),
    );
  }

  public getActiveJobs():
    RuntimeJob[] {
    return Array.from(
      this.activeJobs,
    )
      .map(
        jobId =>
          this.jobs.get(jobId),
      )
      .filter(
        (
          job,
        ): job is RuntimeJob =>
          job !== undefined,
      )
      .map(
        job =>
          this.cloneJob(job),
      );
  }

  /* ==========================================================
   * 17. RESOURCES
   * ==========================================================
   */

  public async getResources():
    Promise<RuntimeResource[]> {
    return this.resources
      .getResources();
  }

  /* ==========================================================
   * 18. POLICY
   * ==========================================================
   */

  private async validatePolicy(
    job: RuntimeJob,
    context: RuntimeExecutionContext,
  ): Promise<{
    allowed: boolean;

    reason: string;

    restrictions: string[];
  }> {
    if (
      !this.config
        .requirePolicyValidation
    ) {
      return {
        allowed: true,

        reason:
          "Runtime policy validation disabled by configuration.",

        restrictions: [
          ...context.restrictions,
        ],
      };
    }

    return this.policy
      .validateExecution(
        job,
        context,
      );
  }

  /* ==========================================================
   * 19. SAFE CLEANUP
   * ==========================================================
   */

  private async safeCleanup(
    job: RuntimeJob,
    context: RuntimeExecutionContext,
  ): Promise<void> {
    try {
      await this.executor.cleanup(
        job,
        context,
      );
    } catch (error) {
      const runtimeError =
        this.normalizeError(
          error,
          "RUNTIME_CLEANUP_ERROR",
        );

      this.log(
        job,
        `Cleanup failed: ${runtimeError.message}`,
      );

      await this.publishEvent(
        "job.cleanup.failed",
        {
          jobId:
            job.id,

          error:
            runtimeError,
        },
      );
    }
  }

  /* ==========================================================
   * 20. FAILURE RESULT
   * ==========================================================
   */

  private failResult(
    job: RuntimeJob,
    code: string,
    message: string,
    retryable = false,
  ): RuntimeExecutionResult {
    const error:
      RuntimeError = {
        code,

        message,

        component:
          this.id,

        severity:
          "ERROR",

        retryable,

        occurredAt:
          new Date().toISOString(),
      };

    job.error =
      error;

    job.status =
      "FAILED";

    this.log(
      job,
      `${code}: ${message}`,
    );

    return {
      success: false,

      status:
        "FAILED",

      error,

      jobId:
        job.id,

      attempts:
        job.attempts,
    };
  }

  /* ==========================================================
   * 21. ERROR NORMALIZATION
   * ==========================================================
   */

  private normalizeError(
    error: unknown,
    code: string,
  ): RuntimeError {
    if (
      this.isRuntimeError(
        error,
      )
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

    if (
      error instanceof Error
    ) {
      return {
        code,

        message:
          error.message,

        component:
          this.id,

        severity:
          "ERROR",

        retryable:
          true,

        occurredAt:
          new Date().toISOString(),

        details: {
          name:
            error.name,

          stack:
            error.stack,
        },
      };
    }

    return {
      code,

      message:
        String(error),

      component:
        this.id,

      severity:
        "ERROR",

      retryable:
        true,

      occurredAt:
        new Date().toISOString(),
    };
  }

  private isRuntimeError(
    value: unknown,
  ): value is RuntimeError {
    if (
      !value ||
      typeof value !== "object"
    ) {
      return false;
    }

    const candidate =
      value as Partial<RuntimeError>;

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
   * 22. JOB REQUIREMENT
   * ==========================================================
   */

  private requireJob(
    jobId: string,
  ): RuntimeJob {
    const job =
      this.jobs.get(jobId);

    if (!job) {
      throw new Error(
        `RUNTIME_JOB_NOT_FOUND:${jobId}`,
      );
    }

    return job;
  }

  /* ==========================================================
   * 23. LOGGING
   * ==========================================================
   */

  private log(
    job: RuntimeJob,
    message: string,
  ): void {
    if (
      !this.config.preserveLogs
    ) {
      return;
    }

    job.logs.push(
      `[${new Date().toISOString()}] ${message}`,
    );
  }

  /* ==========================================================
   * 24. EVENTS
   * ==========================================================
   */

  private async publishEvent(
    type: string,
    payload: Record<
      string,
      unknown
    >,
  ): Promise<void> {
    const event:
      RuntimeEvent = {
        id:
          this.generateId(
            "EVENT",
          ),

        type,

        source:
          this.id,

        timestamp:
          new Date().toISOString(),

        jobId:
          typeof payload.jobId ===
            "string"
            ? payload.jobId
            : undefined,

        requestId:
          typeof payload.requestId ===
            "string"
            ? payload.requestId
            : undefined,

        planId:
          typeof payload.planId ===
            "string"
            ? payload.planId
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

    await this.events.publish(
      event,
    );
  }

  /* ==========================================================
   * 25. CLONING
   * ==========================================================
   */

  private cloneJob(
    job: RuntimeJob,
  ): RuntimeJob {
    return {
      ...job,

      input: {
        ...job.input,
      },

      output:
        job.output
          ? {
              ...job.output,
            }
          : undefined,

      error:
        job.error
          ? {
              ...job.error,

              details:
                job.error.details
                  ? {
                      ...job.error
                        .details,
                    }
                  : undefined,
            }
          : undefined,

      logs: [
        ...job.logs,
      ],

      metadata:
        job.metadata
          ? {
              ...job.metadata,
            }
          : undefined,
    };
  }

  /* ==========================================================
   * 26. ID GENERATION
   * ==========================================================
   */

  private generateId(
    prefix: string,
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

/* ============================================================
 * 27. EXPORT
 * ============================================================
 */

export default SovereignRuntime;

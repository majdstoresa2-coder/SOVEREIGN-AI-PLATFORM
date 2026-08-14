/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-JOBS-13
 * ============================================================
 *
 * Purpose:
 * Central Sovereign Job & Task Queue.
 *
 * Responsibilities:
 * - Create internal jobs.
 * - Queue and prioritize work.
 * - Dispatch controlled jobs.
 * - Retry failed jobs.
 * - Track execution state.
 * - Handle dependencies.
 * - Cancel and recover jobs.
 *
 * Jobs NEVER grant authority.
 * Jobs NEVER bypass Policy, Permissions or Runtime.
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. JOB STATUS
 * ============================================================
 */

export type SovereignJobStatus =
  | "CREATED"
  | "QUEUED"
  | "WAITING"
  | "RUNNING"
  | "RETRYING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "DEAD_LETTER";

/* ============================================================
 * 2. JOB PRIORITY
 * ============================================================
 */

export type SovereignJobPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

/* ============================================================
 * 3. JOB ERROR
 * ============================================================
 */

export interface SovereignJobError {
  code: string;

  message: string;

  component: string;

  retryable: boolean;

  occurredAt: string;

  details?: Record<string, unknown>;
}

/* ============================================================
 * 4. JOB
 * ============================================================
 */

export interface SovereignJob {
  id: string;

  type: string;

  name: string;

  description?: string;

  status: SovereignJobStatus;

  priority: SovereignJobPriority;

  requestedBy: string;

  agentId?: string;

  capabilityId?: string;

  projectId?: string;

  parentJobId?: string;

  dependencies: string[];

  input: Record<string, unknown>;

  output?: Record<string, unknown>;

  attempts: number;

  maxAttempts: number;

  createdAt: string;

  updatedAt: string;

  startedAt?: string;

  completedAt?: string;

  nextRetryAt?: string;

  error?: SovereignJobError;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 5. CREATE JOB INPUT
 * ============================================================
 */

export interface SovereignJobInput {
  type: string;

  name: string;

  description?: string;

  requestedBy: string;

  priority?: SovereignJobPriority;

  agentId?: string;

  capabilityId?: string;

  projectId?: string;

  parentJobId?: string;

  dependencies?: string[];

  input?: Record<string, unknown>;

  maxAttempts?: number;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. JOB CONTEXT
 * ============================================================
 */

export interface SovereignJobContext {
  actorId: string;

  policyChecked: boolean;

  permissionChecked: boolean;

  permissions: string[];
}

/* ============================================================
 * 7. JOB AUTHORIZATION
 * ============================================================
 */

export interface SovereignJobAccessValidator {
  validate(
    operation:
      | "CREATE"
      | "DISPATCH"
      | "CANCEL"
      | "RETRY",
    context: SovereignJobContext,
    job?: SovereignJob
  ): {
    allowed: boolean;
    reason?: string;
  };
}

/* ============================================================
 * 8. JOB EXECUTOR
 * ============================================================
 */

export interface SovereignJobExecutor {
  execute(
    job: SovereignJob
  ): Promise<{
    success: boolean;

    output?: Record<string, unknown>;

    error?: SovereignJobError;
  }>;
}

/* ============================================================
 * 9. JOB EVENT BUS
 * ============================================================
 */

export interface SovereignJobEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    jobId: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 10. JOB AUDIT
 * ============================================================
 */

export interface SovereignJobAudit {
  record(
    operation: string,
    jobId: string | undefined,
    result:
      | "SUCCESS"
      | "FAILED"
      | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 11. JOB ENGINE
 * ============================================================
 */

export class SovereignJobEngine {
  public readonly id =
    "SOVEREIGN-JOBS-13";

  public readonly version =
    "1.0.0";

  private jobs =
    new Map<string, SovereignJob>();

  private queue: string[] = [];

  private deadLetterQueue: string[] = [];

  private accessValidator?:
    SovereignJobAccessValidator;

  private executor?:
    SovereignJobExecutor;

  private eventBus?:
    SovereignJobEventBus;

  private audit?:
    SovereignJobAudit;

  private processing = false;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setAccessValidator(
    validator: SovereignJobAccessValidator
  ): void {
    this.accessValidator = validator;
  }

  setExecutor(
    executor: SovereignJobExecutor
  ): void {
    this.executor = executor;
  }

  setEventBus(
    eventBus: SovereignJobEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignJobAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * CREATE JOB
   * ==========================================================
   */

  async create(
    input: SovereignJobInput,
    context: SovereignJobContext
  ): Promise<SovereignJob> {
    this.requireAccess(
      "CREATE",
      context
    );

    this.validateInput(input);

    const now = this.now();

    const job: SovereignJob = {
      id: this.createId("JOB"),

      type: input.type,

      name: input.name,

      description:
        input.description,

      status: "CREATED",

      priority:
        input.priority ??
        "NORMAL",

      requestedBy:
        input.requestedBy,

      agentId:
        input.agentId,

      capabilityId:
        input.capabilityId,

      projectId:
        input.projectId,

      parentJobId:
        input.parentJobId,

      dependencies:
        input.dependencies ?? [],

      input:
        input.input ?? {},

      attempts: 0,

      maxAttempts:
        Math.max(
          1,
          input.maxAttempts ?? 3
        ),

      createdAt: now,

      updatedAt: now,

      metadata:
        input.metadata,
    };

    this.jobs.set(
      job.id,
      job
    );

    this.queueJob(job);

    await this.publish(
      "job.created",
      job,
      {
        type: job.type,
        priority: job.priority,
      }
    );

    await this.recordAudit(
      "job.create",
      job.id,
      "SUCCESS"
    );

    return job;
  }

  /* ==========================================================
   * QUEUE JOB
   * ==========================================================
   */

  private queueJob(
    job: SovereignJob
  ): void {
    if (
      !this.dependenciesComplete(
        job
      )
    ) {
      job.status =
        "WAITING";

      job.updatedAt =
        this.now();

      return;
    }

    job.status =
      "QUEUED";

    job.updatedAt =
      this.now();

    if (
      !this.queue.includes(
        job.id
      )
    ) {
      this.queue.push(
        job.id
      );
    }

    this.sortQueue();
  }

  /* ==========================================================
   * PROCESS NEXT
   * ==========================================================
   */

  async processNext(
    context: SovereignJobContext
  ): Promise<
    SovereignJob | undefined
  > {
    if (this.processing) {
      return undefined;
    }

    this.releaseWaitingJobs();

    const jobId =
      this.queue.shift();

    if (!jobId) {
      return undefined;
    }

    const job =
      this.jobs.get(jobId);

    if (!job) {
      return undefined;
    }

    this.requireAccess(
      "DISPATCH",
      context,
      job
    );

    if (!this.executor) {
      throw new Error(
        "Sovereign Job executor is not configured."
      );
    }

    this.processing = true;

    try {
      await this.executeJob(
        job
      );

      return job;
    } finally {
      this.processing = false;
    }
  }

  /* ==========================================================
   * PROCESS ALL
   * ==========================================================
   */

  async processAll(
    context: SovereignJobContext
  ): Promise<number> {
    let processed = 0;

    while (true) {
      this.releaseWaitingJobs();

      if (
        this.queue.length === 0
      ) {
        break;
      }

      const job =
        await this.processNext(
          context
        );

      if (!job) {
        break;
      }

      processed += 1;
    }

    return processed;
  }

  /* ==========================================================
   * EXECUTE JOB
   * ==========================================================
   */

  private async executeJob(
    job: SovereignJob
  ): Promise<void> {
    if (!this.executor) {
      throw new Error(
        "Job executor missing."
      );
    }

    job.status =
      "RUNNING";

    job.attempts += 1;

    job.startedAt =
      this.now();

    job.updatedAt =
      job.startedAt;

    await this.publish(
      "job.started",
      job,
      {
        attempt:
          job.attempts,
      }
    );

    try {
      const result =
        await this.executor.execute(
          job
        );

      if (result.success) {
        job.status =
          "COMPLETED";

        job.output =
          result.output;

        job.error =
          undefined;

        job.completedAt =
          this.now();

        job.updatedAt =
          job.completedAt;

        await this.publish(
          "job.completed",
          job,
          {
            attempts:
              job.attempts,
          }
        );

        await this.recordAudit(
          "job.execute",
          job.id,
          "SUCCESS"
        );

        this.releaseWaitingJobs();

        return;
      }

      const error =
        result.error ??
        this.createError(
          "JOB_EXECUTION_FAILED",
          "Job execution failed.",
          true
        );

      await this.handleFailure(
        job,
        error
      );
    } catch (error) {
      await this.handleFailure(
        job,
        this.createError(
          "JOB_EXECUTOR_ERROR",
          error instanceof Error
            ? error.message
            : String(error),
          true
        )
      );
    }
  }

  /* ==========================================================
   * FAILURE
   * ==========================================================
   */

  private async handleFailure(
    job: SovereignJob,
    error: SovereignJobError
  ): Promise<void> {
    job.error =
      error;

    job.updatedAt =
      this.now();

    if (
      error.retryable &&
      job.attempts <
        job.maxAttempts
    ) {
      job.status =
        "RETRYING";

      job.nextRetryAt =
        this.now();

      await this.publish(
        "job.retrying",
        job,
        {
          attempt:
            job.attempts,

          maxAttempts:
            job.maxAttempts,
        }
      );

      job.status =
        "QUEUED";

      this.queue.push(
        job.id
      );

      this.sortQueue();

      await this.recordAudit(
        "job.retry",
        job.id,
        "FAILED",
        {
          attempt:
            job.attempts,
        }
      );

      return;
    }

    job.status =
      "DEAD_LETTER";

    job.completedAt =
      this.now();

    job.updatedAt =
      job.completedAt;

    if (
      !this.deadLetterQueue.includes(
        job.id
      )
    ) {
      this.deadLetterQueue.push(
        job.id
      );
    }

    await this.publish(
      "job.dead_letter",
      job,
      {
        error:
          error.code,

        attempts:
          job.attempts,
      }
    );

    await this.recordAudit(
      "job.execute",
      job.id,
      "FAILED",
      {
        error:
          error.code,
      }
    );
  }

  /* ==========================================================
   * CANCEL
   * ==========================================================
   */

  async cancel(
    jobId: string,
    context: SovereignJobContext
  ): Promise<SovereignJob> {
    const job =
      this.requireJob(jobId);

    this.requireAccess(
      "CANCEL",
      context,
      job
    );

    if (
      job.status ===
        "COMPLETED" ||
      job.status ===
        "CANCELLED"
    ) {
      return job;
    }

    this.removeFromQueue(
      job.id
    );

    job.status =
      "CANCELLED";

    job.completedAt =
      this.now();

    job.updatedAt =
      job.completedAt;

    await this.publish(
      "job.cancelled",
      job,
      {}
    );

    await this.recordAudit(
      "job.cancel",
      job.id,
      "SUCCESS"
    );

    return job;
  }

  /* ==========================================================
   * RETRY DEAD LETTER
   * ==========================================================
   */

  async retryDeadLetter(
    jobId: string,
    context: SovereignJobContext
  ): Promise<SovereignJob> {
    const job =
      this.requireJob(jobId);

    this.requireAccess(
      "RETRY",
      context,
      job
    );

    if (
      job.status !==
      "DEAD_LETTER"
    ) {
      throw new Error(
        `Job ${jobId} is not in dead-letter state.`
      );
    }

    this.deadLetterQueue =
      this.deadLetterQueue.filter(
        (id) => id !== jobId
      );

    job.attempts = 0;

    job.error =
      undefined;

    job.completedAt =
      undefined;

    job.nextRetryAt =
      undefined;

    this.queueJob(job);

    await this.publish(
      "job.dead_letter.retried",
      job,
      {}
    );

    await this.recordAudit(
      "job.dead_letter.retry",
      job.id,
      "SUCCESS"
    );

    return job;
  }

  /* ==========================================================
   * DEPENDENCIES
   * ==========================================================
   */

  private dependenciesComplete(
    job: SovereignJob
  ): boolean {
    return job.dependencies.every(
      (dependencyId) => {
        const dependency =
          this.jobs.get(
            dependencyId
          );

        return (
          dependency?.status ===
          "COMPLETED"
        );
      }
    );
  }

  private releaseWaitingJobs():
    void {
    for (
      const job of
      this.jobs.values()
    ) {
      if (
        job.status ===
          "WAITING" &&
        this.dependenciesComplete(
          job
        )
      ) {
        this.queueJob(job);
      }
    }
  }

  /* ==========================================================
   * GET / LIST
   * ==========================================================
   */

  get(
    jobId: string
  ): SovereignJob | undefined {
    return this.jobs.get(
      jobId
    );
  }

  list(
    status?: SovereignJobStatus
  ): SovereignJob[] {
    const jobs =
      Array.from(
        this.jobs.values()
      );

    if (!status) {
      return jobs;
    }

    return jobs.filter(
      (job) =>
        job.status === status
    );
  }

  listDeadLetters():
    SovereignJob[] {
    return this.deadLetterQueue
      .map(
        (id) =>
          this.jobs.get(id)
      )
      .filter(
        (
          job
        ): job is SovereignJob =>
          Boolean(job)
      );
  }

  queueSize(): number {
    return this.queue.length;
  }

  /* ==========================================================
   * STATISTICS
   * ==========================================================
   */

  statistics(): {
    total: number;
    queued: number;
    waiting: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
    deadLetter: number;
  } {
    const jobs =
      this.list();

    return {
      total:
        jobs.length,

      queued:
        jobs.filter(
          (job) =>
            job.status ===
            "QUEUED"
        ).length,

      waiting:
        jobs.filter(
          (job) =>
            job.status ===
            "WAITING"
        ).length,

      running:
        jobs.filter(
          (job) =>
            job.status ===
            "RUNNING"
        ).length,

      completed:
        jobs.filter(
          (job) =>
            job.status ===
            "COMPLETED"
        ).length,

      failed:
        jobs.filter(
          (job) =>
            job.status ===
            "FAILED"
        ).length,

      cancelled:
        jobs.filter(
          (job) =>
            job.status ===
            "CANCELLED"
        ).length,

      deadLetter:
        this.deadLetterQueue.length,
    };
  }

  /* ==========================================================
   * ACCESS
   * ==========================================================
   */

  private requireAccess(
    operation:
      | "CREATE"
      | "DISPATCH"
      | "CANCEL"
      | "RETRY",
    context: SovereignJobContext,
    job?: SovereignJob
  ): void {
    if (
      !context.policyChecked
    ) {
      throw new Error(
        "Job operation blocked: policy check required."
      );
    }

    if (
      !context.permissionChecked
    ) {
      throw new Error(
        "Job operation blocked: permission check required."
      );
    }

    if (
      this.accessValidator
    ) {
      const result =
        this.accessValidator.validate(
          operation,
          context,
          job
        );

      if (!result.allowed) {
        throw new Error(
          result.reason ??
            "Job operation denied."
        );
      }
    }
  }

  /* ==========================================================
   * VALIDATION
   * ==========================================================
   */

  private validateInput(
    input: SovereignJobInput
  ): void {
    if (!input.type.trim()) {
      throw new Error(
        "Job type is required."
      );
    }

    if (!input.name.trim()) {
      throw new Error(
        "Job name is required."
      );
    }

    if (
      !input.requestedBy.trim()
    ) {
      throw new Error(
        "Job requester is required."
      );
    }
  }

  /* ==========================================================
   * QUEUE SORT
   * ==========================================================
   */

  private sortQueue(): void {
    this.queue.sort(
      (a, b) => {
        const jobA =
          this.jobs.get(a);

        const jobB =
          this.jobs.get(b);

        if (
          !jobA ||
          !jobB
        ) {
          return 0;
        }

        return (
          this.priorityRank(
            jobB.priority
          ) -
          this.priorityRank(
            jobA.priority
          )
        );
      }
    );
  }

  private removeFromQueue(
    jobId: string
  ): void {
    this.queue =
      this.queue.filter(
        (id) =>
          id !== jobId
      );
  }

  /* ==========================================================
   * PRIORITY
   * ==========================================================
   */

  private priorityRank(
    priority:
      SovereignJobPriority
  ): number {
    switch (priority) {
      case "LOW":
        return 1;

      case "NORMAL":
        return 2;

      case "HIGH":
        return 3;

      case "CRITICAL":
        return 4;
    }
  }

  /* ==========================================

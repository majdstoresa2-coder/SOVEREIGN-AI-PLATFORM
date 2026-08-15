// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-WORKER-ENGINE-181.ts
// Sovereign Autonomous Worker Engine
// ============================================================

export type SovereignWorkerStatus =
  | "IDLE"
  | "AVAILABLE"
  | "BUSY"
  | "PAUSED"
  | "FAILED"
  | "OFFLINE";

export type SovereignWorkerJobStatus =
  | "QUEUED"
  | "ASSIGNED"
  | "RUNNING"
  | "VERIFYING"
  | "COMPLETED"
  | "RETRYING"
  | "FAILED"
  | "BLOCKED";

export interface SovereignWorker {
  id: string;

  name: string;

  capabilities: string[];

  status: SovereignWorkerStatus;

  concurrency: number;

  activeJobs: number;

  completedJobs: number;

  failedJobs: number;

  lastHeartbeat: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignWorkerJob {
  id: string;

  capability: string;

  action: string;

  priority:
    | "LOW"
    | "NORMAL"
    | "HIGH"
    | "CRITICAL";

  input?: Record<string, unknown>;

  status: SovereignWorkerJobStatus;

  assignedWorkerId?: string;

  attempts: number;

  maxAttempts: number;

  timeoutMs: number;

  result?: unknown;

  error?: string;

  createdAt: number;

  startedAt?: number;

  completedAt?: number;
}

export interface SovereignWorkerExecution {
  workerId: string;

  jobId: string;

  capability: string;

  action: string;

  input?: Record<string, unknown>;
}

export interface SovereignWorkerAdapter {
  execute(
    execution: SovereignWorkerExecution
  ): Promise<unknown>;

  verify?(
    execution: SovereignWorkerExecution,
    result: unknown
  ): Promise<boolean>;

  persistWorker?(
    worker: SovereignWorker
  ): Promise<void>;

  persistJob?(
    job: SovereignWorkerJob
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    workerId?: string;

    jobId?: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIWorkerEngine {
  private readonly workers =
    new Map<string, SovereignWorker>();

  private readonly jobs =
    new Map<string, SovereignWorkerJob>();

  private running = false;

  constructor(
    private readonly adapter: SovereignWorkerAdapter
  ) {}

  public async registerWorker(
    worker: SovereignWorker
  ): Promise<void> {
    this.validateWorker(worker);

    const normalized: SovereignWorker = {
      ...worker,

      capabilities: [
        ...new Set(worker.capabilities)
      ],

      status: "AVAILABLE",

      activeJobs: 0,

      completedJobs:
        worker.completedJobs || 0,

      failedJobs:
        worker.failedJobs || 0,

      lastHeartbeat:
        Date.now()
    };

    this.workers.set(
      normalized.id,
      normalized
    );

    await this.persistWorker(
      normalized
    );

    await this.record(
      "WORKER_REGISTERED",
      normalized.id
    );
  }

  public async heartbeat(
    workerId: string
  ): Promise<void> {
    const worker =
      this.getMutableWorker(
        workerId
      );

    worker.lastHeartbeat =
      Date.now();

    if (
      worker.status === "OFFLINE"
    ) {
      worker.status =
        worker.activeJobs > 0
          ? "BUSY"
          : "AVAILABLE";
    }

    await this.persistWorker(
      worker
    );
  }

  public async submitJob(
    input: Omit<
      SovereignWorkerJob,
      | "status"
      | "attempts"
      | "createdAt"
      | "assignedWorkerId"
      | "startedAt"
      | "completedAt"
      | "result"
      | "error"
    >
  ): Promise<SovereignWorkerJob> {
    const job: SovereignWorkerJob = {
      ...input,

      status: "QUEUED",

      attempts: 0,

      maxAttempts:
        input.maxAttempts || 3,

      timeoutMs:
        input.timeoutMs || 60_000,

      createdAt:
        Date.now()
    };

    this.jobs.set(
      job.id,
      job
    );

    await this.persistJob(job);

    await this.record(
      "WORKER_JOB_QUEUED",
      undefined,
      job.id
    );

    return this.cloneJob(job);
  }

  public async dispatch():
    Promise<void> {
    this.running = true;

    const queued =
      [...this.jobs.values()]
        .filter(
          job =>
            job.status === "QUEUED" ||
            job.status === "RETRYING"
        )
        .sort(
          (a, b) =>
            this.priorityWeight(
              b.priority
            ) -
            this.priorityWeight(
              a.priority
            )
        );

    for (const job of queued) {
      if (!this.running) {
        break;
      }

      const worker =
        this.findWorker(
          job.capability
        );

      if (!worker) {
        continue;
      }

      await this.assign(
        worker,
        job
      );

      await this.executeJob(
        worker,
        job
      );
    }
  }

  public stopDispatch(): void {
    this.running = false;
  }

  public async markOfflineWorkers(
    heartbeatTimeoutMs = 120_000
  ): Promise<string[]> {
    const now = Date.now();

    const offline: string[] = [];

    for (
      const worker of
        this.workers.values()
    ) {
      if (
        now -
          worker.lastHeartbeat >
        heartbeatTimeoutMs
      ) {
        worker.status =
          "OFFLINE";

        offline.push(
          worker.id
        );

        await this.persistWorker(
          worker
        );

        await this.record(
          "WORKER_OFFLINE",
          worker.id
        );
      }
    }

    return offline;
  }

  private findWorker(
    capability: string
  ): SovereignWorker | undefined {
    return [
      ...this.workers.values()
    ]
      .filter(worker => {
        return (
          worker.status ===
            "AVAILABLE" &&
          worker.capabilities.includes(
            capability
          ) &&
          worker.activeJobs <
            worker.concurrency
        );
      })
      .sort(
        (a, b) =>
          a.activeJobs -
          b.activeJobs
      )[0];
  }

  private async assign(
    worker: SovereignWorker,
    job: SovereignWorkerJob
  ): Promise<void> {
    job.assignedWorkerId =
      worker.id;

    job.status =
      "ASSIGNED";

    worker.activeJobs += 1;

    worker.status =
      worker.activeJobs >=
      worker.concurrency
        ? "BUSY"
        : "AVAILABLE";

    await this.persistJob(job);

    await this.persistWorker(
      worker
    );

    await this.record(
      "WORKER_JOB_ASSIGNED",
      worker.id,
      job.id
    );
  }

  private async executeJob(
    worker: SovereignWorker,
    job: SovereignWorkerJob
  ): Promise<void> {
    job.status = "RUNNING";

    job.startedAt =
      Date.now();

    job.attempts += 1;

    await this.persistJob(job);

    const execution:
      SovereignWorkerExecution = {
        workerId:
          worker.id,

        jobId:
          job.id,

        capability:
          job.capability,

        action:
          job.action,

        input:
          job.input
      };

    try {
      const result =
        await this.withTimeout(
          this.adapter.execute(
            execution
          ),
          job.timeoutMs
        );

      if (
        this.adapter.verify
      ) {
        job.status =
          "VERIFYING";

        await this.persistJob(
          job
        );

        const verified =
          await this.adapter.verify(
            execution,
            result
          );

        if (!verified) {
          throw new Error(
            `Worker verification failed: ${job.id}`
          );
        }
      }

      job.result = result;

      job.status =
        "COMPLETED";

      job.completedAt =
        Date.now();

      worker.completedJobs += 1;

      await this.record(
        "WORKER_JOB_COMPLETED",
        worker.id,
        job.id
      );
    } catch (error) {
      job.error =
        error instanceof Error
          ? error.message
          : String(error);

      if (
        job.attempts <
        job.maxAttempts
      ) {
        job.status =
          "RETRYING";

        job.assignedWorkerId =
          undefined;

        await this.record(
          "WORKER_JOB_RETRY",
          worker.id,
          job.id,
          {
            attempts:
              job.attempts,

            error:
              job.error
          }
        );
      } else {
        job.status =
          "FAILED";

        job.completedAt =
          Date.now();

        worker.failedJobs += 1;

        await this.record(
          "WORKER_JOB_FAILED",
          worker.id,
          job.id,
          {
            error:
              job.error
          }
        );
      }
    } finally {
      worker.activeJobs =
        Math.max(
          0,
          worker.activeJobs - 1
        );

      if (
        worker.status !==
        "OFFLINE"
      ) {
        worker.status =
          worker.activeJobs >=
          worker.concurrency
            ? "BUSY"
            : "AVAILABLE";
      }

      worker.lastHeartbeat =
        Date.now();

      await this.persistJob(job);

      await this.persistWorker(
        worker
      );
    }
  }

  public getWorker(
    workerId: string
  ): SovereignWorker {
    return {
      ...this.getMutableWorker(
        workerId
      )
    };
  }

  public getJob(
    jobId: string
  ): SovereignWorkerJob {
    const job =
      this.jobs.get(jobId);

    if (!job) {
      throw new Error(
        `Worker job not found: ${jobId}`
      );
    }

    return this.cloneJob(job);
  }

  public listWorkers():
    SovereignWorker[] {
    return [
      ...this.workers.values()
    ].map(worker => ({
      ...worker,

      capabilities: [
        ...worker.capabilities
      ]
    }));
  }

  private validateWorker(
    worker: SovereignWorker
  ): void {
    if (!worker.id.trim()) {
      throw new Error(
        "Worker id is required."
      );
    }

    if (!worker.name.trim()) {
      throw new Error(
        "Worker name is required."
      );
    }

    if (
      !worker.capabilities.length
    ) {
      throw new Error(
        "Worker requires at least one capability."
      );
    }

    if (
      worker.concurrency < 1
    ) {
      throw new Error(
        "Worker concurrency must be at least 1."
      );
    }
  }

  private getMutableWorker(
    workerId: string
  ): SovereignWorker {
    const worker =
      this.workers.get(
        workerId
      );

    if (!worker) {
      throw new Error(
        `Worker not found: ${workerId}`
      );
    }

    return worker;
  }

  private async persistWorker(
    worker: SovereignWorker
  ): Promise<void> {
    if (
      this.adapter.persistWorker
    ) {
      await this.adapter.persistWorker(
        worker
      );
    }
  }

  private async persistJob(
    job: SovereignWorkerJob
  ): Promise<void> {
    if (
      this.adapter.persistJob
    ) {
      await this.adapter.persistJob(
        job
      );
    }
  }

  private async record(
    type: string,
    workerId?: string,
    jobId?: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter.recordEvent({
        type,
        workerId,
        jobId,
        timestamp:
          Date.now(),
        data
      });
    }
  }

  private priorityWeight(
    priority:
      SovereignWorkerJob["priority"]
  ): number {
    switch (priority) {
      case "CRITICAL":
        return 4;

      case "HIGH":
        return 3;

      case "NORMAL":
        return 2;

      case "LOW":
      default:
        return 1;
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    let timer:
      | ReturnType<
          typeof setTimeout
        >
      | undefined;

    const timeout =
      new Promise<never>(
        (_, reject) => {
          timer =
            setTimeout(
              () =>
                reject(
                  new Error(
                    `Worker execution timeout after ${timeoutMs}ms`
                  )
                ),
              timeoutMs
            );
        }
      );

    try {
      return await Promise.race([
        promise,
        timeout
      ]);
    } finally {
      if (timer) {
        clearTimeout(
          timer
        );
      }
    }
  }

  private cloneJob(
    job: SovereignWorkerJob
  ): SovereignWorkerJob {
    return {
      ...job,

      input:
        job.input
          ? { ...job.input }
          : undefined
    };
  }
}

export default SovereignAIWorkerEngine;

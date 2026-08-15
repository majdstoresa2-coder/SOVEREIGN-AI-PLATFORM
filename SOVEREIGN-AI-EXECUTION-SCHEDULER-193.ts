// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-EXECUTION-SCHEDULER-193.ts
// Sovereign Autonomous AI Execution Scheduler
// ============================================================

export type SovereignSchedulerPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type SovereignScheduledTaskStatus =
  | "QUEUED"
  | "READY"
  | "DISPATCHED"
  | "RUNNING"
  | "COMPLETED"
  | "RETRY"
  | "FAILED"
  | "BLOCKED"
  | "CANCELLED";

export interface SovereignScheduledTask {
  id: string;

  graphId: string;

  taskId: string;

  capability: string;

  action: string;

  priority: SovereignSchedulerPriority;

  status: SovereignScheduledTaskStatus;

  dependencies: string[];

  autonomous: boolean;

  required: boolean;

  attempts: number;

  maxAttempts: number;

  timeoutMs: number;

  estimatedWeight: number;

  scheduledAt: number;

  availableAt: number;

  dispatchedAt?: number;

  startedAt?: number;

  completedAt?: number;

  workerId?: string;

  error?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignSchedulerLimits {
  maxConcurrency: number;

  maxCriticalConcurrency: number;

  maxRetries: number;

  defaultTimeoutMs: number;

  retryDelayMs: number;

  maxSystemLoad: number;
}

export interface SovereignSchedulerState {
  id: string;

  running: number;

  queued: number;

  ready: number;

  completed: number;

  failed: number;

  blocked: number;

  capacity: number;

  systemLoad: number;

  updatedAt: number;
}

export interface SovereignSchedulerAdapter {
  getSystemLoad(): Promise<number>;

  capabilityAvailable(
    capability: string
  ): Promise<boolean>;

  dispatch(
    task: SovereignScheduledTask
  ): Promise<{
    accepted: boolean;
    workerId?: string;
  }>;

  persistTask?(
    task: SovereignScheduledTask
  ): Promise<void>;

  persistState?(
    state: SovereignSchedulerState
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    schedulerTaskId?: string;

    taskId?: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIExecutionScheduler {
  private readonly tasks =
    new Map<string, SovereignScheduledTask>();

  private running = false;

  constructor(
    private readonly adapter:
      SovereignSchedulerAdapter,

    private readonly limits:
      SovereignSchedulerLimits = {
        maxConcurrency: 16,

        maxCriticalConcurrency: 4,

        maxRetries: 3,

        defaultTimeoutMs: 120_000,

        retryDelayMs: 5_000,

        maxSystemLoad: 0.85
      }
  ) {
    this.validateLimits(
      this.limits
    );
  }

  public async schedule(
    input: Omit<
      SovereignScheduledTask,
      | "status"
      | "attempts"
      | "scheduledAt"
      | "availableAt"
      | "dispatchedAt"
      | "startedAt"
      | "completedAt"
      | "workerId"
      | "error"
    >
  ): Promise<SovereignScheduledTask> {
    if (
      this.tasks.has(
        input.id
      )
    ) {
      throw new Error(
        `Scheduled task already exists: ${input.id}`
      );
    }

    if (!input.taskId.trim()) {
      throw new Error(
        "Scheduled task taskId is required."
      );
    }

    if (!input.graphId.trim()) {
      throw new Error(
        "Scheduled task graphId is required."
      );
    }

    if (!input.capability.trim()) {
      throw new Error(
        "Scheduled task capability is required."
      );
    }

    const now =
      Date.now();

    const task:
      SovereignScheduledTask = {
        ...input,

        dependencies: [
          ...new Set(
            input.dependencies || []
          )
        ],

        status:
          "QUEUED",

        attempts: 0,

        maxAttempts:
          Math.max(
            1,
            Math.min(
              input.maxAttempts ||
                this.limits.maxRetries,
              this.limits.maxRetries
            )
          ),

        timeoutMs:
          input.timeoutMs ||
          this.limits.defaultTimeoutMs,

        estimatedWeight:
          this.normalizeWeight(
            input.estimatedWeight
          ),

        scheduledAt:
          now,

        availableAt:
          now
      };

    this.tasks.set(
      task.id,
      task
    );

    this.resolveReadiness();

    await this.persistTask(
      task
    );

    await this.record(
      "AI_TASK_SCHEDULED",
      task,
      {
        priority:
          task.priority,

        capability:
          task.capability
      }
    );

    return this.cloneTask(
      task
    );
  }

  public async runCycle():
    Promise<SovereignSchedulerState> {
    this.running = true;

    const systemLoad =
      this.normalizeLoad(
        await this.adapter
          .getSystemLoad()
      );

    if (
      systemLoad >=
      this.limits.maxSystemLoad
    ) {
      await this.recordEvent(
        "AI_SCHEDULER_THROTTLED",
        {
          systemLoad,

          limit:
            this.limits
              .maxSystemLoad
        }
      );

      return await this.createState(
        systemLoad
      );
    }

    this.resolveReadiness();

    const runningCount =
      this.countStatus(
        "RUNNING"
      ) +
      this.countStatus(
        "DISPATCHED"
      );

    let capacity =
      Math.max(
        0,
        this.limits
          .maxConcurrency -
          runningCount
      );

    if (capacity <= 0) {
      return await this.createState(
        systemLoad
      );
    }

    const ready =
      this.getReadyInternal();

    for (const task of ready) {
      if (
        !this.running ||
        capacity <= 0
      ) {
        break;
      }

      if (
        task.priority ===
          "CRITICAL" &&
        this.runningCritical() >=
          this.limits
            .maxCriticalConcurrency
      ) {
        continue;
      }

      const available =
        await this.adapter
          .capabilityAvailable(
            task.capability
          );

      if (!available) {
        task.status =
          "BLOCKED";

        task.error =
          `Capability unavailable: ${task.capability}`;

        await this.persistTask(
          task
        );

        await this.record(
          "AI_SCHEDULED_TASK_BLOCKED",
          task,
          {
            reason:
              task.error
          }
        );

        continue;
      }

      await this.dispatch(
        task
      );

      if (
        task.status ===
        "DISPATCHED"
      ) {
        capacity -= 1;
      }
    }

    return await this.createState(
      systemLoad
    );
  }

  public stop(): void {
    this.running = false;
  }

  public async markRunning(
    schedulerTaskId: string
  ): Promise<void> {
    const task =
      this.getMutable(
        schedulerTaskId
      );

    if (
      task.status !==
      "DISPATCHED"
    ) {
      throw new Error(
        `Task cannot enter RUNNING from ${task.status}`
      );
    }

    task.status =
      "RUNNING";

    task.startedAt =
      Date.now();

    await this.persistTask(
      task
    );

    await this.record(
      "AI_SCHEDULED_TASK_RUNNING",
      task
    );
  }

  public async markCompleted(
    schedulerTaskId: string
  ): Promise<void> {
    const task =
      this.getMutable(
        schedulerTaskId
      );

    task.status =
      "COMPLETED";

    task.completedAt =
      Date.now();

    task.error =
      undefined;

    await this.persistTask(
      task
    );

    this.resolveReadiness();

    await this.record(
      "AI_SCHEDULED_TASK_COMPLETED",
      task
    );
  }

  public async markFailed(
    schedulerTaskId: string,
    error: unknown
  ): Promise<void> {
    const task =
      this.getMutable(
        schedulerTaskId
      );

    task.error =
      error instanceof Error
        ? error.message
        : String(error);

    if (
      task.attempts <
      task.maxAttempts
    ) {
      task.status =
        "RETRY";

      task.availableAt =
        Date.now() +
        this.retryDelay(
          task.attempts
        );

      task.workerId =
        undefined;

      task.dispatchedAt =
        undefined;

      task.startedAt =
        undefined;

      await this.record(
        "AI_SCHEDULED_TASK_RETRY",
        task,
        {
          attempts:
            task.attempts,

          availableAt:
            task.availableAt,

          error:
            task.error
        }
      );
    } else {
      task.status =
        "FAILED";

      task.completedAt =
        Date.now();

      await this.record(
        "AI_SCHEDULED_TASK_FAILED",
        task,
        {
          attempts:
            task.attempts,

          error:
            task.error
        }
      );
    }

    await this.persistTask(
      task
    );

    this.resolveReadiness();
  }

  public getReady():
    SovereignScheduledTask[] {
    return this.getReadyInternal()
      .map(
        task =>
          this.cloneTask(
            task
          )
      );
  }

  public list():
    SovereignScheduledTask[] {
    return [
      ...this.tasks.values()
    ].map(
      task =>
        this.cloneTask(
          task
        )
    );
  }

  private async dispatch(
    task: SovereignScheduledTask
  ): Promise<void> {
    task.attempts += 1;

    const result =
      await this.adapter.dispatch(
        this.cloneTask(
          task
        )
      );

    if (!result.accepted) {
      if (
        task.attempts <
        task.maxAttempts
      ) {
        task.status =
          "RETRY";

        task.availableAt =
          Date.now() +
          this.retryDelay(
            task.attempts
          );
      } else {
        task.status =
          "FAILED";

        task.completedAt =
          Date.now();

        task.error =
          "Scheduler dispatch rejected."
      }

      await this.persistTask(
        task
      );

      return;
    }

    task.status =
      "DISPATCHED";

    task.workerId =
      result.workerId;

    task.dispatchedAt =
      Date.now();

    await this.persistTask(
      task
    );

    await this.record(
      "AI_SCHEDULED_TASK_DISPATCHED",
      task,
      {
        workerId:
          task.workerId
      }
    );
  }

  private resolveReadiness():
    void {
    const now =
      Date.now();

    for (
      const task of
        this.tasks.values()
    ) {
      if (
        task.status ===
          "RUNNING" ||
        task.status ===
          "DISPATCHED" ||
        task.status ===
          "COMPLETED" ||
        task.status ===
          "FAILED" ||
        task.status ===
          "CANCELLED"
      ) {
        continue;
      }

      if (
        task.status ===
          "RETRY" &&
        task.availableAt > now
      ) {
        continue;
      }

      const dependencies =
        task.dependencies.map(
          dependencyId =>
            [...this.tasks.values()]
              .find(
                candidate =>
                  candidate.taskId ===
                    dependencyId ||
                  candidate.id ===
                    dependencyId
              )
        );

      if (
        dependencies.some(
          dependency =>
            !dependency
        )
      ) {
        task.status =
          "BLOCKED";

        task.error =
          "Scheduler dependency not found.";

        continue;
      }

      const failed =
        dependencies.some(
          dependency =>
            dependency?.status ===
              "FAILED" ||
            dependency?.status ===
              "BLOCKED" ||
            dependency?.status ===
              "CANCELLED"
        );

      if (failed) {
        task.status =
          "BLOCKED";

        task.error =
          "Scheduler dependency failed.";

        continue;
      }

      const completed =
        dependencies.every(
          dependency =>
            dependency?.status ===
            "COMPLETED"
        );

      task.status =
        completed &&
        task.availableAt <= now
          ? "READY"
          : task.status ===
              "RETRY"
          ? "RETRY"
          : "QUEUED";
    }
  }

  private getReadyInternal():
    SovereignScheduledTask[] {
    return [
      ...this.tasks.values()
    ]
      .filter(
        task =>
          task.status ===
          "READY"
      )
      .sort(
        (a, b) => {
          const priority =
            this.priorityWeight(
              b.priority
            ) -
            this.priorityWeight(
              a.priority
            );

          if (priority !== 0) {
            return priority;
          }

          if (
            b.estimatedWeight !==
            a.estimatedWeight
          ) {
            return (
              b.estimatedWeight -
              a.estimatedWeight
            );
          }

          return (
            a.scheduledAt -
            b.scheduledAt
          );
        }
      );
  }

  private runningCritical():
    number {
    return [
      ...this.tasks.values()
    ].filter(
      task =>
        task.priority ===
          "CRITICAL" &&
        (
          task.status ===
            "RUNNING" ||
          task.status ===
            "DISPATCHED"
        )
    ).length;
  }

  private countStatus(
    status:
      SovereignScheduledTaskStatus
  ): number {
    return [
      ...this.tasks.values()
    ].filter(
      task =>
        task.status === status
    ).length;
  }

  private async createState(
    systemLoad: number
  ): Promise<SovereignSchedulerState> {
    const running =
      this.countStatus(
        "RUNNING"
      ) +
      this.countStatus(
        "DISPATCHED"
      );

    const state:
      SovereignSchedulerState = {
        id: this.createId(
          "scheduler-state"
        ),

        running,

        queued:
          this.countStatus(
            "QUEUED"
          ) +
          this.countStatus(
            "RETRY"
          ),

        ready:
          this.countStatus(
            "READY"
          ),

        completed:
          this.countStatus(
            "COMPLETED"
          ),

        failed:
          this.countStatus(
            "FAILED"
          ),

        blocked:
          this.countStatus(
            "BLOCKED"
          ),

        capacity:
          Math.max(
            0,
            this.limits
              .maxConcurrency -
              running
          ),

        systemLoad,

        updatedAt:
          Date.now()
      };

    if (
      this.adapter.persistState
    ) {
      await this.adapter
        .persistState(
          state
        );
    }

    return state;
  }

  private retryDelay(
    attempts: number
  ): number {
    return (
      this.limits.retryDelayMs *
      Math.pow(
        2,
        Math.max(
          0,
          attempts - 1
        )
      )
    );
  }

  private validateLimits(
    limits: SovereignSchedulerLimits
  ): void {
    if (
      limits.maxConcurrency < 1
    ) {
      throw new Error(
        "Scheduler maxConcurrency must be at least 1."
      );
    }

    if (
      limits.maxCriticalConcurrency <
        1 ||
      limits.maxCriticalConcurrency >
        limits.maxConcurrency
    ) {
      throw new Error(
        "Invalid critical concurrency limit."
      );
    }

    if (
      limits.maxRetries < 1
    ) {
      throw new Error(
        "Scheduler maxRetries must be at least 1."
      );
    }

    if (
      limits.maxSystemLoad <= 0 ||
      limits.maxSystemLoad > 1
    ) {
      throw new Error(
        "Scheduler maxSystemLoad must be between 0 and 1."
      );
    }
  }

  private normalizeLoad(
    load: number
  ): number {
    if (!Number.isFinite(load)) {
      return 1;
    }

    return Math.max(
      0,
      Math.min(
        1,
        load
      )
    );
  }

  private normalizeWeight(
    weight: number
  ): number {
    if (
      !Number.isFinite(weight) ||
      weight <= 0
    ) {
      return 1;
    }

    return weight;
  }

  private priorityWeight(
    priority:
      SovereignSchedulerPriority
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

  private getMutable(
    id: string
  ): SovereignScheduledTask {
    const task =
      this.tasks.get(id);

    if (!task) {
      throw new Error(
        `Scheduled task not found: ${id}`
      );
    }

    return task;
  }

  private async persistTask(
    task: SovereignScheduledTask
  ): Promise<void> {
    if (
      this.adapter.persistTask
    ) {
      await this.adapter
        .persistTask(
          task
        );
    }
  }

  private async record(
    type: string,
    task: SovereignScheduledTask,
    data?: Record<string, unknown>
  ): Promise<void> {
    await this.recordEvent(
      type,
      data,
      task
    );
  }

  private async recordEvent(
    type: string,
    data?: Record<string, unknown>,
    task?: SovereignScheduledTask
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,

          schedulerTaskId:
            task?.id,

          taskId:
            task?.taskId,

          timestamp:
            Date.now(),

          data
        });
    }
  }

  private cloneTask(
    task: SovereignScheduledTask
  ): SovereignScheduledTask {
    return {
      ...task,

      dependencies: [
        ...task.dependencies
      ],

      metadata:
        task.metadata
          ? {
              ...task.metadata
            }
          : undefined
    };
  }

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

export default SovereignAIExecutionScheduler;

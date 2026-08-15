// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-MASTER-BRAIN-170.ts
// Sovereign Master Brain
// ============================================================

export type SovereignBrainStatus =
  | "IDLE"
  | "PLANNING"
  | "EXECUTING"
  | "VERIFYING"
  | "RECOVERING"
  | "COMPLETED"
  | "BLOCKED";

export type SovereignPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export interface SovereignGoal {
  id: string;
  objective: string;
  priority: SovereignPriority;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface SovereignBrainTask {
  id: string;
  goalId: string;
  description: string;
  capability: string;
  status:
    | "PENDING"
    | "RUNNING"
    | "VERIFYING"
    | "COMPLETED"
    | "FAILED"
    | "BLOCKED";
  attempts: number;
  result?: unknown;
  error?: string;
}

export interface SovereignBrainDecision {
  goalId: string;
  action: string;
  reason: string;
  confidence: number;
  timestamp: number;
}

export interface SovereignBrainReport {
  goal: SovereignGoal;
  status: SovereignBrainStatus;
  tasks: SovereignBrainTask[];
  decisions: SovereignBrainDecision[];
  startedAt: number;
  completedAt?: number;
}

export interface SovereignBrainAdapter {
  plan(goal: SovereignGoal): Promise<SovereignBrainTask[]>;

  execute(task: SovereignBrainTask): Promise<unknown>;

  verify(
    task: SovereignBrainTask,
    result: unknown
  ): Promise<boolean>;

  recover?(
    task: SovereignBrainTask,
    error: unknown
  ): Promise<unknown>;

  recordDecision?(
    decision: SovereignBrainDecision
  ): Promise<void>;
}

export class SovereignAIMasterBrain {
  private status: SovereignBrainStatus = "IDLE";
  private readonly decisions: SovereignBrainDecision[] = [];

  constructor(
    private readonly adapter: SovereignBrainAdapter
  ) {}

  public getStatus(): SovereignBrainStatus {
    return this.status;
  }

  public async run(
    goal: SovereignGoal
  ): Promise<SovereignBrainReport> {
    const startedAt = Date.now();

    this.status = "PLANNING";

    const tasks = await this.adapter.plan(goal);

    if (!tasks.length) {
      this.status = "BLOCKED";

      return {
        goal,
        status: this.status,
        tasks,
        decisions: [...this.decisions],
        startedAt,
        completedAt: Date.now()
      };
    }

    this.status = "EXECUTING";

    for (const task of tasks) {
      await this.runTask(goal, task);

      if (task.status === "BLOCKED") {
        this.status = "BLOCKED";
        break;
      }
    }

    if (this.status !== "BLOCKED") {
      this.status = tasks.every(
        task => task.status === "COMPLETED"
      )
        ? "COMPLETED"
        : "RECOVERING";
    }

    return {
      goal,
      status: this.status,
      tasks,
      decisions: [...this.decisions],
      startedAt,
      completedAt: Date.now()
    };
  }

  private async runTask(
    goal: SovereignGoal,
    task: SovereignBrainTask
  ): Promise<void> {
    task.status = "RUNNING";
    task.attempts += 1;

    try {
      const result = await this.adapter.execute(task);

      task.status = "VERIFYING";
      this.status = "VERIFYING";

      const valid = await this.adapter.verify(
        task,
        result
      );

      if (!valid) {
        throw new Error(
          `Verification failed for task ${task.id}`
        );
      }

      task.result = result;
      task.status = "COMPLETED";

      await this.decide(
        goal.id,
        `COMPLETE:${task.id}`,
        "Task executed and independently verified.",
        1
      );

      this.status = "EXECUTING";
    } catch (error) {
      await this.handleFailure(goal, task, error);
    }
  }

  private async handleFailure(
    goal: SovereignGoal,
    task: SovereignBrainTask,
    error: unknown
  ): Promise<void> {
    task.status = "FAILED";
    task.error =
      error instanceof Error
        ? error.message
        : String(error);

    if (!this.adapter.recover) {
      task.status = "BLOCKED";

      await this.decide(
        goal.id,
        `BLOCK:${task.id}`,
        task.error,
        1
      );

      return;
    }

    this.status = "RECOVERING";

    try {
      const recovered =
        await this.adapter.recover(task, error);

      const valid = await this.adapter.verify(
        task,
        recovered
      );

      if (!valid) {
        task.status = "BLOCKED";

        await this.decide(
          goal.id,
          `BLOCK:${task.id}`,
          "Recovery verification failed.",
          1
        );

        return;
      }

      task.result = recovered;
      task.status = "COMPLETED";

      await this.decide(
        goal.id,
        `RECOVER:${task.id}`,
        "Failure repaired and verified.",
        1
      );

      this.status = "EXECUTING";
    } catch (recoveryError) {
      task.status = "BLOCKED";
      task.error =
        recoveryError instanceof Error
          ? recoveryError.message
          : String(recoveryError);

      await this.decide(
        goal.id,
        `BLOCK:${task.id}`,
        task.error,
        1
      );
    }
  }

  private async decide(
    goalId: string,
    action: string,
    reason: string,
    confidence: number
  ): Promise<void> {
    const decision: SovereignBrainDecision = {
      goalId,
      action,
      reason,
      confidence,
      timestamp: Date.now()
    };

    this.decisions.push(decision);

    if (this.adapter.recordDecision) {
      await this.adapter.recordDecision(decision);
    }
  }
}

export default SovereignAIMasterBrain;

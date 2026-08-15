// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-AUTONOMOUS-PLANNER-171.ts
// Autonomous Sovereign Planning Engine
// ============================================================

export type AutonomousPlanStatus =
  | "DRAFT"
  | "ANALYZING"
  | "READY"
  | "EXECUTING"
  | "COMPLETED"
  | "BLOCKED"
  | "FAILED";

export type AutonomousTaskPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export interface AutonomousObjective {
  id: string;
  description: string;
  constraints?: string[];
  expectedResults?: string[];
  metadata?: Record<string, unknown>;
}

export interface AutonomousPlanTask {
  id: string;
  objectiveId: string;

  title: string;
  description: string;

  capability: string;

  priority: AutonomousTaskPriority;

  dependencies: string[];

  verificationRequired: boolean;

  rollbackRequired: boolean;

  status:
    | "PENDING"
    | "READY"
    | "BLOCKED"
    | "RUNNING"
    | "VERIFYING"
    | "COMPLETED"
    | "FAILED";

  attempts: number;

  createdAt: number;
}

export interface AutonomousPlan {
  id: string;

  objective: AutonomousObjective;

  status: AutonomousPlanStatus;

  tasks: AutonomousPlanTask[];

  createdAt: number;
  updatedAt: number;
}

export interface AutonomousPlanningAdapter {
  analyze(
    objective: AutonomousObjective
  ): Promise<{
    capabilities: string[];
    risks?: string[];
    constraints?: string[];
  }>;

  generateTasks(
    objective: AutonomousObjective,
    analysis: {
      capabilities: string[];
      risks?: string[];
      constraints?: string[];
    }
  ): Promise<AutonomousPlanTask[]>;

  validateTask?(
    task: AutonomousPlanTask
  ): Promise<boolean>;

  validatePlan?(
    plan: AutonomousPlan
  ): Promise<boolean>;
}

export class SovereignAIAutonomousPlanner {
  constructor(
    private readonly adapter: AutonomousPlanningAdapter
  ) {}

  public async createPlan(
    objective: AutonomousObjective
  ): Promise<AutonomousPlan> {
    const now = Date.now();

    const plan: AutonomousPlan = {
      id: this.createId("plan"),
      objective,
      status: "ANALYZING",
      tasks: [],
      createdAt: now,
      updatedAt: now
    };

    const analysis =
      await this.adapter.analyze(objective);

    const tasks =
      await this.adapter.generateTasks(
        objective,
        analysis
      );

    plan.tasks =
      await this.prepareTasks(tasks);

    this.resolveDependencies(plan);

    if (this.adapter.validatePlan) {
      const valid =
        await this.adapter.validatePlan(plan);

      if (!valid) {
        plan.status = "FAILED";
        plan.updatedAt = Date.now();
        return plan;
      }
    }

    plan.status = this.hasBlockedTasks(plan)
      ? "BLOCKED"
      : "READY";

    plan.updatedAt = Date.now();

    return plan;
  }

  public getExecutableTasks(
    plan: AutonomousPlan
  ): AutonomousPlanTask[] {
    return plan.tasks
      .filter(task => {
        if (
          task.status !== "READY" &&
          task.status !== "PENDING"
        ) {
          return false;
        }

        return task.dependencies.every(
          dependencyId =>
            plan.tasks.some(
              dependency =>
                dependency.id === dependencyId &&
                dependency.status === "COMPLETED"
            )
        );
      })
      .sort(
        (a, b) =>
          this.priorityWeight(b.priority) -
          this.priorityWeight(a.priority)
      );
  }

  public markTaskCompleted(
    plan: AutonomousPlan,
    taskId: string
  ): void {
    const task = this.getTask(plan, taskId);

    task.status = "COMPLETED";

    this.resolveDependencies(plan);

    if (
      plan.tasks.every(
        item => item.status === "COMPLETED"
      )
    ) {
      plan.status = "COMPLETED";
    }

    plan.updatedAt = Date.now();
  }

  public markTaskFailed(
    plan: AutonomousPlan,
    taskId: string
  ): void {
    const task = this.getTask(plan, taskId);

    task.status = "FAILED";
    task.attempts += 1;

    plan.status = "BLOCKED";
    plan.updatedAt = Date.now();

    this.resolveDependencies(plan);
  }

  private async prepareTasks(
    tasks: AutonomousPlanTask[]
  ): Promise<AutonomousPlanTask[]> {
    const prepared: AutonomousPlanTask[] = [];

    for (const task of tasks) {
      const normalized: AutonomousPlanTask = {
        ...task,
        dependencies: [
          ...new Set(task.dependencies || [])
        ],
        attempts: task.attempts || 0,
        status: task.status || "PENDING",
        createdAt:
          task.createdAt || Date.now()
      };

      if (this.adapter.validateTask) {
        const valid =
          await this.adapter.validateTask(
            normalized
          );

        if (!valid) {
          normalized.status = "BLOCKED";
        }
      }

      prepared.push(normalized);
    }

    return prepared;
  }

  private resolveDependencies(
    plan: AutonomousPlan
  ): void {
    for (const task of plan.tasks) {
      if (
        task.status === "COMPLETED" ||
        task.status === "FAILED" ||
        task.status === "RUNNING" ||
        task.status === "VERIFYING"
      ) {
        continue;
      }

      const dependenciesExist =
        task.dependencies.every(
          dependencyId =>
            plan.tasks.some(
              dependency =>
                dependency.id === dependencyId
            )
        );

      if (!dependenciesExist) {
        task.status = "BLOCKED";
        continue;
      }

      const dependenciesCompleted =
        task.dependencies.every(
          dependencyId =>
            plan.tasks.some(
              dependency =>
                dependency.id === dependencyId &&
                dependency.status === "COMPLETED"
            )
        );

      task.status = dependenciesCompleted
        ? "READY"
        : "PENDING";
    }
  }

  private hasBlockedTasks(
    plan: AutonomousPlan
  ): boolean {
    return plan.tasks.some(
      task => task.status === "BLOCKED"
    );
  }

  private getTask(
    plan: AutonomousPlan,
    taskId: string
  ): AutonomousPlanTask {
    const task = plan.tasks.find(
      item => item.id === taskId
    );

    if (!task) {
      throw new Error(
        `Autonomous task not found: ${taskId}`
      );
    }

    return task;
  }

  private priorityWeight(
    priority: AutonomousTaskPriority
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

  private createId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

export default SovereignAIAutonomousPlanner;

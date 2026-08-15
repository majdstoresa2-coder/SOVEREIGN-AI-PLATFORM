// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-GOAL-DECOMPOSITION-191.ts
// Sovereign Autonomous AI Goal Decomposition Engine
// ============================================================

export type SovereignGoalStatus =
  | "PENDING"
  | "READY"
  | "ACTIVE"
  | "COMPLETED"
  | "FAILED"
  | "BLOCKED";

export type SovereignGoalPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export interface SovereignGoalInput {
  id: string;

  objective: string;

  intentId: string;

  autonomous: boolean;

  constraints: string[];

  expectedOutcomes: string[];

  requiredCapabilities: string[];

  createdAt: number;
}

export interface SovereignSubGoal {
  id: string;

  parentGoalId: string;

  objective: string;

  description: string;

  priority: SovereignGoalPriority;

  dependencies: string[];

  requiredCapabilities: string[];

  successCriteria: string[];

  status: SovereignGoalStatus;

  autonomous: boolean;

  order: number;

  attempts: number;

  createdAt: number;

  completedAt?: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignGoalPlan {
  id: string;

  goal: SovereignGoalInput;

  subGoals: SovereignSubGoal[];

  executionOrder: string[];

  ready: boolean;

  blockedGoals: string[];

  createdAt: number;
}

export interface SovereignGoalDecompositionAdapter {
  decompose(
    goal: SovereignGoalInput
  ): Promise<
    Omit<
      SovereignSubGoal,
      | "id"
      | "parentGoalId"
      | "status"
      | "attempts"
      | "createdAt"
    >[]
  >;

  verifyGoal?(
    goal: SovereignSubGoal
  ): Promise<boolean>;

  capabilityCheck?(
    capability: string
  ): Promise<boolean>;

  persistPlan?(
    plan: SovereignGoalPlan
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    goalId?: string;

    subGoalId?: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIGoalDecomposition {
  constructor(
    private readonly adapter:
      SovereignGoalDecompositionAdapter
  ) {}

  public async decompose(
    goal: SovereignGoalInput
  ): Promise<SovereignGoalPlan> {
    this.validateGoal(goal);

    const generated =
      await this.adapter.decompose(
        goal
      );

    if (!generated.length) {
      throw new Error(
        "Goal decomposition produced no sub-goals."
      );
    }

    const subGoals:
      SovereignSubGoal[] = [];

    for (
      let index = 0;
      index < generated.length;
      index++
    ) {
      const item =
        generated[index];

      const subGoal:
        SovereignSubGoal = {
          ...item,

          id: this.createId(
            "sub-goal"
          ),

          parentGoalId:
            goal.id,

          dependencies: [
            ...new Set(
              item.dependencies || []
            )
          ],

          requiredCapabilities: [
            ...new Set(
              item.requiredCapabilities || []
            )
          ],

          successCriteria: [
            ...new Set(
              item.successCriteria || []
            )
          ],

          status:
            "PENDING",

          autonomous:
            goal.autonomous &&
            item.autonomous,

          order:
            Number.isFinite(
              item.order
            )
              ? item.order
              : index,

          attempts: 0,

          createdAt:
            Date.now()
        };

      this.validateSubGoal(
        subGoal
      );

      subGoals.push(
        subGoal
      );
    }

    this.normalizeDependencies(
      subGoals
    );

    await this.verifyCapabilities(
      subGoals
    );

    await this.verifyGoals(
      subGoals
    );

    this.resolveReadiness(
      subGoals
    );

    const executionOrder =
      this.calculateExecutionOrder(
        subGoals
      );

    const blockedGoals =
      subGoals
        .filter(
          item =>
            item.status ===
            "BLOCKED"
        )
        .map(
          item =>
            item.id
        );

    const plan:
      SovereignGoalPlan = {
        id: this.createId(
          "goal-plan"
        ),

        goal,

        subGoals,

        executionOrder,

        ready:
          blockedGoals.length === 0 &&
          subGoals.some(
            item =>
              item.status ===
              "READY"
          ),

        blockedGoals,

        createdAt:
          Date.now()
      };

    if (
      this.adapter.persistPlan
    ) {
      await this.adapter
        .persistPlan(
          plan
        );
    }

    await this.record(
      plan.ready
        ? "AI_GOAL_PLAN_READY"
        : "AI_GOAL_PLAN_BLOCKED",
      goal.id,
      undefined,
      {
        subGoals:
          subGoals.length,

        blocked:
          blockedGoals.length,

        executionOrder
      }
    );

    return plan;
  }

  public refresh(
    plan: SovereignGoalPlan
  ): SovereignGoalPlan {
    this.resolveReadiness(
      plan.subGoals
    );

    plan.executionOrder =
      this.calculateExecutionOrder(
        plan.subGoals
      );

    plan.blockedGoals =
      plan.subGoals
        .filter(
          goal =>
            goal.status ===
            "BLOCKED"
        )
        .map(
          goal =>
            goal.id
        );

    plan.ready =
      plan.blockedGoals.length === 0 &&
      plan.subGoals.some(
        goal =>
          goal.status ===
          "READY"
      );

    return plan;
  }

  public markCompleted(
    plan: SovereignGoalPlan,
    subGoalId: string
  ): SovereignGoalPlan {
    const goal =
      this.findSubGoal(
        plan,
        subGoalId
      );

    goal.status =
      "COMPLETED";

    goal.completedAt =
      Date.now();

    return this.refresh(
      plan
    );
  }

  public markFailed(
    plan: SovereignGoalPlan,
    subGoalId: string
  ): SovereignGoalPlan {
    const goal =
      this.findSubGoal(
        plan,
        subGoalId
      );

    goal.status =
      "FAILED";

    goal.attempts += 1;

    return this.refresh(
      plan
    );
  }

  public getReadyGoals(
    plan: SovereignGoalPlan
  ): SovereignSubGoal[] {
    return plan.subGoals
      .filter(
        goal =>
          goal.status ===
          "READY"
      )
      .sort(
        (a, b) =>
          a.order -
          b.order
      )
      .map(
        goal => ({
          ...goal,

          dependencies: [
            ...goal.dependencies
          ],

          requiredCapabilities: [
            ...goal.requiredCapabilities
          ],

          successCriteria: [
            ...goal.successCriteria
          ]
        })
      );
  }

  private resolveReadiness(
    goals: SovereignSubGoal[]
  ): void {
    for (const goal of goals) {
      if (
        goal.status ===
          "COMPLETED" ||
        goal.status ===
          "FAILED" ||
        goal.status ===
          "ACTIVE"
      ) {
        continue;
      }

      const dependencyStates =
        goal.dependencies.map(
          dependency =>
            goals.find(
              candidate =>
                candidate.id ===
                dependency
            )
        );

      if (
        dependencyStates.some(
          dependency =>
            !dependency
        )
      ) {
        goal.status =
          "BLOCKED";

        continue;
      }

      if (
        dependencyStates.some(
          dependency =>
            dependency?.status ===
              "FAILED" ||
            dependency?.status ===
              "BLOCKED"
        )
      ) {
        goal.status =
          "BLOCKED";

        continue;
      }

      const complete =
        dependencyStates.every(
          dependency =>
            dependency?.status ===
            "COMPLETED"
        );

      goal.status =
        complete
          ? "READY"
          : "PENDING";
    }
  }

  private normalizeDependencies(
    goals: SovereignSubGoal[]
  ): void {
    const ids =
      new Set(
        goals.map(
          goal =>
            goal.id
        )
      );

    for (const goal of goals) {
      goal.dependencies =
        goal.dependencies.filter(
          dependency =>
            dependency !==
            goal.id
        );

      for (
        const dependency of
          goal.dependencies
      ) {
        if (!ids.has(dependency)) {
          throw new Error(
            `Unknown goal dependency: ${dependency}`
          );
        }
      }
    }

    this.detectCycles(
      goals
    );
  }

  private detectCycles(
    goals: SovereignSubGoal[]
  ): void {
    const visiting =
      new Set<string>();

    const visited =
      new Set<string>();

    const visit = (
      goal: SovereignSubGoal
    ): void => {
      if (
        visiting.has(
          goal.id
        )
      ) {
        throw new Error(
          `Goal dependency cycle detected: ${goal.id}`
        );
      }

      if (
        visited.has(
          goal.id
        )
      ) {
        return;
      }

      visiting.add(
        goal.id
      );

      for (
        const dependencyId of
          goal.dependencies
      ) {
        const dependency =
          goals.find(
            candidate =>
              candidate.id ===
              dependencyId
          );

        if (dependency) {
          visit(
            dependency
          );
        }
      }

      visiting.delete(
        goal.id
      );

      visited.add(
        goal.id
      );
    };

    for (const goal of goals) {
      visit(goal);
    }
  }

  private async verifyCapabilities(
    goals: SovereignSubGoal[]
  ): Promise<void> {
    if (
      !this.adapter
        .capabilityCheck
    ) {
      return;
    }

    for (const goal of goals) {
      for (
        const capability of
          goal.requiredCapabilities
      ) {
        const available =
          await this.adapter
            .capabilityCheck(
              capability
            );

        if (!available) {
          goal.status =
            "BLOCKED";

          await this.record(
            "AI_SUB_GOAL_CAPABILITY_MISSING",
            goal.parentGoalId,
            goal.id,
            {
              capability
            }
          );
        }
      }
    }
  }

  private async verifyGoals(
    goals: SovereignSubGoal[]
  ): Promise<void> {
    if (
      !this.adapter.verifyGoal
    ) {
      return;
    }

    for (const goal of goals) {
      const verified =
        await this.adapter
          .verifyGoal(
            goal
          );

      if (!verified) {
        goal.status =
          "BLOCKED";

        await this.record(
          "AI_SUB_GOAL_VERIFICATION_FAILED",
          goal.parentGoalId,
          goal.id
        );
      }
    }
  }

  private calculateExecutionOrder(
    goals: SovereignSubGoal[]
  ): string[] {
    const result: string[] = [];

    const visited =
      new Set<string>();

    const visit = (
      goal: SovereignSubGoal
    ): void => {
      if (
        visited.has(
          goal.id
        )
      ) {
        return;
      }

      for (
        const dependencyId of
          goal.dependencies
      ) {
        const dependency =
          goals.find(
            candidate =>
              candidate.id ===
              dependencyId
          );

        if (dependency) {
          visit(
            dependency
          );
        }
      }

      visited.add(
        goal.id
      );

      result.push(
        goal.id
      );
    };

    [...goals]
      .sort(
        (a, b) =>
          a.order -
          b.order
      )
      .forEach(visit);

    return result;
  }

  private validateGoal(
    goal: SovereignGoalInput
  ): void {
    if (!goal.id.trim()) {
      throw new Error(
        "Goal id is required."
      );
    }

    if (!goal.objective.trim()) {
      throw new Error(
        "Goal objective is required."
      );
    }

    if (!goal.intentId.trim()) {
      throw new Error(
        "Goal intent id is required."
      );
    }
  }

  private validateSubGoal(
    goal: SovereignSubGoal
  ): void {
    if (!goal.objective.trim()) {
      throw new Error(
        "Sub-goal objective is required."
      );
    }

    if (
      !goal.successCriteria.length
    ) {
      throw new Error(
        "Sub-goal requires success criteria."
      );
    }
  }

  private findSubGoal(
    plan: SovereignGoalPlan,
    subGoalId: string
  ): SovereignSubGoal {
    const goal =
      plan.subGoals.find(
        item =>
          item.id ===
          subGoalId
      );

    if (!goal) {
      throw new Error(
        `Sub-goal not found: ${subGoalId}`
      );
    }

    return goal;
  }

  private async record(
    type: string,
    goalId?: string,
    subGoalId?: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,

          goalId,

          subGoalId,

          timestamp:
            Date.now(),

          data
        });
    }
  }

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

export default SovereignAIGoalDecomposition;

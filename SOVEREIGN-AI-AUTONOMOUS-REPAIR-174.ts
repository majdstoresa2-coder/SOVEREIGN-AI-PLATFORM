// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-AUTONOMOUS-REPAIR-174.ts
// Autonomous Sovereign Repair Engine
// ============================================================

export type SovereignRepairStatus =
  | "IDLE"
  | "ANALYZING"
  | "PLANNING"
  | "REPAIRING"
  | "VERIFYING"
  | "REPAIRED"
  | "FAILED"
  | "BLOCKED";

export type SovereignRepairSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignRepairIssue {
  id: string;

  targetId: string;

  type:
    | "CODE"
    | "BUILD"
    | "TEST"
    | "SERVICE"
    | "GAME"
    | "AUTOMATION"
    | "DEPLOYMENT"
    | "INFRASTRUCTURE"
    | "SECURITY"
    | "DATA"
    | "OTHER";

  severity: SovereignRepairSeverity;

  description: string;

  evidence?: unknown;

  metadata?: Record<string, unknown>;
}

export interface SovereignRepairAction {
  id: string;

  issueId: string;

  capability: string;

  action: string;

  description: string;

  input?: Record<string, unknown>;

  destructive: boolean;

  reversible: boolean;

  status:
    | "PENDING"
    | "RUNNING"
    | "COMPLETED"
    | "FAILED"
    | "BLOCKED";

  result?: unknown;
  error?: string;
}

export interface SovereignRepairPlan {
  id: string;

  issue: SovereignRepairIssue;

  actions: SovereignRepairAction[];

  createdAt: number;
}

export interface SovereignRepairReport {
  id: string;

  issue: SovereignRepairIssue;

  plan?: SovereignRepairPlan;

  status: SovereignRepairStatus;

  attempts: number;

  verified: boolean;

  startedAt: number;
  completedAt: number;

  error?: string;
}

export interface SovereignRepairAdapter {
  analyze(
    issue: SovereignRepairIssue
  ): Promise<Record<string, unknown>>;

  createPlan(
    issue: SovereignRepairIssue,
    analysis: Record<string, unknown>
  ): Promise<SovereignRepairAction[]>;

  execute(
    action: SovereignRepairAction
  ): Promise<unknown>;

  verify(
    issue: SovereignRepairIssue
  ): Promise<boolean>;

  rollback?(
    action: SovereignRepairAction
  ): Promise<void>;

  recordReport?(
    report: SovereignRepairReport
  ): Promise<void>;
}

export class SovereignAIAutonomousRepair {
  private status: SovereignRepairStatus = "IDLE";

  constructor(
    private readonly adapter: SovereignRepairAdapter,
    private readonly maxAttempts = 3
  ) {}

  public getStatus(): SovereignRepairStatus {
    return this.status;
  }

  public async repair(
    issue: SovereignRepairIssue
  ): Promise<SovereignRepairReport> {
    const startedAt = Date.now();

    let attempts = 0;
    let lastError: string | undefined;
    let plan: SovereignRepairPlan | undefined;

    while (attempts < this.maxAttempts) {
      attempts += 1;

      try {
        this.status = "ANALYZING";

        const analysis =
          await this.adapter.analyze(issue);

        this.status = "PLANNING";

        const actions =
          await this.adapter.createPlan(
            issue,
            analysis
          );

        if (!actions.length) {
          this.status = "BLOCKED";

          return this.finishReport({
            issue,
            plan,
            status: this.status,
            attempts,
            verified: false,
            startedAt,
            error: "No safe repair actions available."
          });
        }

        plan = {
          id: this.createId("repair-plan"),
          issue,
          actions: actions.map(action => ({
            ...action,
            status: action.status || "PENDING"
          })),
          createdAt: Date.now()
        };

        this.status = "REPAIRING";

        const repaired =
          await this.executePlan(plan);

        if (!repaired) {
          throw new Error(
            "Repair plan execution failed."
          );
        }

        this.status = "VERIFYING";

        const verified =
          await this.adapter.verify(issue);

        if (!verified) {
          throw new Error(
            "Repair verification failed."
          );
        }

        this.status = "REPAIRED";

        return this.finishReport({
          issue,
          plan,
          status: this.status,
          attempts,
          verified: true,
          startedAt
        });
      } catch (error) {
        lastError =
          error instanceof Error
            ? error.message
            : String(error);

        if (
          plan &&
          attempts < this.maxAttempts
        ) {
          await this.rollbackFailedActions(plan);
        }
      }
    }

    this.status = "FAILED";

    return this.finishReport({
      issue,
      plan,
      status: this.status,
      attempts,
      verified: false,
      startedAt,
      error: lastError
    });
  }

  private async executePlan(
    plan: SovereignRepairPlan
  ): Promise<boolean> {
    for (const action of plan.actions) {
      // Destructive operations are blocked by default.
      // The sovereign system must prefer repair,
      // replacement, migration or rollback instead.
      if (action.destructive) {
        action.status = "BLOCKED";
        action.error =
          "Destructive autonomous action blocked.";

        return false;
      }

      action.status = "RUNNING";

      try {
        const result =
          await this.adapter.execute(action);

        action.result = result;
        action.status = "COMPLETED";
      } catch (error) {
        action.status = "FAILED";
        action.error =
          error instanceof Error
            ? error.message
            : String(error);

        return false;
      }
    }

    return true;
  }

  private async rollbackFailedActions(
    plan: SovereignRepairPlan
  ): Promise<void> {
    if (!this.adapter.rollback) {
      return;
    }

    const completed = [...plan.actions]
      .filter(
        action =>
          action.status === "COMPLETED" &&
          action.reversible
      )
      .reverse();

    for (const action of completed) {
      try {
        await this.adapter.rollback(action);
      } catch {
        // Rollback failure is preserved for
        // higher-level recovery supervision.
      }
    }
  }

  private finishReport(input: {
    issue: SovereignRepairIssue;
    plan?: SovereignRepairPlan;
    status: SovereignRepairStatus;
    attempts: number;
    verified: boolean;
    startedAt: number;
    error?: string;
  }): SovereignRepairReport {
    const report: SovereignRepairReport = {
      id: this.createId("repair-report"),
      issue: input.issue,
      plan: input.plan,
      status: input.status,
      attempts: input.attempts,
      verified: input.verified,
      startedAt: input.startedAt,
      completedAt: Date.now(),
      error: input.error
    };

    if (this.adapter.recordReport) {
      void this.adapter.recordReport(report);
    }

    return report;
  }

  private createId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

export default SovereignAIAutonomousRepair;

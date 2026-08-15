// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-MASTER-INTEGRATION-206.ts
// Final Closure 01/15
// Sovereign AI Master Integration Layer
// ============================================================

export type SovereignMasterAuthority =
  | "OWNER"
  | "STEWARD"
  | "SYSTEM";

export type SovereignMasterStage =
  | "RECEIVED"
  | "AUTHORIZED"
  | "CONTEXT_READY"
  | "KNOWLEDGE_READY"
  | "PLANNED"
  | "DECIDED"
  | "ASSURED"
  | "EXECUTION_AUTHORIZED"
  | "EXECUTING"
  | "VERIFYING"
  | "COMPLETED"
  | "REJECTED"
  | "FAILED";

export interface SovereignMasterCommand {
  id: string;
  authority: SovereignMasterAuthority;
  instruction: string;
  projectId?: string;
  priority?: number;
  autonomous?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface SovereignMasterContext {
  commandId: string;
  projectId?: string;
  instruction: string;
  authority: SovereignMasterAuthority;
  priority: number;
  autonomous: boolean;
  metadata: Record<string, unknown>;
}

export interface SovereignMasterKnowledge {
  id: string;
  subject: string;
  content: unknown;
  authority:
    | "SUPREME"
    | "DELEGATED"
    | "SYSTEM"
    | "LEARNED";
  confidence: number;
}

export interface SovereignMasterPlan {
  id: string;
  goal: string;
  steps: SovereignMasterPlanStep[];
  createdAt: number;
}

export interface SovereignMasterPlanStep {
  id: string;
  order: number;
  capability: string;
  action: string;
  description: string;
  dependencies: string[];
  required: boolean;
}

export interface SovereignMasterDecision {
  id: string;
  approved: boolean;
  action: string;
  rationale: string;
  confidence: number;
  constraints: string[];
}

export interface SovereignMasterAssurance {
  id: string;
  executable: boolean;
  ownerRequired: boolean;
  verdict:
    | "APPROVED"
    | "APPROVED_WITH_CONSTRAINTS"
    | "REPLAN_REQUIRED"
    | "OWNER_REQUIRED"
    | "REJECTED";
  constraints: string[];
}

export interface SovereignMasterExecutionPermit {
  id: string;
  authorized: boolean;
  expiresAt: number;
  constraints: string[];
}

export interface SovereignMasterExecutionResult {
  stepId: string;
  success: boolean;
  output?: unknown;
  error?: string;
  startedAt: number;
  completedAt: number;
}

export interface SovereignMasterRun {
  id: string;
  commandId: string;
  stage: SovereignMasterStage;
  context?: SovereignMasterContext;
  knowledge: SovereignMasterKnowledge[];
  plan?: SovereignMasterPlan;
  decision?: SovereignMasterDecision;
  assurance?: SovereignMasterAssurance;
  permit?: SovereignMasterExecutionPermit;
  results: SovereignMasterExecutionResult[];
  error?: string;
  startedAt: number;
  completedAt?: number;
}

export interface SovereignAIMasterIntegrationAdapter {
  authorizeCommand(
    command: SovereignMasterCommand
  ): Promise<boolean>;

  buildContext(
    command: SovereignMasterCommand
  ): Promise<SovereignMasterContext>;

  retrieveKnowledge(
    context: SovereignMasterContext
  ): Promise<SovereignMasterKnowledge[]>;

  createPlan(
    context: SovereignMasterContext,
    knowledge: SovereignMasterKnowledge[]
  ): Promise<SovereignMasterPlan>;

  makeDecision(
    context: SovereignMasterContext,
    plan: SovereignMasterPlan,
    knowledge: SovereignMasterKnowledge[]
  ): Promise<SovereignMasterDecision>;

  assureDecision(
    context: SovereignMasterContext,
    decision: SovereignMasterDecision,
    plan: SovereignMasterPlan
  ): Promise<SovereignMasterAssurance>;

  authorizeExecution(
    context: SovereignMasterContext,
    decision: SovereignMasterDecision,
    assurance: SovereignMasterAssurance
  ): Promise<SovereignMasterExecutionPermit>;

  executeStep(
    context: SovereignMasterContext,
    step: SovereignMasterPlanStep,
    permit: SovereignMasterExecutionPermit
  ): Promise<unknown>;

  verifyRun?(
    run: SovereignMasterRun
  ): Promise<boolean>;

  persistRun?(
    run: SovereignMasterRun
  ): Promise<void>;

  recordEvent?(event: {
    type: string;
    runId: string;
    commandId: string;
    stage: SovereignMasterStage;
    timestamp: number;
    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIMasterIntegration {
  constructor(
    private readonly adapter:
      SovereignAIMasterIntegrationAdapter
  ) {}

  public async run(
    input: SovereignMasterCommand
  ): Promise<SovereignMasterRun> {
    const command =
      this.normalizeCommand(input);

    this.validateCommand(command);

    const run: SovereignMasterRun = {
      id: this.createId("sovereign-run"),
      commandId: command.id,
      stage: "RECEIVED",
      knowledge: [],
      results: [],
      startedAt: Date.now()
    };

    try {
      await this.transition(run, "RECEIVED");

      const authorized =
        await this.adapter.authorizeCommand(
          command
        );

      if (!authorized) {
        run.stage = "REJECTED";
        run.error =
          "Sovereign command authorization failed.";
        run.completedAt = Date.now();

        await this.finish(run);
        return this.cloneRun(run);
      }

      await this.transition(
        run,
        "AUTHORIZED"
      );

      run.context =
        await this.adapter.buildContext(
          command
        );

      await this.transition(
        run,
        "CONTEXT_READY"
      );

      run.knowledge =
        await this.adapter.retrieveKnowledge(
          run.context
        );

      await this.transition(
        run,
        "KNOWLEDGE_READY"
      );

      run.plan =
        await this.adapter.createPlan(
          run.context,
          run.knowledge
        );

      this.validatePlan(run.plan);

      await this.transition(
        run,
        "PLANNED"
      );

      run.decision =
        await this.adapter.makeDecision(
          run.context,
          run.plan,
          run.knowledge
        );

      if (!run.decision.approved) {
        run.stage = "REJECTED";
        run.error =
          run.decision.rationale ||
          "Decision rejected.";
        run.completedAt = Date.now();

        await this.finish(run);
        return this.cloneRun(run);
      }

      await this.transition(
        run,
        "DECIDED"
      );

      run.assurance =
        await this.adapter.assureDecision(
          run.context,
          run.decision,
          run.plan
        );

      if (
        !run.assurance.executable ||
        run.assurance.ownerRequired ||
        (
          run.assurance.verdict !==
            "APPROVED" &&
          run.assurance.verdict !==
            "APPROVED_WITH_CONSTRAINTS"
        )
      ) {
        run.stage =
          run.assurance.ownerRequired
            ? "REJECTED"
            : "FAILED";

        run.error =
          run.assurance.ownerRequired
            ? "OWNER authority is required."
            : `Decision assurance returned ${run.assurance.verdict}.`;

        run.completedAt = Date.now();

        await this.finish(run);
        return this.cloneRun(run);
      }

      await this.transition(
        run,
        "ASSURED"
      );

      run.permit =
        await this.adapter.authorizeExecution(
          run.context,
          run.decision,
          run.assurance
        );

      if (!run.permit.authorized) {
        run.stage = "REJECTED";
        run.error =
          "Execution authorization denied.";
        run.completedAt = Date.now();

        await this.finish(run);
        return this.cloneRun(run);
      }

      if (
        Date.now() >=
        run.permit.expiresAt
      ) {
        run.stage = "FAILED";
        run.error =
          "Execution permit expired before execution.";
        run.completedAt = Date.now();

        await this.finish(run);
        return this.cloneRun(run);
      }

      await this.transition(
        run,
        "EXECUTION_AUTHORIZED"
      );

      await this.transition(
        run,
        "EXECUTING"
      );

      const orderedSteps =
        [...run.plan.steps].sort(
          (a, b) =>
            a.order - b.order
        );

      const completed =
        new Set<string>();

      for (
        const step of orderedSteps
      ) {
        this.ensureDependencies(
          step,
          completed
        );

        if (
          Date.now() >=
          run.permit.expiresAt
        ) {
          throw new Error(
            "Execution permit expired during execution."
          );
        }

        const startedAt =
          Date.now();

        try {
          const output =
            await this.adapter.executeStep(
              run.context,
              step,
              run.permit
            );

          run.results.push({
            stepId: step.id,
            success: true,
            output,
            startedAt,
            completedAt:
              Date.now()
          });

          completed.add(
            step.id
          );
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : String(error);

          run.results.push({
            stepId: step.id,
            success: false,
            error: message,
            startedAt,
            completedAt:
              Date.now()
          });

          if (step.required) {
            throw new Error(
              `Required step failed: ${step.id}: ${message}`
            );
          }
        }
      }

      await this.transition(
        run,
        "VERIFYING"
      );

      if (
        this.adapter.verifyRun
      ) {
        const verified =
          await this.adapter.verifyRun(
            this.cloneRun(run)
          );

        if (!verified) {
          throw new Error(
            "Sovereign run verification failed."
          );
        }
      }

      run.stage = "COMPLETED";
      run.completedAt =
        Date.now();

      await this.finish(run);

      return this.cloneRun(run);
    } catch (error) {
      run.stage = "FAILED";

      run.error =
        error instanceof Error
          ? error.message
          : String(error);

      run.completedAt =
        Date.now();

      await this.finish(run);

      return this.cloneRun(run);
    }
  }

  private normalizeCommand(
    input: SovereignMasterCommand
  ): SovereignMasterCommand {
    return {
      ...input,

      instruction:
        input.instruction.trim(),

      priority:
        this.normalizePriority(
          input.priority ?? 50
        ),

      autonomous:
        input.authority === "OWNER"
          ? input.autonomous ?? true
          : input.autonomous ?? true,

      metadata:
        input.metadata
          ? { ...input.metadata }
          : undefined
    };
  }

  private validateCommand(
    command: SovereignMasterCommand
  ): void {
    if (!command.id.trim()) {
      throw new Error(
        "Sovereign command id is required."
      );
    }

    if (!command.instruction) {
      throw new Error(
        "Sovereign command instruction is required."
      );
    }

    if (
      command.authority !== "OWNER" &&
      command.authority !== "STEWARD" &&
      command.authority !== "SYSTEM"
    ) {
      throw new Error(
        "Invalid sovereign command authority."
      );
    }
  }

  private validatePlan(
    plan: SovereignMasterPlan
  ): void {
    if (!plan.id.trim()) {
      throw new Error(
        "Sovereign plan id is required."
      );
    }

    if (!plan.steps.length) {
      throw new Error(
        "Sovereign plan contains no execution steps."
      );
    }

    const ids =
      new Set<string>();

    for (const step of plan.steps) {
      if (!step.id.trim()) {
        throw new Error(
          "Plan step id is required."
        );
      }

      if (ids.has(step.id)) {
        throw new Error(
          `Duplicate plan step id: ${step.id}`
        );
      }

      ids.add(step.id);
    }

    for (const step of plan.steps) {
      for (
        const dependency of
          step.dependencies
      ) {
        if (!ids.has(dependency)) {
          throw new Error(
            `Unknown dependency ${dependency} for step ${step.id}.`
          );
        }

        if (
          dependency === step.id
        ) {
          throw new Error(
            `Step ${step.id} cannot depend on itself.`
          );
        }
      }
    }
  }

  private ensureDependencies(
    step: SovereignMasterPlanStep,
    completed: Set<string>
  ): void {
    for (
      const dependency of
        step.dependencies
    ) {
      if (
        !completed.has(
          dependency
        )
      ) {
        throw new Error(
          `Dependency ${dependency} is incomplete for step ${step.id}.`
        );
      }
    }
  }

  private async transition(
    run: SovereignMasterRun,
    stage: SovereignMasterStage
  ): Promise<void> {
    run.stage = stage;

    if (
      this.adapter.recordEvent
    ) {
      await this.adapter.recordEvent({
        type:
          `SOVEREIGN_AI_${stage}`,
        runId: run.id,
        commandId:
          run.commandId,
        stage,
        timestamp:
          Date.now()
      });
    }

    if (
      this.adapter.persistRun
    ) {
      await this.adapter.persistRun(
        this.cloneRun(run)
      );
    }
  }

  private async finish(
    run: SovereignMasterRun
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter.recordEvent({
        type:
          `SOVEREIGN_AI_RUN_${run.stage}`,
        runId: run.id,
        commandId:
          run.commandId,
        stage:
          run.stage,
        timestamp:
          Date.now(),
        data: {
          error: run.error,
          completedAt:
            run.completedAt,
          successfulSteps:
            run.results.filter(
              item => item.success
            ).length,
          failedSteps:
            run.results.filter(
              item => !item.success
            ).length
        }
      });
    }

    if (
      this.adapter.persistRun
    ) {
      await this.adapter.persistRun(
        this.cloneRun(run)
      );
    }
  }

  private normalizePriority(
    value: number
  ): number {
    if (
      !Number.isFinite(value)
    ) {
      return 50;
    }

    return Math.max(
      0,
      Math.min(
        100,
        Math.floor(value)
      )
    );
  }

  private cloneRun(
    run: SovereignMasterRun
  ): SovereignMasterRun {
    return {
      ...run,

      context:
        run.context
          ? {
              ...run.context,
              metadata: {
                ...run.context.metadata
              }
            }
          : undefined,

      knowledge:
        run.knowledge.map(
          item => ({ ...item })
        ),

      plan:
        run.plan
          ? {
              ...run.plan,
              steps:
                run.plan.steps.map(
                  step => ({
                    ...step,
                    dependencies: [
                      ...step.dependencies
                    ]
                  })
                )
            }
          : undefined,

      decision:
        run.decision
          ? {
              ...run.decision,
              constraints: [
                ...run.decision
                  .constraints
              ]
            }
          : undefined,

      assurance:
        run.assurance
          ? {
              ...run.assurance,
              constraints: [
                ...run.assurance
                  .constraints
              ]
            }
          : undefined,

      permit:
        run.permit
          ? {
              ...run.permit,
              constraints: [
                ...run.permit
                  .constraints
              ]
            }
          : undefined,

      results:
        run.results.map(
          result => ({
            ...result
          })
        )
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

export default SovereignAIMasterIntegration;

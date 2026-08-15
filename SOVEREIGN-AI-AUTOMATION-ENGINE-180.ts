// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-AUTOMATION-ENGINE-180.ts
// Sovereign Autonomous Automation Engine
// ============================================================

export type SovereignAutomationStatus =
  | "IDLE"
  | "RUNNING"
  | "PAUSED"
  | "FAILED"
  | "STOPPED";

export type SovereignAutomationTriggerType =
  | "EVENT"
  | "SCHEDULE"
  | "CONDITION"
  | "MANUAL"
  | "SYSTEM";

export type SovereignAutomationJobStatus =
  | "PENDING"
  | "QUEUED"
  | "RUNNING"
  | "RETRYING"
  | "COMPLETED"
  | "FAILED"
  | "BLOCKED";

export interface SovereignAutomationTrigger {
  id: string;

  type: SovereignAutomationTriggerType;

  event?: string;

  schedule?: string;

  condition?: string;

  enabled: boolean;

  metadata?: Record<string, unknown>;
}

export interface SovereignAutomationWorkflow {
  id: string;

  name: string;

  description?: string;

  trigger: SovereignAutomationTrigger;

  steps: SovereignAutomationStep[];

  enabled: boolean;

  createdAt: number;

  updatedAt: number;
}

export interface SovereignAutomationStep {
  id: string;

  capability: string;

  action: string;

  input?: Record<string, unknown>;

  dependsOn?: string[];

  maxAttempts?: number;

  timeoutMs?: number;

  required: boolean;
}

export interface SovereignAutomationJob {
  id: string;

  workflowId: string;

  triggerId: string;

  status: SovereignAutomationJobStatus;

  currentStep?: string;

  attempts: number;

  context: Record<string, unknown>;

  createdAt: number;

  startedAt?: number;

  completedAt?: number;

  error?: string;
}

export interface SovereignAutomationExecution {
  workflowId: string;

  jobId: string;

  stepId: string;

  capability: string;

  action: string;

  input?: Record<string, unknown>;

  context: Record<string, unknown>;
}

export interface SovereignAutomationAdapter {
  execute(
    execution: SovereignAutomationExecution
  ): Promise<unknown>;

  verify?(
    execution: SovereignAutomationExecution,
    result: unknown
  ): Promise<boolean>;

  persistWorkflow?(
    workflow: SovereignAutomationWorkflow
  ): Promise<void>;

  persistJob?(
    job: SovereignAutomationJob
  ): Promise<void>;

  recordEvent?(event: {
    type: string;
    workflowId?: string;
    jobId?: string;
    stepId?: string;
    timestamp: number;
    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIAutomationEngine {
  private status: SovereignAutomationStatus =
    "IDLE";

  private readonly workflows =
    new Map<string, SovereignAutomationWorkflow>();

  private readonly jobs =
    new Map<string, SovereignAutomationJob>();

  constructor(
    private readonly adapter: SovereignAutomationAdapter
  ) {}

  public getStatus(): SovereignAutomationStatus {
    return this.status;
  }

  public async registerWorkflow(
    workflow: SovereignAutomationWorkflow
  ): Promise<void> {
    this.validateWorkflow(workflow);

    this.workflows.set(
      workflow.id,
      {
        ...workflow,
        updatedAt: Date.now()
      }
    );

    if (this.adapter.persistWorkflow) {
      await this.adapter.persistWorkflow(
        workflow
      );
    }

    await this.record(
      "WORKFLOW_REGISTERED",
      workflow.id
    );
  }

  public async triggerEvent(
    event: string,
    context: Record<string, unknown> = {}
  ): Promise<SovereignAutomationJob[]> {
    if (!event.trim()) {
      throw new Error(
        "Automation event is required."
      );
    }

    const matched =
      [...this.workflows.values()]
        .filter(workflow =>
          workflow.enabled &&
          workflow.trigger.enabled &&
          workflow.trigger.type === "EVENT" &&
          workflow.trigger.event === event
        );

    const jobs:
      SovereignAutomationJob[] = [];

    for (const workflow of matched) {
      const job =
        await this.createJob(
          workflow,
          context
        );

      jobs.push(job);

      await this.runJob(job.id);
    }

    return jobs;
  }

  public async triggerWorkflow(
    workflowId: string,
    context: Record<string, unknown> = {}
  ): Promise<SovereignAutomationJob> {
    const workflow =
      this.getWorkflow(workflowId);

    if (!workflow.enabled) {
      throw new Error(
        `Automation workflow disabled: ${workflowId}`
      );
    }

    const job =
      await this.createJob(
        workflow,
        context
      );

    await this.runJob(job.id);

    return this.getJob(job.id);
  }

  public async runJob(
    jobId: string
  ): Promise<SovereignAutomationJob> {
    const job =
      this.getMutableJob(jobId);

    const workflow =
      this.getWorkflow(
        job.workflowId
      );

    this.status = "RUNNING";

    job.status = "RUNNING";
    job.startedAt = Date.now();

    await this.persistJob(job);

    const completedSteps =
      new Set<string>();

    try {
      while (
        completedSteps.size <
        workflow.steps.length
      ) {
        const ready =
          workflow.steps.filter(step => {
            if (
              completedSteps.has(step.id)
            ) {
              return false;
            }

            const dependencies =
              step.dependsOn || [];

            return dependencies.every(
              dependency =>
                completedSteps.has(
                  dependency
                )
            );
          });

        if (!ready.length) {
          job.status = "BLOCKED";
          job.error =
            "Automation dependency deadlock detected.";

          await this.persistJob(job);

          this.status = "FAILED";

          return this.getJob(job.id);
        }

        for (const step of ready) {
          const success =
            await this.runStep(
              workflow,
              job,
              step
            );

          if (!success) {
            if (step.required) {
              job.status = "FAILED";
              job.completedAt =
                Date.now();

              await this.persistJob(
                job
              );

              this.status = "FAILED";

              return this.getJob(
                job.id
              );
            }

            completedSteps.add(
              step.id
            );

            continue;
          }

          completedSteps.add(
            step.id
          );
        }
      }

      job.status = "COMPLETED";
      job.completedAt = Date.now();

      await this.persistJob(job);

      await this.record(
        "AUTOMATION_COMPLETED",
        workflow.id,
        job.id
      );

      this.status = "IDLE";

      return this.getJob(job.id);
    } catch (error) {
      job.status = "FAILED";

      job.error =
        error instanceof Error
          ? error.message
          : String(error);

      job.completedAt = Date.now();

      await this.persistJob(job);

      await this.record(
        "AUTOMATION_FAILED",
        workflow.id,
        job.id,
        undefined,
        {
          error: job.error
        }
      );

      this.status = "FAILED";

      return this.getJob(job.id);
    }
  }

  private async runStep(
    workflow: SovereignAutomationWorkflow,
    job: SovereignAutomationJob,
    step: SovereignAutomationStep
  ): Promise<boolean> {
    const maxAttempts =
      step.maxAttempts || 3;

    let attempt = 0;

    while (
      attempt < maxAttempts
    ) {
      attempt += 1;

      job.currentStep =
        step.id;

      job.attempts += 1;

      await this.persistJob(job);

      const execution:
        SovereignAutomationExecution = {
          workflowId:
            workflow.id,

          jobId:
            job.id,

          stepId:
            step.id,

          capability:
            step.capability,

          action:
            step.action,

          input:
            step.input,

          context:
            job.context
        };

      try {
        await this.record(
          "AUTOMATION_STEP_STARTED",
          workflow.id,
          job.id,
          step.id
        );

        const result =
          await this.withTimeout(
            this.adapter.execute(
              execution
            ),
            step.timeoutMs ||
              60_000
          );

        if (
          this.adapter.verify
        ) {
          const verified =
            await this.adapter.verify(
              execution,
              result
            );

          if (!verified) {
            throw new Error(
              `Automation verification failed: ${step.id}`
            );
          }
        }

        job.context[
          `result:${step.id}`
        ] = result;

        await this.record(
          "AUTOMATION_STEP_COMPLETED",
          workflow.id,
          job.id,
          step.id
        );

        return true;
      } catch (error) {
        job.error =
          error instanceof Error
            ? error.message
            : String(error);

        if (
          attempt <
          maxAttempts
        ) {
          job.status =
            "RETRYING";

          await this.persistJob(
            job
          );

          await this.delay(
            this.retryDelay(
              attempt
            )
          );

          job.status =
            "RUNNING";

          continue;
        }

        await this.record(
          "AUTOMATION_STEP_FAILED",
          workflow.id,
          job.id,
          step.id,
          {
            error:
              job.error
          }
        );

        return false;
      }
    }

    return false;
  }

  private async createJob(
    workflow: SovereignAutomationWorkflow,
    context: Record<string, unknown>
  ): Promise<SovereignAutomationJob> {
    const job:
      SovereignAutomationJob = {
        id: this.createId(
          "automation-job"
        ),

        workflowId:
          workflow.id,

        triggerId:
          workflow.trigger.id,

        status:
          "QUEUED",

        attempts: 0,

        context: {
          ...context
        },

        createdAt:
          Date.now()
      };

    this.jobs.set(
      job.id,
      job
    );

    await this.persistJob(
      job
    );

    await this.record(
      "AUTOMATION_QUEUED",
      workflow.id,
      job.id
    );

    return {
      ...job,
      context: {
        ...job.context
      }
    };
  }

  private validateWorkflow(
    workflow: SovereignAutomationWorkflow
  ): void {
    if (!workflow.id.trim()) {
      throw new Error(
        "Workflow id is required."
      );
    }

    if (!workflow.name.trim()) {
      throw new Error(
        "Workflow name is required."
      );
    }

    if (!workflow.steps.length) {
      throw new Error(
        "Workflow requires at least one step."
      );
    }

    const ids =
      new Set(
        workflow.steps.map(
          step => step.id
        )
      );

    if (
      ids.size !==
      workflow.steps.length
    ) {
      throw new Error(
        "Duplicate automation step ids detected."
      );
    }

    for (
      const step of workflow.steps
    ) {
      for (
        const dependency of
          step.dependsOn || []
      ) {
        if (
          !ids.has(dependency)
        ) {
          throw new Error(
            `Unknown automation dependency: ${dependency}`
          );
        }
      }
    }
  }

  private getWorkflow(
    id: string
  ): SovereignAutomationWorkflow {
    const workflow =
      this.workflows.get(id);

    if (!workflow) {
      throw new Error(
        `Automation workflow not found: ${id}`
      );
    }

    return workflow;
  }

  private getMutableJob(
    id: string
  ): SovereignAutomationJob {
    const job =
      this.jobs.get(id);

    if (!job)

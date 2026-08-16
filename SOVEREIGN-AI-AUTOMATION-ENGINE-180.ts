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
    new Map<
      string,
      SovereignAutomationWorkflow
    >();

  private readonly jobs =
    new Map<
      string,
      SovereignAutomationJob
    >();

  constructor(
    private readonly adapter:
      SovereignAutomationAdapter
  ) {}

  public getStatus():
    SovereignAutomationStatus {
    return this.status;
  }

  public getWorkflowCount(): number {
    return this.workflows.size;
  }

  public getJobCount(): number {
    return this.jobs.size;
  }

  public async registerWorkflow(
    workflow: SovereignAutomationWorkflow
  ): Promise<void> {
    this.validateWorkflow(workflow);

    const normalized =
      this.cloneWorkflow({
        ...workflow,
        updatedAt: Date.now()
      });

    this.workflows.set(
      normalized.id,
      normalized
    );

    if (
      this.adapter.persistWorkflow
    ) {
      await this.adapter.persistWorkflow(
        this.cloneWorkflow(
          normalized
        )
      );
    }

    await this.record(
      "WORKFLOW_REGISTERED",
      normalized.id
    );
  }

  public async removeWorkflow(
    workflowId: string
  ): Promise<boolean> {
    const removed =
      this.workflows.delete(
        workflowId
      );

    if (removed) {
      await this.record(
        "WORKFLOW_REMOVED",
        workflowId
      );
    }

    return removed;
  }

  public getWorkflow(
    id: string
  ): SovereignAutomationWorkflow {
    const workflow =
      this.workflows.get(id);

    if (!workflow) {
      throw new Error(
        `Automation workflow not found: ${id}`
      );
    }

    return this.cloneWorkflow(
      workflow
    );
  }

  public listWorkflows():
    SovereignAutomationWorkflow[] {
    return [
      ...this.workflows.values()
    ].map(
      workflow =>
        this.cloneWorkflow(
          workflow
        )
    );
  }

  public getJob(
    id: string
  ): SovereignAutomationJob {
    const job =
      this.jobs.get(id);

    if (!job) {
      throw new Error(
        `Automation job not found: ${id}`
      );
    }

    return this.cloneJob(job);
  }

  public listJobs():
    SovereignAutomationJob[] {
    return [
      ...this.jobs.values()
    ].map(
      job =>
        this.cloneJob(job)
    );
  }

  public pause(): void {
    if (
      this.status === "RUNNING" ||
      this.status === "IDLE"
    ) {
      this.status = "PAUSED";
    }
  }

  public resume(): void {
    if (
      this.status === "PAUSED"
    ) {
      this.status = "IDLE";
    }
  }

  public stop(): void {
    this.status = "STOPPED";
  }

  public async triggerEvent(
    event: string,
    context:
      Record<string, unknown> = {}
  ): Promise<
    SovereignAutomationJob[]
  > {
    if (!event.trim()) {
      throw new Error(
        "Automation event is required."
      );
    }

    this.assertOperational();

    const matched =
      [
        ...this.workflows.values()
      ].filter(
        workflow =>
          workflow.enabled &&
          workflow.trigger.enabled &&
          workflow.trigger.type ===
            "EVENT" &&
          workflow.trigger.event ===
            event
      );

    const jobs:
      SovereignAutomationJob[] =
      [];

    for (
      const workflow of matched
    ) {
      const job =
        await this.createJob(
          workflow,
          context
        );

      await this.runJob(
        job.id
      );

      jobs.push(
        this.getJob(
          job.id
        )
      );
    }

    return jobs;
  }

  public async triggerWorkflow(
    workflowId: string,
    context:
      Record<string, unknown> = {}
  ): Promise<SovereignAutomationJob> {
    this.assertOperational();

    const workflow =
      this.getMutableWorkflow(
        workflowId
      );

    if (!workflow.enabled) {
      throw new Error(
        `Automation workflow disabled: ${workflowId}`
      );
    }

    if (
      !workflow.trigger.enabled
    ) {
      throw new Error(
        `Automation workflow trigger disabled: ${workflowId}`
      );
    }

    const job =
      await this.createJob(
        workflow,
        context
      );

    await this.runJob(
      job.id
    );

    return this.getJob(
      job.id
    );
  }

  public async runJob(
    jobId: string
  ): Promise<SovereignAutomationJob> {
    this.assertOperational();

    const job =
      this.getMutableJob(
        jobId
      );

    const workflow =
      this.getMutableWorkflow(
        job.workflowId
      );

    this.status = "RUNNING";

    job.status = "RUNNING";

    if (!job.startedAt) {
      job.startedAt =
        Date.now();
    }

    job.error = undefined;

    await this.persistJob(
      job
    );

    const completedSteps =
      new Set<string>();

    try {
      while (
        completedSteps.size <
        workflow.steps.length
      ) {
        const ready =
          workflow.steps.filter(
            step => {
              if (
                completedSteps.has(
                  step.id
                )
              ) {
                return false;
              }

              const dependencies =
                step.dependsOn ??
                [];

              return dependencies.every(
                dependency =>
                  completedSteps.has(
                    dependency
                  )
              );
            }
          );

        if (
          ready.length === 0
        ) {
          job.status =
            "BLOCKED";

          job.error =
            "Automation dependency deadlock detected.";

          job.completedAt =
            Date.now();

          await this.persistJob(
            job
          );

          await this.record(
            "AUTOMATION_BLOCKED",
            workflow.id,
            job.id,
            undefined,
            {
              error:
                job.error
            }
          );

          this.status =
            "FAILED";

          return this.cloneJob(
            job
          );
        }

        for (
          const step of ready
        ) {
          const success =
            await this.runStep(
              workflow,
              job,
              step
            );

          if (!success) {
            if (step.required) {
              job.status =
                "FAILED";

              job.completedAt =
                Date.now();

              await this.persistJob(
                job
              );

              await this.record(
                "AUTOMATION_FAILED",
                workflow.id,
                job.id,
                step.id,
                {
                  error:
                    job.error
                }
              );

              this.status =
                "FAILED";

              return this.cloneJob(
                job
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

      job.status =
        "COMPLETED";

      job.currentStep =
        undefined;

      job.completedAt =
        Date.now();

      await this.persistJob(
        job
      );

      await this.record(
        "AUTOMATION_COMPLETED",
        workflow.id,
        job.id
      );

      this.status =
        "IDLE";

      return this.cloneJob(
        job
      );
    } catch (error) {
      job.status =
        "FAILED";

      job.error =
        error instanceof Error
          ? error.message
          : String(error);

      job.completedAt =
        Date.now();

      await this.persistJob(
        job
      );

      await this.record(
        "AUTOMATION_FAILED",
        workflow.id,
        job.id,
        undefined,
        {
          error:
            job.error
        }
      );

      this.status =
        "FAILED";

      return this.cloneJob(
        job
      );
    }
  }

  private async runStep(
    workflow:
      SovereignAutomationWorkflow,
    job:
      SovereignAutomationJob,
    step:
      SovereignAutomationStep
  ): Promise<boolean> {
    const maxAttempts =
      this.normalizeAttempts(
        step.maxAttempts
      );

    let attempt = 0;

    while (
      attempt < maxAttempts
    ) {
      attempt += 1;

      job.currentStep =
        step.id;

      job.attempts += 1;

      job.status =
        attempt > 1
          ? "RETRYING"
          : "RUNNING";

      await this.persistJob(
        job
      );

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
            step.input
              ? {
                  ...step.input
                }
              : undefined,

          context: {
            ...job.context
          }
        };

      try {
        await this.record(
          "AUTOMATION_STEP_STARTED",
          workflow.id,
          job.id,
          step.id,
          {
            attempt
          }
        );

        const result =
          await this.withTimeout(
            this.adapter.execute(
              execution
            ),
            this.normalizeTimeout(
              step.timeoutMs
            )
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

        job.error =
          undefined;

        job.status =
          "RUNNING";

        await this.persistJob(
          job
        );

        await this.record(
          "AUTOMATION_STEP_COMPLETED",
          workflow.id,
          job.id,
          step.id,
          {
            attempt
          }
        );

        return true;
      } catch (error) {
        job.error =
          error instanceof Error
            ? error.message
            : String(error);

        await this.record(
          "AUTOMATION_STEP_ATTEMPT_FAILED",
          workflow.id,
          job.id,
          step.id,
          {
            attempt,
            maxAttempts,
            error:
              job.error
          }
        );

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
              job.error,
            attempts:
              attempt
          }
        );

        return false;
      }
    }

    return false;
  }

  private async createJob(
    workflow:
      SovereignAutomationWorkflow,
    context:
      Record<string, unknown>
  ): Promise<SovereignAutomationJob> {
    const job:
      SovereignAutomationJob = {
        id:
          this.createId(
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

    return this.cloneJob(
      job
    );
  }

  private validateWorkflow(
    workflow:
      SovereignAutomationWorkflow
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

    if (
      !workflow.trigger.id.trim()
    ) {
      throw new Error(
        "Workflow trigger id is required."
      );
    }

    if (
      workflow.steps.length === 0
    ) {
      throw new Error(
        "Workflow requires at least one step."
      );
    }

    const ids =
      new Set(
        workflow.steps.map(
          step =>
            step.id
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
      const step of
        workflow.steps
    ) {
      if (!step.id.trim()) {
        throw new Error(
          "Automation step id is required."
        );
      }

      if (
        !step.capability.trim()
      ) {
        throw new Error(
          `Automation capability is required: ${step.id}`
        );
      }

      if (
        !step.action.trim()
      ) {
        throw new Error(
          `Automation action is required: ${step.id}`
        );
      }

      if (
        step.dependsOn?.includes(
          step.id
        )
      ) {
        throw new Error(
          `Automation step cannot depend on itself: ${step.id}`
        );
      }

      for (
        const dependency of
          step.dependsOn ?? []
      ) {
        if (
          !ids.has(
            dependency
          )
        ) {
          throw new Error(
            `Unknown automation dependency: ${dependency}`
          );
        }
      }
    }

    this.validateDependencyGraph(
      workflow.steps
    );
  }

  private validateDependencyGraph(
    steps:
      SovereignAutomationStep[]
  ): void {
    const visiting =
      new Set<string>();

    const visited =
      new Set<string>();

    const byId =
      new Map(
        steps.map(
          step => [
            step.id,
            step
          ]
        )
      );

    const visit =
      (stepId: string): void => {
        if (
          visited.has(
            stepId
          )
        ) {
          return;
        }

        if (
          visiting.has(
            stepId
          )
        ) {
          throw new Error(
            `Automation dependency cycle detected at step: ${stepId}`
          );
        }

        visiting.add(
          stepId
        );

        const step =
          byId.get(
            stepId
          );

        if (step) {
          for (
            const dependency of
              step.dependsOn ?? []
          ) {
            visit(
              dependency
            );
          }
        }

        visiting.delete(
          stepId
        );

        visited.add(
          stepId
        );
      };

    for (
      const step of steps
    ) {
      visit(
        step.id
      );
    }
  }

  private getMutableWorkflow(
    id: string
  ): SovereignAutomationWorkflow {
    const workflow =
      this.workflows.get(
        id
      );

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
      this.jobs.get(
        id
      );

    if (!job) {
      throw new Error(
        `Automation job not found: ${id}`
      );
    }

    return job;
  }

  private assertOperational():
    void {
    if (
      this.status ===
      "PAUSED"
    ) {
      throw new Error(
        "Automation engine is paused."
      );
    }

    if (
      this.status ===
      "STOPPED"
    ) {
      throw new Error(
        "Automation engine is stopped."
      );
    }
  }

  private async persistJob(
    job:
      SovereignAutomationJob
  ): Promise<void> {
    this.jobs.set(
      job.id,
      job
    );

    if (
      this.adapter.persistJob
    ) {
      await this.adapter.persistJob(
        this.cloneJob(
          job
        )
      );
    }
  }

  private async record(
    type: string,
    workflowId?: string,
    jobId?: string,
    stepId?: string,
    data?: Record<
      string,
      unknown
    >
  ): Promise<void> {
    if (
      !this.adapter.recordEvent
    ) {
      return;
    }

    await this.adapter.recordEvent({
      type,
      workflowId,
      jobId,
      stepId,
      timestamp:
        Date.now(),
      data
    });
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    let timer:
      ReturnType<
        typeof setTimeout
      >
      | undefined;

    const timeout =
      new Promise<never>(
        (_, reject) => {
          timer =
            setTimeout(
              () => {
                reject(
                  new Error(
                    `Automation execution timed out after ${timeoutMs}ms.`
                  )
                );
              },
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

  private retryDelay(
    attempt: number
  ): number {
    const safeAttempt =
      Math.max(
        1,
        Math.floor(
          attempt
        )
      );

    return Math.min(
      30_000,
      500 *
        2 **
          (safeAttempt - 1)
    );
  }

  private delay(
    milliseconds: number
  ): Promise<void> {
    return new Promise(
      resolve => {
        setTimeout(
          resolve,
          milliseconds
        );
      }
    );
  }

  private normalizeAttempts(
    attempts?: number
  ): number {
    if (
      attempts === undefined ||
      !Number.isFinite(
        attempts
      )
    ) {
      return 3;
    }

    return Math.max(
      1,
      Math.floor(
        attempts
      )
    );
  }

  private normalizeTimeout(
    timeoutMs?: number
  ): number {
    if (
      timeoutMs === undefined ||
      !Number.isFinite(
        timeoutMs
      )
    ) {
      return 60_000;
    }

    return Math.max(
      1,
      Math.floor(
        timeoutMs
      )
    );
  }

  private cloneWorkflow(
    workflow:
      SovereignAutomationWorkflow
  ): SovereignAutomationWorkflow {
    return {
      ...workflow,

      trigger: {
        ...workflow.trigger,

        metadata:
          workflow.trigger
            .metadata
            ? {
                ...workflow.trigger
                  .metadata
              }
            : undefined
      },

      steps:
        workflow.steps.map(
          step => ({
            ...step,

            input:
              step.input
                ? {
                    ...step.input
                  }
                : undefined,

            dependsOn:
              step.dependsOn
                ? [
                    ...step.dependsOn
                  ]
                : undefined
          })
        )
    };
  }

  private cloneJob(
    job:
      SovereignAutomationJob
  ): SovereignAutomationJob {
    return {
      ...job,

      context: {
        ...job.context
      }
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

export default SovereignAIAutomationEngine

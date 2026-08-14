/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-PIPELINE-58
 * ============================================================
 *
 * Sovereign Pipeline Engine.
 *
 * Responsibilities:
 * - Coordinate multiple sovereign workflows.
 * - Execute pipeline stages in controlled order.
 * - Enforce stage dependencies.
 * - Track pipeline lifecycle and progress.
 * - Support required and optional stages.
 * - Stop execution on required-stage failure.
 * - Support controlled cancellation.
 * - Preserve correlation and causation chains.
 *
 * PIPELINE ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignPipelinePriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type SovereignPipelineStatus =
  | "CREATED"
  | "READY"
  | "RUNNING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export type SovereignPipelineStageStatus =
  | "PENDING"
  | "READY"
  | "RUNNING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export interface SovereignPipelineStage {
  id: string;

  workflowId: string;

  order: number;

  required: boolean;

  dependencies: string[];

  status: SovereignPipelineStageStatus;

  startedAt?: string;

  completedAt?: string;

  error?: string;
}

export interface SovereignPipeline {
  id: string;

  name: string;

  type: string;

  source: string;

  priority: SovereignPipelinePriority;

  status: SovereignPipelineStatus;

  stages: SovereignPipelineStage[];

  requestedBy: string;

  correlationId?: string;

  causationId?: string;

  idempotencyKey?: string;

  createdAt: string;

  startedAt?: string;

  completedAt?: string;

  cancelledAt?: string;

  progress: number;

  error?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignPipelineContext {
  actorId: string;

  authority:
    | "OWNER"
    | "STEWARD"
    | "CORE"
    | "SYSTEM";

  authenticated: boolean;

  policyChecked: boolean;

  securityChecked: boolean;

  authorizationChecked: boolean;

  permissions: string[];

  metadata?: Record<string, unknown>;
}

export interface SovereignPipelineStore {
  savePipeline(
    pipeline: SovereignPipeline
  ): Promise<void>;

  getPipeline(
    pipelineId: string
  ): Promise<SovereignPipeline | undefined>;

  listPipelines(
    limit?: number
  ): Promise<SovereignPipeline[]>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignPipeline | undefined>;
}

export interface SovereignPipelineWorkflowBridge {
  getWorkflowStatus(
    workflowId: string
  ): Promise<
    | "CREATED"
    | "READY"
    | "BLOCKED"
    | "RUNNING"
    | "COMPLETED"
    | "PARTIAL"
    | "FAILED"
    | "CANCELLED"
  >;

  runWorkflow(
    workflowId: string
  ): Promise<{
    success: boolean;

    status:
      | "COMPLETED"
      | "PARTIAL"
      | "FAILED";

    reason?: string;
  }>;

  cancelWorkflow?(
    workflowId: string
  ): Promise<{
    success: boolean;

    reason?: string;
  }>;
}

export interface SovereignPipelinePolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignPipelineContext["authority"];

    operation:
      | "CREATE_PIPELINE"
      | "RUN_PIPELINE"
      | "CANCEL_PIPELINE"
      | "READ_PIPELINE";

    pipelineId?: string;

    pipelineType?: string;

    priority?: SovereignPipelinePriority;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

export interface SovereignPipelineEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    pipelineId?: string;

    stageId?: string;

    workflowId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignPipelineAudit {
  record(
    operation: string,
    subjectId: string | undefined,
    result:
      | "SUCCESS"
      | "FAILED"
      | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

export class SovereignPipelineEngine {
  public readonly id =
    "SOVEREIGN-PIPELINE-58";

  public readonly version =
    "1.0.0";

  private store?: SovereignPipelineStore;

  private workflowBridge?: SovereignPipelineWorkflowBridge;

  private policyBridge?: SovereignPipelinePolicyBridge;

  private eventBridge?: SovereignPipelineEventBridge;

  private audit?: SovereignPipelineAudit;

  private runningPipelines =
    new Set<string>();

  setStore(
    store: SovereignPipelineStore
  ): void {
    this.store = store;
  }

  setWorkflowBridge(
    bridge: SovereignPipelineWorkflowBridge
  ): void {
    this.workflowBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignPipelinePolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignPipelineEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignPipelineAudit
  ): void {
    this.audit = audit;
  }

  async createPipeline(
    input: {
      id?: string;

      name: string;

      type: string;

      source: string;

      stages: Array<{
        id?: string;

        workflowId: string;

        required?: boolean;

        dependencies?: string[];
      }>;

      priority?: SovereignPipelinePriority;

      correlationId?: string;

      causationId?: string;

      idempotencyKey?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignPipelineContext
  ): Promise<SovereignPipeline> {
    this.requireContext(context);

    if (!input.name.trim()) {
      throw new Error(
        "Pipeline name is required."
      );
    }

    if (!input.type.trim()) {
      throw new Error(
        "Pipeline type is required."
      );
    }

    if (!input.source.trim()) {
      throw new Error(
        "Pipeline source is required."
      );
    }

    if (input.stages.length === 0) {
      throw new Error(
        "Pipeline requires at least one stage."
      );
    }

    const pipelineId =
      input.id ??
      this.createId("PIPELINE");

    const priority =
      input.priority ??
      "NORMAL";

    await this.requireAuthorized(
      context,
      "CREATE_PIPELINE",
      pipelineId,
      input.type,
      priority
    );

    if (
      input.idempotencyKey &&
      this.requireStore()
        .findByIdempotencyKey
    ) {
      const existing =
        await this.requireStore()
          .findByIdempotencyKey!(
            input.idempotencyKey
          );

      if (existing) {
        return existing;
      }
    }

    const stages:
      SovereignPipelineStage[] =
      input.stages.map(
        (stage, index) => ({
          id:
            stage.id ??
            `STAGE-${index + 1}`,

          workflowId:
            stage.workflowId,

          order:
            index,

          required:
            stage.required !== false,

          dependencies:
            [
              ...new Set(
                stage.dependencies ?? []
              ),
            ],

          status:
            "PENDING",
        })
      );

    this.validateStages(stages);

    const pipeline:
      SovereignPipeline = {
      id:
        pipelineId,

      name:
        input.name,

      type:
        input.type,

      source:
        input.source,

      priority,

      status:
        "READY",

      stages,

      requestedBy:
        context.actorId,

      correlationId:
        input.correlationId,

      causationId:
        input.causationId,

      idempotencyKey:
        input.idempotencyKey,

      createdAt:
        this.now(),

      progress: 0,

      metadata:
        input.metadata,
    };

    await this.requireStore()
      .savePipeline(pipeline);

    await this.publishEvent(
      "pipeline.created",
      pipeline.id,
      undefined,
      undefined,
      {
        name:
          pipeline.name,

        stages:
          pipeline.stages.length,

        priority:
          pipeline.priority,
      }
    );

    await this.recordAudit(
      "pipeline.create",
      pipeline.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,
      }
    );

    return pipeline;
  }

  async run(
    pipelineId: string,
    context: SovereignPipelineContext
  ): Promise<SovereignPipeline> {
    this.requireContext(context);

    const pipeline =
      await this.requirePipeline(
        pipelineId
      );

    if (
      pipeline.status ===
      "COMPLETED"
    ) {
      return pipeline;
    }

    if (
      pipeline.status !==
        "READY" &&
      pipeline.status !==
        "PARTIAL"
    ) {
      throw new Error(
        `Pipeline cannot run from status: ${pipeline.status}`
      );
    }

    await this.requireAuthorized(
      context,
      "RUN_PIPELINE",
      pipeline.id,
      pipeline.type,
      pipeline.priority
    );

    if (
      this.runningPipelines.has(
        pipeline.id
      )
    ) {
      throw new Error(
        "Pipeline is already running."
      );
    }

    this.runningPipelines.add(
      pipeline.id
    );

    pipeline.status =
      "RUNNING";

    pipeline.startedAt =
      pipeline.startedAt ??
      this.now();

    await this.requireStore()
      .savePipeline(pipeline);

    await this.publishEvent(
      "pipeline.started",
      pipeline.id,
      undefined,
      undefined,
      {
        stages:
          pipeline.stages.length,
      }
    );

    try {
      const pending =
        new Set(
          pipeline.stages
            .filter(
              (stage) =>
                stage.status !==
                  "COMPLETED" &&
                stage.status !==
                  "PARTIAL"
            )
            .map(
              (stage) =>
                stage.id
            )
        );

      while (pending.size > 0) {
        let progressed = false;

        const ordered =
          [...pipeline.stages].sort(
            (a, b) =>
              a.order - b.order
          );

        for (
          const stage
          of ordered
        ) {
          if (!pending.has(stage.id)) {
            continue;
          }

          const ready =
            stage.dependencies.every(
              (dependencyId) => {
                const dependency =
                  pipeline.stages.find(
                    (item) =>
                      item.id ===
                      dependencyId
                  );

                return (
                  dependency?.status ===
                    "COMPLETED" ||
                  dependency?.status ===
                    "PARTIAL"
                );
              }
            );

          if (!ready) {
            continue;
          }

          progressed = true;

          stage.status =
            "RUNNING";

          stage.startedAt =
            this.now();

          await this.requireStore()
            .savePipeline(
              pipeline
            );

          await this.publishEvent(
            "pipeline.stage.started",
            pipeline.id,
            stage.id,
            stage.workflowId,
            {}
          );

          const currentStatus =
            await this
              .requireWorkflowBridge()
              .getWorkflowStatus(
                stage.workflowId
              );

          if (
            currentStatus ===
            "COMPLETED"
          ) {
            stage.status =
              "COMPLETED";
          } else if (
            currentStatus ===
            "FAILED" ||
            currentStatus ===
            "CANCELLED"
          ) {
            stage.status =
              currentStatus ===
                "FAILED"
                ? "FAILED"
                : "CANCELLED";

            stage.error =
              `Workflow is ${currentStatus}.`;
          } else {
            const result =
              await this
                .requireWorkflowBridge()
                .runWorkflow(
                  stage.workflowId
                );

            if (
              result.success &&
              result.status ===
                "COMPLETED"
            ) {
              stage.status =
                "COMPLETED";
            } else if (
              result.success &&
              result.status ===
                "PARTIAL"
            ) {
              stage.status =
                "PARTIAL";
            } else {
              stage.status =
                "FAILED";

              stage.error =
                result.reason ??
                "Pipeline workflow failed.";
            }
          }

          stage.completedAt =
            this.now();

          pending.delete(
            stage.id
          );

          this.updateProgress(
            pipeline
          );

          await this.requireStore()
            .savePipeline(
              pipeline
            );

          await this.publishEvent(
            stage.status ===
              "COMPLETED"
              ? "pipeline.stage.completed"
              : stage.status ===
                  "PARTIAL"
              ? "pipeline.stage.partial"
              : "pipeline.stage.failed",
            pipeline.id,
            stage.id,
            stage.workflowId,
            {
              error:
                stage.error,
            }
          );

          if (
            stage.required &&
            (
              stage.status ===
                "FAILED" ||
              stage.status ===
                "CANCELLED"
            )
          ) {
            pipeline.status =
              "FAILED";

            pipeline.error =
              `Required pipeline stage failed: ${stage.id}`;

            break;
          }
        }

        if (
          pipeline.status ===
          "FAILED"
        ) {
          break;
        }

        if (!progressed) {
          pipeline.status =
            "FAILED";

          pipeline.error =
            "Pipeline cannot progress because stage dependencies are unresolved.";

          break;
        }
      }

      this.updateProgress(
        pipeline
      );

      if (
        pipeline.status !==
        "FAILED"
      ) {
        const requiredFailed =
          pipeline.stages.some(
            (stage) =>
              stage.required &&
              (
                stage.status ===
                  "FAILED" ||
                stage.status ===
                  "CANCELLED"
              )
          );

        const allCompleted =
          pipeline.stages.every(
            (stage) =>
              stage.status ===
              "COMPLETED"
          );

        const requiredCompleted =
          pipeline.stages
            .filter(
              (stage) =>
                stage.required
            )
            .every(
              (stage) =>
                stage.status ===
                  "COMPLETED" ||
                stage.status ===
                  "PARTIAL"
            );

        if (requiredFailed) {
          pipeline.status =
            "FAILED";
        } else if (allCompleted) {
          pipeline.status =
            "COMPLETED";
        } else if (requiredCompleted) {
          pipeline.status =
            "PARTIAL";
        } else {
          pipeline.status =
            "FAILED";
        }
      }

      pipeline.completedAt =
        this.now();

      await this.requireStore()
        .savePipeline(pipeline);

      await this.publishEvent(
        pipeline.status ===
          "COMPLETED"
          ? "pipeline.completed"
          : pipeline.status ===
              "PARTIAL"
          ? "pipeline.partial"
          : "pipeline.failed",
        pipeline.id,
        undefined,
        undefined,
        {
          progress:
            pipeline.progress,

          error:
            pipeline.error,
        }
      );

      await this.recordAudit(
        "pipeline.run",
        pipeline.id,
        pipeline.status ===
          "COMPLETED"
          ? "SUCCESS"
          : "FAILED",
        {
          actorId:
            context.actorId,

          status:
            pipeline.status,

          progress:
            pipeline.progress,
        }
      );

      return pipeline;
    } finally {
      this.runningPipelines.delete(
        pipeline.id
      );
    }
  }

  async cancel(
    pipelineId: string,
    context: SovereignPipelineContext
  ): Promise<SovereignPipeline> {
    this.requireContext(context);

    const pipeline =
      await this.requirePipeline(
        pipelineId
      );

    await this.requireAuthorized(
      context,
      "CANCEL_PIPELINE",
      pipeline.id,
      pipeline.type,
      pipeline.priority
    );

    if (
      pipeline.status ===
        "COMPLETED" ||
      pipeline.status ===
        "FAILED" ||
      pipeline.status ===
        "CANCELLED"
    ) {
      return pipeline;
    }

    for (
      const stage
      of pipeline.stages
    ) {
      if (
        stage.status ===
          "COMPLETED" ||
        stage.status ===
          "FAILED" ||
        stage.status ===
          "CANCELLED"
      ) {
        continue;
      }

      if (
        this.requireWorkflowBridge()
          .cancelWorkflow
      ) {
        const result =
          await this
            .requireWorkflowBridge()
            .cancelWorkflow!(
              stage.workflowId
            );

        if (!result.success) {
          throw new Error(
            result.reason ??
            `Unable to cancel workflow: ${stage.workflowId}`
          );
        }
      }

      stage.status =
        "CANCELLED";

      stage.completedAt =
        this.now();
    }

    pipeline.status =
      "CANCELLED";

    pipeline.cancelledAt =
      this.now();

    pipeline.completedAt =
      pipeline.cancelledAt;

    this.updateProgress(
      pipeline
    );

    await this.requireStore()
      .savePipeline(pipeline);

    await this.publishEvent(
      "pipeline.cancelled",
      pipeline.id,
      undefined,
      undefined,
      {
        actorId:
          context.actorId,
      }
    );

    await this.recordAudit(
      "pipeline.cancel",
      pipeline.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,
      }
    );

    return pipeline;
  }

  async getPipeline(
    pipelineId: string,
    context: SovereignPipelineContext
  ): Promise<SovereignPipeline> {
    this.requireContext(context);

    const pipeline =
      await this.requirePipeline(
        pipelineId
      );

    await this.requireAuthorized(
      context,
      "READ_PIPELINE",
      pipeline.id,
      pipeline.type,
      pipeline.priority
    );

    return pipeline;
  }

  async listPipelines(
    context: SovereignPipelineContext,
    limit = 100
  ): Promise<SovereignPipeline[]> {
    this.requireContext(context);

    await this.requireAuthorized(
      context,
      "READ_PIPELINE"
    );

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000
    ) {
      throw new Error(
        "Pipeline limit must be between 1 and 1000."
      );
    }

    return this.requireStore()
      .listPipelines(limit);
  }

  private validateStages(
    stages: SovereignPipelineStage[]
  ): void {
    const ids =
      new Set<string>();

    for (const stage of stages) {
      if (ids.has(stage.id)) {
        throw new Error(
          `Duplicate pipeline stage: ${stage.id}`
        );
      }

      ids.add(stage.id);
    }

    for (const stage of stages) {
      if (
        stage.dependencies.includes(
          stage.id
        )
      ) {
        throw new Error(
          `Pipeline stage cannot depend on itself: ${stage.id}`
        );
      }

      for (
        const dependency
        of stage.dependencies
      ) {
        if (!ids.has(dependency)) {
          throw new Error(
            `Unknown pipeline stage dependency: ${dependency}`
          );
        }
      }
    }

    this.assertNoCycles(
      stages
    );
  }

  pr

/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-PROCESS-59
 * ============================================================
 *
 * Sovereign Process Engine.
 *
 * Responsibilities:
 * - Create and manage sovereign processes.
 * - Coordinate one or more sovereign pipelines.
 * - Enforce process dependencies.
 * - Track lifecycle and progress.
 * - Support required and optional pipelines.
 * - Stop on required pipeline failure.
 * - Support controlled cancellation.
 * - Preserve correlation and causation chains.
 *
 * PROCESS ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignProcessPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type SovereignProcessStatus =
  | "CREATED"
  | "READY"
  | "RUNNING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export type SovereignProcessPipelineStatus =
  | "PENDING"
  | "READY"
  | "RUNNING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export interface SovereignProcessPipeline {
  pipelineId: string;

  order: number;

  required: boolean;

  dependencies: string[];

  status: SovereignProcessPipelineStatus;

  startedAt?: string;

  completedAt?: string;

  error?: string;
}

export interface SovereignProcess {
  id: string;

  name: string;

  type: string;

  source: string;

  priority: SovereignProcessPriority;

  status: SovereignProcessStatus;

  pipelines: SovereignProcessPipeline[];

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

export interface SovereignProcessContext {
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

export interface SovereignProcessStore {
  saveProcess(
    process: SovereignProcess
  ): Promise<void>;

  getProcess(
    processId: string
  ): Promise<SovereignProcess | undefined>;

  listProcesses(
    limit?: number
  ): Promise<SovereignProcess[]>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignProcess | undefined>;
}

export interface SovereignProcessPipelineBridge {
  getPipelineStatus(
    pipelineId: string
  ): Promise<
    | "CREATED"
    | "READY"
    | "RUNNING"
    | "COMPLETED"
    | "PARTIAL"
    | "FAILED"
    | "CANCELLED"
  >;

  runPipeline(
    pipelineId: string
  ): Promise<{
    success: boolean;

    status:
      | "COMPLETED"
      | "PARTIAL"
      | "FAILED";

    reason?: string;
  }>;

  cancelPipeline?(
    pipelineId: string
  ): Promise<{
    success: boolean;

    reason?: string;
  }>;
}

export interface SovereignProcessPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignProcessContext["authority"];

    operation:
      | "CREATE_PROCESS"
      | "RUN_PROCESS"
      | "CANCEL_PROCESS"
      | "READ_PROCESS";

    processId?: string;

    processType?: string;

    priority?: SovereignProcessPriority;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

export interface SovereignProcessEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    processId?: string;

    pipelineId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignProcessAudit {
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

export class SovereignProcessEngine {
  public readonly id =
    "SOVEREIGN-PROCESS-59";

  public readonly version =
    "1.0.0";

  private store?: SovereignProcessStore;

  private pipelineBridge?: SovereignProcessPipelineBridge;

  private policyBridge?: SovereignProcessPolicyBridge;

  private eventBridge?: SovereignProcessEventBridge;

  private audit?: SovereignProcessAudit;

  private runningProcesses =
    new Set<string>();

  setStore(
    store: SovereignProcessStore
  ): void {
    this.store = store;
  }

  setPipelineBridge(
    bridge: SovereignProcessPipelineBridge
  ): void {
    this.pipelineBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignProcessPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignProcessEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignProcessAudit
  ): void {
    this.audit = audit;
  }

  async createProcess(
    input: {
      id?: string;

      name: string;

      type: string;

      source: string;

      pipelines: Array<{
        pipelineId: string;

        required?: boolean;

        dependencies?: string[];
      }>;

      priority?: SovereignProcessPriority;

      correlationId?: string;

      causationId?: string;

      idempotencyKey?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignProcessContext
  ): Promise<SovereignProcess> {
    this.requireContext(context);

    if (!input.name.trim()) {
      throw new Error(
        "Process name is required."
      );
    }

    if (!input.type.trim()) {
      throw new Error(
        "Process type is required."
      );
    }

    if (!input.source.trim()) {
      throw new Error(
        "Process source is required."
      );
    }

    if (
      input.pipelines.length === 0
    ) {
      throw new Error(
        "Process requires at least one pipeline."
      );
    }

    const processId =
      input.id ??
      this.createId("PROCESS");

    const priority =
      input.priority ??
      "NORMAL";

    await this.requireAuthorized(
      context,
      "CREATE_PROCESS",
      processId,
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

    const seen =
      new Set<string>();

    const pipelines:
      SovereignProcessPipeline[] =
      input.pipelines.map(
        (item, index) => {
          if (
            seen.has(
              item.pipelineId
            )
          ) {
            throw new Error(
              `Duplicate process pipeline: ${item.pipelineId}`
            );
          }

          seen.add(
            item.pipelineId
          );

          return {
            pipelineId:
              item.pipelineId,

            order:
              index,

            required:
              item.required !== false,

            dependencies:
              [
                ...new Set(
                  item.dependencies ??
                    []
                ),
              ],

            status:
              "PENDING",
          };
        }
      );

    this.validatePipelines(
      pipelines
    );

    const process:
      SovereignProcess = {
      id:
        processId,

      name:
        input.name,

      type:
        input.type,

      source:
        input.source,

      priority,

      status:
        "READY",

      pipelines,

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
      .saveProcess(process);

    await this.publishEvent(
      "process.created",
      process.id,
      undefined,
      {
        name:
          process.name,

        type:
          process.type,

        pipelines:
          process.pipelines.length,

        priority:
          process.priority,
      }
    );

    await this.recordAudit(
      "process.create",
      process.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,
      }
    );

    return process;
  }

  async run(
    processId: string,
    context: SovereignProcessContext
  ): Promise<SovereignProcess> {
    this.requireContext(context);

    const process =
      await this.requireProcess(
        processId
      );

    if (
      process.status ===
      "COMPLETED"
    ) {
      return process;
    }

    if (
      process.status !== "READY" &&
      process.status !== "PARTIAL"
    ) {
      throw new Error(
        `Process cannot run from status: ${process.status}`
      );
    }

    await this.requireAuthorized(
      context,
      "RUN_PROCESS",
      process.id,
      process.type,
      process.priority
    );

    if (
      this.runningProcesses.has(
        process.id
      )
    ) {
      throw new Error(
        "Process is already running."
      );
    }

    this.runningProcesses.add(
      process.id
    );

    process.status =
      "RUNNING";

    process.startedAt =
      process.startedAt ??
      this.now();

    await this.requireStore()
      .saveProcess(process);

    await this.publishEvent(
      "process.started",
      process.id,
      undefined,
      {
        pipelineCount:
          process.pipelines.length,
      }
    );

    try {
      const pending =
        new Set(
          process.pipelines
            .filter(
              (pipeline) =>
                pipeline.status !==
                  "COMPLETED" &&
                pipeline.status !==
                  "PARTIAL"
            )
            .map(
              (pipeline) =>
                pipeline.pipelineId
            )
        );

      while (pending.size > 0) {
        let progressed = false;

        const ordered =
          [...process.pipelines].sort(
            (a, b) =>
              a.order - b.order
          );

        for (
          const processPipeline
          of ordered
        ) {
          if (
            !pending.has(
              processPipeline.pipelineId
            )
          ) {
            continue;
          }

          const dependenciesReady =
            processPipeline.dependencies
              .every(
                (dependencyId) => {
                  const dependency =
                    process.pipelines.find(
                      (pipeline) =>
                        pipeline.pipelineId ===
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

          if (!dependenciesReady) {
            continue;
          }

          progressed = true;

          processPipeline.status =
            "RUNNING";

          processPipeline.startedAt =
            this.now();

          await this.requireStore()
            .saveProcess(process);

          await this.publishEvent(
            "process.pipeline.started",
            process.id,
            processPipeline.pipelineId,
            {}
          );

          const currentStatus =
            await this
              .requirePipelineBridge()
              .getPipelineStatus(
                processPipeline.pipelineId
              );

          if (
            currentStatus ===
            "COMPLETED"
          ) {
            processPipeline.status =
              "COMPLETED";
          } else if (
            currentStatus ===
            "PARTIAL"
          ) {
            processPipeline.status =
              "PARTIAL";
          } else if (
            currentStatus ===
              "FAILED" ||
            currentStatus ===
              "CANCELLED"
          ) {
            processPipeline.status =
              currentStatus;

            processPipeline.error =
              `Pipeline entered ${currentStatus}.`;
          } else {
            const result =
              await this
                .requirePipelineBridge()
                .runPipeline(
                  processPipeline.pipelineId
                );

            if (
              result.success &&
              result.status ===
                "COMPLETED"
            ) {
              processPipeline.status =
                "COMPLETED";
            } else if (
              result.success &&
              result.status ===
                "PART

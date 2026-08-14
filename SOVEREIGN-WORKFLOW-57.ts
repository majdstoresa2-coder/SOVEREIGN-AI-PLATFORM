/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-WORKFLOW-57
 * ============================================================
 *
 * Sovereign Workflow Engine.
 *
 * Responsibilities:
 * - Define sovereign workflows.
 * - Coordinate multiple sovereign jobs.
 * - Enforce workflow dependencies.
 * - Track workflow lifecycle and progress.
 * - Support required and optional jobs.
 * - Support controlled cancellation.
 * - Preserve correlation and causation.
 * - Integrate with Job, Task, Scheduler and Event Bus.
 *
 * WORKFLOW ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignWorkflowPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type SovereignWorkflowStatus =
  | "CREATED"
  | "READY"
  | "BLOCKED"
  | "RUNNING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export type SovereignWorkflowJobStatus =
  | "PENDING"
  | "READY"
  | "RUNNING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export interface SovereignWorkflowJob {
  jobId: string;

  order: number;

  required: boolean;

  dependencies: string[];

  status: SovereignWorkflowJobStatus;

  startedAt?: string;

  completedAt?: string;

  error?: string;
}

export interface SovereignWorkflow {
  id: string;

  name: string;

  type: string;

  source: string;

  priority: SovereignWorkflowPriority;

  status: SovereignWorkflowStatus;

  jobs: SovereignWorkflowJob[];

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

export interface SovereignWorkflowContext {
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

export interface SovereignWorkflowStore {
  saveWorkflow(
    workflow: SovereignWorkflow
  ): Promise<void>;

  getWorkflow(
    workflowId: string
  ): Promise<SovereignWorkflow | undefined>;

  listWorkflows(
    limit?: number
  ): Promise<SovereignWorkflow[]>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignWorkflow | undefined>;
}

export interface SovereignWorkflowJobBridge {
  getJobStatus(
    jobId: string
  ): Promise<
    | "CREATED"
    | "READY"
    | "BLOCKED"
    | "QUEUED"
    | "RUNNING"
    | "COMPLETED"
    | "PARTIAL"
    | "FAILED"
    | "CANCELLED"
  >;

  runJob(
    jobId: string
  ): Promise<{
    success: boolean;
    status:
      | "COMPLETED"
      | "PARTIAL"
      | "FAILED";
    reason?: string;
  }>;

  cancelJob?(
    jobId: string
  ): Promise<{
    success: boolean;
    reason?: string;
  }>;
}

export interface SovereignWorkflowPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignWorkflowContext["authority"];

    operation:
      | "CREATE_WORKFLOW"
      | "RUN_WORKFLOW"
      | "CANCEL_WORKFLOW"
      | "READ_WORKFLOW";

    workflowId?: string;

    workflowType?: string;

    priority?: SovereignWorkflowPriority;
  }): Promise<{
    allowed: boolean;
    reason?: string;
  }>;
}

export interface SovereignWorkflowEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    workflowId?: string;

    jobId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignWorkflowAudit {
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

export class SovereignWorkflowEngine {
  public readonly id =
    "SOVEREIGN-WORKFLOW-57";

  public readonly version =
    "1.0.0";

  private store?: SovereignWorkflowStore;

  private jobBridge?: SovereignWorkflowJobBridge;

  private policyBridge?: SovereignWorkflowPolicyBridge;

  private eventBridge?: SovereignWorkflowEventBridge;

  private audit?: SovereignWorkflowAudit;

  private runningWorkflows =
    new Set<string>();

  setStore(
    store: SovereignWorkflowStore
  ): void {
    this.store = store;
  }

  setJobBridge(
    bridge: SovereignWorkflowJobBridge
  ): void {
    this.jobBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignWorkflowPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignWorkflowEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignWorkflowAudit
  ): void {
    this.audit = audit;
  }

  async createWorkflow(
    input: {
      id?: string;

      name: string;

      type: string;

      source: string;

      jobs: Array<{
        jobId: string;
        required?: boolean;
        dependencies?: string[];
      }>;

      priority?: SovereignWorkflowPriority;

      correlationId?: string;

      causationId?: string;

      idempotencyKey?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignWorkflowContext
  ): Promise<SovereignWorkflow> {
    this.requireContext(context);

    if (!input.name.trim()) {
      throw new Error(
        "Workflow name is required."
      );
    }

    if (!input.type.trim()) {
      throw new Error(
        "Workflow type is required."
      );
    }

    if (!input.source.trim()) {
      throw new Error(
        "Workflow source is required."
      );
    }

    if (input.jobs.length === 0) {
      throw new Error(
        "Workflow requires at least one job."
      );
    }

    const workflowId =
      input.id ??
      this.createId("WORKFLOW");

    const priority =
      input.priority ??
      "NORMAL";

    await this.requireAuthorized(
      context,
      "CREATE_WORKFLOW",
      workflowId,
      input.type,
      priority
    );

    if (
      input.idempotencyKey &&
      this.requireStore()
        .findByIdempotencyKey
    ) {
      const existing =
       

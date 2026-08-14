/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-TASK-55
 * ============================================================
 *
 * Sovereign Task Engine.
 *
 * Responsibilities:
 * - Create sovereign executable tasks.
 * - Assign tasks to approved executors.
 * - Track task lifecycle.
 * - Support priorities, retries and timeouts.
 * - Support dependencies and cancellation.
 * - Preserve execution results and failures.
 * - Integrate with Command, Queue, Worker and Event Bus.
 *
 * TASK ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

/* ============================================================
 * 1. TYPES
 * ============================================================
 */

export type SovereignTaskPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type SovereignTaskStatus =
  | "CREATED"
  | "READY"
  | "BLOCKED"
  | "ASSIGNED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "RETRYING"
  | "TIMED_OUT"
  | "CANCELLED";

export type SovereignTaskExecutorStatus =
  | "ACTIVE"
  | "BUSY"
  | "PAUSED"
  | "DISABLED";

/* ============================================================
 * 2. TASK
 * ============================================================
 */

export interface SovereignTask {
  id: string;

  type: string;

  source: string;

  priority: SovereignTaskPriority;

  status: SovereignTaskStatus;

  payload: unknown;

  commandId?: string;

  correlationId?: string;

  causationId?: string;

  idempotencyKey?: string;

  dependencies: string[];

  executorId?: string;

  attempt: number;

  maxAttempts: number;

  timeoutSeconds: number;

  requestedBy: string;

  createdAt: string;

  assignedAt?: string;

  startedAt?: string;

  completedAt?: string;

  cancelledAt?: string;

  nextRetryAt?: string;

  result?: unknown;

  error?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 3. EXECUTOR
 * ============================================================
 */

export interface SovereignTaskExecutor {
  id: string;

  name: string;

  taskTypes: string[];

  status: SovereignTaskExecutorStatus;

  sovereignControlled: boolean;

  maxConcurrency: number;

  activeTasks: number;

  createdBy: string;

  createdAt: string;

  updatedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 4. EXECUTION
 * ============================================================
 */

export interface SovereignTaskExecution {
  id: string;

  taskId: string;

  executorId: string;

  attempt: number;

  status:
    | "STARTING"
    | "RUNNING"
    | "COMPLETED"
    | "FAILED"
    | "TIMED_OUT"
    | "CANCELLED";

  startedAt: string;

  completedAt?: string;

  result?: unknown;

  error?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 5. CONTEXT
 * ============================================================
 */

export interface SovereignTaskContext {
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

/* ============================================================
 * 6. STORE
 * ============================================================
 */

export interface SovereignTaskStore {
  saveTask(
    task: SovereignTask
  ): Promise<void>;

  getTask(
    taskId: string
  ): Promise<SovereignTask | undefined>;

  listTasks(
    limit?: number
  ): Promise<SovereignTask[]>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignTask | undefined>;

  saveExecutor(
    executor: SovereignTaskExecutor
  ): Promise<void>;

  getExecutor(
    executorId: string
  ): Promise<SovereignTaskExecutor | undefined>;

  listExecutors():
    Promise<SovereignTaskExecutor[]>;

  saveExecution(
    execution: SovereignTaskExecution
  ): Promise<void>;

  listExecutions(
    taskId: string
  ): Promise<SovereignTaskExecution[]>;
}

/* ============================================================
 * 7. EXECUTION BRIDGE
 * ============================================================
 */

export interface SovereignTaskExecutionBridge {
  execute(input: {
    task: SovereignTask;

    executor: SovereignTaskExecutor;

    execution: SovereignTaskExecution;
  }): Promise<{
    success: boolean;

    result?: unknown;

    reason?: string;

    retryable?: boolean;

    metadata?: Record<string, unknown>;
  }>;

  cancel?(input: {
    task: SovereignTask;

    execution: SovereignTaskExecution;
  }): Promise<{
    success: boolean;

    reason?: string;
  }>;
}

/* ============================================================
 * 8. POLICY BRIDGE
 * ============================================================
 */

export interface SovereignTaskPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignTaskContext["authority"];

    operation:
      | "REGISTER_EXECUTOR"
      | "CREATE_TASK"
      | "EXECUTE_TASK"
      | "CANCEL_TASK"
      | "READ_TASK";

    taskId?: string;

    taskType?: string;

    priority?: SovereignTaskPriority;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

/* ============================================================
 * 9. EVENT BRIDGE
 * ============================================================
 */

export interface SovereignTaskEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    taskId?: string;

    executionId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 10. AUDIT
 * ============================================================
 */

export interface SovereignTaskAudit {
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

/* ============================================================
 * 11. ENGINE
 * ============================================================
 */

export class SovereignTaskEngine {
  public readonly id =
    "SOVEREIGN-TASK-55";

  public readonly version =
    "1.0.0";

  private store?: SovereignTaskStore;

  private executionBridge?: SovereignTaskExecutionBridge;

  private policyBridge?: SovereignTaskPolicyBridge;

  private eventBridge?: SovereignTaskEventBridge;

  private audit?: SovereignTaskAudit;

  private runningTasks =
    new Set<string>();

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setStore(
    store: SovereignTaskStore
  ): void {
    this.store = store;
  }

  setExecutionBridge(
    bridge: SovereignTaskExecutionBridge
  ): void {
    this.executionBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignTaskPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignTaskEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignTaskAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * REGISTER EXECUTOR
   * ==========================================================
   */

  async registerExecutor(
    input: {
      id?: string;

      name: string;

      taskTypes: string[];

      maxConcurrency?: number;

      metadata?: Record<string, unknown>;
    },
    context: SovereignTaskContext
  ): Promise<SovereignTaskExecutor> {
    this.requireContext(context);

    const id =
      input.id ??
      this.createId(
        "TASK-EXECUTOR"
      );

    await this.requireAuthorized(
      context,
      "REGISTER_EXECUTOR",
      undefined,
      undefined
    );

    if (!input.name.trim())

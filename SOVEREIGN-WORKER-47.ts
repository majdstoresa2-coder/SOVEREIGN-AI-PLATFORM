/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-WORKER-47
 * ============================================================
 *
 * Sovereign Worker Engine.
 *
 * Responsibilities:
 * - Manage sovereign execution workers.
 * - Register and supervise workers.
 * - Execute queue jobs.
 * - Enforce worker concurrency.
 * - Track worker heartbeat and health.
 * - Detect stalled or unavailable workers.
 * - Drain workers safely.
 * - Isolate failed workers.
 * - Integrate with Queue, Runtime, Agents and Capabilities.
 *
 * WORKER IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

/* ============================================================
 * 1. WORKER TYPE
 * ============================================================
 */

export type SovereignWorkerType =
  | "SYSTEM"
  | "RUNTIME"
  | "EXECUTION"
  | "AGENT"
  | "CAPABILITY"
  | "BUILD"
  | "DEPLOYMENT"
  | "GAME"
  | "MAINTENANCE";

/* ============================================================
 * 2. WORKER STATUS
 * ============================================================
 */

export type SovereignWorkerStatus =
  | "STARTING"
  | "IDLE"
  | "BUSY"
  | "DRAINING"
  | "DEGRADED"
  | "ISOLATED"
  | "STOPPED"
  | "FAILED";

/* ============================================================
 * 3. EXECUTION STATUS
 * ============================================================
 */

export type SovereignWorkerExecutionStatus =
  | "STARTING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "TIMED_OUT"
  | "CANCELLED";

/* ============================================================
 * 4. WORKER
 * ============================================================
 */

export interface SovereignWorker {
  id: string;

  name: string;

  type: SovereignWorkerType;

  status: SovereignWorkerStatus;

  queueIds: string[];

  capabilities: string[];

  maxConcurrency: number;

  activeExecutions: number;

  sovereignControlled: boolean;

  hostId?: string;

  processId?: number;

  startedAt: string;

  lastHeartbeatAt: string;

  stoppedAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 5. EXECUTION
 * ============================================================
 */

export interface SovereignWorkerExecution {
  id: string;

  workerId: string;

  queueId: string;

  jobId: string;

  jobType: string;

  status: SovereignWorkerExecutionStatus;

  attempt: number;

  startedAt: string;

  completedAt?: string;

  timeoutAt?: string;

  error?: string;

  result?: unknown;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. EXECUTION REQUEST
 * ============================================================
 */

export interface SovereignWorkerExecutionRequest {
  queueId: string;

  jobId: string;

  jobType: string;

  payload: unknown;

  attempt: number;

  timeoutSeconds?: number;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. CONTEXT
 * ============================================================
 */

export interface SovereignWorkerContext {
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
 * 8. STORE
 * ============================================================
 */

export interface SovereignWorkerStore {
  saveWorker(
    worker: SovereignWorker
  ): Promise<void>;

  getWorker(
    workerId: string
  ): Promise<SovereignWorker | undefined>;

  listWorkers():
    Promise<SovereignWorker[]>;

  saveExecution(
    execution: SovereignWorkerExecution
  ): Promise<void>;

  getExecution(
    executionId: string
  ): Promise<SovereignWorkerExecution | undefined>;

  listExecutions(
    workerId: string,
    limit?: number
  ): Promise<SovereignWorkerExecution[]>;
}

/* ============================================================
 * 9. EXECUTOR
 * ============================================================
 */

export interface SovereignWorkerExecutor {
  execute(input: {
    worker: SovereignWorker;

    execution: SovereignWorkerExecution;

    request: SovereignWorkerExecutionRequest;
  }): Promise<{
    success: boolean;

    result?: unknown;

    reason?: string;

    metadata?: Record<string, unknown>;
  }>;

  cancel?(input: {
    worker: SovereignWorker;

    execution: SovereignWorkerExecution;
  }): Promise<void>;
}

/* ============================================================
 * 10. QUEUE BRIDGE
 * ============================================================
 */

export interface SovereignWorkerQueueBridge {
  acknowledge(input: {
    queueId: string;

    jobId: string;

    workerId: string;

    result?: unknown;
  }): Promise<void>;

  fail(input: {
    queueId: string;

    jobId: string;

    workerId: string;

    reason: string;
  }): Promise<void>;
}

/* ============================================================
 * 11. POLICY BRIDGE
 * ============================================================
 */

export interface SovereignWorkerPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignWorkerContext["authority"];

    operation:
      | "REGISTER"
      | "EXECUTE"
      | "DRAIN"
      | "STOP"
      | "ISOLATE"
      | "CANCEL";

    workerId?: string;

    jobId?: string;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

/* ============================================================
 * 12. EVENT BUS
 * ============================================================
 */

export interface SovereignWorkerEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    workerId?: string;

    executionId?: string;

    jobId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 13. AUDIT
 * ============================================================
 */

export interface SovereignWorkerAudit {
  record(
    operation: string,
    subjectId: string | undefined,
    result: "SUCCESS" | "FAILED" | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 14. ENGINE
 * ============================================================
 */

export class SovereignWorkerEngine {
  public readonly id =
    "SOVEREIGN-WORKER-47";

  public readonly version =
    "1.0.0";

  private store?: SovereignWorkerStore;

  private executor?: SovereignWorkerExecutor;

  private queueBridge?: SovereignWorkerQueueBridge;

  private policyBridge?: SovereignWorkerPolicyBridge;

  private eventBus?: SovereignWorkerEventBus;

  private audit?: SovereignWorkerAudit;

  private running =
    new Map<string, Set<string>>();

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setStore(
    store: SovereignWorkerStore
  ): void {
    this.store = store;
  }

  setExecutor(
    executor: SovereignWorkerExecutor
  ): void {
    this.executor = executor;
  }

  setQueueBridge(
    bridge: SovereignWorkerQueueBridge
  ): void {
    this.queueBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignWorkerPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBus(
    eventBus: SovereignWorkerEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignWorkerAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * REGISTER WORKER
   * ==========================================================
   */

  async registerWorker(
    input: {
      id: string;

      name: string;

      type: SovereignWorkerType;

      queueIds: string[];

      capabilities?: string[];

      maxConcurrency?: number;

      hostId?: string;

      processId?: number;

      metadata?: Record<string, unknown>;
    },
    context: SovereignWorkerContext
  ): Promise<SovereignWorker> {
    this.requireContext(context);

    if (!input.id.trim()) {
      throw new Error(
        "Worker ID is required."
      );
    }

    if (input.queueIds.length === 0) {
      throw new Error(
        "Worker requires at least one queue."
      );
    }

    const authorization =
      await this.authorize(
        context,
        "REGISTER",
        input.id
      );

    if (!authorization.allowed) {
      throw new Error(
        authorization.reason ??
          "Worker registration denied."
      );
    }

    const existing =
      await this.requireStore()
        .getWorker(input.id);

    if (existing) {
      throw new Error(
        `Worker already exists: ${input.id}`
      );
    }

    const maxConcurrency =
      input.maxConcurrency ?? 5;

    if (maxConcurrency < 1) {
      throw new Error(
        "Worker concurrency must be greater than zero."
      );
    }

    const now = this.now();

    const worker: SovereignWorker = {
      id: input.id,

      name: input.name,

      type: input.type,

      status: "IDLE",

      queueIds:
        [...input.queueIds

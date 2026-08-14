/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-JOB-56
 * ============================================================
 *
 * Sovereign Job Engine.
 *
 * Responsibilities:
 * - Create and manage sovereign jobs.
 * - Group one or more tasks into controlled job execution.
 * - Track job lifecycle and progress.
 * - Enforce authorization before job operations.
 * - Support dependencies, priority and cancellation.
 * - Support retry and execution limits.
 * - Preserve correlation and causation chains.
 * - Integrate with Task, Queue, Worker, Scheduler and Event Bus.
 *
 * JOB ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

/* ============================================================
 * 1. JOB TYPES
 * ============================================================
 */

export type SovereignJobPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type SovereignJobStatus =
  | "CREATED"
  | "READY"
  | "BLOCKED"
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export type SovereignJobTaskStatus =
  | "PENDING"
  | "READY"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

/* ============================================================
 * 2. JOB TASK
 * ============================================================
 */

export interface SovereignJobTask {
  taskId: string;

  status: SovereignJobTaskStatus;

  required: boolean;

  order: number;

  startedAt?: string;

  completedAt?: string;

  error?: string;
}

/* ============================================================
 * 3. JOB
 * ============================================================
 */

export interface SovereignJob {
  id: string;

  type: string;

  source: string;

  priority: SovereignJobPriority;

  status: SovereignJobStatus;

  tasks: SovereignJobTask[];

  dependencies: string[];

  requestedBy: string;

  correlationId?: string;

  causationId?: string;

  idempotencyKey?: string;

  createdAt: string;

  queuedAt?: string;

  startedAt?: string;

  completedAt?: string;

  cancelledAt?: string;

  progress: number;

  result?: Record<string, unknown>;

  error?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 4. CONTEXT
 * ============================================================
 */

export interface SovereignJobContext {
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
 * 5. STORE
 * ============================================================
 */

export interface SovereignJobStore {
  saveJob(
    job: SovereignJob
  ): Promise<void>;

  getJob(
    jobId: string
  ): Promise<SovereignJob | undefined>;

  listJobs(
    limit?: number
  ): Promise<SovereignJob[]>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignJob | undefined>;
}

/* ============================================================
 * 6. TASK BRIDGE
 * ============================================================
 */

export interface SovereignJobTaskBridge {
  getTaskStatus(
    taskId: string
  ): Promise<
    | "CREATED"
    | "READY"
    | "BLOCKED"
    | "ASSIGNED"
    | "RUNNING"
    | "COMPLETED"
    | "FAILED"
    | "RETRYING"
    | "TIMED_OUT"
    | "CANCELLED"
  >;

  executeTask(
    taskId: string
  ): Promise<{
    success: boolean;

    result?: unknown;

    reason?: string;
  }>;

  cancelTask?(
    taskId: string
  ): Promise<{
    success: boolean;

    reason?: string;
  }>;
}

/* ============================================================
 * 7. POLICY BRIDGE
 * ============================================================
 */

export interface SovereignJobPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignJobContext["authority"];

    operation:
      | "CREATE_JOB"
      | "RUN_JOB"
      | "CANCEL_JOB"
      | "READ_JOB";

    jobId?: string;

    jobType?: string;

    priority?: SovereignJobPriority;
  }):

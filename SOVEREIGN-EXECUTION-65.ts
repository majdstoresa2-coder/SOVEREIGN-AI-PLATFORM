/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-EXECUTION-65
 * ============================================================
 *
 * Sovereign Execution Engine.
 *
 * Responsibilities:
 * - Execute approved sovereign decisions.
 * - Reject unauthorized execution.
 * - Bind execution to decision and plan.
 * - Track execution lifecycle.
 * - Support controlled retries.
 * - Support cancellation and rollback.
 * - Preserve evidence, correlation and causation.
 *
 * EXECUTION ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignExecutionPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type SovereignExecutionStatus =
  | "CREATED"
  | "READY"
  | "RUNNING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED"
  | "ROLLED_BACK";

export type SovereignExecutionStepStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "ROLLED_BACK";

export interface SovereignExecutionStep {
  id: string;

  name: string;

  action: string;

  order: number;

  required: boolean;

  dependencies: string[];

  status: SovereignExecutionStepStatus;

  attempts: number;

  maxAttempts: number;

  input?: Record<string, unknown>;

  output?: Record<string, unknown>;

  error?: string;

  startedAt?: string;

  completedAt?: string;
}

export interface SovereignExecution {
  id: string;

  decisionId: string;

  planId?: string;

  strategyId?: string;

  source: string;

  priority: SovereignExecutionPriority;

  status: SovereignExecutionStatus;

  steps: SovereignExecutionStep[];

  requestedBy: string;

  executedBy?: string;

  correlationId?: string;

  causationId?: string;

  idempotencyKey?: string;

  createdAt: string;

  startedAt?: string;

  completedAt?: string;

  cancelledAt?: string;

  rolledBackAt?: string;

  progress: number;

  error?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignExecutionContext {
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

export interface SovereignExecutionStore {
  saveExecution(
    execution: SovereignExecution
  ): Promise<void>;

  getExecution(
    executionId: string
  ): Promise<SovereignExecution | undefined>;

  listExecutions(
    limit?: number
  ): Promise<SovereignExecution[]>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignExecution | undefined>;
}

export interface SovereignExecutionDecisionBridge {
  getDecision(
    decisionId: string
  ): Promise<{
    id: string;

    status:
      | "CREATED"
      | "EVALUATING"
      | "APPROVED"
      | "REJECTED"
      | "DEFERRED"
      | "CANCELLED";

    outcome?:
      | "PROCEED"
      | "REJECT"
      | "DEFER"
      | "REQUIRE_OWNER";

    planId?: string;

    strategyId?: string;
  }>;
}

export interface SovereignExecutionActionBridge {
  execute(input: {
    executionId: string;

    stepId: string;

    action: string;

    input?: Record<string, unknown>;

    context: SovereignExecutionContext;
  }): Promise<{
    success: boolean;

    output?: Record<string, unknown>;

    error?: string;
  }>;

  rollback?(input: {
    executionId: string;

    stepId: string;

    action: string;

    output?: Record<string, unknown>;

    context: SovereignExecutionContext;
  }): Promise<{
    success: boolean;

    error?: string;
  }>;

  cancel?(input: {
    executionId: string;

    stepId: string;

    context: SovereignExecutionContext;
  }): Promise<{
    success: boolean;

    error?: string;
  }>;
}

export interface SovereignExecutionPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignExecutionContext["authority"];

    operation:
      | "CREATE_EXECUTION"
      | "RUN_EXECUTION"
      | "CANCEL_EXECUTION"
      | "ROLLBACK_EXECUTION"
      | "READ_EXECUTION";

    executionId?: string;

    decisionId?: string;

    priority?: SovereignExecutionPriority;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

export interface SovereignExecutionEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    executionId?: string;

    decisionId?: string;

    stepId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignExecutionAudit {
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

export class SovereignExecutionEngine {
  public readonly id =
    "SOVEREIGN-EXECUTION-65";

  public readonly version =
    "1.0.0";

  private store?: SovereignExecutionStore;

  private decisionBridge?: SovereignExecutionDecisionBridge;

  private actionBridge?: SovereignExecutionActionBridge;

  private policyBridge?: SovereignExecutionPolicyBridge;

  private eventBridge?: SovereignExecutionEventBridge;

  private audit?: SovereignExecutionAudit;

  private running =
    new Set<string>();

  setStore(
    store: SovereignExecutionStore
  ): void {
    this.store

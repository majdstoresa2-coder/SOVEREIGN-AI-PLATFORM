/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-STRATEGY-62
 * ============================================================
 *
 * Sovereign Strategy Engine.
 *
 * Responsibilities:
 * - Define sovereign strategies.
 * - Coordinate multiple sovereign goals.
 * - Define strategic priorities.
 * - Track strategy lifecycle and progress.
 * - Enforce goal dependencies.
 * - Support required and optional goals.
 * - Preserve correlation and causation chains.
 *
 * STRATEGY ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignStrategyPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type SovereignStrategyStatus =
  | "CREATED"
  | "READY"
  | "ACTIVE"
  | "ACHIEVED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export type SovereignStrategyGoalStatus =
  | "PENDING"
  | "READY"
  | "ACTIVE"
  | "ACHIEVED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export interface SovereignStrategyGoal {
  goalId: string;

  order: number;

  required: boolean;

  weight: number;

  dependencies: string[];

  status: SovereignStrategyGoalStatus;

  startedAt?: string;

  completedAt?: string;

  error?: string;
}

export interface SovereignStrategy {
  id: string;

  name: string;

  description: string;

  type: string;

  source: string;

  priority: SovereignStrategyPriority;

  status: SovereignStrategyStatus;

  goals: SovereignStrategyGoal[];

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

export interface SovereignStrategyContext {
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

export interface SovereignStrategyStore {
  saveStrategy(
    strategy: SovereignStrategy
  ): Promise<void>;

  getStrategy(
    strategyId: string
  ): Promise<SovereignStrategy | undefined>;

  listStrategies(
    limit?: number
  ): Promise<SovereignStrategy[]>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignStrategy | undefined>;
}

export interface SovereignStrategyGoalBridge {
  getGoalStatus(
    goalId: string
  ): Promise<
    | "CREATED"
    | "READY"
    | "ACTIVE"
    | "ACHIEVED"
    | "PARTIAL"
    | "FAILED"
    | "CANCELLED"
  >;

  runGoal(
    goalId: string
  ): Promise<{
    success: boolean;

    status:
      | "ACHIEVED"
      | "PARTIAL"
      | "FAILED";

    reason?: string;
  }>;

  cancelGoal?(
    goalId: string
  ): Promise<{
    success: boolean;
    reason?: string;
  }>;
}

export interface SovereignStrategyPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignStrategyContext["authority"];

    operation:
      | "CREATE_STRATEGY"
      | "RUN_STRATEGY"
      | "READ_STRATEGY"
      | "CANCEL_STRATEGY";

    strategyId?: string;

    strategyType?: string;

    priority?: SovereignStrategyPriority;
  }): Promise<{
    allowed: boolean;
    reason?: string;
  }>;
}

export interface SovereignStrategyEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    strategyId?: string;

    goalId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignStrategyAudit {
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

export class SovereignStrategyEngine {
  public readonly id =
    "SOVEREIGN-STRATEGY-62";

  public readonly version =
    "1.0.0";

  private store?: SovereignStrategyStore;

  private goalBridge?: SovereignStrategyGoalBridge;

  private policyBridge?: SovereignStrategyPolicyBridge;

  private eventBridge?: SovereignStrategyEventBridge;

  private audit?: SovereignStrategyAudit;

  private runningStrategies =
    new Set<string>();

  setStore(
    store: SovereignStrategyStore
  ): void {
    this.store = store;
  }

  setGoalBridge(
    bridge: SovereignStrategyGoalBridge
  ): void {
    this.goalBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignStrategyPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignStrategyEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignStrategyAudit
  ): void {
    this.audit = audit;
  }

  async createStrategy(
    input: {
      id?: string;

      name: string;

      description: string;

      type: string;

      source: string;

      goals: Array<{
        goalId: string;

        required?: boolean;

        weight?: number;

        dependencies?:

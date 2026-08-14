/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-GOAL-61
 * ============================================================
 *
 * Sovereign Goal Engine.
 *
 * Responsibilities:
 * - Create and manage sovereign goals.
 * - Define measurable success criteria.
 * - Coordinate one or more sovereign missions.
 * - Track goal lifecycle and achievement.
 * - Enforce mission dependencies.
 * - Support required and optional missions.
 * - Preserve correlation and causation chains.
 *
 * GOAL ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignGoalPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type SovereignGoalStatus =
  | "CREATED"
  | "READY"
  | "ACTIVE"
  | "ACHIEVED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export type SovereignGoalMissionStatus =
  | "PENDING"
  | "READY"
  | "RUNNING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export interface SovereignGoalCriterion {
  id: string;
  description: string;
  required: boolean;
  satisfied: boolean;
  evidence?: Record<string, unknown>;
}

export interface SovereignGoalMission {
  missionId: string;

  order: number;

  required: boolean;

  dependencies: string[];

  status: SovereignGoalMissionStatus;

  startedAt?: string;

  completedAt?: string;

  error?: string;
}

export interface SovereignGoal {
  id: string;

  name: string;

  description: string;

  type: string;

  source: string;

  priority: SovereignGoalPriority;

  status: SovereignGoalStatus;

  criteria: SovereignGoalCriterion[];

  missions: SovereignGoalMission[];

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

export interface SovereignGoalContext {
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

export interface SovereignGoalStore {
  saveGoal(
    goal: SovereignGoal
  ): Promise<void>;

  getGoal(
    goalId: string
  ): Promise<SovereignGoal | undefined>;

  listGoals(
    limit?: number
  ): Promise<SovereignGoal[]>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignGoal | undefined>;
}

export interface SovereignGoalMissionBridge {
  getMissionStatus(
    missionId: string
  ): Promise<
    | "CREATED"
    | "READY"
    | "RUNNING"
    | "COMPLETED"
    | "PARTIAL"
    | "FAILED"
    | "CANCELLED"
  >;

  runMission(
    missionId: string
  ): Promise<{
    success: boolean;

    status:
      | "COMPLETED"
      | "PARTIAL"
      | "FAILED";

    reason?: string;
  }>;

  cancelMission?(
    missionId: string
  ): Promise<{
    success: boolean;
    reason?: string;
  }>;
}

export interface SovereignGoalPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignGoalContext["authority"];

    operation:
      | "CREATE_GOAL"
      | "RUN_GOAL"
      | "READ_GOAL"
      | "CANCEL_GOAL"
      | "UPDATE_CRITERION";

    goalId?: string;

    goalType?: string;

    priority?: SovereignGoalPriority;
  }): Promise<{
    allowed: boolean;
    reason?: string;
  }>;
}

export interface SovereignGoalEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    goalId?: string;

    missionId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignGoalAudit {
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

export class SovereignGoalEngine {
  public readonly id =
    "SOVEREIGN-GOAL-61";

  public readonly version =
    "1.0.0";

  private store?: SovereignGoalStore;

  private missionBridge?: SovereignGoalMissionBridge;

  private policyBridge?: SovereignGoalPolicyBridge;

  private eventBridge?: SovereignGoalEventBridge;

  private audit?: SovereignGoalAudit;

  private runningGoals =
    new Set<string>();

  setStore(
    store: SovereignGoalStore
  ): void {
    this.store = store;
  }

  setMissionBridge(
    bridge: SovereignGoalMissionBridge
  ): void {
    this.missionBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignGoalPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignGoalEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignGoalAudit
  ): void {
    this.audit = audit;
  }

  async createGoal(
    input: {
      id?: string;

      name: string;

      description: string;

      type: string;

      source: string;

      criteria: Array<{
        id?: string;
        description: string;
        required?: boolean;
      }>;

      missions: Array<{
        missionId: string;
        required?: boolean;
        dependencies?: string[];
      }>;

      priority?: SovereignGoalPriority;

      correlationId?: string;

      causationId?: string;

      idempotencyKey?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignGoalContext
  ): Promise<SovereignGoal> {
    this.requireContext(context);

    if (!input.name.trim()) {
      throw new Error(
        "Goal name is required."
      );
    }

    if (!input.description.trim()) {
      throw new Error(
        "Goal description is required."
      );
    }

    if (!input.type.trim()) {
      throw new Error(
        "Goal type is required."
      );
    }

    if (!input.source.trim()) {
      throw new Error(
        "Goal source is required."
      );
    }

    if (input.criteria.length === 0) {
      throw new Error(
        "Goal requires at least one success criterion."
      );
    }

    if (input.missions.length === 0) {
      throw new Error(
        "Goal requires at least

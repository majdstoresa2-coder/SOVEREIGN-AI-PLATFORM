/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-MISSION-60
 * ============================================================
 *
 * Sovereign Mission Engine.
 *
 * Responsibilities:
 * - Create and manage sovereign missions.
 * - Coordinate one or more sovereign processes.
 * - Define mission objectives and success criteria.
 * - Enforce process dependencies.
 * - Track mission lifecycle and progress.
 * - Support required and optional processes.
 * - Stop on required process failure.
 * - Support controlled cancellation.
 * - Preserve correlation and causation chains.
 *
 * MISSION ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignMissionPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type SovereignMissionStatus =
  | "CREATED"
  | "READY"
  | "RUNNING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export type SovereignMissionProcessStatus =
  | "PENDING"
  | "READY"
  | "RUNNING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export interface SovereignMissionObjective {
  id: string;
  description: string;
  required: boolean;
  achieved: boolean;
  evidence?: Record<string, unknown>;
}

export interface SovereignMissionProcess {
  processId: string;

  order: number;

  required: boolean;

  dependencies: string[];

  status: SovereignMissionProcessStatus;

  startedAt?: string;

  completedAt?: string;

  error?: string;
}

export interface SovereignMission {
  id: string;

  name: string;

  type: string;

  source: string;

  priority: SovereignMissionPriority;

  status: SovereignMissionStatus;

  objectives: SovereignMissionObjective[];

  processes: SovereignMissionProcess[];

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

export interface SovereignMissionContext {
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

export interface SovereignMissionStore {
  saveMission(
    mission: SovereignMission
  ): Promise<void>;

  getMission(
    missionId: string
  ): Promise<SovereignMission | undefined>;

  listMissions(
    limit?: number
  ): Promise<SovereignMission[]>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignMission | undefined>;
}

export interface SovereignMissionProcessBridge {
  getProcessStatus(
    processId: string
  ): Promise<
    | "CREATED"
    | "READY"
    | "RUNNING"
    | "COMPLETED"
    | "PARTIAL"
    | "FAILED"
    | "CANCELLED"
  >;

  runProcess(
    processId: string
  ): Promise<{
    success: boolean;

    status:
      | "COMPLETED"
      | "PARTIAL"
      | "FAILED";

    reason?: string;
  }>;

  cancelProcess?(
    processId: string
  ): Promise<{
    success: boolean;
    reason?: string;
  }>;
}

export interface SovereignMissionPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignMissionContext["authority"];

    operation:
      | "CREATE_MISSION"
      | "RUN_MISSION"
      | "CANCEL_MISSION"
      | "READ_MISSION"
      | "UPDATE_OBJECTIVE";

    missionId?: string;

    missionType?: string;

    priority?: SovereignMissionPriority;
  }): Promise<{
    allowed: boolean;
    reason?: string;
  }>;
}

export interface SovereignMissionEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    missionId?: string;

    processId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignMissionAudit {
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

export class SovereignMissionEngine {
  public readonly id =
    "SOVEREIGN-MISSION-60";

  public readonly version =
    "1.0.0";

  private store?: SovereignMissionStore;

  private processBridge?: SovereignMissionProcessBridge;

  private policyBridge?: SovereignMissionPolicyBridge;

  private eventBridge?: SovereignMissionEventBridge;

  private audit?: SovereignMissionAudit;

  private runningMissions =
    new Set<string>();

  setStore(
    store: SovereignMissionStore
  ): void {
    this.store = store;
  }

  setProcessBridge(
    bridge: SovereignMissionProcessBridge
  ): void {
    this.processBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignMissionPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignMissionEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignMissionAudit
  ): void {
    this.audit = audit;
  }

  async createMission(
    input: {
      id?: string;

      name: string;

      type: string;

      source: string;

      objectives: Array<{
        id?: string;
        description: string;
        required?: boolean;
      }>;

      processes: Array<{
        processId: string;
        required?: boolean;
        dependencies?: string[];
      }>;

      priority?: SovereignMissionPriority;

      correlationId?: string;

      causationId?: string;

      idempotencyKey?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignMissionContext
  ): Promise<SovereignMission> {
    this.requireContext(context);

    if (!input.name.trim()) {
      throw new Error(
        "Mission name is required."
      );
    }

    if (!input.type.trim()) {
      throw new Error(
        "Mission type is required."
      );
    }

    if (!input.source.trim()) {
      throw new Error(
        "Mission source is required."
      );
    }

    if (input.objectives.length === 0) {
      throw new Error(
        "Mission requires at least one objective."
      );
    }

    if (input.processes.length === 0) {
      throw new Error(
        "Mission requires at least one process."
      );
    }

    const missionId =
      input.id ??
      this.createId("MISSION");

    const priority =
      input.priority ??
      "NORMAL";

    await this.requireAuthorized(
      context,
      "CREATE_MISSION",
      missionId,
      input.type,

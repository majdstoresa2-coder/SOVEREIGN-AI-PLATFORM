/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-PLAN-63
 * ============================================================
 *
 * Sovereign Planning Engine.
 *
 * Responsibilities:
 * - Create sovereign execution plans.
 * - Bind plans to sovereign strategies.
 * - Define ordered execution phases.
 * - Track phase dependencies and lifecycle.
 * - Support required and optional phases.
 * - Track progress and outcomes.
 * - Preserve correlation and causation.
 *
 * PLAN ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignPlanPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type SovereignPlanStatus =
  | "CREATED"
  | "READY"
  | "ACTIVE"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export type SovereignPlanPhaseStatus =
  | "PENDING"
  | "READY"
  | "ACTIVE"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export interface SovereignPlanPhase {
  id: string;

  name: string;

  order: number;

  required: boolean;

  goalIds: string[];

  dependencies: string[];

  status: SovereignPlanPhaseStatus;

  startedAt?: string;

  completedAt?: string;

  error?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignPlan {
  id: string;

  name: string;

  description: string;

  strategyId: string;

  source: string;

  priority: SovereignPlanPriority;

  status: SovereignPlanStatus;

  phases: SovereignPlanPhase[];

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

export interface SovereignPlanContext {
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

export interface SovereignPlanStore {
  savePlan(
    plan: SovereignPlan
  ): Promise<void>;

  getPlan(
    planId: string
  ): Promise<SovereignPlan | undefined>;

  listPlans(
    limit?: number
  ): Promise<SovereignPlan[]>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignPlan | undefined>;
}

export interface SovereignPlanStrategyBridge {
  getStrategyStatus(
    strategyId: string
  ): Promise<
    | "CREATED"
    | "READY"
    | "ACTIVE"
    | "ACHIEVED"
    | "PARTIAL"
    | "FAILED"
    | "CANCELLED"
  >;
}

export interface SovereignPlanGoalBridge {
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

export interface SovereignPlanPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignPlanContext["authority"];

    operation:
      | "CREATE_PLAN"
      | "RUN_PLAN"
      | "READ_PLAN"
      | "CANCEL_PLAN";

    planId?: string;

    strategyId?: string;

    priority?: SovereignPlanPriority;
  }): Promise<{
    allowed: boolean;

    reason?: string;

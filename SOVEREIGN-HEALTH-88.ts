/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-HEALTH-88
 * ============================================================
 *
 * Sovereign Health Engine.
 *
 * Responsibilities:
 * - Evaluate sovereign component health.
 * - Register health targets and checks.
 * - Detect degraded and failed components.
 * - Aggregate component health into service health.
 * - Prevent false healthy declarations.
 * - Preserve health evidence and audit records.
 *
 * HEALTH ENGINE IS NOT AUTHORITY.
 * HEALTH ENGINE DOES NOT OVERRIDE OWNER.
 * HEALTH ENGINE DOES NOT GRANT PRIVILEGES.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignHealthStatus =
  | "REGISTERED"
  | "CHECKING"
  | "HEALTHY"
  | "DEGRADED"
  | "UNHEALTHY"
  | "FAILED"
  | "ARCHIVED";

export type SovereignHealthCriticality =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignHealthCheckType =
  | "LIVENESS"
  | "READINESS"
  | "DEPENDENCY"
  | "INTEGRITY"
  | "CAPACITY";

export interface SovereignHealthCheck {
  id: string;
  name: string;
  type: SovereignHealthCheckType;

  required: boolean;

  healthy: boolean;

  latencyMs?: number;

  checkedAt?: string;

  reason?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignHealthTarget {
  id: string;

  serviceId: string;

  componentId: string;

  name: string;

  criticality: SovereignHealthCriticality;

  status: SovereignHealthStatus;

  checks: SovereignHealthCheck[];

  healthScore: number;

  requiredChecksPassed: boolean;

  createdBy: string;
  checkedBy?: string;

  correlationId?: string;
  causationId?: string;

  createdAt: string;
  updatedAt: string;
  checkedAt?: string;
  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignHealthContext {
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

  correlationId?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignHealthStore {
  saveTarget(
    target: SovereignHealthTarget
  ): Promise<void>;

  getTarget(
    targetId: string
  ): Promise<SovereignHealthTarget | undefined>;

  listTargets(
    limit?: number
  ): Promise<SovereignHealthTarget[]>;
}

export interface SovereignHealthProbeBridge {
  execute(input: {
    targetId: string;

    serviceId: string;

    componentId: string;

    check: SovereignHealthCheck;

    context: SovereignHealthContext;
  }): Promise<{
    healthy: boolean;

    latencyMs?: number;

    reason?: string;

    evidence?: Record<string, unknown>;
  }>;
}

export interface SovereignHealthPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignHealthContext["authority"];

    operation:
      | "REGISTER_HEALTH"
      | "CHECK_HEALTH"
      | "READ_HEALTH"
      | "ARCHIVE_HEALTH";

    targetId?: string;
    serviceId?: string;

    criticality?: SovereignHealthCriticality;
  }): Promise<{
    allowed: boolean;
    reason?: string;
  }>;
}

export interface SovereignHealthEventBridge {
  publish(event: {
    id: string;

    type: string;
    source: string;

    targetId?: string;
    serviceId?: string;

    timestamp: string;
    correlationId?: string;

    payload:

/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-SLO-91
 * ============================================================
 *
 * Sovereign Service Level Objective Engine.
 *
 * Responsibilities:
 * - Define sovereign service-level objectives.
 * - Measure objective compliance.
 * - Track objective achievement over time.
 * - Detect objective degradation and violations.
 * - Preserve objective evidence.
 * - Prevent false objective-compliance declarations.
 *
 * SLO ENGINE IS NOT AUTHORITY.
 * SLO ENGINE DOES NOT OVERRIDE OWNER.
 * SLO ENGINE DOES NOT GRANT PRIVILEGES.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignSLOStatus =
  | "REGISTERED"
  | "EVALUATING"
  | "ACHIEVED"
  | "AT_RISK"
  | "VIOLATED"
  | "FAILED"
  | "ARCHIVED";

export type SovereignSLOCriticality =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignSLOMetric =
  | "AVAILABILITY"
  | "RELIABILITY"
  | "LATENCY"
  | "ERROR_RATE"
  | "SUCCESS_RATE"
  | "THROUGHPUT";

export type SovereignSLOComparator =
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN_OR_EQUAL";

export interface SovereignSLOObjective {
  id: string;

  name: string;

  metric: SovereignSLOMetric;

  comparator: SovereignSLOComparator;

  target: number;

  weight: number;

  required: boolean;

  achieved: boolean;

  actual?: number;

  evaluatedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignSLORecord {
  id: string;

  serviceId: string;

  criticality: SovereignSLOCriticality;

  status: SovereignSLOStatus;

  objectives: SovereignSLOObjective[];

  achievementScore: number;

  requiredObjectivesPassed: boolean;

  violatedObjectiveIds: string[];

  createdBy: string;
  evaluatedBy?: string;

  correlationId?: string;
  causationId?: string;

  createdAt: string;
  updatedAt: string;

  evaluatedAt?: string;
  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignSLOContext {
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

export interface SovereignSLOStore {
  saveRecord(
    record: SovereignSLORecord
  ): Promise<void>;

  getRecord(
    recordId: string
  ): Promise<SovereignSLORecord | undefined>;

  listRecords(
    limit?: number
  ): Promise<SovereignSLORecord[]>;
}

export interface SovereignS

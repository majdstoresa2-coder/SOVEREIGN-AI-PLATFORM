/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-SLA-90
 * ============================================================
 *
 * Sovereign Service Level Agreement Engine.
 *
 * Responsibilities:
 * - Define sovereign service-level objectives.
 * - Measure compliance against approved targets.
 * - Detect SLA violations.
 * - Track availability, reliability and latency objectives.
 * - Preserve SLA evidence and violation history.
 * - Prevent false compliance declarations.
 *
 * SLA ENGINE IS NOT AUTHORITY.
 * SLA ENGINE DOES NOT OVERRIDE OWNER.
 * SLA ENGINE DOES NOT GRANT PRIVILEGES.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignSLAStatus =
  | "REGISTERED"
  | "EVALUATING"
  | "COMPLIANT"
  | "AT_RISK"
  | "VIOLATED"
  | "FAILED"
  | "ARCHIVED";

export type SovereignSLACriticality =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignSLATargets {
  availabilityPercent: number;
  reliabilityPercent: number;
  maximumLatencyMs: number;
  maximumErrorRatePercent: number;
}

export interface SovereignSLAMetrics {
  availabilityPercent: number;
  reliabilityPercent: number;
  averageLatencyMs: number;
  errorRatePercent: number;

  observationWindowSeconds: number;
  measuredAt: string;
}

export interface SovereignSLAViolation {
  id: string;

  objective:
    | "AVAILABILITY"
    | "RELIABILITY"
    | "LATENCY"
    | "ERROR_RATE";

  expected: number;
  actual: number;

  detectedAt: string;
}

export interface SovereignSLARecord {
  id: string;

  serviceId: string;

  criticality: SovereignSLACriticality;

  status: SovereignSLAStatus;

  targets: SovereignSLATargets;

  metrics: SovereignSLAMetrics;

  violations: SovereignSLAViolation[];

  complianceScore: number;

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

export interface SovereignSLAContext {
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

 

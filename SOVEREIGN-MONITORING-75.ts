/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-MONITORING-75
 * ============================================================
 *
 * Sovereign Monitoring Engine.
 *
 * Responsibilities:
 * - Monitor sovereign deployments.
 * - Collect health and performance metrics.
 * - Detect incidents and degradation.
 * - Generate sovereign alerts.
 * - Preserve monitoring history.
 * - Route detected problems to sovereign decision flow.
 *
 * MONITORING ENGINE IS NOT AUTHORITY.
 * MONITORING ENGINE DOES NOT MODIFY PRODUCTION.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

/* ============================================================
 * 1. TYPES
 * ============================================================
 */

export type SovereignMonitoringStatus =
  | "CREATED"
  | "ACTIVE"
  | "DEGRADED"
  | "CRITICAL"
  | "PAUSED"
  | "STOPPED"
  | "ARCHIVED";

export type SovereignHealthStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "UNHEALTHY"
  | "UNKNOWN";

export type SovereignAlertSeverity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignMetricType =
  | "AVAILABILITY"
  | "LATENCY"
  | "ERROR_RATE"
  | "CPU"
  | "MEMORY"
  | "STORAGE"
  | "NETWORK"
  | "SECURITY"
  | "CUSTOM";

/* ============================================================
 * 2. METRIC
 * ============================================================
 */

export interface SovereignMonitoringMetric {
  id: string;

  type: SovereignMetricType;

  name: string;

  value: number;

  unit: string;

  healthy: boolean;

  threshold?: number;

  observedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 3. ALERT
 * ============================================================
 */

export interface SovereignMonitoringAlert {
  id: string;

  deploymentId: string;

  severity: SovereignAlertSeverity;

  title: string;

  description: string;

  metricId?: string;

  acknowledged: boolean;

  acknowledgedBy?: string;

  acknowledgedAt?: string;

  createdAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 4. MONITOR
 * ============================================================
 */

export interface SovereignDeploymentMonitor {
  id: string;

  deploymentId: string;

  releaseId: string;

  environment:
    | "DEVELOPMENT"
    | "STAGING"
    | "PRODUCTION";

  source: string;

  status: SovereignMonitoringStatus;

  health: SovereignHealthStatus;

  metrics: SovereignMonitoringMetric[];

  alerts: SovereignMonitoringAlert[];

  requestedBy: string;

  startedBy?: string;

  correlationId?: string;

  causationId?: string;

  createdAt: string;

  startedAt?: string;

  lastCheckedAt?: string;

  stoppedAt?: string;

  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 5. CONTEXT
 * ============================================================
 */

export interface SovereignMonitoringContext {
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
 * 6. STORE
 * ============================================================
 */

export interface SovereignMonitoringStore {
  saveMonitor(
    monitor: SovereignDeploymentMonitor
  ): Promise<void>;

  getMonitor(
    monitorId: string
  ): Promise<SovereignDeploymentMonitor | undefined>;

  listMonitors(
    limit?: number
  ): Promise<SovereignDeploymentMonitor[]>;

  findByDeploymentId?(
    deploymentId: string
  ): Promise<SovereignDeploymentMonitor | undefined>;
}

/* ============================================================
 * 7. DEPLOYMENT BRIDGE
 * ============================================================
 */

export interface SovereignMonitoringDeploymentBridge {
  getDeployment(
    deploymentId: string
  ): Promise<{
    id: string;

    releaseId: string;

    environment:
      | "DEVELOPMENT"
      | "STAGING"
      | "PRODUCTION";

    status:
      | "CREATED"
      | "VERIFYING"
      | "DEPLOYING"
      | "DEPLOYED"
      | "FAILED"
      | "ROLLING_BACK"
      | "ROLLED_BACK"
      | "ARCHIVED";
  }>;
}

/* =================================================

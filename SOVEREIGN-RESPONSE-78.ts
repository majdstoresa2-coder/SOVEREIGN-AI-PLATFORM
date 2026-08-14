/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-RESPONSE-78
 * ============================================================
 *
 * Sovereign Response Engine.
 *
 * Responsibilities:
 * - Build controlled responses for sovereign incidents.
 * - Consume sovereign diagnostic findings.
 * - Create ordered remediation actions.
 * - Route approved actions to sovereign execution.
 * - Track response progress and outcomes.
 * - Preserve full response provenance.
 *
 * RESPONSE ENGINE IS NOT AUTHORITY.
 * RESPONSE ENGINE DOES NOT MODIFY PRODUCTION DIRECTLY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignResponseStatus =
  | "CREATED"
  | "PLANNING"
  | "READY"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "ARCHIVED";

export type SovereignResponseSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignResponseActionStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED"
  | "SKIPPED";

export interface SovereignResponseAction {
  id: string;

  order: number;

  type: string;

  title: string;

  description: string;

  target: string;

  status: SovereignResponseActionStatus;

  requiresAuthorization: boolean;

  executionId?: string;

  result?: string;

  createdAt: string;

  startedAt?: string;

  completedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignResponse {
  id: string;

  incidentId: string;

  diagnosisId: string;

  deploymentId: string;

  severity: SovereignResponseSeverity;

  status: SovereignResponseStatus;

  source: string;

  rootCauseFindingId?: string;

  diagnosticConfidence: number;

  actions: SovereignResponseAction[];

  requestedBy: string;

  plannedBy?: string;

  executedBy?: string;

  correlationId?: string;

  causationId?: string;

  createdAt: string;

  plannedAt?: string;

  startedAt?: string;

  completedAt?: string;

  failedAt?: string;

  cancelledAt?: string;

  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignResponseContext {
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

export interface SovereignResponseStore {
  saveResponse(
    response: SovereignResponse
  ): Promise<void>;

  getResponse(
    responseId: string
  ): Promise<SovereignResponse | undefined>;

  listResponses(
    limit?: number
  ): Promise<SovereignResponse[]>;

  findByIncidentId?(
    incidentId: string
  ): Promise<SovereignResponse | undefined>;
}

export interface SovereignResponseIncidentBridge {
  getIncident(
    incidentId: string
  ): Promise<{
    id: string;

    deploymentId: string;

    severity: SovereignResponseSeverity;

    status:
      | "OPEN"
      | "INVESTIGATING"
      | "CONTAINING"
      | "CONTAINED"
      | "RESOLVING"
      | "RESOLVED"
      | "CLOSED"
      | "ARCHIVED";

    diagnosisId?: string;
  }>;
}

export interface SovereignResponseDiagnosticsBridge {
  getDiagnosis(
    diagnosisId: string
  ): Promise<{
    id: string;

    incidentId: string;

    deploymentId: string;

    status:
      | "CREATED"
      | "COLLECTING"
      | "ANALYZING"
      | "DIAGNOSED"
      | "INCONCLUSIVE"
      | "FAILED"
      | "ARCHIVED";

    confidence: number;

    rootCauseFindingId?: string;

    findings: Array<{
      id: string;

      title: string;

      description: string;

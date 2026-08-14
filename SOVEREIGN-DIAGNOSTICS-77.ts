/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-DIAGNOSTICS-77
 * ============================================================
 *
 * Sovereign Diagnostics Engine.
 *
 * Responsibilities:
 * - Diagnose sovereign incidents.
 * - Collect diagnostic evidence.
 * - Identify probable and root causes.
 * - Calculate diagnostic confidence.
 * - Preserve diagnostic provenance.
 * - Provide findings to sovereign response flow.
 *
 * DIAGNOSTICS ENGINE IS NOT AUTHORITY.
 * DIAGNOSTICS ENGINE DOES NOT MODIFY PRODUCTION.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignDiagnosticStatus =
  | "CREATED"
  | "COLLECTING"
  | "ANALYZING"
  | "DIAGNOSED"
  | "INCONCLUSIVE"
  | "FAILED"
  | "ARCHIVED";

export type SovereignDiagnosticSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignEvidenceType =
  | "LOG"
  | "METRIC"
  | "TRACE"
  | "EVENT"
  | "SECURITY"
  | "CONFIGURATION"
  | "DEPENDENCY"
  | "SYSTEM"
  | "CUSTOM";

export interface SovereignDiagnosticEvidence {
  id: string;

  type: SovereignEvidenceType;

  source: string;

  summary: string;

  reference?: string;

  integrityVerified: boolean;

  collectedAt: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignDiagnosticFinding {
  id: string;

  title: string;

  description: string;

  probableCause: boolean;

  rootCause: boolean;

  confidence: number;

  evidenceIds: string[];

  createdAt: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignDiagnosis {
  id: string;

  incidentId: string;

  monitorId: string;

  deploymentId: string;

  severity: SovereignDiagnosticSeverity;

  status: SovereignDiagnosticStatus;

  source: string;

  evidence: SovereignDiagnosticEvidence[];

  findings: SovereignDiagnosticFinding[];

  rootCauseFindingId?: string;

  confidence: number;

  requestedBy: string;

  diagnosedBy?: string;

  correlationId?: string;

  causationId?: string;

  createdAt: string;

  startedAt?: string;

  diagnosedAt?: string;

  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignDiagnosticsContext {
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

export interface SovereignDiagnosticsStore {
  saveDiagnosis(
    diagnosis: SovereignDiagnosis
  ): Promise<void>;

  getDiagnosis(
    diagnosisId: string
  ): Promise<SovereignDiagnosis | undefined>;

  listDiagnoses(
    limit?: number
  ): Promise<SovereignDiagnosis[]>;

  findByIncidentId?(
    incidentId: string
  ): Promise<SovereignDiagnosis | undefined>;
}

export interface SovereignDiagnosticsIncidentBridge {
  getIncident(
    incidentId: string
  ): Promise<{
    id: string;

    monitorId: string;

    deploymentId: string;

    severity:
      | "LOW"
      | "MEDIUM"
      | "HIGH"
      | "CRITICAL";

    title: string;

    description: string;

    status:
      | "OPEN"
      | "INVESTIGATING"
      | "CONTAINING"
      | "CONTAINED"
      | "RESOLVING"
      | "RESOLVED"
      | "CLOSED"
      | "ARCHIVED";
  }>;
}

export interface SovereignDiagnosticsCollectorBridge {
  collect(input: {
    diagnosisId: string;

    incidentId: string;

    deploymentId: string;

    context: SovereignDiagnosticsContext;
  }): Promise<
    Array<{
      type: SovereignEvidenceType;

      source: string;

      summary: string;

      reference?: string;

      integrityVerified: boolean;

      metadata?: Record<string, unknown>;
    }>
  >;
}

export interface SovereignDiagnosticsAnalyzerBridge {
  analyze(input: {
    diagnosis: SovereignDiagnosis;

    context: SovereignDiagnosticsContext;
  }): Promise<{
    findings: Array<{
      title: string;

      description: string;

      probableCause?: boolean;

      rootCause?: boolean;

      confidence: number;

      evidenceIds?: string[];

      metadata?: Record<string, unknown>;
    }>;
  }>;
}

export interface SovereignDiagnosticsPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignDiagnosticsContext["authority"];

    operation:
      | "CREATE_DIAGNOSIS"
      | "RUN_DIAGNOSIS"
      | "READ_DIAGNOSIS"
      | "ARCHIVE_DIAGNOSIS";

    diagnosisId?: string;

    incidentId?: string;

    severity?: SovereignDiagnosticSeverity;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

export interface SovereignDiagnosticsEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    diagnosisId?: string;

    incidentId?: string;

    deploymentId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignDiagnosticsAudit {
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

export class SovereignDiagnosticsEngine {
  public readonly id =
    "SOVEREIGN-DIAGNOSTICS-77";

  public readonly version =
    "1.0.0";

  private store?: SovereignDiagnosticsStore;

  private incidentBridge?:
    SovereignDiagnosticsIncidentBridge;

  private collectorBridge?:
    SovereignDiagnosticsCollectorBridge;

  private analyzerBridge?:
    SovereignDiagnosticsAnalyzerBridge;

  private policyBridge?:
    SovereignDiagnosticsPolicyBridge;

  private eventBridge?:
    SovereignDiagnosticsEventBridge;

  private audit?: SovereignDiagnosticsAudit;

  private running =
    new Set<string>();

  setStore(
    store: SovereignDiagnosticsStore
  ): void {
    this.store = store;
  }

  setIncidentBridge(
    bridge: SovereignDiagnosticsIncidentBridge
  ): void {
    this.incidentBridge = bridge;
  }

  setCollectorBridge(
    bridge: SovereignDiagnosticsCollectorBridge
  ): void {
    this.collectorBridge = bridge;
  }

  setAnalyzerBridge(
    bridge: SovereignDiagnosticsAnalyzerBridge
  ): void {
    this.analyzerBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignDiagnosticsPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignDiagnosticsEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignDiagnosticsAudit
  ): void {
    this.audit = audit;
  }

  async createDiagnosis(
    input: {
      id?: string;

      incidentId: string;

      source: string;

      correlationId?: string;

      causationId?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignDiagnosticsContext
  ): Promise<SovereignDiagnosis> {
    this.requireContext(context);

    if (!input.incidentId.trim()) {
      throw new Error(
        "Diagnostics incidentId is required."
      );
    }

    if (!input.source.trim()) {
      throw new Error(
        "Diagnostics source is required."
      );
    }

    const incident =
      await this.requireIncidentBridge()
        .getIncident(
          input.incidentId
        );

    if (
      incident.status === "CLOSED" ||
      incident.status === "ARCHIVED"
    ) {
      throw new Error(
        `Incident is not diagnosable: ${incident.status}`
      );
    }

    if (
      this.requireStore()
        .findByIncidentId
    ) {
      const existing =
        await this.requireStore()
         

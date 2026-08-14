/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-INCIDENT-76
 * ============================================================
 *
 * Sovereign Incident Engine.
 *
 * Responsibilities:
 * - Receive incidents from sovereign monitoring.
 * - Classify incident severity and state.
 * - Preserve incident provenance.
 * - Coordinate diagnosis and response requests.
 * - Track containment, resolution and closure.
 * - Escalate critical incidents through sovereign governance.
 *
 * INCIDENT ENGINE IS NOT AUTHORITY.
 * INCIDENT ENGINE DOES NOT MODIFY PRODUCTION DIRECTLY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignIncidentSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignIncidentStatus =
  | "OPEN"
  | "INVESTIGATING"
  | "CONTAINING"
  | "CONTAINED"
  | "RESOLVING"
  | "RESOLVED"
  | "CLOSED"
  | "ARCHIVED";

export interface SovereignIncident {
  id: string;

  monitorId: string;

  deploymentId: string;

  alertId: string;

  severity: SovereignIncidentSeverity;

  title: string;

  description: string;

  status: SovereignIncidentStatus;

  source: string;

  openedBy: string;

  assignedTo?: string;

  diagnosisId?: string;

  responseId?: string;

  containmentSummary?: string;

  resolutionSummary?: string;

  correlationId?: string;

  causationId?: string;

  createdAt: string;

  investigationStartedAt?: string;

  containedAt?: string;

  resolvedAt?: string;

  closedAt?: string;

  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignIncidentContext {
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

export interface SovereignIncidentStore {
  saveIncident(
    incident: SovereignIncident
  ): Promise<void>;

  getIncident(
    incidentId: string
  ): Promise<SovereignIncident | undefined>;

  listIncidents(
    limit?: number
  ): Promise<SovereignIncident[]>;

  findByAlertId?(
    alertId: string
  ): Promise<SovereignIncident | undefined>;
}

export interface SovereignIncidentMonitoringBridge {
  getMonitor(
    monitorId: string
  ): Promise<{
    id: string;

    deploymentId: string;

    status:
      | "CREATED"
      | "ACTIVE"
      | "DEGRADED"
      | "CRITICAL"
      | "PAUSED"
      | "STOPPED"
      | "ARCHIVED";

    alerts: Array<{
      id: string;

      deploymentId: string;

      severity:
        | "INFO"
        | "LOW"
        | "MEDIUM"
        | "HIGH"
        | "CRITICAL";

      title: string;

      description: string;

      createdAt: string;
    }>;
  }>;
}

export interface SovereignIncidentDiagnosticsBridge {
  requestDiagnosis(input: {
    incidentId: string;

    monitorId: string;

    deploymentId: string;

    severity: SovereignIncidentSeverity;

    title: string;

    description: string;

    context: SovereignIncidentContext;
  }): Promise<{
    accepted: boolean;

    diagnosisId?: string;

    reason?: string;
  }>;
}

export interface SovereignIncidentResponseBridge {
  requestResponse(input: {
    incidentId: string;

    diagnosisId?: string;

    deploymentId: string;

    severity: SovereignIncidentSeverity;

    context: SovereignIncidentContext;
  }): Promise<{
    accepted: boolean;

    responseId?: string;

    reason?: string;
  }>;
}

export interface SovereignIncidentPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignIncidentContext["authority"];

    operation:
      | "CREATE_INCIDENT"
      | "INVESTIGATE_INCIDENT"
      | "CONTAIN_INCIDENT"
      | "RESOLVE_INCIDENT"
      | "CLOSE_INCIDENT"
      | "READ_INCIDENT"
      | "ARCHIVE_INCIDENT";

    incidentId?: string;

    deploymentId?: string;

    severity?: SovereignIncidentSeverity;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

export interface SovereignIncidentEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    incidentId?: string;

    deploymentId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignIncidentAudit {
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

export class SovereignIncidentEngine {
  public readonly id =
    "SOVEREIGN-INCIDENT-76";

  public readonly version =
    "1.0.0";

  private store?: SovereignIncidentStore;

  private monitoringBridge?:
    SovereignIncidentMonitoringBridge;

  private diagnosticsBridge?:
    SovereignIncidentDiagnosticsBridge;

  private responseBridge?:
    SovereignIncidentResponseBridge;

  private policyBridge?:
    SovereignIncidentPolicyBridge;

  private eventBridge?:
    SovereignIncidentEventBridge;

  private audit?: SovereignIncidentAudit;

  setStore(
    store: SovereignIncidentStore
  ): void {
    this.store = store;
  }

  setMonitoringBridge(
    bridge: SovereignIncidentMonitoringBridge
  ): void {
    this.monitoringBridge = bridge;
  }

  setDiagnosticsBridge(
    bridge: SovereignIncidentDiagnosticsBridge
  ): void {
    this.diagnosticsBridge = bridge;
  }

  setResponseBridge(
    bridge: SovereignIncidentResponseBridge
  ): void {
    this.responseBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignIncidentPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignIncidentEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignIncidentAudit
  ): void {
    this.audit = audit;
  }

  async createIncident(
    input: {
      id?: string;

      monitorId: string;

      alertId: string;

      source: string;

      correlationId?: string;

      causationId?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignIncidentContext
  ): Promise<SovereignIncident> {
    this.requireContext(context);

    if (!input.monitorId.trim()) {
      throw new Error(
        "Incident monitorId is required."
      );
    }

    if (!input.alertId.trim()) {
      throw new Error(
        "Incident alertId is required."
      );
    }

    if (!input.source.trim()) {
      throw new Error(
        "Incident source is required."
      );
    }

    const monitor =
      await this.requireMonitoringBridge()
        .getMonitor(input.monitorId);

    const alert =
      monitor.alerts.find(
        (item) =>
          item.id === input.alertId
      );

    if (!alert) {
      throw new Error(
        `Monitoring alert not found: ${input.alertId}`
      );
    }

    if (
      alert.severity === "INFO"
    ) {
      throw new Error(
        "INFO alerts do not create incidents."
      );
    }

    if (
      this.requireStore().findByAlertId
    ) {
      const existing =
        await this.requireStore()
          .findByAlertId!(
            alert.id
          );

      if (existing) {
        return existing;
      }
    }

    const severity =
      this.normalizeSeverity(
        alert.severity
      );

    const incidentId =
      input.id ??
      this.createId("INCIDENT");

    await this.requireAuthorized(
      context,
      "CREATE_INCIDENT",
      incidentId,
      monitor.deploymentId,
      severity
    );

    const incident:
      SovereignIncident = {
      id:
        incidentId,

      monitorId:
        monitor.id,

      deploymentId:
        monitor.deploymentId,

      alertId:
        alert.id,

      severity,

      title:
        alert.title,

      description:
        alert.description,

      status:
        "OPEN",

      source:
        input.source,

      openedBy:
        context.actorId,

      correlationId:
        input.correlationId,

      causationId:
        input.causationId,

      createdAt:
        this.now(),

      metadata:
        input.metadata,
    };

    await this.requireStore()
      .saveIncident(incident);

    await this.publishEvent(
      "incident.created",
      incident,
      {
        severity:
          incident.severity,

        alertId:
          incident.alertId,
      }
    );

    await this.recordAudit(
      "incident.create",
      incident.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,

        deploymentId:
          incident.deploymentId,

        severity:
          incident.severity,
      }
    );

    return incident;
  }

  async investigate(
    incidentId: string,
    context: SovereignIncidentContext
  ): Promise<SovereignIncident> {
    this.requireContext(context);

    const incident =
      await this.requireIncident(
        incidentId
      );

    await this.requireAuthorized(
      context,
      "INVESTIGATE_INCIDENT",
      incident.id,
      incident.deploymentId,
      incident.severity
    );

    if (
      incident.status === "CLOSED" ||
      incident.status === "ARCHIVED"
    ) {
      throw new Error(
        `Incident cannot be investigated from status: ${incident.status}`
      );
    }

    incident.status =
      "INVESTIGATING";

    incident.assignedTo =
      context.actorId;

    incident.investigationStartedAt =
      incident.investigationStartedAt ??
      this.now();

    if (this.diagnosticsBridge) {
      const diagnosis =
        await this.diagnosticsBridge
          .requestDiagnosis({
            incidentId:
              incident.id,

            monitorId:
              incident.monitorId,

            deploymentId:
              incident.deploymentId,

            severity:
              incident.severity,

            title:
              incident.title,

            description:
              incident.description,

            context,
          });

      if (diagnosis.accepted) {
        incident.diagnosisId =
          diagnosis.diagnosisId;
      }
    }

    await this.requireStore()
      .saveIncident(incident);

    await this.publishEvent(
      "incident.investigating",
      incident,
      {
        diagnosisId:
          incident.diagnosisId,
      }
    );

    return incident;
  }

  async beginContainment(
    incidentId: string,
    context: SovereignIncidentContext
  ): Promise<SovereignIncident> {
    this.requireContext(context);

    const incident =
      await this.requireIncident(
        incidentId
      );

    await this.requireAuthorized(
      context,
      "CONTAIN_INCIDENT",
      incident.id,
      incident.deploymentId,
      incident.severity
    );

    if (
      incident.status !==
        "INVESTIGATING" &&
      incident.status !==
        "OPEN"
    ) {
      throw new Error(
        `Incident cannot enter containment from status: ${incident.status}`
      );
    }

    incident.status =
      "CONTAINING";

    if (this.responseBridge) {
      const response =
        await this.responseBridge
          .requestResponse({
            incidentId:
              incident.id,

            diagnosisId:
              incident.diagnosisId,

            deploymentId:
              incident.deploymentId,

            severity:
              incident.severity,

            context,
          });

      if (response.accepted) {
        incident.responseId =
          response.responseId;
      }
    }

    await this.requireStore()
      .saveIncident(incident);

    await this.publishEvent(
      "incident.containment.started",
      incident,
      {
        responseId:
          incident.responseId,
      }
    );

    return incident;
  }

  async markContained(
    incidentId: string,
    summary: string,
    context: SovereignIncidentContext
  ): Promise<SovereignIncident> {
    this.requireContext(context);

    if (!summary.trim()) {
      throw new Error(
        "Containment summary is required."
      );
    }

    const incident =
      await this.requireIncident(
        incidentId
      );

    await this.requireAuthorized(
      context,
      "CONTAIN_INCIDENT",
      incident.id,
      incident.deploymentId,
      incident.severity
    );

    if (
      incident.status !==
      "CONTAINING"
    ) {
      throw new Error(
        "Incident must be CONTAINING before it can be marked CONTAINED."
      );
    }

    incident.status =
      "CONTAINED";

    incident.containmentSummary =
      summary;

    incident.containedAt =
      this.now();

    await this.requireStore()
      .saveIncident(incident);

    await this.publishEvent(
      "incident.contained",
      incident,
      {
        summary,
      }
    );

    return

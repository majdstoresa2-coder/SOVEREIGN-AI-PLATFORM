/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-SECURITY-16
 * ============================================================
 *
 * Purpose:
 * Central Sovereign Security & Zero-Trust Engine.
 *
 * Responsibilities:
 * - Zero-Trust security enforcement.
 * - Security threat detection.
 * - Identity/session validation.
 * - Security incident management.
 * - Resource protection.
 * - Risk evaluation.
 * - Controlled isolation.
 * - Security audit trail.
 *
 * SECURITY NEVER overrides OWNER authority.
 * SECURITY NEVER bypasses sovereign policy.
 *
 * OWNER > STEWARD > CORE > POLICY > SECURITY
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. SECURITY TYPES
 * ============================================================
 */

export type SovereignSecuritySeverity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignThreatStatus =
  | "DETECTED"
  | "INVESTIGATING"
  | "CONTAINED"
  | "RESOLVED"
  | "FALSE_POSITIVE";

export type SovereignTrustLevel =
  | "UNTRUSTED"
  | "LIMITED"
  | "TRUSTED"
  | "PRIVILEGED"
  | "SOVEREIGN";

export type SecurityResourceType =
  | "CORE"
  | "RUNTIME"
  | "AGENT"
  | "CAPABILITY"
  | "MEMORY"
  | "EVENT"
  | "JOB"
  | "DATABASE"
  | "FILE"
  | "NETWORK"
  | "BUILD"
  | "DEPLOYMENT"
  | "BILLING"
  | "SYSTEM"
  | "CUSTOM";

/* ============================================================
 * 2. SECURITY IDENTITY
 * ============================================================
 */

export interface SovereignSecurityIdentity {
  actorId: string;

  authority:
    | "OWNER"
    | "STEWARD"
    | "CORE"
    | "AGENT"
    | "CAPABILITY"
    | "SYSTEM";

  trustLevel: SovereignTrustLevel;

  authenticated: boolean;

  permissions: string[];

  sessionId?: string;

  source?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 3. SECURITY REQUEST
 * ============================================================
 */

export interface SovereignSecurityRequest {
  id: string;

  identity: SovereignSecurityIdentity;

  resource: string;

  resourceType: SecurityResourceType;

  action: string;

  riskLevel: SovereignSecuritySeverity;

  policyChecked: boolean;

  permissionChecked: boolean;

  timestamp: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 4. SECURITY DECISION
 * ============================================================
 */

export interface SovereignSecurityDecision {
  requestId: string;

  allowed: boolean;

  riskScore: number;

  trustLevel: SovereignTrustLevel;

  reason: string;

  restrictions: string[];

  evaluatedAt: string;
}

/* ============================================================
 * 5. THREAT
 * ============================================================
 */

export interface SovereignThreat {
  id: string;

  code: string;

  title: string;

  description: string;

  severity: SovereignSecuritySeverity;

  status: SovereignThreatStatus;

  source: string;

  actorId?: string;

  resource?: string;

  evidence: string[];

  detectedAt: string;

  updatedAt: string;

  resolvedAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. SECURITY INCIDENT
 * ============================================================
 */

export interface SovereignSecurityIncident {
  id: string;

  threatIds: string[];

  title: string;

  severity: SovereignSecuritySeverity;

  status:
    | "OPEN"
    | "CONTAINED"
    | "RESOLVED";

  affectedResources: string[];

  createdAt: string;

  updatedAt: string;

  resolvedAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. SECURITY RULE
 * ============================================================
 */

export interface SovereignSecurityRule {
  id: string;

  name: string;

  enabled: boolean;

  priority: number;

  resourceTypes: SecurityResourceType[];

  actions: string[];

  minimumTrustLevel: SovereignTrustLevel;

  maximumRiskLevel: SovereignSecuritySeverity;

  restrictions: string[];

  description?: string;
}

/* ============================================================
 * 8. THREAT DETECTOR
 * ============================================================
 */

export interface SovereignThreatDetector {
  id: string;

  enabled: boolean;

  inspect(
    request: SovereignSecurityRequest
  ): Promise<
    Array<{
      code: string;

      title: string;

      description: string;

      severity: SovereignSecuritySeverity;

      evidence: string[];
    }>
  >;
}

/* ============================================================
 * 9. SECURITY EVENT BUS
 * ============================================================
 */

export interface SecurityEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 10. SECURITY AUDIT
 * ============================================================
 */

export interface SecurityAudit {
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

/* ============================================================
 * 11. SECURITY ENGINE
 * ============================================================
 */

export class SovereignSecurityEngine {
  public readonly id =
    "SOVEREIGN-SECURITY-16";

  public readonly version =
    "1.0.0";

  private rules =
    new Map<
      string,
      SovereignSecurityRule
    >();

  private detectors =
    new Map<
      string,
      SovereignThreatDetector
    >();

  private threats =
    new Map<
      string,
      SovereignThreat
    >();

  private incidents =
    new Map<
      string,
      SovereignSecurityIncident
    >();

  private isolatedResources =
    new Set<string>();

  private eventBus?:
    SecurityEventBus;

  private audit?:
    SecurityAudit;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setEventBus(
    eventBus: SecurityEventBus
  ): void {
    this.eventBus =
      eventBus;
  }

  setAudit(
    audit: SecurityAudit
  ): void {
    this.audit =
      audit;
  }

  /* ==========================================================
   * REGISTER RULE
   * ==========================================================
   */

  registerRule(
    rule: SovereignSecurityRule
  ): void {
    if (!rule.id.trim()) {
      throw new Error(
        "Security rule ID is required."
      );
    }

    if (
      this.rules.has(rule.id)
    ) {
      throw new Error(
        `Security rule already exists: ${rule.id}`
      );
    }

    this.rules.set(
      rule.id,
      rule
    );
  }

  /* ==========================================================
   * REGISTER DETECTOR
   * ==========================================================
   */

  registerDetector(
    detector: SovereignThreatDetector
  ): void {
    if (!detector.id.trim()) {
      throw new Error(
        "Threat detector ID is required."
      );
    }

    if (
      this.detectors.has(
        detector.id
      )
    ) {
      throw new Error(
        `Threat detector already exists: ${detector.id}`
      );
    }

    this.detectors.set(
      detector.id,
      detector
    );
  }

  /* ==========================================================
   * ZERO-TRUST EVALUATION
   * ==========================================================
   */

  async evaluate(
    request: SovereignSecurityRequest
  ): Promise<SovereignSecurityDecision> {
    if (!request.policyChecked) {
      return this.deny(
        request,
        100,
        "Sovereign policy validation is required."
      );
    }

    if (
      !request.permissionChecked
    ) {
      return this.deny(
        request,
        100,
        "Permission validation is required."
      );
    }

    if (
      !request.identity.authenticated
    ) {
      return this.deny(
        request,
        100,
        "Identity is not authenticated."
      );
    }

    if (
      this.isolatedResources.has(
        request.resource
      )
    ) {
      return this.deny(
        request,
        100,
        "Resource is isolated by the sovereign security layer."
      );
    }

    /*
     * OWNER is sovereign authority.
     * Authentication and audit remain mandatory.
     */
    if (
      request.identity.authority ===
      "OWNER"
    ) {
      const decision:
        SovereignSecurityDecision = {
        requestId:
          request.id,

        allowed: true,

        riskScore:
          this.riskScore(
            request.riskLevel
          ),

        trustLevel:
          "SOVEREIGN",

        reason:
          "Authenticated sovereign OWNER authority.",

        restrictions: [],

        evaluatedAt:
          this.now(),
      };

      await this.recordAudit(
        "security.evaluate",
        request.id,
        "SUCCESS",
        {
          authority:
            "OWNER",
        }
      );

      return decision;
    }

    const rules =
      this.matchRules(request);

    for (const rule of rules) {
      if (
        this.trustRank(
          request.identity
            .trustLevel
        ) <
        this.trustRank(
          rule.minimumTrustLevel
        )
      ) {
        return this.deny(
          request,
          90,
          `Insufficient trust level for rule ${rule.id}.`,
          rule.restrictions
        );
      }

      if (
        this.severityRank(
          request.riskLevel
        ) >
        this.severityRank(
          rule.maximumRiskLevel
        )
      ) {
        return this.deny(
          request,
          95,
          `Risk exceeds security boundary for rule ${rule.id}.`,
          rule.restrictions
        );
      }
    }

    const detected =
      await this.detectThreats(
        request
      );

    const criticalThreat =
      detected.find(
        (threat) =>
          threat.severity ===
          "CRITICAL"
      );

    if (criticalThreat) {
      return this.deny(
        request,
        100,
        `Critical threat detected: ${criticalThreat.code}.`
      );
    }

    const highThreat =
      detected.find(
        (threat) =>
          threat.severity ===
          "HIGH"
      );

    if (highThreat) {
      return this.deny(
        request,
        85,
        `High security threat detected: ${highThreat.code}.`
      );
    }

    const restrictions =
      Array.from(
        new Set(
          rules.flatMap(
            (rule) =>
              rule.restrictions
          )
        )
      );

    const decision:
      SovereignSecurityDecision = {
      requestId:
        request.id,

      allowed: true,

      riskScore:
        this.riskScore(
          request.riskLevel
        ),

      trustLevel:
        request.identity
          .trustLevel,

      reason:
        "Zero-Trust security validation passed.",

      restrictions,

      evaluatedAt:
        this.now(),
    };

    await this.recordAudit(
      "security.evaluate",
      request.id,
      "SUCCESS",
      {
        actorId:
          request.identity.actorId,

        resource:
          request.resource,

        action:
          request.action,
      }
    );

    return decision;
  }

  /* ==========================================================
   * THREAT DETECTION
   * ==========================================================
   */

  private async detectThreats(
    request: SovereignSecurityRequest
  ): Promise<SovereignThreat[]> {
    const detected:
      SovereignThreat[] = [];

    for (
      const detector of
      this.detectors.values()
    ) {
      if (!detector.enabled) {
        continue;
      }

      try {
        const findings =
          await detector.inspect(
            request
          );

        for (
          const finding of findings
        ) {
          const threat:
            SovereignThreat = {
            id:
              this.createId(
                "THREAT"
              ),

            code:
              finding.code,

            title:
              finding.title,

            description:
              finding.description,

            severity:
              finding.severity,

            status:
              "DETECTED",

            source:
              detector.id,

            actorId:
              request.identity
                .actorId,

            resource:
              request.resource,

            evidence:
              [...finding.evidence],

            detectedAt:
              this.now(),

            updatedAt:
              this.now(),
          };

          this.threats.set(
            threat.id,
            threat
          );

          detected.push(
            threat
          );

          await this.publish(
            "security.threat.detected",
            {
              threatId:
                threat.id,

              code:
                threat.code,

              severity:
                threat.severity,

              resource:
                threat.resource,
            }
          );
        }
      } catch (error) {
        await this.recordAudit(
          "security.detector.error",
          detector.id,
          "FAILED",
          {
            error:
              error instanceof Error
                ? error.message
                : String(error),
          }
        );
      }
    }

    return detected;
  }

  /* ==========================================================
   * CREATE INCIDENT
   * ==========================================================
   */

  async createIncident(
    input: {
      threatIds: string[];

      title: string;

      affectedResources?: string[];

      metadata?: Record<string, unknown>;
    }
  ): Promise<SovereignSecurityIncident> {
    const threats =
      input.threatIds.map(
        (id) => {
          const threat =
            this.threats.get(id);

          if (!threat) {
            throw new Error(
              `Threat not found: ${id}`
            );
          }

          return threat;
        }
      );

    const severity =
      this.highestSeverity(
        threats.map(
          (threat) =>
            threat.severity
        )
      );

    const now =
      this.now();

    const incident:
      SovereignSecurityIncident = {
      id:
        this.createId(
          "SEC-INCIDENT"
        ),

      threatIds:
        [...input.threatIds],

      title:
        input.title,

      severity,

      status:
        "OPEN",

      affectedResources:
        input.affectedResources ??
        Array.from(
          new Set(
            threats
              .map(
                (threat) =>
                  threat.resource
              )
              .filter(
                (
                  resource
                ): resource is string =>
                  Boolean(resource)
              )
          )
        ),

      createdAt:
        now,

      updatedAt:
        now,

      metadata:
        input.metadata,
    };

    this.incidents.set(
      incident.id,
      incident
    );

    await this.publish(
      "security.incident.created",
      {
        incidentId:
          incident.id,

        severity:
          incident.severity,

        threatIds:
          incident.threatIds,
      }
    );

    return incident;
  }

  /* ==========================================================
   * ISOLATE RESOURCE
   * ==========================================================
   */

  async isolateResource(
    resource: string,
    authorizedBy:
      "OWNER" | "STEWARD" | "CORE"
  ): Promise<void> {
    if (!resource.trim()) {
      throw new Error(
        "Resource is required."
      );
    }

    this.isolatedResources.add(
      resource
    );

    await this.publish(
      "security.resource.isolated",
      {
        resource,
        authorizedBy,
      }
    );

    await this.recordAudit(
      "security.resource.isolate",
      resource,
      "SUCCESS",
      {
        authorizedBy,
      }
    );
  }

  /* ==========================================================
   * RELEASE RESOURCE
   * ==========================================================
   */

  async releaseResource(
    resource: string,
    authorizedBy:
      "OWNER" | "STEWARD" | "CORE"
  ): Promise<void> {
    this.isolatedResources.delete(
      resource
    );

    await this.publish(
      "security.resource.released",
      {
        resource,
        authorizedBy,
      }
    );

    await this.recordAudit(
      "security.resource.release",
      resource,
      "SUCCESS",
      {
        authorizedBy,
      }
    );
  }

  /* ==========================================================
   * RESOLVE THREAT
   * ==========================================================
   */

  async resolveThreat(
    threatId: string
  ): Promise<SovereignThreat> {
    const threat =
      this.requireThreat(
        threatId
      );

    threat.status =
      "RESOLVED";

    threat.resolvedAt =
      this.now();

    threat.updatedAt =
      threat.resolvedAt;

    await this.publish(
      "security.threat.resolved",
      {
        threatId:
          threat.id,
      }
    );

    return threat;
  }

  /* ==========================================================
   * RESOLVE INCIDENT
   * ==========================================================
   */

  async resolveIncident(
    incidentId: string
  ): Promise<SovereignSecurityIncident> {
    const incident =
      this.requireIncident(
        incidentId
      );

    incident.status =
      "RESOLVED";

    incident.resolvedAt =
      this.now();

    incident.updatedAt =
      incident.resolvedAt;

    await this.publish(
      "security.incident.resolved",
      {
        incidentId:
          incident.id,
      }
    );

    return incident;
  }

  /* ==========================================================
   * GET / LIST
   * ==========================================================
   */

  getThreat(
    threatId: string
  ): SovereignThreat | undefined {
    return this.threats.get(
      threatId
    );
  }

  listThreats(
    status?: SovereignThreatStatus
  ): SovereignThreat[] {
    const threats =
      Array.from(
        this.threats.values()
      );

    if (!status) {
      return threats;
    }

    return threats.filter(
      (threat) =>
        threat.status === status
    );
  }

  getIncident(
    incidentId: string
  ):
    | SovereignSecurityIncident
    | undefined {
    return this.incidents.get(
      incidentId
    );
  }

  listIncidents():
    SovereignSecurityIncident[] {
    return Array.from(
      this.incidents.values()
    );
  }

  listIsolatedResources():
    string[] {
    return Array.from(
      this.isolatedResources
    );
  }

  /* ==========================================================
   * RULE MATCHING
   * ==========================================================
   */

  private matchRules(
    request: SovereignSecurityRequest
  ): SovereignSecurityRule[] {
    return Array.from(
      this.rules.values()
    )
      .filter(
        (rule) =>
          rule.enabled &&
          (
            rule.resourceTypes
              .length === 0 ||
            rule.resourceTypes.includes(
              request.resourceType
            )
          ) &&
          (
            rule.actions.length ===
              0 ||
            rule.actions.includes(
              "*"
            ) ||
            rule.actions.includes(
       

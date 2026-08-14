/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-DIAGNOSTICS-15
 * ============================================================
 *
 * Purpose:
 * Central Sovereign Diagnostics Engine.
 *
 * Responsibilities:
 * - Diagnose failures reported by Monitoring.
 * - Analyze component health and incidents.
 * - Determine probable root causes.
 * - Generate controlled remediation recommendations.
 * - Verify recovery after authorized repair.
 * - Preserve diagnostic history.
 *
 * Diagnostics NEVER grants itself authority.
 * Diagnostics NEVER performs protected repairs directly.
 *
 * OWNER > STEWARD > CORE > POLICY > DIAGNOSTICS
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. DIAGNOSTIC STATUS
 * ============================================================
 */

export type SovereignDiagnosticStatus =
  | "CREATED"
  | "ANALYZING"
  | "DIAGNOSED"
  | "REMEDIATION_REQUIRED"
  | "VERIFYING"
  | "RESOLVED"
  | "UNRESOLVED"
  | "FAILED";

/* ============================================================
 * 2. SEVERITY
 * ============================================================
 */

export type SovereignDiagnosticSeverity =
  | "INFO"
  | "WARNING"
  | "ERROR"
  | "CRITICAL";

/* ============================================================
 * 3. COMPONENT TYPE
 * ============================================================
 */

export type DiagnosticComponentType =
  | "CORE"
  | "RUNTIME"
  | "PLANNING"
  | "EXECUTION"
  | "AGENT"
  | "CAPABILITY"
  | "MEMORY"
  | "EVENTS"
  | "JOBS"
  | "MONITORING"
  | "SECURITY"
  | "BUILD"
  | "DEPLOYMENT"
  | "DATABASE"
  | "NETWORK"
  | "SYSTEM"
  | "CUSTOM";

/* ============================================================
 * 4. DIAGNOSTIC SIGNAL
 * ============================================================
 */

export interface SovereignDiagnosticSignal {
  source: string;

  code: string;

  message: string;

  severity: SovereignDiagnosticSeverity;

  timestamp: string;

  data?: Record<string, unknown>;
}

/* ============================================================
 * 5. DIAGNOSTIC REQUEST
 * ============================================================
 */

export interface SovereignDiagnosticRequest {
  id?: string;

  componentId: string;

  componentType: DiagnosticComponentType;

  requestedBy: string;

  reason: string;

  signals: SovereignDiagnosticSignal[];

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. ROOT CAUSE
 * ============================================================
 */

export interface SovereignRootCause {
  id: string;

  code: string;

  title: string;

  description: string;

  confidence: number;

  severity: SovereignDiagnosticSeverity;

  evidence: string[];

  componentId: string;

  detectedAt: string;
}

/* ============================================================
 * 7. REMEDIATION
 * ============================================================
 */

export type RemediationRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignRemediation {
  id: string;

  diagnosticId: string;

  action: string;

  description: string;

  risk: RemediationRisk;

  requiresApproval: boolean;

  requiredAuthority:
    | "CORE"
    | "STEWARD"
    | "OWNER";

  executableBy?: string;

  parameters?: Record<string, unknown>;

  createdAt: string;
}

/* ============================================================
 * 8. DIAGNOSTIC RECORD
 * ============================================================
 */

export interface SovereignDiagnosticRecord {
  id: string;

  componentId: string;

  componentType: DiagnosticComponentType;

  requestedBy: string;

  reason: string;

  status: SovereignDiagnosticStatus;

  severity: SovereignDiagnosticSeverity;

  signals: SovereignDiagnosticSignal[];

  rootCauses: SovereignRootCause[];

  remediations: SovereignRemediation[];

  createdAt: string;

  updatedAt: string;

  completedAt?: string;

  error?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 9. ANALYZER
 * ============================================================
 */

export interface SovereignDiagnosticAnalyzer {
  analyze(
    diagnostic: SovereignDiagnosticRecord
  ): Promise<{
    rootCauses: Array<{
      code: string;

      title: string;

      description: string;

      confidence: number;

      severity: SovereignDiagnosticSeverity;

      evidence: string[];
    }>;

    remediations?: Array<{
      action: string;

      description: string;

      risk: RemediationRisk;

      requiresApproval: boolean;

      requiredAuthority:
        | "CORE"
        | "STEWARD"
        | "OWNER";

      executableBy?: string;

      parameters?: Record<string, unknown>;
    }>;
  }>;
}

/* ============================================================
 * 10. RECOVERY VERIFIER
 * ============================================================
 */

export interface SovereignRecoveryVerifier {
  verify(
    diagnostic: SovereignDiagnosticRecord
  ): Promise<{
    recovered: boolean;

    message: string;

    evidence?: Record<string, unknown>;
  }>;
}

/* ============================================================
 * 11. ACCESS CONTEXT
 * ============================================================
 */

export interface DiagnosticAccessContext {
  actorId: string;

  authority:
    | "OWNER"
    | "STEWARD"
    | "CORE"
    | "AGENT"
    | "SYSTEM";

  policyChecked: boolean;

  permissionChecked: boolean;

  permissions: string[];
}

/* ============================================================
 * 12. ACCESS VALIDATOR
 * ============================================================
 */

export interface DiagnosticAccessValidator {
  validate(
    operation:
      | "CREATE"
      | "ANALYZE"
      | "RECOMMEND"
      | "VERIFY",
    context: DiagnosticAccessContext,
    diagnostic?: SovereignDiagnosticRecord
  ): {
    allowed: boolean;

    reason?: string;
  };
}

/* ============================================================
 * 13. EVENT BUS
 * ============================================================
 */

export interface DiagnosticEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    diagnosticId: string;

    componentId: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 14. AUDIT
 * ============================================================
 */

export interface DiagnosticAudit {
  record(
    operation: string,
    diagnosticId: string | undefined,
    result:
      | "SUCCESS"
      | "FAILED"
      | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 15. DIAGNOSTICS ENGINE
 * ============================================================
 */

export class SovereignDiagnosticsEngine {
  public readonly id =
    "SOVEREIGN-DIAGNOSTICS-15";

  public readonly version =
    "1.0.0";

  private diagnostics =
    new Map<
      string,
      SovereignDiagnosticRecord
    >();

  private analyzer?:
    SovereignDiagnosticAnalyzer;

  private verifier?:
    SovereignRecoveryVerifier;

  private accessValidator?:
    DiagnosticAccessValidator;

  private eventBus?:
    DiagnosticEventBus;

  private audit?:
    DiagnosticAudit;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setAnalyzer(
    analyzer: SovereignDiagnosticAnalyzer
  ): void {
    this.analyzer =
      analyzer;
  }

  setRecoveryVerifier(
    verifier: SovereignRecoveryVerifier
  ): void {
    this.verifier =
      verifier;
  }

  setAccessValidator(
    validator: DiagnosticAccessValidator
  ): void {
    this.accessValidator =
      validator;
  }

  setEventBus(
    eventBus: DiagnosticEventBus
  ): void {
    this.eventBus =
      eventBus;
  }

  setAudit(
    audit: DiagnosticAudit
  ): void {
    this.audit =
      audit;
  }

  /* ==========================================================
   * CREATE DIAGNOSTIC
   * ==========================================================
   */

  async create(
    request: SovereignDiagnosticRequest,
    context: DiagnosticAccessContext
  ): Promise<SovereignDiagnosticRecord> {
    this.requireAccess(
      "CREATE",
      context
    );

    if (!request.componentId.trim()) {
      throw new Error(
        "Diagnostic component ID is required."
      );
    }

    if (!request.reason.trim()) {
      throw new Error(
        "Diagnostic reason is required."
      );
    }

    const now =
      this.now();

    const diagnostic:
      SovereignDiagnosticRecord = {
      id:
        request.id ??
        this.createId(
          "DIAGNOSTIC"
        ),

      componentId:
        request.componentId,

      componentType:
        request.componentType,

      requestedBy:
        request.requestedBy,

      reason:
        request.reason,

      status:
        "CREATED",

      severity:
        this.highestSeverity(
          request.signals
        ),

      signals:
        [...request.signals],

      rootCauses: [],

      remediations: [],

      createdAt:
        now,

      updatedAt:
        now,

      metadata:
        request.metadata,
    };

    this.diagnostics.set(
      diagnostic.id,
      diagnostic
    );

    await this.publish(
      "diagnostics.created",
      diagnostic,
      {
        severity:
          diagnostic.severity,

        signalCount:
          diagnostic.signals.length,
      }
    );

    await this.recordAudit(
      "diagnostics.create",
      diagnostic.id,
      "SUCCESS"
    );

    return diagnostic;
  }

  /* ==========================================================
   * ANALYZE
   * ==========================================================
   */

  async analyze(
    diagnosticId: string,
    context: DiagnosticAccessContext
  ): Promise<SovereignDiagnosticRecord> {
    const diagnostic =
      this.requireDiagnostic(
        diagnosticId
      );

    this.requireAccess(
      "ANALYZE",
      context,
      diagnostic
    );

    if (!this.analyzer) {
      throw new Error(
        "Sovereign diagnostic analyzer is not configured."
      );
    }

    diagnostic.status =
      "ANALYZING";

    diagnostic.updatedAt =
      this.now();

    await this.publish(
      "diagnostics.analysis.started",
      diagnostic,
      {}
    );

    try {
      const result =
        await this.analyzer.analyze(
          diagnostic
        );

      diagnostic.rootCauses =
        result.rootCauses.map(
          (cause) => ({
            id:
              this.createId(
                "ROOT-CAUSE"
              ),

            code:
              cause.code,

            title:
              cause.title,

            description:
              cause.description,

            confidence:
              this.normalizeConfidence(
                cause.confidence
              ),

            severity:
              cause.severity,

            evidence:
              [...cause.evidence],

            componentId:
              diagnostic.componentId,

            detectedAt:
              this.now(),
          })
        );

      diagnostic.remediations =
        (
          result.remediations ??
          []
        ).map(
          (remediation) => ({
            id:
              this.createId(
                "REMEDIATION"
              ),

            diagnosticId:
              diagnostic.id,

            action:
              remediation.action,

            description:
              remediation.description,

            risk:
              remediation.risk,

            requiresApproval:
              remediation.requiresApproval,

            requiredAuthority:
              remediation.requiredAuthority,

            executableBy:
              remediation.executableBy,

            parameters:
              remediation.parameters,

            createdAt:
              this.now(),
          })
        );

      diagnostic.status =
        diagnostic.remediations
          .length > 0
          ? "REMEDIATION_REQUIRED"
          : "DIAGNOSED";

      diagnostic.updatedAt =
        this.now();

      await this.publish(
        "diagnostics.analysis.completed",
        diagnostic,
        {
          rootCauseCount:
            diagnostic.rootCauses.length,

          remediationCount:
            diagnostic.remediations.length,
        }
      );

      await this.recordAudit(
        "diagnostics.analyze",
        diagnostic.id,
        "SUCCESS"
      );

      return diagnostic;
    } catch (error) {
      diagnostic.status =
        "FAILED";

      diagnostic.error =
        error instanceof Error
          ? error.message
          : String(error);

      diagnostic.updatedAt =
        this.now();

      await this.publish(
        "diagnostics.analysis.failed",
        diagnostic,
        {
          error:
            diagnostic.error,
        }
      );

      await this.recordAudit(
        "diagnostics.analyze",
        diagnostic.id,
        "FAILED",
        {
          error:
            diagnostic.error,
        }
      );

      return diagnostic;
    }
  }

  /* ==========================================================
   * ADD SIGNAL
   * ==========================================================
   */

  async addSignal(
    diagnosticId: string,
    signal: SovereignDiagnosticSignal,
    context: DiagnosticAccessContext
  ): Promise<SovereignDiagnosticRecord> {
    const diagnostic =
      this.requireDiagnostic(
        diagnosticId
      );

    this.requireAccess(
      "CREATE",
      context,
      diagnostic
    );

    diagnostic.signals.push(
      signal
    );

    diagnostic.severity =
      this.highestSeverity(
        diagnostic.signals
      );

    diagnostic.updatedAt =
      this.now();

    await this.publish(
      "diagnostics.signal.added",
      diagnostic,
      {
        signalCode:
          signal.code,

        severity:
          signal.severity,
      }
    );

    return diagnostic;
  }

  /* ==========================================================
   * VERIFY RECOVERY
   * ==========================================================
   */

  async verifyRecovery(
    diagnosticId: string,
    context: DiagnosticAccessContext
  ): Promise<{
    diagnostic:
      SovereignDiagnosticRecord;

    recovered: boolean;

    message: string;

    evidence?: Record<string, unknown>;
  }> {
    const diagnostic =
      this.requireDiagnostic(
        diagnosticId
      );

    this.requireAccess(
      "VERIFY",
      context,
      diagnostic
    );

    if (!this.verifier) {
      throw new Error(
        "Recovery verifier is not configured."
      );
    }

    diagnostic.status =
      "VERIFYING";

    diagnostic.updatedAt =
      this.now();

    const result =
      await this.verifier.verify(
        diagnostic
      );

    diagnostic.status =
      result.recovered
        ? "RESOLVED"
        : "UNRESOLVED";

    diagnostic.updatedAt =
      this.now();

    if (result.recovered) {
      diagnostic.completedAt =
        this.now();
    }

    await this.publish(
      result.recovered
        ? "diagnostics.resolved"
        : "diagnostics.unresolved",
      diagnostic,
      {
        message:
          result.message,

        evidence:
          result.evidence,
      }
    );

    await this.recordAudit(
      "diagnostics.verify",
      diagnostic.id,
      result.recovered
        ? "SUCCESS"
        : "FAILED",
      {
        message:
          result.message,
      }
    );

    return {
      diagnostic,

      recovered:
        result.recovered,

      message:
        result.message,

      evidence:
        result.evidence,
    };
  }

  /* ==========================================================
   * GET REMEDIATIONS
   * ==========================================================
   */

  getRemediations(
    diagnosticId: string
  ): SovereignRemediation[] {
    const diagnostic =
      this.requireDiagnostic(
        diagnosticId
      );

    return [
      ...diagnostic.remediations,
    ];
  }

  /* ==========================================================
   * GET DIAGNOSTIC
   * ==========================================================
   */

  get(
    diagnosticId: string
  ):
    | SovereignDiagnosticRecord
    | undefined {
    return this.diagnostics.get(
      diagnosticId
    );
  }

  /* ==========================================================
   * LIST
   * ==========================================================
   */

  list(
    status?: SovereignDiagnosticStatus
  ): SovereignDiagnosticRecord[] {
    const diagnostics =
      Array.from(
        this.diagnostics.values()
      );

    if (!status) {
      return diagnostics;
    }

    return diagnostics.filter(
      (diagnostic) =>
        diagnostic.status ===
        status
    );
  }

  /* ==========================================================
   * COMPONENT HISTORY
   * ==========================================================
   */

  getComponentHistory(
    componentId: string
  ): SovereignDiagnosticRecord[] {
    return this.list()
      .filter(
        (diagnostic) =>
          diagnostic.componentId ===
          componentId
      )
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(
            a.createdAt
          )
      );
  }

  /* ==========================================================
   * STATISTICS
   * ==========================================================
   */

  statistics(): {
    total: number;

    analyzing: number;

    diagnosed: number;

    remediationRequired: number;

    resolved: number;

    unresolved: number;

    failed: number;

    critical: number;
  } {
    const diagnostics =
      this.list();

    return {
      total:
        diagnostics.length,

      analyzing:
        diagnostics.filter(
          (item) =>
            item.status ===
            "ANALYZING"
        ).length,

      diagnosed:
        diagnostics.filter(
          (item) =>
            item.status ===
            "DIAGNOSED"
        ).length,

      remediationRequired:
        diagnostics.filter(
          (item) =>
            item.status ===
            "REMEDIATION_REQUIRED"
        ).length,

      resolved:
        diagnostics.filter(
          (item) =>
            item.status ===
            "RESOLVED"
        ).length,

      unresolved:
        diagnostics.filter(
          (item) =>
            item.status ===
            "UNRESOLVED"
        ).length,

      failed:
        diagnostics.filter(
          (item) =>
            item.status ===
            "FAILED"
        ).length,

      critical:
        diagnostics.filter(
          (item) =>
            item.severity ===
            "CRITICAL"
        ).length,
    };
  }

  /* ==========================================================
   * ACCESS
   * ==========================================================
   */

  private requireAccess(
    operation:
      | "CREATE"
      | "ANALYZE"
      | "RECOMMEND"
      | "VERIFY",
    context: DiagnosticAccessContext,
    diagnostic?:
      SovereignDiagnosticRecord
  ): void {
    if (!context.policyChecked) {
      throw new Error(
        "Diagnostic operation blocked: policy check required."
      );
    }

    if (
      !context.permissionChecked
    ) {
      throw new Error(
        "Diagnostic operation blocked: permission check required."
      );
    }

    if (this.accessValidator) {
      const result =
        this.accessValidator.validate(
          operation,
          context,
          diagnostic
        );

      if 

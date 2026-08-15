// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-READINESS-GATE-128.ts
// Sequence: 128
// Purpose: Sovereign Operational Readiness Gate & Safe Execution Admission
// ============================================================================

export const SOVEREIGN_OPERATIONS_READINESS_GATE_ID =
  "SOVEREIGN-OPERATIONS-READINESS-GATE-128";

export const SOVEREIGN_OPERATIONS_READINESS_GATE_VERSION =
  "1.0.0";

export type SovereignReadinessState =
  | "READY"
  | "READY_WITH_RESTRICTIONS"
  | "NOT_READY"
  | "BLOCKED";

export type SovereignReadinessDecision =
  | "ALLOW"
  | "ALLOW_RESTRICTED"
  | "DEFER"
  | "BLOCK";

export interface SovereignReadinessAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignReadinessSignals {
  healthApproved: boolean;
  dependenciesApproved: boolean;
  admissionApproved: boolean;

  configurationReady: boolean;
  secretsReady: boolean;
  storageReady: boolean;
  networkReady: boolean;

  runtimeReady: boolean;
  workersReady: boolean;

  modelReady?: boolean;
  artifactReady?: boolean;

  capacityAvailable: boolean;

  rollbackAvailable?: boolean;
  recoveryAvailable?: boolean;

  securityApproved: boolean;
  policyApproved: boolean;
}

export interface SovereignReadinessRequest {
  readinessId: string;
  operationId: string;

  requestedBy: string;
  target: string;

  authorityContext: SovereignReadinessAuthorityContext;

  signals: SovereignReadinessSignals;

  requiresModel?: boolean;
  requiresArtifact?: boolean;
  requiresRollback?: boolean;
  requiresRecovery?: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignReadinessRecord {
  readinessId: string;
  operationId: string;

  requestedBy: string;
  target: string;

  state: SovereignReadinessState;
  decision: SovereignReadinessDecision;

  reasons: string[];

  createdAt: number;
  evaluatedAt: number;

  authority: "NONE";
}

export interface SovereignReadinessResult {
  readinessId: string;
  operationId: string;

  accepted: boolean;

  state: SovereignReadinessState;
  decision: SovereignReadinessDecision;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsReadinessGate {
  public readonly id =
    SOVEREIGN_OPERATIONS_READINESS_GATE_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_READINESS_GATE_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly readinessGateCanCreateAuthority = false;
  public readonly readinessGateCanEscalateAuthority = false;
  public readonly readinessGateCanOverrideOwner = false;
  public readonly readinessGateCanBypassSecurity = false;
  public readonly readinessGateCanIgnoreMissingSecrets = false;
  public readonly readinessGateCanIgnoreCapacity = false;
  public readonly readinessGateCanDisableAudit = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignReadinessRecord>();

  private validateAuthority(
    request: SovereignReadinessRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.authorityContext.ownerId) {
      reasons.push("OWNER_ID_REQUIRED");
    }

    if (
      request.authorityContext.ownerAuthority !==
      "SUPREME"
    ) {
      reasons.push("OWNER_MUST_REMAIN_SUPREME");
    }

    if (
      request.authorityContext.stewardAuthority !==
      "DELEGATED"
    ) {
      reasons.push("STEWARD_MUST_REMAIN_DELEGATED");
    }

    if (!request.requestedBy) {
      reasons.push("REQUESTER_REQUIRED");
    }

    return reasons;
  }

  private evaluateSignals(
    request: SovereignReadinessRequest
  ): {
    state: SovereignReadinessState;
    decision: SovereignReadinessDecision;
    reasons: string[];
  } {
    const reasons: string[] = [];
    const signals = request.signals;

    if (!signals.securityApproved) {
      reasons.push("SECURITY_APPROVAL_REQUIRED");
    }

    if (!signals.policyApproved) {
      reasons.push("POLICY_APPROVAL_REQUIRED");
    }

    if (!signals.healthApproved) {
      reasons.push("HEALTH_GATE_NOT_APPROVED");
    }

    if (!signals.dependenciesApproved) {
      reasons.push("DEPENDENCIES_NOT_APPROVED");
    }

    if (!signals.admissionApproved) {
      reasons.push("ADMISSION_NOT_APPROVED");
    }

    if (!signals.configurationReady) {
      reasons.push("CONFIGURATION_NOT_READY");
    }

    if (!signals.secretsReady) {
      reasons.push("SECRETS_NOT_READY");
    }

    if (!signals.storageReady) {
      reasons.push("STORAGE_NOT_READY");
    }

    if (!signals.networkReady) {
      reasons.push("NETWORK_NOT_READY");
    }

    if (!signals.runtimeReady) {
      reasons.push("RUNTIME_NOT_READY");
    }

    if (!signals.workersReady) {
      reasons.push("WORKERS_NOT_READY");
    }

    if (!signals.capacityAvailable) {
      reasons.push("CAPACITY_NOT_AVAILABLE");
    }

    if (
      request.requiresModel &&
      signals.modelReady !== true
    ) {
      reasons.push("MODEL_NOT_READY");
    }

    if (
      request.requiresArtifact &&
      signals.artifactReady !== true
    ) {
      reasons.push("ARTIFACT_NOT_READY");
    }

    if (
      request.requiresRollback &&
      signals.rollbackAvailable !== true
    ) {
      reasons.push("ROLLBACK_NOT_AVAILABLE");
    }

    if (
      request.requiresRecovery &&
      signals.recoveryAvailable !== true
    ) {
      reasons.push("RECOVERY_NOT_AVAILABLE");
    }

    if (reasons.length === 0) {
      return {
        state: "READY",
        decision: "ALLOW",
        reasons: []
      };
    }

    const hardBlocks = new Set([
      "SECURITY_APPROVAL_REQUIRED",
      "POLICY_APPROVAL_REQUIRED",
      "SECRETS_NOT_READY",
      "RUNTIME_NOT_READY",
      "ROLLBACK_NOT_AVAILABLE",
      "RECOVERY_NOT_AVAILABLE"
    ]);

    if (
      reasons.some(
        (reason) => hardBlocks.has(reason)
      )
    ) {
      return {
        state: "BLOCKED",
        decision: "BLOCK",
        reasons
      };
    }

    const deferReasons = new Set([
      "HEALTH_GATE_NOT_APPROVED",
      "DEPENDENCIES_NOT_APPROVED",
      "ADMISSION_NOT_APPROVED",
      "CONFIGURATION_NOT_READY",
      "STORAGE_NOT_READY",
      "NETWORK_NOT_READY",
      "WORKERS_NOT_READY",
      "CAPACITY_NOT_AVAILABLE",
      "MODEL_NOT_READY",
      "ARTIFACT_NOT_READY"
    ]);

    if (
      reasons.some(
        (reason) => deferReasons.has(reason)
      )
    ) {
      return {
        state: "NOT_READY",
        decision: "DEFER",
        reasons
      };
    }

    return {
      state: "READY_WITH_RESTRICTIONS",
      decision: "ALLOW_RESTRICTED",
      reasons
    };
  }

  public evaluate(
    request: SovereignReadinessRequest
  ): SovereignReadinessResult {
    const now = Date.now();

    if (
      this.records.has(request.readinessId)
    ) {
      return this.failure(
        request.readinessId,
        request.operationId,
        "READINESS_ALREADY_EXISTS"
      );
    }

    const reasons =
      this.validateAuthority(request);

    if (!request.readinessId) {
      reasons.push("READINESS_ID_REQUIRED");
    }

    if (!request.operationId) {
      reasons.push("OPERATION_ID_REQUIRED");
    }

    if (!request.target) {
      reasons.push("TARGET_REQUIRED");
    }

    if (reasons.length > 0) {
      return {
        readinessId: request.readinessId,
        operationId: request.operationId,

        accepted: false,

        state: "BLOCKED",
        decision: "BLOCK",

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const evaluation =
      this.evaluateSignals(request);

    const record: SovereignReadinessRecord = {
      readinessId: request.readinessId,
      operationId: request.operationId,

      requestedBy: request.requestedBy,
      target: request.target,

      state: evaluation.state,
      decision: evaluation.decision,

      reasons: [...evaluation.reasons],

      createdAt: request.createdAt,
      evaluatedAt: now,

      authority: "NONE"
    };

    this.records.set(
      record.readinessId,
      record
    );

    return this.result(record);
  }

  public reevaluate(
    readinessId: string,
    request: SovereignReadinessRequest
  ): SovereignReadinessResult {
    const record =
      this.records.get(readinessId);

    if (!record) {
      return this.failure(
        readinessId,
        request.operationId,
        "READINESS_NOT_FOUND"
      );
    }

    const evaluation =
      this.evaluateSignals(request);

    record.state =
      evaluation.state;

    record.decision =
      evaluation.decision;

    record.reasons = [
      ...evaluation.reasons
    ];

    record.evaluatedAt =
      Date.now();

    this.records.set(
      readinessId,
      record
    );

    return this.result(record);
  }

  public canProceed(
    readinessId: string
  ): boolean {
    const record =
      this.records.get(readinessId);

    if (!record) {
      return false;
    }

    return (
      record.decision === "ALLOW" ||
      record.decision ===
        "ALLOW_RESTRICTED"
    );
  }

  public shouldDefer(
    readinessId: string
  ): boolean {
    return (
      this.records.get(readinessId)
        ?.decision === "DEFER"
    );
  }

  public getRecord(
    readinessId: string
  ): SovereignReadinessRecord | undefined {
    const record =
      this.records.get(readinessId);

    return record
      ? {
          ...record,
          reasons: [...record.reasons]
        }
      : undefined;
  }

  public getBlocked():
    SovereignReadinessRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state === "BLOCKED"
      )
      .map((record) => ({
        ...record,
        reasons: [...record.reasons]
      }));
  }

  public getDeferred():
    SovereignReadinessRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state === "NOT_READY"
      )
      .map((record) => ({
        ...record,
        reasons: [...record.reasons]
      }));
  }

  private result(
    record: SovereignReadinessRecord
  ): SovereignReadinessResult {
    return {
      readinessId: record.readinessId,
      operationId: record.operationId,

      accepted:
        record.decision === "ALLOW" ||
        record.decision ===
          "ALLOW_RESTRICTED",

      state: record.state,
      decision: record.decision,

      reasons: [...record.reasons],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  private failure(
    readinessId: string,
    operationId: string,
    reason: string
  ): SovereignReadinessResult {
    return {
      readinessId,
      operationId,

      accepted: false,

      state: "BLOCKED",
      decision: "BLOCK",

      reasons: [reason],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  public assertSovereignty(): boolean {
    return (
      this.authority === "NONE" &&
      this.ownerAuthority === "SUPREME" &&
      this.stewardAuthority === "DELEGATED" &&
      this.readinessGateCanCreateAuthority === false &&
      this.readinessGateCanEscalateAuthority === false &&
      this.readinessGateCanOverrideOwner === false &&
      this.readinessGateCanBypassSecurity === false &&
      this.readinessGateCanIgnoreMissingSecrets === false &&
      this.readinessGateCanIgnoreCapacity === false &&
      this.readinessGateCanDisableAudit === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsReadinessGate =
  new SovereignOperationsReadinessGate();

export default sovereignOperationsReadinessGate;

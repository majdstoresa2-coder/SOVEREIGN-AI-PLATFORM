// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-ADMISSION-CONTROLLER-125.ts
// Sequence: 125
// Purpose: Sovereign Operation Admission, Safety & Capacity Decision Control
// ============================================================================

export const SOVEREIGN_OPERATIONS_ADMISSION_CONTROLLER_ID =
  "SOVEREIGN-OPERATIONS-ADMISSION-CONTROLLER-125";

export const SOVEREIGN_OPERATIONS_ADMISSION_CONTROLLER_VERSION =
  "1.0.0";

export type SovereignAdmissionDecision =
  | "ALLOW"
  | "ALLOW_RESTRICTED"
  | "DEFER"
  | "REJECT"
  | "BLOCK";

export type SovereignAdmissionState =
  | "OPEN"
  | "RESTRICTED"
  | "DEFERRED"
  | "REJECTED"
  | "BLOCKED";

export interface SovereignAdmissionAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignAdmissionSignals {
  securityApproved: boolean;
  policyApproved: boolean;
  reliabilityApproved: boolean;

  circuitDecision:
    | "ALLOW"
    | "PROBE"
    | "BLOCK";

  bulkheadDecision:
    | "ALLOW"
    | "QUEUE"
    | "REJECT"
    | "ISOLATE";

  backpressureDecision:
    | "ACCEPT"
    | "THROTTLE"
    | "DEFER"
    | "REJECT";

  rateLimitDecision:
    | "ALLOW"
    | "ALLOW_BURST"
    | "THROTTLE"
    | "REJECT";

  activeIncident: boolean;

  recoveryOperation?: boolean;
  rollbackOperation?: boolean;
}

export interface SovereignAdmissionRequest {
  admissionId: string;
  operationId: string;

  requestedBy: string;
  target: string;

  authorityContext: SovereignAdmissionAuthorityContext;

  signals: SovereignAdmissionSignals;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignAdmissionRecord {
  admissionId: string;
  operationId: string;

  requestedBy: string;
  target: string;

  state: SovereignAdmissionState;
  decision: SovereignAdmissionDecision;

  reasons: string[];

  createdAt: number;
  evaluatedAt: number;

  authority: "NONE";
}

export interface SovereignAdmissionResult {
  admissionId: string;
  operationId: string;

  accepted: boolean;

  state: SovereignAdmissionState;
  decision: SovereignAdmissionDecision;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsAdmissionController {
  public readonly id =
    SOVEREIGN_OPERATIONS_ADMISSION_CONTROLLER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_ADMISSION_CONTROLLER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly admissionControllerCanCreateAuthority = false;
  public readonly admissionControllerCanEscalateAuthority = false;
  public readonly admissionControllerCanOverrideOwner = false;
  public readonly admissionControllerCanBypassSecurity = false;
  public readonly admissionControllerCanBypassPolicy = false;
  public readonly admissionControllerCanIgnoreCapacity = false;
  public readonly admissionControllerCanDisableAudit = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignAdmissionRecord>();

  private validateAuthority(
    request: SovereignAdmissionRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.authorityContext.ownerId) {
      reasons.push("OWNER_ID_REQUIRED");
    }

    if (
      request.authorityContext.ownerAuthority !==
      "SUPREME"
    ) {
      reasons.push(
        "OWNER_MUST_REMAIN_SUPREME"
      );
    }

    if (
      request.authorityContext.stewardAuthority !==
      "DELEGATED"
    ) {
      reasons.push(
        "STEWARD_MUST_REMAIN_DELEGATED"
      );
    }

    if (!request.requestedBy) {
      reasons.push("REQUESTER_REQUIRED");
    }

    return reasons;
  }

  private evaluateSignals(
    signals: SovereignAdmissionSignals
  ): {
    decision: SovereignAdmissionDecision;
    state: SovereignAdmissionState;
    reasons: string[];
  } {
    const reasons: string[] = [];

    if (!signals.securityApproved) {
      reasons.push(
        "SECURITY_APPROVAL_REQUIRED"
      );
    }

    if (!signals.policyApproved) {
      reasons.push(
        "POLICY_APPROVAL_REQUIRED"
      );
    }

    if (!signals.reliabilityApproved) {
      reasons.push(
        "RELIABILITY_APPROVAL_REQUIRED"
      );
    }

    if (reasons.length > 0) {
      return {
        decision: "BLOCK",
        state: "BLOCKED",
        reasons
      };
    }

    if (
      signals.activeIncident &&
      !signals.recoveryOperation &&
      !signals.rollbackOperation
    ) {
      return {
        decision: "BLOCK",
        state: "BLOCKED",
        reasons: [
          "ACTIVE_INCIDENT_BLOCKING_OPERATION"
        ]
      };
    }

    if (signals.circuitDecision === "BLOCK") {
      return {
        decision: "REJECT",
        state: "REJECTED",
        reasons: [
          "CIRCUIT_BREAKER_BLOCKED"
        ]
      };
    }

    if (
      signals.bulkheadDecision === "ISOLATE"
    ) {
      return {
        decision: "BLOCK",
        state: "BLOCKED",
        reasons: [
          "BULKHEAD_PARTITION_ISOLATED"
        ]
      };
    }

    if (
      signals.bulkheadDecision === "REJECT"
    ) {
      return {
        decision: "REJECT",
        state: "REJECTED",
        reasons: [
          "BULKHEAD_CAPACITY_REJECTED"
        ]
      };
    }

    if (
      signals.backpressureDecision ===
      "REJECT"
    ) {
      return {
        decision: "REJECT",
        state: "REJECTED",
        reasons: [
          "BACKPRESSURE_REJECTED"
        ]
      };
    }

    if (
      signals.rateLimitDecision ===
      "REJECT"
    ) {
      return {
        decision: "REJECT",
        state: "REJECTED",
        reasons: [
          "RATE_LIMIT_REJECTED"
        ]
      };
    }

    if (
      signals.backpressureDecision ===
        "DEFER" ||
      signals.rateLimitDecision ===
        "THROTTLE"
    ) {
      return {
        decision: "DEFER",
        state: "DEFERRED",
        reasons: [
          "OPERATION_DEFERRED_FOR_CAPACITY"
        ]
      };
    }

    if (
      signals.bulkheadDecision === "QUEUE" ||
      signals.backpressureDecision ===
        "THROTTLE" ||
      signals.circuitDecision === "PROBE" ||
      signals.rateLimitDecision ===
        "ALLOW_BURST"
    ) {
      return {
        decision: "ALLOW_RESTRICTED",
        state: "RESTRICTED",
        reasons: [
          "OPERATION_ALLOWED_WITH_RESTRICTIONS"
        ]
      };
    }

    return {
      decision: "ALLOW",
      state: "OPEN",
      reasons: []
    };
  }

  public evaluate(
    request: SovereignAdmissionRequest
  ): SovereignAdmissionResult {
    const now = Date.now();

    if (this.records.has(request.admissionId)) {
      return this.failure(
        request.admissionId,
        request.operationId,
        "ADMISSION_ALREADY_EXISTS"
      );
    }

    const reasons =
      this.validateAuthority(request);

    if (!request.admissionId) {
      reasons.push(
        "ADMISSION_ID_REQUIRED"
      );
    }

    if (!request.operationId) {
      reasons.push(
        "OPERATION_ID_REQUIRED"
      );
    }

    if (!request.target) {
      reasons.push("TARGET_REQUIRED");
    }

    if (reasons.length > 0) {
      return {
        admissionId: request.admissionId,
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
      this.evaluateSignals(
        request.signals
      );

    const record: SovereignAdmissionRecord = {
      admissionId: request.admissionId,
      operationId: request.operationId,

      requestedBy: request.requestedBy,
      target: request.target,

      state: evaluation.state,
      decision: evaluation.decision,

      reasons: [
        ...evaluation.reasons
      ],

      createdAt: request.createdAt,
      evaluatedAt: now,

      authority: "NONE"
    };

    this.records.set(
      record.admissionId,
      record
    );

    return this.result(record);
  }

  public reevaluate(
    admissionId: string,
    signals: SovereignAdmissionSignals
  ): SovereignAdmissionResult {
    const record =
      this.records.get(admissionId);

    if (!record) {
      return this.failure(
        admissionId,
        "",
        "ADMISSION_NOT_FOUND"
      );
    }

    const evaluation =
      this.evaluateSignals(signals);

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
      admissionId,
      record
    );

    return this.result(record);
  }

  public canProceed(
    admissionId: string
  ): boolean {
    const record =
      this.records.get(admissionId);

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
    admissionId: string
  ): boolean {
    return (
      this.records.get(admissionId)
        ?.decision === "DEFER"
    );
  }

  public getRecord(
    admissionId: string
  ): SovereignAdmissionRecord | undefined {
    const record =
      this.records.get(admissionId);

    return record
      ? {
          ...record,
          reasons: [
            ...record.reasons
          ]
        }
      : undefined;
  }

  public getBlocked():
    SovereignAdmissionRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state === "BLOCKED" ||
          record.state === "REJECTED"
      )
      .map((record) => ({
        ...record,
        reasons: [
          ...record.reasons
        ]
      }));
  }

  public getDeferred():
    SovereignAdmissionRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state === "DEFERRED"
      )
      .map((record) => ({
        ...record,
        reasons: [
          ...record.reasons
        ]
      }));
  }

  private result(
    record: SovereignAdmissionRecord
  ): SovereignAdmissionResult {
    return {
      admissionId: record.admissionId,
      operationId: record.operationId,

      accepted:
        record.decision === "ALLOW" ||
        record.decision ===
          "ALLOW_RESTRICTED",

      state: record.state,
      decision: record.decision,

      reasons: [
        ...record.reasons
      ],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  private failure(
    admissionId: string,
    operationId: string,
    reason: string
  ): SovereignAdmissionResult {
    return {
      admissionId,
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
      this.admissionControllerCanCreateAuthority === false &&
      this.admissionControllerCanEscalateAuthority === false &&
      this.admissionControllerCanOverrideOwner === false &&
      this.admissionControllerCanBypassSecurity === false &&
      this.admissionControllerCanBypassPolicy === false &&
      this.admissionControllerCanIgnoreCapacity === false &&
      this.admissionControllerCanDisableAudit === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsAdmissionController =
  new SovereignOperationsAdmissionController();

export default sovereignOperationsAdmissionController;

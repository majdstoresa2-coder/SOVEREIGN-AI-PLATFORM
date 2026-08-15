// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-FAILOVER-CONTROLLER-136.ts
// Sequence: 136
// Purpose: Sovereign Failover, Standby Promotion & Split-Brain Prevention
// ============================================================================

export const SOVEREIGN_OPERATIONS_FAILOVER_CONTROLLER_ID =
  "SOVEREIGN-OPERATIONS-FAILOVER-CONTROLLER-136";

export const SOVEREIGN_OPERATIONS_FAILOVER_CONTROLLER_VERSION =
  "1.0.0";

export type SovereignFailoverState =
  | "REGISTERED"
  | "MONITORING"
  | "FAILURE_DETECTED"
  | "SELECTING_STANDBY"
  | "PROMOTING"
  | "VERIFYING"
  | "FAILED_OVER"
  | "RECOVERY_REQUIRED"
  | "BLOCKED";

export type SovereignFailoverDecision =
  | "MONITOR"
  | "SELECT"
  | "PROMOTE"
  | "VERIFY"
  | "COMPLETE"
  | "RECOVER"
  | "BLOCK";

export interface SovereignFailoverAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignFailoverCandidate {
  candidateId: string;

  healthy: boolean;
  synchronized: boolean;
  capacityAvailable: boolean;

  priority: number;

  lastHeartbeatAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignFailoverPolicy {
  requireSynchronization: boolean;
  requireHealthyCandidate: boolean;
  requireAvailableCapacity: boolean;

  preventSplitBrain: boolean;

  failoverTimeoutMs: number;
  heartbeatMaxAgeMs: number;
}

export interface SovereignFailoverRequest {
  failoverId: string;

  primaryId: string;
  targetType:
    | "RUNTIME"
    | "SERVICE"
    | "WORKER"
    | "NODE"
    | "DATABASE"
    | "QUEUE"
    | "MODEL"
    | "OTHER";

  requestedBy: string;

  authorityContext: SovereignFailoverAuthorityContext;

  candidates: SovereignFailoverCandidate[];

  policy: SovereignFailoverPolicy;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;
}

export interface SovereignFailoverRecord {
  failoverId: string;

  primaryId: string;
  selectedCandidateId?: string;

  state: SovereignFailoverState;

  failureDetectedAt?: number;
  promotionStartedAt?: number;
  deadlineAt?: number;
  completedAt?: number;

  createdAt: number;
  updatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignFailoverResult {
  failoverId: string;

  primaryId: string;
  selectedCandidateId?: string;

  accepted: boolean;

  state: SovereignFailoverState;
  decision: SovereignFailoverDecision;

  remainingMs?: number;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsFailoverController {
  public readonly id =
    SOVEREIGN_OPERATIONS_FAILOVER_CONTROLLER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_FAILOVER_CONTROLLER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly failoverCanCreateAuthority = false;
  public readonly failoverCanEscalateAuthority = false;
  public readonly failoverCanOverrideOwner = false;
  public readonly failoverCanBypassSecurity = false;
  public readonly failoverCanAllowSplitBrain = false;
  public readonly failoverCanPromoteUnhealthyCandidate = false;
  public readonly failoverCanDisableAudit = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignFailoverRecord>();

  private readonly requests =
    new Map<string, SovereignFailoverRequest>();

  private validate(
    request: SovereignFailoverRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.failoverId) {
      reasons.push("FAILOVER_ID_REQUIRED");
    }

    if (!request.primaryId) {
      reasons.push("PRIMARY_ID_REQUIRED");
    }

    if (!request.requestedBy) {
      reasons.push("REQUESTER_REQUIRED");
    }

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

    if (!request.securityApproved) {
      reasons.push("SECURITY_APPROVAL_REQUIRED");
    }

    if (!request.policyApproved) {
      reasons.push("POLICY_APPROVAL_REQUIRED");
    }

    if (
      !Array.isArray(request.candidates) ||
      request.candidates.length === 0
    ) {
      reasons.push("FAILOVER_CANDIDATES_REQUIRED");
    }

    if (
      !Number.isFinite(
        request.policy.failoverTimeoutMs
      ) ||
      request.policy.failoverTimeoutMs < 1
    ) {
      reasons.push("INVALID_FAILOVER_TIMEOUT");
    }

    if (
      !Number.isFinite(
        request.policy.heartbeatMaxAgeMs
      ) ||
      request.policy.heartbeatMaxAgeMs < 1
    ) {
      reasons.push("INVALID_HEARTBEAT_MAX_AGE");
    }

    const ids = new Set<string>();

    for (const candidate of request.candidates) {
      if (!candidate.candidateId) {
        reasons.push("CANDIDATE_ID_REQUIRED");
        continue;
      }

      if (candidate.candidateId === request.primaryId) {
        reasons.push(
          "PRIMARY_CANNOT_BE_FAILOVER_CANDIDATE"
        );
      }

      if (ids.has(candidate.candidateId)) {
        reasons.push(
          `DUPLICATE_CANDIDATE_${candidate.candidateId}`
        );
      }

      ids.add(candidate.candidateId);
    }

    return reasons;
  }

  public register(
    request: SovereignFailoverRequest
  ): SovereignFailoverResult {
    const now = Date.now();

    if (this.records.has(request.failoverId)) {
      return this.failure(
        request.failoverId,
        request.primaryId,
        "FAILOVER_ALREADY_EXISTS"
      );
    }

    const reasons = this.validate(request);

    if (reasons.length > 0) {
      return {
        failoverId: request.failoverId,
        primaryId: request.primaryId,

        accepted: false,

        state: "BLOCKED",
        decision: "BLOCK",

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignFailoverRecord = {
      failoverId: request.failoverId,

      primaryId: request.primaryId,

      state: "MONITORING",

      createdAt: request.createdAt,
      updatedAt: now,

      reasons: [],

      authority: "NONE"
    };

    this.records.set(
      request.failoverId,
      record
    );

    this.requests.set(
      request.failoverId,
      this.cloneRequest(request)
    );

    return this.result(
      record,
      "MONITOR",
      now
    );
  }

  public detectFailure(
    failoverId: string,
    primaryHealthy: boolean,
    now = Date.now()
  ): SovereignFailoverResult {
    const record =
      this.records.get(failoverId);

    if (!record) {
      return this.failure(
        failoverId,
        "",
        "FAILOVER_NOT_FOUND"
      );
    }

    if (primaryHealthy) {
      record.state = "MONITORING";
      record.updatedAt = now;
      record.reasons = [];

      return this.result(
        record,
        "MONITOR",
        now
      );
    }

    record.state =
      "FAILURE_DETECTED";

    record.failureDetectedAt = now;
    record.updatedAt = now;

    record.reasons = [
      "PRIMARY_FAILURE_DETECTED"
    ];

    this.records.set(
      failoverId,
      record
    );

    return this.result(
      record,
      "SELECT",
      now
    );
  }

  public selectCandidate(
    failoverId: string,
    now = Date.now()
  ): SovereignFailoverResult {
    const record =
      this.records.get(failoverId);

    const request =
      this.requests.get(failoverId);

    if (!record || !request) {
      return this.failure(
        failoverId,
        "",
        "FAILOVER_NOT_FOUND"
      );
    }

    if (
      record.state !== "FAILURE_DETECTED" &&
      record.state !== "SELECTING_STANDBY"
    ) {
      return this.failure(
        record.failoverId,
        record.primaryId,
        "FAILOVER_SELECTION_NOT_ALLOWED"
      );
    }

    record.state =
      "SELECTING_STANDBY";

    const eligible =
      request.candidates
        .filter((candidate) =>
          this.isEligible(
            candidate,
            request.policy,
            now
          )
        )
        .sort(
          (a, b) =>
            a.priority - b.priority
        );

    if (eligible.length === 0) {
      record.state =
        "RECOVERY_REQUIRED";

      record.updatedAt = now;

      record.reasons = [
        "NO_ELIGIBLE_FAILOVER_CANDIDATE"
      ];

      this.records.set(
        failoverId,
        record
      );

      return this.result(
        record,
        "RECOVER",
        now
      );
    }

    record.selectedCandidateId =
      eligible[0].candidateId;

    record.updatedAt = now;

    record.reasons = [
      "FAILOVER_CANDIDATE_SELECTED"
    ];

    this.records.set(
      failoverId,
      record
    );

    return this.result(
      record,
      "PROMOTE",
      now
    );
  }

  public beginPromotion(
    failoverId: string,
    primaryFenced: boolean,
    now = Date.now()
  ): SovereignFailoverResult {
    const record =
      this.records.get(failoverId);

    const request =
      this.requests.get(failoverId);

    if (!record || !request) {
      return this.failure(
        failoverId,
        "",
        "FAILOVER_NOT_FOUND"
      );
    }

    if (!record.selectedCandidateId) {
      return this.failure(
        record.failoverId,
        record.primaryId,
        "FAILOVER_CANDIDATE_NOT_SELECTED"
      );
    }

    if (
      request.policy.preventSplitBrain &&
      !primaryFenced
    ) {
      return this.failure(
        record.failoverId,
        record.primaryId,
        "PRIMARY_MUST_BE_FENCED_BEFORE_PROMOTION"
      );
    }

    record.state = "PROMOTING";

    record.promotionStartedAt = now;

    record.deadlineAt =
      now +
      request.policy.failoverTimeoutMs;

    record.updatedAt = now;

    record.reasons = [
      "FAILOVER_PROMOTION_STARTED"
    ];

    this.records.set(
      failoverId,
      record
    );

    return this.result(
      record,
      "VERIFY",
      now
    );
  }

  public verifyPromotion(
    failoverId: string,
    promotedHealthy: boolean,
    primaryStillFenced: boolean,
    now = Date.now()
  ): SovereignFailoverResult {
    const record =
      this.records.get(failoverId);

    const request =
      this.requests.get(failoverId);

    if (!record || !request) {
      return this.failure(
        failoverId,
        "",
        "FAILOVER_NOT_FOUND"
      );
    }

    if (
      record.state !== "PROMOTING" &&
      record.state !== "VERIFYING"
    ) {
      return this.failure(
        record.failoverId,
        record.primaryId,
        "FAILOVER_NOT_VERIFYING"
      );
    }

    if (
      request.policy.preventSplitBrain &&
      !primaryStillFenced
    ) {
      record.state =
        "RECOVERY_REQUIRED";

      record.updatedAt = now;

      record.reasons = [
        "SPLIT_BRAIN_RISK_DETECTED"
      ];

      this.records.set(
        failoverId,
        record
      );

      return this.result(
        record,
        "RECOVER",
        now
      );
    }

    if (
      record.deadlineAt !== undefined &&
      now >= record.deadlineAt
    ) {
      record.state =
        "RECOVERY_REQUIRED";

      record.updatedAt = now;

      record.reasons = [
        "FAILOVER_TIMEOUT_EXCEEDED"
      ];

      this.records.set(
        failoverId,
        record
      );

      return this.result(
        record,
        "RECOVER",
        now
      );
    }

    if (!promotedHealthy) {
      record.state = "VERIFYING";

      record.updatedAt = now;

      record.reasons = [
        "PROMOTED_CANDIDATE_NOT_HEALTHY"
      ];

      this.records.set(
        failoverId,
        record
      );

      return this.result(
        record,
        "VERIFY",
        now
      );
    }

    record.state = "FAILED_OVER";

    record.completedAt = now;
    record.updatedAt = now;

    record.reasons = [
      "FAILOVER_COMPLETED"
    ];

    this.records.set(
      failoverId,
      record
    );

    return this.result(
      record,
      "COMPLETE",
      now
    );
  }

  private isEligible(
    candidate: SovereignFailoverCandidate,
    policy: SovereignFailoverPolicy,
    now: number
  ): boolean {
    if (
      policy.requireHealthyCandidate &&
      !candidate.healthy
    ) {
      return false;
    }

    if (
      policy.requireSynchronization &&
      !candidate.synchronized
    ) {
      return false;
    }

    if (
      policy.requireAvailableCapacity &&
      !candidate.capacityAvailable
    ) {
      return false;
    }

    const heartbeatAge =
      now - candidate.lastHeartbeatAt;

    if (
      heartbeatAge < 0 ||
      heartbeatAge >
        policy.heartbeatMaxAgeMs
    ) {
      return false;
    }

    return true;
  }

  public requireRecovery(
    failoverId: string,
    reason = "FAILOVER_RECOVERY_REQUIRED"
  ): SovereignFailoverResult {
    const record =
      this.records.get(failoverId);

    if (!record) {
      return this.failure(
        failoverId,
        "",
        "FAILOVER_NOT_FOUND"
      );
    }

    record.state =
      "RECOVERY_REQUIRED";

    record.updatedAt =
      Date.now();

    record.reasons = [reason];

    this.records.set(
      failoverId,
      record
    );

    return this.result(
      record,
      "RECOVER",
      Date.now()
    );
  }

  public getRecord(
    failoverId: string
  ): SovereignFailoverRecord | undefined {
    const record =
      this.records.get(failoverId);

    return record
      ? {
          ...record,
          reasons: [...record.reasons]
        }
      : undefined;
  }

  public getActive():
    SovereignFailoverRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state !== "MONITORING" &&
          record.state !== "FAILED_OVER" &&
          record.state !== "BLOCKED"
      )
      .map((record) => ({
        ...record,
        reasons: [...record.reasons]
      }));
  }

  private cloneRequest(
    request: SovereignFailoverRequest
  ): SovereignFailoverRequest {
    return {
      ...request,

      authorityContext: {
        ...request.authorityContext,
        delegationScope: [
          ...request.authorityContext
            .delegationScope
        ]
      },

      candidates:
        request.candidates.map(
          (candidate) => ({
            ...candidate,
            metadata:
              candidate.metadata
                ? { ...candidate.metadata }
                : undefined
          })
        ),

      policy: {
        ...request.policy
      }
    };
  }

  private result(
    record: SovereignFailoverRecord,
    decision: SovereignFailoverDecision,
    now: number
  ): SovereignFailoverResult {
    return {
      failoverId: record.failoverId,

      primaryId: record.primaryId,
      selectedCandidateId:
        record.selectedCandidateId,

      accepted:
        decision !== "BLOCK",

      state: record.state,
      decision,

      remainingMs:
        record.deadlineAt !== undefined
          ? Math.max(
              0,
              record.deadlineAt - now
            )
          : undefined,

      reasons: [...record.reasons],

      timestamp: now,

      authority: "NONE"
    };
  }

  private failure(
    failoverId: string,
    primaryId: string,
    reason: string
  ): SovereignFailoverResult {
    return {
      failoverId,
      primaryId,

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
      this.failoverCanCreateAuthority === false &&
      this.failoverCanEscalateAuthority === false &&
      this.failoverCanOverrideOwner === false &&
      this.failoverCanBypassSecurity === false &&
      this.failoverCanAllowSplitBrain === false &&
      this.failoverCanPromoteUnhealthyCandidate === false &&
      this.failoverCanDisableAudit === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsFailoverController =
  new SovereignOperationsFailoverController();

export default sovereignOperationsFailoverController;

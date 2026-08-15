// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-REPAIR-AUDIT-145.ts
// Sequence: 145
// Purpose: Sovereign Autonomous Repair Audit Trail, Evidence Chain,
//          Integrity Verification & Accountability
// ============================================================================

export const SOVEREIGN_OPERATIONS_REPAIR_AUDIT_ID =
  "SOVEREIGN-OPERATIONS-REPAIR-AUDIT-145";

export const SOVEREIGN_OPERATIONS_REPAIR_AUDIT_VERSION =
  "1.0.0";

export type SovereignRepairAuditEventType =
  | "ISSUE_DETECTED"
  | "PLAN_CREATED"
  | "PLAN_APPROVED"
  | "EXECUTION_STARTED"
  | "STEP_STARTED"
  | "STEP_COMPLETED"
  | "STEP_FAILED"
  | "VERIFICATION_STARTED"
  | "VERIFICATION_PASSED"
  | "VERIFICATION_FAILED"
  | "ROLLBACK_STARTED"
  | "ROLLBACK_COMPLETED"
  | "RECOVERY_REQUIRED"
  | "ISOLATION_REQUIRED"
  | "REPAIR_COMPLETED"
  | "REPAIR_BLOCKED";

export type SovereignRepairAuditState =
  | "OPEN"
  | "ACTIVE"
  | "VERIFIED"
  | "FAILED"
  | "ROLLED_BACK"
  | "RECOVERY_REQUIRED"
  | "BLOCKED"
  | "CLOSED";

export interface SovereignRepairAuditAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignRepairAuditEvent {
  eventId: string;

  type: SovereignRepairAuditEventType;

  actor: string;

  target: string;

  timestamp: number;

  message: string;

  evidence?: Record<string, unknown>;

  previousHash?: string;
  eventHash: string;
}

export interface SovereignRepairAuditRequest {
  auditId: string;

  planId: string;
  executionId?: string;
  verificationId?: string;

  requestedBy: string;

  authorityContext: SovereignRepairAuditAuthorityContext;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignRepairAuditRecord {
  auditId: string;

  planId: string;
  executionId?: string;
  verificationId?: string;

  state: SovereignRepairAuditState;

  events: SovereignRepairAuditEvent[];

  chainHead?: string;

  createdAt: number;
  updatedAt: number;
  closedAt?: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignRepairAuditResult {
  auditId: string;

  accepted: boolean;

  state: SovereignRepairAuditState;

  eventCount: number;

  chainHead?: string;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsRepairAudit {
  public readonly id =
    SOVEREIGN_OPERATIONS_REPAIR_AUDIT_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_REPAIR_AUDIT_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly auditCanCreateAuthority = false;
  public readonly auditCanEscalateAuthority = false;
  public readonly auditCanOverrideOwner = false;
  public readonly auditCanBypassSecurity = false;
  public readonly auditCanRewriteHistory = false;
  public readonly auditCanDeleteEvidence = false;
  public readonly auditCanDisableItself = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignRepairAuditRecord>();

  private readonly requests =
    new Map<string, SovereignRepairAuditRequest>();

  private validate(
    request: SovereignRepairAuditRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.auditId) {
      reasons.push("AUDIT_ID_REQUIRED");
    }

    if (!request.planId) {
      reasons.push("PLAN_ID_REQUIRED");
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

    return reasons;
  }

  public register(
    request: SovereignRepairAuditRequest
  ): SovereignRepairAuditResult {
    const now = Date.now();

    if (this.records.has(request.auditId)) {
      return this.failure(
        request.auditId,
        "AUDIT_ALREADY_EXISTS"
      );
    }

    const reasons = this.validate(request);

    if (reasons.length > 0) {
      return {
        auditId: request.auditId,

        accepted: false,

        state: "BLOCKED",

        eventCount: 0,

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignRepairAuditRecord = {
      auditId: request.auditId,

      planId: request.planId,
      executionId: request.executionId,
      verificationId: request.verificationId,

      state: "OPEN",

      events: [],

      createdAt: request.createdAt,
      updatedAt: now,

      reasons: [],

      authority: "NONE"
    };

    this.records.set(
      request.auditId,
      record
    );

    this.requests.set(
      request.auditId,
      this.cloneRequest(request)
    );

    return this.result(
      record,
      now
    );
  }

  public appendEvent(
    auditId: string,
    input: {
      eventId: string;
      type: SovereignRepairAuditEventType;
      actor: string;
      target: string;
      message: string;
      timestamp?: number;
      evidence?: Record<string, unknown>;
    }
  ): SovereignRepairAuditResult {
    const record =
      this.records.get(auditId);

    if (!record) {
      return this.failure(
        auditId,
        "AUDIT_NOT_FOUND"
      );
    }

    if (
      record.state === "CLOSED" ||
      record.state === "BLOCKED"
    ) {
      return this.failure(
        auditId,
        "AUDIT_NOT_WRITABLE"
      );
    }

    if (!input.eventId) {
      return this.failure(
        auditId,
        "EVENT_ID_REQUIRED"
      );
    }

    if (!input.actor) {
      return this.failure(
        auditId,
        "EVENT_ACTOR_REQUIRED"
      );
    }

    if (!input.target) {
      return this.failure(
        auditId,
        "EVENT_TARGET_REQUIRED"
      );
    }

    if (!input.message) {
      return this.failure(
        auditId,
        "EVENT_MESSAGE_REQUIRED"
      );
    }

    if (
      record.events.some(
        (event) =>
          event.eventId === input.eventId
      )
    ) {
      return this.failure(
        auditId,
        "DUPLICATE_EVENT_ID"
      );
    }

    const timestamp =
      input.timestamp ?? Date.now();

    const previousHash =
      record.chainHead;

    const eventHash =
      this.hashEvent({
        eventId: input.eventId,
        type: input.type,
        actor: input.actor,
        target: input.target,
        timestamp,
        message: input.message,
        evidence: input.evidence,
        previousHash
      });

    const event: SovereignRepairAuditEvent = {
      eventId: input.eventId,

      type: input.type,

      actor: input.actor,
      target: input.target,

      timestamp,

      message: input.message,

      evidence: input.evidence
        ? { ...input.evidence }
        : undefined,

      previousHash,
      eventHash
    };

    record.events.push(event);

    record.chainHead = eventHash;

    record.state =
      this.stateForEvent(
        input.type
      );

    record.updatedAt =
      timestamp;

    record.reasons = [
      `AUDIT_EVENT_${input.type}`
    ];

    this.records.set(
      auditId,
      record
    );

    return this.result(
      record,
      timestamp
    );
  }

  public verifyChain(
    auditId: string
  ): {
    valid: boolean;
    brokenEventId?: string;
    checkedEvents: number;
  } {
    const record =
      this.records.get(auditId);

    if (!record) {
      return {
        valid: false,
        checkedEvents: 0
      };
    }

    let previousHash:
      | string
      | undefined;

    for (const event of record.events) {
      if (
        event.previousHash !==
        previousHash
      ) {
        return {
          valid: false,
          brokenEventId: event.eventId,
          checkedEvents:
            record.events.indexOf(event)
        };
      }

      const expectedHash =
        this.hashEvent({
          eventId: event.eventId,
          type: event.type,
          actor: event.actor,
          target: event.target,
          timestamp: event.timestamp,
          message: event.message,
          evidence: event.evidence,
          previousHash: event.previousHash
        });

      if (
        expectedHash !==
        event.eventHash
      ) {
        return {
          valid: false,
          brokenEventId: event.eventId,
          checkedEvents:
            record.events.indexOf(event)
        };
      }

      previousHash =
        event.eventHash;
    }

    if (
      previousHash !==
      record.chainHead
    ) {
      return {
        valid: false,
        checkedEvents:
          record.events.length
      };
    }

    return {
      valid: true,
      checkedEvents:
        record.events.length
    };
  }

  public close(
    auditId: string,
    now = Date.now()
  ): SovereignRepairAuditResult {
    const record =
      this.records.get(auditId);

    if (!record) {
      return this.failure(
        auditId,
        "AUDIT_NOT_FOUND"
      );
    }

    if (
      record.state === "BLOCKED"
    ) {
      return this.failure(
        auditId,
        "BLOCKED_AUDIT_CANNOT_CLOSE"
      );
    }

    const verification =
      this.verifyChain(auditId);

    if (!verification.valid) {
      record.state = "BLOCKED";

      record.updatedAt = now;

      record.reasons = [
        "AUDIT_CHAIN_VERIFICATION_FAILED"
      ];

      this.records.set(
        auditId,
        record
      );

      return this.result(
        record,
        now
      );
    }

    record.state = "CLOSED";

    record.closedAt = now;
    record.updatedAt = now;

    record.reasons = [
      "AUDIT_CHAIN_CLOSED_AND_VERIFIED"
    ];

    this.records.set(
      auditId,
      record
    );

    return this.result(
      record,
      now
    );
  }

  public getRecord(
    auditId: string
  ): SovereignRepairAuditRecord | undefined {
    const record =
      this.records.get(auditId);

    return record
      ? this.cloneRecord(record)
      : undefined;
  }

  public getOpenAudits():
    SovereignRepairAuditRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state !== "CLOSED" &&
          record.state !== "BLOCKED"
      )
      .map(
        (record) =>
          this.cloneRecord(record)
      );
  }

  public getFailedAudits():
    SovereignRepairAuditRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state === "FAILED" ||
          record.state ===
            "RECOVERY_REQUIRED" ||
          record.state === "BLOCKED"
      )
      .map(
        (record) =>
          this.cloneRecord(record)
      );
  }

  private stateForEvent(
    type: SovereignRepairAuditEventType
  ): SovereignRepairAuditState {
    switch (type) {
      case "VERIFICATION_PASSED":
      case "REPAIR_COMPLETED":
        return "VERIFIED";

      case "STEP_FAILED":
      case "VERIFICATION_FAILED":
        return "FAILED";

      case "ROLLBACK_COMPLETED":
        return "ROLLED_BACK";

      case "RECOVERY_REQUIRED":
      case "ISOLATION_REQUIRED":
        return "RECOVERY_REQUIRED";

      case "REPAIR_BLOCKED":
        return "BLOCKED";

      case "ISSUE_DETECTED":
      case "PLAN_CREATED":
      case "PLAN_APPROVED":
      case "EXECUTION_STARTED":
      case "STEP_STARTED":
      case "STEP_COMPLETED":
      case "VERIFICATION_STARTED":
      case "ROLLBACK_STARTED":
      default:
        return "ACTIVE";
    }
  }

  private hashEvent(
    input: {
      eventId: string;
      type: SovereignRepairAuditEventType;
      actor: string;
      target: string;
      timestamp: number;
      message: string;
      evidence?: Record<string, unknown>;
      previousHash?: string;
    }
  ): string {
    const canonical =
      JSON.stringify({
        eventId: input.eventId,
        type: input.type,
        actor: input.actor,
        target: input.target,
        timestamp: input.timestamp,
        message: input.message,
        evidence:
          input.evidence ?? null,
        previousHash:
          input.previousHash ?? null
      });

    return this.fnv1a64(
      canonical
    );
  }

  private fnv1a64(
    value: string
  ): string {
    let hash =
      BigInt(
        "14695981039346656037"
      );

    const prime =
      BigInt(
        "1099511628211"
      );

    const mask =
      BigInt(
        "0xFFFFFFFFFFFFFFFF"
      );

    for (
      let index = 0;
      index < value.length;
      index += 1
    ) {
      hash ^= BigInt(
        value.charCodeAt(index)
      );

      hash =
        (hash * prime) & mask;
    }

    return hash
      .toString(16)
      .padStart(16, "0");
  }

  private cloneRecord(
    record: SovereignRepairAuditRecord
  ): SovereignRepairAuditRecord {
    return {
      ...record,

      events:
        record.events.map(
          (event) => ({
            ...event,

            evidence:
              event.evidence
                ? {
                    ...event.evidence
                  }
                : undefined
          })
        ),

      reasons: [
        ...record.reasons
      ]
    };
  }

  private cloneRequest(
    request: SovereignRepairAuditRequest
  ): SovereignRepairAuditRequest {
    return {
      ...request,

      authorityContext: {
        ...request.authorityContext,

        delegationScope: [
          ...request.authorityContext
            .delegationScope
        ]
      },

      metadata:
        request.metadata
          ? {
              ...request.metadata
            }
          : undefined
    };
  }

  private result(
    record: SovereignRepairAuditRecord,
    now: number
  ): SovereignRepairAuditResult {
    return {
      auditId:
        record.auditId,

      accepted:
        record.state !== "BLOCKED",

      state:
        record.state,

      eventCount:
        record.events.length,

      chainHead:
        record.chainHead,

      reasons: [
        ...record.reasons
      ],

      timestamp: now,

      authority: "NONE"
    };
  }

  private failure(
    auditId: string,
    reason: string
  ): SovereignRepairAuditResult {
    return {
      auditId,

      accepted: false,

      state: "BLOCKED",

      eventCount: 0,

      reasons: [
        reason
      ],

      timestamp:
        Date.now(),

      authority: "NONE"
    };
  }

  public assertSovereignty(): boolean {
    return (
      this.authority === "NONE" &&
      this.ownerAuthority === "SUPREME" &&
      this.stewardAuthority === "DELEGATED" &&
      this.auditCanCreateAuthority === false &&
      this.auditCanEscalateAuthority === false &&
      this.auditCanOverrideOwner === false &&
      this.auditCanBypassSecurity === false &&
      this.auditCanRewriteHistory === false &&
      this.auditCanDeleteEvidence === false &&
      this.auditCanDisableItself === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsRepairAudit =
  new SovereignOperationsRepairAudit();

export default sovereignOperationsRepairAudit;

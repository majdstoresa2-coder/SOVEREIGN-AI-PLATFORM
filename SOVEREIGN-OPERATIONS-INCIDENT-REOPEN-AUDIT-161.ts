// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-INCIDENT-REOPEN-AUDIT-161.ts
// Sequence: 161
// Purpose: Sovereign Incident Reopen Audit, Evidence Chain Preservation,
//          Recurrence Traceability & Immutable Operational Accountability
// ============================================================================

export const SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_AUDIT_ID =
  "SOVEREIGN-OPERATIONS-INCIDENT-REOPEN-AUDIT-161";

export const SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_AUDIT_VERSION =
  "1.0.0";

export type SovereignIncidentReopenAuditState =
  | "OPEN"
  | "ACTIVE"
  | "VERIFIED"
  | "CLOSED"
  | "BLOCKED";

export type SovereignIncidentReopenAuditEventType =
  | "REOPEN_REQUESTED"
  | "RECURRENCE_CONFIRMED"
  | "REOPEN_VALIDATED"
  | "REOPEN_EXECUTED"
  | "REOPEN_VERIFIED"
  | "SECURITY_VALIDATED"
  | "INTEGRITY_VALIDATED"
  | "EVIDENCE_PRESERVED"
  | "AUDIT_VERIFIED"
  | "AUDIT_CLOSED";

export interface SovereignIncidentReopenAuditAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignIncidentReopenAuditEvent {
  eventId: string;

  type: SovereignIncidentReopenAuditEventType;

  actorId: string;

  timestamp: number;

  message: string;

  evidence?: Record<string, unknown>;

  previousHash?: string;
  eventHash: string;
}

export interface SovereignIncidentReopenAuditRequest {
  auditId: string;

  incidentId: string;
  reopenId: string;
  verificationId: string;

  target: string;

  requestedBy: string;

  authorityContext:
    SovereignIncidentReopenAuditAuthorityContext;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignIncidentReopenAuditRecord {
  auditId: string;

  incidentId: string;
  reopenId: string;
  verificationId: string;

  target: string;

  state: SovereignIncidentReopenAuditState;

  events: SovereignIncidentReopenAuditEvent[];

  chainHead?: string;

  createdAt: number;
  updatedAt: number;
  closedAt?: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignIncidentReopenAuditResult {
  auditId: string;

  incidentId: string;
  reopenId: string;

  target: string;

  accepted: boolean;

  state: SovereignIncidentReopenAuditState;

  eventCount: number;

  chainHead?: string;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsIncidentReopenAudit {
  public readonly id =
    SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_AUDIT_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_INCIDENT_REOPEN_AUDIT_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly auditCanCreateAuthority = false;
  public readonly auditCanEscalateAuthority = false;
  public readonly auditCanOverrideOwner = false;

  public readonly auditCanBypassSecurity = false;
  public readonly auditCanIgnoreIntegrity = false;

  public readonly auditCanRewriteHistory = false;
  public readonly auditCanDeleteEvidence = false;
  public readonly auditCanAlterPriorHashes = false;

  public readonly auditCanDisableItself = false;

  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<
      string,
      SovereignIncidentReopenAuditRecord
    >();

  public register(
    request: SovereignIncidentReopenAuditRequest,
    now = Date.now()
  ): SovereignIncidentReopenAuditResult {
    if (this.records.has(request.auditId)) {
      return this.failure(
        request.auditId,
        request.incidentId,
        request.reopenId,
        request.target,
        "AUDIT_ALREADY_EXISTS"
      );
    }

    const failures =
      this.validateRequest(request);

    if (failures.length > 0) {
      return {
        auditId: request.auditId,
        incidentId: request.incidentId,
        reopenId: request.reopenId,
        target: request.target,

        accepted: false,

        state: "BLOCKED",

        eventCount: 0,

        reasons: failures,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignIncidentReopenAuditRecord = {
      auditId: request.auditId,

      incidentId: request.incidentId,
      reopenId: request.reopenId,
      verificationId: request.verificationId,

      target: request.target,

      state: "OPEN",

      events: [],

      createdAt: request.createdAt,
      updatedAt: now,

      reasons: [
        "INCIDENT_REOPEN_AUDIT_REGISTERED"
      ],

      authority: "NONE"
    };

    this.records.set(
      request.auditId,
      record
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
      type: SovereignIncidentReopenAuditEventType;
      actorId: string;
      timestamp?: number;
      message: string;
      evidence?: Record<string, unknown>;
    }
  ): SovereignIncidentReopenAuditResult {
    const record =
      this.records.get(auditId);

    if (!record) {
      return this.failure(
        auditId,
        "",
        "",
        "",
        "AUDIT_NOT_FOUND"
      );
    }

    if (
      record.state === "CLOSED" ||
      record.state === "BLOCKED"
    ) {
      return this.failure(
        record.auditId,
        record.incidentId,
        record.reopenId,
        record.target,
        "AUDIT_NOT_WRITABLE"
      );
    }

    if (!input.eventId) {
      return this.failure(
        record.auditId,
        record.incidentId,
        record.reopenId,
        record.target,
        "EVENT_ID_REQUIRED"
      );
    }

    if (!input.actorId) {
      return this.failure(
        record.auditId,
        record.incidentId,
        record.reopenId,
        record.target,
        "ACTOR_ID_REQUIRED"
      );
    }

    if (!input.message) {
      return this.failure(
        record.auditId,
        record.incidentId,
        record.reopenId,
        record.target,
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
        record.auditId,
        record.incidentId,
        record.reopenId,
        record.target,
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
        actorId: input.actorId,
        timestamp,
        message: input.message,
        evidence: input.evidence,
        previousHash
      });

    const event: SovereignIncidentReopenAuditEvent = {
      eventId: input.eventId,

      type: input.type,

      actorId: input.actorId,

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
      input.type === "AUDIT_VERIFIED"
        ? "VERIFIED"
        : "ACTIVE";

    record.updatedAt = timestamp;

    record.reasons = [
      `INCIDENT_REOPEN_AUDIT_EVENT_${input.type}`
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
    checkedEvents: number;
    brokenEventId?: string;
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

    let checkedEvents = 0;

    for (const event of record.events) {
      if (
        event.previousHash !== previousHash
      ) {
        return {
          valid: false,
          checkedEvents,
          brokenEventId: event.eventId
        };
      }

      const expectedHash =
        this.hashEvent({
          eventId: event.eventId,
          type: event.type,
          actorId: event.actorId,
          timestamp: event.timestamp,
          message: event.message,
          evidence: event.evidence,
          previousHash: event.previousHash
        });

      if (
        expectedHash !== event.eventHash
      ) {
        return {
          valid: false,
          checkedEvents,
          brokenEventId: event.eventId
        };
      }

      previousHash =
        event.eventHash;

      checkedEvents += 1;
    }

    if (
      previousHash !== record.chainHead
    ) {
      return {
        valid: false,
        checkedEvents
      };
    }

    return {
      valid: true,
      checkedEvents
    };
  }

  public close(
    auditId: string,
    now = Date.now()
  ): SovereignIncidentReopenAuditResult {
    const record =
      this.records.get(auditId);

    if (!record) {
      return this.failure(
        auditId,
        "",
        "",
        "",
        "AUDIT_NOT_FOUND"
      );
    }

    const verification =
      this.verifyChain(auditId);

    if (!verification.valid) {
      record.state = "BLOCKED";
      record.updatedAt = now;

      record.reasons = [
        "INCIDENT_REOPEN_AUDIT_CHAIN_INVALID"
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

    const reopenVerified =
      record.events.some(
        (event) =>
          event.type === "REOPEN_VERIFIED"
      );

    const evidencePreserved =
      record.events.some(
        (event) =>
          event.type === "EVIDENCE_PRESERVED"
      );

    const securityValidated =
      record.events.some(
        (event) =>
          event.type === "SECURITY_VALIDATED"
      );

    const integrityValidated =
      record.events.some(
        (event) =>
          event.type === "INTEGRITY_VALIDATED"
      );

    if (
      !reopenVerified ||
      !evidencePreserved ||
      !securityValidated ||
      !integrityValidated
    ) {
      record.state = "BLOCKED";

      record.updatedAt = now;

      record.reasons = [
        "REOPEN_VERIFICATION_EVIDENCE_INCOMPLETE"
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
      "INCIDENT_REOPEN_AUDIT_CLOSED",
      "AUDIT_CHAIN_VERIFIED",
      "REOPEN_HISTORY_PRESERVED"
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

  private validateRequest(
    request: SovereignIncidentReopenAuditRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.auditId) {
      reasons.push("AUDIT_ID_REQUIRED");
    }

    if (!request.incidentId) {
      reasons.push("INCIDENT_ID_REQUIRED");
    }

    if (!request.reopenId) {
      reasons.push("REOPEN_ID_REQUIRED");
    }

    if (!request.verificationId) {
      reasons.push("VERIFICATION_ID_REQUIRED");
    }

    if (!request.target) {
      reasons.push("TARGET_REQUIRED");
    }

    if (!request.requestedBy) {
      reasons.push("REQUESTER_REQUIRED");
    }

    if (!request.securityApproved) {
      reasons.push("SECURITY_APPROVAL_REQUIRED");
    }

    if (!request.policyApproved) {
      reasons.push("POLICY_APPROVAL_REQUIRED");
    }

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

    return reasons;
  }

  private hashEvent(
    input: {
      eventId: string;
      type: SovereignIncidentReopenAuditEventType;
      actorId: string;
      timestamp: number;
      message: string;
      evidence?: Record<string, unknown>;
      previousHash?: string;
    }
  ): string {
    const value =
      JSON.stringify({
        eventId: input.eventId,
        type: input.type,
        actorId: input.actorId,
        timestamp: input.timestamp,
        message: input.message,
        evidence: input.evidence ?? null,
        previousHash:
          input.previousHash ?? null
      });

    return this.fnv1a64(value);
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
      hash ^=
        BigInt(
          value.charCodeAt(index)
        );

      hash =
        (hash * prime) & mask;
    }

    return hash
      .toString(16)
      .padStart(16, "0");
  }

  public getRecord(
    auditId: string
  ):
    | SovereignIncidentReopenAuditRecord
    | undefined {
    const record =
      this.records.get(auditId);

    if (!record) {
      return undefined;
    }

    return {
      ...record,

      events:
        record.events.map(
          (event) => ({
            ...event,

            evidence:
              event.evidence
                ? { ...event.evidence }
                : undefined
          })
        ),

      reasons: [
        ...record.reasons
      ]
    };
  }

  public getOpenAudits():
    SovereignIncidentReopenAuditRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state !== "CLOSED" &&
          record.state !== "BLOCKED"
      )
      .map(
        (record) => ({
          ...record,

          events:
            record.events.map(
              (event) => ({
                ...event,

                evidence:
                  event.evidence
                    ? { ...event.evidence }
                    : undefined
              })
            ),

          reasons: [
            ...record.reasons
          ]
        })
      );
  }

  private result(
    record: SovereignIncidentReopenAuditRecord,
    now: number
  ): SovereignIncidentReopenAuditResult {
    return {
      auditId: record.auditId,

      incidentId: record.incidentId,
      reopenId: record.reopenId,

      target: record.target,

      accepted:
        record.state !== "BLOCKED",

      state: record.state,

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
    incidentId: string,
    reopenId: string,
    target: string,
    reason: string
  ): SovereignIncidentReopenAuditResult {
    return {
      auditId,
      incidentId,
      reopenId,
      target,

      accepted: false,

      state: "BLOCKED",

      event

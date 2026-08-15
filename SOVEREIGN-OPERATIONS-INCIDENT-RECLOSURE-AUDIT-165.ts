// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-INCIDENT-RECLOSURE-AUDIT-165.ts
// Sequence: 165
// Purpose: Sovereign Incident Reclosure Audit, Evidence Preservation,
//          Verification Traceability & Immutable Reclosure Accountability
// ============================================================================

export const SOVEREIGN_OPERATIONS_INCIDENT_RECLOSURE_AUDIT_ID =
  "SOVEREIGN-OPERATIONS-INCIDENT-RECLOSURE-AUDIT-165";

export const SOVEREIGN_OPERATIONS_INCIDENT_RECLOSURE_AUDIT_VERSION =
  "1.0.0";

export type SovereignIncidentReclosureAuditState =
  | "OPEN"
  | "ACTIVE"
  | "VERIFIED"
  | "CLOSED"
  | "BLOCKED";

export type SovereignIncidentReclosureAuditEventType =
  | "RECLOSURE_REQUESTED"
  | "RECLOSURE_VALIDATED"
  | "RECLOSURE_EXECUTED"
  | "RECLOSURE_VERIFIED"
  | "RECURRENCE_RESOLUTION_VERIFIED"
  | "CORRECTIVE_ACTIONS_VERIFIED"
  | "PREVENTIVE_CONTROLS_VERIFIED"
  | "SECURITY_VALIDATED"
  | "INTEGRITY_VALIDATED"
  | "FINAL_STATE_CERTIFIED"
  | "AUDIT_VERIFIED"
  | "AUDIT_CLOSED";

export interface SovereignIncidentReclosureAuditAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignIncidentReclosureAuditEvent {
  eventId: string;

  type: SovereignIncidentReclosureAuditEventType;

  actorId: string;

  timestamp: number;

  message: string;

  evidence?: Record<string, unknown>;

  previousHash?: string;
  eventHash: string;
}

export interface SovereignIncidentReclosureAuditRequest {
  auditId: string;

  incidentId: string;
  reclosureId: string;
  verificationId: string;

  target: string;

  requestedBy: string;

  authorityContext:
    SovereignIncidentReclosureAuditAuthorityContext;

  securityApproved: boolean;
  policyApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignIncidentReclosureAuditRecord {
  auditId: string;

  incidentId: string;
  reclosureId: string;
  verificationId: string;

  target: string;

  state: SovereignIncidentReclosureAuditState;

  events: SovereignIncidentReclosureAuditEvent[];

  chainHead?: string;

  createdAt: number;
  updatedAt: number;
  closedAt?: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignIncidentReclosureAuditResult {
  auditId: string;

  incidentId: string;
  reclosureId: string;

  target: string;

  accepted: boolean;

  state: SovereignIncidentReclosureAuditState;

  eventCount: number;

  chainHead?: string;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsIncidentReclosureAudit {
  public readonly id =
    SOVEREIGN_OPERATIONS_INCIDENT_RECLOSURE_AUDIT_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_INCIDENT_RECLOSURE_AUDIT_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly auditCanCreateAuthority = false;
  public readonly auditCanEscalateAuthority = false;
  public readonly auditCanOverrideOwner = false;

  public readonly auditCanBypassSecurity = false;
  public readonly auditCanIgnoreIntegrityFailure = false;

  public readonly auditCanRewriteHistory = false;
  public readonly auditCanDeleteEvidence = false;
  public readonly auditCanAlterHashChain = false;
  public readonly auditCanHideReclosureFailure = false;

  public readonly auditCanDisableItself = false;

  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<
      string,
      SovereignIncidentReclosureAuditRecord
    >();

  public register(
    request: SovereignIncidentReclosureAuditRequest,
    now = Date.now()
  ): SovereignIncidentReclosureAuditResult {
    if (
      this.records.has(request.auditId)
    ) {
      return this.failure(
        request.auditId,
        request.incidentId,
        request.reclosureId,
        request.target,
        "RECLOSURE_AUDIT_ALREADY_EXISTS"
      );
    }

    const reasons =
      this.validateRequest(request);

    if (reasons.length > 0) {
      return {
        auditId: request.auditId,

        incidentId: request.incidentId,
        reclosureId: request.reclosureId,

        target: request.target,

        accepted: false,

        state: "BLOCKED",

        eventCount: 0,

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record:
      SovereignIncidentReclosureAuditRecord = {
        auditId: request.auditId,

        incidentId: request.incidentId,
        reclosureId: request.reclosureId,
        verificationId:
          request.verificationId,

        target: request.target,

        state: "OPEN",

        events: [],

        createdAt: request.createdAt,
        updatedAt: now,

        reasons: [
          "INCIDENT_RECLOSURE_AUDIT_REGISTERED"
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
      type: SovereignIncidentReclosureAuditEventType;
      actorId: string;
      timestamp?: number;
      message: string;
      evidence?: Record<string, unknown>;
    }
  ): SovereignIncidentReclosureAuditResult {
    const record =
      this.records.get(auditId);

    if (!record) {
      return this.failure(
        auditId,
        "",
        "",
        "",
        "RECLOSURE_AUDIT_NOT_FOUND"
      );
    }

    if (
      record.state === "CLOSED" ||
      record.state === "BLOCKED"
    ) {
      return this.failure(
        record.auditId,
        record.incidentId,
        record.reclosureId,
        record.target,
        "RECLOSURE_AUDIT_NOT_WRITABLE"
      );
    }

    if (!input.eventId) {
      return this.failure(
        record.auditId,
        record.incidentId,
        record.reclosureId,
        record.target,
        "EVENT_ID_REQUIRED"
      );
    }

    if (!input.actorId) {
      return this.failure(
        record.auditId,
        record.incidentId,
        record.reclosureId,
        record.target,
        "ACTOR_ID_REQUIRED"
      );
    }

    if (!input.message) {
      return this.failure(
        record.auditId,
        record.incidentId,
        record.reclosureId,
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
        record.reclosureId,
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

    const event:
      SovereignIncidentReclosureAuditEvent = {
        eventId: input.eventId,

        type: input.type,

        actorId: input.actorId,

        timestamp,

        message: input.message,

        evidence:
          input.evidence
            ? { ...input.evidence }
            : undefined,

        previousHash,
        eventHash
      };

    record.events.push(event);

    record.chainHead =
      eventHash;

    record.state =
      input.type === "AUDIT_VERIFIED"
        ? "VERIFIED"
        : "ACTIVE";

    record.updatedAt =
      timestamp;

    record.reasons = [
      `INCIDENT_RECLOSURE_AUDIT_EVENT_${input.type}`
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
          brokenEventId:
            event.eventId
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
          previousHash:
            event.previousHash
        });

      if (
        expectedHash !== event.eventHash
      ) {
        return {
          valid: false,
          checkedEvents,
          brokenEventId:
            event.eventId
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
  ): SovereignIncidentReclosureAuditResult {
    const record =
      this.records.get(auditId);

    if (!record) {
      return this.failure(
        auditId,
        "",
        "",
        "",
        "RECLOSURE_AUDIT_NOT_FOUND"
      );
    }

    const chain =
      this.verifyChain(auditId);

    if (!chain.valid) {
      record.state = "BLOCKED";

      record.updatedAt = now;

      record.reasons = [
        "RECLOSURE_AUDIT_CHAIN_INVALID"
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

    const requiredEvents:
      SovereignIncidentReclosureAuditEventType[] = [
        "RECLOSURE_EXECUTED",
        "RECLOSURE_VERIFIED",
        "RECURRENCE_RESOLUTION_VERIFIED",
        "CORRECTIVE_ACTIONS_VERIFIED",
        "PREVENTIVE_CONTROLS_VERIFIED",
        "SECURITY_VALIDATED",
        "INTEGRITY_VALIDATED",
        "FINAL_STATE_CERTIFIED"
      ];

    const missing =
      requiredEvents.filter(
        (required) =>
          !record.events.some(
            (event) =>
              event.type === required
          )
      );

    if (missing.length > 0) {
      record.state = "BLOCKED";

      record.updatedAt = now;

      record.reasons = [
        "RECLOSURE_AUDIT_REQUIRED_EVENTS_MISSING",
        ...missing.map(
          (event) =>
            `MISSING_EVENT_${event}`
        )
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
      "INCIDENT_RECLOSURE_AUDIT_CLOSED",
      "RECLOSURE_HISTORY_PRESERVED",
      "FINAL_STATE_AUDIT_VERIFIED"
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
    request:
      SovereignIncidentReclosureAuditRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.auditId) {
      reasons.push(
        "AUDIT_ID_REQUIRED"
      );
    }

    if (!request.incidentId) {
      reasons.push(
        "INCIDENT_ID_REQUIRED"
      );
    }

    if (!request.reclosureId) {
      reasons.push(
        "RECLOSURE_ID_REQUIRED"
      );
    }

    if (!request.verificationId) {
      reasons.push(
        "VERIFICATION_ID_REQUIRED"
      );
    }

    if (!request.target) {
      reasons.push(
        "TARGET_REQUIRED"
      );
    }

    if (!request.requestedBy) {
      reasons.push(
        "REQUESTER_REQUIRED"
      );
    }

    if (!request.securityApproved) {
      reasons.push(
        "SECURITY_APPROVAL_REQUIRED"
      );
    }

    if (!request.policyApproved) {
      reasons.push(
        "POLICY_APPROVAL_REQUIRED"
      );
    }

    if (
      !request.authorityContext.ownerId
    ) {
      reasons.push(
        "OWNER_ID_REQUIRED"
      );
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
      type: SovereignIncidentReclosureAuditEventType;
      actorId: string;
      timestamp: number;
      message: string;
      evidence?: Record<string, unknown>;
      previousHash?: string;
    }
  ): string {
    const canonical =
      JSON.stringify({
        eventId:
          input.eventId,

        type:
          input.type,

        actorId:
          input.actorId,

        timestamp:
          input.timestamp,

        message:
          input.message,

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
    | SovereignIncidentReclosureAuditRecord
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
    SovereignIncidentReclosureAuditRecord[] {
    return [
      ...this.records.values()
    ]
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

  public getClosedAudits():
    SovereignIncidentReclosureAuditRecord[] {
    return [
      ...this.records.values()
    ]
      .filter(
        (record) =>
          record.state === "CLOSED"
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
    record:
      SovereignIncidentReclosureAuditRecord,
    now: number
  ): SovereignIncidentReclosureAuditResult {
    return {
      auditId:
        record.auditId,

      incidentId:
        record.incidentId,

      reclosureId:
        record.reclosureId,

      target:
        record.target,

      accepted:
        record.state !== "BLOCKED",

      state:
        record.state,

      eventCount:
        record.events.length,

      chainHead:
        record.chainHead,

      reasons:
        [...record.reasons],

      timestamp:
        now,

      authority:
        "NONE"
    };
  }

  private failure(
    auditId: string,
    incidentId: string,
    reclosureId: string,
    target: string,
    reason: string
  ): SovereignIncidentReclosureAuditResult {
    return {
      auditId,
      incidentId,
      reclosureId,
      target,

      accepted: false,

      state: "BLOCKED",

      eventCount: 0,

      reasons: [
        reason
      ],

      timestamp:
        Date.now(),

      authority:
        "NONE"
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
      this.auditCanIgnoreIntegrityFailure === false &&

      this.auditCanRewriteHistory === false &&
      this.auditCanDeleteEvidence === false &&
      this.auditCanAlterHashChain === false &&
      this.auditCanHideReclosureFailure === false &&

      this.auditCanDisableItself === false &&

      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsIncidentReclosureAudit =
  new SovereignOperationsIncidentReclosureAudit();

export default sovereignOperationsIncidentReclosureAudit;

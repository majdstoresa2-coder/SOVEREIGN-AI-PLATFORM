// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-LIFECYCLE-113.ts
// Sequence: 113
// Purpose: Sovereign Operations Lifecycle Tracking & Transition Control
// ============================================================================

export const SOVEREIGN_OPERATIONS_LIFECYCLE_ID =
  "SOVEREIGN-OPERATIONS-LIFECYCLE-113";

export const SOVEREIGN_OPERATIONS_LIFECYCLE_VERSION = "1.0.0";

export type SovereignLifecycleState =
  | "CREATED"
  | "VALIDATED"
  | "QUEUED"
  | "SCHEDULED"
  | "DISPATCHED"
  | "EXECUTING"
  | "VERIFYING"
  | "COMPLETED"
  | "FAILED"
  | "RECOVERING"
  | "ROLLED_BACK"
  | "CANCELLED";

export interface SovereignLifecycleAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignLifecycleRequest {
  lifecycleId: string;
  operationId: string;

  requestedBy: string;
  target: string;

  authorityContext: SovereignLifecycleAuthorityContext;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignLifecycleTransition {
  from: SovereignLifecycleState;
  to: SovereignLifecycleState;

  timestamp: number;

  reason?: string;
}

export interface SovereignLifecycleRecord {
  lifecycleId: string;
  operationId: string;

  requestedBy: string;
  target: string;

  state: SovereignLifecycleState;

  createdAt: number;
  updatedAt: number;

  completedAt?: number;

  transitions: SovereignLifecycleTransition[];

  failureReason?: string;

  authority: "NONE";
}

export interface SovereignLifecycleResult {
  lifecycleId: string;
  operationId: string;

  accepted: boolean;

  state: SovereignLifecycleState;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsLifecycle {
  public readonly id =
    SOVEREIGN_OPERATIONS_LIFECYCLE_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_LIFECYCLE_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly lifecycleCanCreateAuthority = false;
  public readonly lifecycleCanEscalateAuthority = false;
  public readonly lifecycleCanOverrideOwner = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignLifecycleRecord>();

  private readonly allowedTransitions:
    Record<
      SovereignLifecycleState,
      SovereignLifecycleState[]
    > = {
      CREATED: [
        "VALIDATED",
        "FAILED",
        "CANCELLED"
      ],

      VALIDATED: [
        "QUEUED",
        "SCHEDULED",
        "FAILED",
        "CANCELLED"
      ],

      QUEUED: [
        "SCHEDULED",
        "DISPATCHED",
        "FAILED",
        "CANCELLED"
      ],

      SCHEDULED: [
        "DISPATCHED",
        "FAILED",
        "CANCELLED"
      ],

      DISPATCHED: [
        "EXECUTING",
        "FAILED",
        "CANCELLED"
      ],

      EXECUTING: [
        "VERIFYING",
        "FAILED",
        "RECOVERING"
      ],

      VERIFYING: [
        "COMPLETED",
        "FAILED",
        "RECOVERING"
      ],

      COMPLETED: [],

      FAILED: [
        "RECOVERING"
      ],

      RECOVERING: [
        "QUEUED",
        "ROLLED_BACK",
        "FAILED"
      ],

      ROLLED_BACK: [],

      CANCELLED: []
    };

  private validateAuthority(
    request: SovereignLifecycleRequest
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

  public create(
    request: SovereignLifecycleRequest
  ): SovereignLifecycleResult {
    const now = Date.now();

    const reasons =
      this.validateAuthority(request);

    if (!request.lifecycleId) {
      reasons.push("LIFECYCLE_ID_REQUIRED");
    }

    if (!request.operationId) {
      reasons.push("OPERATION_ID_REQUIRED");
    }

    if (!request.target) {
      reasons.push("TARGET_REQUIRED");
    }

    if (
      this.records.has(request.lifecycleId)
    ) {
      reasons.push(
        "LIFECYCLE_ALREADY_EXISTS"
      );
    }

    if (reasons.length > 0) {
      return {
        lifecycleId: request.lifecycleId,
        operationId: request.operationId,

        accepted: false,

        state: "FAILED",

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignLifecycleRecord = {
      lifecycleId: request.lifecycleId,
      operationId: request.operationId,

      requestedBy: request.requestedBy,
      target: request.target,

      state: "CREATED",

      createdAt: request.createdAt,
      updatedAt: now,

      transitions: [],

      authority: "NONE"
    };

    this.records.set(
      record.lifecycleId,
      record
    );

    return this.success(record);
  }

  public transition(
    lifecycleId: string,
    nextState: SovereignLifecycleState,
    reason?: string
  ): SovereignLifecycleResult {
    const record =
      this.records.get(lifecycleId);

    if (!record) {
      return this.failure(
        lifecycleId,
        "",
        "LIFECYCLE_NOT_FOUND"
      );
    }

    const allowed =
      this.allowedTransitions[record.state];

    if (!allowed.includes(nextState)) {
      return this.failure(
        record.lifecycleId,
        record.operationId,
        `INVALID_TRANSITION_${record.state}_TO_${nextState}`
      );
    }

    const now = Date.now();

    const transition:
      SovereignLifecycleTransition = {
        from: record.state,
        to: nextState,
        timestamp: now,
        reason
      };

    record.transitions.push(transition);

    record.state = nextState;
    record.updatedAt = now;

    if (nextState === "FAILED") {
      record.failureReason =
        reason ?? "OPERATION_FAILED";
    }

    if (nextState === "COMPLETED") {
      record.completedAt = now;
      record.failureReason = undefined;
    }

    this.records.set(
      record.lifecycleId,
      record
    );

    return this.success(record);
  }

  public validate(
    lifecycleId: string
  ): SovereignLifecycleResult {
    return this.transition(
      lifecycleId,
      "VALIDATED"
    );
  }

  public queue(
    lifecycleId: string
  ): SovereignLifecycleResult {
    return this.transition(
      lifecycleId,
      "QUEUED"
    );
  }

  public schedule(
    lifecycleId: string
  ): SovereignLifecycleResult {
    return this.transition(
      lifecycleId,
      "SCHEDULED"
    );
  }

  public dispatch(
    lifecycleId: string
  ): SovereignLifecycleResult {
    return this.transition(
      lifecycleId,
      "DISPATCHED"
    );
  }

  public execute(
    lifecycleId: string
  ): SovereignLifecycleResult {
    return this.transition(
      lifecycleId,
      "EXECUTING"
    );
  }

  public verify(
    lifecycleId: string
  ): SovereignLifecycleResult {
    return this.transition(
      lifecycleId,
      "VERIFYING"
    );
  }

  public complete(
    lifecycleId: string
  ): SovereignLifecycleResult {
    return this.transition(
      lifecycleId,
      "COMPLETED"
    );
  }

  public fail(
    lifecycleId: string,
    reason = "OPERATION_FAILED"
  ): SovereignLifecycleResult {
    return this.transition(
      lifecycleId,
      "FAILED",
      reason
    );
  }

  public recover(
    lifecycleId: string,
    reason = "RECOVERY_REQUIRED"
  ): SovereignLifecycleResult {
    return this.transition(
      lifecycleId,
      "RECOVERING",
      reason
    );
  }

  public rollback(
    lifecycleId: string,
    reason = "ROLLBACK_COMPLETED"
  ): SovereignLifecycleResult {
    return this.transition(
      lifecycleId,
      "ROLLED_BACK",
      reason
    );
  }

  public cancel(
    lifecycleId: string,
    reason = "OPERATION_CANCELLED"
  ): SovereignLifecycleResult {
    return this.transition(
      lifecycleId,
      "CANCELLED",
      reason
    );
  }

  public canTransition(
    lifecycleId: string,
    nextState: SovereignLifecycleState
  ): boolean {
    const record =
      this.records.get(lifecycleId);

    if (!record) {
      return false;
    }

    return this.allowedTransitions[
      record.state
    ].includes(nextState);
  }

  public getRecord(
    lifecycleId: string
  ): SovereignLifecycleRecord | undefined {
    const record =
      this.records.get(lifecycleId);

    return record
      ? {
          ...record,
          transitions:
            record.transitions.map(
              (transition) => ({
                ...transition
              })
            )
        }
      : undefined;
  }

  public getByOperation(
    operationId: string
  ): SovereignLifecycleRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.operationId === operationId
      )
      .map((record) => ({
        ...record,
        transitions:
          record.transitions.map(
            (transition) => ({
              ...transition
            })
          )
      }));
  }

  public getActive():
    SovereignLifecycleRecord[] {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.state !== "COMPLETED" &&
          record.state !== "FAILED" &&
          record.state !== "ROLLED_BACK" &&
          record.state !== "CANCELLED"
      )
      .map((record) => ({
        ...record,
        transitions:
          record.transitions.map(
            (transition) => ({
              ...transition
            })
         

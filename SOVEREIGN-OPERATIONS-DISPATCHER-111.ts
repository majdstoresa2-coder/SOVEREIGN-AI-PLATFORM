// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-DISPATCHER-111.ts
// Sequence: 111
// Purpose: Sovereign Operations Dispatch & Worker Assignment Control
// ============================================================================

export const SOVEREIGN_OPERATIONS_DISPATCHER_ID =
  "SOVEREIGN-OPERATIONS-DISPATCHER-111";

export const SOVEREIGN_OPERATIONS_DISPATCHER_VERSION = "1.0.0";

export type SovereignDispatchState =
  | "PENDING"
  | "VALIDATING"
  | "READY"
  | "ASSIGNED"
  | "DISPATCHED"
  | "REJECTED"
  | "FAILED"
  | "CANCELLED";

export type SovereignDispatchPriority =
  | "CRITICAL"
  | "HIGH"
  | "NORMAL"
  | "LOW";

export interface SovereignDispatcherAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignDispatchRequest {
  dispatchId: string;
  operationId: string;

  queueItemId?: string;
  scheduleId?: string;

  requestedBy: string;
  target: string;

  priority: SovereignDispatchPriority;

  authorityContext: SovereignDispatcherAuthorityContext;

  queueApproved: boolean;
  schedulerApproved: boolean;
  operationsApproved: boolean;
  securityApproved: boolean;
  policyApproved: boolean;

  requiredCapabilities?: string[];

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignDispatchWorker {
  workerId: string;

  healthy: boolean;
  available: boolean;

  capabilities: string[];

  activeJobs: number;
  maxConcurrentJobs: number;

  lastHeartbeatAt: number;
}

export interface SovereignDispatchRecord {
  dispatchId: string;
  operationId: string;

  queueItemId?: string;
  scheduleId?: string;

  requestedBy: string;
  target: string;

  priority: SovereignDispatchPriority;

  state: SovereignDispatchState;

  assignedWorkerId?: string;

  createdAt: number;
  updatedAt: number;

  assignedAt?: number;
  dispatchedAt?: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignDispatchResult {
  dispatchId: string;
  operationId: string;

  accepted: boolean;

  state: SovereignDispatchState;

  workerId?: string;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsDispatcher {
  public readonly id =
    SOVEREIGN_OPERATIONS_DISPATCHER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_DISPATCHER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly dispatcherCanCreateAuthority = false;
  public readonly dispatcherCanEscalateAuthority = false;
  public readonly dispatcherCanOverrideOwner = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly records =
    new Map<string, SovereignDispatchRecord>();

  private validateAuthority(
    request: SovereignDispatchRequest
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

  private validateRequest(
    request: SovereignDispatchRequest
  ): string[] {
    const reasons =
      this.validateAuthority(request);

    if (!request.dispatchId) {
      reasons.push("DISPATCH_ID_REQUIRED");
    }

    if (!request.operationId) {
      reasons.push("OPERATION_ID_REQUIRED");
    }

    if (!request.target) {
      reasons.push("TARGET_REQUIRED");
    }

    if (
      !request.queueItemId &&
      !request.scheduleId
    ) {
      reasons.push(
        "QUEUE_ITEM_OR_SCHEDULE_REQUIRED"
      );
    }

    if (!request.queueApproved) {
      reasons.push("QUEUE_APPROVAL_REQUIRED");
    }

    if (!request.schedulerApproved) {
      reasons.push("SCHEDULER_APPROVAL_REQUIRED");
    }

    if (!request.operationsApproved) {
      reasons.push("OPERATIONS_APPROVAL_REQUIRED");
    }

    if (!request.securityApproved) {
      reasons.push("SECURITY_APPROVAL_REQUIRED");
    }

    if (!request.policyApproved) {
      reasons.push("POLICY_APPROVAL_REQUIRED");
    }

    return reasons;
  }

  private workerSupportsCapabilities(
    worker: SovereignDispatchWorker,
    requiredCapabilities: string[]
  ): boolean {
    return requiredCapabilities.every(
      (capability) =>
        worker.capabilities.includes(capability)
    );
  }

  private selectWorker(
    workers: SovereignDispatchWorker[],
    requiredCapabilities: string[]
  ): SovereignDispatchWorker | undefined {
    return workers
      .filter(
        (worker) =>
          worker.healthy &&
          worker.available &&
          worker.activeJobs <
            worker.maxConcurrentJobs &&
          this.workerSupportsCapabilities(
            worker,
            requiredCapabilities
          )
      )
      .sort((a, b) => {
        if (a.activeJobs !== b.activeJobs) {
          return a.activeJobs - b.activeJobs;
        }

        return (
          b.lastHeartbeatAt -
          a.lastHeartbeatAt
        );
      })[0];
  }

  public dispatch(
    request: SovereignDispatchRequest,
    workers: SovereignDispatchWorker[]
  ): SovereignDispatchResult {
    const now = Date.now();

    if (this.records.has(request.dispatchId)) {
      return {
        dispatchId: request.dispatchId,
        operationId: request.operationId,

        accepted: false,

        state: "REJECTED",

        reasons: [
          "DISPATCH_ALREADY_EXISTS"
        ],

        timestamp: now,

        authority: "NONE"
      };
    }

    const reasons =
      this.validateRequest(request);

    if (reasons.length > 0) {
      return {
        dispatchId: request.dispatchId,
        operationId: request.operationId,

        accepted: false,

        state: "REJECTED",

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const requiredCapabilities =
      request.requiredCapabilities ?? [];

    const worker = this.selectWorker(
      workers,
      requiredCapabilities
    );

    if (!worker) {
      const record: SovereignDispatchRecord = {
        dispatchId: request.dispatchId,
        operationId: request.operationId,

        queueItemId: request.queueItemId,
        scheduleId: request.scheduleId,

        requestedBy: request.requestedBy,
        target: request.target,

        priority: request.priority,

        state: "PENDING",

        createdAt: request.createdAt,
        updatedAt: now,

        reasons: [
          "NO_HEALTHY_WORKER_AVAILABLE"
        ],

        authority: "NONE"
      };

      this.records.set(
        record.dispatchId,
        record
      );

      return {
        dispatchId: record.dispatchId,
        operationId: record.operationId,

        accepted: false,

        state: record.state,

        reasons: [...record.reasons],

        timestamp: now,

        authority: "NONE"
      };
    }

    const record: SovereignDispatchRecord = {
      dispatchId: request.dispatchId,
      operationId: request.operationId,

      queueItemId: request.queueItemId,
      scheduleId: request.scheduleId,

      requestedBy: request.requestedBy,
      target: request.target,

      priority: request.priority,

      state: "DISPATCHED",

      assignedWorkerId: worker.workerId,

      createdAt: request.createdAt,
      updatedAt: now,

      assignedAt: now,
      dispatchedAt: now,

      reasons: [],

      authority: "NONE"
    };

    this.records.set(
      record.dispatchId,
      record
    );

    return {
      dispatchId: record.dispatchId,
      operationId: record.operationId,

      accepted: true,

      state: record.state,

      workerId: worker.workerId,

      reasons: [],

      timestamp: now,

      authority: "NONE"
    };
  }

  public retry(
    dispatchId: string,
    workers: SovereignDispatchWorker[]
  ): SovereignDispatchResult {
    const record =
      this.records.get(dispatchId);

    if (!record) {
      return this.failure(
        dispatchId,
        "",
        "DISPATCH_NOT_FOUND"
      );
    }

    if (
      record.state !== "PENDING" &&
      record.state !== "FAILED"
    ) {
      return this.failure(
        record.dispatchId,
        record.operationId,
        "DISPATCH_NOT_RETRYABLE"
      );
    }

    const worker = this.selectWorker(
      workers,
      []
    );

    if (!worker) {
      record.state = "PENDING";
      record.updatedAt = Date.now();
      record.reasons = [
        "NO_HEALTHY_WORKER_AVAILABLE"
      ];

      this.records.set(
        record.dispatchId,
        record
      );

      return {
        dispatchId: record.dispatchId,
        operationId: record.operationId,

        accepted: false,

        state: record.state,

        reasons: [...record.reasons],

        timestamp: Date.now(),

        authority: "NONE"
      };
    }

    const now = Date.now();

    record.assignedWorkerId =
      worker.workerId;

    record.assignedAt = now;
    record.dispatchedAt = now;

    record.state = "DISPATCHED";
    record.updatedAt = now;
    record.reasons = [];

    this.records.set(
      record.dispatchId,
      record
    );

    return {
      dispatchId: record.dispatchId,
      operationId: record.operationId,

      accepted: true,

      state: record.state,

      workerId: worker.workerId,

      reasons: [],

      timestamp: now,

      authority: "NONE"
    };
  }

  public fail(
    dispatchId: string,
    reason = "DISPATCH_FAILED"
  ): SovereignDispatchResult {
    const record =
      this.records.get(dispatchId);

    if (!record) {
      return this.failure(
        dispatchId,
        "",
        "DISPATCH_NOT_FOUND"
      );
    }

    record.state = "FAILED";
    record.updatedAt = Date.now();
    record.reasons = [reason];

    this.records.set(
      record.dispatchId,
      record
    );

    return {
      dispatchId: record.dispatchId,
      operationId: record.operationId,

      accepted: false,

      state: record.state,

      workerId: record.assignedWorkerId,

      reasons: [...record.reasons],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  public cancel(
    dispatchId: string
  ): SovereignDispatchResult {
    const record =
      this.records.get(dispatchId);

    if (!record) {
      return this.failure(
        dispatchId,
        "",
        "DISPATCH_NOT_FOUND"
      );
    }

    if (
      record.state === "DISPATCHED" ||
      record.state === "CANCELLED"
    ) {
      return this.failure(
        record.dispatchId,
        record.operationId,
        "DISPATCH_CANNOT_BE_CANCELLED"
      );
    }

    record.state = "CANCELLED";
    record.updatedAt = Date.now();

    this.records.set(
      record.dispatchId,
      record
    );

    return {
      dispatchId: record.dispatchId,
      operationId: record.operationId,

      accepted: true,

      state: record.state,

      reasons: [],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  public getRecord(
    dispatchId: string
  ): SovereignDispatchRecord | undefined {
    const record =
      this.records.get(dispatchId);

    return record
      ? {
          ...record,
          reasons: [...record.reasons]
        }
      : undefined;
  }

  public getSnapshot():
    SovereignDispatchRecord[] {
    return [...this.records.values()]
      .map((record) => ({
        ...record,
        reasons: [...record.reasons]
      }));
  }

  private failure(
    dispatchId: string,
    operationId: string,
    reason: string
  ): SovereignDispatchResult {
    return {
      dispatchId,
      operationId,

      accepted: false,

      state: "FAILED",

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
      this.dispatcherCanCreateAuthority === false &&
      this.dispatcherCanEscalateAuthority === false &&
      this.dispatcherCanOverrideOwner === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsDispatcher =
  new SovereignOperationsDispatcher();

export default sovereignOperationsDispatcher;

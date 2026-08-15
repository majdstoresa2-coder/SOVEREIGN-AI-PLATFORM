// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-QUEUE-107.ts
// Sequence: 107
// Purpose: Sovereign Operations Queue & Scheduling Control
// ============================================================================

export const SOVEREIGN_OPERATIONS_QUEUE_ID =
  "SOVEREIGN-OPERATIONS-QUEUE-107";

export const SOVEREIGN_OPERATIONS_QUEUE_VERSION = "1.0.0";

export type SovereignQueuePriority =
  | "CRITICAL"
  | "HIGH"
  | "NORMAL"
  | "LOW";

export type SovereignQueueState =
  | "QUEUED"
  | "RESERVED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "RETRYING"
  | "CANCELLED"
  | "EXPIRED";

export interface SovereignQueueAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignQueueRequest {
  queueItemId: string;
  operationId: string;

  requestedBy: string;

  target: string;

  priority: SovereignQueuePriority;

  authorityContext: SovereignQueueAuthorityContext;

  createdAt: number;

  maxRetries?: number;

  ttlMs?: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignQueueItem {
  queueItemId: string;
  operationId: string;

  requestedBy: string;

  target: string;

  priority: SovereignQueuePriority;

  state: SovereignQueueState;

  retryCount: number;
  maxRetries: number;

  createdAt: number;
  updatedAt: number;

  expiresAt?: number;

  reservedAt?: number;
  processingAt?: number;
  completedAt?: number;

  failureReason?: string;

  authority: "NONE";
}

export interface SovereignQueueResult {
  queueItemId: string;
  operationId: string;

  accepted: boolean;

  state: SovereignQueueState;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsQueue {
  public readonly id =
    SOVEREIGN_OPERATIONS_QUEUE_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_QUEUE_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly queueCanCreateAuthority = false;
  public readonly queueCanEscalateAuthority = false;
  public readonly queueCanOverrideOwner = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly items =
    new Map<string, SovereignQueueItem>();

  private validateAuthority(
    request: SovereignQueueRequest
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

  private priorityWeight(
    priority: SovereignQueuePriority
  ): number {
    switch (priority) {
      case "CRITICAL":
        return 4;

      case "HIGH":
        return 3;

      case "NORMAL":
        return 2;

      case "LOW":
        return 1;
    }
  }

  private cleanupExpired(
    now = Date.now()
  ): void {
    for (const item of this.items.values()) {
      if (
        item.expiresAt !== undefined &&
        item.expiresAt <= now &&
        (
          item.state === "QUEUED" ||
          item.state === "RESERVED"
        )
      ) {
        item.state = "EXPIRED";
        item.updatedAt = now;
      }
    }
  }

  public enqueue(
    request: SovereignQueueRequest
  ): SovereignQueueResult {
    const now = Date.now();

    this.cleanupExpired(now);

    const reasons =
      this.validateAuthority(request);

    if (!request.queueItemId) {
      reasons.push("QUEUE_ITEM_ID_REQUIRED");
    }

    if (!request.operationId) {
      reasons.push("OPERATION_ID_REQUIRED");
    }

    if (!request.target) {
      reasons.push("TARGET_REQUIRED");
    }

    if (this.items.has(request.queueItemId)) {
      reasons.push("QUEUE_ITEM_ALREADY_EXISTS");
    }

    if (
      request.maxRetries !== undefined &&
      (
        !Number.isInteger(request.maxRetries) ||
        request.maxRetries < 0
      )
    ) {
      reasons.push("INVALID_MAX_RETRIES");
    }

    if (
      request.ttlMs !== undefined &&
      (
        !Number.isFinite(request.ttlMs) ||
        request.ttlMs <= 0
      )
    ) {
      reasons.push("INVALID_TTL");
    }

    if (reasons.length > 0) {
      return {
        queueItemId: request.queueItemId,
        operationId: request.operationId,

        accepted: false,

        state: "FAILED",

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const item: SovereignQueueItem = {
      queueItemId: request.queueItemId,
      operationId: request.operationId,

      requestedBy: request.requestedBy,

      target: request.target,

      priority: request.priority,

      state: "QUEUED",

      retryCount: 0,
      maxRetries: request.maxRetries ?? 3,

      createdAt: request.createdAt,
      updatedAt: now,

      expiresAt:
        request.ttlMs !== undefined
          ? now + request.ttlMs
          : undefined,

      authority: "NONE"
    };

    this.items.set(
      item.queueItemId,
      item
    );

    return {
      queueItemId: item.queueItemId,
      operationId: item.operationId,

      accepted: true,

      state: "QUEUED",

      reasons: [],

      timestamp: now,

      authority: "NONE"
    };
  }

  public next():
    SovereignQueueItem | undefined {
    this.cleanupExpired();

    const available = [...this.items.values()]
      .filter(
        (item) =>
          item.state === "QUEUED" ||
          item.state === "RETRYING"
      )
      .sort((a, b) => {
        const priorityDifference =
          this.priorityWeight(b.priority) -
          this.priorityWeight(a.priority);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return a.createdAt - b.createdAt;
      });

    const item = available[0];

    if (!item) {
      return undefined;
    }

    item.state = "RESERVED";
    item.reservedAt = Date.now();
    item.updatedAt = Date.now();

    this.items.set(
      item.queueItemId,
      item
    );

    return { ...item };
  }

  public markProcessing(
    queueItemId: string
  ): SovereignQueueResult {
    const item = this.items.get(queueItemId);

    if (!item) {
      return this.failure(
        queueItemId,
        "",
        "QUEUE_ITEM_NOT_FOUND"
      );
    }

    if (item.state !== "RESERVED") {
      return this.failure(
        item.queueItemId,
        item.operationId,
        "QUEUE_ITEM_NOT_RESERVED"
      );
    }

    item.state = "PROCESSING";
    item.processingAt = Date.now();
    item.updatedAt = Date.now();

    this.items.set(queueItemId, item);

    return this.success(item);
  }

  public complete(
    queueItemId: string
  ): SovereignQueueResult {
    const item = this.items.get(queueItemId);

    if (!item) {
      return this.failure(
        queueItemId,
        "",
        "QUEUE_ITEM_NOT_FOUND"
      );
    }

    if (item.state !== "PROCESSING") {
      return this.failure(
        item.queueItemId,
        item.operationId,
        "QUEUE_ITEM_NOT_PROCESSING"
      );
    }

    item.state = "COMPLETED";
    item.completedAt = Date.now();
    item.updatedAt = Date.now();

    this.items.set(queueItemId, item);

    return this.success(item);
  }

  public fail(
    queueItemId: string,
    reason = "OPERATION_FAILED"
  ): SovereignQueueResult {
    const item = this.items.get(queueItemId);

    if (!item) {
      return this.failure(
        queueItemId,
        "",
        "QUEUE_ITEM_NOT_FOUND"
      );
    }

    item.failureReason = reason;

    if (item.retryCount < item.maxRetries) {
      item.retryCount += 1;
      item.state = "RETRYING";
    } else {
      item.state = "FAILED";
    }

    item.updatedAt = Date.now();

    this.items.set(queueItemId, item);

    return this.success(item);
  }

  public cancel(
    queueItemId: string
  ): SovereignQueueResult {
    const item = this.items.get(queueItemId);

    if (!item) {
      return this.failure(
        queueItemId,
        "",
        "QUEUE_ITEM_NOT_FOUND"
      );
    }

    if (
      item.state === "COMPLETED" ||
      item.state === "CANCELLED"
    ) {
      return this.failure(
        item.queueItemId,
        item.operationId,
        "QUEUE_ITEM_CANNOT_BE_CANCELLED"
      );
    }

    item.state = "CANCELLED";
    item.updatedAt = Date.now();

    this.items.set(queueItemId, item);

    return this.success(item);
  }

  public getItem(
    queueItemId: string
  ): SovereignQueueItem | undefined {
    this.cleanupExpired();

    const item =
      this.items.get(queueItemId);

    return item
      ? { ...item }
      : undefined;
  }

  public getPendingCount(): number {
    this.cleanupExpired();

    return [...this.items.values()]
      .filter(
        (item) =>
          item.state === "QUEUED" ||
          item.state === "RETRYING"
      ).length;
  }

  public getQueueSnapshot():
    SovereignQueueItem[] {
    this.cleanupExpired();

    return [...this.items.values()]
      .map((item) => ({ ...item }))
      .sort((a, b) => {
        const priorityDifference =
          this.priorityWeight(b.priority) -
          this.priorityWeight(a.priority);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return a.createdAt - b.createdAt;
      });
  }

  private success(
    item: SovereignQueueItem
  ): SovereignQueueResult {
    return {
      queueItemId: item.queueItemId,
      operationId: item.operationId,

      accepted: true,

      state: item.state,

      reasons: item.failureReason
        ? [item.failureReason]
        : [],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  private failure(
    queueItemId: string,
    operationId: string,
    reason: string
  ): SovereignQueueResult {
    return {
      queueItemId,
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
      this.queueCanCreateAuthority === false &&
      this.queueCanEscalateAuthority === false &&
      this.queueCanOverrideOwner === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsQueue =
  new SovereignOperationsQueue();

export default sovereignOperationsQueue;

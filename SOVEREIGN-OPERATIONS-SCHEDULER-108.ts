// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-SCHEDULER-108.ts
// Sequence: 108
// Purpose: Sovereign Operations Scheduling & Execution Window Control
// ============================================================================

export const SOVEREIGN_OPERATIONS_SCHEDULER_ID =
  "SOVEREIGN-OPERATIONS-SCHEDULER-108";

export const SOVEREIGN_OPERATIONS_SCHEDULER_VERSION = "1.0.0";

export type SovereignScheduleState =
  | "SCHEDULED"
  | "READY"
  | "DISPATCHED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export type SovereignSchedulePriority =
  | "CRITICAL"
  | "HIGH"
  | "NORMAL"
  | "LOW";

export interface SovereignSchedulerAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignScheduleRequest {
  scheduleId: string;
  operationId: string;

  requestedBy: string;
  target: string;

  authorityContext: SovereignSchedulerAuthorityContext;

  priority: SovereignSchedulePriority;

  runAt: number;

  expiresAt?: number;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignScheduleRecord {
  scheduleId: string;
  operationId: string;

  requestedBy: string;
  target: string;

  priority: SovereignSchedulePriority;

  state: SovereignScheduleState;

  runAt: number;
  expiresAt?: number;

  createdAt: number;
  updatedAt: number;

  dispatchedAt?: number;
  completedAt?: number;

  failureReason?: string;

  authority: "NONE";
}

export interface SovereignScheduleResult {
  scheduleId: string;
  operationId: string;

  accepted: boolean;

  state: SovereignScheduleState;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsScheduler {
  public readonly id =
    SOVEREIGN_OPERATIONS_SCHEDULER_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_SCHEDULER_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly schedulerCanCreateAuthority = false;
  public readonly schedulerCanEscalateAuthority = false;
  public readonly schedulerCanOverrideOwner = false;
  public readonly stewardCanOverrideOwner = false;

  private readonly schedules =
    new Map<string, SovereignScheduleRecord>();

  private validateAuthority(
    request: SovereignScheduleRequest
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
    priority: SovereignSchedulePriority
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

  private refreshStates(
    now = Date.now()
  ): void {
    for (const schedule of this.schedules.values()) {
      if (
        schedule.expiresAt !== undefined &&
        schedule.expiresAt <= now &&
        (
          schedule.state === "SCHEDULED" ||
          schedule.state === "READY"
        )
      ) {
        schedule.state = "EXPIRED";
        schedule.updatedAt = now;
        continue;
      }

      if (
        schedule.state === "SCHEDULED" &&
        schedule.runAt <= now
      ) {
        schedule.state = "READY";
        schedule.updatedAt = now;
      }
    }
  }

  public schedule(
    request: SovereignScheduleRequest
  ): SovereignScheduleResult {
    const now = Date.now();

    const reasons =
      this.validateAuthority(request);

    if (!request.scheduleId) {
      reasons.push("SCHEDULE_ID_REQUIRED");
    }

    if (!request.operationId) {
      reasons.push("OPERATION_ID_REQUIRED");
    }

    if (!request.target) {
      reasons.push("TARGET_REQUIRED");
    }

    if (
      !Number.isFinite(request.runAt) ||
      request.runAt < 0
    ) {
      reasons.push("INVALID_RUN_AT");
    }

    if (
      request.expiresAt !== undefined &&
      (
        !Number.isFinite(request.expiresAt) ||
        request.expiresAt <= request.runAt
      )
    ) {
      reasons.push("INVALID_EXPIRATION");
    }

    if (this.schedules.has(request.scheduleId)) {
      reasons.push("SCHEDULE_ALREADY_EXISTS");
    }

    if (reasons.length > 0) {
      return {
        scheduleId: request.scheduleId,
        operationId: request.operationId,

        accepted: false,

        state: "FAILED",

        reasons,

        timestamp: now,

        authority: "NONE"
      };
    }

    const state: SovereignScheduleState =
      request.runAt <= now
        ? "READY"
        : "SCHEDULED";

    const record: SovereignScheduleRecord = {
      scheduleId: request.scheduleId,
      operationId: request.operationId,

      requestedBy: request.requestedBy,
      target: request.target,

      priority: request.priority,

      state,

      runAt: request.runAt,
      expiresAt: request.expiresAt,

      createdAt: request.createdAt,
      updatedAt: now,

      authority: "NONE"
    };

    this.schedules.set(
      record.scheduleId,
      record
    );

    return {
      scheduleId: record.scheduleId,
      operationId: record.operationId,

      accepted: true,

      state: record.state,

      reasons: [],

      timestamp: now,

      authority: "NONE"
    };
  }

  public nextReady():
    SovereignScheduleRecord | undefined {
    this.refreshStates();

    const ready = [...this.schedules.values()]
      .filter(
        (schedule) =>
          schedule.state === "READY"
      )
      .sort((a, b) => {
        const priorityDifference =
          this.priorityWeight(b.priority) -
          this.priorityWeight(a.priority);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        if (a.runAt !== b.runAt) {
          return a.runAt - b.runAt;
        }

        return a.createdAt - b.createdAt;
      });

    const schedule = ready[0];

    if (!schedule) {
      return undefined;
    }

    schedule.state = "DISPATCHED";
    schedule.dispatchedAt = Date.now();
    schedule.updatedAt = Date.now();

    this.schedules.set(
      schedule.scheduleId,
      schedule
    );

    return { ...schedule };
  }

  public complete(
    scheduleId: string
  ): SovereignScheduleResult {
    this.refreshStates();

    const schedule =
      this.schedules.get(scheduleId);

    if (!schedule) {
      return this.failure(
        scheduleId,
        "",
        "SCHEDULE_NOT_FOUND"
      );
    }

    if (schedule.state !== "DISPATCHED") {
      return this.failure(
        schedule.scheduleId,
        schedule.operationId,
        "SCHEDULE_NOT_DISPATCHED"
      );
    }

    schedule.state = "COMPLETED";
    schedule.completedAt = Date.now();
    schedule.updatedAt = Date.now();

    this.schedules.set(
      schedule.scheduleId,
      schedule
    );

    return this.success(schedule);
  }

  public fail(
    scheduleId: string,
    reason = "SCHEDULED_OPERATION_FAILED"
  ): SovereignScheduleResult {
    const schedule =
      this.schedules.get(scheduleId);

    if (!schedule) {
      return this.failure(
        scheduleId,
        "",
        "SCHEDULE_NOT_FOUND"
      );
    }

    schedule.state = "FAILED";
    schedule.failureReason = reason;
    schedule.updatedAt = Date.now();

    this.schedules.set(
      schedule.scheduleId,
      schedule
    );

    return {
      ...this.success(schedule),
      accepted: false,
      reasons: [reason]
    };
  }

  public cancel(
    scheduleId: string
  ): SovereignScheduleResult {
    this.refreshStates();

    const schedule =
      this.schedules.get(scheduleId);

    if (!schedule) {
      return this.failure(
        scheduleId,
        "",
        "SCHEDULE_NOT_FOUND"
      );
    }

    if (
      schedule.state === "COMPLETED" ||
      schedule.state === "DISPATCHED" ||
      schedule.state === "CANCELLED"
    ) {
      return this.failure(
        schedule.scheduleId,
        schedule.operationId,
        "SCHEDULE_CANNOT_BE_CANCELLED"
      );
    }

    schedule.state = "CANCELLED";
    schedule.updatedAt = Date.now();

    this.schedules.set(
      schedule.scheduleId,
      schedule
    );

    return this.success(schedule);
  }

  public reschedule(
    scheduleId: string,
    newRunAt: number,
    newExpiresAt?: number
  ): SovereignScheduleResult {
    this.refreshStates();

    const schedule =
      this.schedules.get(scheduleId);

    if (!schedule) {
      return this.failure(
        scheduleId,
        "",
        "SCHEDULE_NOT_FOUND"
      );
    }

    if (
      schedule.state === "DISPATCHED" ||
      schedule.state === "COMPLETED" ||
      schedule.state === "CANCELLED"
    ) {
      return this.failure(
        schedule.scheduleId,
        schedule.operationId,
        "SCHEDULE_CANNOT_BE_RESCHEDULED"
      );
    }

    if (
      !Number.isFinite(newRunAt) ||
      newRunAt < 0
    ) {
      return this.failure(
        schedule.scheduleId,
        schedule.operationId,
        "INVALID_RUN_AT"
      );
    }

    if (
      newExpiresAt !== undefined &&
      (
        !Number.isFinite(newExpiresAt) ||
        newExpiresAt <= newRunAt
      )
    ) {
      return this.failure(
        schedule.scheduleId,
        schedule.operationId,
        "INVALID_EXPIRATION"
      );
    }

    const now = Date.now();

    schedule.runAt = newRunAt;
    schedule.expiresAt = newExpiresAt;

    schedule.state =
      newRunAt <= now
        ? "READY"
        : "SCHEDULED";

    schedule.updatedAt = now;

    this.schedules.set(
      schedule.scheduleId,
      schedule
    );

    return this.success(schedule);
  }

  public getSchedule(
    scheduleId: string
  ): SovereignScheduleRecord | undefined {
    this.refreshStates();

    const schedule =
      this.schedules.get(scheduleId);

    return schedule
      ? { ...schedule }
      : undefined;
  }

  public getReadyCount(): number {
    this.refreshStates();

    return [...this.schedules.values()]
      .filter(
        (schedule) =>
          schedule.state === "READY"
      ).length;
  }

  public getSnapshot():
    SovereignScheduleRecord[] {
    this.refreshStates();

    return [...this.schedules.values()]
      .map((schedule) => ({ ...schedule }))
      .sort((a, b) => {
        const priorityDifference =
          this.priorityWeight(b.priority) -
          this.priorityWeight(a.priority);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return a.runAt - b.runAt;
      });
  }

  private success(
    schedule: SovereignScheduleRecord
  ): SovereignScheduleResult {
    return {
      scheduleId: schedule.scheduleId,
      operationId: schedule.operationId,

      accepted: true,

      state: schedule.state,

      reasons: schedule.failureReason
        ? [schedule.failureReason]
        : [],

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  private failure(
    scheduleId: string,
    operationId: string,
    reason: string
  ): SovereignScheduleResult {
    return {
      scheduleId,
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
      this.schedulerCanCreateAuthority === false &&
      this.schedulerCanEscalateAuthority === false &&
      this.schedulerCanOverrideOwner === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsScheduler =
  new SovereignOperationsScheduler();

export default sovereignOperationsScheduler;

/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-SCHEDULER-48
 * ============================================================
 *
 * Sovereign Scheduler Engine.
 *
 * Responsibilities:
 * - Manage sovereign scheduled tasks.
 * - Support one-time and recurring schedules.
 * - Dispatch due tasks into Sovereign Queue.
 * - Prevent duplicate scheduled execution.
 * - Support pause, resume and cancellation.
 * - Track execution history and failures.
 * - Apply retry and misfire policies.
 * - Operate without mandatory external scheduler SaaS.
 *
 * SCHEDULER IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

/* ============================================================
 * 1. SCHEDULE TYPE
 * ============================================================
 */

export type SovereignScheduleType =
  | "ONCE"
  | "INTERVAL"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "SYSTEM";

/* ============================================================
 * 2. SCHEDULE STATUS
 * ============================================================
 */

export type SovereignScheduleStatus =
  | "ACTIVE"
  | "PAUSED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "DISABLED";

/* ============================================================
 * 3. MISFIRE POLICY
 * ============================================================
 */

export type SovereignScheduleMisfirePolicy =
  | "RUN_IMMEDIATELY"
  | "SKIP"
  | "RESCHEDULE";

/* ============================================================
 * 4. EXECUTION STATUS
 * ============================================================
 */

export type SovereignScheduledExecutionStatus =
  | "DISPATCHED"
  | "SKIPPED"
  | "FAILED";

/* ============================================================
 * 5. SCHEDULE
 * ============================================================
 */

export interface SovereignSchedule {
  id: string;

  name: string;

  type: SovereignScheduleType;

  status: SovereignScheduleStatus;

  queueId: string;

  jobType: string;

  payload: unknown;

  priority:
    | "LOW"
    | "NORMAL"
    | "HIGH"
    | "CRITICAL";

  startAt: string;

  nextRunAt?: string;

  lastRunAt?: string;

  intervalSeconds?: number;

  daysOfWeek?: number[];

  dayOfMonth?: number;

  hour?: number;

  minute?: number;

  timezone: string;

  misfirePolicy: SovereignScheduleMisfirePolicy;

  maxRuns?: number;

  runCount: number;

  createdBy: string;

  createdAt: string;

  updatedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. EXECUTION RECORD
 * ============================================================
 */

export interface SovereignScheduledExecution {
  id: string;

  scheduleId: string;

  scheduledFor: string;

  dispatchedAt?: string;

  queueJobId?: string;

  status: SovereignScheduledExecutionStatus;

  reason?: string;

  createdAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. CONTEXT
 * ============================================================
 */

export interface SovereignSchedulerContext {
  actorId: string;

  authority:
    | "OWNER"
    | "STEWARD"
    | "CORE"
    | "SYSTEM";

  authenticated: boolean;

  policyChecked: boolean;

  securityChecked: boolean;

  authorizationChecked: boolean;

  permissions: string[];

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 8. STORE
 * ============================================================
 */

export interface SovereignSchedulerStore {
  saveSchedule(
    schedule: SovereignSchedule
  ): Promise<void>;

  getSchedule(
    scheduleId: string
  ): Promise<SovereignSchedule | undefined>;

  listSchedules():
    Promise<SovereignSchedule[]>;

  saveExecution(
    execution: SovereignScheduledExecution
  ): Promise<void>;

  listExecutions(
    scheduleId: string,
    limit?: number
  ): Promise<SovereignScheduledExecution[]>;

  findExecution?(
    scheduleId: string,
    scheduledFor: string
  ): Promise<SovereignScheduledExecution | undefined>;
}

/* ============================================================
 * 9. QUEUE BRIDGE
 * ============================================================
 */

export interface SovereignSchedulerQueueBridge {
  enqueue(input: {
    queueId: string;

    type: string;

    payload: unknown;

    priority:
      | "LOW"
      | "NORMAL"
      | "HIGH"
      | "CRITICAL";

    idempotencyKey: string;

    metadata?: Record<string, unknown>;
  }): Promise<{
    jobId: string;
  }>;
}

/* ============================================================
 * 10. POLICY BRIDGE
 * ============================================================
 */

export interface SovereignSchedulerPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignSchedulerContext["authority"];

    operation:
      | "CREATE"
      | "UPDATE"
      | "DISPATCH"
      | "PAUSE"
      | "RESUME"
      | "CANCEL";

    scheduleId?: string;
  }): Promise<{
    allowed: boolean;
    reason?: string;
  }>;
}

/* ============================================================
 * 11. EVENT BUS
 * ============================================================
 */

export interface SovereignSchedulerEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    scheduleId?: string;

    executionId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 12. AUDIT
 * ============================================================
 */

export interface SovereignSchedulerAudit {
  record(
    operation: string,
    subjectId: string | undefined,
    result: "SUCCESS" | "FAILED" | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 13. ENGINE
 * ============================================================
 */

export class SovereignSchedulerEngine {
  public readonly id =
    "SOVEREIGN-SCHEDULER-48";

  public readonly version =
    "1.0.0";

  private store?: SovereignSchedulerStore;

  private queueBridge?: SovereignSchedulerQueueBridge;

  private policyBridge?: SovereignSchedulerPolicyBridge;

  private eventBus?: SovereignSchedulerEventBus;

  private audit?: SovereignSchedulerAudit;

  private dispatchLocks =
    new Set<string>();

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setStore(
    store: SovereignSchedulerStore
  ): void {
    this.store = store;
  }

  setQueueBridge(
    bridge: SovereignSchedulerQueueBridge
  ): void {
    this.queueBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignSchedulerPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBus(
    eventBus: SovereignSchedulerEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignSchedulerAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * CREATE SCHEDULE
   * ==========================================================
   */

  async createSchedule(
    input: {
      id?: string;

      name: string;

      type: SovereignScheduleType;

      queueId: string;

      jobType: string;

      payload: unknown;

      priority?:
        | "LOW"
        | "NORMAL"
        | "HIGH"
        | "CRITICAL";

      startAt: string;

      intervalSeconds?: number;

      daysOfWeek?: number[];

      dayOfMonth?: number;

      hour?: number;

      minute?: number;

      timezone?: string;

      misfirePolicy?: SovereignScheduleMisfirePolicy;

      maxRuns?: number;

      metadata?: Record<string, unknown>;
    },
    context: SovereignSchedulerContext
  ): Promise<SovereignSchedule> {
    this.requireContext(context);

    const id =
      input.id ??
      this.createId("SCHEDULE");

    const authorization =
      await this.authorize(
        context,
        "CREATE",
        id
      );

    if (!authorization.allowed) {
      await this.recordAudit(
        "scheduler.create",
        id,
        "DENIED",
        {
          actorId: context.actorId,
          reason: authorization.reason,
        }
      );

      throw new Error(
        authorization.reason ??
          "Schedule creation denied."
      );
    }

    if (!input.name.trim()) {
      throw new Error(
        "Schedule name is required."
      );
    }

    if (!input.queueId.trim()) {
      throw new Error(
        "Schedule queueId is required."
      );
    }

    if (!input.jobType.trim()) {
      throw new Error(
        "Schedule jobType is required."
      );
    }

    const start =
      new Date(input.startAt);

    if (
      Number.isNaN(
        start.getTime()
      )
    ) {
      throw new Error(
        "Invalid schedule startAt."
      );
    }

    this.validateConfiguration(input);

    const existing =
      await this.requireStore()
        .getSchedule(id);

    if (existing) {
      throw new Error(
        `Schedule already exists: ${id}`
      );
    }

    const now =
      this.now();

    const schedule:
      SovereignSchedule = {
      id,

      name: input.name,

      type: input.type,

      status: "ACTIVE",

      queueId: input.queueId,

      jobType: input.jobType,

      payload: input.payload,

      priority:
        input.priority ?? "NORMAL",

      startAt:
        start.toISOString(),

      nextRunAt:
        start.toISOString(),

      intervalSeconds:
        input.intervalSeconds,

      daysOfWeek:
        input.daysOfWeek,

      dayOfMonth:
        input.dayOfMonth,

      hour:
        input.hour,

      minute:
        input.minute,

      timezone:
        input.timezone ?? "UTC",

      misfirePolicy:
        input.misfirePolicy ??
        "RUN_IMMEDIATELY",

      maxRuns:
        input.maxRuns,

      runCount: 0,

      createdBy:
        context.actorId,

      createdAt: now,

      updatedAt: now,

      metadata:
        input.metadata,
    };

    await this.requireStore()
      .saveSchedule(schedule);

    await this.publish(
      "scheduler.schedule.created",
      schedule.id,
      undefined,
      {
        type: schedule.type,
        nextRunAt:
          schedule.nextRunAt,
      }
    );

    await this.recordAudit(
      "scheduler.create",
      schedule.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,
      }
    );

    return schedule;
  }

  /* ==========================================================
   * PROCESS DUE SCHEDULES
   * ==========================================================
   */

  async processDue(
    context: SovereignSchedulerContext,
    nowInput = new Date()
  ): Promise<{
    checked: number;
    dispatched: number;
    skipped: number;
    failed: number;
  }> {
    this.requireContext(context);

    const schedules =
      await this.requireStore()
        .listSchedules();

    let checked = 0;
    let dispatched = 0;
    let skipped = 0;
    let failed = 0;

    for (const schedule of schedules) {
      if (
        schedule.status !==
        "ACTIVE"
      ) {
        continue;
      }

      if (!schedule.nextRunAt) {
        continue;
      }

      const due =
        new Date(
          schedule.nextRunAt
        );

      if (
        due.getTime() >
        nowInput.getTime()
      ) {
        continue;
      }

      checked++;

      try {
        const result =
          await this.dispatchSchedule(
            schedule.id,
            context,
            nowInput
          );

        if (
          result.status ===
          "DISPATCHED"
        ) {
          dispatched++;
        } else if (
          result.status ===
          "SKIPPED"
        ) {
          skipped++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return {
      checked,
      dispatched,
      skipped,
      failed,
    };
  }

  /* ==========================================================
   * DISPATCH
   * ==========================================================
   */

  async dispatchSchedule(
    scheduleId: string,
    context: SovereignSchedulerContext,
    nowInput = new Date()
  ): Promise<SovereignScheduledExecution> {
    this.requireContext(context);

    if (
      this.dispatchLocks.has(
        scheduleId
      )
    ) {
      throw new Error(
        "Schedule dispatch is already running."
      );
    }

    const schedule =
      await this.requireSchedule(
        scheduleId
      );

    if (
      schedule.status !==
      "ACTIVE"
    ) {
      throw new Error(
        `Schedule is not active: ${schedule.status}`
      );
    }

    if (!schedule.nextRunAt) {
      throw new Error(
        "Schedule has no next run."
      );
    }

    const authorization =
      await this.authorize(
        context,
        "DISPATCH",
        schedule.id
      );

    if (!authorization.allowed) {
      throw new Error(
        authorization.reason ??
          "Schedule dispatch denied."
      );
    }

    this.dispatchLocks.add(
      scheduleId
    );

    const scheduledFor =
      schedule.nextRunAt;

    try {
      if (
        this.requireStore()
          .findExecution
      ) {
        const existing =
          await this.requireStore()
            .findExecution!(
              schedule.id,
              scheduledFor
            );

        if (existing) {
          return existing;
        }
      }

      const scheduledTime =
        new Date(
          scheduledFor
        ).getTime();

      const now =
        nowInput.getTime();

      const isMisfire =
        now >
        scheduledTime + 60_000;

      if (
        isMisfire &&
        schedule.misfirePolicy ===
          "SKIP"
      ) {
        const execution =
          await this.createExecution({
            scheduleId:
              schedule.id,

            scheduledFor,

            status:
              "SKIPPED",

            reason:
              "MISFIRE_SKIPPED",
          });

        schedule.lastRunAt =
          scheduledFor;

        schedule.nextRunAt =
          this.calculateNextRun(
            schedule,
            new Date(
              scheduledFor
            )
          );

        this.finishIfRequired(
          schedule
        );

        schedule.updatedAt =
          this.now();

        await this.requireStore()
          .saveSchedule(schedule);

        await this.publish(
          "scheduler.execution.skipped",
          schedule.id,
          execution.id,
          {
            scheduledFor,
          }
        );

        return execution;
      }

      if (
        isMisfire &&
        schedule.misfirePolicy ===
          "RESCHEDULE"
      ) {
        schedule.nextRunAt =
          this.calculateNextRun(
            schedule,
            nowInput
          );

        schedule.updatedAt =
          this.now();

        await this.requireStore()
          .saveSchedule(schedule);

        return this.createExecution({
          scheduleId:
            schedule.id,

          scheduledFor,

          status:
            "SKIPPED",

          reason:
            "MISFIRE_RESCHEDULED",
        });
      }

      try {
        const result =
          await this.requireQueueBridge()
            .enqueue({
              queueId:
                schedule.queueId,

              type:
                schedule.jobType,

              payload:
                schedule.payload,

              priority:
                schedule.priority,

              idempotencyKey:
                `SCHEDULE:${schedule.id}:${scheduledFor}`,

              metadata: {
                scheduleId:
                  schedule.id,

                scheduledFor,

                ...schedule.metadata,
              },
            });

        const execution =
          await this.createExecution({
            scheduleId:
              schedule.id,

            scheduledFor,

            status:
              "DISPATCHED",

            dispatchedAt:
              this.now(),

            queueJobId:
              result.jobId,
          });

        schedule.lastRunAt =
          scheduledFor;

        schedule.runCount += 1;

        schedule.nextRunAt =
          this.calculateNextRun(
            schedule,
            new Date(
              scheduledFor
            )
          );

        this.finishIfRequired(
          schedule
        );

        schedule.updatedAt =
          this.now();

        await this.requireStore()
          .saveSchedule(schedule);

        await this.publish(
          "scheduler.execution.dispatched",
          schedule.id,
          execution.id,
          {
            queueJobId:
              result.jobId,

            scheduledFor,
          }
        );

        await this.recordAudit(
          "scheduler.dispatch",
          schedule.id,
          "SUCCESS",
          {
            actorId:
              context.actorId,

            queueJobId:
              result.jobId,
          }
        );

        return execution;
      } catch (error) {
        const reason =
          error instanceof Error
            ? error.message
            : "Schedule dispatch failed.";

        const execution =
          await this.createExecution({
            scheduleId:
              schedule.id,

            scheduledFor,

            status:
              "FAILED",

            reason,
          });

        await this.publish(
          "scheduler.execution.failed",
          schedule.id,
          execution.id,
          {
            reason,
          }
        );

        await this.recordAudit(
          "scheduler.dispatch",
          schedule.id,
          "FAILED",
          {
            actorId:
              context.actorId,

            reason,
          }
        );

        return execution;
      }
    } finally {
      this.dispatchLocks.delete(
        scheduleId
      );
    }
  }

  /* ==========================================================
   * PAUSE
   * ==========================================================
   */

  async pause(
    scheduleId: string,
    context: SovereignSchedulerContext
  ): Promise<SovereignSchedule> {
    this.requireContext(context);

    const schedule =
      await this.requireSchedule(
        scheduleId
      );

    await this.requireAuthorized(
      context,
      "PAUSE",
      schedule.id
    );

    if (
      schedule.status ===
      "CANCELLED" ||
      schedule.status ===
      "COMPLETED"
    ) {
      throw new Error(
        `Schedule cannot be paused: ${schedule.status}`
      );
    }

    schedule.status =
      "PAUSED";

    schedule.updatedAt =
      this.now();

    await this.requireStore()
      .saveSchedule(schedule);

    await this.publish(
      "scheduler.schedule.paused",
      schedule.id,
      undefined,
      {}
    );

    return schedule;
  }

  /* ==========================================================
   * RESUME
   * ==========================================================
   */

  async resume(
    scheduleId: string,
    context: SovereignSchedulerContext
  ): Promise<SovereignSchedule> {
    this.requireContext(context);

    const schedule =
      await this.requireSchedule(
        scheduleId
      );

    await this.requireAuthorized(
      context,
      "RESUME",
      schedule.id
    );

    if (
      schedule.status !==
      "PAUSED"
    ) {
      throw new Error(
        "Only paused schedules can resume."
      );
    }

    schedule.status =
      "ACTIVE";

    if (
      !schedule.nextRunAt ||

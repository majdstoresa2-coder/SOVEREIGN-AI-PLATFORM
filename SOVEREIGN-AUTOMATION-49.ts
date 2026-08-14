/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-AUTOMATION-49
 * ============================================================
 *
 * Sovereign Automation Engine.
 *
 * Responsibilities:
 * - Manage sovereign automation workflows.
 * - Receive internal platform events.
 * - Evaluate automation conditions.
 * - Dispatch approved actions to Sovereign Queue.
 * - Support scheduled and event-driven automation.
 * - Prevent duplicate automation execution.
 * - Track automation runs and failures.
 * - Pause, resume and disable automations safely.
 * - Operate without mandatory external automation SaaS.
 *
 * AUTOMATION IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

/* ============================================================
 * 1. AUTOMATION STATUS
 * ============================================================
 */

export type SovereignAutomationStatus =
  | "ACTIVE"
  | "PAUSED"
  | "DISABLED"
  | "FAILED";

/* ============================================================
 * 2. TRIGGER TYPE
 * ============================================================
 */

export type SovereignAutomationTriggerType =
  | "EVENT"
  | "SCHEDULE"
  | "MANUAL"
  | "SYSTEM";

/* ============================================================
 * 3. CONDITION OPERATOR
 * ============================================================
 */

export type SovereignAutomationConditionOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "EXISTS"
  | "NOT_EXISTS"
  | "GREATER_THAN"
  | "LESS_THAN"
  | "CONTAINS";

/* ============================================================
 * 4. RUN STATUS
 * ============================================================
 */

export type SovereignAutomationRunStatus =
  | "STARTING"
  | "EVALUATING"
  | "DISPATCHING"
  | "COMPLETED"
  | "SKIPPED"
  | "FAILED";

/* ============================================================
 * 5. TRIGGER
 * ============================================================
 */

export interface SovereignAutomationTrigger {
  type: SovereignAutomationTriggerType;

  eventType?: string;

  scheduleId?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. CONDITION
 * ============================================================
 */

export interface SovereignAutomationCondition {
  id: string;

  path: string;

  operator: SovereignAutomationConditionOperator;

  value?: unknown;

  required: boolean;
}

/* ============================================================
 * 7. ACTION
 * ============================================================
 */

export interface SovereignAutomationAction {
  id: string;

  queueId: string;

  jobType: string;

  payload?: Record<string, unknown>;

  priority:
    | "LOW"
    | "NORMAL"
    | "HIGH"
    | "CRITICAL";

  enabled: boolean;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 8. AUTOMATION
 * ============================================================
 */

export interface SovereignAutomation {
  id: string;

  name: string;

  description?: string;

  status: SovereignAutomationStatus;

  trigger: SovereignAutomationTrigger;

  conditions: SovereignAutomationCondition[];

  actions: SovereignAutomationAction[];

  maxRuns?: number;

  runCount: number;

  sovereignControlled: boolean;

  createdBy: string;

  createdAt: string;

  updatedAt: string;

  lastRunAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 9. RUN
 * ============================================================
 */

export interface SovereignAutomationRun {
  id: string;

  automationId: string;

  triggerType: SovereignAutomationTriggerType;

  triggerId?: string;

  status: SovereignAutomationRunStatus;

  matchedConditions: number;

  totalConditions: number;

  dispatchedActions: number;

  queueJobIds: string[];

  startedAt: string;

  completedAt?: string;

  error?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 10. EVENT
 * ============================================================
 */

export interface SovereignAutomationEvent {
  id: string;

  type: string;

  source: string;

  timestamp: string;

  payload: Record<string, unknown>;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 11. CONTEXT
 * ============================================================
 */

export interface SovereignAutomationContext {
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
 * 12. STORE
 * ============================================================
 */

export interface SovereignAutomationStore {
  saveAutomation(
    automation: SovereignAutomation
  ): Promise<void>;

  getAutomation(
    automationId: string
  ): Promise<SovereignAutomation | undefined>;

  listAutomations():
    Promise<SovereignAutomation[]>;

  saveRun(
    run: SovereignAutomationRun
  ): Promise<void>;

  getRun(
    runId: string
  ): Promise<SovereignAutomationRun | undefined>;

  listRuns(
    automationId: string,
    limit?: number
  ): Promise<SovereignAutomationRun[]>;

  findRunByTrigger?(
    automationId: string,
    triggerId: string
  ): Promise<SovereignAutomationRun | undefined>;
}

/* ============================================================
 * 13. QUEUE BRIDGE
 * ============================================================
 */

export interface SovereignAutomationQueueBridge {
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
 * 14. POLICY BRIDGE
 * ============================================================
 */

export interface SovereignAutomationPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignAutomationContext["authority"];

    operation:
      | "CREATE"
      | "RUN"
      | "PAUSE"
      | "RESUME"
      | "DISABLE"
      | "MANUAL_TRIGGER";

    automationId?: string;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

/* ============================================================
 * 15. EVENT BUS
 * ============================================================
 */

export interface SovereignAutomationEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    automationId?: string;

    runId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 16. AUDIT
 * ============================================================
 */

export interface SovereignAutomationAudit {
  record(
    operation: string,
    subjectId: string | undefined,
    result:
      | "SUCCESS"
      | "FAILED"
      | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 17. ENGINE
 * ============================================================
 */

export class SovereignAutomationEngine {
  public readonly id =
    "SOVEREIGN-AUTOMATION-49";

  public readonly version =
    "1.0.0";

  private store?: SovereignAutomationStore;

  private queueBridge?: SovereignAutomationQueueBridge;

  private policyBridge?: SovereignAutomationPolicyBridge;

  private eventBus?: SovereignAutomationEventBus;

  private audit?: SovereignAutomationAudit;

  private running =
    new Set<string>();

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setStore(
    store: SovereignAutomationStore
  ): void {
    this.store = store;
  }

  setQueueBridge(
    bridge: SovereignAutomationQueueBridge
  ): void {
    this.queueBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignAutomationPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBus(
    eventBus: SovereignAutomationEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignAutomationAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * CREATE AUTOMATION
   * ==========================================================
   */

  async createAutomation(
    input: {
      id?: string;

      name: string;

      description?: string;

      trigger: SovereignAutomationTrigger;

      conditions?: SovereignAutomationCondition[];

      actions: SovereignAutomationAction[];

      maxRuns?: number;

      metadata?: Record<string, unknown>;
    },
    context: SovereignAutomationContext
  ): Promise<SovereignAutomation> {
    this.requireContext(context);

    const id =
      input.id ??
      this.createId(
        "AUTOMATION"
      );

    const authorization =
      await this.authorize(
        context,
        "CREATE",
        id
      );

    if (!authorization.allowed) {
      await this.recordAudit(
        "automation.create",
        id,
        "DENIED",
        {
          actorId:
            context.actorId,

          reason:
            authorization.reason,
        }
      );

      throw new Error(
        authorization.reason ??
          "Automation creation denied."
      );
    }

    if (!input.name.trim()) {
      throw new Error(
        "Automation name is required."
      );
    }

    if (
      input.actions.length === 0
    ) {
      throw new Error(
        "Automation requires at least one action."
      );
    }

    if (
      input.maxRuns !== undefined &&
      (
        !Number.isInteger(
          input.maxRuns
        ) ||
        input.maxRuns < 1
      )
    ) {
      throw new Error(
        "Automation maxRuns must be greater than zero."
      );
    }

    this.validateTrigger(
      input.trigger
    );

    this.validateConditions(
      input.conditions ?? []
    );

    this.validateActions(
      input.actions
    );

    const existing =
      await this.requireStore()
        .getAutomation(id);

    if (existing) {
      throw new Error(
        `Automation already exists: ${id}`
      );
    }

    const now =
      this.now();

    const automation:
      SovereignAutomation = {
      id,

      name:
        input.name,

      description:
        input.description,

      status:
        "ACTIVE",

      trigger:
        input.trigger,

      conditions:
        input.conditions ?? [],

      actions:
        input.actions,

      maxRuns:
        input.maxRuns,

      runCount: 0,

      sovereignControlled:
        true,

      createdBy:
        context.actorId,

      createdAt:
        now,

      updatedAt:
        now,

      metadata:
        input.metadata,
    };

    await this.requireStore()
      .saveAutomation(
        automation
      );

    await this.publish(
      "automation.created",
      automation.id,
      undefined,
      {
        trigger:
          automation.trigger.type,

        actions:
          automation.actions.length,
      }
    );

    await this.recordAudit(
      "automation.create",
      automation.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,
      }
    );

    return automation;
  }

  /* ==========================================================
   * HANDLE EVENT
   * ==========================================================
   */

  async handleEvent(
    event: SovereignAutomationEvent,
    context: SovereignAutomationContext
  ): Promise<SovereignAutomationRun[]> {
    this.requireContext(context);

    const automations =
      await this.requireStore()
        .listAutomations();

    const matched =
      automations.filter(
        (automation) =>
          automation.status ===
            "ACTIVE" &&
          automation.trigger.type ===
            "EVENT" &&
          automation.trigger.eventType ===
            event.type
      );

    const runs:
      SovereignAutomationRun[] =
        [];

    for (
      const automation
      of matched
    ) {
      if (
        this.requireStore()
          .findRunByTrigger
      ) {
        const existing =
          await this.requireStore()
            .findRunByTrigger!(
              automation.id,
              event.id
            );

        if (existing) {
          runs.push(existing);
          continue;
        }
      }

      const run =
        await this.runAutomation(
          automation.id,
          {
            triggerType:
              "EVENT",

            triggerId:
              event.id,

            data:
              event.payload,

            metadata: {
              eventType:
                event.type,

              eventSource:
                event.source,

              eventTimestamp:
                event.timestamp,
            },
          },
          context
        );

      runs.push(run);
    }

    return runs;
  }

  /* ==========================================================
   * RUN AUTOMATION
   * ==========================================================
   */

  async runAutomation(
    automationId: string,
    trigger: {
      triggerType: SovereignAutomationTriggerType;

      triggerId?: string;

      data?: Record<string, unknown>;

      metadata?: Record<string, unknown>;
    },
    context: SovereignAutomationContext
  ): Promise<SovereignAutomationRun> {
    this.requireContext(context);

    const automation =
      await this.requireAutomation(
        automationId
      );

    if (
      automation.status !==
      "ACTIVE"
    ) {
      throw new Error(
        `Automation is not active: ${automation.status}`
      );
    }

    if (
      !automation.sovereignControlled
    ) {
      throw new Error(
        "Non-sovereign automation cannot execute."
      );
    }

    if (
      automation.maxRuns !==
        undefined &&
      automation.runCount >=
        automation.maxRuns
    ) {
      throw new Error(
        "Automation maximum run count reached."
      );
    }

    const operation =
      trigger.triggerType ===
      "MANUAL"
        ? "MANUAL_TRIGGER"
        : "RUN";

    const authorization =
      await this.authorize(
        context,
        operation,
        automation.id
      );

    if (!authorization.allowed) {
      throw new Error(
        authorization.reason ??
          "Automation execution denied."
      );
    }

    const lockKey =
      trigger.triggerId
        ? `${automation.id}:${trigger.triggerId}`
        : automation.id;

    if (
      this.running.has(
        lockKey
      )
    ) {
      throw new Error(
        "Automation execution is already running."
      );
    }

    this.running.add(
      lockKey
    );

    const run:
      SovereignAutomationRun = {
      id:
        this.createId(
          "AUTOMATION-RUN"
        ),

      automationId:
        automation.id,

      triggerType:
        trigger.triggerType,

      triggerId:
        trigger.triggerId,

      status:
        "STARTING",

      matchedConditions: 0,

      totalConditions:
        automation.conditions.length,

      dispatchedActions: 0,

      queueJobIds: [],

      startedAt:
        this.now(),

      metadata: {
        ...trigger.metadata,
      },
    };

    await this.requireStore()
      .saveRun(run);

    try {
      run.status =
        "EVALUATING";

      await this.requireStore()
        .saveRun(run);

      const evaluation =
        this.evaluateConditions(
          automation.conditions,
          trigger.data ?? {}
        );

      run.matchedConditions =
        evaluation.matched;

      if (!evaluation.passed) {
        run.status =
          "SKIPPED";

        run.completedAt =
          this.now();

        await this.requireStore()
          .saveRun(run);

        await this.publish(
          "automation.run.skipped",
          automation.id,
          run.id,
          {
            matchedConditions:
              run.matchedConditions,

            totalConditions:
              run.totalConditions,
          }
        );

        return run;
      }

      run.status =
        "DISPATCHING";

      await this.requireStore()
        .saveRun(run);

      for (
        const action
        of automation.actions
      ) {
        if (!action.enabled) {
          continue;
        }

        const payload = {
          ...(action.payload ?? {}),

          trigger:
            trigger.data ?? {},

          automation: {
            id:
              automation.id,

            name:
              automation.name,
          },

          runId:
            run.id,
        };

        const result =
          await this.requireQueueBridge()
            .enqueue({
              queueId:
                action.queueId,

              type:
                action.jobType,

              payload,

              priority:
                action.priority,

              idempotencyKey:
                `AUTOMATION:${automation.id}:${run.id}:${action.id}`,

              metadata: {
                automationId:
                  automation.id,

                automationRunId:
                  run.id,

                actionId:
                  action.id,

                ...action.metadata,
              },
            });

        run.queueJobIds.push(
          result.jobId
        );

        run.dispatchedActions += 1;
      }

      run.status =
        "COMPLETED";

      run.completedAt =
        this.now();

      automation.runCount += 1;

      automation.lastRunAt =
        run.completedAt;

      automation.updatedAt =
        run.completedAt;

      if (
        automation.maxRuns !==
          undefined &&
        automation.runCount >=
          automation.maxRuns
      ) {
        automation.status =
          "DISABLED";
      }

      await this.requireStore()
        .saveRun(run);

      await this.requireStore()
        .saveAutomation(
          automation
        );

      await this.publish(
        "automation.run.completed",
        automation.id,
        run.id,
        {
          dispatchedActions:
            run.dispatchedActions,

          queueJobIds:
            run.queueJobIds,
        }
      );

      await this.recordAudit(
        "automation.run",
        automation.id,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          runId:
            run.id,

          dispatchedActions:
            run.dispatchedActions,
        }
      );

      return run;
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : "Automation execution failed.";

      run.status =
        "FAILED";

      run.error =
        reason;

      run.completedAt =
        this.now();

      await this.requireStore()
        .saveRun(run);

      await this.publish(
        "automation.run.failed",
        automation.id,
        run.id,
        {
          reason,
        }
      );

      await this.recordAudit(
        "automation.run",
        automation.id,
        "FAILED",
        {
          actorId:
            context.actorId,

          runId:
            run.id,

          reason,
        }
      );

      return run;
    } finally {
      this.running.delete(
     

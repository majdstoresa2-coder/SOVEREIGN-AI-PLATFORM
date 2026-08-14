/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-EVENTS-12
 * ============================================================
 *
 * Purpose:
 * Central Sovereign Event System.
 *
 * Responsibilities:
 * - Internal event publishing.
 * - Event subscriptions.
 * - Controlled event routing.
 * - Event history.
 * - Retry handling.
 * - Failure isolation.
 * - Audit integration.
 *
 * Events carry information only.
 * Events NEVER grant authority.
 * Events NEVER bypass Policy or Permissions.
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. EVENT STATUS
 * ============================================================
 */

export type SovereignEventStatus =
  | "CREATED"
  | "QUEUED"
  | "PROCESSING"
  | "DELIVERED"
  | "PARTIAL"
  | "FAILED"
  | "DEAD_LETTER";

/* ============================================================
 * 2. EVENT PRIORITY
 * ============================================================
 */

export type SovereignEventPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

/* ============================================================
 * 3. EVENT
 * ============================================================
 */

export interface SovereignEvent {
  id: string;

  type: string;

  source: string;

  actorId?: string;

  jobId?: string;

  agentId?: string;

  capabilityId?: string;

  projectId?: string;

  priority: SovereignEventPriority;

  payload: Record<string, unknown>;

  metadata?: Record<string, unknown>;

  status: SovereignEventStatus;

  attempts: number;

  createdAt: string;

  updatedAt: string;

  processedAt?: string;

  error?: string;
}

/* ============================================================
 * 4. EVENT INPUT
 * ============================================================
 */

export interface SovereignEventInput {
  type: string;

  source: string;

  actorId?: string;

  jobId?: string;

  agentId?: string;

  capabilityId?: string;

  projectId?: string;

  priority?: SovereignEventPriority;

  payload?: Record<string, unknown>;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 5. EVENT CONTEXT
 * ============================================================
 */

export interface SovereignEventContext {
  policyChecked: boolean;

  permissionChecked: boolean;

  actorId?: string;

  permissions?: string[];
}

/* ============================================================
 * 6. EVENT HANDLER
 * ============================================================
 */

export interface SovereignEventHandler {
  id: string;

  eventTypes: string[];

  enabled: boolean;

  priority: number;

  handle(
    event: SovereignEvent
  ): Promise<void>;
}

/* ============================================================
 * 7. EVENT ACCESS VALIDATOR
 * ============================================================
 */

export interface SovereignEventAccessValidator {
  validate(
    operation:
      | "PUBLISH"
      | "SUBSCRIBE"
      | "PROCESS",
    context: SovereignEventContext,
    event?: SovereignEvent
  ): {
    allowed: boolean;

    reason?: string;
  };
}

/* ============================================================
 * 8. EVENT AUDIT
 * ============================================================
 */

export interface SovereignEventAudit {
  record(
    operation: string,
    eventId: string | undefined,
    result:
      | "SUCCESS"
      | "FAILED"
      | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 9. EVENT ENGINE
 * ============================================================
 */

export class SovereignEventEngine {
  public readonly id =
    "SOVEREIGN-EVENTS-12";

  public readonly version =
    "1.0.0";

  private events =
    new Map<string, SovereignEvent>();

  private queue: string[] = [];

  private deadLetterQueue: string[] = [];

  private handlers =
    new Map<string, SovereignEventHandler>();

  private accessValidator?:
    SovereignEventAccessValidator;

  private audit?:
    SovereignEventAudit;

  private processing = false;

  private readonly maxAttempts = 3;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setAccessValidator(
    validator: SovereignEventAccessValidator
  ): void {
    this.accessValidator = validator;
  }

  setAudit(
    audit: SovereignEventAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * REGISTER HANDLER
   * ==========================================================
   */

  async registerHandler(
    handler: SovereignEventHandler,
    context: SovereignEventContext
  ): Promise<void> {
    this.requireAccess(
      "SUBSCRIBE",
      context
    );

    if (!handler.id.trim()) {
      throw new Error(
        "Event handler ID is required."
      );
    }

    if (
      this.handlers.has(handler.id)
    ) {
      throw new Error(
        `Event handler already registered: ${handler.id}`
      );
    }

    if (
      handler.eventTypes.length === 0
    ) {
      throw new Error(
        "Event handler must subscribe to at least one event type."
      );
    }

    this.handlers.set(
      handler.id,
      handler
    );

    await this.recordAudit(
      "event.handler.register",
      undefined,
      "SUCCESS",
      {
        handlerId: handler.id,
      }
    );
  }

  /* ==========================================================
   * REMOVE HANDLER
   * ==========================================================
   */

  async removeHandler(
    handlerId: string,
    context: SovereignEventContext
  ): Promise<boolean> {
    this.requireAccess(
      "SUBSCRIBE",
      context
    );

    const removed =
      this.handlers.delete(handlerId);

    await this.recordAudit(
      "event.handler.remove",
      undefined,
      removed
        ? "SUCCESS"
        : "FAILED",
      {
        handlerId,
      }
    );

    return removed;
  }

  /* ==========================================================
   * PUBLISH
   * ==========================================================
   */

  async publish(
    input: SovereignEventInput,
    context: SovereignEventContext
  ): Promise<SovereignEvent> {
    this.requireAccess(
      "PUBLISH",
      context
    );

    this.validateInput(input);

    const now = this.now();

    const event: SovereignEvent = {
      id:
        this.createId("EVENT"),

      type:
        input.type,

      source:
        input.source,

      actorId:
        input.actorId,

      jobId:
        input.jobId,

      agentId:
        input.agentId,

      capabilityId:
        input.capabilityId,

      projectId:
        input.projectId,

      priority:
        input.priority ??
        "NORMAL",

      payload:
        input.payload ?? {},

      metadata:
        input.metadata,

      status:
        "QUEUED",

      attempts: 0,

      createdAt: now,

      updatedAt: now,
    };

    this.events.set(
      event.id,
      event
    );

    this.enqueue(event);

    await this.recordAudit(
      "event.publish",
      event.id,
      "SUCCESS",
      {
        type:
          event.type,

        source:
          event.source,
      }
    );

    return event;
  }

  /* ==========================================================
   * PROCESS NEXT
   * ==========================================================
   */

  async processNext(
    context: SovereignEventContext
  ): Promise<
    SovereignEvent | undefined
  > {
    if (this.processing) {
      return undefined;
    }

    const eventId =
      this.queue.shift();

    if (!eventId) {
      return undefined;
    }

    const event =
      this.events.get(eventId);

    if (!event) {
      return undefined;
    }

    this.requireAccess(
      "PROCESS",
      context,
      event
    );

    this.processing = true;

    try {
      await this.processEvent(
        event
      );

      return event;
    } finally {
      this.processing = false;
    }
  }

  /* ==========================================================
   * PROCESS ALL
   * ==========================================================
   */

  async processAll(
    context: SovereignEventContext
  ): Promise<number> {
    let processed = 0;

    while (
      this.queue.length > 0
    ) {
      const event =
        await this.processNext(
          context
        );

      if (!event) {
        break;
      }

      processed += 1;
    }

    return processed;
  }

  /* ==========================================================
   * PROCESS EVENT
   * ==========================================================
   */

  private async processEvent(
    event: SovereignEvent
  ): Promise<void> {
    event.status =
      "PROCESSING";

    event.attempts += 1;

    event.updatedAt =
      this.now();

    const handlers =
      this.findHandlers(
        event.type
      );

    if (
      handlers.length === 0
    ) {
      event.status =
        "DELIVERED";

      event.processedAt =
        this.now();

      event.updatedAt =
        event.processedAt;

      await this.recordAudit(
        "event.process",
        event.id,
        "SUCCESS",
        {
          handlers: 0,
        }
      );

      return;
    }

    let successCount = 0;

    const failures: string[] = [];

    for (
      const handler of handlers
    ) {
      try {
        await handler.handle(
          event
        );

        successCount += 1;
      } catch (error) {
        failures.push(
          `${handler.id}: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`
        );
      }
    }

    if (
      failures.length === 0
    ) {
      event.status =
        "DELIVERED";

      event.error =
        undefined;

      event.processedAt =
        this.now();

      event.updatedAt =
        event.processedAt;

      await this.recordAudit(
        "event.process",
        event.id,
        "SUCCESS",
        {
          handlers:
            handlers.length,
        }
      );

      return;
    }

    if (
      successCount > 0
    ) {
      event.status =
        "PARTIAL";

      event.error =
        failures.join(" | ");

      event.processedAt =
        this.now();

      event.updatedAt =
        event.processedAt;

      await this.recordAudit(
        "event.process",
        event.id,
        "FAILED",
        {
          successfulHandlers:
            successCount,

          failedHandlers:
            failures.length,

          failures,
        }
      );

      return;
    }

    event.error =
      failures.join(" | ");

    if (
      event.attempts <
      this.maxAttempts
    ) {
      event.status =
        "QUEUED";

      event.updatedAt =
        this.now();

      this.enqueue(event);

      await this.recordAudit(
        "event.retry",
        event.id,
        "FAILED",
        {
          attempt:
            event.attempts,

          maxAttempts:
            this.maxAttempts,
        }
      );

      return;
    }

    event.status =
      "DEAD_LETTER";

    event.processedAt =
      this.now();

    event.updatedAt =
      event.processedAt;

    this.deadLetterQueue.push(
      event.id
    );

    await this.recordAudit(
      "event.dead_letter",
      event.id,
      "FAILED",
      {
        attempts:
          event.attempts,

        failures,
      }
    );
  }

  /* ==========================================================
   * RETRY DEAD LETTER
   * ==========================================================
   */

  async retryDeadLetter(
    eventId: string,
    context: SovereignEventContext
  ): Promise<SovereignEvent> {
    const event =
      this.requireEvent(eventId);

    this.requireAccess(
      "PROCESS",
      context,
      event
    );

    const index =
      this.deadLetterQueue.indexOf(
        eventId
      );

    if (index >= 0) {
      this.deadLetterQueue.splice(
        index,
        1
      );
    }

    event.status =
      "QUEUED";

    event.attempts = 0;

    event.error =
      undefined;

    event.processedAt =
      undefined;

    event.updatedAt =
      this.now();

    this.enqueue(event);

    await this.recordAudit(
      "event.dead_letter.retry",
      event.id,
      "SUCCESS"
    );

    return event;
  }

  /* ==========================================================
   * GET EVENT
   * ==========================================================
   */

  get(
    eventId: string
  ): SovereignEvent | undefined {
    return this.events.get(
      eventId
    );
  }

  /* ==========================================================
   * LIST EVENTS
   * ==========================================================
   */

  list(
    status?: SovereignEventStatus
  ): SovereignEvent[] {
    const events =
      Array.from(
        this.events.values()
      );

    if (!status) {
      return events;
    }

    return events.filter(
      (event) =>
        event.status === status
    );
  }

  /* ==========================================================
   * DEAD LETTER EVENTS
   * ==========================================================
   */

  listDeadLetters():
    SovereignEvent[] {
    return this.deadLetterQueue
      .map(
        (eventId) =>
          this.events.get(
            eventId
          )
      )
      .filter(
        (
          event
        ): event is SovereignEvent =>
          Boolean(event)
      );
  }

  /* ==========================================================
   * QUEUE SIZE
   * ==========================================================
   */

  queueSize(): number {
    return this.queue.length;
  }

  /* ==========================================================
   * STATISTICS
   * ==========================================================
   */

  statistics(): {
    total: number;

    queued: number;

    processing: number;

    delivered: number;

    partial: number;

    failed: number;

    deadLetter: number;

    handlers: number;
  } {
    const events =
      this.list();

    return {
      total:
        events.length,

      queued:
        events.filter(
          (event) =>
            event.status ===
            "QUEUED"
        ).length,

      processing:
        events.filter(
          (event) =>
            event.status ===
            "PROCESSING"
        ).length,

      delivered:
        events.filter(
          (event) =>
            event.status ===
            "DELIVERED"
        ).length,

      partial:
        events.filter(
          (event) =>
            event.status ===
            "PARTIAL"
        ).length,

      failed:
        events.filter(
          (event) =>
            event.status ===
            "FAILED"
        ).length,

      deadLetter:
        this.deadLetterQueue.length,

      handlers:
        this.handlers.size,
    };
  }

  /* ==========================================================
   * FIND HANDLERS
   * ==========================================================
   */

  private findHandlers(
    eventType: string
  ): SovereignEventHandler[] {
    return Array.from(
      this.handlers.values()
    )
      .filter(
        (handler) =>
          handler.enabled &&
          (
            handler.eventTypes.includes(
              "*"
            ) ||
            handler.eventTypes.includes(
              eventType
            )
          )
      )
      .sort(
        (a, b) =>
          b.priority -
          a.priority
      );
  }

  /* ==========================================================
   * QUEUE
   * ==========================================================
   */

  private enqueue(
    event: SovereignEvent
  ): void {
    if (
      this.queue.includes(
        event.id
      )
    ) {
      return;
    }

    this.queue.push(
      event.id
    );

    this.queue.sort(
      (a, b) => {
        const eventA =
          this.events.get(a);

        const eventB =
          this.events.get(b);

        if (
          !eventA ||
          !eventB
        ) {
          return 0;
        }

        return (
          this.priorityRank(
            eventB.priority
          ) -
          this.priorityRank(
            eventA.priority
          )
        );
      }
    );
  }

  /* ==========================================================
   * ACCESS
   * ==========================================================
   */

  private requireAccess(
    operation:
      | "PUBLISH"
      | "SUBSCRIBE"
      | "PROCESS",
    context: SovereignEventContext,
    event?: SovereignEvent
  ): void {
    if (!context.policyChecked) {
      throw new Error(
        "Event operation blocked: policy check required."
      );
    }

    if (
      !context.permissionChecked
    ) {
      throw new Error(
        "Event operation blocked: permission check required."
      );
    }

    if (
      this.accessValidator
    ) {
      const result =
        this.accessValidator.validate(
          operation,
          context,
          event
        );

      if (!result.allowed) {
        throw new Error(
          result.reason ??
            "Event operation denied."
        );
      }
    }
  }

  /* ==========================================================
   * VALIDATION
   * ==========================================================
   */

  private validateInput(
    input: SovereignEventInput
  ): void {
    if (!input.type.trim()) {
      throw new Error(
        "Event type is required."
      );
    }

    if (!input.source.trim()) {
      throw new Error(
        "Event source is required."
      );
    }
  }

  /* ==========================================================
   * REQUIRE EVENT
   * ==========================================================
   */

  private requireEvent(
    eventId: string
  ): SovereignEvent {
    const event =
      this.events.get(eventId);

    if (!event) {
      throw new Error(
        `Event not found: ${eventId}`
      );
    }

    return event;
  }

  /* ==========================================================
   * PRIORITY
   * ==========================================================
   */

  private priorityRank(
    priority:
      SovereignEventPriority
  ): number {
    switch (priority) {
      case "LOW":
        return 1;

      case "NORMAL":
        return 2;

      case "HIGH":
        return 3;

      case "CRITICAL":
        return 4;
    }
  }

  /* ==========================================================
   * AUDIT
   * ==========================================================
   */

  private async recordAudit(
    operation: string,
    eventId: string | undefined,
    result:
      | "SUCCESS"
      | "FAILED"
      | "DENIED",
    metadata?: Record<
      string,
      unknown
    >
  ): Promise<void> {
    if (!this.audit) {
      return;
    }

    await this.audit.record(
      operation,
      eventId,
      result,
      metadata
    );
  }

  /* ==========================================================
   * HELPERS
   * ==========================================================
   */

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  private now(): string {
    return new Date()
      .toISOString();
  }
}

/* ============================================================
 * 10. FACTORY
 * ============================================================
 */

export function createSovereignEventEngine():
  SovereignEventEngine {
  return new SovereignEventEngine();
}

/* ============================================================
 * 11. ARCHITECTURAL CONTRACT
 * ==========

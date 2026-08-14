/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-COMMAND-54
 * ============================================================
 *
 * Sovereign Internal Command Engine.
 *
 * Responsibilities:
 * - Create sovereign execution commands.
 * - Route commands to approved handlers.
 * - Enforce authorization before execution.
 * - Support idempotency and duplicate protection.
 * - Track command lifecycle and results.
 * - Enforce execution timeout.
 * - Support cancellation where permitted.
 * - Preserve command audit history.
 *
 * COMMAND ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

/* ============================================================
 * 1. COMMAND PRIORITY
 * ============================================================
 */

export type SovereignCommandPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

/* ============================================================
 * 2. COMMAND STATUS
 * ============================================================
 */

export type SovereignCommandStatus =
  | "CREATED"
  | "AUTHORIZED"
  | "DISPATCHING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "TIMED_OUT"
  | "DENIED"
  | "CANCELLED";

/* ============================================================
 * 3. HANDLER STATUS
 * ============================================================
 */

export type SovereignCommandHandlerStatus =
  | "ACTIVE"
  | "PAUSED"
  | "DISABLED";

/* ============================================================
 * 4. COMMAND
 * ============================================================
 */

export interface SovereignCommand {
  id: string;

  type: string;

  source: string;

  target: string;

  priority: SovereignCommandPriority;

  status: SovereignCommandStatus;

  payload: unknown;

  correlationId?: string;

  causationId?: string;

  idempotencyKey?: string;

  timeoutSeconds: number;

  requestedBy: string;

  createdAt: string;

  authorizedAt?: string;

  startedAt?: string;

  completedAt?: string;

  cancelledAt?: string;

  result?: unknown;

  error?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 5. COMMAND HANDLER
 * ============================================================
 */

export interface SovereignCommandHandler {
  id: string;

  name: string;

  commandTypes: string[];

  target: string;

  status: SovereignCommandHandlerStatus;

  sovereignControlled: boolean;

  maxConcurrency: number;

  createdBy: string;

  createdAt: string;

  updatedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. COMMAND EXECUTION
 * ============================================================
 */

export interface SovereignCommandExecution {
  id: string;

  commandId: string;

  handlerId: string;

  status:
    | "STARTING"
    | "RUNNING"
    | "COMPLETED"
    | "FAILED"
    | "TIMED_OUT"
    | "CANCELLED";

  startedAt: string;

  completedAt?: string;

  result?: unknown;

  error?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. CONTEXT
 * ============================================================
 */

export interface SovereignCommandContext {
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

export interface SovereignCommandStore {
  saveCommand(
    command: SovereignCommand
  ): Promise<void>;

  getCommand(
    commandId: string
  ): Promise<SovereignCommand | undefined>;

  listCommands(
    limit?: number
  ): Promise<SovereignCommand[]>;

  findByIdempotencyKey?(
    idempotencyKey: string
  ): Promise<SovereignCommand | undefined>;

  saveHandler(
    handler: SovereignCommandHandler
  ): Promise<void>;

  getHandler(
    handlerId: string
  ): Promise<SovereignCommandHandler | undefined>;

  listHandlers():
    Promise<SovereignCommandHandler[]>;

  saveExecution(
    execution: SovereignCommandExecution
  ): Promise<void>;

  getExecution(
    executionId: string
  ): Promise<SovereignCommandExecution | undefined>;

  listExecutions(
    commandId: string
  ): Promise<SovereignCommandExecution[]>;
}

/* ============================================================
 * 9. EXECUTION BRIDGE
 * ============================================================
 */

export interface SovereignCommandExecutionBridge {
  execute(input: {
    command: SovereignCommand;

    handler: SovereignCommandHandler;

    execution: SovereignCommandExecution;
  }): Promise<{
    success: boolean;

    result?: unknown;

    reason?: string;

    metadata?: Record<string, unknown>;
  }>;

  cancel?(input: {
    command: SovereignCommand;

    execution: SovereignCommandExecution;
  }): Promise<{
    success: boolean;

    reason?: string;
  }>;
}

/* ============================================================
 * 10. POLICY BRIDGE
 * ============================================================
 */

export interface SovereignCommandPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignCommandContext["authority"];

    operation:
      | "REGISTER_HANDLER"
      | "CREATE_COMMAND"
      | "EXECUTE_COMMAND"
      | "CANCEL_COMMAND"
      | "READ_COMMAND";

    commandType?: string;

    commandId?: string;

    target?: string;

    priority?: SovereignCommandPriority;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

/* ============================================================
 * 11. EVENT BRIDGE
 * ============================================================
 */

export interface SovereignCommandEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    commandId?: string;

    executionId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 12. AUDIT
 * ============================================================
 */

export interface SovereignCommandAudit {
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
 * 13. ENGINE
 * ============================================================
 */

export class SovereignCommandEngine {
  public readonly id =
    "SOVEREIGN-COMMAND-54";

  public readonly version =
    "1.0.0";

  private store?: SovereignCommandStore;

  private executionBridge?: SovereignCommandExecutionBridge;

  private policyBridge?: SovereignCommandPolicyBridge;

  private eventBridge?: SovereignCommandEventBridge;

  private audit?: SovereignCommandAudit;

  private runningCommands =
    new Set<string>();

  private handlerExecutions =
    new Map<string, number>();

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setStore(
    store: SovereignCommandStore
  ): void {
    this.store = store;
  }

  setExecutionBridge(
    bridge: SovereignCommandExecutionBridge
  ): void {
    this.executionBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignCommandPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignCommandEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignCommandAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * REGISTER HANDLER
   * ==========================================================
   */

  async registerHandler(
    input: {
      id?: string;

      name: string;

      commandTypes: string[];

      target: string;

      maxConcurrency?: number;

      metadata?: Record<string, unknown>;
    },
    context: SovereignCommandContext
  ): Promise<SovereignCommandHandler> {
    this.requireContext(context);

    const id =
      input.id ??
      this.createId(
        "COMMAND-HANDLER"
      );

    await this.requireAuthorized(
      context,
      "REGISTER_HANDLER",
      undefined,
      undefined,
      input.target
    );

    if (!input.name.trim()) {
      throw new Error(
        "Command handler name is required."
      );
    }

    if (!input.target.trim()) {
      throw new Error(
        "Command handler target is required."
      );
    }

    if (
      input.commandTypes.length === 0
    ) {
      throw new Error(
        "Command handler requires at least one command type."
      );
    }

    const maxConcurrency =
      input.maxConcurrency ?? 5;

    if (
      !Number.isInteger(
        maxConcurrency
      ) ||
      maxConcurrency < 1
    ) {
      throw new Error(
        "Command handler maxConcurrency must be greater than zero."
      );
    }

    const existing =
      await this.requireStore()
        .getHandler(id);

    if (existing) {
      throw new Error(
        `Command handler already exists: ${id}`
      );
    }

    const now =
      this.now();

    const handler:
      SovereignCommandHandler = {
      id,

      name:
        input.name,

      commandTypes:
        [...new Set(
          input.commandTypes
        )],

      target:
        input.target,

      status:
        "ACTIVE",

      sovereignControlled:
        true,

      maxConcurrency,

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
      .saveHandler(handler);

    this.handlerExecutions.set(
      handler.id,
      0
    );

    await this.publishEvent(
      "command.handler.registered",
      undefined,
      undefined,
      {
        handlerId:
          handler.id,

        target:
          handler.target,

        commandTypes:
          handler.commandTypes,
      }
    );

    return handler;
  }

  /* ==========================================================
   * CREATE COMMAND
   * ==========================================================
   */

  async createCommand(
    input: {
      id?: string;

      type: string;

      source: string;

      target: string;

      payload: unknown;

      priority?: SovereignCommandPriority;

      correlationId?: string;

      causationId?: string;

      idempotencyKey?: string;

      timeoutSeconds?: number;

      metadata?: Record<string, unknown>;
    },
    context: SovereignCommandContext
  ): Promise<SovereignCommand> {
    this.requireContext(context);

    if (!input.type.trim()) {
      throw new Error(
        "Command type is required."
      );
    }

    if (!input.source.trim()) {
      throw new Error(
        "Command source is required."
      );
    }

    if (!input.target.trim()) {
      throw new Error(
        "Command target is required."
      );
    }

    const priority =
      input.priority ??
      "NORMAL";

    const commandId =
      input.id ??
      this.createId(
        "COMMAND"
      );

    await this.requireAuthorized(
      context,
      "CREATE_COMMAND",
      input.type,
      commandId,
      input.target,
      priority
    );

    if (
      input.idempotencyKey &&
      this.requireStore()
        .findByIdempotencyKey
    ) {
      const existing =
        await this.requireStore()
          .findByIdempotencyKey!(
            input.idempotencyKey
          );

      if (existing) {
        return existing;
      }
    }

    const timeoutSeconds =
      input.timeoutSeconds ??
      300;

    if (
      !Number.isInteger(
        timeoutSeconds
      ) ||
      timeoutSeconds < 1 ||
      timeoutSeconds > 86400
    ) {
      throw new Error(
        "Command timeout must be between 1 and 86400 seconds."
      );
    }

    const command:
      SovereignCommand = {
      id:
        commandId,

      type:
        input.type,

      source:
        input.source,

      target:
        input.target,

      priority,

      status:
        "CREATED",

      payload:
        input.payload,

      correlationId:
        input.correlationId,

      causationId:
        input.causationId,

      idempotencyKey:
        input.idempotencyKey,

      timeoutSeconds,

      requestedBy:
        context.actorId,

      createdAt:
        this.now(),

      metadata:
        input.metadata,
    };

    await this.requireStore()
      .saveCommand(command);

    command.status =
      "AUTHORIZED";

    command.authorizedAt =
      this.now();

    await this.requireStore()
      .saveCommand(command);

    await this.publishEvent(
      "command.created",
      command.id,
      undefined,
      {
        type:
          command.type,

        target:
          command.target,

        priority:
          command.priority,
      }
    );

    await this.recordAudit(
      "command.create",
      command.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,
      }
    );

    return command;
  }

  /* ==========================================================
   * EXECUTE COMMAND
   * ==========================================================
   */

  async execute(
    commandId: string,
    context: SovereignCommandContext
  ): Promise<SovereignCommand> {
    this.requireContext(context);

    const command =
      await this.requireCommand(
        commandId
      );

    if (
      command.status ===
      "COMPLETED"
    ) {
      return command;
    }

    if (
      command.status !==
      "AUTHORIZED"
    ) {
      throw new Error(
        `Command cannot execute from status: ${command.status}`
      );
    }

    await this.requireAuthorized(
      context,
      "EXECUTE_COMMAND",
      command.type,
      command.id,
      command.target,
      command.priority
    );

    if (
      this.runningCommands.has(
        command.id
      )
    ) {
      throw new Error(
        "Command is already executing."
      );
    }

    const handler =
      await this.selectHandler(
        command
      );

    const active =
      this.handlerExecutions.get(
        handler.id
      ) ?? 0;

    if (
      active >=
      handler.maxConcurrency
    ) {
      throw new Error(
        "Command handler concurrency limit reached."
      );
    }

    this.runningCommands.add(
      command.id
    );

    this.handlerExecutions.set(
      handler.id,
      active + 1
    );

    const execution:
      SovereignCommandExecution = {
      id:
        this.createId(
          "COMMAND-EXECUTION"
        ),

      commandId:
        command.id,

      handlerId:
        handler.id,

      status:
        "STARTING",

      startedAt:
        this.now(),
    };

    await this.requireStore()
      .saveExecution(
        execution
      );

    command.status =
      "RUNNING";

    command.startedAt =
      this.now();

    await this.requireStore()
      .saveCommand(command);

    execution.status =
      "RUNNING";

    await this.requireStore()
      .saveExecution(
        execution
      );

    await this.publishEvent(
      "command.execution.started",
      command.id,
      execution.id,
      {
        handlerId:
          handler.id,
      }
    );

    try {
      const result =
        await this.executeWithTimeout(
          command,
          handler,
          execution
        );

      if (!result.success) {
        execution.status =
          "FAILED";

        execution.error =
          result.reason ??
          "Command execution failed.";

        execution.completedAt =
          this.now();

        execution.metadata = {
          ...execution.metadata,
          ...result.metadata,
        };

        command.status =
          "FAILED";

        command.error =
          execution.error;

        command.completedAt =
          execution.completedAt;

        await this.requireStore()
          .saveExecution(
            execution
          );

        await this.requireStore()
          .saveCommand(command);

        await this.publishEvent(
          "command.execution.failed",
          command.id,
          execution.id,
          {
            reason:
              execution.error,
          }
        );

        await this.recordAudit(
          "command.execute",
          command.id,
          "FAILED",
          {
            actorId:
              context.actorId,

            executionId:
              execution.id,

            reason:
              execution.error,
          }
        );

        return command;
      }

      execution.status =
        "COMPLETED";

      execution.result =
        result.result;

      execution.completedAt =
        this.now();

      execution.metadata = {
        ...execution.metadata,
        ...result.metadata,
      };

      command.status =
        "COMPLETED";

      command.result =
        result.result;

      command.completedAt =
        execution.completedAt;

      await this.requireStore()
        .saveExecution(
          execution
        );

      await this.requireStore()
        .saveCommand(command);

      await this.publishEvent(
        "command.execution.completed",
        command.id,
        execution.id,
        {
          handlerId:
            handler.id,
        }
      );

      await this.recordAudit(
        "command.execute",
        command.id,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          executionId:
            execution.id,
        }
      );

      return command;
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : "Unknown command execution error.";

      const timedOut =
        reason ===
        "COMMAND_EXECUTION_TIMEOUT";

      execution.status =
        timedOut
          ? "TIMED_OUT"
          : "FAILED";

      execution.error =
        reason;

      execution.completedAt =
        this.now();

      command.status =
        timedOut
          ? "TIMED_OUT"
          : "FAILED";

      command.error =
        reason;

      command.completedAt =
        execution.completedAt;

      await this.requireStore()
        .saveExecution(
          execution
        );

      await this.requireStore()
        .saveCommand(command);

      await this.publishEvent(
        timedOut
          ? "command.execution.timed-out"
          : "command.execution.failed",
        command.id,
        execution.id,
        {
          reason,
        }
      );

      await this.recordAudit(
        "command.execute",
        command.id,
        "FAILED",
        {
          actorId:
            context.actorId,

          executionId:
            execution.id,

          reason,
        }
      );

      return command;
    } finally {
      this.runningCommands.delete(
        command.id
      );

      const current =
        this.handlerExecutions.get(
          handler.id
        ) ?? 1;

      this.handlerExecutions.set(
        handler.id,
        Math.max(
          0,
          current - 1
        )
      );
    }
  }

  /* ==========================================================
   * EXECUTE WITH TIMEOUT
   * ==========================================================
   */

  private async executeWithTimeout(
    command: SovereignCommand,
    handler: SovereignCommandHandler,
    execution: SovereignComman

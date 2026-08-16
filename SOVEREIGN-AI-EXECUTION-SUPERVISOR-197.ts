// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-EXECUTION-SUPERVISOR-197.ts
// Sovereign Autonomous AI Execution Supervisor
// ============================================================

export type SovereignExecutionState =
  | "PENDING"
  | "ASSIGNED"
  | "RUNNING"
  | "VERIFYING"
  | "COMPLETED"
  | "RETRYING"
  | "REASSIGNING"
  | "REPAIRING"
  | "FAILED"
  | "CANCELLED";

export type SovereignExecutionDecision =
  | "CONTINUE"
  | "VERIFY"
  | "RETRY"
  | "REASSIGN"
  | "REPAIR"
  | "FAIL"
  | "COMPLETE";

export interface SovereignExecutionRecord {
  id: string;
  taskId: string;
  schedulerTaskId: string;
  nodeId?: string;
  workerId?: string;
  state: SovereignExecutionState;
  attempts: number;
  maxAttempts: number;
  timeoutMs: number;
  heartbeatTimeoutMs: number;
  startedAt?: number;
  lastHeartbeatAt?: number;
  completedAt?: number;
  result?: unknown;
  error?: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

export interface SovereignExecutionInspection {
  reachable: boolean;
  running: boolean;
  completed: boolean;
  failed: boolean;
  result?: unknown;
  error?: string;
}

export interface SovereignExecutionSupervisorAdapter {
  inspect(
    execution: SovereignExecutionRecord
  ): Promise<SovereignExecutionInspection>;

  verifyResult?(
    execution: SovereignExecutionRecord,
    result: unknown
  ): Promise<boolean>;

  retry?(
    execution: SovereignExecutionRecord
  ): Promise<boolean>;

  reassign?(
    execution: SovereignExecutionRecord
  ): Promise<{
    accepted: boolean;
    nodeId?: string;
    workerId?: string;
  }>;

  repair?(
    execution: SovereignExecutionRecord
  ): Promise<boolean>;

  persist?(
    execution: SovereignExecutionRecord
  ): Promise<void>;

  recordEvent?(event: {
    type: string;
    executionId?: string;
    taskId?: string;
    timestamp: number;
    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIExecutionSupervisor {
  private readonly executions =
    new Map<string, SovereignExecutionRecord>();

  constructor(
    private readonly adapter:
      SovereignExecutionSupervisorAdapter
  ) {}

  public async register(
    input: Omit<
      SovereignExecutionRecord,
      | "state"
      | "attempts"
      | "createdAt"
      | "updatedAt"
      | "startedAt"
      | "lastHeartbeatAt"
      | "completedAt"
      | "result"
      | "error"
    >
  ): Promise<SovereignExecutionRecord> {
    this.validateInput(input);

    if (this.executions.has(input.id)) {
      throw new Error(
        `Execution already registered: ${input.id}`
      );
    }

    const now = Date.now();

    const execution: SovereignExecutionRecord = {
      ...input,
      state: "PENDING",
      attempts: 0,
      maxAttempts: Math.max(
        1,
        input.maxAttempts
      ),
      timeoutMs: Math.max(
        1_000,
        input.timeoutMs
      ),
      heartbeatTimeoutMs: Math.max(
        1_000,
        input.heartbeatTimeoutMs
      ),
      createdAt: now,
      updatedAt: now
    };

    this.executions.set(
      execution.id,
      execution
    );

    await this.persist(execution);

    await this.record(
      "AI_EXECUTION_REGISTERED",
      execution
    );

    return this.clone(execution);
  }

  public async assigned(
    executionId: string,
    nodeId?: string,
    workerId?: string
  ): Promise<SovereignExecutionRecord> {
    const execution =
      this.getMutable(executionId);

    this.ensureNotTerminal(execution);

    execution.nodeId = nodeId;
    execution.workerId = workerId;
    execution.state = "ASSIGNED";
    execution.updatedAt = Date.now();

    await this.persist(execution);

    await this.record(
      "AI_EXECUTION_ASSIGNED",
      execution,
      {
        nodeId,
        workerId
      }
    );

    return this.clone(execution);
  }

  public async started(
    executionId: string
  ): Promise<SovereignExecutionRecord> {
    const execution =
      this.getMutable(executionId);

    this.ensureNotTerminal(execution);

    if (
      execution.attempts >=
      execution.maxAttempts
    ) {
      throw new Error(
        `Execution maximum attempts reached: ${execution.id}`
      );
    }

    const now = Date.now();

    execution.state = "RUNNING";
    execution.attempts += 1;
    execution.startedAt = now;
    execution.lastHeartbeatAt = now;
    execution.completedAt = undefined;
    execution.result = undefined;
    execution.error = undefined;
    execution.updatedAt = now;

    await this.persist(execution);

    await this.record(
      "AI_EXECUTION_STARTED",
      execution,
      {
        attempts: execution.attempts
      }
    );

    return this.clone(execution);
  }

  public async heartbeat(
    executionId: string
  ): Promise<void> {
    const execution =
      this.getMutable(executionId);

    if (
      execution.state !== "RUNNING"
    ) {
      return;
    }

    const now = Date.now();

    execution.lastHeartbeatAt = now;
    execution.updatedAt = now;

    await this.persist(execution);

    await this.record(
      "AI_EXECUTION_HEARTBEAT",
      execution
    );
  }

  public async supervise(
    executionId: string
  ): Promise<SovereignExecutionDecision> {
    const execution =
      this.getMutable(executionId);

    if (this.isTerminal(execution)) {
      return execution.state ===
        "COMPLETED"
        ? "COMPLETE"
        : "FAIL";
    }

    if (this.hasTimedOut(execution)) {
      return await this.recover(
        execution,
        "Execution timeout exceeded."
      );
    }

    if (
      this.heartbeatExpired(execution)
    ) {
      return await this.recover(
        execution,
        "Execution heartbeat expired."
      );
    }

    let inspection:
      SovereignExecutionInspection;

    try {
      inspection =
        await this.adapter.inspect(
          this.clone(execution)
        );
    } catch (error) {
      return await this.recover(
        execution,
        error instanceof Error
          ? error.message
          : String(error)
      );
    }

    if (!inspection.reachable) {
      return await this.reassign(
        execution,
        "Execution target unreachable."
      );
    }

    if (inspection.failed) {
      return await this.recover(
        execution,
        inspection.error ||
          "Execution reported failure."
      );
    }

    if (inspection.completed) {
      return await this.complete(
        execution,
        inspection.result
      );
    }

    if (inspection.running) {
      execution.state = "RUNNING";
      execution.updatedAt = Date.now();

      await this.persist(execution);

      return "CONTINUE";
    }

    return "CONTINUE";
  }

  public async cancel(
    executionId: string,
    reason?: string
  ): Promise<SovereignExecutionRecord> {
    const execution =
      this.getMutable(executionId);

    if (this.isTerminal(execution)) {
      return this.clone(execution);
    }

    const now = Date.now();

    execution.state = "CANCELLED";
    execution.error = reason;
    execution.completedAt = now;
    execution.updatedAt = now;

    await this.persist(execution);

    await this.record(
      "AI_EXECUTION_CANCELLED",
      execution,
      {
        reason
      }
    );

    return this.clone(execution);
  }

  public get(
    executionId: string
  ): SovereignExecutionRecord {
    return this.clone(
      this.getMutable(executionId)
    );
  }

  public list():
    SovereignExecutionRecord[] {
    return [
      ...this.executions.values()
    ].map(
      execution =>
        this.clone(execution)
    );
  }

  private async complete(
    execution: SovereignExecutionRecord,
    result: unknown
  ): Promise<SovereignExecutionDecision> {
    execution.state = "VERIFYING";
    execution.updatedAt = Date.now();

    await this.persist(execution);

    await this.record(
      "AI_EXECUTION_VERIFYING",
      execution
    );

    if (this.adapter.verifyResult) {
      let verified: boolean;

      try {
        verified =
          await this.adapter.verifyResult(
            this.clone(execution),
            result
          );
      } catch (error) {
        return await this.recover(
          execution,
          error instanceof Error
            ? error.message
            : String(error)
        );
      }

      if (!verified) {
        return await this.recover(
          execution,
          "Execution result verification failed."
        );
      }
    }

    const now = Date.now();

    execution.state = "COMPLETED";
    execution.result = result;
    execution.error = undefined;
    execution.completedAt = now;
    execution.updatedAt = now;

    await this.persist(execution);

    await this.record(
      "AI_EXECUTION_COMPLETED",
      execution
    );

    return "COMPLETE";
  }

  private async recover(
    execution: SovereignExecutionRecord,
    error: string
  ): Promise<SovereignExecutionDecision> {
    execution.error = error;
    execution.updatedAt = Date.now();

    if (
      execution.attempts <
      execution.maxAttempts
    ) {
      if (this.adapter.retry) {
        execution.state = "RETRYING";

        await this.persist(execution);

        try {
          const accepted =
            await this.adapter.retry(
              this.clone(execution)
            );

          if (accepted) {
            execution.startedAt =
              undefined;

            execution.lastHeartbeatAt =
              undefined;

            execution.updatedAt =
              Date.now();

            await this.persist(execution);

            await this.record(
              "AI_EXECUTION_RETRY_REQUESTED",
              execution,
              {
                error
              }
            );

            return "RETRY";
          }
        } catch {
          // Continue to reassignment.
        }
      }

      return await this.reassign(
        execution,
        error
      );
    }

    if (this.adapter.repair) {
      execution.state = "REPAIRING";

      await this.persist(execution);

      try {
        const repaired =
          await this.adapter.repair(
            this.clone(execution)
          );

        if (repaired) {
          execution.startedAt =
            undefined;

          execution.lastHeartbeatAt =
            undefined;

          execution.updatedAt =
            Date.now();

          await this.persist(execution);

          await this.record(
            "AI_EXECUTION_REPAIR_REQUESTED",
            execution,
            {
              error
            }
          );

          return "REPAIR";
        }
      } catch {
        // Fall through to failure.
      }
    }

    return await this.fail(
      execution,
      error
    );
  }

  private async reassign(
    execution: SovereignExecutionRecord,
    reason: string
  ): Promise<SovereignExecutionDecision> {
    if (!this.adapter.reassign) {
      return await this.fail(
        execution,
        reason
      );
    }

    execution.state = "REASSIGNING";
    execution.error = reason;
    execution.updatedAt = Date.now();

    await this.persist(execution);

    let result: {
      accepted: boolean;
      nodeId?: string;
      workerId?: string;
    };

    try {
      result =
        await this.adapter.reassign(
          this.clone(execution)
        );
    } catch (error) {
      return await this.fail(
        execution,
        error instanceof Error
          ? error.message
          : String(error)
      );
    }

    if (!result.accepted) {
      return await this.fail(
        execution,
        reason
      );
    }

    execution.nodeId =
      result.nodeId;

    execution.workerId =
      result.workerId;

    execution.startedAt =
      undefined;

    execution.lastHeartbeatAt =
      undefined;

    execution.completedAt =
      undefined;

    execution.updatedAt =
      Date.now();

    await this.persist(execution);

    await this.record(
      "AI_EXECUTION_REASSIGNED",
      execution,
      {
        reason,
        nodeId: result.nodeId,
        workerId: result.workerId
      }
    );

    return "REASSIGN";
  }

  private async fail(
    execution: SovereignExecutionRecord,
    error: string
  ): Promise<SovereignExecutionDecision> {
    const now = Date.now();

    execution.state = "FAILED";
    execution.error = error;
    execution.completedAt = now;
    execution.updatedAt = now;

    await this.persist(execution);

    await this.record(
      "AI_EXECUTION_FAILED",
      execution,
      {
        error,
        attempts:
          execution.attempts
      }
    );

    return "FAIL";
  }

  private hasTimedOut(
    execution: SovereignExecutionRecord
  ): boolean {
    if (
      execution.state !== "RUNNING" ||
      execution.startedAt ===
        undefined
    ) {
      return false;
    }

    return (
      Date.now() -
        execution.startedAt >
      execution.timeoutMs
    );
  }

  private heartbeatExpired(
    execution: SovereignExecutionRecord
  ): boolean {
    if (
      execution.state !== "RUNNING" ||
      execution.lastHeartbeatAt ===
        undefined
    ) {
      return false;
    }

    return (
      Date.now() -
        execution.lastHeartbeatAt >
      execution.heartbeatTimeoutMs
    );
  }

  private isTerminal(
    execution: SovereignExecutionRecord
  ): boolean {
    return (
      execution.state ===
        "COMPLETED" ||
      execution.state ===
        "FAILED" ||
      execution.state ===
        "CANCELLED"
    );
  }

  private ensureNotTerminal(
    execution: SovereignExecutionRecord
  ): void {
    if (this.isTerminal(execution)) {
      throw new Error(
        `Execution is terminal: ${execution.id}`
      );
    }
  }

  private validateInput(
    input: {
      id: string;
      taskId: string;
      schedulerTaskId: string;
      maxAttempts: number;
      timeoutMs: number;
      heartbeatTimeoutMs: number;
    }
  ): void {
    if (!input.id.trim()) {
      throw new Error(
        "Execution id is required."
      );
    }

    if (!input.taskId.trim()) {
      throw new Error(
        "Execution task id is required."
      );
    }

    if (
      !input.schedulerTaskId.trim()
    ) {
      throw new Error(
        "Execution scheduler task id is required."
      );
    }

    if (
      !Number.isFinite(
        input.maxAttempts
      ) ||
      input.maxAttempts < 1
    ) {
      throw new Error(
        "Execution maxAttempts must be at least 1."
      );
    }

    if (
      !Number.isFinite(
        input.timeoutMs
      ) ||
      input.timeoutMs < 1_000
    ) {
      throw new Error(
        "Execution timeoutMs must be at least 1000."
      );
    }

    if (
      !Number.isFinite(
        input.heartbeatTimeoutMs
      ) ||
      input.heartbeatTimeoutMs <
        1_000
    ) {
      throw new Error(
        "Execution heartbeatTimeoutMs must be at least 1000."
      );
    }
  }

  private getMutable(
    executionId: string
  ): SovereignExecutionRecord {
    const id =
      executionId.trim();

    if (!id) {
      throw new Error(
        "Execution id is required."
      );
    }

    const execution =
      this.executions.get(id);

    if (!execution) {
      throw new Error(
        `Execution not found: ${id}`
      );
    }

    return execution;
  }

  private async persist(
    execution: SovereignExecutionRecord
  ): Promise<void> {
    this.executions.set(
      execution.id,
      execution
    );

    if (this.adapter.persist) {
      await this.adapter.persist(
        this.clone(execution)
      );
    }
  }

  private async record(
    type: string,
    execution:
      SovereignExecutionRecord,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (!this.adapter.recordEvent) {
      return;
    }

    await this.adapter.recordEvent({
      type,
      executionId:
        execution.id,
      taskId:
        execution.taskId,
      timestamp:
        Date.now(),
      data
    });
  }

  private clone(
    execution: SovereignExecutionRecord
  ): SovereignExecutionRecord {
    return {
      ...execution,

      metadata:
        execution.metadata
          ? {
              ...execution.metadata
            }
          : undefined
    };
  }
}

export default SovereignAIExecutionSupervisor;

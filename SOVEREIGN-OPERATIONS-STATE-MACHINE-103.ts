// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-STATE-MACHINE-103.ts
// Sequence: 103
// Purpose: Deterministic Sovereign Operations State Machine
// ============================================================================

export const SOVEREIGN_OPERATIONS_STATE_MACHINE_ID =
  "SOVEREIGN-OPERATIONS-STATE-MACHINE-103";

export const SOVEREIGN_OPERATIONS_STATE_MACHINE_VERSION = "1.0.0";

export type SovereignOperationState =
  | "REGISTERED"
  | "QUEUED"
  | "EVALUATING"
  | "READY"
  | "RESTRICTED"
  | "BLOCKED"
  | "EXECUTING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "ARCHIVED";

export type SovereignOperationEvent =
  | "QUEUE"
  | "EVALUATE"
  | "APPROVE"
  | "RESTRICT"
  | "BLOCK"
  | "EXECUTE"
  | "PAUSE"
  | "RESUME"
  | "COMPLETE"
  | "FAIL"
  | "CANCEL"
  | "ARCHIVE"
  | "RETRY";

export interface SovereignStateTransition {
  from: SovereignOperationState;
  event: SovereignOperationEvent;
  to: SovereignOperationState;
}

export interface SovereignStateRequest {
  operationId: string;

  currentState: SovereignOperationState;

  event: SovereignOperationEvent;

  requestedBy: string;

  ownerId: string;

  ownerAuthority: "SUPREME";

  stewardAuthority: "DELEGATED";

  timestamp?: number;
}

export interface SovereignStateResult {
  operationId: string;

  previousState: SovereignOperationState;

  currentState: SovereignOperationState;

  event: SovereignOperationEvent;

  transitioned: boolean;

  reason?: string;

  timestamp: number;

  authority: "NONE";
}

export interface SovereignStateHistoryEntry {
  operationId: string;

  from: SovereignOperationState;

  to: SovereignOperationState;

  event: SovereignOperationEvent;

  requestedBy: string;

  timestamp: number;
}

export class SovereignOperationsStateMachine {
  public readonly id =
    SOVEREIGN_OPERATIONS_STATE_MACHINE_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_STATE_MACHINE_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" = "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly stateMachineCanCreateAuthority = false;

  public readonly stateMachineCanEscalateAuthority = false;

  public readonly stateMachineCanOverrideOwner = false;

  public readonly stewardCanOverrideOwner = false;

  private readonly history: SovereignStateHistoryEntry[] = [];

  private readonly transitions: SovereignStateTransition[] = [
    {
      from: "REGISTERED",
      event: "QUEUE",
      to: "QUEUED"
    },
    {
      from: "REGISTERED",
      event: "EVALUATE",
      to: "EVALUATING"
    },
    {
      from: "QUEUED",
      event: "EVALUATE",
      to: "EVALUATING"
    },
    {
      from: "EVALUATING",
      event: "APPROVE",
      to: "READY"
    },
    {
      from: "EVALUATING",
      event: "RESTRICT",
      to: "RESTRICTED"
    },
    {
      from: "EVALUATING",
      event: "BLOCK",
      to: "BLOCKED"
    },
    {
      from: "READY",
      event: "EXECUTE",
      to: "EXECUTING"
    },
    {
      from: "RESTRICTED",
      event: "EVALUATE",
      to: "EVALUATING"
    },
    {
      from: "BLOCKED",
      event: "RETRY",
      to: "QUEUED"
    },
    {
      from: "EXECUTING",
      event: "PAUSE",
      to: "PAUSED"
    },
    {
      from: "PAUSED",
      event: "RESUME",
      to: "EXECUTING"
    },
    {
      from: "EXECUTING",
      event: "COMPLETE",
      to: "COMPLETED"
    },
    {
      from: "EXECUTING",
      event: "FAIL",
      to: "FAILED"
    },
    {
      from: "FAILED",
      event: "RETRY",
      to: "QUEUED"
    },
    {
      from: "READY",
      event: "CANCEL",
      to: "CANCELLED"
    },
    {
      from: "QUEUED",
      event: "CANCEL",
      to: "CANCELLED"
    },
    {
      from: "PAUSED",
      event: "CANCEL",
      to: "CANCELLED"
    },
    {
      from: "COMPLETED",
      event: "ARCHIVE",
      to: "ARCHIVED"
    },
    {
      from: "FAILED",
      event: "ARCHIVE",
      to: "ARCHIVED"
    },
    {
      from: "CANCELLED",
      event: "ARCHIVE",
      to: "ARCHIVED"
    }
  ];

  private validateSovereignty(
    request: SovereignStateRequest
  ): string | undefined {
    if (!request.ownerId) {
      return "OWNER_ID_REQUIRED";
    }

    if (request.ownerAuthority !== "SUPREME") {
      return "OWNER_MUST_REMAIN_SUPREME";
    }

    if (request.stewardAuthority !== "DELEGATED") {
      return "STEWARD_MUST_REMAIN_DELEGATED";
    }

    if (!request.requestedBy) {
      return "REQUESTER_REQUIRED";
    }

    return undefined;
  }

  private findTransition(
    state: SovereignOperationState,
    event: SovereignOperationEvent
  ): SovereignStateTransition | undefined {
    return this.transitions.find(
      (transition) =>
        transition.from === state &&
        transition.event === event
    );
  }

  public canTransition(
    state: SovereignOperationState,
    event: SovereignOperationEvent
  ): boolean {
    return this.findTransition(state, event) !== undefined;
  }

  public transition(
    request: SovereignStateRequest
  ): SovereignStateResult {
    const timestamp = request.timestamp ?? Date.now();

    const sovereigntyError =
      this.validateSovereignty(request);

    if (sovereigntyError) {
      return {
        operationId: request.operationId,

        previousState: request.currentState,
        currentState: request.currentState,

        event: request.event,

        transitioned: false,

        reason: sovereigntyError,

        timestamp,

        authority: "NONE"
      };
    }

    const transition = this.findTransition(
      request.currentState,
      request.event
    );

    if (!transition) {
      return {
        operationId: request.operationId,

        previousState: request.currentState,
        currentState: request.currentState,

        event: request.event,

        transitioned: false,

        reason: "INVALID_STATE_TRANSITION",

        timestamp,

        authority: "NONE"
      };
    }

    this.history.push({
      operationId: request.operationId,

      from: transition.from,
      to: transition.to,

      event: transition.event,

      requestedBy: request.requestedBy,

      timestamp
    });

    return {
      operationId: request.operationId,

      previousState: transition.from,
      currentState: transition.to,

      event: transition.event,

      transitioned: true,

      timestamp,

      authority: "NONE"
    };
  }

  public getOperationHistory(
    operationId: string
  ): SovereignStateHistoryEntry[] {
    return this.history
      .filter(
        (entry) =>
          entry.operationId === operationId
      )
      .map((entry) => ({ ...entry }));
  }

  public getAllTransitions():
    SovereignStateTransition[] {
    return this.transitions.map(
      (transition) => ({ ...transition })
    );
  }

  public isTerminalState(
    state: SovereignOperationState
  ): boolean {
    return (
      state === "COMPLETED" ||
      state === "CANCELLED" ||
      state === "ARCHIVED"
    );
  }

  public assertSovereignty(): boolean {
    return (
      this.authority === "NONE" &&
      this.ownerAuthority === "SUPREME" &&
      this.stewardAuthority === "DELEGATED" &&
      this.stateMachineCanCreateAuthority === false &&
      this.stateMachineCanEscalateAuthority === false &&
      this.stateMachineCanOverrideOwner === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsStateMachine =
  new SovereignOperationsStateMachine();

export default sovereignOperationsStateMachine;

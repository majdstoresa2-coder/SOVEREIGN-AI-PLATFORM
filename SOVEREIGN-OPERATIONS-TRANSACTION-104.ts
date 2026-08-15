// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-TRANSACTION-104.ts
// Sequence: 104
// Purpose: Atomic Sovereign Operations Transaction Layer
// ============================================================================

export const SOVEREIGN_OPERATIONS_TRANSACTION_ID =
  "SOVEREIGN-OPERATIONS-TRANSACTION-104";

export const SOVEREIGN_OPERATIONS_TRANSACTION_VERSION = "1.0.0";

export type SovereignTransactionState =
  | "CREATED"
  | "STARTED"
  | "PREPARING"
  | "PREPARED"
  | "COMMITTING"
  | "COMMITTED"
  | "ABORTING"
  | "ABORTED"
  | "ROLLING_BACK"
  | "ROLLED_BACK"
  | "FAILED";

export type SovereignTransactionAction =
  | "BEGIN"
  | "PREPARE"
  | "COMMIT"
  | "ABORT"
  | "ROLLBACK";

export interface SovereignTransactionAuthority {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignTransactionRequest {
  transactionId: string;
  operationId: string;

  requestedBy: string;
  target: string;

  authorityContext: SovereignTransactionAuthority;

  orchestratorApproved: boolean;
  executorApproved: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignTransactionGuard {
  securityApproved: boolean;
  policyApproved: boolean;
  reliabilityApproved: boolean;

  backupAvailable: boolean;
  rollbackAvailable: boolean;

  stateMachineValid: boolean;

  activeBlockingIncident: boolean;
}

export interface SovereignTransactionRecord {
  transactionId: string;
  operationId: string;

  state: SovereignTransactionState;

  previousState?: SovereignTransactionState;

  action?: SovereignTransactionAction;

  requestedBy: string;

  createdAt: number;
  updatedAt: number;

  reasons: string[];

  authority: "NONE";
}

export interface SovereignTransactionResult {
  transactionId: string;
  operationId: string;

  state: SovereignTransactionState;

  successful: boolean;

  reasons: string[];

  rollbackRequired: boolean;

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsTransaction {
  public readonly id =
    SOVEREIGN_OPERATIONS_TRANSACTION_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_TRANSACTION_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" = "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly transactionCanCreateAuthority = false;

  public readonly transactionCanEscalateAuthority = false;

  public readonly transactionCanOverrideOwner = false;

  public readonly stewardCanOverrideOwner = false;

  private readonly transactions =
    new Map<string, SovereignTransactionRecord>();

  private validateAuthority(
    request: SovereignTransactionRequest
  ): string[] {
    const reasons: string[] = [];
    const authority = request.authorityContext;

    if (!authority.ownerId) {
      reasons.push("OWNER_ID_REQUIRED");
    }

    if (authority.ownerAuthority !== "SUPREME") {
      reasons.push("OWNER_MUST_REMAIN_SUPREME");
    }

    if (authority.stewardAuthority !== "DELEGATED") {
      reasons.push("STEWARD_MUST_REMAIN_DELEGATED");
    }

    if (!request.requestedBy) {
      reasons.push("REQUESTER_REQUIRED");
    }

    return reasons;
  }

  private validateGuards(
    request: SovereignTransactionRequest,
    guard: SovereignTransactionGuard
  ): string[] {
    const reasons: string[] = [];

    if (!request.orchestratorApproved) {
      reasons.push("ORCHESTRATOR_APPROVAL_REQUIRED");
    }

    if (!request.executorApproved) {
      reasons.push("EXECUTOR_APPROVAL_REQUIRED");
    }

    if (!guard.securityApproved) {
      reasons.push("SECURITY_NOT_APPROVED");
    }

    if (!guard.policyApproved) {
      reasons.push("POLICY_NOT_APPROVED");
    }

    if (!guard.reliabilityApproved) {
      reasons.push("RELIABILITY_NOT_APPROVED");
    }

    if (!guard.stateMachineValid) {
      reasons.push("STATE_MACHINE_INVALID");
    }

    if (guard.activeBlockingIncident) {
      reasons.push("BLOCKING_INCIDENT_ACTIVE");
    }

    return reasons;
  }

  public begin(
    request: SovereignTransactionRequest,
    guard: SovereignTransactionGuard
  ): SovereignTransactionResult {
    const reasons = [
      ...this.validateAuthority(request),
      ...this.validateGuards(request, guard)
    ];

    if (this.transactions.has(request.transactionId)) {
      reasons.push("TRANSACTION_ALREADY_EXISTS");
    }

    const successful = reasons.length === 0;

    const state: SovereignTransactionState =
      successful ? "STARTED" : "FAILED";

    const now = Date.now();

    if (successful) {
      this.transactions.set(request.transactionId, {
        transactionId: request.transactionId,
        operationId: request.operationId,

        state,
        previousState: "CREATED",
        action: "BEGIN",

        requestedBy: request.requestedBy,

        createdAt: request.createdAt,
        updatedAt: now,

        reasons: [],

        authority: "NONE"
      });
    }

    return {
      transactionId: request.transactionId,
      operationId: request.operationId,

      state,

      successful,

      reasons,

      rollbackRequired: false,

      timestamp: now,

      authority: "NONE"
    };
  }

  public prepare(
    transactionId: string,
    guard: SovereignTransactionGuard
  ): SovereignTransactionResult {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      return this.failure(
        transactionId,
        "",
        "TRANSACTION_NOT_FOUND"
      );
    }

    if (transaction.state !== "STARTED") {
      return this.failure(
        transaction.transactionId,
        transaction.operationId,
        "TRANSACTION_NOT_STARTED"
      );
    }

    const reasons: string[] = [];

    if (!guard.securityApproved) {
      reasons.push("SECURITY_NOT_APPROVED");
    }

    if (!guard.policyApproved) {
      reasons.push("POLICY_NOT_APPROVED");
    }

    if (!guard.reliabilityApproved) {
      reasons.push("RELIABILITY_NOT_APPROVED");
    }

    if (!guard.stateMachineValid) {
      reasons.push("STATE_MACHINE_INVALID");
    }

    if (guard.activeBlockingIncident) {
      reasons.push("BLOCKING_INCIDENT_ACTIVE");
    }

    if (reasons.length > 0) {
      return {
        transactionId: transaction.transactionId,
        operationId: transaction.operationId,

        state: "FAILED",

        successful: false,

        reasons,

        rollbackRequired: true,

        timestamp: Date.now(),

        authority: "NONE"
      };
    }

    this.updateTransaction(
      transaction,
      "PREPARED",
      "PREPARE"
    );

    return this.success(transaction);
  }

  public commit(
    transactionId: string
  ): SovereignTransactionResult {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      return this.failure(
        transactionId,
        "",
        "TRANSACTION_NOT_FOUND"
      );
    }

    if (transaction.state !== "PREPARED") {
      return this.failure(
        transaction.transactionId,
        transaction.operationId,
        "TRANSACTION_NOT_PREPARED"
      );
    }

    this.updateTransaction(
      transaction,
      "COMMITTED",
      "COMMIT"
    );

    return this.success(transaction);
  }

  public abort(
    transactionId: string,
    reason = "TRANSACTION_ABORTED"
  ): SovereignTransactionResult {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      return this.failure(
        transactionId,
        "",
        "TRANSACTION_NOT_FOUND"
      );
    }

    if (transaction.state === "COMMITTED") {
      return this.failure(
        transaction.transactionId,
        transaction.operationId,
        "COMMITTED_TRANSACTION_REQUIRES_ROLLBACK"
      );
    }

    transaction.reasons.push(reason);

    this.updateTransaction(
      transaction,
      "ABORTED",
      "ABORT"
    );

    return {
      ...this.success(transaction),
      reasons: [...transaction.reasons]
    };
  }

  public rollback(
    transactionId: string,
    rollbackAvailable: boolean
  ): SovereignTransactionResult {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      return this.failure(
        transactionId,
        "",
        "TRANSACTION_NOT_FOUND"
      );
    }

    if (!rollbackAvailable) {
      return {
        transactionId: transaction.transactionId,
        operationId: transaction.operationId,

        state: "FAILED",

        successful: false,

        reasons: ["ROLLBACK_NOT_AVAILABLE"],

        rollbackRequired: true,

        timestamp: Date.now(),

        authority: "NONE"
      };
    }

    this.updateTransaction(
      transaction,
      "ROLLED_BACK",
      "ROLLBACK"
    );

    return this.success(transaction);
  }

  private updateTransaction(
    transaction: SovereignTransactionRecord,
    state: SovereignTransactionState,
    action: SovereignTransactionAction
  ): void {
    transaction.previousState = transaction.state;
    transaction.state = state;
    transaction.action = action;
    transaction.updatedAt = Date.now();

    this.transactions.set(
      transaction.transactionId,
      transaction
    );
  }

  private success(
    transaction: SovereignTransactionRecord
  ): SovereignTransactionResult {
    return {
      transactionId: transaction.transactionId,
      operationId: transaction.operationId,

      state: transaction.state,

      successful: true,

      reasons: [...transaction.reasons],

      rollbackRequired: false,

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  private failure(
    transactionId: string,
    operationId: string,
    reason: string
  ): SovereignTransactionResult {
    return {
      transactionId,
      operationId,

      state: "FAILED",

      successful: false,

      reasons: [reason],

      rollbackRequired: false,

      timestamp: Date.now(),

      authority: "NONE"
    };
  }

  public getTransaction(
    transactionId: string
  ): SovereignTransactionRecord | undefined {
    const transaction = this.transactions.get(transactionId);

    return transaction
      ? {
          ...transaction,
          reasons: [...transaction.reasons]
        }
      : undefined;
  }

  public assertSovereignty(): boolean {
    return (
      this.authority === "NONE" &&
      this.ownerAuthority === "SUPREME" &&
      this.stewardAuthority === "DELEGATED" &&
      this.transactionCanCreateAuthority === false &&
      this.transactionCanEscalateAuthority === false &&
      this.transactionCanOverrideOwner === false &&
      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsTransaction =
  new SovereignOperationsTransaction();

export default sovereignOperationsTransaction;

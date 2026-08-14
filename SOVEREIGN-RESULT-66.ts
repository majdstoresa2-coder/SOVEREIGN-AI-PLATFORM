/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-RESULT-66
 * ============================================================
 *
 * Sovereign Result Engine.
 *
 * Responsibilities:
 * - Record sovereign execution results.
 * - Validate execution outcomes.
 * - Preserve result evidence.
 * - Bind results to executions and decisions.
 * - Track verification state.
 * - Reject unverifiable success claims.
 * - Preserve correlation and causation.
 *
 * RESULT ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignResultStatus =
  | "CREATED"
  | "VERIFYING"
  | "VERIFIED"
  | "PARTIAL"
  | "FAILED"
  | "REJECTED";

export type SovereignResultOutcome =
  | "SUCCESS"
  | "PARTIAL"
  | "FAILURE";

export interface SovereignResultEvidence {
  id: string;

  type: string;

  source: string;

  verified: boolean;

  data?: Record<string, unknown>;

  createdAt: string;
}

export interface SovereignResult {
  id: string;

  executionId: string;

  decisionId: string;

  planId?: string;

  strategyId?: string;

  source: string;

  status: SovereignResultStatus;

  outcome: SovereignResultOutcome;

  summary: string;

  requestedBy: string;

  verifiedBy?: string;

  evidence: SovereignResultEvidence[];

  output?: Record<string, unknown>;

  error?: string;

  correlationId?: string;

  causationId?: string;

  idempotencyKey?: string;

  createdAt: string;

  verifiedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignResultContext {
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

export interface SovereignResultStore {
  saveResult(
    result: SovereignResult
  ): Promise<void>;

  getResult(
    resultId: string
  ): Promise<SovereignResult | undefined>;

  listResults(
    limit?: number
  ): Promise<SovereignResult[]>;

  findByExecutionId?(
    executionId: string
  ): Promise<SovereignResult | undefined>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignResult | undefined>;
}

export interface SovereignResultExecutionBridge {
  getExecution(
    executionId: string
  ): Promise<{
    id: string;

    decisionId: string;

    planId?: string;

    strategyId?: string;

    status:
      | "CREATED"
      | "READY"
      | "RUNNING"
      | "COMPLETED"
      | "PARTIAL"
      | "FAILED"
      | "CANCELLED"
      | "ROLLED_BACK";

    progress: number;

    error?: string;
  }>;
}

export interface SovereignResultVerificationBridge {
  verify(input: {
    result: SovereignResult;

    context: SovereignResultContext;
  }): Promise<{
    valid: boolean;

    outcome:
      SovereignResultOutcome;

    reason?: string;

    evidence?: SovereignResultEvidence[];

    metadata?: Record<string, unknown>;
  }>;
}

export interface SovereignResultPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignResultContext["authority"];

    operation:
      | "CREATE_RESULT"
      | "VERIFY_RESULT"
      | "READ_RESULT";

    resultId?: string;

    executionId?: string;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

export interface SovereignResultEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    resultId?: string;

    executionId?: string;

    decisionId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignResultAudit {
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

export class SovereignResultEngine {
  public readonly id =
    "SOVEREIGN-RESULT-66";

  public readonly version =
    "1.0.0";

  private store?: SovereignResultStore;

  private executionBridge?: SovereignResultExecutionBridge;

  private verificationBridge?: SovereignResultVerificationBridge;

  private policyBridge?: SovereignResultPolicyBridge;

  private eventBridge?: SovereignResultEventBridge;

  private audit?: SovereignResultAudit;

  private verifying =
    new Set<string>();

  setStore(
    store: SovereignResultStore
  ): void {
    this.store = store;
  }

  setExecutionBridge(
    bridge: SovereignResultExecutionBridge
  ): void {
    this.executionBridge = bridge;
  }

  setVerificationBridge(
    bridge: SovereignResultVerificationBridge
  ): void {
    this.verificationBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignResultPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignResultEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignResultAudit
  ): void {
    this.audit = audit;
  }

  async createResult(
    input: {
      id?: string;

      executionId: string;

      source: string;

      summary: string;

      output?: Record<string, unknown>;

      evidence?: Array<{
        id?: string;

        type: string;

        source: string;

        verified?: boolean;

        data?: Record<string, unknown>;
      }>;

      correlationId?: string;

      causationId?: string;

      idempotencyKey?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignResultContext
  ): Promise<SovereignResult> {
    this.requireContext(context);

    if (!input.executionId.trim()) {
      throw new Error(
        "Result executionId is required."
      );
    }

    if (!input.source.trim()) {
      throw new Error(
        "Result source is required."
      );
    }

    if (!input.summary.trim()) {
      throw new Error(
        "Result summary is required."
      );
    }

    const execution =
      await this.requireExecutionBridge()
        .getExecution(
          input.executionId
        );

    if (
      execution.status === "READY" ||
      execution.status === "CREATED" ||
      execution.status === "RUNNING"
    ) {
      throw new Error(
        `Execution is not finished: ${execution.status}`
      );
    }

    const resultId =
      input.id ??
      this.createId("RESULT");

    await this.requireAuthorized(
      context,
      "CREATE_RESULT",
      resultId,
      execution.id
    );

    if (
      input.idempotencyKey &&
     

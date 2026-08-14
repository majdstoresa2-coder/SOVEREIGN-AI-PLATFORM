/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-FEEDBACK-67
 * ============================================================
 *
 * Sovereign Feedback Engine.
 *
 * Responsibilities:
 * - Convert verified results into structured feedback.
 * - Detect failures, weaknesses and improvement opportunities.
 * - Produce recommendations for future planning.
 * - Preserve evidence and traceability.
 * - Prevent feedback from granting authority.
 *
 * FEEDBACK ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignFeedbackSeverity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignFeedbackStatus =
  | "CREATED"
  | "ANALYZING"
  | "READY"
  | "REJECTED"
  | "ARCHIVED";

export type SovereignFeedbackCategory =
  | "SUCCESS"
  | "QUALITY"
  | "FAILURE"
  | "PERFORMANCE"
  | "SECURITY"
  | "POLICY"
  | "EFFICIENCY"
  | "IMPROVEMENT";

export interface SovereignFeedbackFinding {
  id: string;

  category: SovereignFeedbackCategory;

  severity: SovereignFeedbackSeverity;

  title: string;

  description: string;

  evidenceIds: string[];

  recommendation?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignFeedback {
  id: string;

  resultId: string;

  executionId: string;

  decisionId: string;

  planId?: string;

  strategyId?: string;

  source: string;

  status: SovereignFeedbackStatus;

  findings: SovereignFeedbackFinding[];

  summary?: string;

  requestedBy: string;

  analyzedBy?: string;

  correlationId?: string;

  causationId?: string;

  idempotencyKey?: string;

  createdAt: string;

  analyzedAt?: string;

  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignFeedbackContext {
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

export interface SovereignFeedbackStore {
  saveFeedback(
    feedback: SovereignFeedback
  ): Promise<void>;

  getFeedback(
    feedbackId: string
  ): Promise<SovereignFeedback | undefined>;

  listFeedback(
    limit?: number
  ): Promise<SovereignFeedback[]>;

  findByResultId?(
    resultId: string
  ): Promise<SovereignFeedback | undefined>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignFeedback | undefined>;
}

export interface SovereignFeedbackResultBridge {
  getResult(
    resultId: string
  ): Promise<{
    id: string;

    executionId: string;

    decisionId: string;

    planId?: string;

    strategyId?: string;

    status:
      | "CREATED"
      | "VERIFYING"
      | "VERIFIED"
      | "PARTIAL"
      | "FAILED"
      | "REJECTED";

    outcome:
      | "SUCCESS"
      | "PARTIAL"
      | "FAILURE";

    summary: string;

    error?: string;

    evidence: Array<{
      id: string;
      type: string;
      source: string;
      verified: boolean;
      data?: Record<string, unknown>;
    }>;

    output?: Record<string, unknown>;
  }>;
}

export interface SovereignFeedbackAnalysisBridge {
  analyze(input: {
    feedback: SovereignFeedback;

    result: Awaited<
      ReturnType<
        SovereignFeedbackResultBridge["getResult"]
      >
    >;

    context: SovereignFeedbackContext;
  }): Promise<{
    summary: string;

    findings: Array<{
      category: SovereignFeedbackCategory;

      severity: SovereignFeedbackSeverity;

      title: string;

      description: string;

      evidenceIds?: string[];

      recommendation?: string;

      metadata?: Record<string, unknown>;
    }>;
  }>;
}

export interface SovereignFeedbackPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignFeedbackContext["authority"];

    operation:
      | "CREATE_FEEDBACK"
      | "ANALYZE_FEEDBACK"
      | "READ_FEEDBACK"
      | "ARCHIVE_FEEDBACK";

    feedbackId?: string;

    resultId?: string;
  }): Promise<{
    allowed: boolean;
    reason?: string;
  }>;
}

export interface SovereignFeedback

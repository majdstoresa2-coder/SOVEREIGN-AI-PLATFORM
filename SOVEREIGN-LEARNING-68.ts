/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-LEARNING-68
 * ============================================================
 *
 * Sovereign Learning Engine.
 *
 * Responsibilities:
 * - Learn from validated sovereign feedback.
 * - Extract reusable lessons and knowledge.
 * - Track confidence and evidence.
 * - Prevent unverified learning.
 * - Preserve provenance and traceability.
 * - Feed future planning without granting authority.
 *
 * LEARNING ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignLearningStatus =
  | "CREATED"
  | "ANALYZING"
  | "VALIDATED"
  | "REJECTED"
  | "ARCHIVED";

export type SovereignLessonType =
  | "SUCCESS_PATTERN"
  | "FAILURE_PATTERN"
  | "QUALITY"
  | "PERFORMANCE"
  | "SECURITY"
  | "POLICY"
  | "EFFICIENCY"
  | "OPTIMIZATION";

export interface SovereignLesson {
  id: string;

  type: SovereignLessonType;

  title: string;

  description: string;

  confidence: number;

  evidenceIds: string[];

  recommendation?: string;

  reusable: boolean;

  createdAt: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignLearningRecord {
  id: string;

  feedbackId: string;

  resultId: string;

  executionId: string;

  decisionId: string;

  planId?: string;

  strategyId?: string;

  source: string;

  status: SovereignLearningStatus;

  lessons: SovereignLesson[];

  requestedBy: string;

  validatedBy?: string;

  correlationId?: string;

  causationId?: string;

  idempotencyKey?: string;

  createdAt: string;

  validatedAt?: string;

  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignLearningContext {
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

export interface SovereignLearningStore {
  saveLearning(
    learning: SovereignLearningRecord
  ): Promise<void>;

  getLearning(
    learningId: string
  ): Promise<SovereignLearningRecord | undefined>;

  listLearning(
    limit?: number
  ): Promise<SovereignLearningRecord[]>;

  findByFeedbackId?(
    feedbackId: string
  ): Promise<SovereignLearningRecord | undefined>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignLearningRecord | undefined>;
}

export interface SovereignLearningFeedbackBridge {
  getFeedback(
    feedbackId: string
  ): Promise<{
    id: string;

    resultId: string;

    executionId: string;

    decisionId: string;

    planId?: string;

    strategyId?: string;

    status:
      | "CREATED"
      | "ANALYZING"
      | "READY"
      | "REJECTED"
      | "ARCHIVED";

    summary?: string;

    findings: Array<{
      id: string;

      category: string;

      severity: string;

      title: string;

      description: string;

      evidenceIds: string[];

      recommendation?: string;

      metadata?: Record<string, unknown>;
    }>;
  }>;
}

export interface SovereignLearningAnalysisBridge {
  extract(input: {
    feedback: Awaited<
      ReturnType<
        SovereignLearningFeedbackBridge["getFeedback"]
      >
    >;

    context: SovereignLearningContext;
  }): Promise<{
    lessons: Array<{
      type: SovereignLessonType;

      title: string;

      description: string;

      confidence: number;

      evidenceIds?: string[];

      recommendation?: string;

      reusable?: boolean;

      metadata?: Record<string, unknown>;
    }>;
  }>;
}

export interface SovereignLearningPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignLearningContext["authority"];

    operation:
      | "CREATE_LEARNING"
      | "VALIDATE_LEARNING"
      | "READ_LEARNING"
      | "ARCHIVE_LEARNING";

    learningId?: string;

    feedbackId?: string;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

export interface SovereignLearningEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    learningId?: string;

    feedbackId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignLearningAudit {
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

export class SovereignLearningEngine {
  public readonly id =
    "SOVEREIGN-LEARNING-68";

  public readonly version =
    "1.0.0";

  private store?: SovereignLearningStore;

  private feedbackBridge?: SovereignLearningFeedbackBridge;

  private analysisBridge?: SovereignLearningAnalysisBridge;

  private policyBridge?: SovereignLearningPolicyBridge;

  private eventBridge?: SovereignLearningEventBridge;

  private audit?: SovereignLearningAudit;

  private analyzing =
    new Set<string>();

  setStore(
    store: SovereignLearningStore
  ): void {
    this.store = store;
  }

  setFeedbackBridge(
    bridge: SovereignLearningFeedbackBridge
  ): void {
    this.feedbackBridge = bridge;
  }

  setAnalysisBridge(
    bridge: SovereignLearningAnalysisBridge
  ): void {
    this.analysisBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignLearningPolicyBridge
  ): void

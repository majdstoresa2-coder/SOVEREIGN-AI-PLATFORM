/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-ADAPTATION-69
 * ============================================================
 *
 * Sovereign Adaptation Engine.
 *
 * Responsibilities:
 * - Convert validated learning into adaptation proposals.
 * - Preserve learning provenance and evidence.
 * - Score risk, confidence and expected impact.
 * - Require policy authorization.
 * - Route adaptations back to sovereign decision flow.
 * - Never modify the platform directly.
 *
 * ADAPTATION ENGINE IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignAdaptationStatus =
  | "CREATED"
  | "ANALYZING"
  | "PROPOSED"
  | "ACCEPTED"
  | "REJECTED"
  | "ARCHIVED";

export type SovereignAdaptationRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignAdaptationTarget =
  | "PLANNING"
  | "STRATEGY"
  | "POLICY"
  | "EXECUTION"
  | "QUALITY"
  | "SECURITY"
  | "PERFORMANCE"
  | "CAPABILITY";

export interface SovereignAdaptationProposal {
  id: string;

  target: SovereignAdaptationTarget;

  title: string;

  description: string;

  rationale: string;

  lessonIds: string[];

  confidence: number;

  expectedImpact: number;

  risk: SovereignAdaptationRisk;

  requiresOwner: boolean;

  metadata?: Record<string, unknown>;
}

export interface SovereignAdaptation {
  id: string;

  learningId: string;

  feedbackId: string;

  resultId: string;

  executionId: string;

  decisionId: string;

  planId?: string;

  strategyId?: string;

  source: string;

  status: SovereignAdaptationStatus;

  proposals: SovereignAdaptationProposal[];

  requestedBy: string;

  analyzedBy?: string;

  reviewedBy?: string;

  correlationId?: string;

  causationId?: string;

  idempotencyKey?: string;

  createdAt: string;

  analyzedAt?: string;

  reviewedAt?: string;

  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignAdaptationContext {
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

export interface SovereignAdaptationStore {
  saveAdaptation(
    adaptation: SovereignAdaptation
  ): Promise<void>;

  getAdaptation(
    adaptationId: string
  ): Promise<SovereignAdaptation | undefined>;

  listAdaptations(
    limit?: number
  ): Promise<SovereignAdaptation[]>;

  findByLearningId?(
    learningId: string
  ): Promise<SovereignAdaptation | undefined>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignAdaptation | undefined>;
}

export interface SovereignAdaptationLearningBridge {
  getLearning(
    learningId: string
  ): Promise<{
    id: string;

    feedbackId: string;

    resultId: string;

    executionId: string;

    decisionId: string;

    planId?: string;

    strategyId?: string;

    status:
      | "CREATED"
      | "ANALYZING"
      | "VALIDATED"
      | "REJECTED"
      | "ARCHIVED";

    lessons: Array<{
      id: string;

      type: string;

      title: string;

      description: string;

      confidence: number;

      evidenceIds: string[];

      recommendation?: string;

      reusable: boolean;
    }>;
  }>;
}

export interface Sovereign

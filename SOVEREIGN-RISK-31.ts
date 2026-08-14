/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-RISK-31
 * ============================================================
 *
 * Central Sovereign Risk Engine.
 *
 * Responsibilities:
 * - Evaluate platform risk.
 * - Aggregate sovereign security signals.
 * - Score identity, session, device, network and service risk.
 * - Detect abnormal and dangerous contexts.
 * - Produce deterministic risk decisions.
 * - Support Zero Trust enforcement.
 * - Support continuous risk evaluation.
 * - Preserve risk history and audit events.
 *
 * RISK IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 *
 * Risk may recommend DENY / CHALLENGE / RESTRICT,
 * but it never grants authority or privileges.
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. RISK LEVEL
 * ============================================================
 */

export type SovereignRiskLevel =
  | "MINIMAL"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

/* ============================================================
 * 2. RISK SUBJECT TYPE
 * ============================================================
 */

export type SovereignRiskSubjectType =
  | "IDENTITY"
  | "SESSION"
  | "DEVICE"
  | "NETWORK"
  | "SERVICE"
  | "AGENT"
  | "CAPABILITY"
  | "NODE"
  | "RESOURCE"
  | "SYSTEM";

/* ============================================================
 * 3. SIGNAL CATEGORY
 * ============================================================
 */

export type SovereignRiskSignalCategory =
  | "AUTHENTICATION"
  | "AUTHORIZATION"
  | "TRUST"
  | "CERTIFICATE"
  | "DEVICE"
  | "SESSION"
  | "NETWORK"
  | "BEHAVIOR"
  | "SECURITY"
  | "POLICY"
  | "INTEGRITY"
  | "ANOMALY"
  | "THREAT"
  | "SYSTEM";

/* ============================================================
 * 4. SIGNAL SEVERITY
 * ============================================================
 */

export type SovereignRiskSignalSeverity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

/* ============================================================
 * 5. RECOMMENDATION
 * ============================================================
 */

export type SovereignRiskRecommendation =
  | "ALLOW"
  | "MONITOR"
  | "CHALLENGE"
  | "REAUTHENTICATE"
  | "RESTRICT"
  | "DENY"
  | "ISOLATE";

/* ============================================================
 * 6. SUBJECT
 * ============================================================
 */

export interface SovereignRiskSubject {
  id: string;

  type: SovereignRiskSubjectType;

  identityId?: string;

  sessionId?: string;

  deviceId?: string;

  serviceId?: string;

  nodeId?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. RISK SIGNAL
 * ============================================================
 */

export interface SovereignRiskSignal {
  id: string;

  category: SovereignRiskSignalCategory;

  severity: SovereignRiskSignalSeverity;

  source: string;

  description: string;

  active: boolean;

  confidence: number;

  weight?: number;

  createdAt: string;

  expiresAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 8. EVALUATION REQUEST
 * ============================================================
 */

export interface SovereignRiskEvaluationRequest {
  id?: string;

  subject: SovereignRiskSubject;

  signals: SovereignRiskSignal[];

  resourceId?: string;

  action?: string;

  sourceIp?: string;

  networkZone?: string;

  context?: Record<string, unknown>;
}

/* ============================================================
 * 9. RISK FACTOR
 * ============================================================
 */

export interface SovereignRiskFactor {
  signalId: string;

  category: SovereignRiskSignalCategory;

  severity: SovereignRiskSignalSeverity;

  contribution: number;

  confidence: number;

  description: string;
}

/* ============================================================
 * 10. RISK RESULT
 * ============================================================
 */

export interface SovereignRiskResult {
  id: string;

  requestId: string;

  subjectId: string;

  subjectType: SovereignRiskSubjectType;

  score: number;

  level: SovereignRiskLevel;

  recommendation: SovereignRiskRecommendation;

  factors: SovereignRiskFactor[];

  reasons: string[];

  evaluatedAt: string;

  recheckAfterSeconds: number;
}

/* ============================================================
 * 11. RISK PROFILE
 * ============================================================
 */

export interface SovereignRiskProfile {
  subjectId: string;

  subjectType: SovereignRiskSubjectType;

  currentScore: number;

  currentLevel: SovereignRiskLevel;

  previousScore?: number;

  previousLevel?: SovereignRiskLevel;

  highestScore: number;

  highestLevel: SovereignRiskLevel;

  evaluations: number;

  lastEvaluatedAt: string;

  updatedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 12. CONTEXT
 * ============================================================
 */

export interface SovereignRiskContext {
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
 * 13. SIGNAL PROVIDER
 * ============================================================
 */

export interface SovereignRiskSignalProvider {
  collect(
    subject: SovereignRiskSubject,
    context?: Record<string, unknown>
  ): Promise<SovereignRiskSignal[]>;
}

/* ============================================================
 * 14. RISK POLICY
 * ============================================================
 */

export interface SovereignRiskPolicy {
  adjust(input: {
    request: SovereignRiskEvaluationRequest;

    calculatedScore: number;

    calculatedLevel: SovereignRiskLevel;

    factors: SovereignRiskFactor[];
  }): Promise<{
    score?: number;

    level?: SovereignRiskLevel;

    recommendation?: SovereignRiskRecommendation;

    reasons?: string[];
  }>;
}

/* ============================================================
 * 15. STORE
 * ============================================================
 */

export interface SovereignRiskStore {
  getProfile(
    subjectId: string
  ): Promise<SovereignRiskProfile | undefined>;

  saveProfile(
    profile: SovereignRiskProfile
  ): Promise<void>;

  saveResult(
    result: SovereignRiskResult
  ): Promise<void>;

  listResults(
    subjectId: string,
    limit?: number
  ): Promise<SovereignRiskResult[]>;
}

/* ============================================================
 * 16. EVENT BUS
 * ============================================================
 */

export interface SovereignRiskEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    subjectId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 17. AUDIT
 * ============================================================
 */

export interface SovereignRiskAudit {
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
 * 18. ENGINE
 * ============================================================
 */

export class SovereignRiskEngine {
  public readonly id =
    "SOVEREIGN-RISK-31";

  public readonly version =
    "1.0.0";

  private signalProviders:
    SovereignRiskSignalProvider[] = [];

  private policy?:
    SovereignRiskPolicy;

  private store?:
    SovereignRiskStore;

  private eventBus?:
    SovereignRiskEventBus;

  private audit?:
    SovereignRiskAudit;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  addSignalProvider(
    provider: SovereignRiskSignalProvider
  ): void {
    this.signalProviders.push(
      provider
    );
  }

  setPolicy(
    policy: SovereignRiskPolicy
  ): void {
    this.policy = policy;
  }

  setStore(
    store: SovereignRiskStore
  ): void {
    this.store = store;
  }

  setEventBus(
    eventBus: SovereignRiskEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignRiskAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * EVALUATE
   * ==========================================================
   */

  async evaluate(
    request: SovereignRiskEvaluationRequest
  ): Promise<SovereignRiskResult> {
    this.validateRequest(request);

    const requestId =
      request.id ??
      this.createId(
        "RISK-REQUEST"
      );

    const collectedSignals:
      SovereignRiskSignal[] = [];

    for (
      const provider of
      this.signalProviders
    ) {
      const provided =
        await provider.collect(
          request.subject,
          request.context
        );

      collectedSignals.push(
        ...provided
      );
    }

    const signals =
      this.deduplicateSignals([
        ...request.signals,
        ...collectedSignals,
      ]);

    const activeSignals =
      signals.filter(
        (signal) =>
          signal.active &&
          !this.isExpired(
            signal.expiresAt
          )
      );

    const factors =
      activeSignals.map(
        (signal) =>
          this.signalToFactor(
            signal
          )
      );

    let score =
      this.calculateScore(
        factors
      );

    let level =
      this.levelFromScore(
        score
      );

    let recommendation =
      this.recommendationFromLevel(
        level
      );

    const reasons =
      factors
        .filter(
          (factor) =>
            factor.contribution > 0
        )
        .sort(
          (a, b) =>
            b.contribution -
            a.contribution
        )
        .slice(0, 10)
        .map(
          (factor) =>
            `${factor.category}:${factor.description}`
        );

    /* ========================================================
     * POLICY ADJUSTMENT
     * ========================================================
     */

    if (this.policy) {
      const adjustment =
        await this.policy.adjust({
          request,
          calculatedScore:
            score,
          calculatedLevel:
            level,
          factors,
        });

      if (
        adjustment.score !==
        undefined
      ) {
        score =
          this.clampScore(
            adjustment.score
          );

        level =
          this.levelFromScore(
            score
          );
      }

      if (
        adjustment.level
      ) {
        level =
          adjustment.level;
      }

      recommendation =
        adjustment.recommendation ??
        this.recommendationFromLevel(
          level
        );

      if (
        adjustment.reasons
      ) {
        reasons.push(
          ...adjustment.reasons
        );
      }
    }

    const result:
      SovereignRiskResult = {
      id:
        this.createId(
          "RISK-RESULT"
        ),

      requestId,

      subjectId:
        request.subject.id,

      subjectType:
        request.subject.type,

      score,

      level,

      recommendation,

      factors,

      reasons:
        [...new Set(reasons)],

      evaluatedAt:
        this.now(),

      recheckAfterSeconds:
        this.recheckInterval(
          level
        ),
    };

    await this.persistResult(
      request.subject,
      result
    );

    await this.publish(
      "risk.evaluated",
      request.subject.id,
      {
        requestId,

        score,

        level,

        recommendation,

        factorCount:
          factors.length,
      }
    );

    if (
      level === "HIGH" ||
      level === "CRITICAL"
    ) {
      await this.publish(
        "risk.elevated",
        request.subject.id,
        {
          requestId,

          score,

          level,

          recommendation,
        }
      );
    }

    if (
      level === "CRITICAL"
    ) {
      await this.publish(
        "risk.critical",
        request.subject.id,
        {
          requestId,

          score,

          recommendation,
        }
      );
    }

    await this.recordAudit(
      "risk.evaluate",
      request.subject.id,
      "SUCCESS",
      {
        requestId,

        score,

        level,

        recommendation,
      }
    );

    return result;
  }

  /* ==========================================================
   * EVALUATE WITH AUTHORIZED CONTEXT
   * ==========================================================
   */

  async evaluateAuthorized(
    request: SovereignRiskEvaluationRequest,
    context: SovereignRiskContext
  ): Promise<SovereignRiskResult> {
    this.requireContext(
      context
    );

    return this.evaluate(
      request
    );
  }

  /* ==========================================================
   * PROFILE
   * ==========================================================
   */

  async getProfile(
    subjectId: string,
    context: SovereignRiskContext
  ): Promise<SovereignRiskProfile | undefined> {
    this.requireContext(
      context
    );

    return this.requireStore()
      .getProfile(
        subjectId
      );
  }

  /* ==========================================================
   * HISTORY
   * ==========================================================
   */

  async getHistory(
    subjectId: string,
    context: SovereignRiskContext,
    limit = 50
  ): Promise<SovereignRiskResult[]> {
    this.requireContext(
      context
    );

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 500
    ) {
      throw new Error(
        "Risk history limit must be between 1 and 500."
      );
    }

    return this.requireStore()
      .listResults(
        subjectId,
        limit
      );
  }

  /* ==========================================================
   * SIGNAL TO FACTOR
   * ==========================================================
   */

  private signalToFactor(
    signal: SovereignRiskSignal
  ): SovereignRiskFactor {
    const base =
      this.severityWeight(
        signal.severity
      );

    const confidence =
      this.clamp(
        signal.confidence,
        0,
        100
      );

    const customWeight =
      signal.weight ===
      undefined
        ? 1
        : this.clamp(
            signal.weight,
            0,
            2
          );

    const contribution =
      Math.round(
        base *
        (confidence / 100) *
        customWeight
      );

    return {
      signalId:
        signal.id,

      category:
        signal.category,

      severity:
        signal.severity,

      contribution,

      confidence,

      description:
        signal.description,
    };
  }

  /* ==========================================================
   * CALCULATE SCORE
   * ==========================================================
   */

  private calculateScore(
    factors: SovereignRiskFactor[]
  ): number {
    if (
      factors.length === 0
    ) {
      return 0;
    }

    /*
     * Risk accumulation intentionally gives
     * strong signals priority while keeping
     * the final score within 0..100.
     */

    const sorted =
      [...factors]
        .sort(
          (a, b) =>
            b.contribution -
            a.contribution
        );

    let score = 0;

    for (
      let index = 0;
      index < sorted.length;
      index += 1
    ) {
      const factor =
        sorted[index];

      const decay =
        Math.max(
          0.2,
          1 - index * 0.08
        );

      score +=
        factor.contribution *
        decay;
    }

    return this.clampScore(
      Math.round(score)
    );
  }

  /* ==========================================================
   * SEVERITY WEIGHT
   * ==========================================================
   */

  private severityWeight(
    severity: SovereignRiskSignalSeverity
  ): number {
    switch (severity) {
      case "INFO":
        return 0;

      case "LOW":
        return 10;

      case "MEDIUM":
        return 25;

      case "HIGH":
        return 50;

      case "CRITICAL":
        return 100;
    }
  }

  /* ==========================================================
   * LEVEL
   * ==========================================================
   */

  private levelFromScore(
    score: number
  ): SovereignRiskLevel {
    if (score >= 85) {
      return "CRITICAL";
    }

    if (score >= 65) {
      return "HIGH";
    }

    if (score >= 40) {
      return "MEDIUM";
    }

    if (score >= 15) {
      return "LOW";
    }

    return "MINIMAL";
  }

  /* ==========================================================
   * RECOMMENDATION
   * ==========================================================
   */

  private recommendationFromLevel(
    level: SovereignRiskLevel
  ): SovereignRiskRecommendation {
    switch (level) {
      case "MINIMAL":
        return "ALLOW";

      case "LOW":
        return "MONITOR";

      case "MEDIUM":
        return "CHALLENGE";

      case "HIGH":
        return "RESTRICT";

      case "CRITICAL":
        return "DENY";
    }
  }

  /* ==========================================================
   * RECHECK
   * ==========================================================
   */

  private recheckInterval(
    level: SovereignRiskLevel
  ): number {
    switch (level) {
      case "MINIMAL":
        return 300;

      case "LOW":
        return 180;

      case "MEDIUM":
        return 60;

      case "HIGH":
        return 15;

      case "CRITICAL":
        return 0;
    }
  }

  /* ==========================================================
   * PERSISTENCE
   * ==========================================================
   */

  private async persistResult(
    subject: SovereignRiskSubject,
    result: SovereignRiskResult
  ): Promise<void> {
    if (!this.store) {
      return;
    }

    await this.store.saveResult(
      result
    );

    const previous =
      await this.store.getProfile(
        subject.id
      );

    const profile:
      SovereignRiskProfile =
      previous
        ? {
            ...previous,

            previousScore:
              previous.currentScore,

            previousLevel:
              previous.currentLevel,

            currentScore:
              result.score,

            currentLevel:
              result.level,

            highestScore:
              Math.max(
                previous.highestScore,
                result.score
              ),

            highestLevel:
              this.higherLevel(
                previous.highestLevel,
                result.level
              ),

            evaluations:
              previous.evaluations +
              1,

            lastEvaluatedAt:
              result.evaluatedAt,

            updatedAt:
              this.now(),
          }
        : {
            subjectId:
              subject.id,

            subjectType:
              subject.type,

            currentScore:
              result.score,

            currentLevel:
              result.level,

            highestScore:
              result.score,

            highestLevel:
              result.level,

            evaluations:
              1,

            lastEvaluatedAt:
              result.evaluatedAt,

            upda

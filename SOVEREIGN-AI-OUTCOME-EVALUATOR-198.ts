// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-OUTCOME-EVALUATOR-198.ts
// Sovereign Autonomous AI Outcome Evaluator
// ============================================================

export type SovereignOutcomeVerdict =
  | "ACCEPT"
  | "IMPROVE"
  | "RETRY"
  | "REPAIR"
  | "REJECT";

export type SovereignOutcomeSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignOutcomeCriterion {
  id: string;

  description: string;

  required: boolean;

  weight: number;

  minimumScore: number;
}

export interface SovereignOutcomeInput {
  id: string;

  executionId: string;

  taskId: string;

  goalId: string;

  objective: string;

  result: unknown;

  criteria: SovereignOutcomeCriterion[];

  expectedOutcomes: string[];

  autonomous: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignCriterionResult {
  criterionId: string;

  passed: boolean;

  score: number;

  confidence: number;

  explanation?: string;
}

export interface SovereignOutcomeIssue {
  id: string;

  severity: SovereignOutcomeSeverity;

  message: string;

  repairable: boolean;

  criterionId?: string;
}

export interface SovereignOutcomeEvaluation {
  id: string;

  inputId: string;

  executionId: string;

  taskId: string;

  goalId: string;

  score: number;

  confidence: number;

  verdict: SovereignOutcomeVerdict;

  criteria: SovereignCriterionResult[];

  issues: SovereignOutcomeIssue[];

  requiredCriteriaPassed: boolean;

  expectedOutcomeSatisfied: boolean;

  accepted: boolean;

  evaluatedAt: number;
}

export interface SovereignOutcomeEvaluatorAdapter {
  evaluateCriterion(
    input: SovereignOutcomeInput,
    criterion: SovereignOutcomeCriterion
  ): Promise<{
    passed: boolean;

    score: number;

    confidence: number;

    explanation?: string;
  }>;

  evaluateExpectedOutcomes?(
    input: SovereignOutcomeInput
  ): Promise<{
    satisfied: boolean;

    confidence: number;

    missing?: string[];
  }>;

  detectIssues?(
    input: SovereignOutcomeInput,
    criteria: SovereignCriterionResult[]
  ): Promise<SovereignOutcomeIssue[]>;

  persistEvaluation?(
    evaluation: SovereignOutcomeEvaluation
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    evaluationId?: string;

    taskId?: string;

    goalId?: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIOutcomeEvaluator {
  constructor(
    private readonly adapter:
      SovereignOutcomeEvaluatorAdapter
  ) {}

  public async evaluate(
    input: SovereignOutcomeInput
  ): Promise<SovereignOutcomeEvaluation> {
    this.validateInput(input);

    const criteriaResults:
      SovereignCriterionResult[] = [];

    for (const criterion of input.criteria) {
      const result =
        await this.adapter.evaluateCriterion(
          input,
          criterion
        );

      criteriaResults.push({
        criterionId:
          criterion.id,

        passed:
          result.passed,

        score:
          this.normalize(
            result.score
          ),

        confidence:
          this.normalize(
            result.confidence
          ),

        explanation:
          result.explanation
      });
    }

    const requiredCriteriaPassed =
      input.criteria
        .filter(
          criterion =>
            criterion.required
        )
        .every(
          criterion => {
            const result =
              criteriaResults.find(
                item =>
                  item.criterionId ===
                  criterion.id
              );

            return (
              !!result &&
              result.passed &&
              result.score >=
                criterion.minimumScore
            );
          }
        );

    const weighted =
      this.calculateWeightedScore(
        input.criteria,
        criteriaResults
      );

    let expectedOutcomeSatisfied =
      true;

    let expectedConfidence =
      1;

    const issues:
      SovereignOutcomeIssue[] = [];

    if (
      this.adapter
        .evaluateExpectedOutcomes
    ) {
      const expected =
        await this.adapter
          .evaluateExpectedOutcomes(
            input
          );

      expectedOutcomeSatisfied =
        expected.satisfied;

      expectedConfidence =
        this.normalize(
          expected.confidence
        );

      for (
        const missing of
          expected.missing || []
      ) {
        issues.push({
          id: this.createId(
            "outcome-issue"
          ),

          severity:
            "HIGH",

          message:
            `Expected outcome missing: ${missing}`,

          repairable:
            true
        });
      }
    }

    if (
      this.adapter.detectIssues
    ) {
      const detected =
        await this.adapter
          .detectIssues(
            input,
            criteriaResults
          );

      for (const issue of detected) {
        issues.push({
          ...issue,

          id:
            issue.id ||
            this.createId(
              "outcome-issue"
            )
        });
      }
    }

    for (
      const criterion of
        input.criteria
    ) {
      const result =
        criteriaResults.find(
          item =>
            item.criterionId ===
            criterion.id
        );

      if (
        criterion.required &&
        (
          !result ||
          !result.passed ||
          result.score <
            criterion.minimumScore
        )
      ) {
        issues.push({
          id: this.createId(
            "outcome-issue"
          ),

          severity:
            "HIGH",

          message:
            `Required criterion failed: ${criterion.description}`,

          repairable:
            true,

          criterionId:
            criterion.id
        });
      }
    }

    const confidence =
      this.calculateConfidence(
        criteriaResults,
        expectedConfidence
      );

    const verdict =
      this.resolveVerdict(
        weighted,
        requiredCriteriaPassed,
        expectedOutcomeSatisfied,
        issues
      );

    const accepted =
      verdict === "ACCEPT";

    const evaluation:
      SovereignOutcomeEvaluation = {
        id: this.createId(
          "outcome-evaluation"
        ),

        inputId:
          input.id,

        executionId:
          input.executionId,

        taskId:
          input.taskId,

        goalId:
          input.goalId,

        score:
          weighted,

        confidence,

        verdict,

        criteria:
          criteriaResults,

        issues,

        requiredCriteriaPassed,

        expectedOutcomeSatisfied,

        accepted,

        evaluatedAt:
          Date.now()
      };

    if (
      this.adapter
        .persistEvaluation
    ) {
      await this.adapter
        .persistEvaluation(
          evaluation
        );
    }

    await this.record(
      accepted
        ? "AI_OUTCOME_ACCEPTED"
        : "AI_OUTCOME_REJECTED",
      evaluation,
      {
        score:
          evaluation.score,

        confidence:
          evaluation.confidence,

        verdict:
          evaluation.verdict,

        issues:
          evaluation.issues.length
      }
    );

    return this.cloneEvaluation(
      evaluation
    );
  }

  public canCompleteGoal(
    evaluation:
      SovereignOutcomeEvaluation
  ): boolean {
    return (
      evaluation.accepted &&
      evaluation.requiredCriteriaPassed &&
      evaluation.expectedOutcomeSatisfied &&
      evaluation.confidence >= 0.5
    );
  }

  public requiresRepair(
    evaluation:
      SovereignOutcomeEvaluation
  ): boolean {
    return (
      evaluation.verdict ===
        "REPAIR" ||
      evaluation.issues.some(
        issue =>
          issue.repairable &&
          (
            issue.severity ===
              "HIGH" ||
            issue.severity ===
              "CRITICAL"
          )
      )
    );
  }

  public requiresRetry(
    evaluation:
      SovereignOutcomeEvaluation
  ): boolean {
    return (
      evaluation.verdict ===
      "RETRY"
    );
  }

  private calculateWeightedScore(
    criteria:
      SovereignOutcomeCriterion[],
    results:
      SovereignCriterionResult[]
  ): number {
    if (!criteria.length) {
      return 1;
    }

    let totalWeight = 0;

    let totalScore = 0;

    for (const criterion of criteria) {
      const weight =
        this.positive(
          criterion.weight,
          1
        );

      const result =
        results.find(
          item =>
            item.criterionId ===
            criterion.id
        );

      totalWeight +=
        weight;

      totalScore +=
        (
          result?.score || 0
        ) *
        weight;
    }

    if (totalWeight <= 0) {
      return 0;
    }

    return this.normalize(
      totalScore /
      totalWeight
    );
  }

  private calculateConfidence(
    results:
      SovereignCriterionResult[],
    expectedConfidence: number
  ): number {
    if (!results.length) {
      return this.normalize(
        expectedConfidence
      );
    }

    const average =
      results.reduce(
        (total, result) =>
          total +
          result.confidence,
        0
      ) /
      results.length;

    return this.normalize(
      (
        average +
        expectedConfidence
      ) /
      2
    );
  }

  private resolveVerdict(
    score: number,
    requiredPassed: boolean,
    expectedSatisfied: boolean,
    issues: SovereignOutcomeIssue[]
  ): SovereignOutcomeVerdict {
    const critical =
      issues.some(
        issue =>
          issue.severity ===
          "CRITICAL"
      );

    if (critical) {
      const repairable =
        issues.some(
          issue =>
            issue.severity ===
              "CRITICAL" &&
            issue.repairable
        );

      return repairable
        ? "REPAIR"
        : "REJECT";
    }

    if (
      !requiredPassed ||
      !expectedSatisfied
    ) {
      const repairable =
        issues.some(
          issue =>
            issue.repairable
        );

      return repairable
        ? "REPAIR"
        : "RETRY";
    }

    if (score >= 0.90) {
      return "ACCEPT";
    }

    if (score >= 0.75) {
      return "IMPROVE";
    }

    if (score >= 0.50) {
      return "RETRY";
    }

    return "REJECT";
  }

  private validateInput(
    input: SovereignOutcomeInput
  ): void {
    if (!input.id.trim()) {
      throw new Error(
        "Outcome input id is required."
      );
    }

    if (
      !input.executionId.trim()
    ) {
      throw new Error(
        "Outcome executionId is required."
      );
    }

    if (!input.taskId.trim()) {
      throw new Error(
        "Outcome taskId is required."
      );
    }

    if (!input.goalId.trim()) {
      throw new Error(
        "Outcome goalId is required."
      );
    }

    if (!input.objective.trim()) {
      throw new Error(
        "Outcome objective is required."
      );
    }

    const ids =
      new Set<string>();

    for (
      const criterion of
        input.criteria
    ) {
      if (!criterion.id.trim()) {
        throw new Error(
          "Outcome criterion id is required."
        );
      }

      if (
        ids.has(
          criterion.id
        )
      ) {
        throw new Error(
          `Duplicate outcome criterion: ${criterion.id}`
        );
      }

      ids.add(
        criterion.id
      );

      if (
        criterion.minimumScore <
          0 ||
        criterion.minimumScore >
          1
      ) {
        throw new Error(
          `Invalid minimum score: ${criterion.id}`
        );
      }
    }
  }

  private normalize(
    value: number
  ): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        1,
        value
      )
    );
  }

  private positive(
    value: number,
    fallback: number
  ): number {
    return (
      Number.isFinite(value) &&
      value > 0
    )
      ? value
      : fallback;
  }

  private async record(
    type: string,
    evaluation:
      SovereignOutcomeEvaluation,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,

          evaluationId:
            evaluation.id,

          taskId:
            evaluation.taskId,

          goalId:
            evaluation.goalId,

          timestamp:
            Date.now(),

          data
        });
    }
  }

  private cloneEvaluation(
    evaluation:
      SovereignOutcomeEvaluation
  ): SovereignOutcomeEvaluation {
    return {
      ...evaluation,

      criteria:
        evaluation.criteria.map(
          criterion => ({
            ...criterion
          })
        ),

      issues:
        evaluation.issues.map(
          issue => ({
            ...issue
          })
        )
    };
  }

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

export default SovereignAIOutcomeEvaluator;

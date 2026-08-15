// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-DECISION-ENGINE-185.ts
// Sovereign Autonomous AI Decision Engine
// ============================================================

export type SovereignAIDecisionStatus =
  | "PENDING"
  | "ANALYZING"
  | "EVALUATING"
  | "DECIDED"
  | "BLOCKED"
  | "FAILED";

export type SovereignAIDecisionRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignAIDecisionPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export interface SovereignAIDecisionContext {
  id: string;

  objective: string;

  priority: SovereignAIDecisionPriority;

  autonomous: boolean;

  constraints: string[];

  facts?: Record<string, unknown>;

  memory?: unknown[];

  createdAt: number;
}

export interface SovereignAIDecisionOption {
  id: string;

  action: string;

  description: string;

  expectedValue: number;

  confidence: number;

  quality: number;

  sovereignty: number;

  reversibility: number;

  cost: number;

  risk: SovereignAIDecisionRisk;

  requiresOwnerAuthority?: boolean;

  metadata?: Record<string, unknown>;
}

export interface SovereignAIDecisionScore {
  optionId: string;

  total: number;

  expectedValue: number;

  confidence: number;

  quality: number;

  sovereignty: number;

  reversibility: number;

  costPenalty: number;

  riskPenalty: number;

  eligible: boolean;

  reasons: string[];
}

export interface SovereignAIDecision {
  id: string;

  contextId: string;

  status: SovereignAIDecisionStatus;

  selected?: SovereignAIDecisionOption;

  scores: SovereignAIDecisionScore[];

  reason: string;

  confidence: number;

  decidedAt: number;
}

export interface SovereignAIDecisionAdapter {
  generateOptions(
    context: SovereignAIDecisionContext
  ): Promise<SovereignAIDecisionOption[]>;

  verifyOption?(
    context: SovereignAIDecisionContext,
    option: SovereignAIDecisionOption
  ): Promise<boolean>;

  policyCheck?(
    context: SovereignAIDecisionContext,
    option: SovereignAIDecisionOption
  ): Promise<boolean>;

  securityCheck?(
    context: SovereignAIDecisionContext,
    option: SovereignAIDecisionOption
  ): Promise<boolean>;

  recordDecision?(
    decision: SovereignAIDecision
  ): Promise<void>;
}

export class SovereignAIDecisionEngine {
  private status: SovereignAIDecisionStatus =
    "PENDING";

  constructor(
    private readonly adapter: SovereignAIDecisionAdapter
  ) {}

  public getStatus(): SovereignAIDecisionStatus {
    return this.status;
  }

  public async decide(
    context: SovereignAIDecisionContext
  ): Promise<SovereignAIDecision> {
    try {
      this.validateContext(context);

      this.status = "ANALYZING";

      const options =
        await this.adapter.generateOptions(
          context
        );

      if (!options.length) {
        this.status = "BLOCKED";

        return await this.finish(
          context,
          [],
          undefined,
          "No valid decision options were generated."
        );
      }

      this.status = "EVALUATING";

      const scores:
        SovereignAIDecisionScore[] = [];

      for (const option of options) {
        const score =
          await this.evaluate(
            context,
            option
          );

        scores.push(score);
      }

      const eligible =
        scores
          .filter(
            score =>
              score.eligible
          )
          .sort(
            (a, b) =>
              b.total -
              a.total
          );

      if (!eligible.length) {
        this.status = "BLOCKED";

        return await this.finish(
          context,
          scores,
          undefined,
          "All decision options were rejected by sovereign controls."
        );
      }

      const winner =
        eligible[0];

      const selected =
        options.find(
          option =>
            option.id ===
            winner.optionId
        );

      if (!selected) {
        throw new Error(
          "Selected decision option could not be resolved."
        );
      }

      this.status = "DECIDED";

      return await this.finish(
        context,
        scores,
        selected,
        `Selected highest sovereign decision score: ${winner.total.toFixed(
          4
        )}`
      );
    } catch (error) {
      this.status = "FAILED";

      return await this.finish(
        context,
        [],
        undefined,
        error instanceof Error
          ? error.message
          : String(error)
      );
    }
  }

  private async evaluate(
    context: SovereignAIDecisionContext,
    option: SovereignAIDecisionOption
  ): Promise<SovereignAIDecisionScore> {
    this.validateOption(option);

    const reasons: string[] = [];

    let eligible = true;

    if (
      context.autonomous &&
      option.requiresOwnerAuthority
    ) {
      eligible = false;

      reasons.push(
        "Option requires OWNER authority and cannot be executed autonomously."
      );
    }

    if (
      option.risk === "CRITICAL"
    ) {
      eligible = false;

      reasons.push(
        "Critical-risk option blocked from autonomous execution."
      );
    }

    if (
      this.adapter.policyCheck
    ) {
      const policyValid =
        await this.adapter.policyCheck(
          context,
          option
        );

      if (!policyValid) {
        eligible = false;

        reasons.push(
          "Sovereign policy check failed."
        );
      }
    }

    if (
      this.adapter.securityCheck
    ) {
      const securityValid =
        await this.adapter.securityCheck(
          context,
          option
        );

      if (!securityValid) {
        eligible = false;

        reasons.push(
          "Security validation failed."
        );
      }
    }

    if (
      this.adapter.verifyOption
    ) {
      const verified =
        await this.adapter.verifyOption(
          context,
          option
        );

      if (!verified) {
        eligible = false;

        reasons.push(
          "Independent option verification failed."
        );
      }
    }

    const expectedValue =
      this.normalize(
        option.expectedValue
      );

    const confidence =
      this.normalize(
        option.confidence
      );

    const quality =
      this.normalize(
        option.quality
      );

    const sovereignty =
      this.normalize(
        option.sovereignty
      );

    const reversibility =
      this.normalize(
        option.reversibility
      );

    const costPenalty =
      this.normalize(
        option.cost
      );

    const riskPenalty =
      this.riskPenalty(
        option.risk
      );

    const total =
      (
        expectedValue * 0.25 +
        confidence * 0.20 +
        quality * 0.20 +
        sovereignty * 0.20 +
        reversibility * 0.15
      ) -
      (
        costPenalty * 0.10 +
        riskPenalty * 0.30
      );

    if (eligible) {
      reasons.push(
        "Option passed autonomous sovereign controls."
      );
    }

    return {
      optionId:
        option.id,

      total,

      expectedValue,

      confidence,

      quality,

      sovereignty,

      reversibility,

      costPenalty,

      riskPenalty,

      eligible,

      reasons
    };
  }

  public canExecute(
    decision: SovereignAIDecision
  ): boolean {
    return (
      decision.status === "DECIDED" &&
      !!decision.selected &&
      decision.selected.risk !==
        "CRITICAL" &&
      !decision.selected
        .requiresOwnerAuthority
    );
  }

  private validateContext(
    context: SovereignAIDecisionContext
  ): void {
    if (!context.id.trim()) {
      throw new Error(
        "Decision context id is required."
      );
    }

    if (!context.objective.trim()) {
      throw new Error(
        "Decision objective is required."
      );
    }

    if (!context.autonomous) {
      throw new Error(
        "AI decision engine requires autonomous mode."
      );
    }
  }

  private validateOption(
    option: SovereignAIDecisionOption
  ): void {
    if (!option.id.trim()) {
      throw new Error(
        "Decision option id is required."
      );
    }

    if (!option.action.trim()) {
      throw new Error(
        "Decision option action is required."
      );
    }

    const numericValues = [
      option.expectedValue,
      option.confidence,
      option.quality,
      option.sovereignty,
      option.reversibility,
      option.cost
    ];

    if (
      numericValues.some(
        value =>
          !Number.isFinite(
            value
          )
      )
    ) {
      throw new Error(
        `Invalid decision metrics: ${option.id}`
      );
    }
  }

  private normalize(
    value: number
  ): number {
    return Math.max(
      0,
      Math.min(
        1,
        value
      )
    );
  }

  private riskPenalty(
    risk: SovereignAIDecisionRisk
  ): number {
    switch (risk) {
      case "CRITICAL":
        return 1;

      case "HIGH":
        return 0.75;

      case "MEDIUM":
        return 0.4;

      case "LOW":
      default:
        return 0.1;
    }
  }

  private async finish(
    context: SovereignAIDecisionContext,
    scores: SovereignAIDecisionScore[],
    selected: SovereignAIDecisionOption | undefined,
    reason: string
  ): Promise<SovereignAIDecision> {
    const selectedScore =
      selected
        ? scores.find(
            score =>
              score.optionId ===
              selected.id
          )
        : undefined;

    const decision:
      SovereignAIDecision = {
        id: this.createId(
          "ai-decision"
        ),

        contextId:
          context.id,

        status:
          this.status,

        selected,

        scores,

        reason,

        confidence:
          selectedScore
            ? Math.max(
                0,
                Math.min(
                  1,
                  selectedScore.total
                )
              )
            : 0,

        decidedAt:
          Date.now()
      };

    if (
      this.adapter.recordDecision
    ) {
      await this.adapter
        .recordDecision(
          decision
        );
    }

    return decision;
  }

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

export default SovereignAIDecisionEngine;

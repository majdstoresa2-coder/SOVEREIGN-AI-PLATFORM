// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-DECISION-CONTEXT-203.ts
// Sovereign Autonomous AI Decision Context Engine
// ============================================================

export type SovereignContextAuthority =
  | "SUPREME"
  | "DELEGATED"
  | "SYSTEM"
  | "LEARNED";

export type SovereignContextRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignContextReadiness =
  | "READY"
  | "CONSTRAINED"
  | "INSUFFICIENT"
  | "BLOCKED"
  | "OWNER_REQUIRED";

export interface SovereignContextGoal {
  id: string;
  objective: string;
  priority: number;
  requiredCapabilities: string[];
}

export interface SovereignContextExecution {
  taskId?: string;
  executionId?: string;
  state?: string;
  attempts?: number;
  nodeId?: string;
}

export interface SovereignContextResources {
  available: boolean;
  pressure: number;
  capacityRisk: SovereignContextRisk;
}

export interface SovereignContextKnowledge {
  knowledgeId: string;
  subject: string;
  authority: SovereignContextAuthority;
  confidence: number;
  relevance: number;
}

export interface SovereignContextGuidance {
  guidanceId: string;

  decision:
    | "PROCEED"
    | "PROCEED_WITH_CONSTRAINTS"
    | "REPLAN"
    | "BLOCK"
    | "OWNER_REQUIRED";

  mandatoryInstructions: string[];
  prohibitions: string[];

  confidence: number;
}

export interface SovereignDecisionContextInput {
  id: string;

  goal: SovereignContextGoal;

  execution?: SovereignContextExecution;

  resources: SovereignContextResources;

  knowledge: SovereignContextKnowledge[];

  guidance: SovereignContextGuidance;

  operationalRisk: SovereignContextRisk;

  securityRisk: SovereignContextRisk;

  autonomous: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignDecisionContext {
  id: string;

  sourceId: string;

  goalId: string;

  objective: string;

  readiness: SovereignContextReadiness;

  authorityFloor: SovereignContextAuthority;

  confidence: number;

  riskScore: number;

  mandatoryInstructions: string[];

  prohibitions: string[];

  capabilities: string[];

  facts: Record<string, unknown>;

  ownerRequired: boolean;

  generatedAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignDecisionContextAdapter {
  enrich?(
    input: SovereignDecisionContextInput
  ): Promise<Record<string, unknown>>;

  persistContext?(
    context: SovereignDecisionContext
  ): Promise<void>;

  recordEvent?(event: {
    type: string;
    contextId?: string;
    goalId?: string;
    timestamp: number;
    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIDecisionContext {
  constructor(
    private readonly adapter:
      SovereignDecisionContextAdapter
  ) {}

  public async build(
    input: SovereignDecisionContextInput
  ): Promise<SovereignDecisionContext> {
    this.validateInput(input);

    const knowledge =
      this.normalizeKnowledge(
        input.knowledge
      );

    const authorityFloor =
      this.resolveAuthorityFloor(
        knowledge
      );

    const riskScore =
      this.calculateRiskScore(
        input
      );

    const confidence =
      this.calculateConfidence(
        knowledge,
        input.guidance.confidence
      );

    const mandatoryInstructions = [
      ...new Set(
        input.guidance
          .mandatoryInstructions
          .map(value => value.trim())
          .filter(Boolean)
      )
    ];

    const prohibitions = [
      ...new Set(
        input.guidance
          .prohibitions
          .map(value => value.trim())
          .filter(Boolean)
      )
    ];

    const capabilities = [
      ...new Set(
        input.goal
          .requiredCapabilities
          .map(value => value.trim())
          .filter(Boolean)
      )
    ];

    const ownerRequired =
      input.guidance.decision ===
        "OWNER_REQUIRED" ||
      (
        riskScore >= 0.90 &&
        authorityFloor !== "SUPREME"
      );

    const readiness =
      this.resolveReadiness(
        input,
        confidence,
        riskScore,
        ownerRequired
      );

    const enriched =
      this.adapter.enrich
        ? await this.adapter.enrich(
            input
          )
        : {};

    const context:
      SovereignDecisionContext = {
        id: this.createId(
          "decision-context"
        ),

        sourceId:
          input.id,

        goalId:
          input.goal.id,

        objective:
          input.goal.objective.trim(),

        readiness,

        authorityFloor,

        confidence,

        riskScore,

        mandatoryInstructions,

        prohibitions,

        capabilities,

        facts: {
          execution:
            input.execution
              ? {
                  ...input.execution
                }
              : undefined,

          resources: {
            ...input.resources
          },

          operationalRisk:
            input.operationalRisk,

          securityRisk:
            input.securityRisk,

          knowledge:
            knowledge.map(
              item => ({
                ...item
              })
            ),

          guidanceDecision:
            input.guidance.decision,

          ...enriched
        },

        ownerRequired,

        generatedAt:
          Date.now(),

        metadata:
          input.metadata
            ? {
                ...input.metadata
              }
            : undefined
      };

    if (
      this.adapter.persistContext
    ) {
      await this.adapter
        .persistContext(
          this.cloneContext(
            context
          )
        );
    }

    await this.record(
      "AI_DECISION_CONTEXT_BUILT",
      context,
      {
        readiness,
        confidence,
        riskScore,
        authorityFloor,
        ownerRequired
      }
    );

    return this.cloneContext(
      context
    );
  }

  public mayDecideAutonomously(
    context: SovereignDecisionContext
  ): boolean {
    if (
      context.ownerRequired
    ) {
      return false;
    }

    return (
      context.readiness ===
        "READY" ||
      context.readiness ===
        "CONSTRAINED"
    );
  }

  public mayExecute(
    context: SovereignDecisionContext
  ): boolean {
    return (
      !context.ownerRequired &&
      context.readiness ===
        "READY" &&
      context.prohibitions.length ===
        0
    );
  }

  private resolveReadiness(
    input: SovereignDecisionContextInput,
    confidence: number,
    riskScore: number,
    ownerRequired: boolean
  ): SovereignContextReadiness {
    if (ownerRequired) {
      return "OWNER_REQUIRED";
    }

    if (
      input.guidance.decision ===
        "BLOCK" ||
      input.guidance.prohibitions
        .length > 0
    ) {
      return "BLOCKED";
    }

    if (
      !input.resources.available ||
      confidence < 0.40
    ) {
      return "INSUFFICIENT";
    }

    if (
      input.guidance.decision ===
        "REPLAN" ||
      input.guidance.decision ===
        "PROCEED_WITH_CONSTRAINTS" ||
      riskScore >= 0.60
    ) {
      return "CONSTRAINED";
    }

    return "READY";
  }

  private calculateRiskScore(
    input: SovereignDecisionContextInput
  ): number {
    const operational =
      this.riskValue(
        input.operationalRisk
      );

    const security =
      this.riskValue(
        input.securityRisk
      );

    const capacity =
      this.riskValue(
        input.resources
          .capacityRisk
      );

    const pressure =
      this.normalize(
        input.resources.pressure
      );

    return this.normalize(
      operational * 0.30 +
      security * 0.35 +
      capacity * 0.20 +
      pressure * 0.15
    );
  }

  private calculateConfidence(
    knowledge: SovereignContextKnowledge[],
    guidanceConfidence: number
  ): number {
    if (!knowledge.length) {
      return this.normalize(
        guidanceConfidence * 0.7
      );
    }

    let weighted = 0;
    let weights = 0;

    for (
      const item of knowledge
    ) {
      const authority =
        this.authorityWeight(
          item.authority
        );

      const weight =
        Math.max(
          1,
          authority
        );

      weighted +=
        (
          item.confidence *
            0.6 +
          item.relevance *
            0.4
        ) *
        weight;

      weights += weight;
    }

    const knowledgeConfidence =
      weights > 0
        ? weighted / weights
        : 0;

    return this.normalize(
      knowledgeConfidence *
        0.65 +
      this.normalize(
        guidanceConfidence
      ) *
        0.35
    );
  }

  private resolveAuthorityFloor(
    knowledge:
      SovereignContextKnowledge[]
  ): SovereignContextAuthority {
    if (
      knowledge.some(
        item =>
          item.authority ===
          "SUPREME"
      )
    ) {
      return "SUPREME";
    }

    if (
      knowledge.some(
        item =>
          item.authority ===
          "DELEGATED"
      )
    ) {
      return "DELEGATED";
    }

    if (
      knowledge.some(
        item =>
          item.authority ===
          "SYSTEM"
      )
    ) {
      return "SYSTEM";
    }

    return "LEARNED";
  }

  private normalizeKnowledge(
    knowledge:
      SovereignContextKnowledge[]
  ): SovereignContextKnowledge[] {
    return knowledge
      .filter(
        item =>
          !!item.knowledgeId.trim()
      )
      .map(
        item => ({
          ...item,

          subject:
            item.subject.trim(),

          confidence:
            this.normalize(
              item.confidence
            ),

          relevance:
            this.normalize(
              item.relevance
            )
        })
      );
  }

  private riskValue(
    risk: SovereignContextRisk
  ): number {
    switch (risk) {
      case "CRITICAL":
        return 1;

      case "HIGH":
        return 0.75;

      case "MEDIUM":
        return 0.50;

      case "LOW":
      default:
        return 0.20;
    }
  }

  private authorityWeight(
    authority:
      SovereignContextAuthority
  ): number {
    switch (authority) {
      case "SUPREME":
        return 4;

      case "DELEGATED":
        return 3;

      case "SYSTEM":
        return 2;

      case "LEARNED":
      default:
        return 1;
    }
  }

  private validateInput(
    input: SovereignDecisionContextInput
  ): void {
    if (!input.id.trim()) {
      throw new Error(
        "Decision context input id is required."
      );
    }

    if (!input.goal.id.trim()) {
      throw new Error(
        "Decision context goal id is required."
      );
    }

    if (
      !input.goal.objective.trim()
    ) {
      throw new Error(
        "Decision context objective is required."
      );
    }

    if (
      !Number.isFinite(
        input.goal.priority
      )
    ) {
      throw new Error(
        "Decision context goal priority must be numeric."
      );
    }
  }

  private normalize(
    value: number
  ): number {
    if (
      !Number.isFinite(value)
    ) {
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

  private async record(
    type: string,
    context:
      SovereignDecisionContext,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,

          contextId:
            context.id,

          goalId:
            context.goalId,

          timestamp:
            Date.now(),

          data
        });
    }
  }

  private cloneContext(
    context:
      SovereignDecisionContext
  ): SovereignDecisionContext {
    return {
      ...context,

      mandatoryInstructions: [
        ...context
          .mandatoryInstructions
      ],

      prohibitions: [
        ...context.prohibitions
      ],

      capabilities: [
        ...context.capabilities
      ],

      facts: {
        ...context.facts
      },

      metadata:
        context.metadata
          ? {
              ...context.metadata
            }
          : undefined
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

export default SovereignAIDecisionContext;

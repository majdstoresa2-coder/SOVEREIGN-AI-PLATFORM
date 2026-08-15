// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-KNOWLEDGE-GUIDANCE-202.ts
// Sovereign Autonomous AI Knowledge Guidance Engine
// ============================================================

export type SovereignGuidanceAuthority =
  | "SUPREME"
  | "DELEGATED"
  | "SYSTEM"
  | "LEARNED";

export type SovereignGuidanceType =
  | "MANDATE"
  | "RECOMMENDATION"
  | "CONSTRAINT"
  | "WARNING"
  | "PROHIBITION";

export type SovereignGuidanceDecision =
  | "PROCEED"
  | "PROCEED_WITH_CONSTRAINTS"
  | "REPLAN"
  | "BLOCK"
  | "OWNER_REQUIRED";

export interface SovereignGuidanceKnowledge {
  id: string;

  subject: string;

  statement: unknown;

  authority: SovereignGuidanceAuthority;

  confidence: number;

  immutable: boolean;

  relevance: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignGuidanceContext {
  id: string;

  goalId: string;

  taskId?: string;

  objective: string;

  proposedAction?: string;

  capabilities: string[];

  knowledge: SovereignGuidanceKnowledge[];

  autonomous: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignGuidanceRule {
  id: string;

  knowledgeId: string;

  type: SovereignGuidanceType;

  authority: SovereignGuidanceAuthority;

  instruction: string;

  reason: string;

  mandatory: boolean;

  confidence: number;

  priority: number;

  createdAt: number;
}

export interface SovereignGuidanceConflict {
  id: string;

  ruleIds: string[];

  reason: string;

  supremeConflict: boolean;

  resolved: boolean;

  resolution?: string;

  createdAt: number;
}

export interface SovereignGuidanceResult {
  id: string;

  contextId: string;

  goalId: string;

  taskId?: string;

  decision: SovereignGuidanceDecision;

  rules: SovereignGuidanceRule[];

  mandates: SovereignGuidanceRule[];

  constraints: SovereignGuidanceRule[];

  warnings: SovereignGuidanceRule[];

  prohibitions: SovereignGuidanceRule[];

  conflicts: SovereignGuidanceConflict[];

  confidence: number;

  ownerRequired: boolean;

  generatedAt: number;
}

export interface SovereignKnowledgeGuidanceAdapter {
  interpret(
    context: SovereignGuidanceContext,
    knowledge: SovereignGuidanceKnowledge
  ): Promise<{
    type: SovereignGuidanceType;

    instruction: string;

    reason: string;

    mandatory?: boolean;

    confidence?: number;
  }>;

  detectConflict?(
    left: SovereignGuidanceRule,
    right: SovereignGuidanceRule
  ): Promise<{
    conflict: boolean;

    reason?: string;
  }>;

  persistGuidance?(
    result: SovereignGuidanceResult
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    guidanceId?: string;

    goalId?: string;

    taskId?: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIKnowledgeGuidance {
  constructor(
    private readonly adapter:
      SovereignKnowledgeGuidanceAdapter
  ) {}

  public async guide(
    input: SovereignGuidanceContext
  ): Promise<SovereignGuidanceResult> {
    const context =
      this.normalizeContext(input);

    this.validateContext(context);

    const rules:
      SovereignGuidanceRule[] = [];

    const orderedKnowledge =
      [...context.knowledge].sort(
        (a, b) => {
          const authority =
            this.authorityWeight(
              b.authority
            ) -
            this.authorityWeight(
              a.authority
            );

          if (authority !== 0) {
            return authority;
          }

          return (
            this.knowledgeScore(b) -
            this.knowledgeScore(a)
          );
        }
      );

    for (
      const knowledge of
        orderedKnowledge
    ) {
      if (
        !this.canUseKnowledge(
          knowledge
        )
      ) {
        continue;
      }

      const interpreted =
        await this.adapter.interpret(
          context,
          knowledge
        );

      const rule:
        SovereignGuidanceRule = {
          id: this.createId(
            "guidance-rule"
          ),

          knowledgeId:
            knowledge.id,

          type:
            interpreted.type,

          authority:
            knowledge.authority,

          instruction:
            interpreted.instruction.trim(),

          reason:
            interpreted.reason.trim(),

          mandatory:
            knowledge.authority ===
              "SUPREME" ||
            knowledge.immutable ||
            interpreted.mandatory ===
              true ||
            interpreted.type ===
              "PROHIBITION",

          confidence:
            this.normalize(
              interpreted.confidence ??
                knowledge.confidence
            ),

          priority:
            this.calculatePriority(
              knowledge,
              interpreted.type
            ),

          createdAt:
            Date.now()
        };

      if (
        !rule.instruction
      ) {
        continue;
      }

      rules.push(rule);
    }

    rules.sort(
      (a, b) =>
        b.priority -
        a.priority
    );

    const conflicts =
      await this.detectConflicts(
        rules
      );

    const decision =
      this.resolveDecision(
        rules,
        conflicts,
        context.autonomous
      );

    const mandates =
      rules.filter(
        rule =>
          rule.type ===
          "MANDATE"
      );

    const constraints =
      rules.filter(
        rule =>
          rule.type ===
          "CONSTRAINT"
      );

    const warnings =
      rules.filter(
        rule =>
          rule.type ===
          "WARNING"
      );

    const prohibitions =
      rules.filter(
        rule =>
          rule.type ===
          "PROHIBITION"
      );

    const ownerRequired =
      decision ===
        "OWNER_REQUIRED";

    const result:
      SovereignGuidanceResult = {
        id: this.createId(
          "knowledge-guidance"
        ),

        contextId:
          context.id,

        goalId:
          context.goalId,

        taskId:
          context.taskId,

        decision,

        rules,

        mandates,

        constraints,

        warnings,

        prohibitions,

        conflicts,

        confidence:
          this.calculateConfidence(
            rules
          ),

        ownerRequired,

        generatedAt:
          Date.now()
      };

    if (
      this.adapter.persistGuidance
    ) {
      await this.adapter
        .persistGuidance(
          this.cloneResult(
            result
          )
        );
    }

    await this.record(
      "AI_KNOWLEDGE_GUIDANCE_CREATED",
      result,
      {
        decision,

        rules:
          rules.length,

        conflicts:
          conflicts.length,

        ownerRequired
      }
    );

    return this.cloneResult(
      result
    );
  }

  public mayExecute(
    result: SovereignGuidanceResult
  ): boolean {
    return (
      result.decision ===
        "PROCEED" ||
      result.decision ===
        "PROCEED_WITH_CONSTRAINTS"
    );
  }

  public mandatoryInstructions(
    result: SovereignGuidanceResult
  ): string[] {
    return result.rules
      .filter(
        rule =>
          rule.mandatory
      )
      .map(
        rule =>
          rule.instruction
      );
  }

  public prohibitedInstructions(
    result: SovereignGuidanceResult
  ): string[] {
    return result.prohibitions
      .map(
        rule =>
          rule.instruction
      );
  }

  private async detectConflicts(
    rules: SovereignGuidanceRule[]
  ): Promise<SovereignGuidanceConflict[]> {
    const conflicts:
      SovereignGuidanceConflict[] = [];

    if (
      !this.adapter.detectConflict
    ) {
      return conflicts;
    }

    for (
      let i = 0;
      i < rules.length;
      i++
    ) {
      for (
        let j = i + 1;
        j < rules.length;
        j++
      ) {
        const left =
          rules[i];

        const right =
          rules[j];

        const comparison =
          await this.adapter
            .detectConflict(
              left,
              right
            );

        if (
          !comparison.conflict
        ) {
          continue;
        }

        const supremeConflict =
          left.authority ===
            "SUPREME" &&
          right.authority ===
            "SUPREME";

        conflicts.push({
          id: this.createId(
            "guidance-conflict"
          ),

          ruleIds: [
            left.id,
            right.id
          ],

          reason:
            comparison.reason ||
            "Conflicting sovereign guidance.",

          supremeConflict,

          resolved:
            false,

          createdAt:
            Date.now()
        });
      }
    }

    return conflicts;
  }

  private resolveDecision(
    rules: SovereignGuidanceRule[],
    conflicts: SovereignGuidanceConflict[],
    autonomous: boolean
  ): SovereignGuidanceDecision {
    if (
      conflicts.some(
        conflict =>
          conflict.supremeConflict &&
          !conflict.resolved
      )
    ) {
      return "OWNER_REQUIRED";
    }

    const supremeProhibition =
      rules.some(
        rule =>
          rule.type ===
            "PROHIBITION" &&
          rule.authority ===
            "SUPREME"
      );

    if (
      supremeProhibition
    ) {
      return "BLOCK";
    }

    const mandatoryConflict =
      conflicts.some(
        conflict => {
          if (
            conflict.resolved
          ) {
            return false;
          }

          return conflict.ruleIds
            .some(
              id =>
                rules.find(
                  rule =>
                    rule.id === id
                )?.mandatory
            );
        }
      );

    if (
      mandatoryConflict
    ) {
      return autonomous
        ? "REPLAN"
        : "OWNER_REQUIRED";
    }

    const prohibition =
      rules.some(
        rule =>
          rule.type ===
          "PROHIBITION"
      );

    if (prohibition) {
      return "REPLAN";
    }

    const hasConstraints =
      rules.some(
        rule =>
          rule.type ===
            "CONSTRAINT" ||
          rule.mandatory
      );

    if (hasConstraints) {
      return "PROCEED_WITH_CONSTRAINTS";
    }

    return "PROCEED";
  }

  private canUseKnowledge(
    knowledge:
      SovereignGuidanceKnowledge
  ): boolean {
    if (
      knowledge.authority ===
      "SUPREME"
    ) {
      return true;
    }

    if (
      knowledge.confidence <
      0.50
    ) {
      return false;
    }

    if (
      knowledge.relevance <
      0.30
    ) {
      return false;
    }

    return true;
  }

  private knowledgeScore(
    knowledge:
      SovereignGuidanceKnowledge
  ): number {
    return (
      this.authorityWeight(
        knowledge.authority
      ) *
        0.5 +
      knowledge.confidence *
        0.3 +
      knowledge.relevance *
        0.2
    );
  }

  private calculatePriority(
    knowledge:
      SovereignGuidanceKnowledge,
    type:
      SovereignGuidanceType
  ): number {
    let priority =
      this.authorityWeight(
        knowledge.authority
      ) *
      100;

    priority +=
      Math.round(
        knowledge.confidence *
        20
      );

    priority +=
      Math.round(
        knowledge.relevance *
        20
      );

    if (
      knowledge.immutable
    ) {
      priority += 50;
    }

    if (
      type ===
      "PROHIBITION"
    ) {
      priority += 40;
    }

    if (
      type ===
      "MANDATE"
    ) {
      priority += 30;
    }

    if (
      type ===
      "CONSTRAINT"
    ) {
      priority += 20;
    }

    return priority;
  }

  private calculateConfidence(
    rules:
      SovereignGuidanceRule[]
  ): number {
    if (!rules.length) {
      return 0;
    }

    const weighted =
      rules.reduce(
        (total, rule) =>
          total +
          rule.confidence *
            Math.max(
              1,
              rule.priority
            ),
        0
      );

    const weights =
      rules.reduce(
        (total, rule) =>
          total +
          Math.max(
            1,
            rule.priority
          ),
        0
      );

    return this.normalize(
      weighted /
      weights
    );
  }

  private authorityWeight(
    authority:
      SovereignGuidanceAuthority
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

  private normalizeContext(
    input:
      SovereignGuidanceContext
  ): SovereignGuidanceContext {
    return {
      ...input,

      objective:
        input.objective.trim(),

      proposedAction:
        input.proposedAction
          ?.trim() ||
        undefined,

      capabilities: [
        ...new Set(
          input.capabilities
            .map(
              capability =>
                capability.trim()
            )
            .filter(Boolean)
        )
      ],

      knowledge:
        input.knowledge.map(
          knowledge => ({
            ...knowledge,

            subject:
              knowledge.subject.trim(),

            confidence:
              this.normalize(
                knowledge.confidence
              ),

            relevance:
              this.normalize(
                knowledge.relevance
              ),

            metadata:
              knowledge.metadata
                ? {
                    ...knowledge.metadata
                  }
                : undefined
          })
        ),

      metadata:
        input.metadata
          ? {
              ...input.metadata
            }
          : undefined
    };
  }

  private validateContext(
    context:
      SovereignGuidanceContext
  ): void {
    if (!context.id.trim()) {
      throw new Error(
        "Guidance context id is required."
      );
    }

    if (
      !context.goalId.trim()
    ) {
      throw new Error(
        "Guidance goalId is required."
      );
    }

    if (!context.objective) {
      throw new Error(
        "Guidance objective is required."
      );
    }
  }

  private async record(
    type: string,
    result:
      SovereignGuidanceResult,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,

          guidanceId:
            result.id,

          goalId:
            result.goalId,

          taskId:
            result.taskId,

          timestamp:
            Date.now(),

          data
        });
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

  private cloneRule(
    rule:
      SovereignGuidanceRule
  ): SovereignGuidanceRule {
    return {
      ...rule
    };
  }

  private cloneResult(
    result:
      SovereignGuidanceResult
  ): SovereignGuidanceResult {
    return {
      ...result,

      rules:
        result.rules.map(
          rule =>
            this.cloneRule(
              rule
            )
        ),

      mandates:
        result.mandates.map(
          rule =>
            this.cloneRule(
              rule
            )
        ),

      constraints:
        result.constraints.map(
          rule =>
            this.cloneRule(
              rule
            )
        ),

      warnings:
        result.warnings.map(
          rule =>
            this.cloneRule(
              rule
            )
        ),

      prohibitions:
        result.prohibitions.map(
          rule =>
            this.cloneRule(
              rule
            )
        ),

      conflicts:
        result.conflicts.map(
          conflict => ({
            ...conflict,

            ruleIds: [
              ...conflict.ruleIds
            ]
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

export default SovereignAIKnowledgeGuidance;

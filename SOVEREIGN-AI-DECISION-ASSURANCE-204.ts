// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-DECISION-ASSURANCE-204.ts
// Sovereign Autonomous AI Decision Assurance Gate
// ============================================================

export type SovereignAssuranceAuthority =
  | "SUPREME"
  | "DELEGATED"
  | "SYSTEM"
  | "LEARNED";

export type SovereignAssuranceVerdict =
  | "APPROVED"
  | "APPROVED_WITH_CONSTRAINTS"
  | "REPLAN_REQUIRED"
  | "OWNER_REQUIRED"
  | "REJECTED";

export type SovereignAssuranceSeverity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignProposedDecision {
  id: string;

  goalId: string;

  contextId: string;

  action: string;

  rationale: string;

  authority:
    SovereignAssuranceAuthority;

  confidence: number;

  autonomous: boolean;

  parameters?: Record<
    string,
    unknown
  >;

  createdAt: number;
}

export interface SovereignAssuranceContext {
  id: string;

  readiness:
    | "READY"
    | "CONSTRAINED"
    | "INSUFFICIENT"
    | "BLOCKED"
    | "OWNER_REQUIRED";

  authorityFloor:
    SovereignAssuranceAuthority;

  confidence: number;

  riskScore: number;

  mandatoryInstructions: string[];

  prohibitions: string[];

  ownerRequired: boolean;

  metadata?: Record<
    string,
    unknown
  >;
}

export interface SovereignAssuranceFinding {
  id: string;

  type:
    | "AUTHORITY"
    | "MANDATE"
    | "PROHIBITION"
    | "RISK"
    | "CONFIDENCE"
    | "READINESS"
    | "POLICY"
    | "INTEGRITY";

  severity:
    SovereignAssuranceSeverity;

  message: string;

  blocking: boolean;

  repairable: boolean;

  createdAt: number;
}

export interface SovereignDecisionAssuranceResult {
  id: string;

  decisionId: string;

  contextId: string;

  goalId: string;

  verdict:
    SovereignAssuranceVerdict;

  findings:
    SovereignAssuranceFinding[];

  constraints: string[];

  confidence: number;

  executable: boolean;

  ownerRequired: boolean;

  assuredAt: number;
}

export interface SovereignDecisionAssuranceAdapter {
  satisfiesInstruction?(
    decision:
      SovereignProposedDecision,
    instruction: string
  ): Promise<boolean>;

  violatesProhibition?(
    decision:
      SovereignProposedDecision,
    prohibition: string
  ): Promise<boolean>;

  validatePolicy?(
    decision:
      SovereignProposedDecision,
    context:
      SovereignAssuranceContext
  ): Promise<{
    valid: boolean;

    severity?:
      SovereignAssuranceSeverity;

    reason?: string;

    repairable?: boolean;
  }>;

  verifyIntegrity?(
    decision:
      SovereignProposedDecision,
    context:
      SovereignAssuranceContext
  ): Promise<boolean>;

  persistAssurance?(
    result:
      SovereignDecisionAssuranceResult
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    assuranceId?: string;

    decisionId?: string;

    goalId?: string;

    timestamp: number;

    data?: Record<
      string,
      unknown
    >;
  }): Promise<void>;
}

export class SovereignAIDecisionAssurance {
  constructor(
    private readonly adapter:
      SovereignDecisionAssuranceAdapter
  ) {}

  public async assure(
    decision:
      SovereignProposedDecision,
    context:
      SovereignAssuranceContext
  ): Promise<
    SovereignDecisionAssuranceResult
  > {
    this.validateDecision(
      decision
    );

    this.validateContext(
      context
    );

    if (
      decision.contextId !==
      context.id
    ) {
      throw new Error(
        "Decision context mismatch."
      );
    }

    const findings:
      SovereignAssuranceFinding[] = [];

    const constraints =
      new Set<string>();

    this.checkReadiness(
      context,
      findings
    );

    this.checkAuthority(
      decision,
      context,
      findings
    );

    this.checkRisk(
      decision,
      context,
      findings
    );

    this.checkConfidence(
      decision,
      context,
      findings
    );

    await this.checkMandates(
      decision,
      context,
      findings,
      constraints
    );

    await this.checkProhibitions(
      decision,
      context,
      findings
    );

    await this.checkPolicy(
      decision,
      context,
      findings
    );

    await this.checkIntegrity(
      decision,
      context,
      findings
    );

    const ownerRequired =
      this.requiresOwner(
        context,
        findings
      );

    const verdict =
      this.resolveVerdict(
        findings,
        constraints,
        ownerRequired
      );

    const executable =
      verdict ===
        "APPROVED" ||
      verdict ===
        "APPROVED_WITH_CONSTRAINTS";

    const result:
      SovereignDecisionAssuranceResult = {
        id: this.createId(
          "decision-assurance"
        ),

        decisionId:
          decision.id,

        contextId:
          context.id,

        goalId:
          decision.goalId,

        verdict,

        findings,

        constraints: [
          ...constraints
        ],

        confidence:
          this.assuranceConfidence(
            decision,
            context,
            findings
          ),

        executable,

        ownerRequired,

        assuredAt:
          Date.now()
      };

    if (
      this.adapter
        .persistAssurance
    ) {
      await this.adapter
        .persistAssurance(
          this.cloneResult(
            result
          )
        );
    }

    await this.record(
      "AI_DECISION_ASSURED",
      result,
      {
        verdict,

        executable,

        ownerRequired,

        findings:
          findings.length,

        constraints:
          constraints.size
      }
    );

    return this.cloneResult(
      result
    );
  }

  public mayExecute(
    assurance:
      SovereignDecisionAssuranceResult
  ): boolean {
    return (
      assurance.executable &&
      !assurance.ownerRequired
    );
  }

  public requiresReplan(
    assurance:
      SovereignDecisionAssuranceResult
  ): boolean {
    return (
      assurance.verdict ===
        "REPLAN_REQUIRED"
    );
  }

  private checkReadiness(
    context:
      SovereignAssuranceContext,
    findings:
      SovereignAssuranceFinding[]
  ): void {
    if (
      context.readiness ===
      "OWNER_REQUIRED"
    ) {
      findings.push(
        this.finding(
          "READINESS",
          "CRITICAL",
          "Decision context requires OWNER authority.",
          true,
          false
        )
      );

      return;
    }

    if (
      context.readiness ===
      "BLOCKED"
    ) {
      findings.push(
        this.finding(
          "READINESS",
          "CRITICAL",
          "Decision context is blocked.",
          true,
          true
        )
      );

      return;
    }

    if (
      context.readiness ===
      "INSUFFICIENT"
    ) {
      findings.push(
        this.finding(
          "READINESS",
          "HIGH",
          "Decision context is insufficient.",
          true,
          true
        )
      );
    }

    if (
      context.readiness ===
      "CONSTRAINED"
    ) {
      findings.push(
        this.finding(
          "READINESS",
          "MEDIUM",
          "Decision context contains operational constraints.",
          false,
          true
        )
      );
    }
  }

  private checkAuthority(
    decision:
      SovereignProposedDecision,
    context:
      SovereignAssuranceContext,
    findings:
      SovereignAssuranceFinding[]
  ): void {
    const decisionWeight =
      this.authorityWeight(
        decision.authority
      );

    const requiredWeight =
      this.authorityWeight(
        context.authorityFloor
      );

    if (
      decisionWeight <
      requiredWeight
    ) {
      findings.push(
        this.finding(
          "AUTHORITY",
          "CRITICAL",
          "Decision authority is below the required sovereign authority.",
          true,
          false
        )
      );
    }

    if (
      context.authorityFloor ===
        "SUPREME" &&
      decision.authority !==
        "SUPREME"
    ) {
      findings.push(
        this.finding(
          "AUTHORITY",
          "CRITICAL",
          "SUPREME authority is required for this decision.",
          true,
          false
        )
      );
    }
  }

  private checkRisk(
    decision:
      SovereignProposedDecision,
    context:
      SovereignAssuranceContext,
    findings:
      SovereignAssuranceFinding[]
  ): void {
    const risk =
      this.normalize(
        context.riskScore
      );

    if (
      risk >= 0.90 &&
      decision.authority !==
        "SUPREME"
    ) {
      findings.push(
        this.finding(
          "RISK",
          "CRITICAL",
          "Critical-risk decision requires OWNER authority.",
          true,
          false
        )
      );

      return;
    }

    if (risk >= 0.75) {
      findings.push(
        this.finding(
          "RISK",
          "HIGH",
          "Decision carries high operational risk.",
          false,
          true
        )
      );
    } else if (
      risk >= 0.50
    ) {
      findings.push(
        this.finding(
          "RISK",
          "MEDIUM",
          "Decision carries elevated operational risk.",
          false,
          true
        )
      );
    }
  }

  private checkConfidence(
    decision:
      SovereignProposedDecision,
    context:
      SovereignAssuranceContext,
    findings:
      SovereignAssuranceFinding[]
  ): void {
    const confidence =
      Math.min(
        this.normalize(
          decision.confidence
        ),
        this.normalize(
          context.confidence
        )
      );

    if (
      confidence < 0.40
    ) {
      findings.push(
        this.finding(
          "CONFIDENCE",
          "HIGH",
          "Decision confidence is insufficient for execution.",
          true,
          true
        )
      );
    } else if (
      confidence < 0.65
    ) {
      findings.push(
        this.finding(
          "CONFIDENCE",
          "MEDIUM",
          "Decision confidence requires additional caution.",
          false,
          true
        )
      );
    }
  }

  private async checkMandates(
    decision:
      SovereignProposedDecision,
    context:
      SovereignAssuranceContext,
    findings:
      SovereignAssuranceFinding[],
    constraints:
      Set<string>
  ): Promise<void> {
    for (
      const instruction of
        context.mandatoryInstructions
    ) {
      constraints.add(
        instruction
      );

      if (
        !this.adapter
          .satisfiesInstruction
      ) {
        continue;
      }

      const satisfied =
        await this.adapter
          .satisfiesInstruction(
            decision,
            instruction
          );

      if (!satisfied) {
        findings.push(
          this.finding(
            "MANDATE",
            "HIGH",
            `Mandatory instruction is not satisfied: ${instruction}`,
            true,
            true
          )
        );
      }
    }
  }

  private async checkProhibitions(
    decision:
      SovereignProposedDecision,
    context:
      SovereignAssuranceContext,
    findings:
      SovereignAssuranceFinding[]
  ): Promise<void> {
    for (
      const prohibition of
        context.prohibitions
    ) {
      if (
        !this.adapter
          .violatesProhibition
      ) {
        findings.push(
          this.finding(
            "PROHIBITION",
            "HIGH",
            `Decision must respect prohibition: ${prohibition}`,
            false,
            true
          )
        );

        continue;
      }

      const violated =
        await this.adapter
          .violatesProhibition(
            decision,
            prohibition
          );

      if (violated) {
        findings.push(
          this.finding(
            "PROHIBITION",
            "CRITICAL",
            `Decision violates sovereign prohibition: ${prohibition}`,
            true,
            false
          )
        );
      }
    }
  }

  private async checkPolicy(
    decision:
      SovereignProposedDecision,
    context:
      SovereignAssuranceContext,
    findings:
      SovereignAssuranceFinding[]
  ): Promise<void> {
    if (
      !this.adapter
        .validatePolicy
    ) {
      return;
    }

    const policy =
      await this.adapter
        .validatePolicy(
          decision,
          context
        );

    if (!policy.valid) {
      findings.push(
        this.finding(
          "POLICY",
          policy.severity ||
            "HIGH",
          policy.reason ||
            "Decision failed sovereign policy validation.",
          true,
          policy.repairable ??
            true
        )
      );
    }
  }

  private async checkIntegrity(
    decision:
      SovereignProposedDecision,
    context:
      SovereignAssuranceContext,
    findings:
      SovereignAssuranceFinding[]
  ): Promise<void> {
    if (
      !this.adapter
        .verifyIntegrity
    ) {
      return;
    }

    const valid =
      await this.adapter
        .verifyIntegrity(
          decision,
          context
        );

    if (!valid) {
      findings.push(
        this.finding(
          "INTEGRITY",
          "CRITICAL",
          "Decision integrity verification failed.",
          true,
          false
        )
      );
    }
  }

  private requiresOwner(
    context:
      SovereignAssuranceContext,
    findings:
      SovereignAssuranceFinding[]
  ): boolean {
    if (
      context.ownerRequired
    ) {
      return true;
    }

    return findings.some(
      item =>
        item.blocking &&
        !item.repairable &&
        (
          item.type ===
            "AUTHORITY" ||
          (
            item.type ===
              "RISK" &&
            item.severity ===
              "CRITICAL"
          )
        )
    );
  }

  private resolveVerdict(
    findings:
      SovereignAssuranceFinding[],
    constraints:
      Set<string>,
    ownerRequired: boolean
  ): SovereignAssuranceVerdict {
    if (ownerRequired) {
      return "OWNER_REQUIRED";
    }

    const permanentBlock =
      findings.some(
        item =>
          item.blocking &&
          !item.repairable
      );

    if (permanentBlock) {
      return "REJECTED";
    }

    const repairableBlock =
      findings.some(
        item =>
          item.blocking &&
          item.repairable
      );

    if (repairableBlock) {
      return "REPLAN_REQUIRED";
    }

    if (
      constraints.size > 0 ||
      findings.some(
        item =>
          item.severity ===
            "HIGH" ||
          item.severity ===
            "MEDIUM"
      )
    ) {
      return "APPROVED_WITH_CONSTRAINTS";
    }

    return "APPROVED";
  }

  private assuranceConfidence(
    decision:
      SovereignProposedDecision,
    context:
      SovereignAssuranceContext,
    findings:
      SovereignAssuranceFinding[]
  ): number {
    const base =
      (
        this.normalize(
          decision.confidence
        ) +
        this.normalize(
          context.confidence
        )
      ) /
      2;

    const penalty =
      findings.reduce(
        (total, item) => {
          switch (
            item.severity
          ) {
            case "CRITICAL":
              return total +
                0.30;

            case "HIGH":
              return total +
                0.15;

            case "MEDIUM":
              return total +
                0.07;

            case "LOW":
              return total +
                0.03;

            default:
              return total;
          }
        },
        0
      );

    return this.normalize(
      base -
      Math.min(
        0.80,
        penalty
      )
    );
  }

  private finding(
    type:
      SovereignAssuranceFinding["type"],
    severity:
      SovereignAssuranceSeverity,
    message: string,
    blocking: boolean,
    repairable: boolean
  ): SovereignAssuranceFinding {
    return {
      id: this.createId(
        "assurance-finding"
      ),

      type,

      severity,

      message,

      blocking,

      repairable,

      createdAt:
        Date.now()
    };
  }

  private authorityWeight(
    authority:
      SovereignAssuranceAuthority
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

  private validateDecision(
    decision:
      SovereignProposedDecision
  ): void {
    if (!decision.id.trim()) {
      throw new Error(
        "Decision id is required."
      );
    }

    if (
      !decision.goalId.trim()
    ) {
      throw new Error(
        "Decision goalId is required."
      );
    }

    if (
      !decision.contextId.trim()
    ) {
      throw new Error(
        "Decision contextId is required."
      );
    }

    if (!decision.action.trim()) {
      throw new Error(
        "Decision action is required."
      );
    }
  }

  private validateContext(
    context:
      SovereignAssuranceContext
  ): void {
    if (!context.id.trim()) {
      throw new Error(
        "Assurance context id is required."
      );
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

  private async record(
    type: string,
    result:
      SovereignDecisionAssuranceResult,
    data?: Record<
      string,
      unknown
    >
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,

          assuranceId:
            result.id,

          decisionId:
            result.decisionId,

          goalId:
            result.goalId,

          timestamp:
            Date.now(),

          data
        });
    }
  }

  private cloneResult(
    result:
      SovereignDecisionAssuranceResult
  ): SovereignDecisionAssuranceResult {
    return {
      ...result,

      findings:
        result.findings.map(
          finding => ({
            ...finding
          })
        ),

      constraints: [
        ...result.constraints
      ]
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

export default SovereignAIDecisionAssurance;

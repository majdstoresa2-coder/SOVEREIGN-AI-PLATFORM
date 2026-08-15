// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-SELF-IMPROVEMENT-186.ts
// Sovereign Autonomous Self-Improvement Engine
// ============================================================

export type SovereignImprovementStatus =
  | "IDLE"
  | "ANALYZING"
  | "PROPOSING"
  | "TESTING"
  | "VERIFYING"
  | "APPROVED"
  | "REJECTED"
  | "BLOCKED"
  | "FAILED";

export type SovereignImprovementArea =
  | "REASONING"
  | "PLANNING"
  | "EXECUTION"
  | "CODE"
  | "TESTING"
  | "REPAIR"
  | "AUTOMATION"
  | "PERFORMANCE"
  | "QUALITY"
  | "RELIABILITY";

export interface SovereignPerformanceEvidence {
  id: string;
  area: SovereignImprovementArea;

  successRate: number;
  qualityScore: number;
  errorRate: number;
  latencyScore: number;

  observations: string[];

  collectedAt: number;
}

export interface SovereignImprovementProposal {
  id: string;

  area: SovereignImprovementArea;

  objective: string;
  reason: string;

  expectedGain: number;
  confidence: number;
  risk: number;

  reversible: boolean;

  changes: string[];

  protectedAuthorityChange: boolean;
  sovereigntyChange: boolean;

  createdAt: number;
}

export interface SovereignImprovementExperiment {
  id: string;
  proposalId: string;

  baselineScore: number;
  candidateScore: number;

  securityPassed: boolean;
  policyPassed: boolean;
  regressionPassed: boolean;
  qualityPassed: boolean;

  improvement: number;

  startedAt: number;
  completedAt: number;
}

export interface SovereignImprovementResult {
  id: string;

  proposal: SovereignImprovementProposal;

  status: SovereignImprovementStatus;

  experiment?: SovereignImprovementExperiment;

  adopted: boolean;

  reason: string;

  completedAt: number;
}

export interface SovereignSelfImprovementAdapter {
  analyze(
    evidence: SovereignPerformanceEvidence[]
  ): Promise<{
    weaknesses: string[];
    opportunities: string[];
  }>;

  propose(
    analysis: {
      weaknesses: string[];
      opportunities: string[];
    }
  ): Promise<SovereignImprovementProposal[]>;

  baseline(
    proposal: SovereignImprovementProposal
  ): Promise<number>;

  testCandidate(
    proposal: SovereignImprovementProposal
  ): Promise<number>;

  securityCheck(
    proposal: SovereignImprovementProposal
  ): Promise<boolean>;

  policyCheck(
    proposal: SovereignImprovementProposal
  ): Promise<boolean>;

  regressionCheck(
    proposal: SovereignImprovementProposal
  ): Promise<boolean>;

  qualityCheck(
    proposal: SovereignImprovementProposal
  ): Promise<boolean>;

  adopt(
    proposal: SovereignImprovementProposal
  ): Promise<void>;

  recordResult?(
    result: SovereignImprovementResult
  ): Promise<void>;
}

export class SovereignAISelfImprovement {
  private status: SovereignImprovementStatus =
    "IDLE";

  constructor(
    private readonly adapter: SovereignSelfImprovementAdapter
  ) {}

  public getStatus(): SovereignImprovementStatus {
    return this.status;
  }

  public async improve(
    evidence: SovereignPerformanceEvidence[]
  ): Promise<SovereignImprovementResult[]> {
    if (!evidence.length) {
      return [];
    }

    this.status = "ANALYZING";

    const analysis =
      await this.adapter.analyze(
        evidence
      );

    this.status = "PROPOSING";

    const proposals =
      await this.adapter.propose(
        analysis
      );

    const results:
      SovereignImprovementResult[] = [];

    for (const proposal of proposals) {
      results.push(
        await this.evaluate(
          proposal
        )
      );
    }

    this.status = "IDLE";

    return results;
  }

  private async evaluate(
    proposal: SovereignImprovementProposal
  ): Promise<SovereignImprovementResult> {
    try {
      this.validateProposal(
        proposal
      );

      if (
        proposal.protectedAuthorityChange ||
        proposal.sovereigntyChange
      ) {
        return await this.finish(
          proposal,
          "BLOCKED",
          false,
          "Self-improvement cannot modify sovereign authority or sovereignty rules."
        );
      }

      if (!proposal.reversible) {
        return await this.finish(
          proposal,
          "BLOCKED",
          false,
          "Autonomous self-improvement must be reversible."
        );
      }

      this.status = "TESTING";

      const baselineScore =
        this.normalize(
          await this.adapter.baseline(
            proposal
          )
        );

      const candidateScore =
        this.normalize(
          await this.adapter.testCandidate(
            proposal
          )
        );

      this.status = "VERIFYING";

      const securityPassed =
        await this.adapter.securityCheck(
          proposal
        );

      const policyPassed =
        await this.adapter.policyCheck(
          proposal
        );

      const regressionPassed =
        await this.adapter.regressionCheck(
          proposal
        );

      const qualityPassed =
        await this.adapter.qualityCheck(
          proposal
        );

      const improvement =
        candidateScore -
        baselineScore;

      const experiment:
        SovereignImprovementExperiment = {
          id: this.createId(
            "improvement-experiment"
          ),

          proposalId:
            proposal.id,

          baselineScore,

          candidateScore,

          securityPassed,

          policyPassed,

          regressionPassed,

          qualityPassed,

          improvement,

          startedAt:
            proposal.createdAt,

          completedAt:
            Date.now()
        };

      const valid =
        securityPassed &&
        policyPassed &&
        regressionPassed &&
        qualityPassed;

      if (!valid) {
        return await this.finish(
          proposal,
          "REJECTED",
          false,
          "Candidate failed sovereign verification.",
          experiment
        );
      }

      if (improvement <= 0) {
        return await this.finish(
          proposal,
          "REJECTED",
          false,
          "Candidate did not improve the baseline.",
          experiment
        );
      }

      if (
        proposal.risk >
        proposal.expectedGain
      ) {
        return await this.finish(
          proposal,
          "REJECTED",
          false,
          "Improvement risk exceeds expected gain.",
          experiment
        );
      }

      await this.adapter.adopt(
        proposal
      );

      return await this.finish(
        proposal,
        "APPROVED",
        true,
        "Improvement passed testing and sovereign verification.",
        experiment
      );
    } catch (error) {
      return await this.finish(
        proposal,
        "FAILED",
        false,
        error instanceof Error
          ? error.message
          : String(error)
      );
    }
  }

  private validateProposal(
    proposal: SovereignImprovementProposal
  ): void {
    if (!proposal.id.trim()) {
      throw new Error(
        "Improvement proposal id is required."
      );
    }

    if (!proposal.objective.trim()) {
      throw new Error(
        "Improvement objective is required."
      );
    }

    if (!proposal.changes.length) {
      throw new Error(
        "Improvement proposal requires changes."
      );
    }

    proposal.expectedGain =
      this.normalize(
        proposal.expectedGain
      );

    proposal.confidence =
      this.normalize(
        proposal.confidence
      );

    proposal.risk =
      this.normalize(
        proposal.risk
      );
  }

  private async finish(
    proposal: SovereignImprovementProposal,
    status: SovereignImprovementStatus,
    adopted: boolean,
    reason: string,
    experiment?: SovereignImprovementExperiment
  ): Promise<SovereignImprovementResult> {
    this.status = status;

    const result:
      SovereignImprovementResult = {
        id: this.createId(
          "improvement-result"
        ),

        proposal,

        status,

        experiment,

        adopted,

        reason,

        completedAt:
          Date.now()
      };

    if (
      this.adapter.recordResult
    ) {
      await this.adapter.recordResult(
        result
      );
    }

    return result;
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

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

export default SovereignAISelfImprovement;

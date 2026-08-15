// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-GOVERNANCE-GUARD-188.ts
// Sovereign Autonomous AI Governance Guard
// ============================================================

export type SovereignGovernanceActor =
  | "OWNER"
  | "STEWARD"
  | "CORE"
  | "AI"
  | "AGENT"
  | "WORKER"
  | "SYSTEM";

export type SovereignGovernanceAction =
  | "READ"
  | "CREATE"
  | "UPDATE"
  | "EXECUTE"
  | "TEST"
  | "BUILD"
  | "DEPLOY"
  | "AUTOMATE"
  | "REPAIR"
  | "IMPROVE"
  | "CONFIGURE"
  | "AUTHORIZE";

export type SovereignGovernanceRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignGovernanceDecision =
  | "ALLOW"
  | "DENY"
  | "OWNER_REQUIRED"
  | "BLOCKED";

export interface SovereignGovernanceRequest {
  id: string;

  actor: SovereignGovernanceActor;

  action: SovereignGovernanceAction;

  resource: string;

  autonomous: boolean;

  risk: SovereignGovernanceRisk;

  changesAuthority?: boolean;

  changesSovereignty?: boolean;

  changesProtectedPolicy?: boolean;

  destructive?: boolean;

  metadata?: Record<string, unknown>;

  createdAt: number;
}

export interface SovereignGovernanceCheck {
  name: string;

  passed: boolean;

  reason: string;
}

export interface SovereignGovernanceResult {
  id: string;

  requestId: string;

  decision: SovereignGovernanceDecision;

  checks: SovereignGovernanceCheck[];

  reason: string;

  evaluatedAt: number;
}

export interface SovereignGovernanceAdapter {
  authorityCheck(
    request: SovereignGovernanceRequest
  ): Promise<boolean>;

  policyCheck(
    request: SovereignGovernanceRequest
  ): Promise<boolean>;

  securityCheck(
    request: SovereignGovernanceRequest
  ): Promise<boolean>;

  integrityCheck(
    request: SovereignGovernanceRequest
  ): Promise<boolean>;

  sovereigntyCheck(
    request: SovereignGovernanceRequest
  ): Promise<boolean>;

  recordDecision?(
    result: SovereignGovernanceResult
  ): Promise<void>;

  recordViolation?(event: {
    request: SovereignGovernanceRequest;
    result: SovereignGovernanceResult;
    timestamp: number;
  }): Promise<void>;
}

export class SovereignAIGovernanceGuard {
  constructor(
    private readonly adapter:
      SovereignGovernanceAdapter
  ) {}

  public async evaluate(
    request: SovereignGovernanceRequest
  ): Promise<SovereignGovernanceResult> {
    this.validateRequest(request);

    const checks:
      SovereignGovernanceCheck[] = [];

    if (
      request.changesAuthority ||
      request.changesSovereignty ||
      request.changesProtectedPolicy
    ) {
      const result =
        await this.finish(
          request,
          "OWNER_REQUIRED",
          checks,
          "Protected sovereign authority or policy requires OWNER authority."
        );

      await this.violation(
        request,
        result
      );

      return result;
    }

    if (
      request.destructive &&
      request.autonomous
    ) {
      const result =
        await this.finish(
          request,
          "DENY",
          checks,
          "Autonomous destructive operation is prohibited."
        );

      await this.violation(
        request,
        result
      );

      return result;
    }

    if (
      request.risk === "CRITICAL" &&
      request.autonomous
    ) {
      const result =
        await this.finish(
          request,
          "OWNER_REQUIRED",
          checks,
          "Critical-risk autonomous action requires OWNER authority."
        );

      await this.violation(
        request,
        result
      );

      return result;
    }

    const authority =
      await this.runCheck(
        "AUTHORITY",
        () =>
          this.adapter.authorityCheck(
            request
          ),
        "Actor authority validated.",
        "Actor authority rejected."
      );

    checks.push(authority);

    const policy =
      await this.runCheck(
        "POLICY",
        () =>
          this.adapter.policyCheck(
            request
          ),
        "Sovereign policy validated.",
        "Sovereign policy rejected."
      );

    checks.push(policy);

    const security =
      await this.runCheck(
        "SECURITY",
        () =>
          this.adapter.securityCheck(
            request
          ),
        "Security controls validated.",
        "Security controls rejected."
      );

    checks.push(security);

    const integrity =
      await this.runCheck(
        "INTEGRITY",
        () =>
          this.adapter.integrityCheck(
            request
          ),
        "Integrity validated.",
        "Integrity validation failed."
      );

    checks.push(integrity);

    const sovereignty =
      await this.runCheck(
        "SOVEREIGNTY",
        () =>
          this.adapter.sovereigntyCheck(
            request
          ),
        "Sovereignty boundary validated.",
        "Sovereignty boundary rejected."
      );

    checks.push(sovereignty);

    const failed =
      checks.filter(
        check => !check.passed
      );

    if (failed.length) {
      const result =
        await this.finish(
          request,
          "DENY",
          checks,
          failed
            .map(
              check =>
                `${check.name}: ${check.reason}`
            )
            .join(" | ")
        );

      await this.violation(
        request,
        result
      );

      return result;
    }

    return await this.finish(
      request,
      "ALLOW",
      checks,
      "Action passed all sovereign governance controls."
    );
  }

  public canExecute(
    result: SovereignGovernanceResult
  ): boolean {
    return (
      result.decision === "ALLOW" &&
      result.checks.every(
        check => check.passed
      )
    );
  }

  private async runCheck(
    name: string,
    check: () => Promise<boolean>,
    successReason: string,
    failureReason: string
  ): Promise<SovereignGovernanceCheck> {
    try {
      const passed =
        await check();

      return {
        name,
        passed,
        reason:
          passed
            ? successReason
            : failureReason
      };
    } catch (error) {
      return {
        name,
        passed: false,
        reason:
          error instanceof Error
            ? error.message
            : String(error)
      };
    }
  }

  private validateRequest(
    request: SovereignGovernanceRequest
  ): void {
    if (!request.id.trim()) {
      throw new Error(
        "Governance request id is required."
      );
    }

    if (!request.resource.trim()) {
      throw new Error(
        "Governance resource is required."
      );
    }

    if (
      request.actor === "OWNER" &&
      request.autonomous
    ) {
      throw new Error(
        "OWNER actions cannot be impersonated by autonomous execution."
      );
    }
  }

  private async finish(
    request: SovereignGovernanceRequest,
    decision: SovereignGovernanceDecision,
    checks: SovereignGovernanceCheck[],
    reason: string
  ): Promise<SovereignGovernanceResult> {
    const result:
      SovereignGovernanceResult = {
        id: this.createId(
          "governance-result"
        ),

        requestId:
          request.id,

        decision,

        checks,

        reason,

        evaluatedAt:
          Date.now()
      };

    if (
      this.adapter.recordDecision
    ) {
      await this.adapter
        .recordDecision(
          result
        );
    }

    return result;
  }

  private async violation(
    request: SovereignGovernanceRequest,
    result: SovereignGovernanceResult
  ): Promise<void> {
    if (
      this.adapter.recordViolation
    ) {
      await this.adapter
        .recordViolation({
          request,
          result,
          timestamp:
            Date.now()
        });
    }
  }

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

export default SovereignAIGovernanceGuard;

// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-EXECUTION-AUTHORIZATION-205.ts
// Sovereign Autonomous AI Execution Authorization Engine
// ============================================================

export type SovereignExecutionAuthority =
  | "SUPREME"
  | "DELEGATED"
  | "SYSTEM"
  | "LEARNED";

export type SovereignExecutionAuthorizationStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "DENIED"
  | "EXPIRED"
  | "REVOKED"
  | "CONSUMED";

export interface SovereignExecutionAuthorizationRequest {
  id: string;

  decisionId: string;
  assuranceId: string;

  goalId: string;
  taskId: string;

  capability: string;
  action: string;

  authority: SovereignExecutionAuthority;

  autonomous: boolean;

  assuranceVerdict:
    | "APPROVED"
    | "APPROVED_WITH_CONSTRAINTS"
    | "REPLAN_REQUIRED"
    | "OWNER_REQUIRED"
    | "REJECTED";

  assuranceExecutable: boolean;

  ownerRequired: boolean;

  constraints: string[];

  requestedTtlMs?: number;

  reusable?: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignExecutionPermit {
  id: string;

  requestId: string;

  decisionId: string;
  assuranceId: string;

  goalId: string;
  taskId: string;

  capability: string;
  action: string;

  authority: SovereignExecutionAuthority;

  status: SovereignExecutionAuthorizationStatus;

  constraints: string[];

  autonomous: boolean;

  reusable: boolean;

  issuedAt: number;
  expiresAt: number;

  consumedAt?: number;
  revokedAt?: number;

  reason: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignExecutionAuthorizationCheck {
  permitId: string;

  taskId: string;

  capability: string;

  action: string;

  allowed: boolean;

  reason: string;

  checkedAt: number;
}

export interface SovereignExecutionAuthorizationAdapter {
  authorityCheck?(
    request: SovereignExecutionAuthorizationRequest
  ): Promise<boolean>;

  policyCheck?(
    request: SovereignExecutionAuthorizationRequest
  ): Promise<boolean>;

  securityCheck?(
    request: SovereignExecutionAuthorizationRequest
  ): Promise<boolean>;

  persistPermit?(
    permit: SovereignExecutionPermit
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    permitId?: string;
    requestId?: string;
    taskId?: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIExecutionAuthorization {
  private readonly permits =
    new Map<string, SovereignExecutionPermit>();

  constructor(
    private readonly adapter:
      SovereignExecutionAuthorizationAdapter,
    private readonly defaultTtlMs = 5 * 60 * 1000,
    private readonly maximumTtlMs = 60 * 60 * 1000
  ) {}

  public async authorize(
    input: SovereignExecutionAuthorizationRequest
  ): Promise<SovereignExecutionPermit> {
    const request =
      this.normalizeRequest(input);

    this.validateRequest(request);

    if (
      request.assuranceVerdict !== "APPROVED" &&
      request.assuranceVerdict !==
        "APPROVED_WITH_CONSTRAINTS"
    ) {
      return await this.deny(
        request,
        "Decision assurance did not approve execution."
      );
    }

    if (!request.assuranceExecutable) {
      return await this.deny(
        request,
        "Decision assurance marked execution as non-executable."
      );
    }

    if (request.ownerRequired) {
      return await this.deny(
        request,
        "Execution requires OWNER authority."
      );
    }

    if (
      request.autonomous &&
      request.authority === "SUPREME"
    ) {
      return await this.deny(
        request,
        "Autonomous execution cannot impersonate SUPREME authority."
      );
    }

    if (
      this.adapter.authorityCheck
    ) {
      const valid =
        await this.adapter.authorityCheck(
          request
        );

      if (!valid) {
        return await this.deny(
          request,
          "Execution authority check failed."
        );
      }
    }

    if (
      this.adapter.policyCheck
    ) {
      const valid =
        await this.adapter.policyCheck(
          request
        );

      if (!valid) {
        return await this.deny(
          request,
          "Execution policy check failed."
        );
      }
    }

    if (
      this.adapter.securityCheck
    ) {
      const valid =
        await this.adapter.securityCheck(
          request
        );

      if (!valid) {
        return await this.deny(
          request,
          "Execution security check failed."
        );
      }
    }

    const now = Date.now();

    const ttl =
      this.resolveTtl(
        request.requestedTtlMs
      );

    const permit:
      SovereignExecutionPermit = {
        id: this.createId(
          "execution-permit"
        ),

        requestId:
          request.id,

        decisionId:
          request.decisionId,

        assuranceId:
          request.assuranceId,

        goalId:
          request.goalId,

        taskId:
          request.taskId,

        capability:
          request.capability,

        action:
          request.action,

        authority:
          request.authority,

        status:
          "AUTHORIZED",

        constraints: [
          ...request.constraints
        ],

        autonomous:
          request.autonomous,

        reusable:
          request.reusable === true,

        issuedAt:
          now,

        expiresAt:
          now + ttl,

        reason:
          "Execution authorized by sovereign assurance controls.",

        metadata:
          request.metadata
            ? {
                ...request.metadata
              }
            : undefined
      };

    this.permits.set(
      permit.id,
      permit
    );

    await this.persist(
      permit
    );

    await this.record(
      "AI_EXECUTION_AUTHORIZED",
      permit,
      {
        capability:
          permit.capability,

        action:
          permit.action,

        expiresAt:
          permit.expiresAt,

        reusable:
          permit.reusable
      }
    );

    return this.clonePermit(
      permit
    );
  }

  public async check(
    permitId: string,
    taskId: string,
    capability: string,
    action: string
  ): Promise<SovereignExecutionAuthorizationCheck> {
    const permit =
      this.getMutable(
        permitId
      );

    this.refreshStatus(
      permit
    );

    if (
      permit.status !==
      "AUTHORIZED"
    ) {
      return {
        permitId,

        taskId,

        capability,

        action,

        allowed: false,

        reason:
          `Execution permit is ${permit.status}.`,

        checkedAt:
          Date.now()
      };
    }

    if (
      permit.taskId !==
      taskId
    ) {
      return {
        permitId,

        taskId,

        capability,

        action,

        allowed: false,

        reason:
          "Execution permit does not match task.",

        checkedAt:
          Date.now()
      };
    }

    if (
      permit.capability !==
      capability
    ) {
      return {
        permitId,

        taskId,

        capability,

        action,

        allowed: false,

        reason:
          "Execution permit does not match capability.",

        checkedAt:
          Date.now()
      };
    }

    if (
      permit.action !==
      action
    ) {
      return {
        permitId,

        taskId,

        capability,

        action,

        allowed: false,

        reason:
          "Execution permit does not match action.",

        checkedAt:
          Date.now()
      };
    }

    return {
      permitId,

      taskId,

      capability,

      action,

      allowed: true,

      reason:
        "Execution permit is valid.",

      checkedAt:
        Date.now()
    };
  }

  public async consume(
    permitId: string
  ): Promise<SovereignExecutionPermit> {
    const permit =
      this.getMutable(
        permitId
      );

    this.refreshStatus(
      permit
    );

    if (
      permit.status !==
      "AUTHORIZED"
    ) {
      throw new Error(
        `Cannot consume execution permit in state ${permit.status}.`
      );
    }

    if (!permit.reusable) {
      permit.status =
        "CONSUMED";

      permit.consumedAt =
        Date.now();

      await this.persist(
        permit
      );

      await this.record(
        "AI_EXECUTION_PERMIT_CONSUMED",
        permit
      );
    }

    return this.clonePermit(
      permit
    );
  }

  public async revoke(
    permitId: string,
    reason = "Execution permit revoked."
  ): Promise<SovereignExecutionPermit> {
    const permit =
      this.getMutable(
        permitId
      );

    if (
      permit.status ===
        "CONSUMED" ||
      permit.status ===
        "EXPIRED"
    ) {
      return this.clonePermit(
        permit
      );
    }

    permit.status =
      "REVOKED";

    permit.revokedAt =
      Date.now();

    permit.reason =
      reason;

    await this.persist(
      permit
    );

    await this.record(
      "AI_EXECUTION_PERMIT_REVOKED",
      permit,
      {
        reason
      }
    );

    return this.clonePermit(
      permit
    );
  }

  public get(
    permitId: string
  ): SovereignExecutionPermit {
    const permit =
      this.getMutable(
        permitId
      );

    this.refreshStatus(
      permit
    );

    return this.clonePermit(
      permit
    );
  }

  public listActive():
    SovereignExecutionPermit[] {
    const result:
      SovereignExecutionPermit[] = [];

    for (
      const permit of
        this.permits.values()
    ) {
      this.refreshStatus(
        permit
      );

      if (
        permit.status ===
        "AUTHORIZED"
      ) {
        result.push(
          this.clonePermit(
            permit
          )
        );
      }
    }

    return result;
  }

  private async deny(
    request:
      SovereignExecutionAuthorizationRequest,
    reason: string
  ): Promise<SovereignExecutionPermit> {
    const now =
      Date.now();

    const permit:
      SovereignExecutionPermit = {
        id: this.createId(
          "execution-permit"
        ),

        requestId:
          request.id,

        decisionId:
          request.decisionId,

        assuranceId:
          request.assuranceId,

        goalId:
          request.goalId,

        taskId:
          request.taskId,

        capability:
          request.capability,

        action:
          request.action,

        authority:
          request.authority,

        status:
          "DENIED",

        constraints: [
          ...request.constraints
        ],

        autonomous:
          request.autonomous,

        reusable:
          false,

        issuedAt:
          now,

        expiresAt:
          now,

        reason,

        metadata:
          request.metadata
            ? {
                ...request.metadata
              }
            : undefined
      };

    this.permits.set(
      permit.id,
      permit
    );

    await this.persist(
      permit
    );

    await this.record(
      "AI_EXECUTION_DENIED",
      permit,
      {
        reason
      }
    );

    return this.clonePermit(
      permit
    );
  }

  private refreshStatus(
    permit:
      SovereignExecutionPermit
  ): void {
    if (
      permit.status !==
      "AUTHORIZED"
    ) {
      return;
    }

    if (
      Date.now() >=
      permit.expiresAt
    ) {
      permit.status =
        "EXPIRED";
    }
  }

  private normalizeRequest(
    input:
      SovereignExecutionAuthorizationRequest
  ): SovereignExecutionAuthorizationRequest {
    return {
      ...input,

      capability:
        input.capability.trim(),

      action:
        input.action.trim(),

      constraints: [
        ...new Set(
          input.constraints
            .map(
              value =>
                value.trim()
            )
            .filter(Boolean)
        )
      ],

      reusable:
        input.reusable === true,

      metadata:
        input.metadata
          ? {
              ...input.metadata
            }
          : undefined
    };
  }

  private validateRequest(
    request:
      SovereignExecutionAuthorizationRequest
  ): void {
    if (!request.id.trim()) {
      throw new Error(
        "Execution authorization request id is required."
      );
    }

    if (
      !request.decisionId.trim()
    ) {
      throw new Error(
        "Decision id is required."
      );
    }

    if (
      !request.assuranceId.trim()
    ) {
      throw new Error(
        "Assurance id is required."
      );
    }

    if (!request.goalId.trim()) {
      throw new Error(
        "Goal id is required."
      );
    }

    if (!request.taskId.trim()) {
      throw new Error(
        "Task id is required."
      );
    }

    if (!request.capability) {
      throw new Error(
        "Execution capability is required."
      );
    }

    if (!request.action) {
      throw new Error(
        "Execution action is required."
      );
    }
  }

  private resolveTtl(
    requested?: number
  ): number {
    if (
      requested === undefined ||
      !Number.isFinite(
        requested
      )
    ) {
      return this.defaultTtlMs;
    }

    return Math.max(
      1_000,
      Math.min(
        this.maximumTtlMs,
        requested
      )
    );
  }

  private getMutable(
    permitId: string
  ): SovereignExecutionPermit {
    const permit =
      this.permits.get(
        permitId
      );

    if (!permit) {
      throw new Error(
        `Execution permit not found: ${permitId}`
      );
    }

    return permit;
  }

  private async persist(
    permit:
      SovereignExecutionPermit
  ): Promise<void> {
    if (
      this.adapter.persistPermit
    ) {
      await this.adapter
        .persistPermit(
          this.clonePermit(
            permit
          )
        );
    }
  }

  private async record(
    type: string,
    permit:
      SovereignExecutionPermit,
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

          permitId:
            permit.id,

          requestId:
            permit.requestId,

          taskId:
            permit.taskId,

          timestamp:
            Date.now(),

          data
        });
    }
  }

  private clonePermit(
    permit:
      SovereignExecutionPermit
  ): SovereignExecutionPermit {
    return {
      ...permit,

      constraints: [
        ...permit.constraints
      ],

      metadata:
        permit.metadata
          ? {
              ...permit.metadata
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

export default SovereignAIExecutionAuthorization;

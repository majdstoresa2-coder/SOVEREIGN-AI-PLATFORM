// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-BOOTSTRAP-220.ts
// Final Closure 15/15
// FINAL FILE — Sovereign AI Bootstrap & Launch Gate
// ============================================================

export type SovereignBootstrapState =
  | "CREATED"
  | "CHECKING_AUTHORITY"
  | "INTEGRATING"
  | "CHECKING_READINESS"
  | "STARTING_RUNTIME"
  | "VERIFYING"
  | "RUNNING"
  | "BLOCKED"
  | "FAILED";

export interface SovereignBootstrapRequest {
  id: string;
  commandId: string;
  projectId: string;

  ownerId: string;

  autonomous: boolean;

  instruction?: string;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignAuthorityCheck {
  valid: boolean;

  ownerAuthority: boolean;

  stewardAvailable: boolean;

  errors: string[];
}

export interface SovereignIntegrationCheck {
  ready: boolean;

  missing: string[];

  unhealthy: string[];

  errors: string[];
}

export interface SovereignRuntimeStartResult {
  success: boolean;

  runtimeId?: string;

  state?: string;

  liveTarget?: string;

  errors: string[];
}

export interface SovereignFinalVerification {
  success: boolean;

  brainReady: boolean;

  runtimeReady: boolean;

  buildersReady: boolean;

  testingReady: boolean;

  repairReady: boolean;

  releaseReady: boolean;

  knowledgeReady: boolean;

  ownerControlReady: boolean;

  visible: boolean;

  errors: string[];
}

export interface SovereignBootstrapResult {
  id: string;

  requestId: string;

  projectId: string;

  state: SovereignBootstrapState;

  authority?: SovereignAuthorityCheck;

  integration?: SovereignIntegrationCheck;

  runtime?: SovereignRuntimeStartResult;

  verification?: SovereignFinalVerification;

  ready: boolean;

  liveTarget?: string;

  error?: string;

  startedAt: number;

  completedAt?: number;
}

export interface SovereignAIBootstrapAdapter {
  verifyAuthority(
    request: SovereignBootstrapRequest
  ): Promise<SovereignAuthorityCheck>;

  integrateSystem(
    request: SovereignBootstrapRequest
  ): Promise<SovereignIntegrationCheck>;

  startRuntime(
    request: SovereignBootstrapRequest
  ): Promise<SovereignRuntimeStartResult>;

  verifySystem(
    request: SovereignBootstrapRequest,
    runtime: SovereignRuntimeStartResult
  ): Promise<SovereignFinalVerification>;

  stopRuntime?(
    runtimeId: string
  ): Promise<void>;

  persistResult?(
    result: SovereignBootstrapResult
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    bootstrapId: string;

    requestId: string;

    projectId: string;

    state: SovereignBootstrapState;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIBootstrap {
  private running = false;

  constructor(
    private readonly adapter:
      SovereignAIBootstrapAdapter
  ) {}

  public isRunning(): boolean {
    return this.running;
  }

  public async boot(
    raw: SovereignBootstrapRequest
  ): Promise<SovereignBootstrapResult> {
    const request =
      this.normalizeRequest(raw);

    this.validateRequest(request);

    const result: SovereignBootstrapResult = {
      id: this.createId(
        "sovereign-bootstrap"
      ),

      requestId:
        request.id,

      projectId:
        request.projectId,

      state:
        "CREATED",

      ready: false,

      startedAt:
        Date.now()
    };

    try {
      await this.transition(
        result,
        "CHECKING_AUTHORITY"
      );

      const authority =
        await this.adapter.verifyAuthority(
          request
        );

      result.authority = {
        ...authority,

        errors: [
          ...authority.errors
        ]
      };

      if (
        !authority.valid ||
        !authority.ownerAuthority
      ) {
        return await this.block(
          result,
          "Sovereign OWNER authority verification failed."
        );
      }

      await this.transition(
        result,
        "INTEGRATING"
      );

      const integration =
        await this.adapter.integrateSystem(
          request
        );

      result.integration = {
        ...integration,

        missing: [
          ...integration.missing
        ],

        unhealthy: [
          ...integration.unhealthy
        ],

        errors: [
          ...integration.errors
        ]
      };

      if (!integration.ready) {
        return await this.block(
          result,
          this.integrationError(
            integration
          )
        );
      }

      await this.transition(
        result,
        "CHECKING_READINESS"
      );

      if (
        integration.missing.length > 0 ||
        integration.unhealthy.length > 0
      ) {
        return await this.block(
          result,
          "System integration reported unresolved components."
        );
      }

      await this.transition(
        result,
        "STARTING_RUNTIME"
      );

      const runtime =
        await this.adapter.startRuntime(
          request
        );

      result.runtime = {
        ...runtime,

        errors: [
          ...runtime.errors
        ]
      };

      if (!runtime.success) {
        throw new Error(
          `Sovereign runtime failed to start: ${runtime.errors.join(
            "; "
          )}`
        );
      }

      this.running = true;

      await this.transition(
        result,
        "VERIFYING"
      );

      const verification =
        await this.adapter.verifySystem(
          request,
          runtime
        );

      result.verification = {
        ...verification,

        errors: [
          ...verification.errors
        ]
      };

      const finalReady =
        this.isFullyReady(
          verification
        );

      if (!finalReady) {
        if (
          runtime.runtimeId &&
          this.adapter.stopRuntime
        ) {
          await this.adapter.stopRuntime(
            runtime.runtimeId
          );

          this.running = false;
        }

        return await this.block(
          result,
          this.verificationError(
            verification
          )
        );
      }

      result.ready = true;

      result.liveTarget =
        runtime.liveTarget;

      result.state =
        "RUNNING";

      result.completedAt =
        Date.now();

      await this.finish(result);

      return this.cloneResult(
        result
      );
    } catch (error) {
      result.state =
        "FAILED";

      result.ready =
        false;

      result.error =
        error instanceof Error
          ? error.message
          : String(error);

      result.completedAt =
        Date.now();

      this.running = false;

      await this.finish(result);

      return this.cloneResult(
        result
      );
    }
  }

  private isFullyReady(
    verification:
      SovereignFinalVerification
  ): boolean {
    return (
      verification.success &&
      verification.brainReady &&
      verification.runtimeReady &&
      verification.buildersReady &&
      verification.testingReady &&
      verification.repairReady &&
      verification.releaseReady &&
      verification.knowledgeReady &&
      verification.ownerControlReady &&
      verification.visible &&
      verification.errors.length === 0
    );
  }

  private integrationError(
    integration:
      SovereignIntegrationCheck
  ): string {
    const reasons: string[] = [];

    if (
      integration.missing.length > 0
    ) {
      reasons.push(
        `Missing: ${integration.missing.join(
          ", "
        )}`
      );
    }

    if (
      integration.unhealthy.length > 0
    ) {
      reasons.push(
        `Unhealthy: ${integration.unhealthy.join(
          ", "
        )}`
      );
    }

    if (
      integration.errors.length > 0
    ) {
      reasons.push(
        integration.errors.join(
          "; "
        )
      );
    }

    return (
      reasons.join("; ") ||
      "Sovereign integration is not ready."
    );
  }

  private verificationError(
    verification:
      SovereignFinalVerification
  ): string {
    const missing: string[] = [];

    if (!verification.brainReady) {
      missing.push(
        "MASTER_BRAIN"
      );
    }

    if (!verification.runtimeReady) {
      missing.push(
        "AUTONOMOUS_RUNTIME"
      );
    }

    if (!verification.buildersReady) {
      missing.push(
        "BUILDERS"
      );
    }

    if (!verification.testingReady) {
      missing.push(
        "TEST_ENGINE"
      );
    }

    if (!verification.repairReady) {
      missing.push(
        "REPAIR_ENGINE"
      );
    }

    if (!verification.releaseReady) {
      missing.push(
        "RELEASE_MANAGER"
      );
    }

    if (!verification.knowledgeReady) {
      missing.push(
        "KNOWLEDGE_ENGINE"
      );
    }

    if (!verification.ownerControlReady) {
      missing.push(
        "OWNER_CONTROL"
      );
    }

    if (!verification.visible) {
      missing.push(
        "VISIBLE_OUTPUT"
      );
    }

    const errors = [
      ...verification.errors
    ];

    if (missing.length > 0) {
      errors.unshift(
        `Not ready: ${missing.join(
          ", "
        )}`
      );
    }

    return (
      errors.join("; ") ||
      "Final sovereign verification failed."
    );
  }

  private async block(
    result:
      SovereignBootstrapResult,
    reason: string
  ): Promise<SovereignBootstrapResult> {
    result.state =
      "BLOCKED";

    result.ready =
      false;

    result.error =
      reason;

    result.completedAt =
      Date.now();

    this.running = false;

    await this.finish(result);

    return this.cloneResult(
      result
    );
  }

  private normalizeRequest(
    input:
      SovereignBootstrapRequest
  ): SovereignBootstrapRequest {
    return {
      ...input,

      id:
        input.id.trim(),

      commandId:
        input.commandId.trim(),

      projectId:
        input.projectId.trim(),

      ownerId:
        input.ownerId.trim(),

      instruction:
        input.instruction
          ?.trim()
          .replace(
            /\s+/g,
            " "
          ),

      autonomous:
        input.autonomous !==
        false,

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
      SovereignBootstrapRequest
  ): void {
    if (!request.id) {
      throw new Error(
        "Bootstrap request id is required."
      );
    }

    if (!request.commandId) {
      throw new Error(
        "Bootstrap command id is required."
      );
    }

    if (!request.projectId) {
      throw new Error(
        "Bootstrap project id is required."
      );
    }

    if (!request.ownerId) {
      throw new Error(
        "Bootstrap OWNER id is required."
      );
    }
  }

  private async transition(
    result:
      SovereignBootstrapResult,
    state:
      SovereignBootstrapState
  ): Promise<void> {
    result.state =
      state;

    await this.persist(
      result
    );

    await this.record(
      `SOVEREIGN_BOOTSTRAP_${state}`,
      result
    );
  }

  private async finish(
    result:
      SovereignBootstrapResult
  ): Promise<void> {
    await this.persist(
      result
    );

    await this.record(
      `SOVEREIGN_BOOTSTRAP_${result.state}`,
      result,
      {
        ready:
          result.ready,

        liveTarget:
          result.liveTarget,

        error:
          result.error,

        completedAt:
          result.completedAt
      }
    );
  }

  private async persist(
    result:
      SovereignBootstrapResult
  ): Promise<void> {
    if (
      this.adapter.persistResult
    ) {
      await this.adapter.persistResult(
        this.cloneResult(
          result
        )
      );
    }
  }

  private async record(
    type: string,
    result:
      SovereignBootstrapResult,
    data?: Record<
      string,
      unknown
    >
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter.recordEvent({
        type,

        bootstrapId:
          result.id,

        requestId:
          result.requestId,

        projectId:
          result.projectId,

        state:
          result.state,

        timestamp:
          Date.now(),

        data
      });
    }
  }

  private cloneResult(
    result:
      SovereignBootstrapResult
  ): SovereignBootstrapResult {
    return {
      ...result,

      authority:
        result.authority
          ? {
              ...result.authority,

              errors: [
                ...result.authority
                  .errors
              ]
            }
          : undefined,

      integration:
        result.integration
          ? {
              ...result.integration,

              missing: [
                ...result.integration
                  .missing
              ],

              unhealthy: [
                ...result.integration
                  .unhealthy
              ],

              errors: [
                ...result.integration
                  .errors
              ]
            }
          : undefined,

      runtime:
        result.runtime
          ? {
              ...result.runtime,

              errors: [
                ...result.runtime.errors
              ]
            }
          : undefined,

      verification:
        result.verification
          ? {
              ...result.verification,

              errors: [
                ...result.verification
                  .errors
              ]
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

export default SovereignAIBootstrap;

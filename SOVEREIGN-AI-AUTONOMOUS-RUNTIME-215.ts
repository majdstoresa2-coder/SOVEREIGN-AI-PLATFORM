// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-AUTONOMOUS-RUNTIME-215.ts
// Final Closure 10/15
// Sovereign Autonomous Runtime
// ============================================================

export type SovereignRuntimeCommandType =
  | "PLATFORM"
  | "GAME"
  | "ADMIN"
  | "SOCIAL"
  | "MEDIA"
  | "PAYMENTS"
  | "SERVICE"
  | "GENERAL";

export type SovereignRuntimeState =
  | "IDLE"
  | "RECEIVED"
  | "PLANNING"
  | "BUILDING"
  | "TESTING"
  | "REPAIRING"
  | "RELEASING"
  | "VERIFYING"
  | "RUNNING"
  | "COMPLETED"
  | "BLOCKED"
  | "FAILED";

export interface SovereignRuntimeCommand {
  id: string;

  ownerCommandId: string;

  projectId?: string;

  type: SovereignRuntimeCommandType;

  instruction: string;

  autonomous: boolean;

  priority: number;

  metadata?: Record<string, unknown>;

  createdAt: number;
}

export interface SovereignRuntimeBuildResult {
  projectId: string;

  success: boolean;

  artifactPath?: string;

  playable?: boolean;

  output?: unknown;

  errors: string[];
}

export interface SovereignRuntimeTestResult {
  success: boolean;

  releaseAllowed: boolean;

  repaired: boolean;

  repairAttempts: number;

  errors: string[];
}

export interface SovereignRuntimeReleaseResult {
  success: boolean;

  liveTarget?: string;

  releaseId?: string;

  verified: boolean;

  errors: string[];
}

export interface SovereignRuntimeVerification {
  success: boolean;

  visible: boolean;

  healthy: boolean;

  functional: boolean;

  playable?: boolean;

  checks: Record<string, boolean>;

  errors: string[];
}

export interface SovereignAutonomousRuntimeResult {
  id: string;

  commandId: string;

  projectId?: string;

  type: SovereignRuntimeCommandType;

  state: SovereignRuntimeState;

  build?: SovereignRuntimeBuildResult;

  tests?: SovereignRuntimeTestResult;

  release?: SovereignRuntimeReleaseResult;

  verification?: SovereignRuntimeVerification;

  liveTarget?: string;

  error?: string;

  startedAt: number;

  completedAt?: number;
}

export interface SovereignAutonomousRuntimeAdapter {
  buildPlatform?(
    command: SovereignRuntimeCommand
  ): Promise<SovereignRuntimeBuildResult>;

  buildGame?(
    command: SovereignRuntimeCommand
  ): Promise<SovereignRuntimeBuildResult>;

  buildAdmin?(
    command: SovereignRuntimeCommand
  ): Promise<SovereignRuntimeBuildResult>;

  buildCapability?(
    command: SovereignRuntimeCommand
  ): Promise<SovereignRuntimeBuildResult>;

  testAndRepair(
    command: SovereignRuntimeCommand,
    build: SovereignRuntimeBuildResult
  ): Promise<SovereignRuntimeTestResult>;

  release(
    command: SovereignRuntimeCommand,
    build: SovereignRuntimeBuildResult,
    tests: SovereignRuntimeTestResult
  ): Promise<SovereignRuntimeReleaseResult>;

  verifyLive(
    command: SovereignRuntimeCommand,
    release: SovereignRuntimeReleaseResult
  ): Promise<SovereignRuntimeVerification>;

  monitor?(
    result: SovereignAutonomousRuntimeResult
  ): Promise<void>;

  persistResult?(
    result: SovereignAutonomousRuntimeResult
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    runtimeId: string;

    commandId: string;

    projectId?: string;

    state: SovereignRuntimeState;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIAutonomousRuntime {
  private running = false;

  constructor(
    private readonly adapter:
      SovereignAutonomousRuntimeAdapter
  ) {}

  public isRunning(): boolean {
    return this.running;
  }

  public async execute(
    input: SovereignRuntimeCommand
  ): Promise<SovereignAutonomousRuntimeResult> {
    const command =
      this.normalizeCommand(input);

    this.validateCommand(command);

    const result:
      SovereignAutonomousRuntimeResult = {
        id: this.createId(
          "autonomous-runtime"
        ),

        commandId:
          command.id,

        projectId:
          command.projectId,

        type:
          command.type,

        state:
          "RECEIVED",

        startedAt:
          Date.now()
      };

    this.running = true;

    try {
      await this.transition(
        result,
        "RECEIVED"
      );

      await this.transition(
        result,
        "PLANNING"
      );

      const build =
        await this.dispatchBuild(
          command
        );

      result.projectId =
        build.projectId;

      result.build =
        this.cloneBuild(build);

      if (!build.success) {
        throw new Error(
          `Autonomous build failed: ${build.errors.join("; ")}`
        );
      }

      await this.transition(
        result,
        "BUILDING"
      );

      await this.transition(
        result,
        "TESTING"
      );

      const tests =
        await this.adapter
          .testAndRepair(
            command,
            build
          );

      result.tests = {
        ...tests,

        errors: [
          ...tests.errors
        ]
      };

      if (!tests.success) {
        throw new Error(
          `Autonomous testing failed: ${tests.errors.join("; ")}`
        );
      }

      if (!tests.releaseAllowed) {
        result.state =
          "BLOCKED";

        result.error =
          "Sovereign quality gate blocked release.";

        result.completedAt =
          Date.now();

        await this.finish(result);

        return this.cloneResult(
          result
        );
      }

      if (tests.repaired) {
        await this.transition(
          result,
          "REPAIRING"
        );
      }

      await this.transition(
        result,
        "RELEASING"
      );

      const release =
        await this.adapter.release(
          command,
          build,
          tests
        );

      result.release = {
        ...release,

        errors: [
          ...release.errors
        ]
      };

      if (!release.success) {
        throw new Error(
          `Autonomous release failed: ${release.errors.join("; ")}`
        );
      }

      await this.transition(
        result,
        "VERIFYING"
      );

      const verification =
        await this.adapter
          .verifyLive(
            command,
            release
          );

      result.verification = {
        ...verification,

        checks: {
          ...verification.checks
        },

        errors: [
          ...verification.errors
        ]
      };

      if (
        !verification.success ||
        !verification.visible ||
        !verification.healthy ||
        !verification.functional
      ) {
        throw new Error(
          `Live verification failed: ${verification.errors.join("; ")}`
        );
      }

      if (
        command.type === "GAME" &&
        verification.playable !==
          true
      ) {
        throw new Error(
          "Game release is visible but not verified as playable."
        );
      }

      result.liveTarget =
        release.liveTarget;

      await this.transition(
        result,
        "RUNNING"
      );

      if (
        this.adapter.monitor
      ) {
        await this.adapter.monitor(
          this.cloneResult(
            result
          )
        );
      }

      result.state =
        "COMPLETED";

      result.completedAt =
        Date.now();

      await this.finish(result);

      return this.cloneResult(
        result
      );
    } catch (error) {
      result.state =
        "FAILED";

      result.error =
        error instanceof Error
          ? error.message
          : String(error);

      result.completedAt =
        Date.now();

      await this.finish(result);

      return this.cloneResult(
        result
      );
    } finally {
      this.running = false;
    }
  }

  private async dispatchBuild(
    command: SovereignRuntimeCommand
  ): Promise<SovereignRuntimeBuildResult> {
    switch (command.type) {
      case "PLATFORM":
        if (
          !this.adapter
            .buildPlatform
        ) {
          throw new Error(
            "Platform builder is not connected to autonomous runtime."
          );
        }

        return await this.adapter
          .buildPlatform(
            command
          );

      case "GAME":
        if (
          !this.adapter
            .buildGame
        ) {
          throw new Error(
            "Game builder is not connected to autonomous runtime."
          );
        }

        return await this.adapter
          .buildGame(
            command
          );

      case "ADMIN":
        if (
          !this.adapter
            .buildAdmin
        ) {
          throw new Error(
            "Admin builder is not connected to autonomous runtime."
          );
        }

        return await this.adapter
          .buildAdmin(
            command
          );

      case "SOCIAL":
      case "MEDIA":
      case "PAYMENTS":
      case "SERVICE":
      case "GENERAL":
        if (
          !this.adapter
            .buildCapability
        ) {
          throw new Error(
            `Capability builder is not connected for ${command.type}.`
          );
        }

        return await this.adapter
          .buildCapability(
            command
          );
    }
  }

  private normalizeCommand(
    input: SovereignRuntimeCommand
  ): SovereignRuntimeCommand {
    return {
      ...input,

      instruction:
        input.instruction
          .trim()
          .replace(
            /\s+/g,
            " "
          ),

      priority:
        this.normalizePriority(
          input.priority
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

  private validateCommand(
    command: SovereignRuntimeCommand
  ): void {
    if (!command.id.trim()) {
      throw new Error(
        "Runtime command id is required."
      );
    }

    if (
      !command.ownerCommandId.trim()
    ) {
      throw new Error(
        "OWNER command id is required."
      );
    }

    if (
      !command.instruction
    ) {
      throw new Error(
        "Runtime instruction is required."
      );
    }
  }

  private async transition(
    result:
      SovereignAutonomousRuntimeResult,
    state:
      SovereignRuntimeState
  ): Promise<void> {
    result.state = state;

    await this.persist(
      result
    );

    await this.record(
      `SOVEREIGN_AUTONOMOUS_RUNTIME_${state}`,
      result
    );
  }

  private async finish(
    result:
      SovereignAutonomousRuntimeResult
  ): Promise<void> {
    await this.persist(
      result
    );

    await this.record(
      `SOVEREIGN_AUTONOMOUS_RUNTIME_${result.state}`,
      result,
      {
        liveTarget:
          result.liveTarget,

        error:
          result.error,

        playable:
          result.verification
            ?.playable,

        completedAt:
          result.completedAt
      }
    );
  }

  private async persist(
    result:
      SovereignAutonomousRuntimeResult
  ): Promise<void> {
    if (
      this.adapter.persistResult
    ) {
      await this.adapter
        .persistResult(
          this.cloneResult(
            result
          )
        );
    }
  }

  private async record(
    type: string,
    result:
      SovereignAutonomousRuntimeResult,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,

          runtimeId:
            result.id,

          commandId:
            result.commandId,

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

  private normalizePriority(
    value: number
  ): number {
    if (!Number.isFinite(value)) {
      return 100;
    }

    return Math.max(
      0,
      Math.min(
        100,
        Math.floor(value)
      )
    );
  }

  private cloneBuild(
    build:
      SovereignRuntimeBuildResult
  ): SovereignRuntimeBuildResult {
    return {
      ...build,

      errors: [
        ...build.errors
      ]
    };
  }

  private cloneResult(
    result:
      SovereignAutonomousRuntimeResult
  ): SovereignAutonomousRuntimeResult {
    return {
      ...result,

      build:
        result.build
          ? this.cloneBuild(
              result.build
            )
          : undefined,

      tests:
        result.tests
          ? {
              ...result.tests,

              errors: [
                ...result.tests.errors
              ]
            }
          : undefined,

      release:
        result.release
          ? {
              ...result.release,

              errors: [
                ...result.release.errors
              ]
            }
          : undefined,

      verification:
        result.verification
          ? {
              ...result.verification,

              checks: {
                ...result
                  .verification
                  .checks
              },

              errors: [
                ...result
                  .verification
                  .errors
              ]

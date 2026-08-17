// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-FINAL-PRODUCTION-START-229.ts
// FINAL PRODUCTION START
// OWNER -> COMMAND -> LIVE RUNTIME -> RUNNING
// ============================================================

import {
  createSovereignFinalOwnerCommand
} from "./SOVEREIGN-AI-FINAL-OWNER-COMMAND-228.ts";

import type {
  SovereignOwnerCommand,
  SovereignOwnerCommandResult
} from "./SOVEREIGN-AI-FINAL-OWNER-COMMAND-228.ts";

// ============================================================
// TYPES
// ============================================================

export interface SovereignProductionStartOptions {
  ownerId: string;

  projectId: string;

  instruction?: string;
}

export interface SovereignProductionStartResult {
  success: boolean;

  production: boolean;

  ownerAccepted: boolean;

  executed: boolean;

  modulesLoaded: boolean;

  instancesVerified: boolean;

  runtimeStarted: boolean;

  running: boolean;

  ready: boolean;

  state: string;

  liveTarget?: string;

  command:
    SovereignOwnerCommandResult;

  errors: string[];

  startedAt: number;

  completedAt: number;
}

// ============================================================
// FINAL PRODUCTION START
// ============================================================

export class SovereignAIFinalProductionStart {
  private active = false;

  private lastResult?:
    SovereignProductionStartResult;

  public constructor(
    private readonly options:
      SovereignProductionStartOptions
  ) {
    this.validateOptions();
  }

  // ==========================================================
  // START PRODUCTION
  // ==========================================================

  public async start():
    Promise<SovereignProductionStartResult> {
    const startedAt =
      Date.now();

    console.log(
      "============================================"
    );

    console.log(
      "SOVEREIGN AI PLATFORM"
    );

    console.log(
      "FINAL PRODUCTION START"
    );

    console.log(
      "============================================"
    );

    const ownerGateway =
      createSovereignFinalOwnerCommand();

    const command:
      SovereignOwnerCommand = {
        id:
          this.createId(
            "owner-production-command"
          ),

        ownerId:
          this.options.ownerId,

        projectId:
          this.options.projectId,

        instruction:
          this.options.instruction ??
          "Start SOVEREIGN AI PLATFORM in final autonomous production mode.",

        priority:
          100,

        autonomous:
          true,

        createdAt:
          Date.now(),

        metadata: {
          source:
            "SOVEREIGN-AI-FINAL-PRODUCTION-START-229",

          mode:
            "PRODUCTION",

          authority:
            "OWNER_SUPREME"
        }
      };

    const commandResult =
      await ownerGateway.execute(
        command
      );

    const ownerAccepted =
      commandResult.accepted ===
      true;

    const executed =
      commandResult.executed ===
      true;

    const modulesLoaded =
      commandResult.modulesLoaded ===
      true;

    const instancesVerified =
      commandResult.instancesVerified ===
      true;

    const runtimeStarted =
      commandResult.runtimeStarted ===
      true;

    const ready =
      commandResult.ready ===
      true;

    const running =
      commandResult.state ===
      "RUNNING";

    const success =
      commandResult.success ===
        true &&
      ownerAccepted &&
      executed &&
      modulesLoaded &&
      instancesVerified &&
      runtimeStarted &&
      ready &&
      running;

    this.active =
      success;

    const errors:
      string[] = [
        ...commandResult.errors
      ];

    if (
      !ownerAccepted
    ) {
      errors.push(
        "OWNER command was not accepted."
      );
    }

    if (
      !executed
    ) {
      errors.push(
        "OWNER command was not executed."
      );
    }

    if (
      !modulesLoaded
    ) {
      errors.push(
        "Real sovereign modules are not fully loaded."
      );
    }

    if (
      !instancesVerified
    ) {
      errors.push(
        "Required sovereign instances are not fully verified."
      );
    }

    if (
      !runtimeStarted
    ) {
      errors.push(
        "Sovereign runtime did not start."
      );
    }

    if (
      !ready
    ) {
      errors.push(
        "Sovereign runtime is not ready."
      );
    }

    if (
      !running
    ) {
      errors.push(
        `Sovereign runtime state is ${commandResult.state}.`
      );
    }

    const uniqueErrors =
      [
        ...new Set(
          errors.filter(
            Boolean
          )
        )
      ];

    const result:
      SovereignProductionStartResult = {
        success,

        production:
          success,

        ownerAccepted,

        executed,

        modulesLoaded,

        instancesVerified,

        runtimeStarted,

        running,

        ready,

        state:
          commandResult.state,

        liveTarget:
          commandResult.liveTarget,

        command:
          commandResult,

        errors:
          uniqueErrors,

        startedAt,

        completedAt:
          Date.now()
      };

    this.lastResult =
      this.cloneResult(
        result
      );

    if (!success) {
      console.error(
        "============================================"
      );

      console.error(
        "SOVEREIGN PRODUCTION START: BLOCKED"
      );

      console.error(
        `OWNER ACCEPTED: ${ownerAccepted}`
      );

      console.error(
        `EXECUTED: ${executed}`
      );

      console.error(
        `MODULES LOADED: ${modulesLoaded}`
      );

      console.error(
        `INSTANCES VERIFIED: ${instancesVerified}`
      );

      console.error(
        `RUNTIME STARTED: ${runtimeStarted}`
      );

      console.error(
        `RUNNING: ${running}`
      );

      console.error(
        `READY: ${ready}`
      );

      console.error(
        `STATE: ${result.state}`
      );

      console.error(
        "============================================"
      );

      return this.cloneResult(
        result
      );
    }

    console.log(
      "============================================"
    );

    console.log(
      "SOVEREIGN PRODUCTION START: SUCCESS"
    );

    console.log(
      "AUTHORITY: OWNER_SUPREME"
    );

    console.log(
      "PRODUCTION: true"
    );

    console.log(
      "OWNER ACCEPTED: true"
    );

    console.log(
      "EXECUTED: true"
    );

    console.log(
      "MODULES LOADED: true"
    );

    console.log(
      "INSTANCES VERIFIED: true"
    );

    console.log(
      "RUNTIME STARTED: true"
    );

    console.log(
      "RUNNING: true"
    );

    console.log(
      "STATE: RUNNING"
    );

    console.log(
      "READY: true"
    );

    console.log(
      "============================================"
    );

    return this.cloneResult(
      result
    );
  }

  // ==========================================================
  // STATUS
  // ==========================================================

  public isActive():
    boolean {
    return this.active;
  }

  public getLastResult():
    SovereignProductionStartResult | undefined {
    return this.lastResult
      ? this.cloneResult(
          this.lastResult
        )
      : undefined;
  }

  // ==========================================================
  // VALIDATION
  // ==========================================================

  private validateOptions():
    void {
    if (
      !this.options.ownerId ||
      !this.options.ownerId.trim()
    ) {
      throw new Error(
        "OWNER id is required."
      );
    }

    if (
      !this.options.projectId ||
      !this.options.projectId.trim()
    ) {
      throw new Error(
        "Project id is required."
      );
    }
  }

  // ==========================================================
  // RESULT CLONE
  // ==========================================================

  private cloneResult(
    result:
      SovereignProductionStartResult
  ): SovereignProductionStartResult {
    return {
      ...result,

      errors: [
        ...result.errors
      ],

      command: {
        ...result.command,

        errors: [
          ...result.command.errors
        ],

        runtime:
          result.command.runtime
            ? {
                ...result.command.runtime,

                errors: [
                  ...result.command.runtime
                    .errors
                ]
              }
            : undefined
      }
    };
  }

  // ==========================================================
  // ID
  // ==========================================================

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

// ============================================================
// FACTORY
// ============================================================

export function createSovereignFinalProductionStart(
  options:
    SovereignProductionStartOptions
): SovereignAIFinalProductionStart {
  return new SovereignAIFinalProductionStart(
    options
  );
}

// ============================================================
// DIRECT PRODUCTION ENTRY
// ============================================================

export async function startSovereignProduction(
  options:
    SovereignProductionStartOptions
): Promise<SovereignProductionStartResult> {
  const production =
    createSovereignFinalProductionStart(
      options
    );

  return await production.start();
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default SovereignAIFinalProductionStart;

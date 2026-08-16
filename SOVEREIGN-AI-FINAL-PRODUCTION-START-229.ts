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

        priority: 100,

        autonomous: true,

        createdAt:
          Date.now(),

        metadata: {
          source:
            "SOVEREIGN-AI-FINAL-PRODUCTION-START-229",

          mode:
            "PRODUCTION",

          authority:
            "OWNER"
        }
      };

    const commandResult =
      await ownerGateway.execute(
        command
      );

    const success =
      commandResult.success &&
      commandResult.accepted &&
      commandResult.executed &&
      commandResult.ready &&
      commandResult.state ===
        "RUNNING";

    this.active =
      success;

    const result:
      SovereignProductionStartResult = {
        success,

        production:
          success,

        ownerAccepted:
          commandResult.accepted,

        executed:
          commandResult.executed,

        running:
          success,

        ready:
          commandResult.ready,

        state:
          commandResult.state,

        liveTarget:
          commandResult.liveTarget,

        command:
          commandResult,

        errors: [
          ...commandResult.errors
        ],

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
        `STATE: ${result.state}`
      );

      console.error(
        `READY: ${result.ready}`
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
      "PRODUCTION: true"
    );

    console.log(
      "OWNER ACCEPTED: true"
    );

    console.log(
      "EXECUTED: true"
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

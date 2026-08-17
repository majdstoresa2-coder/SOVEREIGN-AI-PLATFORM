// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-FINAL-OWNER-COMMAND-228.ts
// FINAL OWNER COMMAND ENTRY
// OWNER -> SOVEREIGN AI FINAL LIVE ENTRY
// ============================================================

import {
  createSovereignFinalLiveEntry
} from "./SOVEREIGN-AI-FINAL-LIVE-ENTRY-227.ts";

import type {
  SovereignFinalLiveEntryResult
} from "./SOVEREIGN-AI-FINAL-LIVE-ENTRY-227.ts";

// ============================================================
// TYPES
// ============================================================

export interface SovereignOwnerCommand {
  id: string;

  ownerId: string;

  projectId: string;

  instruction: string;

  priority?: number;

  autonomous?: boolean;

  createdAt?: number;

  metadata?: Record<
    string,
    unknown
  >;
}

export interface SovereignOwnerCommandResult {
  success: boolean;

  commandId: string;

  ownerId: string;

  projectId: string;

  instruction: string;

  priority: number;

  autonomous: boolean;

  accepted: boolean;

  executed: boolean;

  modulesLoaded: boolean;

  instancesVerified: boolean;

  runtimeStarted: boolean;

  ready: boolean;

  state: string;

  liveTarget?: string;

  runtime?: SovereignFinalLiveEntryResult;

  errors: string[];

  startedAt: number;

  completedAt: number;
}

// ============================================================
// FINAL OWNER COMMAND ENTRY
// ============================================================

export class SovereignAIFinalOwnerCommand {
  private running = false;

  private lastResult?:
    SovereignOwnerCommandResult;

  // ==========================================================
  // EXECUTE OWNER COMMAND
  // ==========================================================

  public async execute(
    raw:
      SovereignOwnerCommand
  ): Promise<SovereignOwnerCommandResult> {
    const command =
      this.normalizeCommand(
        raw
      );

    this.validateCommand(
      command
    );

    const startedAt =
      Date.now();

    this.running =
      true;

    try {
      console.log(
        "============================================"
      );

      console.log(
        "SOVEREIGN AI PLATFORM"
      );

      console.log(
        "FINAL OWNER COMMAND"
      );

      console.log(
        `OWNER: ${command.ownerId}`
      );

      console.log(
        `COMMAND: ${command.id}`
      );

      console.log(
        `PROJECT: ${command.projectId}`
      );

      console.log(
        `PRIORITY: ${command.priority}`
      );

      console.log(
        `AUTONOMOUS: ${command.autonomous}`
      );

      console.log(
        "============================================"
      );

      // ======================================================
      // STEP 1 — OWNER COMMAND ACCEPTANCE
      // ======================================================

      const accepted =
        command.ownerId.length > 0 &&
        command.id.length > 0 &&
        command.instruction.length > 0;

      if (!accepted) {
        throw new Error(
          "OWNER command failed sovereign acceptance."
        );
      }

      // ======================================================
      // STEP 2 — CREATE FINAL LIVE ENTRY
      // ======================================================

      const liveEntry =
        createSovereignFinalLiveEntry({
          ownerId:
            command.ownerId,

          projectId:
            command.projectId,

          instruction:
            command.instruction
        });

      // ======================================================
      // STEP 3 — EXECUTE FINAL LIVE RUNTIME
      // ======================================================

      const runtime =
        await liveEntry.start();

      // ======================================================
      // STEP 4 — VERIFY COMPLETE LIVE CHAIN
      // ======================================================

      const modulesLoaded =
        runtime.modulesLoaded ===
        true;

      const instancesVerified =
        runtime.instancesVerified ===
        true;

      const runtimeStarted =
        runtime.runtimeStarted ===
        true;

      const ready =
        runtime.ready ===
        true;

      const running =
        runtime.state ===
        "RUNNING";

      const success =
        runtime.success ===
          true &&
        modulesLoaded &&
        instancesVerified &&
        runtimeStarted &&
        ready &&
        running;

      const errors: string[] = [
        ...runtime.errors
      ];

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
          "Required sovereign component instances are not fully verified."
        );
      }

      if (
        !runtimeStarted
      ) {
        errors.push(
          "Sovereign final runtime did not start."
        );
      }

      if (
        !ready
      ) {
        errors.push(
          "Sovereign final runtime is not ready."
        );
      }

      if (
        !running
      ) {
        errors.push(
          `Sovereign final runtime state is ${runtime.state}.`
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
        SovereignOwnerCommandResult = {
          success,

          commandId:
            command.id,

          ownerId:
            command.ownerId,

          projectId:
            command.projectId,

          instruction:
            command.instruction,

          priority:
            command.priority ??
            100,

          autonomous:
            command.autonomous !==
            false,

          accepted,

          executed:
            success,

          modulesLoaded,

          instancesVerified,

          runtimeStarted,

          ready,

          state:
            runtime.state,

          liveTarget:
            runtime.liveTarget,

          runtime,

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
          "SOVEREIGN OWNER COMMAND: BLOCKED"
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
          `READY: ${ready}`
        );

        console.error(
          `STATE: ${runtime.state}`
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
        "SOVEREIGN OWNER COMMAND: SUCCESS"
      );

      console.log(
        "OWNER AUTHORITY: SUPREME"
      );

      console.log(
        "ACCEPTED: true"
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
    } catch (error) {
      const result:
        SovereignOwnerCommandResult = {
          success:
            false,

          commandId:
            command.id,

          ownerId:
            command.ownerId,

          projectId:
            command.projectId,

          instruction:
            command.instruction,

          priority:
            command.priority ??
            100,

          autonomous:
            command.autonomous !==
            false,

          accepted:
            true,

          executed:
            false,

          modulesLoaded:
            false,

          instancesVerified:
            false,

          runtimeStarted:
            false,

          ready:
            false,

          state:
            "FAILED",

          errors: [
            this.errorMessage(
              error
            )
          ],

          startedAt,

          completedAt:
            Date.now()
        };

      this.lastResult =
        this.cloneResult(
          result
        );

      console.error(
        "SOVEREIGN OWNER COMMAND: FAILED"
      );

      console.error(
        result.errors.join(
          "; "
        )
      );

      return this.cloneResult(
        result
      );
    } finally {
      this.running =
        false;
    }
  }

  // ==========================================================
  // STATUS
  // ==========================================================

  public isRunning():
    boolean {
    return this.running;
  }

  public getLastResult():
    SovereignOwnerCommandResult | undefined {
    return this.lastResult
      ? this.cloneResult(
          this.lastResult
        )
      : undefined;
  }

  // ==========================================================
  // NORMALIZATION
  // ==========================================================

  private normalizeCommand(
    command:
      SovereignOwnerCommand
  ): SovereignOwnerCommand {
    return {
      ...command,

      id:
        command.id
          .trim(),

      ownerId:
        command.ownerId
          .trim(),

      projectId:
        command.projectId
          .trim(),

      instruction:
        command.instruction
          .trim()
          .replace(
            /\s+/g,
            " "
          ),

      priority:
        command.priority ??
        100,

      autonomous:
        command.autonomous !==
        false,

      createdAt:
        command.createdAt ??
        Date.now(),

      metadata:
        command.metadata
          ? {
              ...command.metadata
            }
          : undefined
    };
  }

  // ==========================================================
  // VALIDATION
  // ==========================================================

  private validateCommand(
    command:
      SovereignOwnerCommand
  ): void {
    if (
      !command.id
    ) {
      throw new Error(
        "OWNER command id is required."
      );
    }

    if (
      !command.ownerId
    ) {
      throw new Error(
        "OWNER id is required."
      );
    }

    if (
      !command.projectId
    ) {
      throw new Error(
        "Project id is required."
      );
    }

    if (
      !command.instruction
    ) {
      throw new Error(
        "OWNER instruction is required."
      );
    }

    if (
      typeof command.priority !==
        "number" ||
      !Number.isFinite(
        command.priority
      ) ||
      command.priority < 0
    ) {
      throw new Error(
        "OWNER command priority must be a valid non-negative number."
      );
    }

    if (
      command.autonomous !==
        true &&
      command.autonomous !==
        false
    ) {
      throw new Error(
        "OWNER command autonomous mode must be boolean."
      );
    }
  }

  // ==========================================================
  // CLONE
  // ==========================================================

  private cloneResult(
    result:
      SovereignOwnerCommandResult
  ): SovereignOwnerCommandResult {
    return {
      ...result,

      errors: [
        ...result.errors
      ],

      runtime:
        result.runtime
          ? {
              ...result.runtime,

              errors: [
                ...result.runtime
                  .errors
              ]
            }
          : undefined
    };
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  private errorMessage(
    error: unknown
  ): string {
    return error instanceof Error
      ? error.message
      : String(error);
  }
}

// ============================================================
// FACTORY
// ============================================================

export function createSovereignFinalOwnerCommand():
  SovereignAIFinalOwnerCommand {
  return new SovereignAIFinalOwnerCommand();
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default SovereignAIFinalOwnerCommand;

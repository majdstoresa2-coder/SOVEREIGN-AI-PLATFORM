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

  accepted: boolean;

  executed: boolean;

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
        "============================================"
      );

      // ======================================================
      // CREATE FINAL LIVE ENTRY
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
      // EXECUTE THROUGH FINAL LIVE RUNTIME
      // ======================================================

      const runtime =
        await liveEntry.start();

      const success =
        runtime.success &&
        runtime.ready &&
        runtime.state ===
          "RUNNING";

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

          accepted: true,

          executed:
            success,

          ready:
            runtime.ready,

          state:
            runtime.state,

          liveTarget:
            runtime.liveTarget,

          runtime,

          errors: [
            ...runtime.errors
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
          "SOVEREIGN OWNER COMMAND: BLOCKED"
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
        "ACCEPTED: true"
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
    } catch (error) {
      const result:
        SovereignOwnerCommandResult = {
          success: false,

          commandId:
            command.id,

          ownerId:
            command.ownerId,

          projectId:
            command.projectId,

          instruction:
            command.instruction,

          accepted: true,

          executed: false,

          ready: false,

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
        command.id.trim(),

      ownerId:
        command.ownerId.trim(),

      projectId:
        command.projectId.trim(),

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
    if (!command.id) {
      throw new Error(
        "OWNER command id is required."
      );
    }

    if (!command.ownerId) {
      throw new Error(
        "OWNER id is required."
      );
    }

    if (!command.projectId) {
      throw new Error(
        "Project id is required."
      );
    }

    if (!command.instruction) {
      throw new Error(
        "OWNER instruction is required."
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

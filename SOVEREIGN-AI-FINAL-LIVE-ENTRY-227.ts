// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-FINAL-LIVE-ENTRY-227.ts
// FINAL LIVE ENTRY
// Production Entry for Sovereign AI Runtime
// ============================================================

import {
  createSovereignRealRuntime
} from "./SOVEREIGN-AI-REAL-COMPONENT-BINDINGS-224.ts";

import {
  loadAllSovereignRealModules
} from "./SOVEREIGN-AI-LIVE-EXECUTION-226.ts";

import type {
  SovereignFinalLaunchResult
} from "./SOVEREIGN-AI-FINAL-LAUNCHER-221.ts";

// ============================================================
// TYPES
// ============================================================

export interface SovereignFinalLiveEntryOptions {
  ownerId: string;
  projectId: string;
  instruction?: string;
}

export interface SovereignFinalLiveEntryResult {
  success: boolean;
  modulesLoaded: boolean;
  runtimeStarted: boolean;
  ready: boolean;
  state: string;
  liveTarget?: string;
  launch?: SovereignFinalLaunchResult;
  errors: string[];
  startedAt: number;
  completedAt: number;
}

// ============================================================
// FINAL LIVE ENTRY
// ============================================================

export class SovereignAIFinalLiveEntry {
  public constructor(
    private readonly options:
      SovereignFinalLiveEntryOptions
  ) {
    this.validateOptions();
  }

  // ==========================================================
  // START
  // ==========================================================

  public async start():
    Promise<SovereignFinalLiveEntryResult> {
    const startedAt =
      Date.now();

    const errors: string[] = [];

    console.log(
      "============================================"
    );

    console.log(
      "SOVEREIGN AI PLATFORM"
    );

    console.log(
      "FINAL LIVE ENTRY"
    );

    console.log(
      "============================================"
    );

    // ========================================================
    // STEP 1 — LOAD REAL MODULES
    // ========================================================

    const moduleResult =
      await loadAllSovereignRealModules();

    if (!moduleResult.success) {
      for (
        const module of
          moduleResult.modules
      ) {
        if (
          !module.loaded &&
          module.error
        ) {
          errors.push(
            `${module.component}: ${module.error}`
          );
        }
      }

      return {
        success: false,
        modulesLoaded: false,
        runtimeStarted: false,
        ready: false,
        state:
          "MODULE_LOADING_FAILED",
        errors,
        startedAt,
        completedAt:
          Date.now()
      };
    }

    console.log(
      `REAL MODULES LOADED: ${moduleResult.loaded}/${moduleResult.total}`
    );

    // ========================================================
    // STEP 2 — CREATE REAL RUNTIME
    // ========================================================

    const runtime =
      createSovereignRealRuntime(
        this.options.ownerId,
        this.options.projectId
      );

    // ========================================================
    // STEP 3 — START FINAL RUNTIME
    // ========================================================

    const launch =
      await runtime.launch(
        this.options.instruction ??
          "Start SOVEREIGN AI PLATFORM in final live mode."
      );

    if (
      launch.state !== "RUNNING" ||
      !launch.ready
    ) {
      if (launch.error) {
        errors.push(
          launch.error
        );
      }

      if (
        launch.runtime?.errors
          .length
      ) {
        errors.push(
          ...launch.runtime.errors
        );
      }

      return {
        success: false,
        modulesLoaded: true,
        runtimeStarted:
          runtime.isRunning(),
        ready: false,
        state:
          launch.state,
        liveTarget:
          launch.liveTarget,
        launch,
        errors,
        startedAt,
        completedAt:
          Date.now()
      };
    }

    // ========================================================
    // STEP 4 — FINAL LIVE CONFIRMATION
    // ========================================================

    if (!runtime.isRunning()) {
      errors.push(
        "Final runtime reported ready but runtime is not active."
      );

      return {
        success: false,
        modulesLoaded: true,
        runtimeStarted: false,
        ready: false,
        state:
          "RUNTIME_NOT_ACTIVE",
        liveTarget:
          launch.liveTarget,
        launch,
        errors,
        startedAt,
        completedAt:
          Date.now()
      };
    }

    const result:
      SovereignFinalLiveEntryResult = {
        success: true,
        modulesLoaded: true,
        runtimeStarted: true,
        ready: true,
        state: "RUNNING",
        liveTarget:
          launch.liveTarget,
        launch,
        errors: [],
        startedAt,
        completedAt:
          Date.now()
      };

    console.log(
      "============================================"
    );

    console.log(
      "SOVEREIGN FINAL LIVE ENTRY: SUCCESS"
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

    return result;
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
}

// ============================================================
// FACTORY
// ============================================================

export function createSovereignFinalLiveEntry(
  options:
    SovereignFinalLiveEntryOptions
): SovereignAIFinalLiveEntry {
  return new SovereignAIFinalLiveEntry(
    options
  );
}

// ============================================================
// FINAL EXPORT
// ============================================================

export default SovereignAIFinalLiveEntry;

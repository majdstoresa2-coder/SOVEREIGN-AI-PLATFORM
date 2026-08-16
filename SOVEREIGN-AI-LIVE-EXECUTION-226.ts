// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-LIVE-EXECUTION-226.ts
// REAL MODULE LOADING / LIVE EXECUTION GATE
// ============================================================

import {
  getSovereignRealComponentModules
} from "./SOVEREIGN-AI-REAL-COMPONENT-BINDINGS-224.ts";

import type {
  SovereignFinalComponent
} from "./SOVEREIGN-AI-FINAL-LAUNCHER-221.ts";

// ============================================================
// TYPES
// ============================================================

export interface SovereignLiveModuleResult {
  component: SovereignFinalComponent;
  modulePath: string;
  loaded: boolean;
  exports: string[];
  error?: string;
}

export interface SovereignLiveExecutionResult {
  success: boolean;
  total: number;
  loaded: number;
  failed: number;
  modules: SovereignLiveModuleResult[];
  startedAt: number;
  completedAt: number;
}

// ============================================================
// MODULE CACHE
// ============================================================

const liveModules =
  new Map<
    SovereignFinalComponent,
    Record<string, unknown>
  >();

// ============================================================
// LOAD ONE REAL MODULE
// ============================================================

async function loadRealModule(
  component: SovereignFinalComponent,
  modulePath: string
): Promise<SovereignLiveModuleResult> {
  try {
    const moduleNamespace =
      await import(modulePath);

    const namespace =
      moduleNamespace as Record<
        string,
        unknown
      >;

    liveModules.set(
      component,
      namespace
    );

    return {
      component,
      modulePath,
      loaded: true,
      exports:
        Object.keys(namespace)
    };
  } catch (error) {
    return {
      component,
      modulePath,
      loaded: false,
      exports: [],
      error:
        error instanceof Error
          ? error.message
          : String(error)
    };
  }
}

// ============================================================
// LOAD ALL REAL COMPONENTS
// ============================================================

export async function loadAllSovereignRealModules():
  Promise<SovereignLiveExecutionResult> {
  const startedAt =
    Date.now();

  const registry =
    getSovereignRealComponentModules();

  const modules:
    SovereignLiveModuleResult[] = [];

  for (
    const [name, path]
    of Object.entries(registry)
  ) {
    if (
      typeof path !== "string"
    ) {
      continue;
    }

    const result =
      await loadRealModule(
        name as SovereignFinalComponent,
        path
      );

    modules.push(result);

    if (result.loaded) {
      console.log(
        `[LIVE OK] ${name} -> ${path}`
      );
    } else {
      console.error(
        `[LIVE FAIL] ${name} -> ${path}`
      );

      console.error(
        result.error ??
          "Unknown module loading error."
      );
    }
  }

  const loaded =
    modules.filter(
      module =>
        module.loaded
    ).length;

  const failed =
    modules.length -
    loaded;

  return {
    success:
      failed === 0 &&
      modules.length > 0,

    total:
      modules.length,

    loaded,

    failed,

    modules,

    startedAt,

    completedAt:
      Date.now()
  };
}

// ============================================================
// GET LOADED COMPONENT
// ============================================================

export function getLoadedSovereignModule(
  component:
    SovereignFinalComponent
):
  | Record<string, unknown>
  | undefined {
  return liveModules.get(
    component
  );
}

// ============================================================
// FINAL EXECUTION
// ============================================================

async function main():
  Promise<void> {
  console.log(
    "============================================"
  );

  console.log(
    "SOVEREIGN AI PLATFORM"
  );

  console.log(
    "REAL LIVE MODULE EXECUTION"
  );

  console.log(
    "============================================"
  );

  const result =
    await loadAllSovereignRealModules();

  console.log(
    "============================================"
  );

  console.log(
    `TOTAL: ${result.total}`
  );

  console.log(
    `LOADED: ${result.loaded}`
  );

  console.log(
    `FAILED: ${result.failed}`
  );

  if (!result.success) {
    console.error(
      "SOVEREIGN LIVE EXECUTION: BLOCKED"
    );

    console.error(
      "One or more real sovereign modules failed to load."
    );

    process.exitCode = 1;

    return;
  }

  console.log(
    "SOVEREIGN LIVE EXECUTION: SUCCESS"
  );

  console.log(
    "ALL REAL COMPONENT MODULES LOADED"
  );

  console.log(
    "============================================"
  );
}

main().catch(
  error => {
    console.error(
      "SOVEREIGN LIVE EXECUTION: FAILED"
    );

    console.error(
      error instanceof Error
        ? error.stack ??
            error.message
        : String(error)
    );

    process.exitCode = 1;
  }
);

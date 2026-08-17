// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-LIVE-EXECUTION-226.ts
// REAL MODULE LOADING / LIVE EXECUTION GATE
// ============================================================

import {
  getSovereignRealComponentModules,
  resolveSovereignRealComponent
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

export interface SovereignLiveInstanceResult {
  component: SovereignFinalComponent;
  resolved: boolean;
  requiredMethod?: string;
  methodAvailable: boolean;
  error?: string;
}

export interface SovereignLiveExecutionResult {
  success: boolean;

  total: number;
  loaded: number;
  failed: number;

  modules: SovereignLiveModuleResult[];

  instancesTotal: number;
  instancesResolved: number;
  instancesFailed: number;

  instances: SovereignLiveInstanceResult[];

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
// REAL INSTANCE REQUIREMENTS
// ============================================================

const requiredLiveInstances:
  ReadonlyArray<{
    component: SovereignFinalComponent;
    method: string;
  }> = [
    {
      component: "BOOTSTRAP",
      method: "boot"
    },

    {
      component: "AUTONOMOUS_RUNTIME",
      method: "execute"
    },

    {
      component: "PROJECT_BUILDER",
      method: "build"
    },

    {
      component: "PLATFORM_BUILDER",
      method: "build"
    },

    {
      component: "ADMIN_BUILDER",
      method: "build"
    },

    {
      component: "GAME_BUILDER",
      method: "create"
    }
  ];

// ============================================================
// LOAD ONE REAL MODULE
// ============================================================

async function loadRealModule(
  component: SovereignFinalComponent,
  modulePath: string
): Promise<SovereignLiveModuleResult> {
  try {
    const moduleNamespace =
      await import(
        modulePath
      );

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
        Object.keys(
          namespace
        )
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
  Promise<SovereignLiveModuleResult[]> {
  const registry =
    getSovereignRealComponentModules();

  const modules:
    SovereignLiveModuleResult[] = [];

  for (
    const [name, path]
    of Object.entries(
      registry
    )
  ) {
    if (
      typeof path !== "string" ||
      path.length === 0
    ) {
      continue;
    }

    const component =
      name as SovereignFinalComponent;

    const result =
      await loadRealModule(
        component,
        path
      );

    modules.push(
      result
    );

    if (
      result.loaded
    ) {
      console.log(
        `[LIVE MODULE OK] ${name} -> ${path}`
      );

      continue;
    }

    console.error(
      `[LIVE MODULE FAIL] ${name} -> ${path}`
    );

    console.error(
      result.error ??
        "Unknown module loading error."
    );
  }

  return modules;
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
// VERIFY ONE REAL INSTANCE
// ============================================================

async function verifyRealInstance(
  component:
    SovereignFinalComponent,

  requiredMethod:
    string
): Promise<SovereignLiveInstanceResult> {
  try {
    const instance =
      await resolveSovereignRealComponent(
        component
      );

    if (!instance) {
      return {
        component,
        resolved: false,
        requiredMethod,
        methodAvailable: false,
        error:
          `${component} could not be resolved.`
      };
    }

    const candidate =
      instance as Record<
        string,
        unknown
      >;

    const methodAvailable =
      typeof candidate[
        requiredMethod
      ] === "function";

    if (
      !methodAvailable
    ) {
      return {
        component,
        resolved: true,
        requiredMethod,
        methodAvailable: false,
        error:
          `${component} does not expose ${requiredMethod}().`
      };
    }

    return {
      component,
      resolved: true,
      requiredMethod,
      methodAvailable: true
    };
  } catch (error) {
    return {
      component,
      resolved: false,
      requiredMethod,
      methodAvailable: false,
      error:
        error instanceof Error
          ? error.message
          : String(error)
    };
  }
}

// ============================================================
// VERIFY ALL REQUIRED REAL INSTANCES
// ============================================================

export async function verifySovereignLiveInstances():
  Promise<SovereignLiveInstanceResult[]> {
  const results:
    SovereignLiveInstanceResult[] = [];

  for (
    const requirement of
      requiredLiveInstances
  ) {
    const result =
      await verifyRealInstance(
        requirement.component,
        requirement.method
      );

    results.push(
      result
    );

    if (
      result.resolved &&
      result.methodAvailable
    ) {
      console.log(
        `[LIVE INSTANCE OK] ${result.component}.${requirement.method}()`
      );

      continue;
    }

    console.error(
      `[LIVE INSTANCE FAIL] ${result.component}.${requirement.method}()`
    );

    console.error(
      result.error ??
        "Unknown live instance verification error."
    );
  }

  return results;
}

// ============================================================
// EXECUTE COMPLETE LIVE GATE
// ============================================================

export async function executeSovereignLiveGate():
  Promise<SovereignLiveExecutionResult> {
  const startedAt =
    Date.now();

  const modules =
    await loadAllSovereignRealModules();

  const loaded =
    modules.filter(
      module =>
        module.loaded
    ).length;

  const failed =
    modules.length -
    loaded;

  const instances =
    await verifySovereignLiveInstances();

  const instancesResolved =
    instances.filter(
      instance =>
        instance.resolved &&
        instance.methodAvailable
    ).length;

  const instancesFailed =
    instances.length -
    instancesResolved;

  const success =
    modules.length > 0 &&
    failed === 0 &&
    instances.length > 0 &&
    instancesFailed === 0;

  return {
    success,

    total:
      modules.length,

    loaded,

    failed,

    modules,

    instancesTotal:
      instances.length,

    instancesResolved,

    instancesFailed,

    instances,

    startedAt,

    completedAt:
      Date.now()
  };
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
    "REAL LIVE EXECUTION GATE"
  );

  console.log(
    "============================================"
  );

  const result =
    await executeSovereignLiveGate();

  console.log(
    "============================================"
  );

  console.log(
    "REAL MODULES"
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

  console.log(
    "============================================"
  );

  console.log(
    "REAL INSTANCES"
  );

  console.log(
    `TOTAL: ${result.instancesTotal}`
  );

  console.log(
    `RESOLVED: ${result.instancesResolved}`
  );

  console.log(
    `FAILED: ${result.instancesFailed}`
  );

  console.log(
    "============================================"
  );

  if (
    !result.success
  ) {
    console.error(
      "SOVEREIGN LIVE EXECUTION: BLOCKED"
    );

    if (
      result.failed > 0
    ) {
      console.error(
        "One or more real sovereign modules failed to load."
      );
    }

    if (
      result.instancesFailed > 0
    ) {
      console.error(
        "One or more required sovereign runtime instances failed verification."
      );
    }

    process.exitCode =
      1;

    return;
  }

  console.log(
    "SOVEREIGN LIVE EXECUTION: SUCCESS"
  );

  console.log(
    "ALL REAL COMPONENT MODULES LOADED"
  );

  console.log(
    "ALL REQUIRED REAL INSTANCES VERIFIED"
  );

  console.log(
    "SOVEREIGN AI PLATFORM LIVE GATE: READY"
  );

  console.log(
    "============================================"
  );
}

// ============================================================
// START
// ============================================================

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

    process.exitCode =
      1;
  }
);

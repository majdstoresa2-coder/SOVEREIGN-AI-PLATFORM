// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-REAL-BINDINGS-TEST-225.ts
// REAL COMPONENT BINDINGS VALIDATION
// ============================================================

import {
  getSovereignRealComponentModules,
  resolveSovereignRealComponent
} from "./SOVEREIGN-AI-REAL-COMPONENT-BINDINGS-224.ts";

import type {
  SovereignFinalComponent
} from "./SOVEREIGN-AI-FINAL-LAUNCHER-221.ts";

// ============================================================
// ASSERT HELPERS
// ============================================================

function assertFunction(
  instance: unknown,
  method: string,
  component: string
): void {
  if (
    !instance ||
    typeof instance !== "object"
  ) {
    throw new Error(
      `${component} did not resolve to a valid instance.`
    );
  }

  const candidate =
    instance as Record<
      string,
      unknown
    >;

  if (
    typeof candidate[method] !==
    "function"
  ) {
    throw new Error(
      `${component} does not expose ${method}().`
    );
  }
}

// ============================================================
// COMPONENT RESOLUTION TEST
// ============================================================

async function testComponentResolution():
  Promise<number> {
  const modules =
    getSovereignRealComponentModules();

  const entries =
    Object.entries(modules);

  if (
    entries.length === 0
  ) {
    throw new Error(
      "No sovereign component bindings registered."
    );
  }

  let passed = 0;

  for (
    const [
      name,
      modulePath
    ] of entries
  ) {
    const component =
      name as
        SovereignFinalComponent;

    if (
      typeof modulePath !==
        "string" ||
      modulePath.length === 0
    ) {
      throw new Error(
        `Invalid module path for ${component}`
      );
    }

    const resolved =
      await resolveSovereignRealComponent(
        component
      );

    if (!resolved) {
      throw new Error(
        `Failed to resolve ${component}`
      );
    }

    passed += 1;

    console.log(
      `[PASS] ${component} -> ${modulePath}`
    );
  }

  if (
    passed !== entries.length
  ) {
    throw new Error(
      `Binding mismatch: ${passed}/${entries.length}`
    );
  }

  return passed;
}

// ============================================================
// REAL INSTANCE TESTS
// ============================================================

async function testRealInstances():
  Promise<void> {
  // ----------------------------------------------------------
  // BOOTSTRAP
  // ----------------------------------------------------------

  const bootstrap =
    await resolveSovereignRealComponent(
      "BOOTSTRAP"
    );

  assertFunction(
    bootstrap,
    "boot",
    "BOOTSTRAP"
  );

  console.log(
    "[PASS] BOOTSTRAP exposes boot()"
  );

  // ----------------------------------------------------------
  // AUTONOMOUS RUNTIME
  // ----------------------------------------------------------

  const autonomousRuntime =
    await resolveSovereignRealComponent(
      "AUTONOMOUS_RUNTIME"
    );

  assertFunction(
    autonomousRuntime,
    "execute",
    "AUTONOMOUS_RUNTIME"
  );

  console.log(
    "[PASS] AUTONOMOUS_RUNTIME exposes execute()"
  );

  // ----------------------------------------------------------
  // PLATFORM BUILDER
  // ----------------------------------------------------------

  const platformBuilder =
    await resolveSovereignRealComponent(
      "PLATFORM_BUILDER"
    );

  assertFunction(
    platformBuilder,
    "build",
    "PLATFORM_BUILDER"
  );

  console.log(
    "[PASS] PLATFORM_BUILDER exposes build()"
  );

  // ----------------------------------------------------------
  // ADMIN BUILDER
  // ----------------------------------------------------------

  const adminBuilder =
    await resolveSovereignRealComponent(
      "ADMIN_BUILDER"
    );

  assertFunction(
    adminBuilder,
    "build",
    "ADMIN_BUILDER"
  );

  console.log(
    "[PASS] ADMIN_BUILDER exposes build()"
  );

  // ----------------------------------------------------------
  // GAME BUILDER
  // ----------------------------------------------------------

  const gameBuilder =
    await resolveSovereignRealComponent(
      "GAME_BUILDER"
    );

  assertFunction(
    gameBuilder,
    "create",
    "GAME_BUILDER"
  );

  console.log(
    "[PASS] GAME_BUILDER exposes create()"
  );

  // ----------------------------------------------------------
  // PROJECT / CAPABILITY BUILDER
  // ----------------------------------------------------------

  const projectBuilder =
    await resolveSovereignRealComponent(
      "PROJECT_BUILDER"
    );

  assertFunction(
    projectBuilder,
    "build",
    "PROJECT_BUILDER"
  );

  console.log(
    "[PASS] PROJECT_BUILDER exposes build()"
  );
}

// ============================================================
// MAIN TEST
// ============================================================

async function main():
  Promise<void> {
  console.log(
    "============================================"
  );

  console.log(
    "SOVEREIGN AI REAL BINDINGS TEST"
  );

  console.log(
    "============================================"
  );

  console.log(
    "[TEST] Component module resolution"
  );

  const passed =
    await testComponentResolution();

  console.log(
    "--------------------------------------------"
  );

  console.log(
    "[TEST] Real builder/runtime instances"
  );

  await testRealInstances();

  console.log(
    "============================================"
  );

  console.log(
    "SOVEREIGN REAL BINDINGS TEST: SUCCESS"
  );

  console.log(
    `COMPONENTS VERIFIED: ${passed}`
  );

  console.log(
    "REAL RUNTIME/BUILDERS VERIFIED: YES"
  );

  console.log(
    "224 REAL BINDING LAYER: VERIFIED"
  );

  console.log(
    "============================================"
  );
}

// ============================================================
// EXECUTION
// ============================================================

main().catch(
  error => {
    console.error(
      "============================================"
    );

    console.error(
      "SOVEREIGN REAL BINDINGS TEST: FAILED"
    );

    console.error(
      error instanceof Error
        ? error.stack ??
          error.message
        : String(error)
    );

    console.error(
      "============================================"
    );

    process.exitCode = 1;
  }
);

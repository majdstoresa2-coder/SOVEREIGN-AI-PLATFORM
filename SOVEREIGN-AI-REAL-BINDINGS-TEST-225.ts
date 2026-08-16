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

async function main(): Promise<void> {
  console.log(
    "============================================"
  );
  console.log(
    "SOVEREIGN AI REAL BINDINGS TEST"
  );
  console.log(
    "============================================"
  );

  const modules =
    getSovereignRealComponentModules();

  const entries =
    Object.entries(modules);

  if (entries.length === 0) {
    throw new Error(
      "No sovereign component bindings registered."
    );
  }

  let passed = 0;

  for (
    const [name, modulePath]
    of entries
  ) {
    const component =
      name as SovereignFinalComponent;

    if (
      typeof modulePath !== "string" ||
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

    passed++;

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
    "============================================"
  );
}

main().catch(
  error => {
    console.error(
      "SOVEREIGN REAL BINDINGS TEST: FAILED"
    );

    console.error(
      error instanceof Error
        ? error.stack ?? error.message
        : String(error)
    );

    process.exitCode = 1;
  }
);

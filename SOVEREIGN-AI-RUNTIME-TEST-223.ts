// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-RUNTIME-TEST-223.ts
// FINAL RUNTIME SMOKE / INTEGRATION TEST
// ============================================================

import {
  SovereignAIFinalRuntime
} from "./SOVEREIGN-AI-FINAL-RUNTIME-222.ts";

import type {
  SovereignFinalComponent,
  SovereignFinalLaunchResult
} from "./SOVEREIGN-AI-FINAL-LAUNCHER-221.ts";

// ============================================================
// TEST COMPONENT
// ============================================================

class SovereignTestComponent {
  constructor(
    public readonly name: string
  ) {}

  public async connect():
    Promise<void> {
    return;
  }

  public async healthCheck():
    Promise<boolean> {
    return true;
  }
}

// ============================================================
// BOOTSTRAP TEST COMPONENT
// ============================================================

class SovereignTestBootstrap
  extends SovereignTestComponent
{
  public async boot(
    payload: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return {
      id:
        `bootstrap-${Date.now()}`,

      ready: true,

      state: "RUNNING",

      runtimeId:
        `runtime-${Date.now()}`,

      liveTarget:
        "http://127.0.0.1:3000",

      request:
        payload
    };
  }
}

// ============================================================
// AUTONOMOUS RUNTIME TEST COMPONENT
// ============================================================

class SovereignTestAutonomousRuntime
  extends SovereignTestComponent
{
  public async execute(
    payload: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const type =
      typeof payload["type"] ===
        "string"
        ? payload["type"]
        : "GENERAL";

    return {
      id:
        `execution-${Date.now()}`,

      type,

      state:
        "COMPLETED",

      liveTarget:
        "http://127.0.0.1:3000",

      verification: {
        success: true,

        visible: true,

        healthy: true,

        functional: true,

        playable:
          type === "GAME"
            ? true
            : undefined
      }
    };
  }
}

// ============================================================
// COMPONENT REGISTRY
// ============================================================

const components =
  new Map<
    SovereignFinalComponent,
    unknown
  >();

function register(
  component:
    SovereignFinalComponent,
  instance?: unknown
): void {
  components.set(
    component,
    instance ??
      new SovereignTestComponent(
        component
      )
  );
}

// ============================================================
// REGISTER ALL REQUIRED COMPONENTS
// ============================================================

const requiredComponents:
  SovereignFinalComponent[] = [
    "AUTHORITY",
    "STEWARD",
    "CORE",
    "RUNTIME",

    "MASTER_BRAIN",
    "PLANNER",
    "EXECUTOR",
    "VERIFIER",
    "REPAIR",

    "CODE_ENGINE",
    "CODE_WORKSPACE",
    "TEST_ENGINE",
    "BUILD_ENGINE",
    "DEPLOYMENT_ENGINE",

    "AUTOMATION_ENGINE",
    "WORKER_ENGINE",
    "COORDINATOR",
    "CAPABILITY_REGISTRY",

    "EXECUTION_SCHEDULER",
    "RESOURCE_MANAGER",
    "CAPACITY_PLANNER",
    "LOAD_BALANCER",
    "EXECUTION_SUPERVISOR",

    "OUTCOME_EVALUATOR",
    "EXPERIENCE_LEARNING",

    "KNOWLEDGE_SYNTHESIS",
    "KNOWLEDGE_RETRIEVAL",
    "KNOWLEDGE_GUIDANCE",

    "DECISION_CONTEXT",
    "DECISION_ASSURANCE",
    "EXECUTION_AUTHORIZATION",

    "MASTER_INTEGRATION",
    "MAJD_KNOWLEDGE",
    "OWNER_COMMAND_GATEWAY",

    "PROJECT_BUILDER",
    "PLATFORM_BUILDER",
    "ADMIN_BUILDER",
    "GAME_BUILDER",

    "SELF_TEST_REPAIR",
    "RELEASE_MANAGER",

    "KNOWLEDGE_INGESTION",
    "KNOWLEDGE_REASONING",
    "EXTERNAL_PLATFORM_INTELLIGENCE",

    "SYSTEM_INTEGRATION"
  ];

for (
  const component of
    requiredComponents
) {
  register(component);
}

register(
  "BOOTSTRAP",
  new SovereignTestBootstrap(
    "BOOTSTRAP"
  )
);

register(
  "AUTONOMOUS_RUNTIME",
  new SovereignTestAutonomousRuntime(
    "AUTONOMOUS_RUNTIME"
  )
);

// ============================================================
// FINAL RUNTIME
// ============================================================

const runtime =
  new SovereignAIFinalRuntime({
    ownerId:
      "OWNER-MAJD",

    projectId:
      "SOVEREIGN-AI-PLATFORM",

    autonomous:
      true,

    instruction:
      "Start Majd sovereign platform and verify runtime.",

    liveTarget:
      "http://127.0.0.1:3000",

    componentResolver:
      async component => {
        return components.get(
          component
        );
      },

    componentHealthCheck:
      async (
        component,
        instance
      ) => {
        if (!instance) {
          return {
            healthy: false,

            errors: [
              `${component} instance missing.`
            ]
          };
        }

        return {
          healthy: true,
          errors: []
        };
      },

    runtimeVerifier:
      async (
        _request,
        runtimeResult
      ) => {
        return (
          runtimeResult.success &&
          runtimeResult.running &&
          runtimeResult.healthy &&
          runtimeResult.visible &&
          runtimeResult.errors.length ===
            0
        );
      },

    onEvent:
      async event => {
        const type =
          typeof event["type"] ===
            "string"
            ? event["type"]
            : "EVENT";

        console.log(
          `[SOVEREIGN EVENT] ${type}`
        );
      }
  });

// ============================================================
// RESULT VALIDATION
// ============================================================

function verifyResult(
  result:
    SovereignFinalLaunchResult
): void {
  if (
    result.state !== "RUNNING"
  ) {
    throw new Error(
      `Expected RUNNING, received ${result.state}. ${result.error ?? ""}`
    );
  }

  if (!result.ready) {
    throw new Error(
      "Final launcher did not report ready=true."
    );
  }

  if (
    !result.integration
      ?.success
  ) {
    throw new Error(
      `Integration failed: ${
        result.integration
          ?.errors.join("; ") ??
        "unknown"
      }`
    );
  }

  if (
    result.integration
      .missing.length > 0
  ) {
    throw new Error(
      `Missing components: ${result.integration.missing.join(
        ", "
      )}`
    );
  }

  if (
    result.integration
      .unhealthy.length > 0
  ) {
    throw new Error(
      `Unhealthy components: ${result.integration.unhealthy.join(
        ", "
      )}`
    );
  }

  if (
    !result.bootstrap
      ?.success
  ) {
    throw new Error(
      `Bootstrap failed: ${
        result.bootstrap
          ?.errors.join("; ") ??
        "unknown"
      }`
    );
  }

  if (
    !result.runtime
      ?.success ||
    !result.runtime.running ||
    !result.runtime.healthy ||
    !result.runtime.visible
  ) {
    throw new Error(
      `Runtime verification failed: ${
        result.runtime
          ?.errors.join("; ") ??
        "unknown"
      }`
    );
  }

  if (!result.liveTarget) {
    throw new Error(
      "Runtime completed without liveTarget."
    );
  }
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
    "SOVEREIGN AI PLATFORM"
  );

  console.log(
    "FINAL RUNTIME TEST"
  );

  console.log(
    "============================================"
  );

  console.log(
    "Starting final sovereign runtime..."
  );

  const result =
    await runtime.launch(
      "Start Majd sovereign platform and verify complete sovereign runtime."
    );

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  verifyResult(result);

  console.log(
    "============================================"
  );

  console.log(
    "SOVEREIGN RUNTIME TEST: SUCCESS"
  );

  console.log(
    `STATE: ${result.state}`
  );

  console.log(
    `READY: ${result.ready}`
  );

  console.log(
    `LIVE TARGET: ${result.liveTarget}`
  );

  console.log(
    `RUNTIME ACTIVE: ${runtime.isRunning()}`
  );

  console.log(
    "============================================"
  );
}

// ============================================================
// EXECUTE
// ============================================================

main().catch(
  error => {
    console.error(
      "============================================"
    );

    console.error(
      "SOVEREIGN RUNTIME TEST: FAILED"
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

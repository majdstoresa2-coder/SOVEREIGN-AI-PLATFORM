// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-REAL-BINDINGS-TEST-225.ts
// REAL COMPONENT BINDINGS + REAL WEB GAME VALIDATION
// BLACK-SCREEN / EMPTY-RENDER / BUILD-GATE TEST
// ============================================================

import fs from "node:fs/promises";
import path from "node:path";

import {
  executeMajdSovereignCreation,
  getSovereignRealComponentModules,
  resolveSovereignRealComponent
} from "./SOVEREIGN-AI-REAL-COMPONENT-BINDINGS-224.ts";

import type {
  SovereignFinalComponent
} from "./SOVEREIGN-AI-FINAL-LAUNCHER-221.ts";

// ============================================================
// CONSTANTS
// ============================================================

const TEST_OWNER_ID =
  "OWNER-MAJD";

const TEST_PROJECT_ID =
  "sovereign-225-real-render-test";

const TEST_INSTRUCTION =
  "أنشئ لعبة اختبار سيادية حقيقية قابلة للتشغيل بعالم ظاهر وقلعة ومبانٍ ولاعب وتحكم، مع WebGL 3D وCanvas 2D fallback، ولا تسمح بالشاشة السوداء أو render فارغ.";

const REQUIRED_BUILD_FILES = [
  "index.html",
  "styles.css",
  "game.js",
  "majd-engine.js",
  "majd-world.js",
  "majd-rights.json"
] as const;

// ============================================================
// ASSERT HELPERS
// ============================================================

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(
      message
    );
  }
}

function assertFunction(
  instance: unknown,
  method: string,
  component: string
): void {
  assert(
    !!instance &&
      typeof instance ===
        "object",
    `${component} did not resolve to a valid instance.`
  );

  const candidate =
    instance as Record<
      string,
      unknown
    >;

  assert(
    typeof candidate[
      method
    ] ===
      "function",
    `${component} does not expose ${method}().`
  );
}

async function assertFile(
  absolutePath: string,
  minimumBytes = 1
): Promise<void> {
  let stat;

  try {
    stat =
      await fs.stat(
        absolutePath
      );
  } catch {
    throw new Error(
      `Required physical file is missing: ${absolutePath}`
    );
  }

  assert(
    stat.isFile(),
    `Expected file but found another filesystem type: ${absolutePath}`
  );

  assert(
    stat.size >=
      minimumBytes,
    `Physical file is empty or too small: ${absolutePath}`
  );
}

async function readRequiredFile(
  absolutePath: string
): Promise<string> {
  await assertFile(
    absolutePath
  );

  return fs.readFile(
    absolutePath,
    "utf8"
  );
}

function assertContains(
  source: string,
  token: string,
  message: string
): void {
  assert(
    source.includes(
      token
    ),
    message
  );
}

function assertNotContains(
  source: string,
  token: string,
  message: string
): void {
  assert(
    !source.includes(
      token
    ),
    message
  );
}

// ============================================================
// COMPONENT RESOLUTION TEST
// ============================================================

async function testComponentResolution():
  Promise<number> {
  const modules =
    getSovereignRealComponentModules();

  const entries =
    Object.entries(
      modules
    );

  assert(
    entries.length >
      0,
    "No sovereign component bindings registered."
  );

  let passed =
    0;

  for (
    const [
      name,
      modulePath
    ] of entries
  ) {
    const component =
      name as
        SovereignFinalComponent;

    assert(
      typeof modulePath ===
        "string" &&
        modulePath.length >
          0,
      `Invalid module path for ${component}`
    );

    const resolved =
      await resolveSovereignRealComponent(
        component
      );

    assert(
      !!resolved,
      `Failed to resolve ${component}`
    );

    passed +=
      1;

    console.log(
      `[PASS] ${component} -> ${modulePath}`
    );
  }

  assert(
    passed ===
      entries.length,
    `Binding mismatch: ${passed}/${entries.length}`
  );

  return passed;
}

// ============================================================
// REAL INSTANCE TESTS
// ============================================================

async function testRealInstances():
  Promise<void> {
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
// REAL BUILD TEST
// ============================================================

async function testRealSovereignGameBuild():
  Promise<{
    buildPath: string;
    launchTarget: string;
  }> {
  console.log(
    "[TEST] Executing real sovereign game creation"
  );

  const result =
    await executeMajdSovereignCreation({
      ownerId:
        TEST_OWNER_ID,

      projectId:
        TEST_PROJECT_ID,

      instruction:
        TEST_INSTRUCTION,

      productType:
        "GAME",

      autonomous:
        true
    });

  if (
    result.errors.length >
    0
  ) {
    console.log(
      "[BUILD ERRORS]",
      result.errors
    );
  }

  assert(
    result.success ===
      true,
    `Real game build did not succeed: ${result.errors.join("; ")}`
  );

  assert(
    result.state ===
      "READY",
    `Expected READY state but received ${result.state}`
  );

  assert(
    result.playable ===
      true,
    "Real game build was not marked playable."
  );

  assert(
    result.quality
      ?.success ===
      true,
    `Quality gate failed: ${result.quality?.errors.join("; ") ?? "quality result unavailable"}`
  );

  assert(
    result.rights
      ?.success ===
      true,
    `Rights gate failed: ${result.rights?.errors.join("; ") ?? "rights result unavailable"}`
  );

  assert(
    typeof result.buildPath ===
      "string" &&
      result.buildPath.length >
        0,
    "Real buildPath was not produced."
  );

  assert(
    typeof result.launchTarget ===
      "string" &&
      result.launchTarget.length >
        0,
    "Real launchTarget was not produced."
  );

  await assertFile(
    result.launchTarget
  );

  console.log(
    `[PASS] Real build: ${result.buildPath}`
  );

  console.log(
    `[PASS] Real launch target: ${result.launchTarget}`
  );

  return {
    buildPath:
      result.buildPath,

    launchTarget:
      result.launchTarget
  };
}

// ============================================================
// REQUIRED PHYSICAL FILE TEST
// ============================================================

async function testPhysicalBuildFiles(
  buildPath: string
): Promise<void> {
  for (
    const fileName of
      REQUIRED_BUILD_FILES
  ) {
    const absolutePath =
      path.join(
        buildPath,
        fileName
      );

    await assertFile(
      absolutePath,
      10
    );

    console.log(
      `[PASS] Physical file exists: ${fileName}`
    );
  }
}

// ============================================================
// WEB ENTRY VALIDATION
// ============================================================

async function testWebEntry(
  buildPath: string
): Promise<void> {
  const indexSource =
    await readRequiredFile(
      path.join(
        buildPath,
        "index.html"
      )
    );

  assertContains(
    indexSource,
    "<canvas",
    "index.html does not contain the MAJD game canvas."
  );

  assertContains(
    indexSource,
    'id="majd-game"',
    "index.html is missing #majd-game."
  );

  assertContains(
    indexSource,
    'src="./game.js"',
    "index.html is not connected to game.js."
  );

  console.log(
    "[PASS] index.html contains real game canvas and runtime entry"
  );
}

// ============================================================
// ENGINE VALIDATION
// ============================================================

async function testEngineSource(
  buildPath: string
): Promise<void> {
  const engineSource =
    await readRequiredFile(
      path.join(
        buildPath,
        "majd-engine.js"
      )
    );

  assertContains(
    engineSource,
    '"webgl2"',
    "WebGL2 initialization is missing."
  );

  assertContains(
    engineSource,
    '"webgl"',
    "WebGL fallback initialization is missing."
  );

  assertContains(
    engineSource,
    '"2d"',
    "Canvas 2D fallback is missing."
  );

  assertContains(
    engineSource,
    "switchTo2D",
    "Automatic WebGL -> Canvas 2D fallback is missing."
  );

  assertContains(
    engineSource,
    "lastTimestamp",
    "Delta-time runtime tracking is missing."
  );

  assertContains(
    engineSource,
    "scene.render3D",
    "Engine is not connected to render3D()."
  );

  assertContains(
    engineSource,
    "scene.render2D",
    "Engine is not connected to render2D()."
  );

  console.log(
    "[PASS] MAJD engine contains WebGL + Canvas 2D fallback"
  );
}

// ============================================================
// WORLD VALIDATION
// ============================================================

async function testWorldSource(
  buildPath: string
): Promise<void> {
  const worldSource =
    await readRequiredFile(
      path.join(
        buildPath,
        "majd-world.js"
      )
    );

  const requiredWorldTokens = [
    "playerStart",
    "castle",
    "towers",
    "buildings",
    "dragon",
    "terrain",
    "environment",
    "resources"
  ];

  for (
    const token of
      requiredWorldTokens
  ) {
    assertContains(
      worldSource,
      token,
      `Renderable world data is missing: ${token}`
    );
  }

  console.log(
    "[PASS] MAJD world contains renderable world entities"
  );
}

// ============================================================
// BLACK SCREEN / EMPTY RENDER TEST
// ============================================================

async function testRealRenderer(
  buildPath: string
): Promise<void> {
  const gameSource =
    await readRequiredFile(
      path.join(
        buildPath,
        "game.js"
      )
    );

  assertContains(
    gameSource,
    "render3D",
    "3D renderer is missing."
  );

  assertContains(
    gameSource,
    "render2D",
    "2D renderer is missing."
  );

  assertContains(
    gameSource,
    "renderGeometry",
    "Real WebGL geometry rendering is missing."
  );

  assertContains(
    gameSource,
    "gl.draw",
    "No WebGL draw call exists."
  );

  assertContains(
    gameSource,
    "ctx.fill",
    "No Canvas 2D drawing operations exist."
  );

  assertContains(
    gameSource,
    "MAJD_GAME_PROOF",
    "MAJD_GAME_PROOF runtime evidence is missing."
  );

  assertContains(
    gameSource,
    "renderedFrames",
    "Rendered frame proof is missing."
  );

  assertContains(
    gameSource,
    "visibleObjects",
    "Visible object proof is missing."
  );

  assertContains(
    gameSource,
    "blankFrame",
    "Blank-frame protection is missing."
  );

  assertContains(
    gameSource,
    "proof.blankFrame =",
    "Renderer does not update blank-frame state."
  );

  assertContains(
    gameSource,
    "proof.runtimeStarted =",
    "Renderer does not confirm runtime start."
  );

  assertContains(
    gameSource,
    "proof.renderedFrames +=",
    "Renderer does not count rendered frames."
  );

  // Detect the exact old broken pattern.
  assertNotContains(
    gameSource,
    `render(gl,runtime) {
void gl;
void runtime;
}`,
    "OLD EMPTY WEBGL RENDERER DETECTED."
  );

  assertNotContains(
    gameSource,
    `render(gl, runtime) {
  void gl;
  void runtime;
}`,
    "EMPTY WEBGL RENDERER DETECTED."
  );

  console.log(
    "[PASS] Empty renderer / black-screen implementation is not present"
  );

  console.log(
    "[PASS] Real 3D and 2D drawing implementation exists"
  );
}

// ============================================================
// INPUT TEST
// ============================================================

async function testInputRuntime(
  buildPath: string
): Promise<void> {
  const gameSource =
    await readRequiredFile(
      path.join(
        buildPath,
        "game.js"
      )
    );

  const requiredInputTokens = [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "pointerdown",
    "pointerup",
    "player.speed",
    "delta"
  ];

  for (
    const token of
      requiredInputTokens
  ) {
    assertContains(
      gameSource,
      token,
      `Playable input runtime is missing: ${token}`
    );
  }

  console.log(
    "[PASS] Keyboard + pointer/touch movement runtime exists"
  );
}

// ============================================================
// SECURITY / RIGHTS STATIC TEST
// ============================================================

async function testSovereignSourcePolicy(
  buildPath: string
): Promise<void> {
  const sourceFiles = [
    "game.js",
    "majd-engine.js",
    "majd-world.js"
  ];

  const contents =
    await Promise.all(
      sourceFiles.map(
        async file =>
          readRequiredFile(
            path.join(
              buildPath,
              file
            )
          )
      )
    );

  const combined =
    contents.join(
      "\n"
    );

  const forbiddenRuntimeTokens = [
    'from "three',
    "from 'three",
    'from "babylon',
    "from 'babylon",
    'from "unity',
    "from 'unity",
    'from "unreal',
    "from 'unreal",
    'from "godot',
    "from 'godot",
    "eval(",
    "new Function(",
    "child_process"
  ];

  for (
    const token of
      forbiddenRuntimeTokens
  ) {
    assertNotContains(
      combined,
      token,
      `Forbidden runtime dependency/token found: ${token}`
    );
  }

  console.log(
    "[PASS] Sovereign runtime policy validated"
  );
}

// ============================================================
// LAUNCH TARGET TEST
// ============================================================

async function testLaunchTarget(
  buildPath: string,
  launchTarget: string
): Promise<void> {
  const expected =
    path.resolve(
      buildPath,
      "index.html"
    );

  const actual =
    path.resolve(
      launchTarget
    );

  assert(
    actual ===
      expected,
    `launchTarget mismatch.
Expected: ${expected}
Actual:   ${actual}`
  );

  console.log(
    "[PASS] launchTarget points to real build/index.html"
  );
}

// ============================================================
// MAIN
// ============================================================

async function main():
  Promise<void> {
  console.log(
    "============================================================"
  );

  console.log(
    "SOVEREIGN AI REAL BINDINGS + REAL WEB GAME TEST 225"
  );

  console.log(
    "============================================================"
  );

  console.log(
    "[TEST 1] Component module resolution"
  );

  const passedComponents =
    await testComponentResolution();

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "[TEST 2] Real runtime/builder instances"
  );

  await testRealInstances();

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "[TEST 3] Real sovereign physical game build"
  );

  const {
    buildPath,
    launchTarget
  } =
    await testRealSovereignGameBuild();

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "[TEST 4] Required physical files"
  );

  await testPhysicalBuildFiles(
    buildPath
  );

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "[TEST 5] Deployable Web entry"
  );

  await testWebEntry(
    buildPath
  );

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "[TEST 6] MAJD 3D/2D engine"
  );

  await testEngineSource(
    buildPath
  );

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "[TEST 7] Renderable MAJD world"
  );

  await testWorldSource(
    buildPath
  );

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "[TEST 8] Black-screen / empty-render protection"
  );

  await testRealRenderer(
    buildPath
  );

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "[TEST 9] Keyboard + mobile controls"
  );

  await testInputRuntime(
    buildPath
  );

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "[TEST 10] Sovereign dependency/security policy"
  );

  await testSovereignSourcePolicy(
    buildPath
  );

  console.log(
    "------------------------------------------------------------"
  );

  console.log(
    "[TEST 11] Real launch target"
  );

  await testLaunchTarget(
    buildPath,
    launchTarget
  );

  console.log(
    "============================================================"
  );

  console.log(
    "SOVEREIGN REAL BINDINGS TEST 225: SUCCESS"
  );

  console.log(
    `COMPONENTS VERIFIED: ${passedComponents}`
  );

  console.log(
    "REAL RUNTIME/BUILDERS VERIFIED: YES"
  );

  console.log(
    "PHYSICAL WEB BUILD VERIFIED: YES"
  );

  console.log(
    "INDEX.HTML VERIFIED: YES"
  );

  console.log(
    "WEBGL 3D VERIFIED: YES"
  );

  console.log(
    "CANVAS 2D FALLBACK VERIFIED: YES"
  );

  console.log(
    "EMPTY RENDERER BLOCKED: YES"
  );

  console.log(
    "BLACK-SCREEN IMPLEMENTATION BLOCKED: YES"
  );

  console.log(
    "INPUT RUNTIME VERIFIED: YES"
  );

  console.log(
    "QUALITY GATE VERIFIED: YES"
  );

  console.log(
    "RIGHTS GATE VERIFIED: YES"
  );

  console.log(
    "224 REAL BINDING LAYER: VERIFIED"
  );

  console.log(
    "============================================================"
  );
}

// ============================================================
// EXECUTION
// ============================================================

main().catch(
  error => {
    console.error(
      "============================================================"
    );

    console.error(
      "SOVEREIGN REAL BINDINGS TEST 225: FAILED"
    );

    console.error(
      error instanceof Error
        ? error.stack ??
          error.message
        : String(error)
    );

    console.error(
      "============================================================"
    );

    process.exitCode =
      1;
  }
);

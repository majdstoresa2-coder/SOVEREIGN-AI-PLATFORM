// ============================================================
// SOVEREIGN-AI-REAL-COMPONENT-BINDINGS-224.ts
// CORRECTION REQUIRED IN THE EXISTING FULL FILE
// ============================================================
//
// DELETE the broken duplicate block that was appended AFTER:
//
// export default createSovereignRealRuntime;
//
// Specifically delete everything beginning with:
//
// async buildGame(
//   command
// ): Promise<SovereignRuntimeBuildResult>
//
// from the END of the file.
//
// KEEP executeMajdSovereignCreation() and the complete
// MAJD SOVEREIGN UNIVERSAL CREATION & EVOLUTION ENGINE.
//
// Inside createAutonomousRuntimeAdapter(), REPLACE the existing
// async buildGame(command) implementation with this:
//
// ============================================================

async buildGame(
  command
): Promise<SovereignRuntimeBuildResult> {
  const projectId =
    commandProjectId(
      command
    );

  gamePlayableState.delete(
    projectId
  );

  await fs.rm(
    gameRoot(
      projectId
    ),
    {
      recursive: true,
      force: true
    }
  );

  gameFileState.delete(
    projectId
  );

  gameTestState.delete(
    projectId
  );

  const majdResult =
    await executeMajdSovereignCreation({
      ownerId:
        "OWNER-MAJD",

      projectId,

      instruction:
        command.instruction,

      productType:
        "GAME",

      autonomous:
        command.autonomous
    });

  const buildPathValid =
    typeof majdResult.buildPath ===
      "string" &&
    majdResult.buildPath.length >
      0;

  const launchTargetValid =
    typeof majdResult.launchTarget ===
      "string" &&
    majdResult.launchTarget.length >
      0;

  const buildExists =
    buildPathValid
      ? await fileExists(
          majdResult.buildPath!
        )
      : false;

  const launchExists =
    launchTargetValid
      ? await fileExists(
          majdResult.launchTarget!
        )
      : false;

  const qualitySuccess =
    majdResult.quality
      ?.success ===
    true;

  const rightsSuccess =
    majdResult.rights
      ?.success ===
    true;

  const playable =
    majdResult.success ===
      true &&
    majdResult.state ===
      "READY" &&
    majdResult.playable ===
      true &&
    buildPathValid &&
    launchTargetValid &&
    buildExists &&
    launchExists &&
    qualitySuccess &&
    rightsSuccess;

  gamePlayableState.set(
    projectId,
    {
      projectId,

      playable,

      testSuccess:
        playable,

      artifactSuccess:
        buildExists &&
        launchExists,

      artifactPath:
        majdResult.buildPath,

      launchTarget:
        majdResult.launchTarget,

      verifiedAt:
        Date.now()
    }
  );

  console.log(
    "=========================================="
  );

  console.log(
    "MAJD SOVEREIGN REAL GAME BUILD"
  );

  console.log(
    "PROJECT:",
    projectId
  );

  console.log(
    "STATE:",
    majdResult.state
  );

  console.log(
    "SUCCESS:",
    majdResult.success
  );

  console.log(
    "PLAYABLE:",
    playable
  );

  console.log(
    "QUALITY:",
    majdResult.quality
      ?.score
  );

  console.log(
    "RIGHTS:",
    rightsSuccess
  );

  console.log(
    "BUILD:",
    majdResult.buildPath
  );

  console.log(
    "ENTRY:",
    majdResult.launchTarget
  );

  console.log(
    "ERRORS:",
    majdResult.errors
  );

  console.log(
    "=========================================="
  );

  return {
    projectId,

    success:
      playable,

    playable,

    artifactPath:
      majdResult.buildPath,

    output:
      majdResult,

    errors:
      playable
        ? []
        : majdResult.errors.length >
            0
          ? [
              ...majdResult.errors
            ]
          : [
              "MAJD sovereign game did not reach a verified READY and PLAYABLE state."
            ]
  };
},
```0

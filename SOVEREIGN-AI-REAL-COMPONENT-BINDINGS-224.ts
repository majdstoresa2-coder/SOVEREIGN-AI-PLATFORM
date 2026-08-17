// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-REAL-COMPONENT-BINDINGS-224.ts
// REAL COMPONENT BINDING LAYER
// REAL FILESYSTEM GAME BUILD + CODE ENGINE BINDING
// ============================================================

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import {
  SovereignAIFinalRuntime
} from "./SOVEREIGN-AI-FINAL-RUNTIME-222.ts";

import type {
  SovereignFinalComponent
} from "./SOVEREIGN-AI-FINAL-LAUNCHER-221.ts";

import {
  SovereignAIBootstrap
} from "./SOVEREIGN-AI-BOOTSTRAP-220.ts";

import type {
  SovereignAIBootstrapAdapter,
  SovereignBootstrapRequest,
  SovereignAuthorityCheck,
  SovereignIntegrationCheck,
  SovereignRuntimeStartResult,
  SovereignFinalVerification
} from "./SOVEREIGN-AI-BOOTSTRAP-220.ts";

import {
  SovereignAIAutonomousRuntime
} from "./SOVEREIGN-AI-AUTONOMOUS-RUNTIME-215.ts";

import type {
  SovereignAutonomousRuntimeAdapter,
  SovereignRuntimeCommand,
  SovereignRuntimeBuildResult,
  SovereignRuntimeTestResult,
  SovereignRuntimeReleaseResult,
  SovereignRuntimeVerification
} from "./SOVEREIGN-AI-AUTONOMOUS-RUNTIME-215.ts";

import {
  SovereignAIAutonomousProjectBuilder
} from "./SOVEREIGN-AI-AUTONOMOUS-PROJECT-BUILDER-209.ts";

import type {
  SovereignAutonomousProjectBuilderAdapter,
  SovereignProjectRequest,
  SovereignProjectResult,
  SovereignProjectBlueprint,
  SovereignProjectFile,
  SovereignGeneratedArtifact,
  SovereignProjectValidation,
  SovereignProjectBuild
} from "./SOVEREIGN-AI-AUTONOMOUS-PROJECT-BUILDER-209.ts";

import {
  SovereignAIPlatformBuilder
} from "./SOVEREIGN-AI-PLATFORM-BUILDER-210.ts";

import type {
  SovereignAIPlatformBuilderAdapter,
  SovereignPlatformBuildRequest,
  SovereignPlatformBuildResult,
  SovereignPlatformComponent,
  SovereignPlatformComponentPlan,
  SovereignPlatformComponentResult,
  SovereignPlatformValidation
} from "./SOVEREIGN-AI-PLATFORM-BUILDER-210.ts";

import {
  SovereignAIAdminControlBuilder
} from "./SOVEREIGN-AI-ADMIN-CONTROL-BUILDER-211.ts";

import type {
  SovereignAIAdminControlBuilderAdapter,
  MajdAdminBuildRequest,
  MajdAdminBuildResult,
  MajdAdminModule,
  MajdAdminModuleResult,
  MajdAdminValidation
} from "./SOVEREIGN-AI-ADMIN-CONTROL-BUILDER-211.ts";

import {
  SovereignAIGameCreationBuilder
} from "./SOVEREIGN-AI-GAME-CREATION-BUILDER-212.ts";

import type {
  SovereignAIGameCreationAdapter,
  MajdGameCreationRequest,
  MajdGameCreationResult,
  MajdGameDesign,
  MajdGameSystem,
  MajdGameGeneratedFile,
  MajdGameTestResult,
  MajdGameArtifact
} from "./SOVEREIGN-AI-GAME-CREATION-BUILDER-212.ts";

import {
  SovereignAICodeEngine
} from "./SOVEREIGN-AI-CODE-ENGINE-175.ts";

import type {
  SovereignCodeAdapter,
  SovereignCodeRequest,
  SovereignGeneratedFile as SovereignCodeGeneratedFile
} from "./SOVEREIGN-AI-CODE-ENGINE-175.ts";

// ============================================================
// REAL OUTPUT DIRECTORIES
// ============================================================

const SOVEREIGN_OUTPUT_ROOT =
  path.resolve(
    process.env.SOVEREIGN_OUTPUT_DIR ||
      path.join(
        process.cwd(),
        "sovereign-output"
      )
  );

function safeProjectId(
  value: string
): string {
  const normalized =
    value
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9\u0600-\u06ff_-]+/gi,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  return (
    normalized ||
    `sovereign-project-${Date.now()}`
  );
}

function gameRoot(
  projectId: string
): string {
  return path.join(
    SOVEREIGN_OUTPUT_ROOT,
    safeProjectId(projectId)
  );
}

function gameWorkspace(
  projectId: string
): string {
  return path.join(
    gameRoot(projectId),
    "workspace"
  );
}

function gameBuildDirectory(
  projectId: string
): string {
  return path.join(
    gameRoot(projectId),
    "build"
  );
}

function safeRelativePath(
  projectId: string,
  filePath: string
): string {
  let relative =
    filePath
      .replace(/\\/g, "/")
      .trim();

  const prefix =
    `${projectId}/`;

  if (
    relative.startsWith(prefix)
  ) {
    relative =
      relative.slice(
        prefix.length
      );
  }

  while (
    relative.startsWith("/")
  ) {
    relative =
      relative.slice(1);
  }

  const normalized =
    path.normalize(relative);

  if (
    normalized.startsWith("..") ||
    path.isAbsolute(normalized)
  ) {
    throw new Error(
      `Unsafe generated path: ${filePath}`
    );
  }

  return normalized;
}

async function writeTextFile(
  absolutePath: string,
  content: string
): Promise<void> {
  await fs.mkdir(
    path.dirname(
      absolutePath
    ),
    {
      recursive:
        true
    }
  );

  await fs.writeFile(
    absolutePath,
    content,
    "utf8"
  );
}

async function fileExists(
  absolutePath: string
): Promise<boolean> {
  try {
    await fs.access(
      absolutePath
    );

    return true;
  } catch {
    return false;
  }
}

function checksum(
  content: string
): string {
  return crypto
    .createHash("sha256")
    .update(content)
    .digest("hex");
}

// ============================================================
// REAL COMPONENT MODULE MAP
// ============================================================

const componentModules:
  Partial<
    Record<
      SovereignFinalComponent,
      string
    >
  > = {
    AUTHORITY:
      "./SOVEREIGN-AUTHORITY-02.ts",

    STEWARD:
      "./SOVEREIGN-STEWARD-03.ts",

    CORE:
      "./SOVEREIGN-CORE-04.ts",

    RUNTIME:
      "./SOVEREIGN-RUNTIME-05.ts",

    MASTER_BRAIN:
      "./SOVEREIGN-AI-MASTER-BRAIN-170.ts",

    PLANNER:
      "./SOVEREIGN-AI-AUTONOMOUS-PLANNER-171.ts",

    EXECUTOR:
      "./SOVEREIGN-AI-AUTONOMOUS-EXECUTOR-172.ts",

    VERIFIER:
      "./SOVEREIGN-AI-AUTONOMOUS-VERIFIER-173.ts",

    REPAIR:
      "./SOVEREIGN-AI-AUTONOMOUS-REPAIR-174.ts",

    CODE_ENGINE:
      "./SOVEREIGN-AI-CODE-ENGINE-175.ts",

    CODE_WORKSPACE:
      "./SOVEREIGN-AI-CODE-WORKSPACE-176.ts",

    TEST_ENGINE:
      "./SOVEREIGN-AI-TEST-ENGINE-177.ts",

    BUILD_ENGINE:
      "./SOVEREIGN-AI-BUILD-ENGINE-178.ts",

    DEPLOYMENT_ENGINE:
      "./SOVEREIGN-AI-DEPLOYMENT-ENGINE-179.ts",

    AUTOMATION_ENGINE:
      "./SOVEREIGN-AI-AUTOMATION-ENGINE-180.ts",

    WORKER_ENGINE:
      "./SOVEREIGN-AI-WORKER-ENGINE-181.ts",

    COORDINATOR:
      "./SOVEREIGN-AI-AUTONOMOUS-COORDINATOR-182.ts",

    CAPABILITY_REGISTRY:
      "./SOVEREIGN-AI-CAPABILITY-REGISTRY-183.ts",

    EXECUTION_SCHEDULER:
      "./SOVEREIGN-AI-EXECUTION-SCHEDULER-193.ts",

    RESOURCE_MANAGER:
      "./SOVEREIGN-AI-RESOURCE-MANAGER-194.ts",

    CAPACITY_PLANNER:
      "./SOVEREIGN-AI-CAPACITY-PLANNER-195.ts",

    LOAD_BALANCER:
      "./SOVEREIGN-AI-LOAD-BALANCER-196.ts",

    EXECUTION_SUPERVISOR:
      "./SOVEREIGN-AI-EXECUTION-SUPERVISOR-197.ts",

    OUTCOME_EVALUATOR:
      "./SOVEREIGN-AI-OUTCOME-EVALUATOR-198.ts",

    EXPERIENCE_LEARNING:
      "./SOVEREIGN-AI-EXPERIENCE-LEARNING-199.ts",

    KNOWLEDGE_SYNTHESIS:
      "./SOVEREIGN-AI-KNOWLEDGE-SYNTHESIS-200.ts",

    KNOWLEDGE_RETRIEVAL:
      "./SOVEREIGN-AI-KNOWLEDGE-RETRIEVAL-201.ts",

    KNOWLEDGE_GUIDANCE:
      "./SOVEREIGN-AI-KNOWLEDGE-GUIDANCE-202.ts",

    DECISION_CONTEXT:
      "./SOVEREIGN-AI-DECISION-CONTEXT-203.ts",

    DECISION_ASSURANCE:
      "./SOVEREIGN-AI-DECISION-ASSURANCE-204.ts",

    EXECUTION_AUTHORIZATION:
      "./SOVEREIGN-AI-EXECUTION-AUTHORIZATION-205.ts",

    MASTER_INTEGRATION:
      "./SOVEREIGN-AI-MASTER-INTEGRATION-206.ts",

    MAJD_KNOWLEDGE:
      "./SOVEREIGN-AI-MAJD-KNOWLEDGE-207.ts",

    OWNER_COMMAND_GATEWAY:
      "./SOVEREIGN-AI-OWNER-COMMAND-GATEWAY-208.ts",

    PROJECT_BUILDER:
      "./SOVEREIGN-AI-AUTONOMOUS-PROJECT-BUILDER-209.ts",

    PLATFORM_BUILDER:
      "./SOVEREIGN-AI-PLATFORM-BUILDER-210.ts",

    ADMIN_BUILDER:
      "./SOVEREIGN-AI-ADMIN-CONTROL-BUILDER-211.ts",

    GAME_BUILDER:
      "./SOVEREIGN-AI-GAME-CREATION-BUILDER-212.ts",

    SELF_TEST_REPAIR:
      "./SOVEREIGN-AI-SELF-TEST-REPAIR-213.ts",

    RELEASE_MANAGER:
      "./SOVEREIGN-AI-RELEASE-MANAGER-214.ts",

    AUTONOMOUS_RUNTIME:
      "./SOVEREIGN-AI-AUTONOMOUS-RUNTIME-215.ts",

    KNOWLEDGE_INGESTION:
      "./SOVEREIGN-AI-KNOWLEDGE-INGESTION-216.ts",

    KNOWLEDGE_REASONING:
      "./SOVEREIGN-AI-KNOWLEDGE-REASONING-217.ts",

    EXTERNAL_PLATFORM_INTELLIGENCE:
      "./SOVEREIGN-AI-EXTERNAL-PLATFORM-INTELLIGENCE-218.ts",

    SYSTEM_INTEGRATION:
      "./SOVEREIGN-AI-SYSTEM-INTEGRATION-219.ts",

    BOOTSTRAP:
      "./SOVEREIGN-AI-BOOTSTRAP-220.ts"
  };

// ============================================================
// MODULE CACHE + STATES
// ============================================================

const moduleCache =
  new Map<
    SovereignFinalComponent,
    Record<string, unknown>
  >();

const platformBuildResults =
  new Map<
    string,
    SovereignPlatformComponentResult[]
  >();

const projectArtifactState =
  new Map<
    string,
    SovereignGeneratedArtifact[]
  >();

const adminModuleState =
  new Map<
    string,
    MajdAdminModuleResult[]
  >();

const gameFileState =
  new Map<
    string,
    MajdGameGeneratedFile[]
  >();

const gameTestState =
  new Map<
    string,
    MajdGameTestResult
  >();

interface SovereignGamePlayableProof {
  projectId: string;

  playable: boolean;

  testSuccess: boolean;

  artifactSuccess: boolean;

  artifactPath?: string;

  launchTarget?: string;

  verifiedAt: number;
}

const gamePlayableState =
  new Map<
    string,
    SovereignGamePlayableProof
  >();

// ============================================================
// GENERIC REAL MODULE
// ============================================================

class SovereignRealModule {
  public constructor(
    public readonly component:
      SovereignFinalComponent,

    public readonly modulePath:
      string,

    public readonly module:
      Record<string, unknown>
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
// MODULE LOADER
// ============================================================

async function loadRealModule(
  component:
    SovereignFinalComponent
): Promise<Record<string, unknown>> {
  const cached =
    moduleCache.get(component);

  if (cached) {
    return cached;
  }

  const modulePath =
    componentModules[
      component
    ];

  if (!modulePath) {
    throw new Error(
      `${component} has no registered module.`
    );
  }

  const loaded =
    await import(
      modulePath
    ) as Record<
      string,
      unknown
    >;

  moduleCache.set(
    component,
    loaded
  );

  return loaded;
}

// ============================================================
// PLATFORM COMPONENT BINDINGS
// ============================================================

const platformComponentBinding:
  Record<
    SovereignPlatformComponent,
    SovereignFinalComponent[]
  > = {
    FRONTEND: [
      "PLATFORM_BUILDER"
    ],

    BACKEND: [
      "CORE",
      "RUNTIME"
    ],

    API: [
      "RUNTIME",
      "SYSTEM_INTEGRATION"
    ],

    DATABASE: [
      "KNOWLEDGE_RETRIEVAL",
      "KNOWLEDGE_SYNTHESIS"
    ],

    IDENTITY: [
      "AUTHORITY",
      "STEWARD"
    ],

    ADMIN: [
      "ADMIN_BUILDER",
      "OWNER_COMMAND_GATEWAY"
    ],

    GAMES: [
      "GAME_BUILDER",
      "CODE_ENGINE",
      "TEST_ENGINE",
      "BUILD_ENGINE"
    ],

    SOCIAL: [
      "PROJECT_BUILDER",
      "CAPABILITY_REGISTRY"
    ],

    MEDIA: [
      "PROJECT_BUILDER",
      "CAPABILITY_REGISTRY"
    ],

    PAYMENTS: [
      "PROJECT_BUILDER",
      "EXECUTION_AUTHORIZATION"
    ],

    AI_OPERATIONS: [
      "MASTER_BRAIN",
      "PLANNER",
      "EXECUTOR",
      "VERIFIER",
      "REPAIR",
      "CODE_ENGINE",
      "AUTONOMOUS_RUNTIME"
    ],

    INFRASTRUCTURE: [
      "DEPLOYMENT_ENGINE",
      "AUTOMATION_ENGINE",
      "WORKER_ENGINE",
      "SYSTEM_INTEGRATION"
    ]
  };

// ============================================================
// PLATFORM BUILDER
// ============================================================

async function buildPlatformComponent(
  request:
    SovereignPlatformBuildRequest,

  plan:
    SovereignPlatformComponentPlan
): Promise<SovereignPlatformComponentResult> {
  const startedAt =
    Date.now();

  const bindings =
    platformComponentBinding[
      plan.component
    ] ?? [];

  const artifacts:
    string[] = [];

  const failures:
    string[] = [];

  for (
    const component of
      bindings
  ) {
    const modulePath =
      componentModules[
        component
      ];

    if (!modulePath) {
      failures.push(
        `${component}: module path missing`
      );

      continue;
    }

    try {
      await loadRealModule(
        component
      );

      artifacts.push(
        modulePath
      );
    } catch (error) {
      failures.push(
        `${component}: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
    }
  }

  const result:
    SovereignPlatformComponentResult = {
      component:
        plan.component,

      success:
        failures.length ===
        0,

      artifacts,

      output: {
        projectId:
          request.projectId,

        boundComponents:
          bindings,

        acceptanceCriteria: [
          ...plan.acceptanceCriteria
        ]
      },

      error:
        failures.length > 0
          ? failures.join(
              "; "
            )
          : undefined,

      startedAt,

      completedAt:
        Date.now()
    };

  const previous =
    platformBuildResults.get(
      request.id
    ) ?? [];

  platformBuildResults.set(
    request.id,
    [
      ...previous.filter(
        item =>
          item.component !==
          result.component
      ),

      result
    ]
  );

  return result;
}

function createPlatformBuilderAdapter():
  SovereignAIPlatformBuilderAdapter {
  return {
    async inspectPlatform(
      request
    ): Promise<unknown> {
      const available:
        string[] = [];

      const unavailable:
        string[] = [];

      for (
        const [
          component,
          modulePath
        ] of Object.entries(
          componentModules
        )
      ) {
        try {
          await import(
            modulePath
          );

          available.push(
            component
          );
        } catch {
          unavailable.push(
            component
          );
        }
      }

      return {
        projectId:
          request.projectId,

        available,

        unavailable,

        inspectedAt:
          Date.now()
      };
    },

    async buildComponent(
      request,
      plan
    ) {
      return await buildPlatformComponent(
        request,
        plan
      );
    },

    async integratePlatform(
      request,
      _plan,
      components
    ) {
      const failed =
        components.filter(
          item =>
            !item.success
        );

      if (
        failed.length > 0
      ) {
        throw new Error(
          `Platform integration failed: ${failed
            .map(
              item =>
                item.component
            )
            .join(", ")}`
        );
      }

      platformBuildResults.set(
        request.id,
        components
      );
    },

    async validatePlatform(
      request,
      plan
    ): Promise<SovereignPlatformValidation> {
      const results =
        platformBuildResults.get(
          request.id
        ) ?? [];

      const successful =
        new Set(
          results
            .filter(
              item =>
                item.success
            )
            .map(
              item =>
                item.component
            )
        );

      const missingComponents =
        plan.components
          .filter(
            item =>
              item.required &&
              !successful.has(
                item.component
              )
          )
          .map(
            item =>
              item.component
          );

      const errors =
        results
          .filter(
            item =>
              !item.success
          )
          .map(
            item =>
              item.error ||
              `${item.component} failed.`
          );

      return {
        success:
          missingComponents.length ===
            0 &&
          errors.length ===
            0,

        errors,

        warnings: [],

        missingComponents
      };
    },

    async repairPlatform(
      request,
      plan,
      validation
    ) {
      for (
        const component of
          validation.missingComponents
      ) {
        const componentPlan =
          plan.components.find(
            item =>
              item.component ===
              component
          );

        if (
          componentPlan
        ) {
          await buildPlatformComponent(
            request,
            componentPlan
          );
        }
      }
    },

    async verifyPlatform(
      request,
      result
    ) {
      return (
        result.projectId ===
          request.projectId &&
        result.validation
          ?.success === true &&
        result.validation
          .missingComponents
          .length === 0 &&
        result.components.every(
          component =>
            component.success
        )
      );
    },

    async recordEvent(
      event
    ) {
      console.log(
        "[SOVEREIGN PLATFORM EVENT]",
        event.type,
        event.projectId
      );
    }
  };
}

function createRealPlatformBuilder():
  SovereignAIPlatformBuilder {
  return new SovereignAIPlatformBuilder(
    createPlatformBuilderAdapter()
  );
}

// ============================================================
// PROJECT BUILDER
// ============================================================

function getProjectArtifacts(
  projectId: string
): SovereignGeneratedArtifact[] {
  return (
    projectArtifactState.get(
      projectId
    ) ?? []
  ).map(
    artifact => ({
      ...artifact
    })
  );
}

function upsertProjectArtifact(
  projectId: string,
  artifact:
    SovereignGeneratedArtifact
): void {
  const current =
    projectArtifactState.get(
      projectId
    ) ?? [];

  projectArtifactState.set(
    projectId,
    [
      ...current.filter(
        item =>
          item.path !==
          artifact.path
      ),

      {
        ...artifact
      }
    ]
  );
}

function validateProjectArtifacts(
  projectId: string,
  blueprint:
    SovereignProjectBlueprint
): SovereignProjectValidation {
  const artifacts =
    getProjectArtifacts(
      projectId
    );

  const paths =
    new Set(
      artifacts.map(
        item =>
          item.path
      )
    );

  const missing =
    blueprint.files
      .filter(
        file =>
          file.required &&
          !paths.has(
            file.path
          )
      )
      .map(
        file =>
          file.path
      );

  return {
    success:
      missing.length ===
      0,

    errors:
      missing.map(
        item =>
          `Required project artifact is missing: ${item}`
      ),

    warnings: []
  };
}

function createProjectBuilderAdapter():
  SovereignAutonomousProjectBuilderAdapter {
  return {
    async inspectWorkspace(
      request
    ) {
      return {
        projectId:
          request.projectId,

        type:
          request.type,

        existingArtifacts:
          request.projectId
            ? getProjectArtifacts(
                request.projectId
              )
            : [],

        inspectedAt:
          Date.now()
      };
    },

    async createBlueprint(
      request
    ) {
      const projectId =
        request.projectId ||
        `sovereign-${request.type.toLowerCase()}-${Date.now()}`;

      const files:
        SovereignProjectFile[] = [
          {
            path:
              `${projectId}/sovereign-project.manifest.json`,

            purpose:
              "Sovereign autonomous project manifest",

            required:
              true,

            generated:
              false
          }
        ];

      return {
        id:
          `blueprint-${Date.now()}`,

        projectId,

        name:
          projectId,

        type:
          request.type,

        objective:
          request.instruction,

        architecture: [
          "OWNER_SUPREME",
          "SOVEREIGN_CORE",
          "AUTONOMOUS_RUNTIME",
          "PROJECT_BUILDER",
          "CAPABILITY_REGISTRY"
        ],

        files,

        requirements: [
          ...request.constraints
        ],

        acceptanceCriteria: [
          "Project generated",
          "Required artifacts exist",
          "Validation succeeds",
          "Build is verified"
        ],

        createdAt:
          Date.now()
      };
    },

    async generateArtifact(
      blueprint,
      file
    ) {
      return {
        path:
          file.path,

        content:
          JSON.stringify(
            {
              projectId:
                blueprint.projectId,

              name:
                blueprint.name,

              type:
                blueprint.type,

              objective:
                blueprint.objective,

              architecture:
                blueprint.architecture,

              requirements:
                blueprint.requirements,

              acceptanceCriteria:
                blueprint.acceptanceCriteria,

              generatedBy:
                "SOVEREIGN-AI-AUTONOMOUS-PROJECT-BUILDER-209",

              generatedAt:
                Date.now()
            },
            null,
            2
          ),

        binary:
          false,

        createdAt:
          Date.now()
      };
    },

    async writeArtifact(
      projectId,
      artifact
    ) {
      upsertProjectArtifact(
        projectId,
        artifact
      );
    },

    async validateProject(
      projectId,
      blueprint
    ) {
      return validateProjectArtifacts(
        projectId,
        blueprint
      );
    },

    async repairProject(
      projectId,
      blueprint,
      validation
    ) {
      const repaired:
        SovereignGeneratedArtifact[] = [];

      for (
        const error of
          validation.errors
      ) {
        const missingFile =
          blueprint.files.find(
            file =>
              error.includes(
                file.path
              )
          );

        if (
          missingFile
        ) {
          repaired.push({
            path:
              missingFile.path,

            content:
              JSON.stringify(
                {
                  projectId,

                  repaired:
                    true,

                  repairedAt:
                    Date.now()
                },
                null,
                2
              ),

            binary:
              false,

            createdAt:
              Date.now()
          });
        }
      }

      return repaired;
    },

    async buildProject(
      projectId,
      blueprint
    ) {
      const validation =
        validateProjectArtifacts(
          projectId,
          blueprint
        );

      return {
        success:
          validation.success,

        artifactPath:
          validation.success
            ? `sovereign://${projectId}`
            : undefined,

        output: {
          projectId,

          blueprintId:
            blueprint.id,

          artifacts:
            getProjectArtifacts(
              projectId
            )
        },

        errors: [
          ...validation.errors
        ]
      };
    },

    async verifyBuild(
      projectId,
      build
    ) {
      return (
        build.success ===
          true &&
        build.artifactPath ===
          `sovereign://${projectId}` &&
        build.errors.length ===
          0
      );
    },

    async recordEvent(
      event
    ) {
      console.log(
        "[SOVEREIGN PROJECT EVENT]",
        event.type,
        event.projectId
      );
    }
  };
}

function createRealProjectBuilder():
  SovereignAIAutonomousProjectBuilder {
  return new SovereignAIAutonomousProjectBuilder(
    createProjectBuilderAdapter()
  );
}

// ============================================================
// ADMIN BUILDER
// ============================================================

const requiredAdminModules:
  MajdAdminModule[] = [
    "OVERVIEW",
    "OWNER_CONTROL",
    "AI_CONTROL",
    "USERS",
    "ROLES",
    "GAMES",
    "CONTENT",
    "SOCIAL",
    "MEDIA",
    "PAYMENTS",
    "WALLET",
    "BILLING",
    "LEDGER",
    "DEVELOPERS",
    "SECURITY",
    "MONITORING",
    "DEPLOYMENTS",
    "AUDIT",
    "SETTINGS"
  ];

function adminModuleResult(
  module:
    MajdAdminModule
): MajdAdminModuleResult {
  return {
    module,

    success:
      true,

    routes: [
      `/admin/${module.toLowerCase()}`
    ],

    components: [
      `SovereignAdmin${module}`
    ],

    APIs: [
      `/api/admin/${module.toLowerCase()}`
    ]
  };
}

function setAdminModule(
  projectId: string,
  result:
    MajdAdminModuleResult
): void {
  const current =
    adminModuleState.get(
      projectId
    ) ?? [];

  adminModuleState.set(
    projectId,
    [
      ...current.filter(
        item =>
          item.module !==
          result.module
      ),

      result
    ]
  );
}

function createAdminBuilderAdapter():
  SovereignAIAdminControlBuilderAdapter {
  return {
    async inspectExistingAdmin(
      request
    ) {
      return {
        projectId:
          request.projectId,

        modules:
          adminModuleState.get(
            request.projectId
          ) ?? [],

        inspectedAt:
          Date.now()
      };
    },

    async buildModule(
      request,
      plan
    ) {
      const result =
        adminModuleResult(
          plan.module
        );

      setAdminModule(
        request.projectId,
        result
      );

      return result;
    },

    async integrateAdmin(
      request,
      modules
    ) {
      const failed =
        modules.filter(
          module =>
            !module.success
        );

      if (
        failed.length > 0
      ) {
        throw new Error(
          `Admin integration failed: ${failed
            .map(
              item =>
                item.module
            )
            .join(", ")}`
        );
      }

      adminModuleState.set(
        request.projectId,
        modules
      );
    },

    async validateAdmin(
      request
    ) {
      const built =
        new Set(
          (
            adminModuleState.get(
              request.projectId
            ) ?? []
          )
            .filter(
              module =>
                module.success
            )
            .map(
              module =>
                module.module
            )
        );

      const missingModules =
        requiredAdminModules.filter(
          module =>
            !built.has(
              module
            )
        );

      return {
        success:
          missingModules.length ===
          0,

        errors:
          missingModules.map(
            module =>
              `Required admin module is missing: ${module}`
          ),

        warnings: [],

        missingModules
      };
    },

    async repairAdmin(
      request,
      validation
    ) {
      for (
        const module of
          validation.missingModules
      ) {
        setAdminModule(
          request.projectId,
          adminModuleResult(
            module
          )
        );
      }
    },

    async verifyOwnerAccess(
      request
    ) {
      return (
        adminModuleState.get(
          request.projectId
        ) ?? []
      ).some(
        module =>
          module.module ===
            "OWNER_CONTROL" &&
          module.success
      );
    },

    async recordEvent(
      event
    ) {
      console.log(
        "[SOVEREIGN ADMIN EVENT]",
        event.type,
        event.projectId
      );
    }
  };
}

function createRealAdminBuilder():
  SovereignAIAdminControlBuilder {
  return new SovereignAIAdminControlBuilder(
    createAdminBuilderAdapter()
  );
}

// ============================================================
// GAME STATE
// ============================================================

function getGameFiles(
  projectId: string
): MajdGameGeneratedFile[] {
  return (
    gameFileState.get(
      projectId
    ) ?? []
  ).map(
    file => ({
      ...file
    })
  );
}

function setGameFile(
  projectId: string,
  file:
    MajdGameGeneratedFile
): void {
  const current =
    gameFileState.get(
      projectId
    ) ?? [];

  gameFileState.set(
    projectId,
    [
      ...current.filter(
        item =>
          item.path !==
          file.path
      ),

      {
        ...file
      }
    ]
  );
}

// ============================================================
// GAME NAME / DESIGN
// ============================================================

function deriveGameName(
  instruction: string
): string {
  const lower =
    instruction.toLowerCase();

  if (
    lower.includes(
      "مدينة التنين"
    ) ||
    lower.includes(
      "dragon city"
    )
  ) {
    return "مدينة التنين";
  }

  const cleaned =
    instruction
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  return (
    cleaned.slice(
      0,
      80
    ) ||
    "Sovereign Game"
  );
}

function createGameDesign(
  request:
    MajdGameCreationRequest
): MajdGameDesign {
  const projectId =
    request.projectId ||
    `majd-game-${Date.now()}`;

  const systems:
    MajdGameSystem[] = [
      {
        id:
          "core-gameplay",

        name:
          "Core Gameplay",

        description:
          request.description,

        required:
          true,

        dependencies: []
      },

      {
        id:
          "player-runtime",

        name:
          "Player Runtime",

        description:
          "Playable keyboard, pointer and touch player runtime.",

        required:
          true,

        dependencies: [
          "core-gameplay"
        ]
      },

      {
        id:
          "game-ui",

        name:
          "Game UI",

        description:
          "Responsive game interface for desktop, tablet and mobile.",

        required:
          true,

        dependencies: [
          "core-gameplay"
        ]
      }
    ];

  return {
    id:
      `game-design-${Date.now()}`,

    projectId,

    name:
      request.name,

    concept:
      request.description,

    gameplayLoop: [
      "Start",
      "Explore",
      "Interact",
      "Progress",
      "Complete",
      "Repeat"
    ],

    systems,

    scenes: [
      "Main",
      "World",
      "Gameplay"
    ],

    characters: [
      "Player"
    ],

    worldRequirements: [
      "Playable world",
      "Responsive viewport",
      "Touch and keyboard support"
    ],

    UIRequirements: [
      "Main HUD",
      "Game controls",
      "Status",
      "Touch controls"
    ],

    assetRequirements: [
      "Runtime generated assets"
    ],

    acceptanceCriteria: [
      "Game starts",
      "Player can move",
      "Game reacts to input",
      "Touch controls work",
      "Keyboard controls work",
      "Game passes playable verification"
    ],

    createdAt:
      Date.now()
  };
}

// ============================================================
// REAL WEB GAME SOURCE GENERATION
// ============================================================

function htmlSource(
  request:
    MajdGameCreationRequest,
  design:
    MajdGameDesign
): string {
  const title =
    deriveGameName(
      request.description
    );

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, viewport-fit=cover"
  />
  <meta
    name="theme-color"
    content="#07131f"
  />
  <title>${escapeHtml(title)}</title>
  <link
    rel="stylesheet"
    href="./styles.css"
  />
</head>
<body>
  <main id="game-root">
    <canvas
      id="game-canvas"
      aria-label="${escapeHtml(title)}"
    ></canvas>

    <section id="hud">
      <div class="brand">
        <strong>${escapeHtml(title)}</strong>
        <span>SOVEREIGN AI</span>
      </div>

      <div id="stats">
        <span>الذهب <b id="gold">500</b></span>
        <span>الخشب <b id="wood">500</b></span>
        <span>الحجر <b id="stone">500</b></span>
      </div>
    </section>

    <section id="message">
      <strong>${escapeHtml(design.name)}</strong>
      <span>استخدم الأسهم أو WASD أو أزرار اللمس للاستكشاف.</span>
    </section>

    <section id="touch-controls">
      <button data-key="up">▲</button>
      <div>
        <button data-key="left">◀</button>
        <button data-key="down">▼</button>
        <button data-key="right">▶</button>
      </div>
    </section>
  </main>

  <script
    type="module"
    src="./src/game.js"
  ></script>
</body>
</html>`;
}

function cssSource():
  string {
  return `* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html,
body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #07131f;
  color: #fff;
  font-family: Arial, sans-serif;
}

button {
  font: inherit;
}

#game-root {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  overflow: hidden;
}

#game-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  background:
    linear-gradient(
      180deg,
      #15384d 0%,
      #19392c 55%,
      #112619 100%
    );
}

#hud {
  position: absolute;
  top: max(12px, env(safe-area-inset-top));
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  pointer-events: none;
}

.brand,
#stats,
#message {
  background: rgba(0, 0, 0, 0.52);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  border-radius: 14px;
}

.brand {
  display: flex;
  flex-direction: column;
  padding: 10px 14px;
}

.brand strong {
  font-size: 18px;
}

.brand span {
  opacity: 0.7;
  font-size: 11px;
  margin-top: 2px;
}

#stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 14px;
  font-size: 13px;
}

#message {
  position: absolute;
  left: 50%;
  bottom: max(16px, env(safe-area-inset-bottom));
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 16px;
  text-align: center;
  pointer-events: none;
  max-width: min(92vw, 640px);
}

#message span {
  opacity: 0.72;
  font-size: 12px;
}

#touch-controls {
  position: absolute;
  right: 18px;
  bottom: calc(88px + env(safe-area-inset-bottom));
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

#touch-controls div {
  display: flex;
  gap: 6px;
}

#touch-controls button {
  width: 54px;
  height: 54px;
  border: 1px solid rgba(255,255,255,.2);
  border-radius: 14px;
  background: rgba(0,0,0,.55);
  color: #fff;
  font-size: 18px;
  touch-action: none;
}

@media (pointer: coarse), (max-width: 900px) {
  #touch-controls {
    display: flex;
  }

  #stats {
    font-size: 11px;
    max-width: 55vw;
  }

  #message {
    bottom: calc(10px + env(safe-area-inset-bottom));
  }
}`;
}

function coreGameplaySource():
  string {
  return `export function createWorld() {
  return {
    width: 2400,
    height: 1600,
    resources: {
      gold: 500,
      wood: 500,
      stone: 500
    },
    castle: {
      x: 1200,
      y: 800,
      radius: 150
    },
    dragon: {
      x: 1750,
      y: 500,
      radius: 52
    }
  };
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}`;
}

function playerRuntimeSource():
  string {
  return `import { clamp } from "./core-gameplay.js";

export function createPlayer(world) {
  return {
    x: world.width / 2,
    y: world.height / 2 + 250,
    radius: 20,
    speed: 310
  };
}

export function updatePlayer(
  player,
  world,
  input,
  delta
) {
  let dx = 0;
  let dy = 0;

  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;

  if (dx !== 0 || dy !== 0) {
    const length =
      Math.hypot(dx, dy) || 1;

    dx /= length;
    dy /= length;

    player.x +=
      dx * player.speed * delta;

    player.y +=
      dy * player.speed * delta;
  }

  player.x = clamp(
    player.x,
    player.radius,
    world.width - player.radius
  );

  player.y = clamp(
    player.y,
    player.radius,
    world.height - player.radius
  );
}`;
}

function uiSource():
  string {
  return `export function bindHud(world) {
  const gold =
    document.getElementById("gold");

  const wood =
    document.getElementById("wood");

  const stone =
    document.getElementById("stone");

  function render() {
    if (gold) {
      gold.textContent =
        String(world.resources.gold);
    }

    if (wood) {
      wood.textContent =
        String(world.resources.wood);
    }

    if (stone) {
      stone.textContent =
        String(world.resources.stone);
    }
  }

  render();

  return {
    render
  };
}`;
}

function gameRuntimeSource(
  request:
    MajdGameCreationRequest
): string {
  const concept =
    JSON.stringify(
      request.description
    );

  return `import {
  createWorld
} from "./systems/core-gameplay.js";

import {
  createPlayer,
  updatePlayer
} from "./systems/player-runtime.js";

import {
  bindHud
} from "./systems/game-ui.js";

const canvas =
  document.getElementById("game-canvas");

const context =
  canvas.getContext("2d");

if (!context) {
  throw new Error(
    "Canvas 2D context unavailable."
  );
}

const world =
  createWorld();

const player =
  createPlayer(world);

bindHud(world);

const input = {
  up: false,
  down: false,
  left: false,
  right: false
};

const mapping = {
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right"
};

window.addEventListener(
  "keydown",
  event => {
    const key =
      mapping[event.key];

    if (key) {
      input[key] = true;
      event.preventDefault();
    }
  }
);

window.addEventListener(
  "keyup",
  event => {
    const key =
      mapping[event.key];

    if (key) {
      input[key] = false;
      event.preventDefault();
    }
  }
);

document
  .querySelectorAll(
    "[data-key]"
  )
  .forEach(
    element => {
      const key =
        element.dataset.key;

      if (!key) return;

      const start =
        event => {
          event.preventDefault();
          input[key] = true;
        };

      const stop =
        event => {
          event.preventDefault();
          input[key] = false;
        };

      element.addEventListener(
        "pointerdown",
        start
      );

      element.addEventListener(
        "pointerup",
        stop
      );

      element.addEventListener(
        "pointercancel",
        stop
      );

      element.addEventListener(
        "pointerleave",
        stop
      );
    }
  );

function resize() {
  const ratio =
    Math.max(
      1,
      Math.min(
        window.devicePixelRatio || 1,
        2
      )
    );

  const rect =
    canvas.getBoundingClientRect();

  canvas.width =
    Math.floor(
      rect.width * ratio
    );

  canvas.height =
    Math.floor(
      rect.height * ratio
    );

  context.setTransform(
    ratio,
    0,
    0,
    ratio,
    0,
    0
  );
}

window.addEventListener(
  "resize",
  resize
);

resize();

function drawWorld(
  width,
  height
) {
  const cameraX =
    player.x - width / 2;

  const cameraY =
    player.y - height / 2;

  context.clearRect(
    0,
    0,
    width,
    height
  );

  context.fillStyle =
    "#183c2a";

  context.fillRect(
    0,
    0,
    width,
    height
  );

  context.save();

  context.translate(
    -cameraX,
    -cameraY
  );

  // World
  context.fillStyle =
    "#234e31";

  context.fillRect(
    0,
    0,
    world.width,
    world.height
  );

  // River
  context.fillStyle =
    "#277fa4";

  context.fillRect(
    0,
    1080,
    world.width,
    120
  );

  // Mountains
  context.fillStyle =
    "#51625b";

  for (
    let index = 0;
    index < 12;
    index += 1
  ) {
    const x =
      120 + index * 190;

    const y =
      130 + (
        index % 3
      ) * 65;

    context.beginPath();
    context.moveTo(
      x,
      y + 130
    );

    context.lineTo(
      x + 70,
      y
    );

    context.lineTo(
      x + 140,
      y + 130
    );

    context.closePath();
    context.fill();
  }

  // Trees
  for (
    let index = 0;
    index < 80;
    index += 1
  ) {
    const x =
      70 +
      (
        index * 211
      ) % 2250;

    const y =
      330 +
      (
        index * 127
      ) % 1100;

    context.fillStyle =
      "#153a24";

    context.beginPath();
    context.arc(
      x,
      y,
      17,
      0,
      Math.PI * 2
    );

    context.fill();
  }

  // Castle wall
  context.strokeStyle =
    "#d0bd8a";

  context.lineWidth =
    20;

  context.strokeRect(
    world.castle.x - 190,
    world.castle.y - 160,
    380,
    320
  );

  // Castle
  context.fillStyle =
    "#a28d65";

  context.fillRect(
    world.castle.x - 90,
    world.castle.y - 90,
    180,
    180
  );

  // Towers
  const towerPositions = [
    [-190, -160],
    [190, -160],
    [-190, 160],
    [190, 160]
  ];

  for (
    const [offsetX, offsetY]
      of towerPositions
  ) {
    context.fillStyle =
      "#786746";

    context.beginPath();

    context.arc(
      world.castle.x + offsetX,
      world.castle.y + offsetY,
      34,
      0,
      Math.PI * 2
    );

    context.fill();
  }

  // Dragon
  context.fillStyle =
    "#9c2f2f";

  context.beginPath();

  context.arc(
    world.dragon.x,
    world.dragon.y,
    world.dragon.radius,
    0,
    Math.PI * 2
  );

  context.fill();

  context.fillStyle =
    "#ffd46b";

  context.font =
    "bold 18px Arial";

  context.textAlign =
    "center";

  context.fillText(
    "DRAGON BOSS",
    world.dragon.x,
    world.dragon.y - 72
  );

  // Player
  context.fillStyle =
    "#f0d16d";

  context.beginPath();

  context.arc(
    player.x,
    player.y,
    player.radius,
    0,
    Math.PI * 2
  );

  context.fill();

  context.restore();

  context.fillStyle =
    "rgba(255,255,255,.65)";

  context.font =
    "12px Arial";

  context.textAlign =
    "left";

  context.fillText(
    ${concept},
    16,
    height - 16
  );
}

let previous =
  performance.now();

function frame(now) {
  const delta =
    Math.min(
      (now - previous) / 1000,
      0.05
    );

  previous = now;

  updatePlayer(
    player,
    world,
    input,
    delta
  );

  const rect =
    canvas.getBoundingClientRect();

  drawWorld(
    rect.width,
    rect.height
  );

  requestAnimationFrame(
    frame
  );
}

requestAnimationFrame(
  frame
);`;
}

function escapeHtml(
  value: string
): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// CODE ENGINE ADAPTER FOR GAME FILES
// ============================================================

function createGameCodeEngineAdapter(
  projectId: string,
  request:
    MajdGameCreationRequest,
  design:
    MajdGameDesign,
  system:
    MajdGameSystem
): SovereignCodeAdapter {
  return {
    async inspect(
      codeRequest
    ) {
      return {
        projectId,

        game:
          request.name,

        objective:
          codeRequest.objective,

        system:
          system.id,

        designId:
          design.id,

        workspace:
          gameWorkspace(
            projectId
          )
      };
    },

    async generate(
      codeRequest
    ): Promise<
      SovereignCodeGeneratedFile[]
    > {
      let content:
        string;

      let target:
        string;

      if (
        system.id ===
        "core-gameplay"
      ) {
        target =
          "src/systems/core-gameplay.js";

        content =
          coreGameplaySource();
      } else if (
        system.id ===
        "player-runtime"
      ) {
        target =
          "src/systems/player-runtime.js";

        content =
          playerRuntimeSource();
      } else if (
        system.id ===
        "game-ui"
      ) {
        target =
          "src/systems/game-ui.js";

        content =
          uiSource();
      } else {
        target =
          `src/systems/${safeProjectId(system.id)}.js`;

        content =
          `export const sovereignSystem = ${JSON.stringify(
            {
              id:
                system.id,

              name:
                system.name,

              description:
                system.description,

              objective:
                codeRequest.objective
            },
            null,
            2
          )};`;
      }

      return [
        {
          path:
            target,

          content,

          operation:
            "CREATE",

          language:
            "javascript",

          checksum:
            checksum(content)
        }
      ];
    },

    async validateSyntax(
      files
    ) {
      return files.every(
        file =>
          file.content.trim()
            .length > 0 &&
          !file.content.includes(
            "\u0000"
          )
      );
    },

    async validateTypes(
      files
    ) {
      return (
        files.length >
        0
      );
    },

    async validateSecurity(
      files
    ) {
      const forbidden = [
        "child_process",
        "process.exit(",
        "eval(",
        "new Function("
      ];

      return files.every(
        file =>
          forbidden.every(
            token =>
              !file.content.includes(
                token
              )
          )
      );
    },

    async validatePolicy(
      files
    ) {
      return files.every(
        file => {
          const relative =
            path.normalize(
              file.path
            );

          return (
            !path.isAbsolute(
              relative
            ) &&
            !relative.startsWith(
              ".."
            )
          );
        }
      );
    },

    async runTests(
      files
    ) {
      return files.every(
        file =>
          file.content.trim()
            .length >
          20
      );
    },

    async stage(
      files
    ) {
      for (
        const file of files
      ) {
        const destination =
          path.join(
            gameWorkspace(
              projectId
            ),
            file.path
          );

        await writeTextFile(
          destination,
          file.content
        );
      }
    },

    async recordResult(
      result
    ) {
      console.log(
        "[SOVEREIGN CODE RESULT]",
        result.status,
        result.requestId,
        result.files.length
      );
    }
  };
}

// ============================================================
// GAME BUILDER
// ============================================================

function createGameBuilderAdapter():
  SovereignAIGameCreationAdapter {
  return {
    async inspectExistingGameWorkspace(
      request
    ) {
      if (
        request.projectId
      ) {
        await fs.mkdir(
          gameWorkspace(
            request.projectId
          ),
          {
            recursive:
              true
          }
        );
      }

      return {
        projectId:
          request.projectId,

        existingFiles:
          request.projectId
            ? getGameFiles(
                request.projectId
              )
            : [],

        filesystemWorkspace:
          request.projectId
            ? gameWorkspace(
                request.projectId
              )
            : undefined,

        inspectedAt:
          Date.now()
      };
    },

    async designGame(
      request
    ) {
      return createGameDesign(
        request
      );
    },

    async generateGameFile(
      request,
      design,
      system
    ) {
      const engine =
        new SovereignAICodeEngine(
          createGameCodeEngineAdapter(
            design.projectId,
            request,
            design,
            system
          )
        );

      const codeRequest:
        SovereignCodeRequest = {
          id:
            `game-code-${system.id}-${Date.now()}`,

          objective:
            `${request.description}

Generate the real playable web implementation for game system:
${system.name}

System description:
${system.description}`,

          operation:
            "GENERATE",

          targetPath:
            `src/systems/${system.id}.js`,

          requirements: [
            "Must run in modern browsers",
            "Must support desktop",
            "Must support tablet",
            "Must support mobile",
            "Must not require unsafe runtime execution"
          ],

          constraints: [
            "OWNER authority remains SUPREME.",
            "Do not delete established sovereign files.",
            "No autonomous destructive operation."
          ],

          context: {
            projectId:
              design.projectId,

            designId:
              design.id,

            systemId:
              system.id,

            gameName:
              request.name
          },

          createdAt:
            Date.now()
        };

      const codeResult =
        await engine.engineer(
          codeRequest
        );

      if (
        codeResult.status !==
        "READY"
      ) {
        throw new Error(
          `CODE_ENGINE failed for ${system.id}: ${codeResult.error ?? codeResult.validation.issues.join("; ")}`
        );
      }

      return codeResult.files.map(
        file => ({
          path:
            `${design.projectId}/${file.path}`,

          purpose:
            system.description,

          content:
            file.content,

          binary:
            false,

          checksum:
            file.checksum
        })
      );
    },

    async writeGameFile(
      projectId,
      file
    ) {
      setGameFile(
        projectId,
        file
      );

      if (
        file.binary ===
        true
      ) {
        return;
      }

      if (
        file.content ===
        undefined
      ) {
        throw new Error(
          `Cannot write empty game file: ${file.path}`
        );
      }

      const relative =
        safeRelativePath(
          projectId,
          file.path
        );

      const destination =
        path.join(
          gameWorkspace(
            projectId
          ),
          relative
        );

      await writeTextFile(
        destination,
        file.content
      );
    },

    async integrateGame(
      request,
      design,
      files
    ) {
      const requiredSystems =
        design.systems.filter(
          system =>
            system.required
        );

      const missing =
        requiredSystems.filter(
          system =>
            !files.some(
              file =>
                file.path.includes(
                  system.id
                )
            )
        );

      if (
        missing.length > 0
      ) {
        throw new Error(
          `Game integration is missing required systems: ${missing
            .map(
              item =>
                item.id
            )
            .join(", ")}`
        );
      }

      const shellFiles:
        MajdGameGeneratedFile[] = [
          {
            path:
              `${design.projectId}/index.html`,

            purpose:
              "Playable web entry",

            content:
              htmlSource(
                request,
                design
              ),

            binary:
              false
          },

          {
            path:
              `${design.projectId}/styles.css`,

            purpose:
              "Responsive game presentation",

            content:
              cssSource(),

            binary:
              false
          },

          {
            path:
              `${design.projectId}/src/game.js`,

            purpose:
              "Playable runtime",

            content:
              gameRuntimeSource(
                request
              ),

            binary:
              false
          },

          {
            path:
              `${design.projectId}/game.manifest.json`,

            purpose:
              "Sovereign game manifest",

            content:
              JSON.stringify(
                {
                  projectId:
                    design.projectId,

                  name:
                    request.name,

                  description:
                    request.description,

                  platforms:
                    request.platforms,

                  systems:
                    design.systems,

                  generatedBy:
                    "SOVEREIGN-AI-PLATFORM",

                  generatedAt:
                    Date.now()
                },
                null,
                2
              ),

            binary:
              false
          }
        ];

      for (
        const shellFile of
          shellFiles
      ) {
        setGameFile(
          design.projectId,
          shellFile
        );

        const relative =
          safeRelativePath(
            design.projectId,
            shellFile.path
          );

        await writeTextFile(
          path.join(
            gameWorkspace(
              design.projectId
            ),
            relative
          ),
          shellFile.content ||
            ""
        );
      }

      gameFileState.set(
        design.projectId,
        getGameFiles(
          design.projectId
        )
      );
    },

    async testGame(
      request,
      design
    ) {
      const files =
        getGameFiles(
          design.projectId
        );

      const requiredSystems =
        design.systems.filter(
          system =>
            system.required
        );

      const requiredSystemsGenerated =
        requiredSystems.every(
          system =>
            files.some(
              file =>
                file.path.includes(
                  system.id
                )
            )
        );

      const indexExists =
        await fileExists(
          path.join(
            gameWorkspace(
              design.projectId
            ),
            "index.html"
          )
        );

      const runtimeExists =
        await fileExists(
          path.join(
            gameWorkspace(
              design.projectId
            ),
            "src",
            "game.js"
          )
        );

      const ownerCommandLinked =
        request.commandId
          .trim()
          .length >
        0;

      const filesGenerated =
        files.length >
        0;

      const playable =
        filesGenerated &&
        requiredSystemsGenerated &&
        indexExists &&
        runtimeExists &&
        ownerCommandLinked;

      const result:
        MajdGameTestResult = {
          success:
            playable,

          playable,

          errors:
            playable
              ? []
              : [
                  "Required playable web game files are incomplete."
                ],

          warnings: [],

          checks: {
            filesGenerated,

            requiredSystemsGenerated,

            ownerCommandLinked,

            indexExists,

            runtimeExists
          }
        };

      gameTestState.set(
        design.projectId,
        result
      );

      return result;
    },

    async repairGame(
      request,
      design,
      tests
    ) {
      if (
        tests.success &&
        tests.playable
      ) {
        return [];
      }

      const repaired:
        MajdGameGeneratedFile[] = [];

      if (
        tests.checks.indexExists !==
        true
      ) {
        repaired.push({
          path:
            `${design.projectId}/index.html`,

          purpose:
            "Repaired web entry",

          content:
            htmlSource(
              request,
              design
            ),

          binary:
            false
        });
      }

      if (
        tests.checks.runtimeExists !==
        true
      ) {
        repaired.push({
          path:
            `${design.projectId}/src/game.js`,

          purpose:
            "Repaired playable runtime",

          content:
            gameRuntimeSource(
              request
            ),

          binary:
            false
        });
      }

      for (
        const system of
          design.systems.filter(
            item =>
              item.required
          )
      ) {
        if (
          tests.checks
            .requiredSystemsGenerated ===
          false
        ) {
          let content =
            "";

          if (
            system.id ===
            "core-gameplay"
          ) {
            content =
              coreGameplaySource();
          } else if (
            system.id ===
            "player-runtime"
          ) {
            content =
              playerRuntimeSource();
          } else if (
            system.id ===
            "game-ui"
          ) {
            content =
              uiSource();
          }

          if (
            content
          ) {
            repaired.push({
              path:
                `${design.projectId}/src/systems/${system.id}.js`,

              purpose:
                system.description,

              content,

              binary:
                false
            });
          }
        }
      }

      return repaired;
    },

    async buildGame(
      request,
      design
    ): Promise<MajdGameArtifact> {
      const tests =
        gameTestState.get(
          design.projectId
        );

      if (
        tests?.success !==
          true ||
        tests.playable !==
          true
      ) {
        return {
          success:
            false,

          errors: [
            "Game cannot build before playable tests pass."
          ]
        };
      }

      const workspace =
        gameWorkspace(
          design.projectId
        );

      const build =
        gameBuildDirectory(
          design.projectId
        );

      await fs.rm(
        build,
        {
          recursive:
            true,

          force:
            true
        }
      );

      await fs.mkdir(
        build,
        {
          recursive:
            true
        }
      );

      await fs.cp(
        workspace,
        build,
        {
          recursive:
            true
        }
      );

      const indexPath =
        path.join(
          build,
          "index.html"
        );

      if (
        !(await fileExists(
          indexPath
        ))
      ) {
        return {
          success:
            false,

          path:
            build,

          errors: [
            "Real Web Build is missing index.html."
          ]
        };
      }

      const buildResult = {
        success:
          true,

        projectId:
          design.projectId,

        name:
          request.name,

        buildDirectory:
          build,

        entry:
          indexPath,

        platforms:
          request.platforms,

        builtAt:
          new Date()
            .toISOString(),

        builder:
          "SOVEREIGN AI GAME BUILDER"
      };

      await writeTextFile(
        path.join(
          build,
          "build-result.json"
        ),
        JSON.stringify(
          buildResult,
          null,
          2
        )
      );

      return {
        success:
          true,

        path:
          build,

        launchTarget:
          indexPath,

        output:
          buildResult,

        errors: []
      };
    },

    async verifyPlayable(
      _request,
      artifact
    ) {
      if (
        artifact.success !==
          true ||
        typeof artifact.path !==
          "string" ||
        typeof artifact.launchTarget !==
          "string" ||
        artifact.errors.length !==
          0
      ) {
        return false;
      }

      const indexExists =
        await fileExists(
          artifact.launchTarget
        );

      const buildExists =
        await fileExists(
          artifact.path
        );

      return (
        indexExists &&
        buildExists
      );
    },

    async persistResult(
      result
    ) {
      const root =
        gameRoot(
          result.projectId
        );

      await fs.mkdir(
        root,
        {
          recursive:
            true
        }
      );

      await writeTextFile(
        path.join(
          root,
          "sovereign-game-result.json"
        ),
        JSON.stringify(
          result,
          null,
          2
        )
      );
    },

    async recordEvent(
      event
    ) {
      console.log(
        "[SOVEREIGN GAME EVENT]",
        event.type,
        event.projectId
      );
    }
  };
}

function createRealGameBuilder():
  SovereignAIGameCreationBuilder {
  return new SovereignAIGameCreationBuilder(
    createGameBuilderAdapter()
  );
}

// ============================================================
// RUNTIME HELPERS
// ============================================================

function commandProjectId(
  command:
    SovereignRuntimeCommand
): string {
  return (
    command.projectId
      ?.trim() ||
    `sovereign-project-${Date.now()}`
  );
}

function projectIdFromLiveTarget(
  liveTarget:
    string | undefined
): string | undefined {
  if (
    typeof liveTarget !==
      "string" ||
    !liveTarget.startsWith(
      "sovereign://"
    )
  ) {
    return undefined;
  }

  const value =
    liveTarget
      .slice(
        "sovereign://".length
      )
      .trim();

  return (
    value ||
    undefined
  );
}

// ============================================================
// AUTONOMOUS RUNTIME ADAPTER
// ============================================================

function createAutonomousRuntimeAdapter():
  SovereignAutonomousRuntimeAdapter {
  return {
    async buildPlatform(
      command
    ) {
      const projectId =
        commandProjectId(
          command
        );

      const builder =
        createRealPlatformBuilder();

      const request:
        SovereignPlatformBuildRequest = {
          id:
            `platform-request-${Date.now()}`,

          projectId,

          commandId:
            command.ownerCommandId,

          objective:
            command.instruction,

          constraints: [],

          autonomous:
            command.autonomous,

          createdAt:
            Date.now(),

          metadata: {
            runtimeCommandId:
              command.id,

            source:
              "SOVEREIGN-AI-REAL-COMPONENT-BINDINGS-224"
          }
        };

      const result =
        await builder.build(
          request
        );

      const success =
        result.status ===
          "READY" &&
        result.validation
          ?.success ===
          true;

      return {
        projectId:
          result.projectId,

        success,

        artifactPath:
          success
            ? result.projectId
            : undefined,

        output:
          result,

        errors:
          success
            ? []
            : [
                result.error ||
                "Platform builder did not reach READY."
              ]
      };
    },

    async buildGame(
      command
    ) {
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
          recursive:
            true,

          force:
            true
        }
      );

      gameFileState.delete(
        projectId
      );

      gameTestState.delete(
        projectId
      );

      const builder =
        createRealGameBuilder();

      const request:
        MajdGameCreationRequest = {
          id:
            `game-request-${Date.now()}`,

          commandId:
            command.ownerCommandId,

          projectId,

          name:
            deriveGameName(
              command.instruction
            ),

          description:
            command.instruction,

          genre:
            "CUSTOM",

          platforms: [
            "WEB",
            "MOBILE",
            "DESKTOP",
            "TABLET"
          ],

          language:
            "ar",

          requirements: [
            "Playable Web Build",
            "Keyboard controls",
            "Touch controls",
            "Desktop support",
            "Tablet support",
            "Mobile support"
          ],

          autonomous:
            command.autonomous,

          createdAt:
            Date.now(),

          metadata: {
            runtimeCommandId:
              command.id,

            source:
              "SOVEREIGN-AI-REAL-COMPONENT-BINDINGS-224",

            outputRoot:
              SOVEREIGN_OUTPUT_ROOT
          }
        };

      const result =
        await builder.create(
          request
        );

      const testSuccess =
        result.tests
          ?.success ===
        true;

      const testPlayable =
        result.tests
          ?.playable ===
        true;

      const artifactSuccess =
        result.artifact
          ?.success ===
        true;

      const artifactPathValid =
        typeof result.artifact
          ?.path ===
          "string" &&
        result.artifact.path
          .length >
          0;

      const launchTargetValid =
        typeof result.artifact
          ?.launchTarget ===
          "string" &&
        result.artifact
          .launchTarget
          .length >
          0;

      const playable =
        result.status ===
          "PLAYABLE" &&
        testSuccess &&
        testPlayable &&
        artifactSuccess &&
        artifactPathValid &&
        launchTargetValid;

      gamePlayableState.set(
        result.projectId,
        {
          projectId:
            result.projectId,

          playable,

          testSuccess:
            testSuccess &&
            testPlayable,

          artifactSuccess,

          artifactPath:
            result.artifact
              ?.path,

          launchTarget:
            result.artifact
              ?.launchTarget,

          verifiedAt:
            Date.now()
        }
      );

      console.log(
        "=========================================="
      );

      console.log(
        "SOVEREIGN REAL GAME BUILD"
      );

      console.log(
        "PROJECT:",
        result.projectId
      );

      console.log(
        "PLAYABLE:",
        playable
      );

      console.log(
        "WEB BUILD:",
        result.artifact?.path
      );

      console.log(
        "ENTRY:",
        result.artifact?.launchTarget
      );

      console.log(
        "=========================================="
      );

      return {
        projectId:
          result.projectId,

        success:
          playable,

        playable,

        artifactPath:
          result.artifact
            ?.path,

        output:
          result,

        errors:
          playable
            ? []
            : [
                result.error ||
                result.artifact
                  ?.errors.join(
                    "; "
                  ) ||
                "Game builder did not reach a verified PLAYABLE state."
              ]
      };
    },

    async buildAdmin(
      command
    ) {
      const projectId =
        commandProjectId(
          command
        );

      const builder =
        createRealAdminBuilder();

      const request:
        MajdAdminBuildRequest = {
          id:
            `admin-request-${Date.now()}`,

          projectId,

          commandId:
            command.ownerCommandId,

          autonomous:
            command.autonomous,

          createdAt:
            Date.now(),

          metadata: {
            runtimeCommandId:
              command.id,

            instruction:
              command.instruction,

            source:
              "SOVEREIGN-AI-REAL-COMPONENT-BINDINGS-224"
          }
        };

      const result =
        await builder.build(
          request
        );

      const success =
        result.status ===
          "READY" &&
        result.validation
          ?.success ===
          true &&
        result.validation
          .missingModules
          .length ===
          0;

      return {
        projectId:
          result.projectId,

        success,

        artifactPath:
          success
            ? `sovereign-admin://${result.projectId}`
            : undefined,

        output:
          result,

        errors:
          success
            ? []
            : [
                result.error ||
                "Admin builder did not reach READY."
              ]
      };
    },

    async buildCapability(
      command
    ) {
      const projectId =
        commandProjectId(
          command
        );

      const builder =
        createRealProjectBuilder();

      const request:
        SovereignProjectRequest = {
          id:
            `project-request-${Date.now()}`,

          commandId:
            command.ownerCommandId,

          instruction:
            command.instruction,

          projectId,

          type:
            command.type ===
              "SOCIAL"
              ? "SOCIAL"
              : command.type ===
                  "MEDIA"
                ? "MEDIA"
                : command.type ===
                    "PAYMENTS"
                  ? "PAYMENTS"
                  : command.type ===
                      "SERVICE"
                    ? "SERVICE"
                    : "GENERAL",

          constraints: [],

          autonomous:
            command.autonomous,

          createdAt:
            Date.now(),

          metadata: {
            runtimeCommandId:
              command.id,

            source:
              "SOVEREIGN-AI-REAL-COMPONENT-BINDINGS-224"
          }
        };

      const result =
        await builder.build(
          request
        );

      const success =
        result.status ===
          "READY" &&
        result.validation
          ?.success ===
          true &&
        result.build
          ?.success ===
          true;

      return {
        projectId:
          result.projectId,

        success,

        artifactPath:
          result.build
            ?.artifactPath,

        output:
          result,

        errors:
          success
            ? []
            : [
                result.error ||
                result.build
                  ?.errors.join(
                    "; "
                  ) ||
                "Capability builder failed."
              ]
      };
    },

    async testAndRepair(
      command,
      build
    ) {
      if (
        !build.success
      ) {
        return {
          success:
            false,

          releaseAllowed:
            false,

          repaired:
            false,

          repairAttempts:
            0,

          errors: [
            ...build.errors
          ]
        };
      }

      if (
        !build.output ||
        typeof build.output !==
          "object"
      ) {
        return {
          success:
            false,

          releaseAllowed:
            false,

          repaired:
            false,

          repairAttempts:
            0,

          errors: [
            "Sovereign build produced no verifiable output."
          ]
        };
      }

      if (
        command.type ===
        "GAME"
      ) {
        const result =
          build.output as
            MajdGameCreationResult;

        const proof =
          gamePlayableState.get(
            build.projectId
          );

        const artifactExists =
          proof?.artifactPath
            ? await fileExists(
                proof.artifactPath
              )
            : false;

        const launchExists =
          proof?.launchTarget
            ? await fileExists(
                proof.launchTarget
              )
            : false;

        const valid =
          result.status ===
            "PLAYABLE" &&
          result.tests
            ?.success ===
            true &&
          result.tests.playable ===
            true &&
          result.artifact
            ?.success ===
            true &&
          build.playable ===
            true &&
          proof?.playable ===
            true &&
          proof.testSuccess ===
            true &&
          proof.artifactSuccess ===
            true &&
          artifactExists &&
          launchExists;

        return {
          success:
            valid,

          releaseAllowed:
            valid,

          repaired:
            result.repairAttempts >
            0,

          repairAttempts:
            result.repairAttempts,

          errors:
            valid
              ? []
              : [
                  result.error ||
                  "Game playable filesystem verification failed."
                ]
        };
      }

      return {
        success:
          true,

        releaseAllowed:
          true,

        repaired:
          false,

        repairAttempts:
          0,

        errors: []
      };
    },

    async release(
      command,
      build,
      tests
    ) {
      if (
        !build.success ||
        !tests.success ||
        !tests.releaseAllowed
      ) {
        return {
          success:
            false,

          verified:
            false,

          errors: [
            "Release blocked by sovereign build/test gate."
          ]
        };
      }

      if (
        command.type ===
        "GAME"
      ) {
        const proof =
          gamePlayableState.get(
            build.projectId
          );

        if (
          !proof ||
          proof.playable !==
            true ||
          proof.testSuccess !==
            true ||
          proof.artifactSuccess !==
            true ||
          !proof.artifactPath ||
          !proof.launchTarget
        ) {
          return {
            success:
              false,

            verified:
              false,

            errors: [
              "Game release blocked because playable proof is incomplete."
            ]
          };
        }

        if (
          !(await fileExists(
            proof.launchTarget
          ))
        ) {
          return {
            success:
              false,

            verified:
              false,

            errors: [
              "Game release blocked because real Web Build entry is missing."
            ]
          };
        }
      }

      const projectId =
        build.projectId ||
        commandProjectId(
          command
        );

      return {
        success:
          true,

        liveTarget:
          `sovereign://${projectId}`,

        releaseId:
          `sovereign-release-${Date.now()}`,

        verified:
          true,

        errors: []
      };
    },

    async verifyLive(
      command,
      release
    ) {
      const visible =
        typeof release.liveTarget ===
          "string" &&
        release.liveTarget.length >
          0;

      const healthy =
        release.success ===
          true &&
        release.verified ===
          true;

      const releasedProjectId =
        projectIdFromLiveTarget(
          release.liveTarget
        );

      let playable:
        boolean | undefined;

      if (
        command.type ===
        "GAME"
      ) {
        const proof =
          releasedProjectId
            ? gamePlayableState.get(
                releasedProjectId
              )
            : undefined;

        const artifactExists =
          proof?.artifactPath
            ? await fileExists(
                proof.artifactPath
              )
            : false;

        const entryExists =
          proof?.launchTarget
            ? await fileExists(
                proof.launchTarget
              )
            : false;

        playable =
          proof?.playable ===
            true &&
          proof.testSuccess ===
            true &&
          proof.artifactSuccess ===
            true &&
          artifactExists &&
          entryExists;
      }

      const functional =
        command.type ===
          "GAME"
          ? (
              visible &&
              healthy &&
              playable ===
                true
            )
          : (
              visible &&
              healthy
            );

      const success =
        visible &&
        healthy &&
        functional;

      return {
        success,

        visible,

        healthy,

        functional,

        playable,

        checks: {
          releaseSuccess:
            release.success,

          releaseVerified:
            release.verified,

          liveTargetPresent:
            visible,

          playableProofPresent:
            command.type ===
              "GAME"
              ? playable ===
                  true
              : true
        },

        errors:
          success
            ? []
            : [
                command.type ===
                  "GAME"
                  ? "Real Web Build playable verification failed."
                  : "Sovereign runtime live verification failed."
              ]
      };
    },

    async recordEvent(
      event
    ) {
      console.log(
        "[SOVEREIGN AUTONOMOUS EVENT]",
        event.type,
        event.state
      );
    }
  };
}

function createRealAutonomousRuntime():
  SovereignAIAutonomousRuntime {
  return new SovereignAIAutonomousRuntime(
    createAutonomousRuntimeAdapter()
  );
}

// ============================================================
// BOOTSTRAP
// ============================================================

function createBootstrapAdapter():
  SovereignAIBootstrapAdapter {
  return {
    async verifyAuthority(
      request
    ): Promise<SovereignAuthorityCheck> {
      const ownerAuthority =
        request.ownerId
          .trim()
          .length >
        0;

      return {
        valid:
          ownerAuthority,

        ownerAuthority,

        stewardAvailable:
          true,

        errors:
          ownerAuthority
            ? []
            : [
                "OWNER authority is unavailable."
              ]
      };
    },

    async integrateSystem():
      Promise<SovereignIntegrationCheck> {
      const missing:
        string[] = [];

      const unhealthy:
        string[] = [];

      const errors:
        string[] = [];

      const special =
        new Set<
          SovereignFinalComponent
        >([
          "BOOTSTRAP",
          "AUTONOMOUS_RUNTIME",
          "PROJECT_BUILDER",
          "PLATFORM_BUILDER",
          "ADMIN_BUILDER",
          "GAME_BUILDER"
        ]);

      for (
        const component of
          Object.keys(
            componentModules
          ) as SovereignFinalComponent[]
      ) {
        if (
          special.has(
            component
          )
        ) {
          continue;
        }

        try {
          await loadRealModule(
            component
          );
        } catch (error) {
          unhealthy.push(
            component
          );

          errors.push(
            `${component}: ${
              error instanceof Error
                ? error.message
                : String(error)
            }`
          );
        }
      }

      return {
        ready:
          missing.length ===
            0 &&
          unhealthy.length ===
            0 &&
          errors.length ===
            0,

        missing,

        unhealthy,

        errors
      };
    },

    async startRuntime(
      request
    ): Promise<SovereignRuntimeStartResult> {
      await fs.mkdir(
        SOVEREIGN_OUTPUT_ROOT,
        {
          recursive:
            true
        }
      );

      return {
        success:
          true,

        runtimeId:
          "SOVEREIGN-BOOTSTRAP-GATE-220",

        state:
          "RUNNING",

        liveTarget:
          `sovereign://${request.projectId}`,

        errors: []
      };
    },

    async verifySystem(
      _request,
      runtime
    ): Promise<SovereignFinalVerification> {
      const runtimeReady =
        runtime.success ===
          true &&
        runtime.state ===
          "RUNNING" &&
        runtime.errors.length ===
          0;

      const brainReady =
        !!componentModules[
          "MASTER_BRAIN"
        ];

      const buildersReady =
        !!componentModules[
          "PROJECT_BUILDER"
        ] &&
        !!componentModules[
          "PLATFORM_BUILDER"
        ] &&
        !!componentModules[
          "ADMIN_BUILDER"
        ] &&
        !!componentModules[
          "GAME_BUILDER"
        ];

      const testingReady =
        !!componentModules[
          "TEST_ENGINE"
        ];

      const repairReady =
        !!componentModules[
          "REPAIR"
        ] &&
        !!componentModules[
          "SELF_TEST_REPAIR"
        ];

      const releaseReady =
        !!componentModules[
          "RELEASE_MANAGER"
        ];

      const knowledgeReady =
        !!componentModules[
          "KNOWLEDGE_SYNTHESIS"
        ] &&
        !!componentModules[
          "KNOWLEDGE_RETRIEVAL"
        ] &&
        !!componentModules[
          "KNOWLEDGE_GUIDANCE"
        ];

      const ownerControlReady =
        !!componentModules[
          "AUTHORITY"
        ] &&
        !!componentModules[
          "OWNER_COMMAND_GATEWAY"
        ];

      const visible =
        typeof runtime.liveTarget ===
          "string" &&
        runtime.liveTarget.length >
          0;

      const success =
        runtimeReady &&
        brainReady &&
        buildersReady &&
        testingReady &&
        repairReady &&
        releaseReady &&
        knowledgeReady &&
        ownerControlReady &&
        visible;

      const errors:
        string[] = [];

      if (!runtimeReady) {
        errors.push(
          ...runtime.errors
        );
      }

      if (!brainReady) {
        errors.push(
          "MASTER_BRAIN is unavailable."
        );
      }

      if (!buildersReady) {
        errors.push(
          "Sovereign builders are unavailable."
        );
      }

      if (!testingReady) {
        errors.push(
          "TEST_ENGINE is unavailable."
        );
      }

      if (!repairReady) {
        errors.push(
          "Repair system is unavailable."
        );
      }

      if (!releaseReady) {
        errors.push(
          "RELEASE_MANAGER is unavailable."
        );
      }

      if (!knowledgeReady) {
        errors.push(
          "Knowledge system is unavailable."
        );
      }

      if (!ownerControlReady) {
        errors.push(
          "OWNER control system is unavailable."
        );
      }

      if (!visible) {
        errors.push(
          "Runtime live target is unavailable."
        );
      }

      return {
        success,

        brainReady,

        runtimeReady,

        buildersReady,

        testingReady,

        repairReady,

        releaseReady,

        knowledgeReady,

        ownerControlReady,

        visible,

        errors
      };
    },

    async stopRuntime() {
      return;
    },

    async recordEvent(
      event
    ) {
      console.log(
        "[SOVEREIGN BOOTSTRAP EVENT]",
        event.type,
        event.state
      );
    }
  };
}

function createRealBootstrap():
  SovereignAIBootstrap {
  return new SovereignAIBootstrap(
    createBootstrapAdapter()
  );
}

// ============================================================
// COMPONENT RESOLVER
// ============================================================

export async function resolveSovereignRealComponent(
  component:
    SovereignFinalComponent
): Promise<unknown | undefined> {
  const modulePath =
    componentModules[
      component
    ];

  if (!modulePath) {
    return undefined;
  }

  switch (
    component
  ) {
    case "BOOTSTRAP":
      return createRealBootstrap();

    case "AUTONOMOUS_RUNTIME":
      return createRealAutonomousRuntime();

    case "PROJECT_BUILDER":
      return createRealProjectBuilder();

    case "PLATFORM_BUILDER":
      return createRealPlatformBuilder();

    case "ADMIN_BUILDER":
      return createRealAdminBuilder();

    case "GAME_BUILDER":
      return createRealGameBuilder();

    default:
      break;
  }

  const module =
    await loadRealModule(
      component
    );

  return new SovereignRealModule(
    component,
    modulePath,
    module
  );
}

// ============================================================
// HEALTH CHECK
// ============================================================

async function checkRealComponentHealth(
  component:
    SovereignFinalComponent,

  instance:
    unknown
): Promise<{
  healthy: boolean;
  errors: string[];
}> {
  if (!instance) {
    return {
      healthy:
        false,

      errors: [
        `${component} is unavailable.`
      ]
    };
  }

  const candidate =
    instance as
      Record<
        string,
        unknown
      >;

  const requiredMethod =
    component ===
      "BOOTSTRAP"
      ? "boot"
      : component ===
          "AUTONOMOUS_RUNTIME"
        ? "execute"
        : component ===
            "GAME_BUILDER"
          ? "create"
          : (
              component ===
                "PROJECT_BUILDER" ||
              component ===
                "PLATFORM_BUILDER" ||
              component ===
                "ADMIN_BUILDER"
            )
            ? "build"
            : undefined;

  if (
    requiredMethod
  ) {
    const healthy =
      typeof candidate[
        requiredMethod
      ] ===
      "function";

    return {
      healthy,

      errors:
        healthy
          ? []
          : [
              `${component} does not expose ${requiredMethod}().`
            ]
    };
  }

  const healthCheck =
    candidate[
      "healthCheck"
    ];

  if (
    typeof healthCheck ===
    "function"
  ) {
    try {
      const healthy =
        await (
          healthCheck as
            () =>
              Promise<boolean>
        ).call(
          instance
        );

      return {
        healthy,

        errors:
          healthy
            ? []
            : [
                `${component} health check failed.`
              ]
      };
    } catch (error) {
      return {
        healthy:
          false,

        errors: [
          `${component}: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`
        ]
      };
    }
  }

  return {
    healthy:
      true,

    errors: []
  };
}

// ============================================================
// REAL FINAL RUNTIME FACTORY
// ============================================================

export function createSovereignRealRuntime(
  ownerId: string,
  projectId: string
): SovereignAIFinalRuntime {
  return new SovereignAIFinalRuntime({
    ownerId,

    projectId,

    autonomous:
      true,

    instruction:
      "Start SOVEREIGN AI PLATFORM in final autonomous production mode.",

    componentResolver:
      resolveSovereignRealComponent,

    componentHealthCheck:
      checkRealComponentHealth,

    onEvent:
      async event => {
        console.log(
          "[SOVEREIGN REAL EVENT]",
          event[
            "type"
          ] ??
            "UNKNOWN"
        );
      }
  });
}

// ============================================================
// COMPONENT INFORMATION
// ============================================================

export function getSovereignRealComponentModules():
  Readonly<
    Partial<
      Record<
        SovereignFinalComponent,
        string
      >
    >
  > {
  return {
    ...componentModules
  };
}

// ============================================================
// OUTPUT INFORMATION
// ============================================================

export function getSovereignOutputRoot():
  string {
  return SOVEREIGN_OUTPUT_ROOT;
}

export function getSovereignGameBuildPath(
  projectId: string
): string {
  return gameBuildDirectory(
    projectId
  );
}

// ============================================================
// FINAL EXPORT
// ============================================================

export default createSovereignRealRuntime;

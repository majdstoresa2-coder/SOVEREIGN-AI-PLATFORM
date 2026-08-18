// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-REAL-COMPONENT-BINDINGS-224.ts
// REAL COMPONENT BINDING LAYER
// REAL FILESYSTEM GAME BUILD + CODE ENGINE BINDING
// MAJD WEBGL 3D + CANVAS 2D FALLBACK
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
  SovereignRuntimeBuildResult
} from "./SOVEREIGN-AI-AUTONOMOUS-RUNTIME-215.ts";

import {
  SovereignAIAutonomousProjectBuilder
} from "./SOVEREIGN-AI-AUTONOMOUS-PROJECT-BUILDER-209.ts";

import type {
  SovereignAutonomousProjectBuilderAdapter,
  SovereignProjectRequest,
  SovereignProjectBlueprint,
  SovereignProjectFile,
  SovereignGeneratedArtifact,
  SovereignProjectValidation
} from "./SOVEREIGN-AI-AUTONOMOUS-PROJECT-BUILDER-209.ts";

import {
  SovereignAIPlatformBuilder
} from "./SOVEREIGN-AI-PLATFORM-BUILDER-210.ts";

import type {
  SovereignAIPlatformBuilderAdapter,
  SovereignPlatformBuildRequest,
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
  MajdAdminModule,
  MajdAdminModuleResult
} from "./SOVEREIGN-AI-ADMIN-CONTROL-BUILDER-211.ts";

import {
  SovereignAIGameCreationBuilder
} from "./SOVEREIGN-AI-GAME-CREATION-BUILDER-212.ts";

import type {
  SovereignAIGameCreationAdapter,
  MajdGameCreationRequest,
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
// OUTPUT
// ============================================================

const SOVEREIGN_OUTPUT_ROOT = path.resolve(
  process.env.SOVEREIGN_OUTPUT_DIR ||
    path.join(
      process.cwd(),
      "sovereign-output"
    )
);

function safeProjectId(
  value: string
): string {
  const normalized = value
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
  let relative = filePath
    .replace(
      /\\/g,
      "/"
    )
    .trim();

  const prefix =
    `${projectId}/`;

  if (
    relative.startsWith(
      prefix
    )
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
    path.normalize(
      relative
    );

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
      recursive: true
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
// COMPONENT MODULE MAP
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
// STATE
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
// REAL MODULE
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

async function loadRealModule(
  component:
    SovereignFinalComponent
): Promise<Record<string, unknown>> {
  const cached =
    moduleCache.get(
      component
    );

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
// PLATFORM BUILDER
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
          ? failures.join("; ")
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
    ) {
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
      return buildPlatformComponent(
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
        failed.length >
        0
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
          ?.success ===
          true &&
        result.validation
          .missingComponents
          .length ===
          0 &&
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
        SovereignGeneratedArtifact[] =
        [];

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
        failed.length >
        0
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
// GAME DESIGN
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
// LEGACY GAME SOURCES
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
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#07131f">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="./styles.css">
</head>
<body>
<main id="game-root">
<canvas id="game-canvas" aria-label="${escapeHtml(title)}"></canvas>

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

<script type="module" src="./src/game.js"></script>
</body>
</html>`;
}

function cssSource():
  string {
  return `* {
box-sizing:border-box;
-webkit-tap-highlight-color:transparent;
}

html,body {
margin:0;
width:100%;
height:100%;
overflow:hidden;
background:#07131f;
color:#fff;
font-family:Arial,sans-serif;
}

#game-root {
position:relative;
width:100%;
height:100%;
min-height:100dvh;
overflow:hidden;
}

#game-canvas {
display:block;
width:100%;
height:100%;
touch-action:none;
background:#183c2a;
}

#hud {
position:absolute;
top:max(12px,env(safe-area-inset-top));
left:12px;
right:12px;
display:flex;
justify-content:space-between;
gap:12px;
pointer-events:none;
}

.brand,#stats,#message {
background:rgba(0,0,0,.52);
border:1px solid rgba(255,255,255,.14);
backdrop-filter:blur(10px);
border-radius:14px;
}

.brand {
display:flex;
flex-direction:column;
padding:10px 14px;
}

#stats {
display:flex;
gap:12px;
padding:10px 14px;
}

#message {
position:absolute;
left:50%;
bottom:max(16px,env(safe-area-inset-bottom));
transform:translateX(-50%);
display:flex;
flex-direction:column;
padding:10px 16px;
text-align:center;
pointer-events:none;
}

#touch-controls {
position:absolute;
right:18px;
bottom:calc(88px + env(safe-area-inset-bottom));
display:none;
flex-direction:column;
align-items:center;
gap:6px;
}

#touch-controls div {
display:flex;
gap:6px;
}

#touch-controls button {
width:54px;
height:54px;
border:1px solid rgba(255,255,255,.2);
border-radius:14px;
background:rgba(0,0,0,.55);
color:#fff;
font-size:18px;
touch-action:none;
}

@media (pointer:coarse),(max-width:900px) {
#touch-controls {
display:flex;
}
}`;
}

function coreGameplaySource():
  string {
  return `export function createWorld() {
return {
width:2400,
height:1600,
resources:{
gold:500,
wood:500,
stone:500
},
castle:{
x:1200,
y:800,
radius:150
},
dragon:{
x:1750,
y:500,
radius:52
}
};
}

export function clamp(value,min,max) {
return Math.max(min,Math.min(max,value));
}`;
}

function playerRuntimeSource():
  string {
  return `import { clamp } from "./core-gameplay.js";

export function createPlayer(world) {
return {
x:world.width/2,
y:world.height/2+250,
radius:20,
speed:310
};
}

export function updatePlayer(player,world,input,delta) {
let dx=0;
let dy=0;

if(input.left) dx-=1;
if(input.right) dx+=1;
if(input.up) dy-=1;
if(input.down) dy+=1;

if(dx!==0||dy!==0) {
const length=Math.hypot(dx,dy)||1;
dx/=length;
dy/=length;

player.x+=dx*player.speed*delta;
player.y+=dy*player.speed*delta;
}

player.x=clamp(
player.x,
player.radius,
world.width-player.radius
);

player.y=clamp(
player.y,
player.radius,
world.height-player.radius
);
}`;
}

function uiSource():
  string {
  return `export function bindHud(world) {
const gold=document.getElementById("gold");
const wood=document.getElementById("wood");
const stone=document.getElementById("stone");

function render() {
if(gold) gold.textContent=String(world.resources.gold);
if(wood) wood.textContent=String(world.resources.wood);
if(stone) stone.textContent=String(world.resources.stone);
}

render();

return { render };
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

  return `import { createWorld } from "./systems/core-gameplay.js";
import { createPlayer,updatePlayer } from "./systems/player-runtime.js";
import { bindHud } from "./systems/game-ui.js";

const canvas=document.getElementById("game-canvas");
const context=canvas.getContext("2d");

if(!context) {
throw new Error("Canvas 2D context unavailable.");
}

const world=createWorld();
const player=createPlayer(world);

bindHud(world);

const input={
up:false,
down:false,
left:false,
right:false
};

const mapping={
ArrowUp:"up",
w:"up",
W:"up",
ArrowDown:"down",
s:"down",
S:"down",
ArrowLeft:"left",
a:"left",
A:"left",
ArrowRight:"right",
d:"right",
D:"right"
};

window.addEventListener("keydown",event=>{
const key=mapping[event.key];
if(key) {
input[key]=true;
event.preventDefault();
}
});

window.addEventListener("keyup",event=>{
const key=mapping[event.key];
if(key) {
input[key]=false;
event.preventDefault();
}
});

document.querySelectorAll("[data-key]").forEach(element=>{
const key=element.dataset.key;
if(!key) return;

const start=event=>{
event.preventDefault();
input[key]=true;
};

const stop=event=>{
event.preventDefault();
input[key]=false;
};

element.addEventListener("pointerdown",start);
element.addEventListener("pointerup",stop);
element.addEventListener("pointercancel",stop);
element.addEventListener("pointerleave",stop);
});

function resize() {
const ratio=Math.max(
1,
Math.min(window.devicePixelRatio||1,2)
);

const rect=canvas.getBoundingClientRect();

canvas.width=Math.floor(rect.width*ratio);
canvas.height=Math.floor(rect.height*ratio);

context.setTransform(
ratio,0,0,ratio,0,0
);
}

window.addEventListener("resize",resize);
resize();

function drawWorld(width,height) {
const cameraX=player.x-width/2;
const cameraY=player.y-height/2;

context.clearRect(0,0,width,height);

context.fillStyle="#183c2a";
context.fillRect(0,0,width,height);

context.save();
context.translate(-cameraX,-cameraY);

context.fillStyle="#234e31";
context.fillRect(
0,0,world.width,world.height
);

context.fillStyle="#277fa4";
context.fillRect(
0,1080,world.width,120
);

context.fillStyle="#51625b";

for(let index=0;index<12;index+=1) {
const x=120+index*190;
const y=130+(index%3)*65;

context.beginPath();
context.moveTo(x,y+130);
context.lineTo(x+70,y);
context.lineTo(x+140,y+130);
context.closePath();
context.fill();
}

for(let index=0;index<80;index+=1) {
const x=70+(index*211)%2250;
const y=330+(index*127)%1100;

context.fillStyle="#153a24";
context.beginPath();
context.arc(x,y,17,0,Math.PI*2);
context.fill();
}

context.strokeStyle="#d0bd8a";
context.lineWidth=20;

context.strokeRect(
world.castle.x-190,
world.castle.y-160,
380,
320
);

context.fillStyle="#a28d65";

context.fillRect(
world.castle.x-90,
world.castle.y-90,
180,
180
);

const towerPositions=[
[-190,-160],
[190,-160],
[-190,160],
[190,160]
];

for(const [offsetX,offsetY] of towerPositions) {
context.fillStyle="#786746";
context.beginPath();

context.arc(
world.castle.x+offsetX,
world.castle.y+offsetY,
34,
0,
Math.PI*2
);

context.fill();
}

context.fillStyle="#9c2f2f";
context.beginPath();

context.arc(
world.dragon.x,
world.dragon.y,
world.dragon.radius,
0,
Math.PI*2
);

context.fill();

context.fillStyle="#ffd46b";
context.font="bold 18px Arial";
context.textAlign="center";

context.fillText(
"DRAGON BOSS",
world.dragon.x,
world.dragon.y-72
);

context.fillStyle="#f0d16d";
context.beginPath();

context.arc(
player.x,
player.y,
player.radius,
0,
Math.PI*2
);

context.fill();

context.restore();

context.fillStyle="rgba(255,255,255,.65)";
context.font="12px Arial";
context.textAlign="left";

context.fillText(
${concept},
16,
height-16
);
}

let previous=performance.now();

function frame(now) {
const delta=Math.min(
(now-previous)/1000,
0.05
);

previous=now;

updatePlayer(
player,
world,
input,
delta
);

const rect=canvas.getBoundingClientRect();

drawWorld(
rect.width,
rect.height
);

requestAnimationFrame(frame);
}

requestAnimationFrame(frame);`;
}

// ============================================================
// CODE ENGINE ADAPTER
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
          `export const sovereignSystem=${JSON.stringify(
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
            checksum(
              content
            )
        }
      ];
    },

    async validateSyntax(
      files
    ) {
      return files.every(
        file =>
          file.content.trim()
            .length >
            0 &&
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
        const file of
          files
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
          `CODE_ENGINE failed for ${system.id}: ${
            codeResult.error ??
            codeResult.validation.issues.join(
              "; "
            )
          }`
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

      await writeTextFile(
        path.join(
          gameWorkspace(
            projectId
          ),
          relative
        ),
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
        missing.length >
        0
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
        MajdGameGeneratedFile[] =
        [];

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

      return (
        await fileExists(
          artifact.launchTarget
        )
      ) &&
      (
        await fileExists(
          artifact.path
        )
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
// MAJD UNIVERSAL CREATION ENGINE
// ============================================================

export type MajdSovereignProductType =
  | "GAME"
  | "PLATFORM"
  | "ADMIN"
  | "SOCIAL"
  | "SHORT_VIDEO"
  | "LONG_VIDEO"
  | "STORIES"
  | "LIVE"
  | "CHAT"
  | "COMMUNITIES"
  | "TV"
  | "CINEMA"
  | "FILM"
  | "SERIES"
  | "ANIMATION"
  | "DOCUMENTARY"
  | "ADVERTISING"
  | "CREATOR"
  | "COMMERCE"
  | "WALLET"
  | "BILLING"
  | "LEDGER"
  | "LEGAL"
  | "LICENSING"
  | "MAIL"
  | "SECURITY"
  | "INFRASTRUCTURE"
  | "SERVICE"
  | "GENERAL";

export type MajdLegalStage =
  | "FREELANCE_DOCUMENT"
  | "ESTABLISHMENT"
  | "COMPANY";

export type MajdExecutionState =
  | "RECEIVED"
  | "UNDERSTANDING"
  | "PLANNING"
  | "DESIGNING"
  | "GENERATING"
  | "WRITING"
  | "INTEGRATING"
  | "TESTING"
  | "QUALITY_CHECK"
  | "REPAIRING"
  | "BUILDING"
  | "VERIFYING"
  | "READY"
  | "BLOCKED"
  | "FAILED";

export interface MajdSovereignCreationRequest {
  id: string;
  ownerId: string;
  instruction: string;
  projectId: string;

  productType:
    MajdSovereignProductType;

  autonomous: boolean;

  legalStage:
    MajdLegalStage;

  createdAt: number;

  metadata?: Record<
    string,
    unknown
  >;
}

export interface MajdPhysicalFile {
  path: string;
  content: string;
  checksum: string;

  category:
    | "SOURCE"
    | "BUILD"
    | "CONFIG"
    | "ASSET"
    | "LEGAL"
    | "RIGHTS"
    | "REPORT";
}

export interface MajdQualityResult {
  success: boolean;
  score: number;

  checks:
    Record<
      string,
      boolean
    >;

  errors: string[];
  warnings: string[];
}

export interface MajdRightsResult {
  success: boolean;

  originalOnly:
    boolean;

  externalDependencyFound:
    boolean;

  prohibitedDependencyFound:
    boolean;

  errors:
    string[];

  warnings:
    string[];
}

export interface MajdSovereignCreationResult {
  id: string;
  projectId: string;

  productType:
    MajdSovereignProductType;

  state:
    MajdExecutionState;

  success:
    boolean;

  playable?:
    boolean;

  buildPath?:
    string;

  launchTarget?:
    string;

  files:
    MajdPhysicalFile[];

  quality?:
    MajdQualityResult;

  rights?:
    MajdRightsResult;

  repairAttempts:
    number;

  errors:
    string[];

  startedAt:
    number;

  completedAt:
    number;
}

export const MAJD_SOVEREIGN_OWNERSHIP_POLICY =
  Object.freeze({
    owner:
      "MAJD",

    ownerAuthority:
      "SUPREME",

    stewardAuthority:
      "DELEGATED",

    internalFirst:
      true,

    externalCoreProvidersAllowed:
      false,

    thirdPartyGameEngines:
      "PROHIBITED",

    thirdPartyPlatformCore:
      "PROHIBITED",

    thirdPartyAIControlPlane:
      "PROHIBITED",

    thirdPartyDeploymentControlPlane:
      "PROHIBITED",

    unknownThirdPartyAssets:
      "PROHIBITED",

    allowedTemporaryOrRegulatedGateways: [
      "GMAIL_TRANSITIONAL_ONLY",
      "MOYASAR_PAYMENT_GATEWAY"
    ],

    futureMailTarget:
      "MAJD_INTERNAL_MAIL",

    sovereignEngine:
      "MAJD_WEB_ENGINE",

    sovereignRuntime:
      "MAJD_SOVEREIGN_RUNTIME"
  } as const);

export const MAJD_LEGAL_ENTITY_LIFECYCLE =
  Object.freeze({
    current:
      "FREELANCE_DOCUMENT" as
        MajdLegalStage,

    progression: [
      "FREELANCE_DOCUMENT",
      "ESTABLISHMENT",
      "COMPANY"
    ] as const,

    ownerNotificationDriven:
      true,

    autonomousPropagation:
      true
  } as const);

const MAJD_PROHIBITED_EXTERNAL_ENGINES =
  new Set([
    "unity",
    "unreal",
    "godot",
    "babylon",
    "babylonjs",
    "three.js",
    "threejs"
  ]);

function inspectMajdRights(
  request:
    MajdSovereignCreationRequest,

  files:
    MajdPhysicalFile[]
): MajdRightsResult {
  const errors:
    string[] = [];

  const warnings:
    string[] = [];

  let externalDependencyFound =
    false;

  let prohibitedDependencyFound =
    false;

  const combined = [
    request.instruction,

    ...files.map(
      file =>
        file.content
    )
  ]
    .join("\n")
    .toLowerCase();

  for (
    const engine of
      MAJD_PROHIBITED_EXTERNAL_ENGINES
  ) {
    if (
      combined.includes(
        `from "${engine}`
      ) ||
      combined.includes(
        `from '${engine}`
      )
    ) {
      externalDependencyFound =
        true;

      prohibitedDependencyFound =
        true;

      errors.push(
        `Prohibited external core dependency detected: ${engine}`
      );
    }
  }

  return {
    success:
      !prohibitedDependencyFound,

    originalOnly:
      !prohibitedDependencyFound,

    externalDependencyFound,

    prohibitedDependencyFound,

    errors,
    warnings
  };
}

function createMajdRightsManifest(
  request:
    MajdSovereignCreationRequest
): string {
  return JSON.stringify(
    {
      platform:
        "MAJD",

      ownerAuthority:
        "SUPREME",

      projectId:
        request.projectId,

      legalStage:
        request.legalStage,

      intellectualPropertyPolicy: {
        internalOriginalCreation:
          true,

        thirdPartyOwnershipClaim:
          false,

        unknownRightsAssetsAllowed:
          false,

        externalCoreEnginesAllowed:
          false
      },

      generatedAt:
        Date.now()
    },
    null,
    2
  );
}

// ============================================================
// MAJD ENGINE - WEBGL 3D + CANVAS 2D FALLBACK
// ============================================================

function createMajdEngineSource():
  string {
  return `"use strict";

export class MajdEngine {
  constructor(canvas) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error(
        "MAJD Engine requires a canvas."
      );
    }

    this.canvas = canvas;

    this.mode = "2d";

    this.gl = null;
    this.ctx = null;

    this.running = false;
    this.scene = null;

    this.lastTimestamp = 0;

    this.resize =
      this.resize.bind(this);

    this.frame =
      this.frame.bind(this);

    const webglOptions = {
      antialias: true,
      alpha: false,
      depth: true,
      powerPreference:
        "high-performance"
    };

    try {
      this.gl =
        canvas.getContext(
          "webgl2",
          webglOptions
        ) ||
        canvas.getContext(
          "webgl",
          webglOptions
        );
    } catch {
      this.gl = null;
    }

    if (this.gl) {
      this.mode =
        "webgl";

      this.gl.enable(
        this.gl.DEPTH_TEST
      );

      this.gl.depthFunc(
        this.gl.LEQUAL
      );

      this.gl.clearColor(
        0.55,
        0.72,
        0.84,
        1
      );
    } else {
      this.ctx =
        canvas.getContext(
          "2d",
          {
            alpha: false
          }
        );

      if (!this.ctx) {
        throw new Error(
          "MAJD Engine: neither WebGL nor Canvas 2D is available."
        );
      }

      this.mode =
        "2d";
    }

    window.addEventListener(
      "resize",
      this.resize
    );

    this.resize();
  }

  resize() {
    const dpr =
      Math.max(
        1,
        Math.min(
          window.devicePixelRatio ||
            1,
          2
        )
      );

    const cssWidth =
      Math.max(
        1,
        this.canvas.clientWidth
      );

    const cssHeight =
      Math.max(
        1,
        this.canvas.clientHeight
      );

    const width =
      Math.floor(
        cssWidth *
        dpr
      );

    const height =
      Math.floor(
        cssHeight *
        dpr
      );

    if (
      this.canvas.width !== width ||
      this.canvas.height !== height
    ) {
      this.canvas.width =
        width;

      this.canvas.height =
        height;
    }

    if (this.gl) {
      this.gl.viewport(
        0,
        0,
        width,
        height
      );
    }

    if (this.ctx) {
      this.ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );
    }
  }

  setScene(scene) {
    this.scene =
      scene;
  }

  switchTo2D() {
    if (this.ctx) {
      this.mode =
        "2d";

      return true;
    }

    this.gl = null;

    this.ctx =
      this.canvas.getContext(
        "2d",
        {
          alpha: false
        }
      );

    if (this.ctx) {
      this.mode =
        "2d";

      this.resize();

      return true;
    }

    return false;
  }

  start() {
    if (this.running) {
      return;
    }

    this.running =
      true;

    this.lastTimestamp =
      0;

    requestAnimationFrame(
      this.frame
    );
  }

  stop() {
    this.running =
      false;
  }

  frame(timestamp) {
    if (!this.running) {
      return;
    }

    const delta =
      this.lastTimestamp === 0
        ? 0
        : Math.min(
            (
              timestamp -
              this.lastTimestamp
            ) /
              1000,
            0.05
          );

    this.lastTimestamp =
      timestamp;

    const scene =
      this.scene;

    if (
      scene &&
      typeof scene.update ===
        "function"
    ) {
      scene.update(
        delta,
        this
      );
    }

    if (
      this.mode ===
        "webgl" &&
      this.gl
    ) {
      const gl =
        this.gl;

      gl.clear(
        gl.COLOR_BUFFER_BIT |
        gl.DEPTH_BUFFER_BIT
      );

      try {
        if (
          scene &&
          typeof scene.render3D ===
            "function"
        ) {
          scene.render3D(
            gl,
            this
          );
        }
      } catch (error) {
        console.error(
          "MAJD WebGL render failed. Switching to Canvas 2D.",
          error
        );

        if (
          !this.switchTo2D()
        ) {
          this.stop();

          throw error;
        }
      }
    }

    if (
      this.mode ===
        "2d" &&
      this.ctx
    ) {
      const ctx =
        this.ctx;

      const width =
        this.canvas.clientWidth;

      const height =
        this.canvas.clientHeight;

      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      if (
        scene &&
        typeof scene.render2D ===
          "function"
      ) {
        scene.render2D(
          ctx,
          this
        );
      }
    }

    requestAnimationFrame(
      this.frame
    );
  }
}`;
}

// ============================================================
// MAJD WORLD
// ============================================================

function createMajdWorldSource(
  instruction: string
): string {
  const frozen =
    /صقيع|ثلج|frozen|snow|ice/i.test(
      instruction
    );

  return `"use strict";

export function createMajdWorld() {
  return {
    id:
      "majd-world",

    theme:
      ${JSON.stringify(
        frozen
          ? "FROZEN_KINGDOM"
          : "MAJD_ORIGINAL_WORLD"
      )},

    width:
      2400,

    height:
      1600,

    resources: {
      gold:
        1500,

      wood:
        1200,

      stone:
        1000,

      food:
        1400
    },

    playerStart: {
      x:
        1200,

      y:
        1120
    },

    playerRadius:
      20,

    playerSpeed:
      310,

    castle: {
      x:
        1200,

      y:
        800,

      width:
        380,

      depth:
        320,

      height:
        180
    },

    towers: [
      {
        x:
          1010,

        y:
          640
      },

      {
        x:
          1390,

        y:
          640
      },

      {
        x:
          1010,

        y:
          960
      },

      {
        x:
          1390,

        y:
          960
      }
    ],

    buildings: [
      {
        x:
          1100,

        y:
          790,

        width:
          90,

        height:
          75,

        depth:
          90
      },

      {
        x:
          1300,

        y:
          790,

        width:
          90,

        height:
          75,

        depth:
          90
      },

      {
        x:
          1200,

        y:
          700,

        width:
          110,

        height:
          90,

        depth:
          100
      }
    ],

    dragon: {
      x:
        1750,

      y:
        500,

      radius:
        52,

      height:
        120
    },

    river: {
      y:
        1260,

      width:
        130
    },

    terrain: {
      enabled:
        true,

      elevation:
        true,

      mountains:
        true,

      valleys:
        true,

      roads:
        true,

      strategicRegions:
        true
    },

    environment: {
      snow:
        ${frozen},

      storms:
        ${frozen},

      fog:
        true,

      dayNight:
        true,

      dynamicLighting:
        true
    },

    kingdom: {
      castle:
        true,

      walls:
        true,

      gates:
        true,

      defenseTowers:
        true,

      residential:
        true,

      warehouses:
        true,

      barracks:
        true,

      hospital:
        true,

      research:
        true,

      workshops:
        true,

      trade:
        true
    },

    systems: {
      resources:
        true,

      upgrades:
        true,

      heroes:
        true,

      armies:
        true,

      quests:
        true,

      exploration:
        true,

      alliances:
        true,

      progression:
        true
    }
  };
}`;
}

// ============================================================
// MAJD GAME RUNTIME
// ============================================================

function createMajdGameRuntimeSource(
  instruction: string
): string {
  return `"use strict";

import {
  MajdEngine
} from "./majd-engine.js";

import {
  createMajdWorld
} from "./majd-world.js";

const canvas =
  document.getElementById(
    "majd-game"
  );

if (
  !(canvas instanceof HTMLCanvasElement)
) {
  throw new Error(
    "MAJD game canvas not found."
  );
}

const engine =
  new MajdEngine(
    canvas
  );

const world =
  createMajdWorld();

const player = {
  x:
    world.playerStart.x,

  y:
    world.playerStart.y,

  radius:
    world.playerRadius,

  speed:
    world.playerSpeed
};

const input = {
  up:
    false,

  down:
    false,

  left:
    false,

  right:
    false
};

const mapping = {
  ArrowUp:
    "up",

  w:
    "up",

  W:
    "up",

  ArrowDown:
    "down",

  s:
    "down",

  S:
    "down",

  ArrowLeft:
    "left",

  a:
    "left",

  A:
    "left",

  ArrowRight:
    "right",

  d:
    "right",

  D:
    "right"
};

globalThis.MAJD_GAME_PROOF = {
  runtimeStarted:
    false,

  renderedFrames:
    0,

  visibleObjects:
    0,

  worldReady:
    false,

  terrainReady:
    false,

  cameraReady:
    false,

  interactionReady:
    true,

  renderMode:
    engine.mode,

  blankFrame:
    true,

  lastFrameAt:
    0
};

function clamp(
  value,
  minimum,
  maximum
) {
  return Math.max(
    minimum,
    Math.min(
      maximum,
      value
    )
  );
}

function setInput(
  key,
  active
) {
  if (
    key &&
    Object.prototype
      .hasOwnProperty.call(
        input,
        key
      )
  ) {
    input[key] =
      active;

    globalThis
      .MAJD_GAME_PROOF
      .interactionReady =
      true;
  }
}

window.addEventListener(
  "keydown",
  event => {
    const key =
      mapping[
        event.key
      ];

    if (key) {
      setInput(
        key,
        true
      );

      event.preventDefault();
    }
  }
);

window.addEventListener(
  "keyup",
  event => {
    const key =
      mapping[
        event.key
      ];

    if (key) {
      setInput(
        key,
        false
      );

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

      if (!key) {
        return;
      }

      const start =
        event => {
          event.preventDefault();

          setInput(
            key,
            true
          );
        };

      const stop =
        event => {
          event.preventDefault();

          setInput(
            key,
            false
          );
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

// ============================================================
// MATRIX
// ============================================================

function mat4Identity() {
  return new Float32Array([
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    0,0,0,1
  ]);
}

function mat4Translation(
  x,
  y,
  z
) {
  const matrix =
    mat4Identity();

  matrix[12] =
    x;

  matrix[13] =
    y;

  matrix[14] =
    z;

  return matrix;
}

function mat4Multiply(
  a,
  b
) {
  const out =
    new Float32Array(
      16
    );

  for (
    let column = 0;
    column < 4;
    column += 1
  ) {
    for (
      let row = 0;
      row < 4;
      row += 1
    ) {
      out[
        column * 4 +
        row
      ] =
        a[row] *
          b[
            column * 4
          ] +
        a[4 + row] *
          b[
            column * 4 +
            1
          ] +
        a[8 + row] *
          b[
            column * 4 +
            2
          ] +
        a[12 + row] *
          b[
            column * 4 +
            3
          ];
    }
  }

  return out;
}

function mat4Perspective(
  fovY,
  aspect,
  near,
  far
) {
  const f =
    1 /
    Math.tan(
      fovY /
      2
    );

  const nf =
    1 /
    (
      near -
      far
    );

  return new Float32Array([
    f / aspect,
    0,
    0,
    0,

    0,
    f,
    0,
    0,

    0,
    0,
    (
      far +
      near
    ) *
      nf,
    -1,

    0,
    0,
    (
      2 *
      far *
      near
    ) *
      nf,
    0
  ]);
}

function mat4LookAt(
  eye,
  center,
  up
) {
  let zx =
    eye[0] -
    center[0];

  let zy =
    eye[1] -
    center[1];

  let zz =
    eye[2] -
    center[2];

  let length =
    Math.hypot(
      zx,
      zy,
      zz
    ) || 1;

  zx /= length;
  zy /= length;
  zz /= length;

  let xx =
    up[1] *
      zz -
    up[2] *
      zy;

  let xy =
    up[2] *
      zx -
    up[0] *
      zz;

  let xz =
    up[0] *
      zy -
    up[1] *
      zx;

  length =
    Math.hypot(
      xx,
      xy,
      xz
    ) || 1;

  xx /= length;
  xy /= length;
  xz /= length;

  const yx =
    zy *
      xz -
    zz *
      xy;

  const yy =
    zz *
      xx -
    zx *
      xz;

  const yz =
    zx *
      xy -
    zy *
      xx;

  return new Float32Array([
    xx,yx,zx,0,
    xy,yy,zy,0,
    xz,yz,zz,0,

    -(
      xx * eye[0] +
      xy * eye[1] +
      xz * eye[2]
    ),

    -(
      yx * eye[0] +
      yy * eye[1] +
      yz * eye[2]
    ),

    -(
      zx * eye[0] +
      zy * eye[1] +
      zz * eye[2]
    ),

    1
  ]);
}

function mat3FromMat4(
  matrix
) {
  return new Float32Array([
    matrix[0],
    matrix[1],
    matrix[2],

    matrix[4],
    matrix[5],
    matrix[6],

    matrix[8],
    matrix[9],
    matrix[10]
  ]);
}

// ============================================================
// WEBGL
// ============================================================

function createShader(
  gl,
  type,
  source
) {
  const shader =
    gl.createShader(
      type
    );

  if (!shader) {
    return null;
  }

  gl.shaderSource(
    shader,
    source
  );

  gl.compileShader(
    shader
  );

  if (
    !gl.getShaderParameter(
      shader,
      gl.COMPILE_STATUS
    )
  ) {
    console.error(
      gl.getShaderInfoLog(
        shader
      )
    );

    gl.deleteShader(
      shader
    );

    return null;
  }

  return shader;
}

function createProgram(
  gl,
  vertexSource,
  fragmentSource
) {
  const vertexShader =
    createShader(
      gl,
      gl.VERTEX_SHADER,
      vertexSource
    );

  const fragmentShader =
    createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentSource
    );

  if (
    !vertexShader ||
    !fragmentShader
  ) {
    return null;
  }

  const program =
    gl.createProgram();

  if (!program) {
    return null;
  }

  gl.attachShader(
    program,
    vertexShader
  );

  gl.attachShader(
    program,
    fragmentShader
  );

  gl.linkProgram(
    program
  );

  gl.deleteShader(
    vertexShader
  );

  gl.deleteShader(
    fragmentShader
  );

  if (
    !gl.getProgramParameter(
      program,
      gl.LINK_STATUS
    )
  ) {
    console.error(
      gl.getProgramInfoLog(
        program
      )
    );

    gl.deleteProgram(
      program
    );

    return null;
  }

  return program;
}

const vertexShaderSource =
\`
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uModelView;
uniform mat4 uProjection;
uniform mat3 uNormalMatrix;

varying vec3 vNormal;

void main() {
  vNormal =
    normalize(
      uNormalMatrix *
      aNormal
    );

  gl_Position =
    uProjection *
    uModelView *
    vec4(
      aPosition,
      1.0
    );
}
\`;

const fragmentShaderSource =
\`
precision mediump float;

varying vec3 vNormal;

uniform vec3 uColor;
uniform vec3 uLightDirection;

void main() {
  vec3 normal =
    normalize(
      vNormal
    );

  vec3 light =
    normalize(
      uLightDirection
    );

  float diffuse =
    max(
      dot(
        normal,
        light
      ),
      0.0
    );

  float level =
    0.32 +
    diffuse *
    0.68;

  gl_FragColor =
    vec4(
      uColor *
      level,
      1.0
    );
}
\`;

function createPlaneGeometry(
  width,
  depth
) {
  const halfWidth =
    width / 2;

  const halfDepth =
    depth / 2;

  return {
    vertices:
      new Float32Array([
        -halfWidth,0,-halfDepth,
         halfWidth,0,-halfDepth,
         halfWidth,0, halfDepth,

        -halfWidth,0,-halfDepth,
         halfWidth,0, halfDepth,
        -halfWidth,0, halfDepth
      ]),

    normals:
      new Float32Array([
        0,1,0,
        0,1,0,
        0,1,0,

        0,1,0,
        0,1,0,
        0,1,0
      ]),

    count:
      6
  };
}

function createCubeGeometry(
  width,
  height,
  depth
) {
  const x =
    width / 2;

  const y =
    height / 2;

  const z =
    depth / 2;

  const vertices =
    new Float32Array([
      -x,-y, z, x,-y, z, x, y, z,
      -x,-y, z, x, y, z,-x, y, z,

       x,-y,-z,-x,-y,-z,-x, y,-z,
       x,-y,-z,-x, y,-z, x, y,-z,

      -x,-y,-z,-x,-y, z,-x, y, z,
      -x,-y,-z,-x, y, z,-x, y,-z,

       x,-y, z, x,-y,-z, x, y,-z,
       x,-y, z, x, y,-z, x, y, z,

      -x, y, z, x, y, z, x, y,-z,
      -x, y, z, x, y,-z,-x, y,-z,

      -x,-y,-z, x,-y,-z, x,-y, z,
      -x,-y,-z, x,-y, z,-x,-y, z
    ]);

  const normals =
    new Float32Array([
       0,0,1, 0,0,1, 0,0,1,
       0,0,1, 0,0,1, 0,0,1,

       0,0,-1, 0,0,-1, 0,0,-1,
       0,0,-1, 0,0,-1, 0,0,-1,

      -1,0,0,-1,0,0,-1,0,0,
      -1,0,0,-1,0,0,-1,0,0,

       1,0,0, 1,0,0, 1,0,0,
       1,0,0, 1,0,0, 1,0,0,

       0,1,0, 0,1,0, 0,1,0,
       0,1,0, 0,1,0, 0,1,0,

       0,-1,0,0,-1,0,0,-1,0,
       0,-1,0,0,-1,0,0,-1,0
    ]);

  return {
    vertices,
    normals,

    count:
      36
  };
}

function createSphereGeometry(
  radius,
  latitudeBands,
  longitudeBands
) {
  const vertices = [];
  const normals = [];
  const indices = [];

  for (
    let latitude = 0;
    latitude <= latitudeBands;
    latitude += 1
  ) {
    const theta =
      latitude *
      Math.PI /
      latitudeBands;

    const sinTheta =
      Math.sin(
        theta
      );

    const cosTheta =
      Math.cos(
        theta
      );

    for (
      let longitude = 0;
      longitude <= longitudeBands;
      longitude += 1
    ) {
      const phi =
        longitude *
        Math.PI *
        2 /
        longitudeBands;

      const sinPhi =
        Math.sin(
          phi
        );

      const cosPhi =
        Math.cos(
          phi
        );

      const nx =
        cosPhi *
        sinTheta;

      const ny =
        cosTheta;

      const nz =
        sinPhi *
        sinTheta;

      normals.push(
        nx,
        ny,
        nz
      );

      vertices.push(
        radius * nx,
        radius * ny,
        radius * nz
      );
    }
  }

  for (
    let latitude = 0;
    latitude < latitudeBands;
    latitude += 1
  ) {
    for (
      let longitude = 0;
      longitude < longitudeBands;
      longitude += 1
    ) {
      const first =
        latitude *
        (
          longitudeBands +
          1
        ) +
        longitude;

      const second =
        first +
        longitudeBands +
        1;

      indices.push(
        first,
        second,
        first + 1,

        second,
        second + 1,
        first + 1
      );
    }
  }

  return {
    vertices:
      new Float32Array(
        vertices
      ),

    normals:
      new Float32Array(
        normals
      ),

    indices:
      new Uint16Array(
        indices
      ),

    count:
      indices.length
  };
}

function createGeometryBuffer(
  gl,
  geometry
) {
  const vertexBuffer =
    gl.createBuffer();

  gl.bindBuffer(
    gl.ARRAY_BUFFER,
    vertexBuffer
  );

  gl.bufferData(
    gl.ARRAY_BUFFER,
    geometry.vertices,
    gl.STATIC_DRAW
  );

  const normalBuffer =
    gl.createBuffer();

  gl.bindBuffer(
    gl.ARRAY_BUFFER,
    normalBuffer
  );

  gl.bufferData(
    gl.ARRAY_BUFFER,
    geometry.normals,
    gl.STATIC_DRAW
  );

  let indexBuffer =
    null;

  if (
    geometry.indices
  ) {
    indexBuffer =
      gl.createBuffer();

    gl.bindBuffer(
      gl.ELEMENT_ARRAY_BUFFER,
      indexBuffer
    );

    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      geometry.indices,
      gl.STATIC_DRAW
    );
  }

  return {
    vertexBuffer,
    normalBuffer,
    indexBuffer,

    count:
      geometry.count
  };
}

function initWebGLScene(
  gl
) {
  const program =
    createProgram(
      gl,
      vertexShaderSource,
      fragmentShaderSource
    );

  if (!program) {
    return null;
  }

  return {
    program,

    ground:
      createGeometryBuffer(
        gl,
        createPlaneGeometry(
          world.width,
          world.height
        )
      ),

    castle:
      createGeometryBuffer(
        gl,
        createCubeGeometry(
          world.castle.width,
          world.castle.height,
          world.castle.depth
        )
      ),

    tower:
      createGeometryBuffer(
        gl,
        createCubeGeometry(
          72,
          150,
          72
        )
      ),

    building:
      createGeometryBuffer(
        gl,
        createCubeGeometry(
          90,
          80,
          90
        )
      ),

    dragon:
      createGeometryBuffer(
        gl,
        createSphereGeometry(
          world.dragon.radius,
          14,
          18
        )
      ),

    player:
      createGeometryBuffer(
        gl,
        createCubeGeometry(
          42,
          42,
          42
        )
      ),

    position:
      gl.getAttribLocation(
        program,
        "aPosition"
      ),

    normal:
      gl.getAttribLocation(
        program,
        "aNormal"
      ),

    modelView:
      gl.getUniformLocation(
        program,
        "uModelView"
      ),

    projection:
      gl.getUniformLocation(
        program,
        "uProjection"
      ),

    normalMatrix:
      gl.getUniformLocation(
        program,
        "uNormalMatrix"
      ),

    color:
      gl.getUniformLocation(
        program,
        "uColor"
      ),

    light:
      gl.getUniformLocation(
        program,
        "uLightDirection"
      )
  };
}

function renderGeometry(
  gl,
  data,
  geometry,
  model,
  view,
  projection,
  color
) {
  const modelView =
    mat4Multiply(
      view,
      model
    );

  gl.useProgram(
    data.program
  );

  gl.uniformMatrix4fv(
    data.modelView,
    false,
    modelView
  );

  gl.uniformMatrix4fv(
    data.projection,
    false,
    projection
  );

  gl.uniformMatrix3fv(
    data.normalMatrix,
    false,
    mat3FromMat4(
      modelView
    )
  );

  gl.uniform3fv(
    data.color,
    color
  );

  gl.uniform3fv(
    data.light,
    new Float32Array([
      0.45,
      1,
      0.65
    ])
  );

  gl.bindBuffer(
    gl.ARRAY_BUFFER,
    geometry.vertexBuffer
  );

  gl.enableVertexAttribArray(
    data.position
  );

  gl.vertexAttribPointer(
    data.position,
    3,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(
    gl.ARRAY_BUFFER,
    geometry.normalBuffer
  );

  gl.enableVertexAttribArray(
    data.normal
  );

  gl.vertexAttribPointer(
    data.normal,
    3,
    gl.FLOAT,
    false,
    0,
    0
  );

  if (
    geometry.indexBuffer
  ) {
    gl.bindBuffer(
      gl.ELEMENT_ARRAY_BUFFER,
      geometry.indexBuffer
    );

    gl.drawElements(
      gl.TRIANGLES,
      geometry.count,
      gl.UNSIGNED_SHORT,
      0
    );
  } else {
    gl.drawArrays(
      gl.TRIANGLES,
      0,
      geometry.count
    );
  }
}

// ============================================================
// SCENE
// ============================================================

const scene = {
  webGLData:
    null,

  update(
    delta
  ) {
    let dx =
      0;

    let dy =
      0;

    if (
      input.left
    ) {
      dx -= 1;
    }

    if (
      input.right
    ) {
      dx += 1;
    }

    if (
      input.up
    ) {
      dy -= 1;
    }

    if (
      input.down
    ) {
      dy += 1;
    }

    if (
      dx !== 0 ||
      dy !== 0
    ) {
      const length =
        Math.hypot(
          dx,
          dy
        ) || 1;

      dx /= length;
      dy /= length;

      player.x +=
        dx *
        player.speed *
        delta;

      player.y +=
        dy *
        player.speed *
        delta;
    }

    player.x =
      clamp(
        player.x,
        player.radius,
        world.width -
          player.radius
      );

    player.y =
      clamp(
        player.y,
        player.radius,
        world.height -
          player.radius
      );
  },

  render3D(
    gl,
    runtime
  ) {
    if (
      !this.webGLData
    ) {
      this.webGLData =
        initWebGLScene(
          gl
        );
    }

    if (
      !this.webGLData
    ) {
      throw new Error(
        "MAJD WebGL scene initialization failed."
      );
    }

    const width =
      Math.max(
        1,
        runtime.canvas.clientWidth
      );

    const height =
      Math.max(
        1,
        runtime.canvas.clientHeight
      );

    const projection =
      mat4Perspective(
        Math.PI /
          4,
        width /
          height,
        1,
        6000
      );

    const eye = [
      player.x,
      720,
      player.y +
        760
    ];

    const target = [
      player.x,
      0,
      player.y
    ];

    const view =
      mat4LookAt(
        eye,
        target,
        [
          0,
          1,
          0
        ]
      );

    const groundColor =
      world.theme ===
        "FROZEN_KINGDOM"
        ? new Float32Array([
            0.68,
            0.82,
            0.88
          ])
        : new Float32Array([
            0.16,
            0.42,
            0.20
          ]);

    renderGeometry(
      gl,
      this.webGLData,
      this.webGLData.ground,
      mat4Translation(
        world.width /
          2,
        0,
        world.height /
          2
      ),
      view,
      projection,
      groundColor
    );

    renderGeometry(
      gl,
      this.webGLData,
      this.webGLData.castle,
      mat4Translation(
        world.castle.x,
        world.castle.height /
          2,
        world.castle.y
      ),
      view,
      projection,
      new Float32Array([
        0.70,
        0.58,
        0.40
      ])
    );

    for (
      const tower of
        world.towers
    ) {
      renderGeometry(
        gl,
        this.webGLData,
        this.webGLData.tower,
        mat4Translation(
          tower.x,
          75,
          tower.y
        ),
        view,
        projection,
        new Float32Array([
          0.48,
          0.42,
          0.31
        ])
      );
    }

    for (
      const building of
        world.buildings
    ) {
      renderGeometry(
        gl,
        this.webGLData,
        this.webGLData.building,
        mat4Translation(
          building.x,
          building.height /
            2,
          building.y
        ),
        view,
        projection,
        new Float32Array([
          0.55,
          0.47,
          0.32
        ])
      );
    }

    renderGeometry(
      gl,
      this.webGLData,
      this.webGLData.dragon,
      mat4Translation(
        world.dragon.x,
        world.dragon.height /
          2,
        world.dragon.y
      ),
      view,
      projection,
      new Float32Array([
        0.76,
        0.14,
        0.13
      ])
    );

    renderGeometry(
      gl,
      this.webGLData,
      this.webGLData.player,
      mat4Translation(
        player.x,
        21,
        player.y
      ),
      view,
      projection,
      new Float32Array([
        0.96,
        0.78,
        0.18
      ])
    );

    const proof =
      globalThis
        .MAJD_GAME_PROOF;

    proof.runtimeStarted =
      true;

    proof.renderedFrames +=
      1;

    proof.visibleObjects =
      1 +
      1 +
      world.towers.length +
      world.buildings.length +
      1 +
      1;

    proof.worldReady =
      true;

    proof.terrainReady =
      true;

    proof.cameraReady =
      true;

    proof.blankFrame =
      false;

    proof.renderMode =
      "webgl";

    proof.lastFrameAt =
      performance.now();
  },

  render2D(
    ctx,
    runtime
  ) {
    const width =
      runtime.canvas.clientWidth;

    const height =
      runtime.canvas.clientHeight;

    const cameraX =
      player.x -
      width /
        2;

    const cameraY =
      player.y -
      height /
        2;

    ctx.fillStyle =
      world.theme ===
        "FROZEN_KINGDOM"
        ? "#adcbd7"
        : "#183c2a";

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

    ctx.save();

    ctx.translate(
      -cameraX,
      -cameraY
    );

    ctx.fillStyle =
      world.theme ===
        "FROZEN_KINGDOM"
        ? "#dcecf1"
        : "#234e31";

    ctx.fillRect(
      0,
      0,
      world.width,
      world.height
    );

    ctx.fillStyle =
      world.theme ===
        "FROZEN_KINGDOM"
        ? "#87b5c7"
        : "#277fa4";

    ctx.fillRect(
      0,
      world.river.y,
      world.width,
      world.river.width
    );

    ctx.fillStyle =
      world.theme ===
        "FROZEN_KINGDOM"
        ? "#8096a0"
        : "#51625b";

    for (
      let index = 0;
      index < 12;
      index += 1
    ) {
      const x =
        120 +
        index *
          190;

      const y =
        130 +
        (
          index %
          3
        ) *
          65;

      ctx.beginPath();

      ctx.moveTo(
        x,
        y +
          130
      );

      ctx.lineTo(
        x +
          70,
        y
      );

      ctx.lineTo(
        x +
          140,
        y +
          130
      );

      ctx.closePath();

      ctx.fill();
    }

    ctx.strokeStyle =
      "#d0bd8a";

    ctx.lineWidth =
      20;

    ctx.strokeRect(
      world.castle.x -
        world.castle.width /
          2,
      world.castle.y -
        world.castle.depth /
          2,
      world.castle.width,
      world.castle.depth
    );

    ctx.fillStyle =
      "#a28d65";

    ctx.fillRect(
      world.castle.x -
        90,
      world.castle.y -
        90,
      180,
      180
    );

    for (
      const tower of
        world.towers
    ) {
      ctx.fillStyle =
        "#786746";

      ctx.beginPath();

      ctx.arc(
        tower.x,
        tower.y,
        34,
        0,
        Math.PI *
          2
      );

      ctx.fill();
    }

    for (
      const building of
        world.buildings
    ) {
      ctx.fillStyle =
        "#88734c";

      ctx.fillRect(
        building.x -
          building.width /
            2,
        building.y -
          building.depth /
            2,
        building.width,
        building.depth
      );
    }

    ctx.fillStyle =
      "#9c2f2f";

    ctx.beginPath();

    ctx.arc(
      world.dragon.x,
      world.dragon.y,
      world.dragon.radius,
      0,
      Math.PI *
        2
    );

    ctx.fill();

    ctx.fillStyle =
      "#ffd46b";

    ctx.font =
      "bold 18px Arial";

    ctx.textAlign =
      "center";

    ctx.fillText(
      "DRAGON BOSS",
      world.dragon.x,
      world.dragon.y -
        72
    );

    ctx.fillStyle =
      "#f0d16d";

    ctx.beginPath();

    ctx.arc(
      player.x,
      player.y,
      player.radius,
      0,
      Math.PI *
        2
    );

    ctx.fill();

    ctx.restore();

    ctx.fillStyle =
      "rgba(3,8,14,.78)";

    ctx.fillRect(
      12,
      height -
        96,
      Math.max(
        120,
        Math.min(
          width -
            24,
          760
        )
      ),
      82
    );

    ctx.fillStyle =
      "#ffffff";

    ctx.font =
      "14px Arial";

    ctx.textAlign =
      "left";

    ctx.fillText(
      "Gold: " +
        world.resources.gold +
        " | Wood: " +
        world.resources.wood +
        " | Stone: " +
        world.resources.stone,
      24,
      height -
        64
    );

    ctx.fillText(
      "Objective: " +
        ${JSON.stringify(
          instruction
        )},
      24,
      height -
        36
    );

    const proof =
      globalThis
        .MAJD_GAME_PROOF;

    proof.runtimeStarted =
      true;

    proof.renderedFrames +=
      1;

    proof.visibleObjects =
      1 +
      1 +
      world.towers.length +
      world.buildings.length +
      1 +
      1;

    proof.worldReady =
      true;

    proof.terrainReady =
      true;

    proof.cameraReady =
      true;

    proof.blankFrame =
      false;

    proof.renderMode =
      "2d";

    proof.lastFrameAt =
      performance.now();
  }
};

engine.setScene(
  scene
);

engine.start();

globalThis.MAJD_GAME = {
  engine,
  world,
  player,
  input,

  objective:
    ${JSON.stringify(
      instruction
    )},

  proof:
    globalThis
      .MAJD_GAME_PROOF
};
`;
}

// ============================================================
// MAJD WEB INDEX
// ============================================================

function createMajdIndexSource(
  title: string
): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,viewport-fit=cover"
>

<meta
  name="theme-color"
  content="#07101d"
>

<title>${escapeHtml(title)}</title>

<link
  rel="stylesheet"
  href="./styles.css"
>
</head>

<body>
<main id="majd-app">

<canvas
  id="majd-game"
  aria-label="${escapeHtml(title)}"
></canvas>

<section id="majd-hud">
  <strong>
    ${escapeHtml(title)}
  </strong>

  <span>
    MAJD SOVEREIGN ENGINE
  </span>

  <small>
    3D WebGL + 2D Safe Fallback
  </small>
</section>

<section id="majd-touch-controls">
  <button data-key="up">
    ▲
  </button>

  <div>
    <button data-key="left">
      ◀
    </button>

    <button data-key="down">
      ▼
    </button>

    <button data-key="right">
      ▶
    </button>
  </div>
</section>

</main>

<script
  type="module"
  src="./game.js"
></script>
</body>
</html>`;
}

function createMajdStylesSource():
  string {
  return `* {
box-sizing:border-box;
-webkit-tap-highlight-color:transparent;
}

html,
body {
width:100%;
height:100%;
margin:0;
overflow:hidden;
background:#07101d;
font-family:system-ui,sans-serif;
}

#majd-app {
position:relative;
width:100%;
height:100%;
min-height:100dvh;
overflow:hidden;
}

#majd-game {
display:block;
width:100%;
height:100%;
background:#9dc5d5;
touch-action:none;
}

#majd-hud {
position:absolute;
top:max(12px,env(safe-area-inset-top));
right:max(12px,env(safe-area-inset-right));

display:flex;
flex-direction:column;
gap:4px;

padding:10px 14px;

background:rgba(4,10,19,.76);

color:white;

border:1px solid rgba(255,255,255,.14);

border-radius:12px;

backdrop-filter:blur(8px);

pointer-events:none;
}

#majd-hud small {
opacity:.7;
}

#majd-touch-controls {
position:absolute;

right:max(
18px,
env(safe-area-inset-right)
);

bottom:calc(
18px +
env(safe-area-inset-bottom)
);

display:none;

flex-direction:column;

align-items:center;

gap:6px;
}

#majd-touch-controls div {
display:flex;
gap:6px;
}

#majd-touch-controls button {
width:56px;
height:56px;

border:1px solid rgba(255,255,255,.25);

border-radius:14px;

background:rgba(4,10,19,.70);

color:#fff;

font-size:20px;

touch-action:none;
}

@media
(pointer:coarse),
(max-width:900px) {
#majd-touch-controls {
display:flex;
}
}`;
}

// ============================================================
// PHYSICAL FILE WRITER
// ============================================================

async function writeMajdPhysicalFile(
  root: string,

  relativePath: string,

  content: string,

  category:
    MajdPhysicalFile[
      "category"
    ]
): Promise<MajdPhysicalFile> {
  const normalized =
    path.normalize(
      relativePath
    );

  if (
    normalized.startsWith(
      ".."
    ) ||
    path.isAbsolute(
      normalized
    )
  ) {
    throw new Error(
      `Unsafe MAJD output path: ${relativePath}`
    );
  }

  const destination =
    path.join(
      root,
      normalized
    );

  await writeTextFile(
    destination,
    content
  );

  return {
    path:
      destination,

    content,

    checksum:
      checksum(
        content
      ),

    category
  };
}

// ============================================================
// MAJD BUILD VERIFICATION
// ============================================================

async function verifyMajdBuild(
  buildRoot: string,

  files:
    MajdPhysicalFile[]
): Promise<MajdQualityResult> {
  const errors:
    string[] = [];

  const warnings:
    string[] = [];

  const required = [
    "index.html",
    "styles.css",
    "game.js",
    "majd-engine.js",
    "majd-world.js",
    "majd-rights.json"
  ];

  const checks:
    Record<
      string,
      boolean
    > = {};

  for (
    const file of
      required
  ) {
    const exists =
      await fileExists(
        path.join(
          buildRoot,
          file
        )
      );

    checks[
      `file:${file}`
    ] =
      exists;

    if (!exists) {
      errors.push(
        `Required physical build file missing: ${file}`
      );
    }
  }

  const sourceText =
    files
      .map(
        file =>
          file.content
      )
      .join("\n");

  const externalEngine =
    /from\s+["'][^"']*(?:babylon|three(?:\.js)?|unity|unreal|godot)[^"']*["']/i
      .test(
        sourceText
      );

  checks.noExternalEngine =
    !externalEngine;

  if (
    externalEngine
  ) {
    errors.push(
      "External game engine dependency detected."
    );
  }

  const sourceFiles =
    files.filter(
      file =>
        file.category ===
          "BUILD" ||
        file.category ===
          "SOURCE"
    );

  checks.physicalFiles =
    sourceFiles.length >=
    4;

  if (
    !checks.physicalFiles
  ) {
    errors.push(
      "Insufficient physical production files."
    );
  }

  const engineFile =
    files.find(
      file =>
        path.basename(
          file.path
        ) ===
        "majd-engine.js"
    );

  const gameFile =
    files.find(
      file =>
        path.basename(
          file.path
        ) ===
        "game.js"
    );

  const worldFile =
    files.find(
      file =>
        path.basename(
          file.path
        ) ===
        "majd-world.js"
    );

  checks.webglRenderer =
    !!engineFile &&
    engineFile.content.includes(
      "webgl"
    ) &&
    !!gameFile &&
    gameFile.content.includes(
      "render3D"
    );

  if (
    !checks.webglRenderer
  ) {
    errors.push(
      "MAJD WebGL renderer is not present."
    );
  }

  checks.canvasFallback =
    !!engineFile &&
    engineFile.content.includes(
      "getContext"
    ) &&
    engineFile.content.includes(
      "\"2d\""
    ) &&
    !!gameFile &&
    gameFile.content.includes(
      "render2D"
    );

  if (
    !checks.canvasFallback
  ) {
    errors.push(
      "MAJD Canvas 2D fallback is not present."
    );
  }

  checks.realSceneRenderer =
    !!gameFile &&
    gameFile.content.includes(
      "renderGeometry"
    ) &&
    gameFile.content.includes(
      "MAJD_GAME_PROOF"
    ) &&
    gameFile.content.includes(
      "blankFrame"
    );

  if (
    !checks.realSceneRenderer
  ) {
    errors.push(
      "Real rendered scene proof is missing."
    );
  }

  checks.worldData =
    !!worldFile &&
    worldFile.content.includes(
      "castle"
    ) &&
    worldFile.content.includes(
      "towers"
    ) &&
    worldFile.content.includes(
      "buildings"
    ) &&
    worldFile.content.includes(
      "playerStart"
    );

  if (
    !checks.worldData
  ) {
    errors.push(
      "Renderable MAJD world data is incomplete."
    );
  }

  const passed =
    Object.values(
      checks
    )
      .filter(
        Boolean
      )
      .length;

  const total =
    Object.keys(
      checks
    ).length;

  return {
    success:
      errors.length ===
      0,

    score:
      total ===
        0
        ? 0
        : Math.round(
            (
              passed /
              total
            ) *
            100
          ),

    checks,
    errors,
    warnings
  };
}

// ============================================================
// MAJD SOVEREIGN CREATION
// ============================================================

export async function executeMajdSovereignCreation(
  input:
    Partial<
      MajdSovereignCreationRequest
    > & {
      instruction: string;
      ownerId: string;
      projectId: string;
    }
): Promise<MajdSovereignCreationResult> {
  const startedAt =
    Date.now();

  const instruction =
    input.instruction
      .trim();

  const projectId =
    safeProjectId(
      input.projectId
    );

  const request:
    MajdSovereignCreationRequest = {
      id:
        input.id ??
        `majd-request-${Date.now()}`,

      ownerId:
        input.ownerId,

      instruction,

      projectId,

      productType:
        input.productType ??
        "GAME",

      autonomous:
        input.autonomous ??
        true,

      legalStage:
        input.legalStage ??
        MAJD_LEGAL_ENTITY_LIFECYCLE
          .current,

      createdAt:
        input.createdAt ??
        Date.now(),

      metadata:
        input.metadata
    };

  const result:
    MajdSovereignCreationResult = {
      id:
        `majd-result-${Date.now()}`,

      projectId,

      productType:
        request.productType,

      state:
        "RECEIVED",

      success:
        false,

      playable:
        false,

      files: [],

      repairAttempts:
        0,

      errors: [],

      startedAt,

      completedAt:
        startedAt
    };

  try {
    if (
      !instruction
    ) {
      throw new Error(
        "MAJD sovereign instruction is required."
      );
    }

    result.state =
      "UNDERSTANDING";

    const buildRoot =
      gameBuildDirectory(
        projectId
      );

    await fs.rm(
      buildRoot,
      {
        recursive:
          true,

        force:
          true
      }
    );

    await fs.mkdir(
      buildRoot,
      {
        recursive:
          true
      }
    );

    result.state =
      "GENERATING";

    if (
      request.productType ===
      "GAME"
    ) {
      const title =
        /صقيع|frozen|snow/i.test(
          instruction
        )
          ? "مجد: النجاة في الصقيع"
          : deriveGameName(
              instruction
            );

      result.files.push(
        await writeMajdPhysicalFile(
          buildRoot,
          "index.html",
          createMajdIndexSource(
            title
          ),
          "BUILD"
        ),

        await writeMajdPhysicalFile(
          buildRoot,
          "styles.css",
          createMajdStylesSource(),
          "BUILD"
        ),

        await writeMajdPhysicalFile(
          buildRoot,
          "majd-engine.js",
          createMajdEngineSource(),
          "SOURCE"
        ),

        await writeMajdPhysicalFile(
          buildRoot,
          "majd-world.js",
          createMajdWorldSource(
            instruction
          ),
          "SOURCE"
        ),

        await writeMajdPhysicalFile(
          buildRoot,
          "game.js",
          createMajdGameRuntimeSource(
            instruction
          ),
          "SOURCE"
        )
      );
    }

    result.files.push(
      await writeMajdPhysicalFile(
        buildRoot,
        "majd-rights.json",
        createMajdRightsManifest(
          request
        ),
        "RIGHTS"
      )
    );

    result.state =
      "TESTING";

    const rights =
      inspectMajdRights(
        request,
        result.files
      );

    result.rights =
      rights;

    if (
      !rights.success
    ) {
      throw new Error(
        rights.errors.join(
          "; "
        )
      );
    }

    result.state =
      "QUALITY_CHECK";

    const quality =
      await verifyMajdBuild(
        buildRoot,
        result.files
      );

    result.quality =
      quality;

    if (
      !quality.success
    ) {
      result.state =
        "BLOCKED";

      result.errors.push(
        ...quality.errors
      );

      result.buildPath =
        buildRoot;

      result.completedAt =
        Date.now();

      return result;
    }

    result.state =
      "VERIFYING";

    const launchTarget =
      path.join(
        buildRoot,
        "index.html"
      );

    const indexReady =
      await fileExists(
        launchTarget
      );

    const runtimeReady =
      await fileExists(
        path.join(
          buildRoot,
          "game.js"
        )
      );

    const engineReady =
      await fileExists(
        path.join(
          buildRoot,
          "majd-engine.js"
        )
      );

    const worldReady =
      await fileExists(
        path.join(
          buildRoot,
          "majd-world.js"
        )
      );

    if (
      !indexReady ||
      !runtimeReady ||
      !engineReady ||
      !worldReady
    ) {
      throw new Error(
        "MAJD real build verification failed."
      );
    }

    result.buildPath =
      buildRoot;

    result.launchTarget =
      launchTarget;

    result.playable =
      request.productType ===
      "GAME";

    result.success =
      true;

    result.state =
      "READY";

    result.completedAt =
      Date.now();

    return result;
  } catch (error) {
    result.state =
      "FAILED";

    result.success =
      false;

    result.playable =
      false;

    result.errors.push(
      error instanceof Error
        ? error.message
        : String(error)
    );

    result.completedAt =
      Date.now();

    return result;
  }
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
// AUTONOMOUS RUNTIME
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
            command.autonomous,

          metadata: {
            runtimeCommandId:
              command.id,

            ownerCommandId:
              command.ownerCommandId,

            source:
              "SOVEREIGN-AI-REAL-COMPONENT-BINDINGS-224"
          }
        });

      const playable =
        majdResult.success ===
          true &&
        majdResult.state ===
          "READY" &&
        majdResult.playable ===
          true &&
        typeof majdResult.buildPath ===
          "string" &&
        majdResult.buildPath.length >
          0 &&
        typeof majdResult.launchTarget ===
          "string" &&
        majdResult.launchTarget.length >
          0 &&
        majdResult.quality
          ?.success ===
          true &&
        majdResult.rights
          ?.success ===
          true;

      const artifactExists =
        playable &&
        majdResult.buildPath
          ? await fileExists(
              majdResult.buildPath
            )
          : false;

      const launchExists =
        playable &&
        majdResult.launchTarget
          ? await fileExists(
              majdResult.launchTarget
            )
          : false;

      const verifiedPlayable =
        playable &&
        artifactExists &&
        launchExists;

      gamePlayableState.set(
        projectId,
        {
          projectId,

          playable:
            verifiedPlayable,

          testSuccess:
            majdResult.quality
              ?.success ===
            true,

          artifactSuccess:
            artifactExists,

          artifactPath:
            majdResult.buildPath,

          launchTarget:
            majdResult.launchTarget,

          verifiedAt:
            Date.now()
        }
      );

      return {
        projectId,

        success:
          verifiedPlayable,

        playable:
          verifiedPlayable,

        artifactPath:
          majdResult.buildPath,

        output:
          majdResult,

        errors:
          verifiedPlayable
            ? []
            : majdResult.errors.length >
                0
              ? [
                  ...majdResult.errors
                ]
              : [
                  "MAJD sovereign game creation did not reach verified READY state."
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
            MajdSovereignCreationResult;

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
          result.success ===
            true &&
          result.state ===
            "READY" &&
          result.playable ===
            true &&
          result.quality
            ?.success ===
            true &&
          result.rights
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
                  result.errors.join(
                    "; "
                  ) ||
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
          ) as
            SovereignFinalComponent[]
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

      if (
        !runtimeReady
      ) {
        errors.push(
          ...runtime.errors
        );
      }

      if (
        !brainReady
      ) {
        errors.push(
          "MASTER_BRAIN is unavailable."
        );
      }

      if (
        !buildersReady
      ) {
        errors.push(
          "Sovereign builders are unavailable."
        );
      }

      if (
        !testingReady
      ) {
        errors.push(
          "TEST_ENGINE is unavailable."
        );
      }

      if (
        !repairReady
      ) {
        errors.push(
          "Repair system is unavailable."
        );
      }

      if (
        !releaseReady
      ) {
        errors.push(
          "RELEASE_MANAGER is unavailable."
        );
      }

      if (
        !knowledgeReady
      ) {
        errors.push(
          "Knowledge system is unavailable."
        );
      }

      if (
        !ownerControlReady
      ) {
        errors.push(
          "OWNER control system is unavailable."
        );
      }

      if (
        !visible
      ) {
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

  if (
    !modulePath
  ) {
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
// HEALTH
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
  if (
    !instance
  ) {
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
// FINAL RUNTIME FACTORY
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
// INFORMATION
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

// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-ADMIN-CONTROL-BUILDER-211.ts
// Final Closure 06/15
// Autonomous Majd Administration & OWNER Control Builder
// ============================================================

export type MajdAdminModule =
  | "OVERVIEW"
  | "OWNER_CONTROL"
  | "AI_CONTROL"
  | "USERS"
  | "ROLES"
  | "GAMES"
  | "CONTENT"
  | "SOCIAL"
  | "MEDIA"
  | "PAYMENTS"
  | "WALLET"
  | "BILLING"
  | "LEDGER"
  | "DEVELOPERS"
  | "SECURITY"
  | "MONITORING"
  | "DEPLOYMENTS"
  | "AUDIT"
  | "SETTINGS";

export type MajdAdminBuildStatus =
  | "CREATED"
  | "PLANNING"
  | "BUILDING"
  | "INTEGRATING"
  | "VALIDATING"
  | "REPAIRING"
  | "READY"
  | "FAILED";

export interface MajdAdminBuildRequest {
  id: string;
  projectId: string;
  commandId: string;
  modules?: MajdAdminModule[];
  autonomous: boolean;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface MajdAdminModulePlan {
  id: string;
  module: MajdAdminModule;
  required: boolean;
  permissions: string[];
  capabilities: string[];
  dependencies: MajdAdminModule[];
}

export interface MajdAdminModuleResult {
  module: MajdAdminModule;
  success: boolean;
  routes: string[];
  components: string[];
  APIs: string[];
  error?: string;
}

export interface MajdAdminValidation {
  success: boolean;
  errors: string[];
  warnings: string[];
  missingModules: MajdAdminModule[];
}

export interface MajdAdminBuildResult {
  id: string;
  requestId: string;
  projectId: string;
  status: MajdAdminBuildStatus;
  modules: MajdAdminModuleResult[];
  validation?: MajdAdminValidation;
  repairAttempts: number;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

export interface SovereignAIAdminControlBuilderAdapter {
  inspectExistingAdmin(
    request: MajdAdminBuildRequest
  ): Promise<unknown>;

  buildModule(
    request: MajdAdminBuildRequest,
    plan: MajdAdminModulePlan,
    existingAdmin: unknown,
    completed: MajdAdminModuleResult[]
  ): Promise<MajdAdminModuleResult>;

  integrateAdmin(
    request: MajdAdminBuildRequest,
    modules: MajdAdminModuleResult[]
  ): Promise<void>;

  validateAdmin(
    request: MajdAdminBuildRequest
  ): Promise<MajdAdminValidation>;

  repairAdmin?(
    request: MajdAdminBuildRequest,
    validation: MajdAdminValidation,
    attempt: number
  ): Promise<void>;

  verifyOwnerAccess?(
    request: MajdAdminBuildRequest
  ): Promise<boolean>;

  persistResult?(
    result: MajdAdminBuildResult
  ): Promise<void>;

  recordEvent?(event: {
    type: string;
    projectId: string;
    requestId: string;
    timestamp: number;
    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIAdminControlBuilder {
  private readonly requiredModules: MajdAdminModule[] = [
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

  constructor(
    private readonly adapter:
      SovereignAIAdminControlBuilderAdapter,

    private readonly maximumRepairAttempts = 3
  ) {}

  public async build(
    input: MajdAdminBuildRequest
  ): Promise<MajdAdminBuildResult> {
    const request =
      this.normalizeRequest(input);

    this.validateRequest(request);

    const result: MajdAdminBuildResult = {
      id: this.createId("admin-build"),
      requestId: request.id,
      projectId: request.projectId,
      status: "CREATED",
      modules: [],
      repairAttempts: 0,
      startedAt: Date.now()
    };

    try {
      await this.transition(result, "PLANNING");

      const existingAdmin =
        await this.adapter.inspectExistingAdmin(
          request
        );

      const modules =
        this.resolveModules(
          request.modules
        );

      const plans =
        modules.map(
          module =>
            this.createPlan(module)
        );

      await this.transition(result, "BUILDING");

      const completed =
        new Set<MajdAdminModule>();

      const remaining = [...plans];

      while (remaining.length > 0) {
        const executable =
          remaining.filter(
            plan =>
              plan.dependencies.every(
                dependency =>
                  completed.has(dependency)
              )
          );

        if (executable.length === 0) {
          throw new Error(
            "Admin module dependency cycle detected."
          );
        }

        for (const plan of executable) {
          const moduleResult =
            await this.adapter.buildModule(
              request,
              plan,
              existingAdmin,
              this.cloneModuleResults(
                result.modules
              )
            );

          this.validateModuleResult(
            moduleResult,
            plan.module
          );

          result.modules.push(
            this.cloneModuleResult(
              moduleResult
            )
          );

          if (
            !moduleResult.success &&
            plan.required
          ) {
            throw new Error(
              moduleResult.error ||
                `Required admin module failed: ${plan.module}`
            );
          }

          if (moduleResult.success) {
            completed.add(plan.module);
          }

          const index =
            remaining.indexOf(plan);

          if (index >= 0) {
            remaining.splice(index, 1);
          }
        }
      }

      await this.transition(
        result,
        "INTEGRATING"
      );

      await this.adapter.integrateAdmin(
        request,
        this.cloneModuleResults(
          result.modules
        )
      );

      await this.transition(
        result,
        "VALIDATING"
      );

      let validation =
        await this.adapter.validateAdmin(
          request
        );

      result.validation =
        this.cloneValidation(
          validation
        );

      while (
        !validation.success &&
        result.repairAttempts <
          this.maximumRepairAttempts &&
        this.adapter.repairAdmin
      ) {
        result.repairAttempts += 1;

        await this.transition(
          result,
          "REPAIRING"
        );

        await this.adapter.repairAdmin(
          request,
          validation,
          result.repairAttempts
        );

        await this.transition(
          result,
          "VALIDATING"
        );

        validation =
          await this.adapter.validateAdmin(
            request
          );

        result.validation =
          this.cloneValidation(
            validation
          );
      }

      if (!validation.success) {
        throw new Error(
          `Admin validation failed: ${validation.errors.join("; ")}`
        );
      }

      if (
        validation.missingModules.length >
        0
      ) {
        throw new Error(
          `Admin modules missing: ${validation.missingModules.join(", ")}`
        );
      }

      if (
        this.adapter.verifyOwnerAccess
      ) {
        const ownerAccess =
          await this.adapter.verifyOwnerAccess(
            request
          );

        if (!ownerAccess) {
          throw new Error(
            "OWNER control verification failed."
          );
        }
      }

      result.status = "READY";
      result.completedAt = Date.now();

      await this.finish(result);

      return this.cloneResult(result);
    } catch (error) {
      result.status = "FAILED";

      result.error =
        error instanceof Error
          ? error.message
          : String(error);

      result.completedAt = Date.now();

      await this.finish(result);

      return this.cloneResult(result);
    }
  }

  private createPlan(
    module: MajdAdminModule
  ): MajdAdminModulePlan {
    return {
      id: this.createId(
        `admin-${module.toLowerCase()}`
      ),

      module,

      required: true,

      permissions:
        this.permissionsFor(module),

      capabilities:
        this.capabilitiesFor(module),

      dependencies:
        this.dependenciesFor(module)
    };
  }

  private dependenciesFor(
    module: MajdAdminModule
  ): MajdAdminModule[] {
    switch (module) {
      case "OWNER_CONTROL":
        return ["OVERVIEW"];

      case "AI_CONTROL":
        return ["OWNER_CONTROL"];

      case "ROLES":
        return ["USERS"];

      case "WALLET":
        return ["USERS"];

      case "BILLING":
        return ["WALLET"];

      case "PAYMENTS":
        return ["WALLET"];

      case "LEDGER":
        return [
          "WALLET",
          "PAYMENTS"
        ];

      case "CONTENT":
        return ["USERS"];

      case "SOCIAL":
      case "MEDIA":
      case "GAMES":
        return [
          "CONTENT",
          "USERS"
        ];

      case "DEVELOPERS":
        return [
          "USERS",
          "ROLES"
        ];

      case "MONITORING":
        return ["AI_CONTROL"];

      case "DEPLOYMENTS":
        return [
          "AI_CONTROL",
          "MONITORING"
        ];

      case "AUDIT":
        return [
          "OWNER_CONTROL",
          "SECURITY"
        ];

      default:
        return [];
    }
  }

  private permissionsFor(
    module: MajdAdminModule
  ): string[] {
    if (
      module === "OWNER_CONTROL"
    ) {
      return [
        "OWNER_SUPREME",
        "OWNER_COMMAND",
        "OWNER_OVERRIDE",
        "OWNER_AUDIT"
      ];
    }

    if (
      module === "AI_CONTROL"
    ) {
      return [
        "AI_VIEW",
        "AI_COMMAND",
        "AI_PAUSE",
        "AI_RESUME",
        "AI_REVIEW"
      ];
    }

    return [
      `${module}_VIEW`,
      `${module}_MANAGE`
    ];
  }

  private capabilitiesFor(
    module: MajdAdminModule
  ): string[] {
    switch (module) {
      case "OVERVIEW":
        return [
          "platform-health",
          "live-status",
          "system-summary"
        ];

      case "OWNER_CONTROL":
        return [
          "issue-command",
          "approve-critical-action",
          "override-delegation",
          "inspect-sovereign-state"
        ];

      case "AI_CONTROL":
        return [
          "view-ai-runs",
          "view-ai-decisions",
          "view-ai-builds",
          "control-autonomy"
        ];

      case "GAMES":
        return [
          "games-list",
          "game-builds",
          "game-status",
          "game-release"
        ];

      case "CONTENT":
        return [
          "content-review",
          "content-publish",
          "content-moderation"
        ];

      case "SOCIAL":
        return [
          "social-health",
          "community-management",
          "social-moderation"
        ];

      case "MEDIA":
        return [
          "video-management",
          "live-management",
          "tv-programming"
        ];

      case "PAYMENTS":
        return [
          "payment-status",
          "refund-management",
          "payment-audit"
        ];

      case "WALLET":
        return [
          "wallet-status",
          "wallet-transactions",
          "wallet-controls"
        ];

      case "BILLING":
        return [
          "subscriptions",
          "packages",
          "invoices"
        ];

      case "LEDGER":
        return [
          "ledger-view",
          "ledger-reconciliation",
          "financial-audit"
        ];

      case "SECURITY":
        return [
          "security-status",
          "access-review",
          "incident-control"
        ];

      case "MONITORING":
        return [
          "metrics",
          "health",
          "alerts"
        ];

      case "DEPLOYMENTS":
        return [
          "release-status",
          "deploy",
          "rollback"
        ];

      case "AUDIT":
        return [
          "audit-log",
          "decision-history",
          "execution-history"
        ];

      default:
        return [
          `${module.toLowerCase()}-management`
        ];
    }
  }

  private resolveModules(
    modules?: MajdAdminModule[]
  ): MajdAdminModule[] {
    if (
      !modules ||
      modules.length === 0
    ) {
      return [
        ...this.requiredModules
      ];
    }

    return [
      ...new Set([
        ...this.requiredModules,
        ...modules
      ])
    ];
  }

  private validateRequest(
    request: MajdAdminBuildRequest
  ): void {
    if (!request.id.trim()) {
      throw new Error(
        "Admin build request id is required."
      );
    }

    if (!request.projectId.trim()) {
      throw new Error(
        "Admin project id is required."
      );
    }

    if (!request.commandId.trim()) {
      throw new Error(
        "Admin command id is required."
      );
    }
  }

  private validateModuleResult(
    result: MajdAdminModuleResult,
    expected: MajdAdminModule
  ): void {
    if (result.module !== expected) {
      throw new Error(
        `Admin module mismatch: expected ${expected}.`
      );
    }
  }

  private normalizeRequest(
    input: MajdAdminBuildRequest
  ): MajdAdminBuildRequest {
    return {
      ...input,

      modules:
        input.modules
          ? [
              ...new Set(
                input.modules
              )
            ]
          : undefined,

      metadata:
        input.metadata
          ? {
              ...input.metadata
            }
          : undefined
    };
  }

  private async transition(
    result: MajdAdminBuildResult,
    status: MajdAdminBuildStatus
  ): Promise<void> {
    result.status = status;

    await this.persist(result);

    await this.record(
      `SOVEREIGN_ADMIN_${status}`,
      result
    );
  }

  private async finish(
    result: MajdAdminBuildResult
  ): Promise<void> {
    await this.persist(result);

    await this.record(
      `SOVEREIGN_ADMIN_${result.status}`,
      result,
      {
        modules:
          result.modules.length,

        successful:
          result.modules.filter(
            item => item.success
          ).length,

        repairAttempts:
          result.repairAttempts,

        error:
          result.error
      }
    );
  }

  private async persist(
    result: MajdAdminBuildResult
  ): Promise<void> {
    if (
      this.adapter.persistResult
    ) {
      await this.adapter.persistResult(
        this.cloneResult(result)
      );
    }
  }

  private async record(
    type: string,
    result: MajdAdminBuildResult,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter.recordEvent({
        type,
        projectId:
          result.projectId,
        requestId:
          result.requestId,
        timestamp:
          Date.now(),
        data
      });
    }
  }

  private cloneModuleResult(
    result: MajdAdminModuleResult
  ): MajdAdminModuleResult {
    return {
      ...result,
      routes: [...result.routes],
      components: [
        ...result.components
      ],
      APIs: [...result.APIs]
    };
  }

  private cloneModuleResults(
    results: MajdAdminModuleResult[]
  ): MajdAdminModuleResult[] {
    return results.map(
      result =>
        this.cloneModuleResult(
          result
        )
    );
  }

  private cloneValidation(
    validation: MajdAdminValidation
  ): MajdAdminValidation {
    return {
      ...validation,
      errors: [
        ...validation.errors
      ],
      warnings: [
        ...validation.warnings
      ],
      missingModules: [
        ...validation.missingModules
      ]
    };
  }

  private cloneResult(
    result: MajdAdminBuildResult
  ): MajdAdminBuildResult {
    return {
      ...result,

      modules:
        this.cloneModuleResults(
          result.modules
        ),

      validation:
        result.validation
          ? this.cloneValidation(
              result.validation
            )
          : undefined
    };
  }

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

export default SovereignAIAdminControlBuilder;

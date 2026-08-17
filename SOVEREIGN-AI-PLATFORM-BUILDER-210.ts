// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-PLATFORM-BUILDER-210.ts
// Final Closure 05/15
// Autonomous Majd Platform Builder
// ============================================================

export type SovereignPlatformComponent =
  | "FRONTEND"
  | "BACKEND"
  | "API"
  | "DATABASE"
  | "IDENTITY"
  | "ADMIN"
  | "GAMES"
  | "SOCIAL"
  | "MEDIA"
  | "PAYMENTS"
  | "AI_OPERATIONS"
  | "INFRASTRUCTURE";

export type SovereignPlatformBuildStatus =
  | "CREATED"
  | "INSPECTING"
  | "PLANNING"
  | "BUILDING"
  | "INTEGRATING"
  | "VALIDATING"
  | "REPAIRING"
  | "VERIFYING"
  | "READY"
  | "FAILED";

export interface SovereignPlatformBuildRequest {
  id: string;
  projectId: string;
  commandId: string;
  objective: string;
  requestedComponents?: SovereignPlatformComponent[];
  constraints: string[];
  autonomous: boolean;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface SovereignPlatformComponentPlan {
  id: string;
  component: SovereignPlatformComponent;
  required: boolean;
  objective: string;
  dependencies: SovereignPlatformComponent[];
  acceptanceCriteria: string[];
}

export interface SovereignPlatformPlan {
  id: string;
  projectId: string;
  objective: string;
  components: SovereignPlatformComponentPlan[];
  createdAt: number;
}

export interface SovereignPlatformComponentResult {
  component: SovereignPlatformComponent;
  success: boolean;
  artifacts: string[];
  output?: unknown;
  error?: string;
  startedAt: number;
  completedAt: number;
}

export interface SovereignPlatformValidation {
  success: boolean;
  errors: string[];
  warnings: string[];
  missingComponents: SovereignPlatformComponent[];
}

export interface SovereignPlatformBuildResult {
  id: string;
  requestId: string;
  projectId: string;
  status: SovereignPlatformBuildStatus;
  plan?: SovereignPlatformPlan;
  components: SovereignPlatformComponentResult[];
  validation?: SovereignPlatformValidation;
  repairAttempts: number;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

export interface SovereignAIPlatformBuilderAdapter {
  inspectPlatform(
    request: SovereignPlatformBuildRequest
  ): Promise<unknown>;

  planComponent?(
    request: SovereignPlatformBuildRequest,
    component: SovereignPlatformComponent,
    existingPlatform: unknown
  ): Promise<SovereignPlatformComponentPlan>;

  buildComponent(
    request: SovereignPlatformBuildRequest,
    plan: SovereignPlatformComponentPlan,
    completed: SovereignPlatformComponentResult[]
  ): Promise<SovereignPlatformComponentResult>;

  integratePlatform(
    request: SovereignPlatformBuildRequest,
    plan: SovereignPlatformPlan,
    components: SovereignPlatformComponentResult[]
  ): Promise<void>;

  validatePlatform(
    request: SovereignPlatformBuildRequest,
    plan: SovereignPlatformPlan
  ): Promise<SovereignPlatformValidation>;

  repairPlatform?(
    request: SovereignPlatformBuildRequest,
    plan: SovereignPlatformPlan,
    validation: SovereignPlatformValidation,
    attempt: number
  ): Promise<void>;

  verifyPlatform?(
    request: SovereignPlatformBuildRequest,
    result: SovereignPlatformBuildResult
  ): Promise<boolean>;

  persistResult?(
    result: SovereignPlatformBuildResult
  ): Promise<void>;

  recordEvent?(event: {
    type: string;
    projectId: string;
    requestId: string;
    timestamp: number;
    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIPlatformBuilder {
  private readonly defaultComponents:
    SovereignPlatformComponent[] = [
      "FRONTEND",
      "BACKEND",
      "API",
      "DATABASE",
      "IDENTITY",
      "ADMIN",
      "GAMES",
      "SOCIAL",
      "MEDIA",
      "PAYMENTS",
      "AI_OPERATIONS",
      "INFRASTRUCTURE"
    ];

  constructor(
    private readonly adapter:
      SovereignAIPlatformBuilderAdapter,
    private readonly maximumRepairAttempts = 3
  ) {}

  public async build(
    input: SovereignPlatformBuildRequest
  ): Promise<SovereignPlatformBuildResult> {
    const request =
      this.normalizeRequest(input);

    this.validateRequest(request);

    const result:
      SovereignPlatformBuildResult = {
        id: this.createId(
          "platform-build"
        ),
        requestId: request.id,
        projectId:
          request.projectId,
        status: "CREATED",
        components: [],
        repairAttempts: 0,
        startedAt: Date.now()
      };

    try {
      await this.transition(
        result,
        "INSPECTING"
      );

      const existingPlatform =
        await this.adapter.inspectPlatform(
          request
        );

      await this.transition(
        result,
        "PLANNING"
      );

      const requested =
        this.resolveComponents(
          request.requestedComponents
        );

      const componentPlans:
        SovereignPlatformComponentPlan[] =
          [];

      for (const component of requested) {
        const plan =
          this.adapter.planComponent
            ? await this.adapter.planComponent(
                request,
                component,
                existingPlatform
              )
            : this.defaultPlan(
                component
              );

        this.validateComponentPlan(
          plan
        );

        componentPlans.push(
          this.cloneComponentPlan(
            plan
          )
        );
      }

      const plan:
        SovereignPlatformPlan = {
          id: this.createId(
            "platform-plan"
          ),
          projectId:
            request.projectId,
          objective:
            request.objective,
          components:
            componentPlans,
          createdAt:
            Date.now()
        };

      this.validatePlan(plan);

      result.plan =
        this.clonePlan(plan);

      await this.transition(
        result,
        "BUILDING"
      );

      const completed =
        new Set<
          SovereignPlatformComponent
        >();

      const remaining =
        [...plan.components];

      while (remaining.length > 0) {
        const executable =
          remaining.filter(
            item =>
              item.dependencies.every(
                dependency =>
                  completed.has(
                    dependency
                  )
              )
          );

        if (executable.length === 0) {
          throw new Error(
            "Platform component dependency cycle or unresolved dependency detected."
          );
        }

        for (
          const componentPlan of executable
        ) {
          const startedAt =
            Date.now();

          try {
            const componentResult =
              await this.adapter
                .buildComponent(
                  request,
                  componentPlan,
                  result.components.map(
                    item => ({
                      ...item,
                      artifacts: [
                        ...item.artifacts
                      ]
                    })
                  )
                );

            const normalized =
              this.normalizeComponentResult(
                componentResult,
                componentPlan.component,
                startedAt
              );

            result.components.push(
              normalized
            );

            if (
              !normalized.success &&
              componentPlan.required
            ) {
              throw new Error(
                normalized.error ||
                  `Required platform component failed: ${componentPlan.component}`
              );
            }

            if (normalized.success) {
              completed.add(
                componentPlan.component
              );
            }
          } catch (error) {
            if (componentPlan.required) {
              throw error;
            }

            result.components.push({
              component:
                componentPlan.component,
              success: false,
              artifacts: [],
              error:
                error instanceof Error
                  ? error.message
                  : String(error),
              startedAt,
              completedAt:
                Date.now()
            });
          }

          const index =
            remaining.indexOf(
              componentPlan
            );

          if (index >= 0) {
            remaining.splice(
              index,
              1
            );
          }
        }
      }

      await this.transition(
        result,
        "INTEGRATING"
      );

      await this.adapter
        .integratePlatform(
          request,
          plan,
          result.components
        );

      await this.transition(
        result,
        "VALIDATING"
      );

      let validation =
        await this.adapter
          .validatePlatform(
            request,
            plan
          );

      result.validation =
        this.cloneValidation(
          validation
        );

      while (
        !validation.success &&
        result.repairAttempts <
          this.maximumRepairAttempts &&
        this.adapter.repairPlatform
      ) {
        result.repairAttempts += 1;

        await this.transition(
          result,
          "REPAIRING"
        );

        await this.adapter
          .repairPlatform(
            request,
            plan,
            validation,
            result.repairAttempts
          );

        await this.transition(
          result,
          "VALIDATING"
        );

        validation =
          await this.adapter
            .validatePlatform(
              request,
              plan
            );

        result.validation =
          this.cloneValidation(
            validation
          );
      }

      if (!validation.success) {
        throw new Error(
          `Platform validation failed: ${validation.errors.join(
            "; "
          )}`
        );
      }

      if (
        validation.missingComponents
          .length > 0
      ) {
        throw new Error(
          `Platform is missing required components: ${validation.missingComponents.join(
            ", "
          )}`
        );
      }

      await this.transition(
        result,
        "VERIFYING"
      );

      if (this.adapter.verifyPlatform) {
        const verified =
          await this.adapter
            .verifyPlatform(
              request,
              this.cloneResult(
                result
              )
            );

        if (!verified) {
          throw new Error(
            "Platform verification failed."
          );
        }
      }

      result.status = "READY";
      result.completedAt =
        Date.now();

      await this.finish(result);

      return this.cloneResult(
        result
      );
    } catch (error) {
      result.status = "FAILED";

      result.error =
        error instanceof Error
          ? error.message
          : String(error);

      result.completedAt =
        Date.now();

      await this.finish(result);

      return this.cloneResult(
        result
      );
    }
  }

  private resolveComponents(
    requested?:
      SovereignPlatformComponent[]
  ): SovereignPlatformComponent[] {
    const components =
      requested &&
      requested.length > 0
        ? requested
        : this.defaultComponents;

    return [
      ...new Set(components)
    ];
  }

  private defaultPlan(
    component:
      SovereignPlatformComponent
  ): SovereignPlatformComponentPlan {
    return {
      id: this.createId(
        `component-${component.toLowerCase()}`
      ),
      component,
      required: true,
      objective:
        this.componentObjective(
          component
        ),
      dependencies:
        this.dependenciesFor(
          component
        ),
      acceptanceCriteria: [
        `${component} implementation exists.`,
        `${component} is integrated with required dependencies.`,
        `${component} passes generated validation.`,
        `${component} has no blocking errors.`
      ]
    };
  }

  private dependenciesFor(
    component:
      SovereignPlatformComponent
  ): SovereignPlatformComponent[] {
    switch (component) {
      case "BACKEND":
        return [];

      case "DATABASE":
        return ["BACKEND"];

      case "API":
        return [
          "BACKEND",
          "DATABASE"
        ];

      case "IDENTITY":
        return [
          "BACKEND",
          "DATABASE",
          "API"
        ];

      case "FRONTEND":
        return [
          "API",
          "IDENTITY"
        ];

      case "ADMIN":
        return [
          "FRONTEND",
          "BACKEND",
          "IDENTITY"
        ];

      case "GAMES":
      case "SOCIAL":
      case "MEDIA":
      case "PAYMENTS":
        return [
          "FRONTEND",
          "BACKEND",
          "API",
          "IDENTITY"
        ];

      case "AI_OPERATIONS":
        return [
          "BACKEND",
          "API"
        ];

      case "INFRASTRUCTURE":
        return [
          "BACKEND",
          "AI_OPERATIONS"
        ];

      default:
        return [];
    }
  }

  private componentObjective(
    component:
      SovereignPlatformComponent
  ): string {
    switch (component) {
      case "FRONTEND":
        return "Build the complete responsive Majd user interface.";

      case "BACKEND":
        return "Build Majd server-side services and business logic.";

      case "API":
        return "Build and integrate Majd application APIs.";

      case "DATABASE":
        return "Build Majd persistent data models, schemas and migrations.";

      case "IDENTITY":
        return "Build Majd authentication, accounts, roles and permissions.";

      case "ADMIN":
        return "Build the complete Majd administration and management system.";

      case "GAMES":
        return "Build and integrate the Majd games platform.";

      case "SOCIAL":
        return "Build Majd social and community capabilities.";

      case "MEDIA":
        return "Build Majd media and content capabilities.";

      case "PAYMENTS":
        return "Build Majd payments, wallet and transaction capabilities.";

      case "AI_OPERATIONS":
        return "Build sovereign AI operations and autonomous platform management.";

      case "INFRASTRUCTURE":
        return "Build and integrate sovereign platform infrastructure.";

      default:
        return `Build and integrate the ${component} platform component.`;
    }
  }

  private validateComponentPlan(
    plan:
      SovereignPlatformComponentPlan
  ): void {
    if (!plan.id.trim()) {
      throw new Error(
        "Platform component plan id is required."
      );
    }

    if (!plan.objective.trim()) {
      throw new Error(
        `Platform component objective is required: ${plan.component}`
      );
    }

    if (
      plan.acceptanceCriteria.length ===
      0
    ) {
      throw new Error(
        `Platform component acceptance criteria are required: ${plan.component}`
      );
    }
  }

  private validatePlan(
    plan: SovereignPlatformPlan
  ): void {
    if (!plan.id.trim()) {
      throw new Error(
        "Platform plan id is required."
      );
    }

    if (plan.components.length === 0) {
      throw new Error(
        "Platform plan requires at least one component."
      );
    }

    const components =
      new Set(
        plan.components.map(
          item => item.component
        )
      );

    for (const item of plan.components) {
      for (
        const dependency of
          item.dependencies
      ) {
        if (
          !components.has(
            dependency
          )
        ) {
          throw new Error(
            `Platform component ${item.component} requires missing dependency ${dependency}.`
          );
        }
      }
    }
  }

  private normalizeComponentResult(
    result:
      SovereignPlatformComponentResult,
    component:
      SovereignPlatformComponent,
    startedAt: number
  ): SovereignPlatformComponentResult {
    return {
      ...result,
      component,
      artifacts: [
        ...new Set(
          result.artifacts || []
        )
      ],
      startedAt:
        result.startedAt ||
        startedAt,
      completedAt:
        result.completedAt ||
        Date.now()
    };
  }

  private normalizeRequest(
    input:
      SovereignPlatformBuildRequest
  ): SovereignPlatformBuildRequest {
    return {
      ...input,

      id: input.id.trim(),

      projectId:
        input.projectId.trim(),

      commandId:
        input.commandId.trim(),

      objective:
        input.objective
          .trim()
          .replace(/\s+/g, " "),

      requestedComponents:
        input.requestedComponents
          ? [
              ...new Set(
                input.requestedComponents
              )
            ]
          : undefined,

      constraints: [
        ...new Set(
          (input.constraints || [])
            .map(
              value => value.trim()
            )
            .filter(Boolean)
        )
      ],

      autonomous:
        input.autonomous !== false,

      metadata:
        input.metadata
          ? {
              ...input.metadata
            }
          : undefined
    };
  }

  private validateRequest(
    request:
      SovereignPlatformBuildRequest
  ): void {
    if (!request.id) {
      throw new Error(
        "Platform build request id is required."
      );
    }

    if (!request.projectId) {
      throw new Error(
        "Platform project id is required."
      );
    }

    if (!request.commandId) {
      throw new Error(
        "Platform command id is required."
      );
    }

    if (!request.objective) {
      throw new Error(
        "Platform build objective is required."
      );
    }
  }

  private async transition(
    result:
      SovereignPlatformBuildResult,
    status:
      SovereignPlatformBuildStatus
  ): Promise<void> {
    result.status = status;

    await this.persist(result);

    await this.record(
      `SOVEREIGN_PLATFORM_BUILDER_${status}`,
      result
    );
  }

  private async finish(
    result:
      SovereignPlatformBuildResult
  ): Promise<void> {
    await this.persist(result);

    await this.record(
      `SOVEREIGN_PLATFORM_BUILDER_${result.status}`,
      result,
      {
        repairAttempts:
          result.repairAttempts,
        error:
          result.error,
        completedAt:
          result.completedAt
      }
    );
  }

  private async persist(
    result:
      SovereignPlatformBuildResult
  ): Promise<void> {
    if (
      this.adapter.persistResult
    ) {
      await this.adapter
        .persistResult(
          this.cloneResult(
            result
          )
        );
    }
  }

  private async record(
    type: string,
    result:
      SovereignPlatformBuildResult,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
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

  private cloneComponentPlan(
    plan:
      SovereignPlatformComponentPlan
  ): SovereignPlatformComponentPlan {
    return {
      ...plan,

      dependencies: [
        ...plan.dependencies
      ],

      acceptanceCriteria: [
        ...plan.acceptanceCriteria
      ]
    };
  }

  private clonePlan(
    plan:
      SovereignPlatformPlan
  ): SovereignPlatformPlan {
    return {
      ...plan,

      components:
        plan.components.map(
          item =>
            this.cloneComponentPlan(
              item
            )
        )
    };
  }

  private cloneValidation(
    validation:
      SovereignPlatformValidation
  ): SovereignPlatformValidation {
    return {
      ...validation,

      errors: [
        ...validation.errors
      ],

      warnings: [
        ...validation.warnings
      ],

      missingComponents: [
        ...validation.missingComponents
      ]
    };
  }

  private cloneComponentResult(
    result:
      SovereignPlatformComponentResult
  ): SovereignPlatformComponentResult {
    return {
      ...result,

      artifacts: [
        ...result.artifacts
      ]
    };
  }

  private cloneResult(
    result:
      SovereignPlatformBuildResult
  ): SovereignPlatformBuildResult {
    return {
      ...result,

      plan:
        result.plan
          ? this.clonePlan(
              result.plan
            )
          : undefined,

      components:
        result.components.map(
          item =>
            this.cloneComponentResult(
              item
            )
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

export default SovereignAIPlatformBuilder;

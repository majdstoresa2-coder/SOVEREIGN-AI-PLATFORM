// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-SYSTEM-INTEGRATION-219.ts
// Final Closure 14/15
// Sovereign AI System Integration & Readiness Layer
// ============================================================

export type SovereignIntegratedComponent =
  | "MASTER_BRAIN"
  | "PLANNER"
  | "EXECUTOR"
  | "VERIFIER"
  | "REPAIR"
  | "CODE_ENGINE"
  | "CODE_WORKSPACE"
  | "TEST_ENGINE"
  | "BUILD_ENGINE"
  | "DEPLOYMENT_ENGINE"
  | "AUTOMATION_ENGINE"
  | "WORKER_ENGINE"
  | "COORDINATOR"
  | "CAPABILITY_REGISTRY"
  | "PLATFORM_BUILDER"
  | "ADMIN_BUILDER"
  | "GAME_BUILDER"
  | "SELF_TEST_REPAIR"
  | "RELEASE_MANAGER"
  | "AUTONOMOUS_RUNTIME"
  | "KNOWLEDGE_INGESTION"
  | "KNOWLEDGE_REASONING"
  | "EXTERNAL_PLATFORM_INTELLIGENCE";

export type SovereignIntegrationState =
  | "CREATED"
  | "DISCOVERING"
  | "CONNECTING"
  | "CHECKING"
  | "READY"
  | "BLOCKED"
  | "FAILED";

export interface SovereignComponentRegistration {
  component: SovereignIntegratedComponent;

  version?: string;

  required: boolean;

  enabled: boolean;

  dependencies: SovereignIntegratedComponent[];

  metadata?: Record<string, unknown>;
}

export interface SovereignComponentHealth {
  component: SovereignIntegratedComponent;

  registered: boolean;

  connected: boolean;

  healthy: boolean;

  dependenciesReady: boolean;

  errors: string[];
}

export interface SovereignIntegrationRequest {
  id: string;

  commandId: string;

  projectId: string;

  autonomous: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignIntegrationResult {
  id: string;

  requestId: string;

  projectId: string;

  state: SovereignIntegrationState;

  components: SovereignComponentHealth[];

  missing: SovereignIntegratedComponent[];

  unhealthy: SovereignIntegratedComponent[];

  ready: boolean;

  error?: string;

  startedAt: number;

  completedAt?: number;
}

export interface SovereignAISystemIntegrationAdapter {
  discover(
    component: SovereignIntegratedComponent
  ): Promise<boolean>;

  connect(
    component: SovereignIntegratedComponent
  ): Promise<boolean>;

  healthCheck(
    component: SovereignIntegratedComponent
  ): Promise<{
    healthy: boolean;
    errors: string[];
  }>;

  persistResult?(
    result: SovereignIntegrationResult
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    requestId: string;

    projectId: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAISystemIntegration {
  private readonly registrations =
    new Map<
      SovereignIntegratedComponent,
      SovereignComponentRegistration
    >();

  constructor(
    private readonly adapter:
      SovereignAISystemIntegrationAdapter
  ) {
    this.registerDefaults();
  }

  public register(
    registration:
      SovereignComponentRegistration
  ): void {
    this.registrations.set(
      registration.component,
      {
        ...registration,

        dependencies: [
          ...new Set(
            registration.dependencies
          )
        ],

        metadata:
          registration.metadata
            ? {
                ...registration.metadata
              }
            : undefined
      }
    );
  }

  public async integrate(
    request: SovereignIntegrationRequest
  ): Promise<SovereignIntegrationResult> {
    this.validateRequest(request);

    const result:
      SovereignIntegrationResult = {
        id: this.createId(
          "system-integration"
        ),

        requestId:
          request.id,

        projectId:
          request.projectId,

        state:
          "CREATED",

        components: [],

        missing: [],

        unhealthy: [],

        ready: false,

        startedAt:
          Date.now()
      };

    try {
      await this.transition(
        result,
        "DISCOVERING"
      );

      const ordered =
        this.resolveOrder();

      const connected =
        new Set<
          SovereignIntegratedComponent
        >();

      for (
        const registration of ordered
      ) {
        if (!registration.enabled) {
          if (registration.required) {
            result.missing.push(
              registration.component
            );
          }

          continue;
        }

        const discovered =
          await this.adapter.discover(
            registration.component
          );

        if (!discovered) {
          result.components.push({
            component:
              registration.component,

            registered: false,

            connected: false,

            healthy: false,

            dependenciesReady: false,

            errors: [
              "Component was not discovered."
            ]
          });

          if (registration.required) {
            result.missing.push(
              registration.component
            );
          }

          continue;
        }

        const dependenciesReady =
          registration.dependencies.every(
            dependency =>
              connected.has(
                dependency
              )
          );

        if (!dependenciesReady) {
          result.components.push({
            component:
              registration.component,

            registered: true,

            connected: false,

            healthy: false,

            dependenciesReady: false,

            errors: [
              "Required component dependency is not ready."
            ]
          });

          if (registration.required) {
            result.unhealthy.push(
              registration.component
            );
          }

          continue;
        }

        await this.transition(
          result,
          "CONNECTING"
        );

        const connection =
          await this.adapter.connect(
            registration.component
          );

        if (!connection) {
          result.components.push({
            component:
              registration.component,

            registered: true,

            connected: false,

            healthy: false,

            dependenciesReady: true,

            errors: [
              "Component connection failed."
            ]
          });

          if (registration.required) {
            result.unhealthy.push(
              registration.component
            );
          }

          continue;
        }

        await this.transition(
          result,
          "CHECKING"
        );

        const health =
          await this.adapter.healthCheck(
            registration.component
          );

        result.components.push({
          component:
            registration.component,

          registered: true,

          connected: true,

          healthy:
            health.healthy,

          dependenciesReady: true,

          errors: [
            ...health.errors
          ]
        });

        if (health.healthy) {
          connected.add(
            registration.component
          );
        } else if (
          registration.required
        ) {
          result.unhealthy.push(
            registration.component
          );
        }
      }

      result.missing = [
        ...new Set(
          result.missing
        )
      ];

      result.unhealthy = [
        ...new Set(
          result.unhealthy
        )
      ];

      result.ready =
        result.missing.length === 0 &&
        result.unhealthy.length === 0 &&
        this.allRequiredReady(
          result.components
        );

      result.state =
        result.ready
          ? "READY"
          : "BLOCKED";

      if (!result.ready) {
        result.error =
          this.createBlockingMessage(
            result
          );
      }

      result.completedAt =
        Date.now();

      await this.finish(result);

      return this.cloneResult(
        result
      );
    } catch (error) {
      result.state =
        "FAILED";

      result.ready =
        false;

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

  private registerDefaults(): void {
    const definitions:
      Array<[
        SovereignIntegratedComponent,
        SovereignIntegratedComponent[]
      ]> = [
      [
        "MASTER_BRAIN",
        []
      ],

      [
        "PLANNER",
        ["MASTER_BRAIN"]
      ],

      [
        "EXECUTOR",
        ["PLANNER"]
      ],

      [
        "VERIFIER",
        ["EXECUTOR"]
      ],

      [
        "REPAIR",
        ["VERIFIER"]
      ],

      [
        "CODE_ENGINE",
        ["PLANNER"]
      ],

      [
        "CODE_WORKSPACE",
        ["CODE_ENGINE"]
      ],

      [
        "TEST_ENGINE",
        ["CODE_WORKSPACE"]
      ],

      [
        "BUILD_ENGINE",
        ["TEST_ENGINE"]
      ],

      [
        "DEPLOYMENT_ENGINE",
        ["BUILD_ENGINE"]
      ],

      [
        "AUTOMATION_ENGINE",
        ["MASTER_BRAIN"]
      ],

      [
        "WORKER_ENGINE",
        ["AUTOMATION_ENGINE"]
      ],

      [
        "COORDINATOR",
        [
          "WORKER_ENGINE",
          "EXECUTOR"
        ]
      ],

      [
        "CAPABILITY_REGISTRY",
        ["MASTER_BRAIN"]
      ],

      [
        "KNOWLEDGE_INGESTION",
        ["MASTER_BRAIN"]
      ],

      [
        "KNOWLEDGE_REASONING",
        [
          "KNOWLEDGE_INGESTION",
          "MASTER_BRAIN"
        ]
      ],

      [
        "EXTERNAL_PLATFORM_INTELLIGENCE",
        ["KNOWLEDGE_REASONING"]
      ],

      [
        "PLATFORM_BUILDER",
        [
          "CODE_ENGINE",
          "BUILD_ENGINE"
        ]
      ],

      [
        "ADMIN_BUILDER",
        [
          "PLATFORM_BUILDER",
          "CODE_ENGINE"
        ]
      ],

      [
        "GAME_BUILDER",
        [
          "CODE_ENGINE",
          "TEST_ENGINE",
          "BUILD_ENGINE"
        ]
      ],

      [
        "SELF_TEST_REPAIR",
        [
          "TEST_ENGINE",
          "REPAIR"
        ]
      ],

      [
        "RELEASE_MANAGER",
        [
          "DEPLOYMENT_ENGINE",
          "SELF_TEST_REPAIR"
        ]
      ],

      [
        "AUTONOMOUS_RUNTIME",
        [
          "COORDINATOR",
          "CAPABILITY_REGISTRY",
          "PLATFORM_BUILDER",
          "ADMIN_BUILDER",
          "GAME_BUILDER",
          "SELF_TEST_REPAIR",
          "RELEASE_MANAGER",
          "KNOWLEDGE_REASONING"
        ]
      ]
    ];

    for (
      const [
        component,
        dependencies
      ] of definitions
    ) {
      this.register({
        component,

        required: true,

        enabled: true,

        dependencies
      });
    }
  }

  private resolveOrder():
    SovereignComponentRegistration[] {
    const remaining =
      new Map(
        this.registrations
      );

    const ordered:
      SovereignComponentRegistration[] =
      [];

    const resolved =
      new Set<
        SovereignIntegratedComponent
      >();

    while (
      remaining.size > 0
    ) {
      let progress = false;

      for (
        const [
          component,
          registration
        ] of remaining
      ) {
        const dependenciesResolved =
          registration.dependencies.every(
            dependency =>
              resolved.has(
                dependency
              )
          );

        if (!dependenciesResolved) {
          continue;
        }

        ordered.push({
          ...registration,

          dependencies: [
            ...registration.dependencies
          ]
        });

        resolved.add(
          component
        );

        remaining.delete(
          component
        );

        progress = true;
      }

      if (!progress) {
        throw new Error(
          "System integration dependency cycle detected."
        );
      }
    }

    return ordered;
  }

  private allRequiredReady(
    health:
      SovereignComponentHealth[]
  ): boolean {
    for (
      const registration of
        this.registrations.values()
    ) {
      if (
        !registration.required ||
        !registration.enabled
      ) {
        continue;
      }

      const status =
        health.find(
          item =>
            item.component ===
            registration.component
        );

      if (
        !status ||
        !status.registered ||
        !status.connected ||
        !status.healthy ||
        !status.dependenciesReady
      ) {
        return false;
      }
    }

    return true;
  }

  private createBlockingMessage(
    result:
      SovereignIntegrationResult
  ): string {
    const reasons:
      string[] = [];

    if (
      result.missing.length > 0
    ) {
      reasons.push(
        `Missing components: ${result.missing.join(", ")}`
      );
    }

    if (
      result.unhealthy.length > 0
    ) {
      reasons.push(
        `Unhealthy components: ${result.unhealthy.join(", ")}`
      );
    }

    return (
      reasons.join("; ") ||
      "Sovereign system integration is not ready."
    );
  }

  private validateRequest(
    request:
      SovereignIntegrationRequest
  ): void {
    if (!request.id.trim()) {
      throw new Error(
        "Integration request id is required."
      );
    }

    if (
      !request.commandId.trim()
    ) {
      throw new Error(
        "Integration command id is required."
      );
    }

    if (
      !request.projectId.trim()
    ) {
      throw new Error(
        "Integration project id is required."
      );
    }
  }

  private async transition(
    result:
      SovereignIntegrationResult,
    state:
      SovereignIntegrationState
  ): Promise<void> {
    result.state = state;

    await this.persist(
      result
    );

    await this.record(
      `SOVEREIGN

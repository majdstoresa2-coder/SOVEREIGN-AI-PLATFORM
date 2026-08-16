// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-FINAL-RUNTIME-222.ts
// FINAL EXECUTION RUNTIME
// Runtime Adapter for SOVEREIGN-AI-FINAL-LAUNCHER-221.ts
// ============================================================

import {
  SovereignAIFinalLauncher,
  SovereignAIFinalLauncherAdapter,
  SovereignFinalComponent,
  SovereignFinalComponentStatus,
  SovereignFinalLaunchRequest,
  SovereignFinalLaunchResult,
  SovereignFinalBootstrapResult,
  SovereignFinalRuntimeResult
} from "./SOVEREIGN-AI-FINAL-LAUNCHER-221.ts";

export interface SovereignRuntimeComponentBinding {
  component: SovereignFinalComponent;
  available: boolean;
  connected: boolean;
  healthy: boolean;
  errors: string[];
  instance?: unknown;
}

export interface SovereignFinalRuntimeOptions {
  ownerId: string;
  projectId: string;
  autonomous?: boolean;
  instruction?: string;
  liveTarget?: string;

  componentResolver?: (
    component: SovereignFinalComponent
  ) => Promise<unknown | undefined>;

  componentHealthCheck?: (
    component: SovereignFinalComponent,
    instance: unknown
  ) => Promise<{
    healthy: boolean;
    errors?: string[];
  }>;

  bootstrapHandler?: (
    request: SovereignFinalLaunchRequest
  ) => Promise<SovereignFinalBootstrapResult>;

  runtimeHandler?: (
    request: SovereignFinalLaunchRequest,
    bootstrap: SovereignFinalBootstrapResult
  ) => Promise<SovereignFinalRuntimeResult>;

  runtimeVerifier?: (
    request: SovereignFinalLaunchRequest,
    runtime: SovereignFinalRuntimeResult
  ) => Promise<boolean>;

  runtimeStopper?: (
    runtime: SovereignFinalRuntimeResult
  ) => Promise<void>;

  onEvent?: (
    event: Record<string, unknown>
  ) => Promise<void> | void;
}

export class SovereignAIFinalRuntime
  implements SovereignAIFinalLauncherAdapter
{
  private readonly bindings =
    new Map<
      SovereignFinalComponent,
      SovereignRuntimeComponentBinding
    >();

  private readonly launcher:
    SovereignAIFinalLauncher;

  private lastResult?:
    SovereignFinalLaunchResult;

  private activeRuntime?:
    SovereignFinalRuntimeResult;

  constructor(
    private readonly options:
      SovereignFinalRuntimeOptions
  ) {
    this.validateOptions(options);

    this.launcher =
      new SovereignAIFinalLauncher(this);
  }

  public async launch(
    instruction?: string
  ): Promise<SovereignFinalLaunchResult> {
    const request:
      SovereignFinalLaunchRequest = {
        id: this.createId(
          "final-runtime-request"
        ),

        ownerId:
          this.options.ownerId,

        commandId:
          this.createId(
            "owner-command"
          ),

        projectId:
          this.options.projectId,

        instruction:
          instruction ??
          this.options.instruction,

        autonomous:
          this.options.autonomous !== false,

        createdAt:
          Date.now(),

        metadata: {
          runtime:
            "SOVEREIGN-AI-FINAL-RUNTIME-222",

          launcher:
            "SOVEREIGN-AI-FINAL-LAUNCHER-221"
        }
      };

    this.lastResult =
      await this.launcher.launch(request);

    return this.cloneLaunchResult(
      this.lastResult
    );
  }

  public getLastResult():
    SovereignFinalLaunchResult | undefined {
    return this.lastResult
      ? this.cloneLaunchResult(
          this.lastResult
        )
      : undefined;
  }

  public isRunning(): boolean {
    return (
      this.launcher.isRunning() &&
      this.activeRuntime?.running === true
    );
  }

  public async discoverComponent(
    component: SovereignFinalComponent
  ): Promise<boolean> {
    const existing =
      this.bindings.get(component);

    if (
      existing?.available &&
      existing.instance !== undefined
    ) {
      return true;
    }

    if (
      !this.options.componentResolver
    ) {
      this.bindings.set(
        component,
        {
          component,
          available: false,
          connected: false,
          healthy: false,
          errors: [
            `${component} has no runtime resolver.`
          ]
        }
      );

      return false;
    }

    try {
      const instance =
        await this.options
          .componentResolver(component);

      const available =
        instance !== undefined &&
        instance !== null;

      this.bindings.set(
        component,
        {
          component,
          available,
          connected: false,
          healthy: false,
          errors:
            available
              ? []
              : [
                  `${component} was not resolved by the runtime.`
                ],
          instance
        }
      );

      return available;
    } catch (error) {
      this.bindings.set(
        component,
        {
          component,
          available: false,
          connected: false,
          healthy: false,
          errors: [
            this.errorMessage(error)
          ]
        }
      );

      return false;
    }
  }

  public async connectComponent(
    component: SovereignFinalComponent
  ): Promise<boolean> {
    const binding =
      this.bindings.get(component);

    if (
      !binding ||
      !binding.available ||
      binding.instance === undefined ||
      binding.instance === null
    ) {
      return false;
    }

    try {
      const instance =
        binding.instance as Record<
          string,
          unknown
        >;

      const connect =
        instance["connect"];

      if (
        typeof connect === "function"
      ) {
        await (
          connect as (
            ...args: unknown[]
          ) => unknown
        ).call(binding.instance);
      }

      binding.connected = true;
      binding.errors = [];

      return true;
    } catch (error) {
      binding.connected = false;
      binding.healthy = false;
      binding.errors = [
        this.errorMessage(error)
      ];

      return false;
    }
  }

  public async healthCheckComponent(
    component: SovereignFinalComponent
  ): Promise<{
    healthy: boolean;
    errors: string[];
  }> {
    const binding =
      this.bindings.get(component);

    if (
      !binding ||
      !binding.available ||
      !binding.connected ||
      binding.instance === undefined ||
      binding.instance === null
    ) {
      return {
        healthy: false,
        errors: [
          `${component} is not connected.`
        ]
      };
    }

    try {
      if (
        this.options
          .componentHealthCheck
      ) {
        const result =
          await this.options
            .componentHealthCheck(
              component,
              binding.instance
            );

        binding.healthy =
          result.healthy;

        binding.errors = [
          ...(result.errors ?? [])
        ];

        return {
          healthy:
            binding.healthy,

          errors: [
            ...binding.errors
          ]
        };
      }

      const instance =
        binding.instance as Record<
          string,
          unknown
        >;

      const healthCheck =
        instance["healthCheck"];

      if (
        typeof healthCheck ===
        "function"
      ) {
        const response =
          await (
            healthCheck as (
              ...args: unknown[]
            ) => unknown
          ).call(binding.instance);

        if (
          typeof response ===
          "boolean"
        ) {
          binding.healthy =
            response;

          binding.errors =
            response
              ? []
              : [
                  `${component} health check returned false.`
                ];

          return {
            healthy:
              binding.healthy,
            errors: [
              ...binding.errors
            ]
          };
        }

        if (
          typeof response ===
            "object" &&
          response !== null
        ) {
          const data =
            response as Record<
              string,
              unknown
            >;

          const healthy =
            data["healthy"] === true ||
            data["ready"] === true ||
            data["success"] === true;

          const errors =
            Array.isArray(
              data["errors"]
            )
              ? (
                  data[
                    "errors"
                  ] as unknown[]
                ).map(String)
              : [];

          binding.healthy =
            healthy;

          binding.errors =
            errors;

          return {
            healthy,
            errors: [
              ...errors
            ]
          };
        }
      }

      // If the component exists, connected successfully,
      // and exposes no explicit health API, treat the
      // connection itself as the baseline health signal.
      binding.healthy = true;
      binding.errors = [];

      return {
        healthy: true,
        errors: []
      };
    } catch (error) {
      binding.healthy = false;
      binding.errors = [
        this.errorMessage(error)
      ];

      return {
        healthy: false,
        errors: [
          ...binding.errors
        ]
      };
    }
  }

  public async integrateSystem(
    request:
      SovereignFinalLaunchRequest,
    components:
      SovereignFinalComponentStatus[]
  ): Promise<{
    success: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    for (
      const component of components
    ) {
      if (
        !component.discovered
      ) {
        errors.push(
          `${component.component} is missing.`
        );

        continue;
      }

      if (
        !component.connected
      ) {
        errors.push(
          `${component.component} is not connected.`
        );

        continue;
      }

      if (
        !component.healthy
      ) {
        errors.push(
          `${component.component} is unhealthy.`
        );
      }
    }

    if (
      errors.length > 0
    ) {
      return {
        success: false,
        errors
      };
    }

    await this.emit({
      type:
        "SOVEREIGN_FINAL_RUNTIME_INTEGRATED",

      requestId:
        request.id,

      projectId:
        request.projectId,

      componentCount:
        components.length,

      timestamp:
        Date.now()
    });

    return {
      success: true,
      errors: []
    };
  }

  public async bootstrap(
    request:
      SovereignFinalLaunchRequest
  ): Promise<SovereignFinalBootstrapResult> {
    if (
      this.options.bootstrapHandler
    ) {
      return await this.options
        .bootstrapHandler(request);
    }

    const binding =
      this.bindings.get(
        "BOOTSTRAP"
      );

    if (
      !binding ||
      !binding.instance
    ) {
      return {
        success: false,
        errors: [
          "BOOTSTRAP component is unavailable."
        ]
      };
    }

    try {
      const instance =
        binding.instance as Record<
          string,
          unknown
        >;

      const boot =
        instance["boot"];

      if (
        typeof boot !== "function"
      ) {
        return {
          success: false,
          errors: [
            "BOOTSTRAP component does not expose boot()."
          ]
        };
      }

      const response =
        await (
          boot as (
            payload: Record<
              string,
              unknown
            >
          ) => Promise<
            Record<
              string,
              unknown
            >
          >
        ).call(
          binding.instance,
          {
            id: this.createId(
              "bootstrap"
            ),

            commandId:
              request.commandId,

            projectId:
              request.projectId,

            ownerId:
              request.ownerId,

            autonomous:
              request.autonomous,

            instruction:
              request.instruction,

            createdAt:
              Date.now()
          }
        );

      const success =
        response["ready"] === true ||
        response["state"] ===
          "RUNNING";

      return {
        success,

        bootstrapId:
          typeof response["id"] ===
            "string"
            ? response["id"]
            : undefined,

        runtimeId:
          typeof response[
            "runtimeId"
          ] === "string"
            ? response[
                "runtimeId"
              ]
            : undefined,

        liveTarget:
          typeof response[
            "liveTarget"
          ] === "string"
            ? response[
                "liveTarget"
              ]
            : undefined,

        errors:
          success
            ? []
            : [
                typeof response[
                  "error"
                ] === "string"
                  ? response[
                      "error"
                    ]
                  : "Bootstrap did not reach RUNNING state."
              ]
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          this.errorMessage(error)
        ]
      };
    }
  }

  public async startRuntime(
    request:
      SovereignFinalLaunchRequest,
    bootstrap:
      SovereignFinalBootstrapResult
  ): Promise<SovereignFinalRuntimeResult> {
    if (
      this.options.runtimeHandler
    ) {
      const result =
        await this.options
          .runtimeHandler(
            request,
            bootstrap
          );

      this.activeRuntime =
        this.cloneRuntimeResult(
          result
        );

      return this.cloneRuntimeResult(
        result
      );
    }

    const binding =
      this.bindings.get(
        "AUTONOMOUS_RUNTIME"
      );

    if (
      !binding ||
      !binding.instance
    ) {
      return {
        success: false,
        running: false,
        healthy: false,
        visible: false,
        errors: [
          "AUTONOMOUS_RUNTIME component is unavailable."
        ]
      };
    }

    try {
      const instance =
        binding.instance as Record<
          string,
          unknown
        >;

      const execute =
        instance["execute"];

      if (
        typeof execute !==
        "function"
      ) {
        return {
          success: false,
          running: false,
          healthy: false,
          visible: false,
          errors: [
            "AUTONOMOUS_RUNTIME does not expose execute()."
          ]
        };
      }

      const commandType =
        this.detectCommandType(
          request.instruction
        );

      const execution =
        await (
          execute as (
            payload: Record<
              string,
              unknown
            >
          ) => Promise<
            Record<
              string,
              unknown
            >
          >
        ).call(
          binding.instance,
          {
            id: this.createId(
              "runtime-command"
            ),

            ownerCommandId:
              request.commandId,

            projectId:
              request.projectId,

            type:
              commandType,

            instruction:
              request.instruction ||
              "Start Majd sovereign platform.",

            autonomous:
              request.autonomous,

            priority: 100,

            createdAt:
              Date.now()
          }
        );

      const state =
        typeof execution[
          "state"
        ] === "string"
          ? execution["state"]
          : undefined;

      const success =
        state === "COMPLETED" ||
        state === "RUNNING";

      const liveTarget =
        typeof execution[
          "liveTarget"
        ] === "string"
          ? execution[
              "liveTarget"
            ]
          : bootstrap.liveTarget ??
            this.options.liveTarget;

      const verification =
        execution[
          "verification"
        ];

      let playable:
        boolean | undefined;

      if (
        commandType === "GAME"
      ) {
        if (
          typeof verification ===
            "object" &&
          verification !== null
        ) {
          const verificationData =
            verification as Record<
              string,
              unknown
            >;

          playable =
            verificationData[
              "playable"
            ] === true;
        } else {
          playable = false;
        }
      }

      const result:
        SovereignFinalRuntimeResult = {
          success,

          running: success,

          healthy: success,

          visible:
            typeof liveTarget ===
              "string" &&
            liveTarget.length > 0,

          playable,

          liveTarget,

          errors:
            success
              ? []
              : [
                  typeof execution[
                    "error"
                  ] === "string"
                    ? execution[
                        "error"
                      ]
                    : "Autonomous runtime did not complete successfully."
                ]
        };

      this.activeRuntime =
        this.cloneRuntimeResult(
          result
        );

      return this.cloneRuntimeResult(
        result
      );
    } catch (error) {
      return {
        success: false,
        running: false,
        healthy: false,
        visible: false,
        errors: [
          this.errorMessage(error)
        ]
      };
    }
  }

  public async verifyRuntime(
    request:
      SovereignFinalLaunchRequest,
    runtime:
      SovereignFinalRuntimeResult
  ): Promise<boolean> {
    if (
      this.options.runtimeVerifier
    ) {
      return await this.options
        .runtimeVerifier(
          request,
          runtime
        );
    }

    return (
      runtime.success &&
      runtime.running &&
      runtime.healthy &&
      runtime.visible &&
      runtime.errors.length === 0
    );
  }

  public async stopRuntime(
    runtime:
      SovereignFinalRuntimeResult
  ): Promise<void> {
    if (
      this.options.runtimeStopper
    ) {
      await this.options
        .runtimeStopper(runtime);
    }

    this.activeRuntime =
      undefined;

    await this.emit({
      type:
        "SOVEREIGN_FINAL_RUNTIME_STOPPED",

      projectId:
        this.options.projectId,

      timestamp:
        Date.now()
    });
  }

  public async persistResult(
    result:
      SovereignFinalLaunchResult
  ): Promise<void> {
    this.lastResult =
      this.cloneLaunchResult(
        result
      );
  }

  public async recordEvent(
    event: {
      type: string;
      launcherId: string;
      requestId: string;
      projectId: string;
      state:
        SovereignFinalLaunchResult[
          "state"
        ];
      timestamp: number;
      data?: Record<
        string,
        unknown
      >;
    }
  ): Promise<void> {
    await this.emit(
      event as Record<
        string,
        unknown
      >
    );
  }

  public bindComponent(
    component:
      SovereignFinalComponent,
    instance: unknown
  ): void {
    if (
      instance === undefined ||
      instance === null
    ) {
      throw new Error(
        `Cannot bind empty component: ${component}`
      );
    }

    this.bindings.set(
      component,
      {
        component,
        available: true,
        connected: false,
        healthy: false,
        errors: [],
        instance
      }
    );
  }

  public bindComponents(
    components:
      Partial<
        Record<
          SovereignFinalComponent,
          unknown
        >
      >
  ): void {
    for (
      const [
        component,
        instance
      ] of Object.entries(
        components
      )
    ) {
      if (
        instance === undefined ||
        instance === null
      ) {
        continue;
      }

      this.bindComponent(
        component as
          SovereignFinalComponent,
        instance
      );
    }
  }

  public getComponentStatus(
    component:
      SovereignFinalComponent
  ):
    | SovereignRuntimeComponentBinding
    | undefined {
    const binding =
      this.bindings.get(component);

    if (!binding) {
      return undefined;
    }

    return {
      ...binding,
      errors: [
        ...binding.errors
      ]
    };
  }

  public getAllComponentStatuses():
    SovereignRuntimeComponentBinding[] {
    return [
      ...this.bindings.values()
    ].map(
      binding => ({
        ...binding,
        errors: [
          ...binding.errors
        ]
      })
    );
  }

  private detectCommandType(
    instruction?: string
  ):
    | "PLATFORM"
    | "GAME"
    | "ADMIN"
    | "SOCIAL"
    | "MEDIA"
    | "PAYMENTS"
    | "SERVICE"
    | "GENERAL" {
    const text =
      instruction
        ?.toLowerCase()
        .trim() || "";

    if (
      this.containsAny(
        text,
        [
          "game",
          "games",
          "لعبة",
          "العاب",
          "ألعاب"
        ]
      )
    ) {
      return "GAME";
    }

    if (
      this.containsAny(
        text,
        [
          "admin",
          "dashboard",
          "لوحة التحكم",
          "الإدارة",
          "ادارة"
        ]
      )
    ) {
      return "ADMIN";
    }

    if (
      this.containsAny(
        text,
        [
          "social",
          "tiktok",
          "snapchat",
          "instagram",
          "facebook",
          "x.com",
          "تواصل",
          "سناب",
          "تيك توك",
          "انستغرام"
        ]
      )
    ) {
      return "SOCIAL";
    }

    if (
      this.containsAny(
        text,
        [
          "video",
          "youtube",
          "live",
          "tv",
          "stream",
          "فيديو",
          "يوتيوب",
          "بث",
          "تلفزيون",
          "أفلام",
          "افلام"
        ]
      )
    ) {
      return "MEDIA";
    }

    if (
      this.containsAny(
        text,
        [
          "payment",
          "wallet",
          "billing",
          "دفع",
          "محفظة",
          "فاتورة"
        ]
      )
    ) {
      return "PAYMENTS";
    }

    if (
      this.containsAny(
        text,
        [
          "service",
          "خدمة"
        ]
      )
    ) {
      return "SERVICE";
    }

    if (
      this.containsAny(
        text,
        [
          "platform",
          "majd",
          "منصة",
          "مجد"
        ]
      )
    ) {
      return "PLATFORM";
    }

    return "GENERAL";
  }

  private validateOptions(
    options:
      SovereignFinalRuntimeOptions
  ): void {
    if (
      !options.ownerId ||
      !options.ownerId.trim()
    ) {
      throw new Error(
        "Sovereign runtime requires OWNER id."
      );
    }

    if (
      !options.projectId ||
      !options.projectId.trim()
    ) {
      throw new Error(
        "Sovereign runtime requires project id."
      );
    }
  }

  private containsAny(
    text: string,
    values: string[]
  ): boolean {
    return values.some(
      value =>
        text.includes(
          value.toLowerCase()
        )
    );
  }

  private errorMessage(
    error: unknown
  ): string {
    return error instanceof Error
      ? error.message
      : String(error);
  }

  private async emit(
    event:
      Record<
        string,
        unknown
      >
  ): Promise<void> {
    if (
      this.options.onEvent
    ) {
      await this.options.onEvent(
        event
      );
    }
  }

  private cloneRuntimeResult(
    result:
      SovereignFinalRuntimeResult
  ): SovereignFinalRuntimeResult {
    return {
      ...result,
      errors: [
        ...result.errors
      ]
    };
  }

  private cloneLaunchResult(
    result:
      SovereignFinalLaunchResult
  ): SovereignFinalLaunchResult {
    return {
      ...result,

      integration:
        result.integration
          ? {
              ...result.integration,

              components:
                result.integration
                  .components
                  .map(
                    component => ({
                      ...component,
                      errors: [
                        ...component.errors
                      ]
                    })
                  ),

              missing: [
                ...result.integration
                  .missing
              ],

              unhealthy: [
                ...result.integration
                  .unhealthy
              ],

              errors: [
                ...result.integration
                  .errors
              ]
            }
          : undefined,

      bootstrap:
        result.bootstrap
          ? {
              ...result.bootstrap,
              errors: [
                ...result.bootstrap.errors
              ]
            }
          : undefined,

      runtime:
        result.runtime
          ? {
              ...result.runtime,
              errors: [
                ...result.runtime.errors
              ]
            }
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

export default SovereignAIFinalRuntime;

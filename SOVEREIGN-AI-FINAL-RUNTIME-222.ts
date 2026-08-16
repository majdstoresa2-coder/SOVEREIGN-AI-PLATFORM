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
} from "./SOVEREIGN-AI-FINAL-LAUNCHER-221";

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
    this.validateOptions(
      options
    );

    this.launcher =
      new SovereignAIFinalLauncher(
        this
      );
  }

  // ==========================================================
  // PUBLIC LAUNCH ENTRY
  // ==========================================================

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
          this.options.autonomous !==
          false,

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
      await this.launcher.launch(
        request
      );

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
      this.activeRuntime
        ?.running === true
    );
  }

  // ==========================================================
  // COMPONENT DISCOVERY
  // ==========================================================

  public async discoverComponent(
    component:
      SovereignFinalComponent
  ): Promise<boolean> {
    const existing =
      this.bindings.get(
        component
      );

    if (
      existing?.available
    ) {
      return true;
    }

    let instance:
      unknown | undefined;

    if (
      this.options
        .componentResolver
    ) {
      instance =
        await this.options
          .componentResolver(
            component
          );
    }

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
  }

  // ==========================================================
  // COMPONENT CONNECTION
  // ==========================================================

  public async connectComponent(
    component:
      SovereignFinalComponent
  ): Promise<boolean> {
    const binding =
      this.bindings.get(
        component
      );

    if (
      !binding ||
      !binding.available ||
      binding.instance ===
        undefined
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
        instance?.[
          "connect"
        ];

      if (
        typeof connect ===
        "function"
      ) {
        await (
          connect as (
            ...args: unknown[]
          ) => unknown
        ).call(
          binding.instance
        );
      }

      binding.connected =
        true;

      binding.errors =
        [];

      return true;
    } catch (error) {
      binding.connected =
        false;

      binding.errors = [
        this.errorMessage(
          error
        )
      ];

      return false;
    }
  }

  // ==========================================================
  // COMPONENT HEALTH
  // ==========================================================

  public async healthCheckComponent(
    component:
      SovereignFinalComponent
  ): Promise<{
    healthy: boolean;
    errors: string[];
  }> {
    const binding =
      this.bindings.get(
        component
      );

    if (
      !binding ||
      !binding.available ||
      !binding.connected ||
      binding.instance ===
        undefined
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
        instance?.[
          "healthCheck"
        ];

      if (
        typeof healthCheck ===
        "function"
      ) {
        const result =
          await (
            healthCheck as (
              ...args: unknown[]
            ) => unknown
          ).call(
            binding.instance
          );

        if (
          typeof result ===
          "boolean"
        ) {
          binding.healthy =
            result;

          binding.errors =
            result
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
      }

      binding.healthy =
        true;

      binding.errors =
        [];

      return {
        healthy: true,
        errors: []
      };
    } catch (error) {
      binding.healthy =
        false;

      binding.errors = [
        this.errorMessage(
          error
        )
      ];

      return {
        healthy: false,

        errors: [
          ...binding.errors
        ]
      };
    }
  }

  // ==========================================================
  // FINAL SYSTEM INTEGRATION
  // ==========================================================

  public async integrateSystem(
    request:
      SovereignFinalLaunchRequest,
    components:
      SovereignFinalComponentStatus[]
  ): Promise<{
    success: boolean;
    errors: string[];
  }> {
    const errors:
      string[] = [];

    for (
      const component of
        components
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

  // ==========================================================
  // BOOTSTRAP
  // ==========================================================

  public async bootstrap(
    request:
      SovereignFinalLaunchRequest
  ): Promise<SovereignFinalBootstrapResult> {
    if (
      this.options
        .bootstrapHandler
    ) {
      return await this.options
        .bootstrapHandler(
          request
        );
    }

    const bootstrapBinding =
      this.bindings.get(
        "BOOTSTRAP"
      );

    if (
      !bootstrapBinding ||
      !bootstrapBinding.instance
    ) {
      return {
        success: false,

        errors: [
          "BOOTSTRAP component is unavailable."
        ]
      };
    }

    try {
      const bootstrap =
        bootstrapBinding.instance as Record<
          string,
          unknown
        >;

      const boot =
        bootstrap["boot"];

      if (
        typeof boot !==
        "function"
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
          bootstrapBinding.instance,
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
        response?.["ready"] ===
          true ||
        response?.["state"] ===
          "RUNNING";

      return {
        success,

        bootstrapId:
          typeof response?.["id"] ===
            "string"
            ? response["id"]
            : undefined,

        runtimeId:
          typeof response?.[
            "runtimeId"
          ] === "string"
            ? response[
                "runtimeId"
              ]
            : undefined,

        liveTarget:
          typeof response?.[
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
                typeof response?.[
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
          this.errorMessage(
            error
          )
        ]
      };
    }
  }

  // ==========================================================
  // AUTONOMOUS RUNTIME START
  // ==========================================================

  public async startRuntime(
    request:
      SovereignFinalLaunchRequest,
    bootstrap:
      SovereignFinalBootstrapResult
  ): Promise<SovereignFinalRuntimeResult> {
    if (
      this.options
        .runtimeHandler
    ) {
      const result =
        await this.options
          .runtimeHandler(
            request,
            bootstrap
          );

      this.activeRuntime = {
        ...result,

        errors: [
          ...result.errors
        ]
      };

      return {
        ...this.activeRuntime,

        errors: [
          ...this.activeRuntime
            .errors
        ]
      };
    }

    const runtimeBinding =
      this.bindings.get(
        "AUTONOMOUS_RUNTIME"
      );

    if (
      !runtimeBinding ||
      !runtimeBinding.instance
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
      const runtime =
        runtimeBinding.instance as Record<
          string,
          unknown
        >;

      const execute =
        runtime["execute"];

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
          runtimeBinding.instance,
          {
            id: this.createId(
              "runtime-command"
            ),

            ownerCommandId:
              request.commandId,

            projectId:
              request.projectId,

            type:
              this.detectCommandType(
                request.instruction
              ),

            instruction:
              request.instruction ||
              "Start Majd sovereign platform.",

            autonomous:
              request.autonomous,

            priority:
              100,

            createdAt:
              Date.now()
          }
        );

      const state =
        typeof execution?.[
          "state"
        ] === "string"
          ? execution["state"]
          : undefined;

      const success =
        state ===
          "COMPLETED" ||
        state ===
          "RUNNING";

      const liveTarget =
        typeof execution?.[
          "liveTarget"
        ] === "string"
          ? execution[
              "liveTarget"
            ]
          : bootstrap.liveTarget ??
            this.options.liveTarget;

      const result:
        SovereignFinalRuntimeResult = {
          success,

          running:
            success,

          healthy:
            success,

          visible:
            typeof liveTarget ===
              "string" &&
            liveTarget.length > 0,

          playable:
            execution?.[
              "type"
            ] === "GAME"
              ? execution?.[
                  "verification"
                ] !== undefined
              : undefined,

          liveTarget,

          errors:
            success
              ? []
              : [
                  typeof execution?.[
                    "error"
                  ] === "string"
                    ? execution[
                        "error"
                      ]
                    : "Autonomous runtime did not complete successfully."
                ]
        };

      this.activeRuntime =
        result;

      return {
        ...result,

        errors: [
          ...result.errors
        ]
      };
    } catch (error) {
      return {
        success: false,

        running: false,

        healthy: false,

        visible: false,

        errors: [
          this.errorMessage(
            error
          )
        ]
      };
    }
  }

  // ==========================================================
  // FINAL VERIFICATION
  // ==========================================================

  public async verifyRuntime(
    request:
      SovereignFinalLaunchRequest,
    runtime:
      SovereignFinalRuntimeResult
  ): Promise<boolean> {
    if (
      this.options
        .runtimeVerifier
    ) {
      return await this.options
        .runtimeVerifier(
          request,
          runtime
        );
    }

    if (
      !runtime.success ||
      !runtime.running ||
      !runtime.healthy ||
      !runtime.visible
    ) {
      return false;
    }

    if (
      runtime.errors.length > 0
    ) {
      return false;
    }

    return true;
  }

  // ==========================================================
  // RUNTIME STOP
  // ==========================================================

  public async stopRuntime(
    runtime:
      SovereignFinalRuntimeResult
  ): Promise<void> {
    if (
      this.options
        .runtimeStopper
    ) {
      await this.options
        .runtimeStopper(
          runtime
        );
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

  // ==========================================================
  // RESULT PERSISTENCE
  // ==========================================================

  public async persistResult(
    result:
      SovereignFinalLaunchResult
  ): Promise<void> {
    this.lastResult =
      this.cloneLaunchResult(
        result
      );
  }

  // ==========================================================
  // EVENT RECORDING
  // ==========================================================

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

  // ==========================================================
  // COMPONENT BINDING API
  // ==========================================================

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

        error

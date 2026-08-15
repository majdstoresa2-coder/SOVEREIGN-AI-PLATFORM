// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-EXTERNAL-PLATFORM-INTELLIGENCE-218.ts
// Final Closure 13/15
// External Platform Intelligence Layer
// ============================================================

export type ExternalPlatform =
  | "TIKTOK"
  | "SNAPCHAT"
  | "X"
  | "YOUTUBE"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "GOOGLE"
  | "APPLE"
  | "OTHER";

export type PlatformCapability =
  | "PUBLISH"
  | "VIDEO"
  | "SHORT_VIDEO"
  | "IMAGE"
  | "TEXT"
  | "LIVE"
  | "ANALYTICS"
  | "COMMENTS"
  | "MESSAGING"
  | "ADS"
  | "AUTHENTICATION"
  | "SHARING"
  | "DISCOVERY";

export interface PlatformKnowledge {
  platform: ExternalPlatform;

  capabilities: PlatformCapability[];

  publishingRules: string[];

  contentRules: string[];

  analyticsFields: string[];

  integrationRequirements: string[];

  operationalConstraints: string[];

  updatedAt: number;
}

export interface PlatformTask {
  id: string;

  commandId: string;

  projectId?: string;

  platform: ExternalPlatform;

  objective: string;

  requestedCapabilities: PlatformCapability[];

  createdAt: number;
}

export interface PlatformExecutionContext {
  taskId: string;

  platform: ExternalPlatform;

  objective: string;

  supportedCapabilities: PlatformCapability[];

  unsupportedCapabilities: PlatformCapability[];

  requirements: string[];

  rules: string[];

  analytics: string[];

  executionAllowed: boolean;

  blockingReasons: string[];

  createdAt: number;
}

export interface PlatformIntelligenceResult {
  success: boolean;

  context?: PlatformExecutionContext;

  error?: string;
}

export interface SovereignExternalPlatformAdapter {
  loadKnowledge(
    platform: ExternalPlatform
  ): Promise<PlatformKnowledge | undefined>;

  refreshKnowledge?(
    platform: ExternalPlatform
  ): Promise<PlatformKnowledge>;

  validateKnowledge?(
    knowledge: PlatformKnowledge
  ): Promise<boolean>;

  persistContext?(
    context: PlatformExecutionContext
  ): Promise<void>;

  recordEvent?(event: {
    type: string;
    taskId: string;
    commandId: string;
    projectId?: string;
    platform: ExternalPlatform;
    timestamp: number;
    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIExternalPlatformIntelligence {
  constructor(
    private readonly adapter:
      SovereignExternalPlatformAdapter
  ) {}

  public async prepare(
    raw: PlatformTask
  ): Promise<PlatformIntelligenceResult> {
    try {
      const task =
        this.normalizeTask(raw);

      this.validateTask(task);

      await this.record(
        "EXTERNAL_PLATFORM_INTELLIGENCE_STARTED",
        task
      );

      let knowledge =
        await this.adapter.loadKnowledge(
          task.platform
        );

      if (
        !knowledge &&
        this.adapter.refreshKnowledge
      ) {
        knowledge =
          await this.adapter.refreshKnowledge(
            task.platform
          );
      }

      if (!knowledge) {
        return {
          success: false,
          error:
            `No knowledge available for ${task.platform}.`
        };
      }

      if (
        this.adapter.validateKnowledge
      ) {
        const valid =
          await this.adapter.validateKnowledge(
            knowledge
          );

        if (!valid) {
          return {
            success: false,
            error:
              `Knowledge validation failed for ${task.platform}.`
          };
        }
      }

      const supported =
        task.requestedCapabilities.filter(
          capability =>
            knowledge!.capabilities.includes(
              capability
            )
        );

      const unsupported =
        task.requestedCapabilities.filter(
          capability =>
            !knowledge!.capabilities.includes(
              capability
            )
        );

      const blockingReasons: string[] =
        [];

      if (unsupported.length > 0) {
        blockingReasons.push(
          `Unsupported capabilities: ${unsupported.join(", ")}`
        );
      }

      const context:
        PlatformExecutionContext = {
          taskId: task.id,

          platform: task.platform,

          objective: task.objective,

          supportedCapabilities:
            [...supported],

          unsupportedCapabilities:
            [...unsupported],

          requirements:
            this.clean([
              ...knowledge.integrationRequirements,
              ...knowledge.operationalConstraints
            ]),

          rules:
            this.clean([
              ...knowledge.publishingRules,
              ...knowledge.contentRules
            ]),

          analytics:
            this.clean(
              knowledge.analyticsFields
            ),

          executionAllowed:
            blockingReasons.length === 0,

          blockingReasons,

          createdAt: Date.now()
        };

      if (
        this.adapter.persistContext
      ) {
        await this.adapter.persistContext(
          this.cloneContext(context)
        );
      }

      await this.record(
        context.executionAllowed
          ? "EXTERNAL_PLATFORM_INTELLIGENCE_READY"
          : "EXTERNAL_PLATFORM_INTELLIGENCE_BLOCKED",
        task,
        {
          supported:
            context.supportedCapabilities,

          unsupported:
            context.unsupportedCapabilities
        }
      );

      return {
        success:
          context.executionAllowed,

        context:
          this.cloneContext(context)
      };
    } catch (error) {
      return {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : String(error)
      };
    }
  }

  public async refresh(
    platform: ExternalPlatform
  ): Promise<PlatformKnowledge> {
    if (
      !this.adapter.refreshKnowledge
    ) {
      throw new Error(
        "Platform knowledge refresh adapter is not connected."
      );
    }

    const knowledge =
      await this.adapter.refreshKnowledge(
        platform
      );

    if (
      this.adapter.validateKnowledge
    ) {
      const valid =
        await this.adapter.validateKnowledge(
          knowledge
        );

      if (!valid) {
        throw new Error(
          `Refreshed knowledge failed validation for ${platform}.`
        );
      }
    }

    return this.cloneKnowledge(
      knowledge
    );
  }

  private normalizeTask(
    input: PlatformTask
  ): PlatformTask {
    return {
      ...input,

      id:
        input.id.trim(),

      commandId:
        input.commandId.trim(),

      projectId:
        input.projectId
          ?.trim() ||
        undefined,

      objective:
        input.objective
          .trim()
          .replace(/\s+/g, " "),

      requestedCapabilities: [
        ...new Set(
          input.requestedCapabilities
        )
      ]
    };
  }

  private validateTask(
    task: PlatformTask
  ): void {
    if (!task.id) {
      throw new Error(
        "Platform task id is required."
      );
    }

    if (!task.commandId) {
      throw new Error(
        "Platform command id is required."
      );
    }

    if (!task.objective) {
      throw new Error(
        "Platform objective is required."
      );
    }

    if (
      task.requestedCapabilities.length ===
      0
    ) {
      throw new Error(
        "At least one platform capability is required."
      );
    }
  }

  private clean(
    values: string[]
  ): string[] {
    return [
      ...new Set(
        values
          .map(
            value =>
              value.trim()
          )
          .filter(Boolean)
      )
    ];
  }

  private cloneKnowledge(
    knowledge: PlatformKnowledge
  ): PlatformKnowledge {
    return {
      ...knowledge,

      capabilities: [
        ...knowledge.capabilities
      ],

      publishingRules: [
        ...knowledge.publishingRules
      ],

      contentRules: [
        ...knowledge.contentRules
      ],

      analyticsFields: [
        ...knowledge.analyticsFields
      ],

      integrationRequirements: [
        ...knowledge.integrationRequirements
      ],

      operationalConstraints: [
        ...knowledge.operationalConstraints
      ]
    };
  }

  private cloneContext(
    context: PlatformExecutionContext
  ): PlatformExecutionContext {
    return {
      ...context,

      supportedCapabilities: [
        ...context.supportedCapabilities
      ],

      unsupportedCapabilities: [
        ...context.unsupportedCapabilities
      ],

      requirements: [
        ...context.requirements
      ],

      rules: [
        ...context.rules
      ],

      analytics: [
        ...context.analytics
      ],

      blockingReasons: [
        ...context.blockingReasons
      ]
    };
  }

  private async record(
    type: string,
    task: PlatformTask,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter.recordEvent({
        type,

        taskId:
          task.id,

        commandId:
          task.commandId,

        projectId:
          task.projectId,

        platform:
          task.platform,

        timestamp:
          Date.now(),

        data
      });
    }
  }
}

export default SovereignAIExternalPlatformIntelligence;

// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-INTENT-ENGINE-190.ts
// Sovereign Autonomous AI Intent Engine
// ============================================================

export type SovereignIntentType =
  | "BUILD"
  | "CREATE"
  | "DEVELOP"
  | "TEST"
  | "VERIFY"
  | "REPAIR"
  | "DEPLOY"
  | "MONITOR"
  | "AUTOMATE"
  | "ANALYZE"
  | "OPTIMIZE"
  | "MAINTAIN"
  | "OPERATE"
  | "UNKNOWN";

export type SovereignIntentPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type SovereignIntentRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignIntentInput {
  id: string;

  command: string;

  source:
    | "OWNER"
    | "STEWARD"
    | "SYSTEM"
    | "AI"
    | "EVENT";

  autonomous: boolean;

  context?: Record<string, unknown>;

  createdAt: number;
}

export interface SovereignIntent {
  id: string;

  inputId: string;

  type: SovereignIntentType;

  objective: string;

  priority: SovereignIntentPriority;

  risk: SovereignIntentRisk;

  confidence: number;

  entities: string[];

  constraints: string[];

  expectedOutcomes: string[];

  requiredCapabilities: string[];

  autonomous: boolean;

  requiresOwnerAuthority: boolean;

  createdAt: number;
}

export interface SovereignIntentBundle {
  id: string;

  inputId: string;

  primary: SovereignIntent;

  secondary: SovereignIntent[];

  complete: boolean;

  confidence: number;

  ambiguities: string[];

  createdAt: number;
}

export interface SovereignIntentAdapter {
  interpret(
    input: SovereignIntentInput
  ): Promise<{
    primary: Omit<
      SovereignIntent,
      "id" | "inputId" | "createdAt"
    >;

    secondary?: Omit<
      SovereignIntent,
      "id" | "inputId" | "createdAt"
    >[];

    ambiguities?: string[];
  }>;

  policyCheck?(
    intent: SovereignIntent
  ): Promise<boolean>;

  authorityCheck?(
    intent: SovereignIntent
  ): Promise<boolean>;

  persistBundle?(
    bundle: SovereignIntentBundle
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    inputId?: string;

    intentId?: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIIntentEngine {
  constructor(
    private readonly adapter: SovereignIntentAdapter
  ) {}

  public async understand(
    input: SovereignIntentInput
  ): Promise<SovereignIntentBundle> {
    this.validateInput(input);

    const interpreted =
      await this.adapter.interpret(
        input
      );

    const primary =
      this.createIntent(
        input,
        interpreted.primary
      );

    const secondary =
      (
        interpreted.secondary || []
      ).map(
        intent =>
          this.createIntent(
            input,
            intent
          )
      );

    await this.validateIntent(
      primary
    );

    for (const intent of secondary) {
      await this.validateIntent(
        intent
      );
    }

    const ambiguities =
      [
        ...new Set(
          (
            interpreted.ambiguities ||
            []
          )
            .map(
              value =>
                value.trim()
            )
            .filter(Boolean)
        )
      ];

    const allIntents = [
      primary,
      ...secondary
    ];

    const confidence =
      allIntents.reduce(
        (total, intent) =>
          total +
          intent.confidence,
        0
      ) /
      Math.max(
        1,
        allIntents.length
      );

    const complete =
      primary.type !== "UNKNOWN" &&
      primary.objective.length > 0 &&
      confidence >= 0.5;

    const bundle:
      SovereignIntentBundle = {
        id: this.createId(
          "intent-bundle"
        ),

        inputId:
          input.id,

        primary,

        secondary,

        complete,

        confidence:
          this.normalize(
            confidence
          ),

        ambiguities,

        createdAt:
          Date.now()
      };

    if (
      this.adapter.persistBundle
    ) {
      await this.adapter
        .persistBundle(
          bundle
        );
    }

    await this.record(
      complete
        ? "AI_INTENT_RESOLVED"
        : "AI_INTENT_INCOMPLETE",
      input.id,
      primary.id,
      {
        type:
          primary.type,

        objective:
          primary.objective,

        confidence:
          bundle.confidence,

        secondaryIntents:
          secondary.length,

        ambiguities
      }
    );

    return bundle;
  }

  public canPlan(
    bundle: SovereignIntentBundle
  ): boolean {
    return (
      bundle.complete &&
      bundle.primary.type !==
        "UNKNOWN" &&
      bundle.confidence >= 0.5
    );
  }

  public getAllIntents(
    bundle: SovereignIntentBundle
  ): SovereignIntent[] {
    return [
      this.cloneIntent(
        bundle.primary
      ),

      ...bundle.secondary.map(
        intent =>
          this.cloneIntent(
            intent
          )
      )
    ];
  }

  public getRequiredCapabilities(
    bundle: SovereignIntentBundle
  ): string[] {
    return [
      ...new Set(
        this.getAllIntents(
          bundle
        ).flatMap(
          intent =>
            intent.requiredCapabilities
        )
      )
    ];
  }

  public requiresOwner(
    bundle: SovereignIntentBundle
  ): boolean {
    return this.getAllIntents(
      bundle
    ).some(
      intent =>
        intent.requiresOwnerAuthority
    );
  }

  private createIntent(
    input: SovereignIntentInput,
    data: Omit<
      SovereignIntent,
      "id" | "inputId" | "createdAt"
    >
  ): SovereignIntent {
    return {
      ...data,

      id: this.createId(
        "intent"
      ),

      inputId:
        input.id,

      objective:
        data.objective.trim(),

      confidence:
        this.normalize(
          data.confidence
        ),

      entities: [
        ...new Set(
          data.entities
            .map(
              value =>
                value.trim()
            )
            .filter(Boolean)
        )
      ],

      constraints: [
        ...new Set(
          data.constraints
            .map(
              value =>
                value.trim()
            )
            .filter(Boolean)
        )
      ],

      expectedOutcomes: [
        ...new Set(
          data.expectedOutcomes
            .map(
              value =>
                value.trim()
            )
            .filter(Boolean)
        )
      ],

      requiredCapabilities: [
        ...new Set(
          data.requiredCapabilities
            .map(
              value =>
                value.trim()
            )
            .filter(Boolean)
        )
      ],

      autonomous:
        input.autonomous &&
        data.autonomous,

      createdAt:
        Date.now()
    };
  }

  private async validateIntent(
    intent: SovereignIntent
  ): Promise<void> {
    if (!intent.objective) {
      throw new Error(
        "Intent objective is required."
      );
    }

    if (
      intent.risk === "CRITICAL" &&
      intent.autonomous
    ) {
      intent.requiresOwnerAuthority =
        true;
    }

    if (
      this.adapter.policyCheck
    ) {
      const policyPassed =
        await this.adapter.policyCheck(
          intent
        );

      if (!policyPassed) {
        intent.requiresOwnerAuthority =
          true;
      }
    }

    if (
      this.adapter.authorityCheck
    ) {
      const authorityPassed =
        await this.adapter
          .authorityCheck(
            intent
          );

      if (!authorityPassed) {
        intent.requiresOwnerAuthority =
          true;
      }
    }
  }

  private validateInput(
    input: SovereignIntentInput
  ): void {
    if (!input.id.trim()) {
      throw new Error(
        "Intent input id is required."
      );
    }

    if (!input.command.trim()) {
      throw new Error(
        "Intent command is required."
      );
    }

    if (
      input.source === "OWNER" &&
      input.autonomous
    ) {
      throw new Error(
        "Autonomous execution cannot impersonate OWNER."
      );
    }
  }

  private normalize(
    value: number
  ): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        1,
        value
      )
    );
  }

  private cloneIntent(
    intent: SovereignIntent
  ): SovereignIntent {
    return {
      ...intent,

      entities: [
        ...intent.entities
      ],

      constraints: [
        ...intent.constraints
      ],

      expectedOutcomes: [
        ...intent.expectedOutcomes
      ],

      requiredCapabilities: [
        ...intent.requiredCapabilities
      ]
    };
  }

  private async record(
    type: string,
    inputId?: string,
    intentId?: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,

          inputId,

          intentId,

          timestamp:
            Date.now(),

          data
        });
    }
  }

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

export default SovereignAIIntentEngine;

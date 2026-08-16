// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-OWNER-COMMAND-GATEWAY-208.ts
// Final Closure 03/15
// Sovereign OWNER Command Gateway
// ============================================================

export type SovereignCommandAuthority =
  | "OWNER"
  | "STEWARD";

export type SovereignCommandDomain =
  | "PLATFORM"
  | "GAME"
  | "ADMIN"
  | "SOCIAL"
  | "MEDIA"
  | "PAYMENTS"
  | "INFRASTRUCTURE"
  | "SECURITY"
  | "AI"
  | "GENERAL";

export type SovereignCommandStatus =
  | "RECEIVED"
  | "VALIDATED"
  | "NORMALIZED"
  | "READY"
  | "DISPATCHED"
  | "REJECTED"
  | "FAILED";

export interface SovereignOwnerCommandInput {
  id?: string;

  authority: SovereignCommandAuthority;

  instruction: string;

  projectId?: string;

  domain?: SovereignCommandDomain;

  priority?: number;

  autonomous?: boolean;

  constraints?: string[];

  metadata?: Record<string, unknown>;
}

export interface SovereignNormalizedOwnerCommand {
  id: string;

  authority: SovereignCommandAuthority;

  instruction: string;

  originalInstruction: string;

  projectId?: string;

  domain: SovereignCommandDomain;

  priority: number;

  autonomous: boolean;

  constraints: string[];

  intent: SovereignCommandIntent;

  createdAt: number;

  metadata: Record<string, unknown>;
}

export interface SovereignCommandIntent {
  action:
    | "BUILD"
    | "CREATE"
    | "UPDATE"
    | "REPAIR"
    | "TEST"
    | "DEPLOY"
    | "OPERATE"
    | "INSPECT"
    | "IMPROVE"
    | "UNKNOWN";

  target: string;

  expectedOutcome: string;

  requiresBuild: boolean;

  requiresTesting: boolean;

  requiresVerification: boolean;

  requiresDeployment: boolean;
}

export interface SovereignMasterCommandEnvelope {
  id: string;

  authority:
    | "OWNER"
    | "STEWARD";

  instruction: string;

  projectId?: string;

  priority: number;

  autonomous: boolean;

  metadata: Record<string, unknown>;

  createdAt: number;
}

export interface SovereignOwnerCommandReceipt {
  id: string;

  commandId: string;

  status: SovereignCommandStatus;

  accepted: boolean;

  reason: string;

  normalized?: SovereignNormalizedOwnerCommand;

  masterCommand?: SovereignMasterCommandEnvelope;

  receivedAt: number;

  dispatchedAt?: number;
}

export interface SovereignOwnerCommandGatewayAdapter {
  validateAuthority?(
    authority: SovereignCommandAuthority,
    command: SovereignOwnerCommandInput
  ): Promise<boolean>;

  classifyDomain?(
    instruction: string
  ): Promise<SovereignCommandDomain>;

  interpretIntent?(
    instruction: string,
    domain: SovereignCommandDomain
  ): Promise<SovereignCommandIntent>;

  dispatch?(
    command: SovereignMasterCommandEnvelope
  ): Promise<unknown>;

  persistReceipt?(
    receipt: SovereignOwnerCommandReceipt
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    commandId: string;

    receiptId: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIOwnerCommandGateway {
  constructor(
    private readonly adapter:
      SovereignOwnerCommandGatewayAdapter
  ) {}

  public async receive(
    input: SovereignOwnerCommandInput
  ): Promise<SovereignOwnerCommandReceipt> {
    const receivedAt =
      Date.now();

    const commandId =
      input.id?.trim() ||
      this.createId(
        "owner-command"
      );

    const receipt:
      SovereignOwnerCommandReceipt = {
        id: this.createId(
          "command-receipt"
        ),

        commandId,

        status: "RECEIVED",

        accepted: false,

        reason:
          "Command received.",

        receivedAt
      };

    try {
      this.validateInput(
        input
      );

      if (
        this.adapter.validateAuthority
      ) {
        const authorized =
          await this.adapter
            .validateAuthority(
              input.authority,
              input
            );

        if (!authorized) {
          return await this.reject(
            receipt,
            "Command authority validation failed."
          );
        }
      }

      receipt.status =
        "VALIDATED";

      const domain =
        input.domain ??
        (
          this.adapter.classifyDomain
            ? await this.adapter
                .classifyDomain(
                  input.instruction
                )
            : this.detectDomain(
                input.instruction
              )
        );

      const intent =
        this.adapter.interpretIntent
          ? await this.adapter
              .interpretIntent(
                input.instruction,
                domain
              )
          : this.detectIntent(
              input.instruction
            );

      const normalized:
        SovereignNormalizedOwnerCommand = {
          id: commandId,

          authority:
            input.authority,

          instruction:
            this.normalizeInstruction(
              input.instruction
            ),

          originalInstruction:
            input.instruction,

          projectId:
            input.projectId
              ?.trim() ||
            undefined,

          domain,

          priority:
            this.normalizePriority(
              input.priority ??
                (
                  input.authority ===
                    "OWNER"
                    ? 100
                    : 80
                )
            ),

          autonomous:
            input.autonomous ??
            true,

          constraints: [
            ...new Set(
              (
                input.constraints ??
                []
              )
                .map(
                  value =>
                    value.trim()
                )
                .filter(Boolean)
            )
          ],

          intent,

          createdAt:
            receivedAt,

          metadata: {
            ...(
              input.metadata ??
              {}
            )
          }
        };

      receipt.status =
        "NORMALIZED";

      receipt.normalized =
        this.cloneNormalized(
          normalized
        );

      const masterCommand =
        this.toMasterCommand(
          normalized
        );

      receipt.masterCommand = {
        ...masterCommand,

        metadata: {
          ...masterCommand
            .metadata
        }
      };

      receipt.status =
        "READY";

      receipt.accepted =
        true;

      receipt.reason =
        "Command validated and prepared for sovereign AI execution.";

      if (
        this.adapter.dispatch
      ) {
        await this.adapter
          .dispatch(
            masterCommand
          );

        receipt.status =
          "DISPATCHED";

        receipt.dispatchedAt =
          Date.now();

        receipt.reason =
          "Command dispatched to sovereign AI master integration.";
      }

      await this.persist(
        receipt
      );

      await this.record(
        "SOVEREIGN_OWNER_COMMAND_ACCEPTED",
        receipt,
        {
          authority:
            normalized.authority,

          domain:
            normalized.domain,

          action:
            normalized.intent
              .action,

          target:
            normalized.intent
              .target,

          autonomous:
            normalized.autonomous
        }
      );

      return this.cloneReceipt(
        receipt
      );
    } catch (error) {
      receipt.status =
        "FAILED";

      receipt.accepted =
        false;

      receipt.reason =
        error instanceof Error
          ? error.message
          : String(error);

      await this.persist(
        receipt
      );

      await this.record(
        "SOVEREIGN_OWNER_COMMAND_FAILED",
        receipt,
        {
          reason:
            receipt.reason
        }
      );

      return this.cloneReceipt(
        receipt
      );
    }
  }

  public toMasterCommand(
    command:
      SovereignNormalizedOwnerCommand
  ): SovereignMasterCommandEnvelope {
    return {
      id: command.id,

      authority:
        command.authority,

      instruction:
        command.instruction,

      projectId:
        command.projectId,

      priority:
        command.priority,

      autonomous:
        command.autonomous,

      createdAt:
        command.createdAt,

      metadata: {
        ...command.metadata,

        sovereignCommandDomain:
          command.domain,

        sovereignCommandIntent:
          command.intent.action,

        sovereignCommandTarget:
          command.intent.target,

        expectedOutcome:
          command.intent
            .expectedOutcome,

        constraints: [
          ...command.constraints
        ],

        requiresBuild:
          command.intent
            .requiresBuild,

        requiresTesting:
          command.intent
            .requiresTesting,

        requiresVerification:
          command.intent
            .requiresVerification,

        requiresDeployment:
          command.intent
            .requiresDeployment
      }
    };
  }

  private validateInput(
    input:
      SovereignOwnerCommandInput
  ): void {
    if (
      input.authority !==
        "OWNER" &&
      input.authority !==
        "STEWARD"
    ) {
      throw new Error(
        "Only OWNER or STEWARD may enter commands through the sovereign command gateway."
      );
    }

    if (
      !input.instruction ||
      !input.instruction.trim()
    ) {
      throw new Error(
        "Sovereign command instruction is required."
      );
    }

    if (
      input.instruction
        .trim()
        .length < 2
    ) {
      throw new Error(
        "Sovereign command instruction is too short."
      );
    }
  }

  private normalizeInstruction(
    instruction: string
  ): string {
    return instruction
      .trim()
      .replace(
        /\s+/g,
        " "
      );
  }

  private detectDomain(
    instruction: string
  ): SovereignCommandDomain {
    const text =
      instruction
        .toLowerCase();

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
          "video",
          "live",
          "stream",
          "tv",
          "فيديو",
          "بث",
          "تلفزيون",
          "افلام",
          "أفلام"
        ]
      )
    ) {
      return "MEDIA";
    }

    if (
      this.containsAny(
        text,
        [
          "social",
          "feed",
          "post",
          "story",
          "short video",
          "منشور",
          "قصص",
          "تواصل",
          "فيديو قصير"
        ]
      )
    ) {
      return "SOCIAL";
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
          "security",
          "permission",
          "auth",
          "أمان",
          "امن",
          "صلاحيات"
        ]
      )
    ) {
      return "SECURITY";
    }

    if (
      this.containsAny(
        text,
        [
          "server",
          "deploy",
          "database",
          "infrastructure",
          "سيرفر",
          "قاعدة البيانات",
          "نشر"
        ]
      )
    ) {
      return "INFRASTRUCTURE";
    }

    if (
      this.containsAny(
        text,
        [
          "ai",
          "artificial intelligence",
          "ذكاء اصطناعي",
          "العقل المدبر"
        ]
      )
    ) {
      return "AI";
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

  private detectIntent(
    instruction: string
  ): SovereignCommandIntent {
    const text =
      instruction
        .toLowerCase();

    let action:
      SovereignCommandIntent["action"] =
        "UNKNOWN";

    if (
      this.containsAny(
        text,
        [
          "build",
          "ابن",
          "ابني",
          "بناء"
        ]
      )
    ) {
      action = "BUILD";
    } else if (
      this.containsAny(
        text,
        [
          "create",
          "make",
          "أنشئ",
          "انشئ",
          "اصنع",
          "سوي"
        ]
      )
    ) {
      action = "CREATE";
    } else if (
      this.containsAny(
        text,
        [
          "update",
          "upgrade",
          "طور",
          "طوّر",
          "حدث",
          "حدّث"
        ]
      )
    ) {
      action = "UPDATE";
    } else if (
      this.containsAny(
        text,
        [
          "repair",
          "fix",
          "اصلح",
          "أصلح"
        ]
      )
    ) {
      action = "REPAIR";
    } else if (
      this.containsAny(
        text,
        [
          "test",
          "اختبر",
          "اختبار"
        ]
      )
    ) {
      action = "TEST";
    } else if (
      this.containsAny(
        text,
        [
          "deploy",
          "publish",
          "انشر",
          "نشر"
        ]
      )
    ) {
      action = "DEPLOY";
    } else if (
      this.containsAny(
        text,
        [
          "operate",
          "run",
          "شغل",
          "شغّل",
          "تشغيل"
        ]
      )
    ) {
      action = "OPERATE";
    } else if (
      this.containsAny(
        text,
        [
          "inspect",
          "check",
          "راجع",
          "افحص",
          "تأكد"
        ]
      )
    ) {
      action = "INSPECT";
    } else if (
      this.containsAny(
        text,
        [
          "improve",
          "optimize",
          "حسن",
          "حسّن"
        ]
      )
    ) {
      action = "IMPROVE";
    }

    const requiresBuild =
      action === "BUILD" ||
      action === "CREATE" ||
      action === "UPDATE" ||
      action === "REPAIR" ||
      action === "IMPROVE";

    const requiresTesting =
      requiresBuild ||
      action === "TEST";

    const requiresVerification =
      requiresTesting ||
      action === "DEPLOY" ||
      action === "OPERATE";

    const requiresDeployment =
      action === "DEPLOY";

    return {
      action,

      target:
        this.extractTarget(
          instruction
        ),

      expectedOutcome:
        this.expectedOutcome(
          action,
          instruction
        ),

      requiresBuild,

      requiresTesting,

      requiresVerification,

      requiresDeployment
    };
  }

  private extractTarget(
    instruction: string
  ): string {
    const normalized =
      this.normalizeInstruction(
        instruction
      );

    return normalized.length >
      200
      ? normalized.slice(
          0,
          200
        )
      : normalized;
  }

  private expectedOutcome(
    action:
      SovereignCommandIntent["action"],
    instruction: string
  ): string {
    switch (action) {
      case "BUILD":
      case "CREATE":
        return `Working implementation produced for: ${this.extractTarget(
          instruction
        )}`;

      case "UPDATE":
      case "IMPROVE":
        return `Existing implementation improved and verified for: ${this.extractTarget(
          instruction
        )}`;

      case "REPAIR":
        return `Failure repaired and verified for: ${this.extractTarget(
          instruction
        )}`;

      case "TEST":
        return `Implementation tested with verified result for: ${this.extractTarget(
          instruction
        )}`;

      case "DEPLOY":
        return `Authorized release deployed and verified for: ${this.extractTarget(
          instruction
        )}`;

      case "OPERATE":
        return `Requested capability operating successfully: ${this.extractTarget(
          instruction
        )}`;

      case "INSPECT":
        return `Inspection completed with actionable findings for: ${this.extractTarget(
          instruction
        )}`;

      default:
        return `OWNER instruction completed and verified: ${this.extractTarget(
          instruction
        )}`;
    }
  }

  private containsAny(
    text: string,
    values: string[]
  ): boolean {
    return values.some(
      value =>
        text.includes(
          value
            .toLowerCase()
        )
    );
  }

  private normalizePriority(
    value: number
  ): number {
    if (
      !Number.isFinite(value)
    ) {
      return 100;
    }

    return Math.max(
      0,
      Math.min(
        100,
        Math.floor(value)
      )
    );
  }

  private async reject(
    receipt:
      SovereignOwnerCommandReceipt,
    reason: string
  ): Promise<SovereignOwnerCommandReceipt> {
    receipt.status =
      "REJECTED";

    receipt.accepted =
      false;

    receipt.reason =
      reason;

    await this.persist(
      receipt
    );

    await this.record(
      "SOVEREIGN_OWNER_COMMAND_REJECTED",
      receipt,
      {
        reason
      }
    );

    return this.cloneReceipt(
      receipt
    );
  }

    private async persist(
    receipt:
      SovereignOwnerCommandReceipt
  ): Promise<void> {
    if (
      this.adapter.persistReceipt
    ) {
      await this.adapter
        .persistReceipt(
          this.cloneReceipt(
            receipt
          )
        );
    }
  }

  private async record(
    type: string,
    receipt:
      SovereignOwnerCommandReceipt,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,

          commandId:
            receipt.commandId,

          receiptId:
            receipt.id,

          timestamp:
            Date.now(),

          data:
            data
              ? {
                  ...data
                }
              : undefined
        });
    }
  }

  private cloneIntent(
    intent:
      SovereignCommandIntent
  ): SovereignCommandIntent {
    return {
      ...intent
    };
  }

  private cloneNormalized(
    command:
      SovereignNormalizedOwnerCommand
  ): SovereignNormalizedOwnerCommand {
    return {
      ...command,

      constraints: [
        ...command.constraints
      ],

      intent:
        this.cloneIntent(
          command.intent
        ),

      metadata: {
        ...command.metadata
      }
    };
  }

  private cloneMasterCommand(
    command:
      SovereignMasterCommandEnvelope
  ): SovereignMasterCommandEnvelope {
    return {
      ...command,

      metadata: {
        ...command.metadata
      }
    };
  }

  private cloneReceipt(
    receipt:
      SovereignOwnerCommandReceipt
  ): SovereignOwnerCommandReceipt {
    return {
      ...receipt,

      normalized:
        receipt.normalized
          ? this.cloneNormalized(
              receipt.normalized
            )
          : undefined,

      masterCommand:
        receipt.masterCommand
          ? this.cloneMasterCommand(
              receipt.masterCommand
            )
          : undefined
    };
  }

  private createId(
    prefix: string
  ): string {
    const random =
      Math.random()
        .toString(36)
        .slice(2, 10);

    return [
      prefix,
      Date.now()
        .toString(36),
      random
    ].join("-");
  }
}

export default SovereignAIOwnerCommandGateway;
     

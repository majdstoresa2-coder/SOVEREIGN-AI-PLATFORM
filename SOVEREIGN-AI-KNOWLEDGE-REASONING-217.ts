// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-KNOWLEDGE-REASONING-217.ts
// Final Closure 12/15
// Sovereign Knowledge Reasoning & Context Engine
// ============================================================

export type SovereignReasoningDomain =
  | "PLATFORM"
  | "GAME"
  | "SOCIAL"
  | "MEDIA"
  | "PAYMENTS"
  | "SECURITY"
  | "INFRASTRUCTURE"
  | "DEVELOPMENT"
  | "OPERATIONS"
  | "BUSINESS"
  | "GENERAL";

export type SovereignReasoningPlatform =
  | "TIKTOK"
  | "SNAPCHAT"
  | "X"
  | "YOUTUBE"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "GOOGLE"
  | "APPLE"
  | "INTERNAL"
  | "OTHER";

export type SovereignKnowledgeAuthority =
  | "OWNER"
  | "SOVEREIGN"
  | "VERIFIED"
  | "LEARNED"
  | "UNVERIFIED";

export interface SovereignReasoningRequest {
  id: string;
  commandId: string;
  projectId?: string;

  objective: string;

  domain: SovereignReasoningDomain;

  platforms?: SovereignReasoningPlatform[];

  requiredCapabilities?: string[];

  constraints?: string[];

  minimumConfidence?: number;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignReasoningKnowledge {
  id: string;

  title: string;

  content: string;

  domain: SovereignReasoningDomain;

  platform?: SovereignReasoningPlatform;

  authority: SovereignKnowledgeAuthority;

  confidence: number;

  version?: string;

  tags: string[];

  active: boolean;

  updatedAt: number;
}

export interface SovereignKnowledgeConflict {
  id: string;

  subject: string;

  recordIds: string[];

  description: string;

  blocking: boolean;
}

export interface SovereignKnowledgeGap {
  id: string;

  subject: string;

  reason: string;

  required: boolean;

  suggestedSource?: string;
}

export interface SovereignReasoningContext {
  id: string;

  requestId: string;

  projectId?: string;

  objective: string;

  domain: SovereignReasoningDomain;

  platforms: SovereignReasoningPlatform[];

  knowledge: SovereignReasoningKnowledge[];

  facts: string[];

  constraints: string[];

  capabilities: string[];

  conflicts: SovereignKnowledgeConflict[];

  gaps: SovereignKnowledgeGap[];

  confidence: number;

  executionAllowed: boolean;

  createdAt: number;
}

export interface SovereignReasoningResult {
  success: boolean;

  context?: SovereignReasoningContext;

  blockingReasons: string[];

  warnings: string[];

  error?: string;
}

export interface SovereignAIKnowledgeReasoningAdapter {
  searchKnowledge(
    request: SovereignReasoningRequest
  ): Promise<SovereignReasoningKnowledge[]>;

  deriveFacts(
    request: SovereignReasoningRequest,
    knowledge: SovereignReasoningKnowledge[]
  ): Promise<string[]>;

  detectConflicts?(
    request: SovereignReasoningRequest,
    knowledge: SovereignReasoningKnowledge[]
  ): Promise<SovereignKnowledgeConflict[]>;

  detectGaps?(
    request: SovereignReasoningRequest,
    knowledge: SovereignReasoningKnowledge[]
  ): Promise<SovereignKnowledgeGap[]>;

  resolveCapabilities?(
    request: SovereignReasoningRequest,
    knowledge: SovereignReasoningKnowledge[]
  ): Promise<string[]>;

  persistContext?(
    context: SovereignReasoningContext
  ): Promise<void>;

  recordEvent?(event: {
    type: string;
    requestId: string;
    commandId: string;
    projectId?: string;
    timestamp: number;
    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIKnowledgeReasoning {
  constructor(
    private readonly adapter:
      SovereignAIKnowledgeReasoningAdapter
  ) {}

  public async reason(
    raw: SovereignReasoningRequest
  ): Promise<SovereignReasoningResult> {
    try {
      const request =
        this.normalizeRequest(raw);

      this.validateRequest(request);

      await this.record(
        "SOVEREIGN_REASONING_STARTED",
        request
      );

      const minimumConfidence =
        this.normalizeConfidence(
          request.minimumConfidence ?? 0.65
        );

      const rawKnowledge =
        await this.adapter.searchKnowledge(
          request
        );

      const knowledge =
        this.prepareKnowledge(
          rawKnowledge,
          minimumConfidence
        );

      const conflicts =
        this.adapter.detectConflicts
          ? await this.adapter.detectConflicts(
              request,
              knowledge
            )
          : [];

      const gaps =
        this.adapter.detectGaps
          ? await this.adapter.detectGaps(
              request,
              knowledge
            )
          : [];

      const facts =
        await this.adapter.deriveFacts(
          request,
          knowledge
        );

      const capabilities =
        this.adapter.resolveCapabilities
          ? await this.adapter.resolveCapabilities(
              request,
              knowledge
            )
          : request.requiredCapabilities || [];

      const blockingReasons =
        this.resolveBlockingReasons(
          knowledge,
          conflicts,
          gaps
        );

      const confidence =
        this.calculateContextConfidence(
          knowledge
        );

      const context:
        SovereignReasoningContext = {
          id: this.createId(
            "reasoning-context"
          ),

          requestId:
            request.id,

          projectId:
            request.projectId,

          objective:
            request.objective,

          domain:
            request.domain,

          platforms:
            request.platforms || [],

          knowledge:
            this.cloneKnowledgeList(
              knowledge
            ),

          facts:
            this.cleanStrings(
              facts
            ),

          constraints:
            request.constraints || [],

          capabilities:
            this.cleanStrings(
              capabilities
            ),

          conflicts:
            conflicts.map(
              item => ({
                ...item,
                recordIds: [
                  ...item.recordIds
                ]
              })
            ),

          gaps:
            gaps.map(
              item => ({
                ...item
              })
            ),

          confidence,

          executionAllowed:
            blockingReasons.length === 0,

          createdAt:
            Date.now()
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
          ? "SOVEREIGN_REASONING_READY"
          : "SOVEREIGN_REASONING_BLOCKED",
        request,
        {
          contextId:
            context.id,

          knowledgeCount:
            context.knowledge.length,

          conflictCount:
            context.conflicts.length,

          gapCount:
            context.gaps.length,

          confidence:
            context.confidence,

          executionAllowed:
            context.executionAllowed
        }
      );

      return {
        success:
          context.executionAllowed,

        context:
          this.cloneContext(context),

        blockingReasons,

        warnings:
          this.createWarnings(
            conflicts,
            gaps,
            confidence,
            minimumConfidence
          )
      };
    } catch (error) {
      return {
        success: false,

        blockingReasons: [
          "Knowledge reasoning failed."
        ],

        warnings: [],

        error:
          error instanceof Error
            ? error.message
            : String(error)
      };
    }
  }

  private prepareKnowledge(
    records:
      SovereignReasoningKnowledge[],
    minimumConfidence: number
  ): SovereignReasoningKnowledge[] {
    const active =
      records.filter(
        record =>
          record.active &&
          this.normalizeConfidence(
            record.confidence
          ) >= minimumConfidence
      );

    const ranked =
      active.sort(
        (a, b) => {
          const authority =
            this.authorityWeight(
              b.authority
            ) -
            this.authorityWeight(
              a.authority
            );

          if (authority !== 0) {
            return authority;
          }

          const confidence =
            b.confidence -
            a.confidence;

          if (confidence !== 0) {
            return confidence;
          }

          return (
            b.updatedAt -
            a.updatedAt
          );
        }
      );

    const unique =
      new Map<
        string,
        SovereignReasoningKnowledge
      >();

    for (
      const record of ranked
    ) {
      const key =
        [
          record.domain,
          record.platform || "NONE",
          record.title
            .trim()
            .toLowerCase()
        ].join(":");

      if (!unique.has(key)) {
        unique.set(
          key,
          this.cloneKnowledge(
            record
          )
        );
      }
    }

    return [
      ...unique.values()
    ];
  }

  private resolveBlockingReasons(
    knowledge:
      SovereignReasoningKnowledge[],
    conflicts:
      SovereignKnowledgeConflict[],
    gaps:
      SovereignKnowledgeGap[]
  ): string[] {
    const reasons:
      string[] = [];

    if (
      knowledge.length === 0
    ) {
      reasons.push(
        "No trusted knowledge is available for this objective."
      );
    }

    for (
      const conflict of conflicts
    ) {
      if (conflict.blocking) {
        reasons.push(
          `Blocking knowledge conflict: ${conflict.subject}`
        );
      }
    }

    for (
      const gap of gaps
    ) {
      if (gap.required) {
        reasons.push(
          `Required knowledge missing: ${gap.subject}`
        );
      }
    }

    return this.cleanStrings(
      reasons
    );
  }

  private createWarnings(
    conflicts:
      SovereignKnowledgeConflict[],
    gaps:
      SovereignKnowledgeGap[],
    confidence: number,
    minimumConfidence: number
  ): string[] {
    const warnings:
      string[] = [];

    for (
      const conflict of conflicts
    ) {
      if (!conflict.blocking) {
        warnings.push(
          `Knowledge conflict: ${conflict.subject}`
        );
      }
    }

    for (
      const gap of gaps
    ) {
      if (!gap.required) {
        warnings.push(
          `Optional knowledge gap: ${gap.subject}`
        );
      }
    }

    if (
      confidence <
      minimumConfidence
    ) {
      warnings.push(
        "Overall knowledge confidence is below the requested threshold."
      );
    }

    return this.cleanStrings(
      warnings
    );
  }

  private calculateContextConfidence(
    knowledge:
      SovereignReasoningKnowledge[]
  ): number {
    if (
      knowledge.length === 0
    ) {
      return 0;
    }

    let totalWeight = 0;
    let weightedConfidence = 0;

    for (
      const record of knowledge
    ) {
      const weight =
        this.authorityWeight(
          record.authority
        );

      totalWeight += weight;

      weightedConfidence +=
        this.normalizeConfidence(
          record.confidence
        ) * weight;
    }

    if (
      totalWeight === 0
    ) {
      return 0;
    }

    return this.normalizeConfidence(
      weightedConfidence /
        totalWeight
    );
  }

  private authorityWeight(
    authority:
      SovereignKnowledgeAuthority
  ): number {
    switch (authority) {
      case "OWNER":
        return 5;

      case "SOVEREIGN":
        return 4;

      case "VERIFIED":
        return 3;

      case "LEARNED":
        return 2;

      case "UNVERIFIED":
        return 1;
    }
  }

  private normalizeRequest(
    input:
      SovereignReasoningRequest
  ): SovereignReasoningRequest {
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
          .replace(
            /\s+/g,
            " "
          ),

      platforms:
        input.platforms
          ? [
              ...new Set(
                input.platforms
              )
            ]
          : [],

      requiredCapabilities:
        input.requiredCapabilities
          ? this.cleanStrings(
              input.requiredCapabilities
            )
          : [],

      constraints:
        input.constraints
          ? this.cleanStrings(
              input.constraints
            )
          : [],

      minimumConfidence:
        this.normalizeConfidence(
          input.minimumConfidence ??
            0.65
        ),

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
      SovereignReasoningRequest
  ): void {
    if (!request.id) {
      throw new Error(
        "Reasoning request id is required."
      );
    }

    if (!request.commandId) {
      throw new Error(
        "Reasoning command id is required."
      );
    }

    if (!request.objective) {
      throw new Error(
        "Reasoning objective is required."
      );
    }
  }

  private cleanStrings(
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

  private normalizeConfidence(
    value: number
  ): number {
    if (
      !Number.isFinite(value)
    ) {
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

  private cloneKnowledge(
    record:
      SovereignReasoningKnowledge
  ): SovereignReasoningKnowledge {
    return {
      ...record,

      tags: [
        ...record.tags
      ]
    };
  }

  private cloneKnowledgeList(
    records:
      SovereignReasoningKnowledge[]
  ): SovereignReasoningKnowledge[] {
    return records.map(
      record =>
        this.cloneKnowledge(
          record
        )
    );
  }

  private cloneContext(
    context:
      SovereignReasoningContext
  ): SovereignReasoningContext {
    return {
      ...context,

      platforms: [
        ...context.platforms

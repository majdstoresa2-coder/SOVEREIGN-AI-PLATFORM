// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-KNOWLEDGE-INGESTION-216.ts
// Final Closure 11/15
// Sovereign Knowledge Ingestion & Capability Knowledge Layer
// ============================================================

export type SovereignKnowledgeDomain =
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

export type SovereignKnowledgeSource =
  | "OWNER"
  | "DOCUMENT"
  | "CODE"
  | "API_SPEC"
  | "PLATFORM_SPEC"
  | "SYSTEM"
  | "LEARNED";

export type SovereignExternalPlatform =
  | "TIKTOK"
  | "SNAPCHAT"
  | "X"
  | "YOUTUBE"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "GOOGLE"
  | "APPLE"
  | "OTHER";

export interface SovereignKnowledgeInput {
  id: string;
  domain: SovereignKnowledgeDomain;
  source: SovereignKnowledgeSource;

  title: string;
  content: string;

  platform?: SovereignExternalPlatform;

  tags?: string[];

  version?: string;

  ownerApproved?: boolean;

  metadata?: Record<string, unknown>;

  createdAt: number;
}

export interface SovereignKnowledgeRecord {
  id: string;

  domain: SovereignKnowledgeDomain;
  source: SovereignKnowledgeSource;

  title: string;
  content: string;

  platform?: SovereignExternalPlatform;

  tags: string[];

  version: string;

  confidence: number;

  active: boolean;

  checksum?: string;

  createdAt: number;
  updatedAt: number;
}

export interface SovereignPlatformKnowledge {
  platform: SovereignExternalPlatform;

  capabilities: string[];

  integrationRequirements: string[];

  publishingRequirements: string[];

  analyticsRequirements: string[];

  contentRequirements: string[];

  restrictions: string[];

  operationalNotes: string[];
}

export interface SovereignKnowledgeQuery {
  domain?: SovereignKnowledgeDomain;

  platform?: SovereignExternalPlatform;

  tags?: string[];

  text?: string;

  limit?: number;
}

export interface SovereignKnowledgeValidation {
  valid: boolean;

  errors: string[];
  warnings: string[];

  confidence: number;
}

export interface SovereignKnowledgeIngestionResult {
  success: boolean;

  record?: SovereignKnowledgeRecord;

  validation: SovereignKnowledgeValidation;

  replacedRecordId?: string;

  error?: string;
}

export interface SovereignAIKnowledgeAdapter {
  validateKnowledge(
    input: SovereignKnowledgeInput
  ): Promise<SovereignKnowledgeValidation>;

  calculateChecksum?(
    content: string
  ): Promise<string>;

  findExisting?(
    input: SovereignKnowledgeInput
  ): Promise<SovereignKnowledgeRecord | undefined>;

  saveKnowledge(
    record: SovereignKnowledgeRecord
  ): Promise<void>;

  deactivateKnowledge?(
    recordId: string
  ): Promise<void>;

  searchKnowledge(
    query: SovereignKnowledgeQuery
  ): Promise<SovereignKnowledgeRecord[]>;

  savePlatformKnowledge?(
    knowledge: SovereignPlatformKnowledge
  ): Promise<void>;

  loadPlatformKnowledge?(
    platform: SovereignExternalPlatform
  ): Promise<SovereignPlatformKnowledge | undefined>;

  recordEvent?(event: {
    type: string;
    knowledgeId?: string;
    domain?: SovereignKnowledgeDomain;
    platform?: SovereignExternalPlatform;
    timestamp: number;
    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIKnowledgeIngestion {
  constructor(
    private readonly adapter:
      SovereignAIKnowledgeAdapter
  ) {}

  public async ingest(
    raw: SovereignKnowledgeInput
  ): Promise<SovereignKnowledgeIngestionResult> {
    try {
      const input =
        this.normalizeInput(raw);

      this.validateInput(input);

      const validation =
        await this.adapter
          .validateKnowledge(input);

      if (!validation.valid) {
        return {
          success: false,
          validation,
          error:
            validation.errors.join("; ")
        };
      }

      const existing =
        this.adapter.findExisting
          ? await this.adapter
              .findExisting(input)
          : undefined;

      const checksum =
        this.adapter.calculateChecksum
          ? await this.adapter
              .calculateChecksum(
                input.content
              )
          : undefined;

      if (
        existing &&
        checksum &&
        existing.checksum === checksum
      ) {
        return {
          success: true,
          record: this.cloneRecord(
            existing
          ),
          validation
        };
      }

      const now = Date.now();

      const record:
        SovereignKnowledgeRecord = {
          id: this.createId(
            "knowledge"
          ),

          domain:
            input.domain,

          source:
            input.source,

          title:
            input.title,

          content:
            input.content,

          platform:
            input.platform,

          tags:
            input.tags || [],

          version:
            input.version ||
            "1.0.0",

          confidence:
            this.normalizeConfidence(
              validation.confidence
            ),

          active: true,

          checksum,

          createdAt:
            existing?.createdAt ||
            now,

          updatedAt: now
        };

      if (
        existing &&
        this.adapter
          .deactivateKnowledge
      ) {
        await this.adapter
          .deactivateKnowledge(
            existing.id
          );
      }

      await this.adapter
        .saveKnowledge(record);

      await this.record(
        "SOVEREIGN_KNOWLEDGE_INGESTED",
        record
      );

      return {
        success: true,

        record:
          this.cloneRecord(record),

        validation,

        replacedRecordId:
          existing?.id
      };
    } catch (error) {
      return {
        success: false,

        validation: {
          valid: false,
          errors: [
            error instanceof Error
              ? error.message
              : String(error)
          ],
          warnings: [],
          confidence: 0
        },

        error:
          error instanceof Error
            ? error.message
            : String(error)
      };
    }
  }

  public async ingestPlatformKnowledge(
    platform:
      SovereignExternalPlatform,
    knowledge:
      Omit<
        SovereignPlatformKnowledge,
        "platform"
      >
  ): Promise<SovereignPlatformKnowledge> {
    const normalized:
      SovereignPlatformKnowledge = {
        platform,

        capabilities:
          this.cleanArray(
            knowledge.capabilities
          ),

        integrationRequirements:
          this.cleanArray(
            knowledge
              .integrationRequirements
          ),

        publishingRequirements:
          this.cleanArray(
            knowledge
              .publishingRequirements
          ),

        analyticsRequirements:
          this.cleanArray(
            knowledge
              .analyticsRequirements
          ),

        contentRequirements:
          this.cleanArray(
            knowledge
              .contentRequirements
          ),

        restrictions:
          this.cleanArray(
            knowledge.restrictions
          ),

        operationalNotes:
          this.cleanArray(
            knowledge.operationalNotes
          )
      };

    if (
      this.adapter
        .savePlatformKnowledge
    ) {
      await this.adapter
        .savePlatformKnowledge(
          normalized
        );
    }

    await this.record(
      "SOVEREIGN_PLATFORM_KNOWLEDGE_UPDATED",
      undefined,
      {
        platform
      }
    );

    return this.clonePlatformKnowledge(
      normalized
    );
  }

  public async query(
    raw:
      SovereignKnowledgeQuery
  ): Promise<SovereignKnowledgeRecord[]> {
    const query:
      SovereignKnowledgeQuery = {
        ...raw,

        text:
          raw.text
            ?.trim(),

        tags:
          raw.tags
            ? this.cleanArray(
                raw.tags
              )
            : undefined,

        limit:
          this.normalizeLimit(
            raw.limit
          )
      };

    const records =
      await this.adapter
        .searchKnowledge(query);

    return records
      .filter(
        record =>
          record.active
      )
      .slice(
        0,
        query.limit
      )
      .map(
        record =>
          this.cloneRecord(
            record
          )
      );
  }

  public async getPlatformKnowledge(
    platform:
      SovereignExternalPlatform
  ): Promise<SovereignPlatformKnowledge | undefined> {
    if (
      !this.adapter
        .loadPlatformKnowledge
    ) {
      return undefined;
    }

    const knowledge =
      await this.adapter
        .loadPlatformKnowledge(
          platform
        );

    return knowledge
      ? this.clonePlatformKnowledge(
          knowledge
        )
      : undefined;
  }

  private normalizeInput(
    input:
      SovereignKnowledgeInput
  ): SovereignKnowledgeInput {
    return {
      ...input,

      id:
        input.id.trim(),

      title:
        input.title
          .trim()
          .replace(/\s+/g, " "),

      content:
        input.content.trim(),

      tags:
        input.tags
          ? this.cleanArray(
              input.tags
            )
          : [],

      version:
        input.version
          ?.trim() ||
        "1.0.0",

      metadata:
        input.metadata
          ? {
              ...input.metadata
            }
          : undefined
    };
  }

  private validateInput(
    input:
      SovereignKnowledgeInput
  ): void {
    if (!input.id) {
      throw new Error(
        "Knowledge input id is required."
      );
    }

    if (!input.title) {
      throw new Error(
        "Knowledge title is required."
      );
    }

    if (!input.content) {
      throw new Error(
        "Knowledge content is required."
      );
    }

    if (
      input.source === "OWNER" &&
      input.ownerApproved === false
    ) {
      throw new Error(
        "OWNER knowledge cannot be marked as unapproved."
      );
    }
  }

  private normalizeConfidence(
    value: number
  ): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(1, value)
    );
  }

  private normalizeLimit(
    value?: number
  ): number {
    if (
      value === undefined ||
      !Number.isFinite(value)
    ) {
      return 25;
    }

    return Math.max(
      1,
      Math.min(
        100,
        Math.floor(value)
      )
    );
  }

  private cleanArray(
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

  private cloneRecord(
    record:
      SovereignKnowledgeRecord
  ): SovereignKnowledgeRecord {
    return {
      ...record,

      tags: [
        ...record.tags
      ]
    };
  }

  private clonePlatformKnowledge(
    knowledge:
      SovereignPlatformKnowledge
  ): SovereignPlatformKnowledge {
    return {
      ...knowledge,

      capabilities: [
        ...knowledge.capabilities
      ],

      integrationRequirements: [
        ...knowledge
          .integrationRequirements
      ],

      publishingRequirements: [
        ...knowledge
          .publishingRequirements
      ],

      analyticsRequirements: [
        ...knowledge
          .analyticsRequirements
      ],

      contentRequirements: [
        ...knowledge
          .contentRequirements
      ],

      restrictions: [
        ...knowledge.restrictions
      ],

      operationalNotes: [
        ...knowledge
          .operationalNotes
      ]
    };
  }

  private async record(
    type: string,
    knowledge?:
      SovereignKnowledgeRecord,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,

          knowledgeId:
            knowledge?.id,

          domain:
            knowledge?.domain,

          platform:
            knowledge?.platform,

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

export default SovereignAIKnowledgeIngestion;

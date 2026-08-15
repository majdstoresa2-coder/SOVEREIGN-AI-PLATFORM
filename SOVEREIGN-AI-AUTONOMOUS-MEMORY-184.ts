// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-AUTONOMOUS-MEMORY-184.ts
// Sovereign Autonomous AI Memory Layer
// ============================================================

export type SovereignAIMemoryType =
  | "DECISION"
  | "PLAN"
  | "EXECUTION"
  | "FAILURE"
  | "REPAIR"
  | "TEST"
  | "BUILD"
  | "DEPLOYMENT"
  | "FEEDBACK"
  | "LEARNING"
  | "KNOWLEDGE";

export type SovereignAIMemoryImportance =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export interface SovereignAIMemoryEntry {
  id: string;

  type: SovereignAIMemoryType;

  subject: string;

  content: unknown;

  importance: SovereignAIMemoryImportance;

  tags: string[];

  source?: string;

  confidence: number;

  verified: boolean;

  createdAt: number;

  updatedAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignAIMemoryQuery {
  types?: SovereignAIMemoryType[];

  subject?: string;

  tags?: string[];

  minimumImportance?: SovereignAIMemoryImportance;

  verifiedOnly?: boolean;

  limit?: number;
}

export interface SovereignAIMemoryRecall {
  entries: SovereignAIMemoryEntry[];

  total: number;

  recalledAt: number;
}

export interface SovereignAILearningRecord {
  id: string;

  objective: string;

  successful: boolean;

  lessons: string[];

  relatedMemoryIds: string[];

  createdAt: number;
}

export interface SovereignAIMemoryAdapter {
  persist(
    entry: SovereignAIMemoryEntry
  ): Promise<void>;

  search?(
    query: SovereignAIMemoryQuery
  ): Promise<SovereignAIMemoryEntry[]>;

  persistLearning?(
    learning: SovereignAILearningRecord
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    memoryId?: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIAutonomousMemory {
  private readonly memory =
    new Map<string, SovereignAIMemoryEntry>();

  constructor(
    private readonly adapter: SovereignAIMemoryAdapter
  ) {}

  public async remember(
    input: Omit<
      SovereignAIMemoryEntry,
      "id" | "createdAt" | "updatedAt"
    >
  ): Promise<SovereignAIMemoryEntry> {
    this.validateInput(input);

    const now = Date.now();

    const entry: SovereignAIMemoryEntry = {
      ...input,

      id: this.createId(
        "ai-memory"
      ),

      tags: [
        ...new Set(
          input.tags.map(
            tag =>
              tag.trim().toLowerCase()
          )
        )
      ],

      confidence:
        this.normalizeConfidence(
          input.confidence
        ),

      createdAt: now,

      updatedAt: now
    };

    this.memory.set(
      entry.id,
      entry
    );

    await this.adapter.persist(
      entry
    );

    await this.record(
      "AI_MEMORY_CREATED",
      entry.id,
      {
        type: entry.type,
        subject: entry.subject,
        importance: entry.importance
      }
    );

    return this.clone(entry);
  }

  public async recall(
    query: SovereignAIMemoryQuery = {}
  ): Promise<SovereignAIMemoryRecall> {
    let entries =
      this.adapter.search
        ? await this.adapter.search(
            query
          )
        : [...this.memory.values()];

    entries =
      this.filter(
        entries,
        query
      );

    entries.sort(
      (a, b) => {
        const importance =
          this.importanceWeight(
            b.importance
          ) -
          this.importanceWeight(
            a.importance
          );

        if (importance !== 0) {
          return importance;
        }

        if (
          b.confidence !==
          a.confidence
        ) {
          return (
            b.confidence -
            a.confidence
          );
        }

        return (
          b.updatedAt -
          a.updatedAt
        );
      }
    );

    const limit =
      Math.max(
        1,
        query.limit || 50
      );

    entries =
      entries.slice(
        0,
        limit
      );

    return {
      entries:
        entries.map(
          entry =>
            this.clone(entry)
        ),

      total:
        entries.length,

      recalledAt:
        Date.now()
    };
  }

  public async verifyMemory(
    memoryId: string
  ): Promise<SovereignAIMemoryEntry> {
    const entry =
      this.getMutable(
        memoryId
      );

    entry.verified = true;

    entry.updatedAt =
      Date.now();

    await this.adapter.persist(
      entry
    );

    await this.record(
      "AI_MEMORY_VERIFIED",
      entry.id
    );

    return this.clone(
      entry
    );
  }

  public async updateConfidence(
    memoryId: string,
    confidence: number
  ): Promise<SovereignAIMemoryEntry> {
    const entry =
      this.getMutable(
        memoryId
      );

    entry.confidence =
      this.normalizeConfidence(
        confidence
      );

    entry.updatedAt =
      Date.now();

    await this.adapter.persist(
      entry
    );

    return this.clone(
      entry
    );
  }

  public async learn(
    objective: string,
    successful: boolean,
    lessons: string[],
    relatedMemoryIds: string[] = []
  ): Promise<SovereignAILearningRecord> {
    if (!objective.trim()) {
      throw new Error(
        "Learning objective is required."
      );
    }

    const normalizedLessons =
      [
        ...new Set(
          lessons
            .map(
              lesson =>
                lesson.trim()
            )
            .filter(Boolean)
        )
      ];

    if (
      !normalizedLessons.length
    ) {
      throw new Error(
        "At least one learning lesson is required."
      );
    }

    const learning:
      SovereignAILearningRecord = {
        id: this.createId(
          "ai-learning"
        ),

        objective,

        successful,

        lessons:
          normalizedLessons,

        relatedMemoryIds: [
          ...new Set(
            relatedMemoryIds
          )
        ],

        createdAt:
          Date.now()
      };

    if (
      this.adapter.persistLearning
    ) {
      await this.adapter
        .persistLearning(
          learning
        );
    }

    await this.remember({
      type: "LEARNING",

      subject:
        objective,

      content: {
        successful,
        lessons:
          normalizedLessons,

        relatedMemoryIds:
          learning.relatedMemoryIds
      },

      importance:
        successful
          ? "NORMAL"
          : "HIGH",

      tags: [
        "learning",
        successful
          ? "success"
          : "failure"
      ],

      confidence: 1,

      verified: true,

      source:
        "SOVEREIGN-AI-AUTONOMOUS-MEMORY-184"
    });

    await this.record(
      "AI_LEARNING_RECORDED",
      undefined,
      {
        learningId:
          learning.id,

        objective,

        successful
      }
    );

    return learning;
  }

  public get(
    memoryId: string
  ): SovereignAIMemoryEntry {
    return this.clone(
      this.getMutable(
        memoryId
      )
    );
  }

  public count(): number {
    return this.memory.size;
  }

  private filter(
    entries: SovereignAIMemoryEntry[],
    query: SovereignAIMemoryQuery
  ): SovereignAIMemoryEntry[] {
    return entries.filter(
      entry => {
        if (
          query.types?.length &&
          !query.types.includes(
            entry.type
          )
        ) {
          return false;
        }

        if (
          query.subject &&
          !entry.subject
            .toLowerCase()
            .includes(
              query.subject.toLowerCase()
            )
        ) {
          return false;
        }

        if (
          query.tags?.length &&
          !query.tags.every(
            tag =>
              entry.tags.includes(
                tag
                  .trim()
                  .toLowerCase()
              )
          )
        ) {
          return false;
        }

        if (
          query.verifiedOnly &&
          !entry.verified
        ) {
          return false;
        }

        if (
          query.minimumImportance &&
          this.importanceWeight(
            entry.importance
          ) <
            this.importanceWeight(
              query.minimumImportance
            )
        ) {
          return false;
        }

        return true;
      }
    );
  }

  private validateInput(
    input: Omit<
      SovereignAIMemoryEntry,
      "id" | "createdAt" | "updatedAt"
    >
  ): void {
    if (!input.subject.trim()) {
      throw new Error(
        "Memory subject is required."
      );
    }

    if (
      input.content ===
      undefined
    ) {
      throw new Error(
        "Memory content is required."
      );
    }

    if (
      !Number.isFinite(
        input.confidence
      )
    ) {
      throw new Error(
        "Memory confidence must be numeric."
      );
    }
  }

  private getMutable(
    memoryId: string
  ): SovereignAIMemoryEntry {
    const entry =
      this.memory.get(
        memoryId
      );

    if (!entry) {
      throw new Error(
        `AI memory not found: ${memoryId}`
      );
    }

    return entry;
  }

  private normalizeConfidence(
    confidence: number
  ): number {
    return Math.max(
      0,
      Math.min(
        1,
        confidence
      )
    );
  }

  private importanceWeight(
    importance: SovereignAIMemoryImportance
  ): number {
    switch (importance) {
      case "CRITICAL":
        return 4;

      case "HIGH":
        return 3;

      case "NORMAL":
        return 2;

      case "LOW":
      default:
        return 1;
    }
  }

  private async record(
    type: string,
    memoryId?: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,
          memoryId,
          timestamp:
            Date.now(),
          data
        });
    }
  }

  private clone(
    entry: SovereignAIMemoryEntry
  ): SovereignAIMemoryEntry {
    return {
      ...entry,

      tags: [
        ...entry.tags
      ],

      metadata:
        entry.metadata
          ? {
              ...entry.metadata
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

export default SovereignAIAutonomousMemory;

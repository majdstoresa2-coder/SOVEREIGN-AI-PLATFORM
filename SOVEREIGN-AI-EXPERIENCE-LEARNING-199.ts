// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-EXPERIENCE-LEARNING-199.ts
// Sovereign Autonomous AI Experience Learning Engine
// ============================================================

export type SovereignExperienceOutcome =
  | "SUCCESS"
  | "PARTIAL"
  | "FAILED"
  | "REPAIRED"
  | "REJECTED";

export type SovereignExperienceConfidence =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "VERIFIED";

export type SovereignLessonType =
  | "STRATEGY"
  | "FAILURE"
  | "REPAIR"
  | "OPTIMIZATION"
  | "CAPABILITY"
  | "RESOURCE"
  | "QUALITY"
  | "EXECUTION";

export interface SovereignExperienceInput {
  id: string;

  goalId: string;

  taskId: string;

  executionId: string;

  objective: string;

  strategy?: string;

  capabilities: string[];

  outcome: SovereignExperienceOutcome;

  outcomeScore: number;

  outcomeConfidence: number;

  durationMs?: number;

  attempts: number;

  errors?: string[];

  repairs?: string[];

  metadata?: Record<string, unknown>;

  createdAt: number;
}

export interface SovereignExperienceLesson {
  id: string;

  sourceExperienceId: string;

  type: SovereignLessonType;

  subject: string;

  lesson: string;

  recommendation: string;

  confidence: number;

  reusable: boolean;

  verified: boolean;

  positive: boolean;

  createdAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignExperiencePattern {
  id: string;

  key: string;

  occurrences: number;

  successes: number;

  failures: number;

  averageScore: number;

  averageDurationMs: number;

  successRate: number;

  confidence: number;

  preferredStrategy?: string;

  lastObservedAt: number;
}

export interface SovereignExperienceKnowledge {
  experience: SovereignExperienceInput;

  lessons: SovereignExperienceLesson[];

  patterns: SovereignExperiencePattern[];

  learned: boolean;

  generatedAt: number;
}

export interface SovereignExperienceLearningAdapter {
  deriveLessons(
    experience: SovereignExperienceInput
  ): Promise<
    Omit<
      SovereignExperienceLesson,
      | "id"
      | "sourceExperienceId"
      | "createdAt"
    >[]
  >;

  loadPattern?(
    key: string
  ): Promise<
    SovereignExperiencePattern | undefined
  >;

  persistExperience?(
    experience: SovereignExperienceInput
  ): Promise<void>;

  persistLesson?(
    lesson: SovereignExperienceLesson
  ): Promise<void>;

  persistPattern?(
    pattern: SovereignExperiencePattern
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    experienceId?: string;

    lessonId?: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIExperienceLearning {
  constructor(
    private readonly adapter:
      SovereignExperienceLearningAdapter
  ) {}

  public async learn(
    input: SovereignExperienceInput
  ): Promise<SovereignExperienceKnowledge> {
    const experience =
      this.normalizeExperience(
        input
      );

    this.validateExperience(
      experience
    );

    if (
      this.adapter.persistExperience
    ) {
      await this.adapter
        .persistExperience(
          this.cloneExperience(
            experience
          )
        );
    }

    const generatedLessons =
      await this.adapter
        .deriveLessons(
          this.cloneExperience(
            experience
          )
        );

    const lessons =
      generatedLessons.map(
        lesson =>
          this.createLesson(
            experience,
            lesson
          )
      );

    for (const lesson of lessons) {
      if (
        this.adapter.persistLesson
      ) {
        await this.adapter
          .persistLesson(
            this.cloneLesson(
              lesson
            )
          );
      }

      await this.record(
        "AI_EXPERIENCE_LESSON_CREATED",
        experience.id,
        lesson.id,
        {
          type:
            lesson.type,

          confidence:
            lesson.confidence,

          positive:
            lesson.positive
        }
      );
    }

    const patterns =
      await this.updatePatterns(
        experience
      );

    const knowledge:
      SovereignExperienceKnowledge = {
        experience:
          this.cloneExperience(
            experience
          ),

        lessons:
          lessons.map(
            lesson =>
              this.cloneLesson(
                lesson
              )
          ),

        patterns:
          patterns.map(
            pattern => ({
              ...pattern
            })
          ),

        learned:
          lessons.length > 0 ||
          patterns.length > 0,

        generatedAt:
          Date.now()
      };

    await this.record(
      "AI_EXPERIENCE_LEARNED",
      experience.id,
      undefined,
      {
        outcome:
          experience.outcome,

        score:
          experience.outcomeScore,

        lessons:
          lessons.length,

        patterns:
          patterns.length
      }
    );

    return knowledge;
  }

  public shouldReuse(
    pattern: SovereignExperiencePattern
  ): boolean {
    return (
      pattern.occurrences >= 3 &&
      pattern.successRate >= 0.80 &&
      pattern.confidence >= 0.70
    );
  }

  public shouldAvoid(
    pattern: SovereignExperiencePattern
  ): boolean {
    return (
      pattern.occurrences >= 3 &&
      pattern.successRate <= 0.30 &&
      pattern.confidence >= 0.70
    );
  }

  public selectBestPattern(
    patterns: SovereignExperiencePattern[]
  ): SovereignExperiencePattern | undefined {
    return [...patterns]
      .filter(
        pattern =>
          pattern.occurrences > 0
      )
      .sort(
        (a, b) => {
          const scoreA =
            a.successRate *
            a.confidence *
            Math.max(
              0.1,
              a.averageScore
            );

          const scoreB =
            b.successRate *
            b.confidence *
            Math.max(
              0.1,
              b.averageScore
            );

          return scoreB - scoreA;
        }
      )[0];
  }

  private async updatePatterns(
    experience: SovereignExperienceInput
  ): Promise<SovereignExperiencePattern[]> {
    const keys =
      this.createPatternKeys(
        experience
      );

    const patterns:
      SovereignExperiencePattern[] = [];

    for (const key of keys) {
      const existing =
        this.adapter.loadPattern
          ? await this.adapter
              .loadPattern(
                key
              )
          : undefined;

      const pattern =
        this.mergePattern(
          key,
          experience,
          existing
        );

      patterns.push(
        pattern
      );

      if (
        this.adapter.persistPattern
      ) {
        await this.adapter
          .persistPattern({
            ...pattern
          });
      }
    }

    return patterns;
  }

  private mergePattern(
    key: string,
    experience: SovereignExperienceInput,
    existing?:
      SovereignExperiencePattern
  ): SovereignExperiencePattern {
    const previousOccurrences =
      existing?.occurrences || 0;

    const occurrences =
      previousOccurrences + 1;

    const successful =
      experience.outcome ===
        "SUCCESS" ||
      experience.outcome ===
        "REPAIRED";

    const successes =
      (existing?.successes || 0) +
      (successful ? 1 : 0);

    const failed =
      experience.outcome ===
        "FAILED" ||
      experience.outcome ===
        "REJECTED";

    const failures =
      (existing?.failures || 0) +
      (failed ? 1 : 0);

    const averageScore =
      this.runningAverage(
        existing?.averageScore || 0,
        previousOccurrences,
        experience.outcomeScore
      );

    const duration =
      Math.max(
        0,
        experience.durationMs || 0
      );

    const averageDurationMs =
      this.runningAverage(
        existing?.averageDurationMs || 0,
        previousOccurrences,
        duration
      );

    const successRate =
      successes /
      Math.max(
        1,
        occurrences
      );

    const confidence =
      this.patternConfidence(
        occurrences,
        experience.outcomeConfidence
      );

    return {
      id:
        existing?.id ||
        this.createId(
          "experience-pattern"
        ),

      key,

      occurrences,

      successes,

      failures,

      averageScore,

      averageDurationMs,

      successRate:
        this.normalize(
          successRate
        ),

      confidence,

      preferredStrategy:
        successful
          ? experience.strategy ||
            existing?.preferredStrategy
          : existing?.preferredStrategy,

      lastObservedAt:
        Date.now()
    };
  }

  private createPatternKeys(
    experience: SovereignExperienceInput
  ): string[] {
    const keys =
      new Set<string>();

    keys.add(
      `objective:${this.normalizeKey(
        experience.objective
      )}`
    );

    if (experience.strategy) {
      keys.add(
        `strategy:${this.normalizeKey(
          experience.strategy
        )}`
      );
    }

    for (
      const capability of
        experience.capabilities
    ) {
      keys.add(
        `capability:${this.normalizeKey(
          capability
        )}`
      );
    }

    return [...keys];
  }

  private createLesson(
    experience: SovereignExperienceInput,
    lesson: Omit<
      SovereignExperienceLesson,
      | "id"
      | "sourceExperienceId"
      | "createdAt"
    >
  ): SovereignExperienceLesson {
    return {
      ...lesson,

      id: this.createId(
        "experience-lesson"
      ),

      sourceExperienceId:
        experience.id,

      subject:
        lesson.subject.trim(),

      lesson:
        lesson.lesson.trim(),

      recommendation:
        lesson.recommendation.trim(),

      confidence:
        this.normalize(
          lesson.confidence
        ),

      createdAt:
        Date.now()
    };
  }

  private normalizeExperience(
    input: SovereignExperienceInput
  ): SovereignExperienceInput {
    return {
      ...input,

      objective:
        input.objective.trim(),

      strategy:
        input.strategy?.trim() ||
        undefined,

      capabilities: [
        ...new Set(
          input.capabilities
            .map(
              capability =>
                capability.trim()
            )
            .filter(Boolean)
        )
      ],

      outcomeScore:
        this.normalize(
          input.outcomeScore
        ),

      outcomeConfidence:
        this.normalize(
          input.outcomeConfidence
        ),

      attempts:
        Math.max(
          0,
          Math.floor(
            input.attempts
          )
        ),

      durationMs:
        input.durationMs ===
          undefined
          ? undefined
          : Math.max(
              0,
              input.durationMs
            ),

      errors:
        input.errors
          ? [
              ...new Set(
                input.errors
                  .map(
                    value =>
                      value.trim()
                  )
                  .filter(Boolean)
              )
            ]
          : undefined,

      repairs:
        input.repairs
          ? [
              ...new Set(
                input.repairs
                  .map(
                    value =>
                      value.trim()
                  )
                  .filter(Boolean)
              )
            ]
          : undefined,

      metadata:
        input.metadata
          ? {
              ...input.metadata
            }
          : undefined
    };
  }

  private validateExperience(
    experience: SovereignExperienceInput
  ): void {
    if (!experience.id.trim()) {
      throw new Error(
        "Experience id is required."
      );
    }

    if (!experience.goalId.trim()) {
      throw new Error(
        "Experience goalId is required."
      );
    }

    if (!experience.taskId.trim()) {
      throw new Error(
        "Experience taskId is required."
      );
    }

    if (
      !experience.executionId.trim()
    ) {
      throw new Error(
        "Experience executionId is required."
      );
    }

    if (!experience.objective) {
      throw new Error(
        "Experience objective is required."
      );
    }

    if (
      !Number.isFinite(
        experience.attempts
      )
    ) {
      throw new Error(
        "Experience attempts must be numeric."
      );
    }
  }

  private runningAverage(
    previousAverage: number,
    previousCount: number,
    nextValue: number
  ): number {
    if (
      previousCount <= 0
    ) {
      return nextValue;
    }

    return (
      (
        previousAverage *
          previousCount
      ) +
      nextValue
    ) /
    (
      previousCount + 1
    );
  }

  private patternConfidence(
    occurrences: number,
    outcomeConfidence: number
  ): number {
    const evidence =
      Math.min(
        1,
        occurrences / 10
      );

    return this.normalize(
      evidence * 0.6 +
      outcomeConfidence * 0.4
    );
  }

  private normalizeKey(
    value: string
  ): string {
    return value
      .trim()
      .toLowerCase()
      .replace(
        /\s+/g,
        "-"
      )
      .slice(
        0,
        160
      );
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

  private cloneExperience(
    experience: SovereignExperienceInput
  ): SovereignExperienceInput {
    return {
      ...experience,

      capabilities: [
        ...experience.capabilities
      ],

      errors:
        experience.errors
          ? [...experience.errors]
          : undefined,

      repairs:
        experience.repairs
          ? [...experience.repairs]
          : undefined,

      metadata:
        experience.metadata
          ? {
              ...experience.metadata
            }
          : undefined
    };
  }

  private cloneLesson(
    lesson: SovereignExperienceLesson
  ): SovereignExperienceLesson {
    return {
      ...lesson,

      metadata:
        lesson.metadata
          ? {
              ...lesson.metadata
            }
          : undefined
    };
  }

  private async record(
    type: string,
    experienceId?: string,
    lessonId?: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,

          experienceId,

          lessonId,

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

export default SovereignAIExperienceLearning;

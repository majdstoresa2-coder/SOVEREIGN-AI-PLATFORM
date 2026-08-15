// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-KNOWLEDGE-RETRIEVAL-201.ts
// Sovereign Autonomous AI Knowledge Retrieval Engine
// ============================================================

export type SovereignKnowledgeAuthority =
  | "SUPREME"
  | "DELEGATED"
  | "SYSTEM"
  | "LEARNED";

export type SovereignKnowledgeState =
  | "ACTIVE"
  | "CANDIDATE"
  | "CONFLICTED"
  | "SUPERSEDED"
  | "REJECTED";

export interface SovereignKnowledgeRecord {
  id: string;

  subject: string;

  statement: unknown;

  authority: SovereignKnowledgeAuthority;

  confidence: number;

  status: SovereignKnowledgeState;

  immutable: boolean;

  version: number;

  tags: string[];

  createdAt: number;

  updatedAt: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignKnowledgeQuery {
  id: string;

  subject?: string;

  text?: string;

  tags?: string[];

  minimumConfidence?: number;

  authorities?: SovereignKnowledgeAuthority[];

  limit?: number;

  includeCandidates?: boolean;

  createdAt: number;
}

export interface SovereignKnowledgeMatch {
  knowledge: SovereignKnowledgeRecord;

  relevance: number;

  authorityScore: number;

  confidenceScore: number;

  freshnessScore: number;

  finalScore: number;

  reasons: string[];
}

export interface SovereignKnowledgeRetrievalResult {
  id: string;

  queryId: string;

  matches: SovereignKnowledgeMatch[];

  strongest?: SovereignKnowledgeMatch;

  sufficient: boolean;

  generatedAt: number;
}

export interface SovereignKnowledgeRetrievalAdapter {
  search(
    query: SovereignKnowledgeQuery
  ): Promise<SovereignKnowledgeRecord[]>;

  semanticScore?(
    query: SovereignKnowledgeQuery,
    knowledge: SovereignKnowledgeRecord
  ): Promise<number>;

  persistRetrieval?(
    result: SovereignKnowledgeRetrievalResult
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    queryId?: string;

    knowledgeId?: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIKnowledgeRetrieval {
  constructor(
    private readonly adapter:
      SovereignKnowledgeRetrievalAdapter
  ) {}

  public async retrieve(
    input: SovereignKnowledgeQuery
  ): Promise<SovereignKnowledgeRetrievalResult> {
    const query =
      this.normalizeQuery(input);

    this.validateQuery(query);

    const records =
      await this.adapter.search(
        query
      );

    const eligible =
      records.filter(
        record =>
          this.isEligible(
            record,
            query
          )
      );

    const matches:
      SovereignKnowledgeMatch[] = [];

    for (const record of eligible) {
      const match =
        await this.score(
          query,
          record
        );

      matches.push(match);
    }

    matches.sort(
      (a, b) => {
        const supremeA =
          a.knowledge.authority ===
          "SUPREME";

        const supremeB =
          b.knowledge.authority ===
          "SUPREME";

        if (
          supremeA !==
          supremeB
        ) {
          return supremeB
            ? 1
            : -1;
        }

        if (
          b.authorityScore !==
          a.authorityScore
        ) {
          return (
            b.authorityScore -
            a.authorityScore
          );
        }

        return (
          b.finalScore -
          a.finalScore
        );
      }
    );

    const limited =
      matches.slice(
        0,
        query.limit
      );

    const strongest =
      limited[0];

    const sufficient =
      !!strongest &&
      (
        strongest.knowledge.authority ===
          "SUPREME" ||
        strongest.finalScore >=
          0.60
      );

    const result:
      SovereignKnowledgeRetrievalResult = {
        id: this.createId(
          "knowledge-retrieval"
        ),

        queryId:
          query.id,

        matches:
          limited,

        strongest,

        sufficient,

        generatedAt:
          Date.now()
      };

    if (
      this.adapter.persistRetrieval
    ) {
      await this.adapter
        .persistRetrieval(
          this.cloneResult(
            result
          )
        );
    }

    await this.record(
      "AI_KNOWLEDGE_RETRIEVED",
      query.id,
      strongest?.knowledge.id,
      {
        matches:
          limited.length,

        sufficient,

        strongestAuthority:
          strongest?.knowledge
            .authority,

        strongestScore:
          strongest?.finalScore
      }
    );

    return this.cloneResult(
      result
    );
  }

  public async retrieveStrongest(
    query: SovereignKnowledgeQuery
  ): Promise<SovereignKnowledgeRecord | undefined> {
    const result =
      await this.retrieve(
        query
      );

    if (
      !result.sufficient ||
      !result.strongest
    ) {
      return undefined;
    }

    return this.cloneKnowledge(
      result.strongest.knowledge
    );
  }

  public canUseForDecision(
    match: SovereignKnowledgeMatch
  ): boolean {
    if (
      match.knowledge.status !==
      "ACTIVE"
    ) {
      return false;
    }

    if (
      match.knowledge.authority ===
      "SUPREME"
    ) {
      return true;
    }

    return (
      match.knowledge.confidence >=
        0.60 &&
      match.finalScore >=
        0.60
    );
  }

  private async score(
    query: SovereignKnowledgeQuery,
    knowledge: SovereignKnowledgeRecord
  ): Promise<SovereignKnowledgeMatch> {
    const reasons:
      string[] = [];

    let relevance =
      this.lexicalRelevance(
        query,
        knowledge
      );

    if (
      this.adapter.semanticScore
    ) {
      const semantic =
        this.normalize(
          await this.adapter
            .semanticScore(
              query,
              knowledge
            )
        );

      relevance =
        this.normalize(
          relevance * 0.4 +
          semantic * 0.6
        );

      reasons.push(
        `semantic:${semantic.toFixed(3)}`
      );
    }

    const authorityScore =
      this.authorityScore(
        knowledge.authority
      );

    const confidenceScore =
      this.normalize(
        knowledge.confidence
      );

    const freshnessScore =
      this.freshnessScore(
        knowledge
      );

    if (
      knowledge.authority ===
      "SUPREME"
    ) {
      reasons.push(
        "owner-supreme-authority"
      );
    }

    if (knowledge.immutable) {
      reasons.push(
        "immutable-sovereign-knowledge"
      );
    }

    if (
      query.subject &&
      this.normalizeText(
        query.subject
      ) ===
        this.normalizeText(
          knowledge.subject
        )
    ) {
      reasons.push(
        "exact-subject-match"
      );
    }

    const finalScore =
      this.normalize(
        relevance * 0.45 +
        authorityScore * 0.30 +
        confidenceScore * 0.20 +
        freshnessScore * 0.05
      );

    return {
      knowledge:
        this.cloneKnowledge(
          knowledge
        ),

      relevance,

      authorityScore,

      confidenceScore,

      freshnessScore,

      finalScore,

      reasons
    };
  }

  private lexicalRelevance(
    query: SovereignKnowledgeQuery,
    knowledge: SovereignKnowledgeRecord
  ): number {
    let score = 0;

    let factors = 0;

    if (query.subject) {
      factors++;

      const requested =
        this.normalizeText(
          query.subject
        );

      const subject =
        this.normalizeText(
          knowledge.subject
        );

      if (requested === subject) {
        score += 1;
      } else if (
        subject.includes(
          requested
        ) ||
        requested.includes(
          subject
        )
      ) {
        score += 0.75;
      }
    }

    if (
      query.tags &&
      query.tags.length
    ) {
      factors++;

      const knowledgeTags =
        new Set(
          knowledge.tags.map(
            tag =>
              this.normalizeText(
                tag
              )
          )
        );

      const matched =
        query.tags.filter(
          tag =>
            knowledgeTags.has(
              this.normalizeText(
                tag
              )
            )
        ).length;

      score +=
        matched /
        query.tags.length;
    }

    if (query.text) {
      factors++;

      const queryTokens =
        this.tokens(
          query.text
        );

      const knowledgeTokens =
        this.tokens(
          `${knowledge.subject} ${this.stringify(
            knowledge.statement
          )}`
        );

      const knowledgeSet =
        new Set(
          knowledgeTokens
        );

      const matched =
        queryTokens.filter(
          token =>
            knowledgeSet.has(
              token
            )
        ).length;

      score +=
        queryTokens.length
          ? matched /
            queryTokens.length
          : 0;
    }

    if (!factors) {
      return 1;
    }

    return this.normalize(
      score /
      factors
    );
  }

  private isEligible(
    knowledge: SovereignKnowledgeRecord,
    query: SovereignKnowledgeQuery
  ): boolean {
    if (
      knowledge.status ===
        "REJECTED" ||
      knowledge.status ===
        "SUPERSEDED" ||
      knowledge.status ===
        "CONFLICTED"
    ) {
      return false;
    }

    if (
      knowledge.status ===
        "CANDIDATE" &&
      !query.includeCandidates
    ) {
      return false;
    }

    if (
      knowledge.confidence <
      query.minimumConfidence
    ) {
      return false;
    }

    if (
      query.authorities &&
      query.authorities.length &&
      !query.authorities.includes(
        knowledge.authority
      )
    ) {
      return false;
    }

    return true;
  }

  private freshnessScore(
    knowledge: SovereignKnowledgeRecord
  ): number {
    if (
      knowledge.immutable ||
      knowledge.authority ===
        "SUPREME"
    ) {
      return 1;
    }

    const age =
      Math.max(
        0,
        Date.now() -
          knowledge.updatedAt
      );

    const thirtyDays =
      30 *
      24 *
      60 *
      60 *
      1000;

    return this.normalize(
      1 -
      age /
        (
          thirtyDays *
          12
        )
    );
  }

  private authorityScore(
    authority:
      SovereignKnowledgeAuthority
  ): number {
    switch (authority) {
      case "SUPREME":
        return 1;

      case "DELEGATED":
        return 0.80;

      case "SYSTEM":
        return 0.60;

      case "LEARNED":
      default:
        return 0.40;
    }
  }

  private normalizeQuery(
    query: SovereignKnowledgeQuery
  ): Required<
    Pick<
      SovereignKnowledgeQuery,
      | "id"
      | "minimumConfidence"
      | "limit"
      | "includeCandidates"
      | "createdAt"
    >
  > &
    Omit<
      SovereignKnowledgeQuery,
      | "minimumConfidence"
      | "limit"
      | "includeCandidates"
    > {
    return {
      ...query,

      subject:
        query.subject?.trim() ||
        undefined,

      text:
        query.text?.trim() ||
        undefined,

      tags:
        query.tags
          ? [
              ...new Set(
                query.tags
                  .map(
                    tag =>
                      tag.trim()
                  )
                  .filter(Boolean)
              )
            ]
          : undefined,

      minimumConfidence:
        this.normalize(
          query.minimumConfidence ??
            0.5
        ),

      limit:
        Math.max(
          1,
          Math.min(
            100,
            Math.floor(
              query.limit ?? 10
            )
          )
        ),

      includeCandidates:
        query.includeCandidates ??
        false
    };
  }

  private validateQuery(
    query: SovereignKnowledgeQuery
  ): void {
    if (!query.id.trim()) {
      throw new Error(
        "Knowledge query id is required."
      );
    }

    if (
      !query.subject &&
      !query.text &&
      !query.tags?.length
    ) {
      throw new Error(
        "Knowledge query requires subject, text, or tags."
      );
    }
  }

  private tokens(
    value: string
  ): string[] {
    return [
      ...new Set(
        this.normalizeText(
          value
        )
          .split(
            /[^a-z0-9\u0600-\u06ff_-]+/i
          )
          .filter(
            token =>
              token.length > 1
          )
      )
    ];
  }

  private normalizeText(
    value: string
  ): string {
    return value
      .trim()
      .toLowerCase()
      .replace(
        /\s+/g,
        " "
      );
  }

  private stringify(
    value: unknown
  ): string {
    try {
      return JSON.stringify(
        value
      );
    } catch {
      return String(
        value
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

  private async record(
    type: string,
    queryId?: string,
    knowledgeId?: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,

          queryId,

          knowledgeId,

          timestamp:
            Date.now(),

          data
        });
    }
  }

  private cloneKnowledge(
    knowledge: SovereignKnowledgeRecord
  ): SovereignKnowledgeRecord {
    return {
      ...knowledge,

      tags: [
        ...knowledge.tags
      ],

      metadata:
        knowledge.metadata
          ? {
              ...knowledge.metadata
            }
          : undefined
    };
  }

  private cloneResult(
    result: SovereignKnowledgeRetrievalResult
  ): SovereignKnowledgeRetrievalResult {
    return {
      ...result,

      matches:
        result.matches.map(
          match => ({
            ...match,

            knowledge:
              this.cloneKnowledge(
                match.knowledge
              ),

            reasons: [
              ...match.reasons
            ]
          })
        ),

      strongest:
        result.strongest
          ? {
              ...result.strongest,

              knowledge:
                this.cloneKnowledge(
                  result.strongest
                    .knowledge
                ),

              reasons: [
                ...result.strongest
                  .reasons
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

export default SovereignAIKnowledgeRetrieval;

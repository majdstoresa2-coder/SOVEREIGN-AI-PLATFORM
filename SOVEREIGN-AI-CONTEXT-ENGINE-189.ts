// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-CONTEXT-ENGINE-189.ts
// Sovereign Autonomous AI Context Engine
// ============================================================

export type SovereignContextSource =
  | "OWNER"
  | "STEWARD"
  | "MEMORY"
  | "SYSTEM"
  | "OBSERVABILITY"
  | "CAPABILITY"
  | "DECISION"
  | "EXECUTION"
  | "POLICY"
  | "SECURITY";

export type SovereignContextPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export interface SovereignContextItem {
  id: string;

  source: SovereignContextSource;

  subject: string;

  content: unknown;

  priority: SovereignContextPriority;

  confidence: number;

  verified: boolean;

  immutable?: boolean;

  createdAt: number;

  expiresAt?: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignContextRequest {
  id: string;

  objective: string;

  requiredSources?: SovereignContextSource[];

  subjects?: string[];

  minimumConfidence?: number;

  verifiedOnly?: boolean;

  maxItems?: number;

  createdAt: number;
}

export interface SovereignContextBundle {
  id: string;

  requestId: string;

  objective: string;

  items: SovereignContextItem[];

  missingSources: SovereignContextSource[];

  complete: boolean;

  confidence: number;

  generatedAt: number;
}

export interface SovereignContextAdapter {
  collect(
    request: SovereignContextRequest
  ): Promise<SovereignContextItem[]>;

  verify?(
    item: SovereignContextItem
  ): Promise<boolean>;

  persistBundle?(
    bundle: SovereignContextBundle
  ): Promise<void>;

  recordEvent?(event: {
    type: string;
    requestId?: string;
    timestamp: number;
    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIContextEngine {
  constructor(
    private readonly adapter: SovereignContextAdapter
  ) {}

  public async buildContext(
    request: SovereignContextRequest
  ): Promise<SovereignContextBundle> {
    this.validateRequest(request);

    const collected =
      await this.adapter.collect(
        request
      );

    const now = Date.now();

    const accepted:
      SovereignContextItem[] = [];

    for (const item of collected) {
      if (
        item.expiresAt !== undefined &&
        item.expiresAt <= now
      ) {
        continue;
      }

      item.confidence =
        this.normalize(
          item.confidence
        );

      if (
        item.confidence <
        (request.minimumConfidence ?? 0)
      ) {
        continue;
      }

      if (
        request.subjects?.length &&
        !request.subjects.some(
          subject =>
            item.subject
              .toLowerCase()
              .includes(
                subject.toLowerCase()
              )
        )
      ) {
        continue;
      }

      if (
        request.verifiedOnly &&
        !item.verified
      ) {
        continue;
      }

      if (
        this.adapter.verify &&
        !item.verified
      ) {
        const verified =
          await this.adapter.verify(
            item
          );

        if (verified) {
          item.verified = true;
        }
      }

      accepted.push(
        this.cloneItem(item)
      );
    }

    accepted.sort(
      (a, b) => {
        const priorityDifference =
          this.priorityWeight(
            b.priority
          ) -
          this.priorityWeight(
            a.priority
          );

        if (
          priorityDifference !== 0
        ) {
          return priorityDifference;
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
          b.createdAt -
          a.createdAt
        );
      }
    );

    const maxItems =
      Math.max(
        1,
        request.maxItems ?? 100
      );

    const items =
      accepted.slice(
        0,
        maxItems
      );

    const requiredSources =
      request.requiredSources ?? [];

    const missingSources =
      requiredSources.filter(
        source =>
          !items.some(
            item =>
              item.source === source
          )
      );

    const confidence =
      this.calculateConfidence(
        items
      );

    const bundle:
      SovereignContextBundle = {
        id: this.createId(
          "context-bundle"
        ),

        requestId:
          request.id,

        objective:
          request.objective,

        items,

        missingSources,

        complete:
          missingSources.length === 0,

        confidence,

        generatedAt:
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
      bundle.complete
        ? "AI_CONTEXT_READY"
        : "AI_CONTEXT_INCOMPLETE",
      request.id,
      {
        items:
          bundle.items.length,

        missingSources:
          bundle.missingSources,

        confidence:
          bundle.confidence
      }
    );

    return bundle;
  }

  public canReason(
    bundle: SovereignContextBundle
  ): boolean {
    return (
      bundle.complete &&
      bundle.items.length > 0 &&
      bundle.confidence >= 0.5
    );
  }

  public getBySource(
    bundle: SovereignContextBundle,
    source: SovereignContextSource
  ): SovereignContextItem[] {
    return bundle.items
      .filter(
        item =>
          item.source === source
      )
      .map(
        item =>
          this.cloneItem(item)
      );
  }

  public getCritical(
    bundle: SovereignContextBundle
  ): SovereignContextItem[] {
    return bundle.items
      .filter(
        item =>
          item.priority ===
          "CRITICAL"
      )
      .map(
        item =>
          this.cloneItem(item)
      );
  }

  private calculateConfidence(
    items: SovereignContextItem[]
  ): number {
    if (!items.length) {
      return 0;
    }

    let weightedTotal = 0;
    let totalWeight = 0;

    for (const item of items) {
      const weight =
        this.priorityWeight(
          item.priority
        );

      weightedTotal +=
        item.confidence *
        weight;

      totalWeight += weight;
    }

    return this.normalize(
      weightedTotal /
        Math.max(
          1,
          totalWeight
        )
    );
  }

  private validateRequest(
    request: SovereignContextRequest
  ): void {
    if (!request.id.trim()) {
      throw new Error(
        "Context request id is required."
      );
    }

    if (!request.objective.trim()) {
      throw new Error(
        "Context objective is required."
      );
    }

    if (
      request.minimumConfidence !==
        undefined &&
      !Number.isFinite(
        request.minimumConfidence
      )
    ) {
      throw new Error(
        "Context minimum confidence must be numeric."
      );
    }
  }

  private priorityWeight(
    priority: SovereignContextPriority
  ): number {
    switch (priority) {
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

  private cloneItem(
    item: SovereignContextItem
  ): SovereignContextItem {
    return {
      ...item,

      metadata:
        item.metadata
          ? {
              ...item.metadata
            }
          : undefined
    };
  }

  private async record(
    type: string,
    requestId?: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,
          requestId,
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

export default SovereignAIContextEngine;

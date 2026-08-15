// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-OBSERVABILITY-ENGINE-187.ts
// Sovereign Autonomous AI Observability Engine
// ============================================================

export type SovereignObservationLevel =
  | "INFO"
  | "WARNING"
  | "ERROR"
  | "CRITICAL";

export type SovereignComponentHealth =
  | "HEALTHY"
  | "DEGRADED"
  | "UNHEALTHY"
  | "OFFLINE"
  | "UNKNOWN";

export interface SovereignMetric {
  name: string;
  value: number;
  unit?: string;
  timestamp: number;
}

export interface SovereignObservation {
  id: string;

  component: string;

  level: SovereignObservationLevel;

  message: string;

  metrics?: SovereignMetric[];

  metadata?: Record<string, unknown>;

  timestamp: number;
}

export interface SovereignHealthReport {
  id: string;

  component: string;

  health: SovereignComponentHealth;

  score: number;

  observations: SovereignObservation[];

  checkedAt: number;
}

export interface SovereignSystemHealth {
  id: string;

  health: SovereignComponentHealth;

  score: number;

  components: SovereignHealthReport[];

  criticalComponents: string[];

  degradedComponents: string[];

  generatedAt: number;
}

export interface SovereignObservabilityAdapter {
  inspect(
    component: string
  ): Promise<{
    reachable: boolean;

    operational: boolean;

    errorRate: number;

    latencyScore: number;

    qualityScore: number;

    securityScore: number;

    observations?: Omit<
      SovereignObservation,
      "id" | "component" | "timestamp"
    >[];
  }>;

  persistObservation?(
    observation: SovereignObservation
  ): Promise<void>;

  persistHealthReport?(
    report: SovereignHealthReport
  ): Promise<void>;

  requestRepair?(
    report: SovereignHealthReport
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    component?: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAIObservabilityEngine {
  private readonly components =
    new Set<string>();

  private readonly reports =
    new Map<string, SovereignHealthReport>();

  constructor(
    private readonly adapter:
      SovereignObservabilityAdapter
  ) {}

  public registerComponent(
    component: string
  ): void {
    const normalized =
      component.trim();

    if (!normalized) {
      throw new Error(
        "Observability component name is required."
      );
    }

    this.components.add(
      normalized
    );
  }

  public registerComponents(
    components: string[]
  ): void {
    for (const component of components) {
      this.registerComponent(
        component
      );
    }
  }

  public async inspectComponent(
    component: string
  ): Promise<SovereignHealthReport> {
    if (
      !this.components.has(
        component
      )
    ) {
      throw new Error(
        `Observability component not registered: ${component}`
      );
    }

    try {
      const inspection =
        await this.adapter.inspect(
          component
        );

      const observations:
        SovereignObservation[] = [];

      for (
        const item of
          inspection.observations || []
      ) {
        const observation:
          SovereignObservation = {
            ...item,

            id: this.createId(
              "observation"
            ),

            component,

            timestamp:
              Date.now()
          };

        observations.push(
          observation
        );

        if (
          this.adapter
            .persistObservation
        ) {
          await this.adapter
            .persistObservation(
              observation
            );
        }
      }

      const score =
        this.calculateScore({
          reachable:
            inspection.reachable,

          operational:
            inspection.operational,

          errorRate:
            inspection.errorRate,

          latencyScore:
            inspection.latencyScore,

          qualityScore:
            inspection.qualityScore,

          securityScore:
            inspection.securityScore
        });

      const health =
        this.resolveHealth(
          score,
          inspection.reachable,
          inspection.operational
        );

      const report:
        SovereignHealthReport = {
          id: this.createId(
            "health-report"
          ),

          component,

          health,

          score,

          observations,

          checkedAt:
            Date.now()
        };

      this.reports.set(
        component,
        report
      );

      if (
        this.adapter
          .persistHealthReport
      ) {
        await this.adapter
          .persistHealthReport(
            report
          );
      }

      await this.handleHealth(
        report
      );

      return this.cloneReport(
        report
      );
    } catch (error) {
      const observation:
        SovereignObservation = {
          id: this.createId(
            "observation"
          ),

          component,

          level: "CRITICAL",

          message:
            error instanceof Error
              ? error.message
              : String(error),

          timestamp:
            Date.now()
        };

      const report:
        SovereignHealthReport = {
          id: this.createId(
            "health-report"
          ),

          component,

          health: "OFFLINE",

          score: 0,

          observations: [
            observation
          ],

          checkedAt:
            Date.now()
        };

      this.reports.set(
        component,
        report
      );

      if (
        this.adapter
          .persistObservation
      ) {
        await this.adapter
          .persistObservation(
            observation
          );
      }

      if (
        this.adapter
          .persistHealthReport
      ) {
        await this.adapter
          .persistHealthReport(
            report
          );
      }

      await this.handleHealth(
        report
      );

      return this.cloneReport(
        report
      );
    }
  }

  public async inspectAll():
    Promise<SovereignSystemHealth> {
    const reports:
      SovereignHealthReport[] = [];

    for (
      const component of
        this.components
    ) {
      reports.push(
        await this.inspectComponent(
          component
        )
      );
    }

    const score =
      reports.length
        ? reports.reduce(
            (total, report) =>
              total +
              report.score,
            0
          ) / reports.length
        : 0;

    const criticalComponents =
      reports
        .filter(
          report =>
            report.health ===
              "UNHEALTHY" ||
            report.health ===
              "OFFLINE"
        )
        .map(
          report =>
            report.component
        );

    const degradedComponents =
      reports
        .filter(
          report =>
            report.health ===
            "DEGRADED"
        )
        .map(
          report =>
            report.component
        );

    const health:
      SovereignComponentHealth =
      criticalComponents.length
        ? "UNHEALTHY"
        : degradedComponents.length
        ? "DEGRADED"
        : reports.length
        ? "HEALTHY"
        : "UNKNOWN";

    return {
      id: this.createId(
        "system-health"
      ),

      health,

      score,

      components:
        reports.map(
          report =>
            this.cloneReport(
              report
            )
        ),

      criticalComponents,

      degradedComponents,

      generatedAt:
        Date.now()
    };
  }

  public getLastReport(
    component: string
  ): SovereignHealthReport | undefined {
    const report =
      this.reports.get(
        component
      );

    return report
      ? this.cloneReport(
          report
        )
      : undefined;
  }

  private async handleHealth(
    report: SovereignHealthReport
  ): Promise<void> {
    if (
      report.health ===
        "UNHEALTHY" ||
      report.health ===
        "OFFLINE"
    ) {
      if (
        this.adapter
          .requestRepair
      ) {
        await this.adapter
          .requestRepair(
            report
          );
      }

      await this.record(
        "AI_COMPONENT_REPAIR_REQUESTED",
        report.component,
        {
          health:
            report.health,

          score:
            report.score
        }
      );

      return;
    }

    if (
      report.health ===
      "DEGRADED"
    ) {
      await this.record(
        "AI_COMPONENT_DEGRADED",
        report.component,
        {
          score:
            report.score
        }
      );

      return;
    }

    await this.record(
      "AI_COMPONENT_HEALTHY",
      report.component,
      {
        score:
          report.score
      }
    );
  }

  private calculateScore(input: {
    reachable: boolean;

    operational: boolean;

    errorRate: number;

    latencyScore: number;

    qualityScore: number;

    securityScore: number;
  }): number {
    if (!input.reachable) {
      return 0;
    }

    const operational =
      input.operational
        ? 1
        : 0;

    const errorScore =
      1 -
      this.normalize(
        input.errorRate
      );

    return this.normalize(
      operational * 0.25 +
      errorScore * 0.20 +
      this.normalize(
        input.latencyScore
      ) *
        0.15 +
      this.normalize(
        input.qualityScore
      ) *
        0.20 +
      this.normalize(
        input.securityScore
      ) *
        0.20
    );
  }

  private resolveHealth(
    score: number,
    reachable: boolean,
    operational: boolean
  ): SovereignComponentHealth {
    if (!reachable) {
      return "OFFLINE";
    }

    if (!operational) {
      return "UNHEALTHY";
    }

    if (score >= 0.85) {
      return "HEALTHY";
    }

    if (score >= 0.60) {
      return "DEGRADED";
    }

    return "UNHEALTHY";
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
    component?: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,

          component,

          timestamp:
            Date.now(),

          data
        });
    }
  }

  private cloneReport(
    report: SovereignHealthReport
  ): SovereignHealthReport {
    return {
      ...report,

      observations:
        report.observations.map(
          observation => ({
            ...observation,

            metrics:
              observation.metrics
                ? observation.metrics.map(
                    metric => ({
                      ...metric
                    })
                  )
                : undefined,

            metadata:
              observation.metadata
                ? {
                    ...observation.metadata
                  }
                : undefined
          })
        )
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

export default SovereignAIObservabilityEngine;

// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-CAPACITY-PLANNER-195.ts
// Sovereign Autonomous AI Capacity Planner
// ============================================================

export type SovereignCapacityResource =
  | "CPU"
  | "MEMORY"
  | "STORAGE"
  | "GPU"
  | "NETWORK"
  | "WORKER"
  | "DATABASE"
  | "QUEUE"
  | "CUSTOM";

export type SovereignCapacityRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SovereignCapacityAction =
  | "NONE"
  | "OPTIMIZE"
  | "SCALE_UP"
  | "SCALE_OUT"
  | "REBALANCE"
  | "OWNER_REQUIRED";

export interface SovereignCapacitySample {
  timestamp: number;

  capacity: number;

  used: number;

  reserved: number;

  demand: number;
}

export interface SovereignCapacityTarget {
  id: string;

  resource: SovereignCapacityResource;

  name: string;

  minimumCapacity: number;

  maximumCapacity: number;

  targetUtilization: number;

  autonomousScaling: boolean;

  protected: boolean;

  metadata?: Record<string, unknown>;
}

export interface SovereignCapacityForecast {
  targetId: string;

  currentCapacity: number;

  currentDemand: number;

  predictedDemand: number;

  recommendedCapacity: number;

  utilization: number;

  predictedUtilization: number;

  growthRate: number;

  risk: SovereignCapacityRisk;

  action: SovereignCapacityAction;

  confidence: number;

  generatedAt: number;
}

export interface SovereignCapacityPlan {
  id: string;

  forecasts: SovereignCapacityForecast[];

  criticalTargets: string[];

  highRiskTargets: string[];

  ownerRequired: string[];

  generatedAt: number;
}

export interface SovereignCapacityAdapter {
  history(
    target: SovereignCapacityTarget
  ): Promise<SovereignCapacitySample[]>;

  current(
    target: SovereignCapacityTarget
  ): Promise<SovereignCapacitySample>;

  applyCapacity?(
    target: SovereignCapacityTarget,
    recommendedCapacity: number,
    action: SovereignCapacityAction
  ): Promise<boolean>;

  persistForecast?(
    forecast: SovereignCapacityForecast
  ): Promise<void>;

  persistPlan?(
    plan: SovereignCapacityPlan
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    targetId?: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAICapacityPlanner {
  private readonly targets =
    new Map<string, SovereignCapacityTarget>();

  constructor(
    private readonly adapter:
      SovereignCapacityAdapter
  ) {}

  public register(
    target: SovereignCapacityTarget
  ): void {
    this.validateTarget(target);

    if (
      this.targets.has(
        target.id
      )
    ) {
      throw new Error(
        `Capacity target already registered: ${target.id}`
      );
    }

    this.targets.set(
      target.id,
      this.cloneTarget(target)
    );
  }

  public unregister(
    targetId: string
  ): void {
    this.targets.delete(
      targetId
    );
  }

  public async forecast(
    targetId: string
  ): Promise<SovereignCapacityForecast> {
    const target =
      this.targets.get(
        targetId
      );

    if (!target) {
      throw new Error(
        `Capacity target not found: ${targetId}`
      );
    }

    const current =
      await this.adapter.current(
        target
      );

    const history =
      await this.adapter.history(
        target
      );

    const normalizedHistory =
      [...history]
        .filter(
          sample =>
            Number.isFinite(
              sample.demand
            ) &&
            sample.demand >= 0
        )
        .sort(
          (a, b) =>
            a.timestamp -
            b.timestamp
        );

    const growthRate =
      this.calculateGrowthRate(
        normalizedHistory
      );

    const currentDemand =
      Math.max(
        0,
        current.demand
      );

    const predictedDemand =
      Math.max(
        currentDemand,
        currentDemand *
          (
            1 +
            growthRate
          )
      );

    const recommendedCapacity =
      this.recommendedCapacity(
        target,
        predictedDemand
      );

    const currentCapacity =
      Math.max(
        0,
        current.capacity
      );

    const utilization =
      currentCapacity > 0
        ? this.normalize(
            (
              current.used +
              current.reserved
            ) /
              currentCapacity
          )
        : 1;

    const predictedUtilization =
      currentCapacity > 0
        ? predictedDemand /
          currentCapacity
        : 1;

    const risk =
      this.resolveRisk(
        predictedUtilization
      );

    const action =
      this.resolveAction(
        target,
        recommendedCapacity,
        currentCapacity,
        risk
      );

    const confidence =
      this.calculateConfidence(
        normalizedHistory
      );

    const forecast:
      SovereignCapacityForecast = {
        targetId:
          target.id,

        currentCapacity,

        currentDemand,

        predictedDemand,

        recommendedCapacity,

        utilization,

        predictedUtilization,

        growthRate,

        risk,

        action,

        confidence,

        generatedAt:
          Date.now()
      };

    if (
      this.adapter.persistForecast
    ) {
      await this.adapter
        .persistForecast(
          forecast
        );
    }

    await this.record(
      "AI_CAPACITY_FORECAST_CREATED",
      target.id,
      {
        risk,

        action,

        currentCapacity,

        predictedDemand,

        recommendedCapacity,

        confidence
      }
    );

    return {
      ...forecast
    };
  }

  public async plan():
    Promise<SovereignCapacityPlan> {
    const forecasts:
      SovereignCapacityForecast[] = [];

    for (
      const target of
        this.targets.values()
    ) {
      forecasts.push(
        await this.forecast(
          target.id
        )
      );
    }

    const criticalTargets =
      forecasts
        .filter(
          forecast =>
            forecast.risk ===
            "CRITICAL"
        )
        .map(
          forecast =>
            forecast.targetId
        );

    const highRiskTargets =
      forecasts
        .filter(
          forecast =>
            forecast.risk ===
            "HIGH"
        )
        .map(
          forecast =>
            forecast.targetId
        );

    const ownerRequired =
      forecasts
        .filter(
          forecast =>
            forecast.action ===
            "OWNER_REQUIRED"
        )
        .map(
          forecast =>
            forecast.targetId
        );

    const plan:
      SovereignCapacityPlan = {
        id: this.createId(
          "capacity-plan"
        ),

        forecasts,

        criticalTargets,

        highRiskTargets,

        ownerRequired,

        generatedAt:
          Date.now()
      };

    if (
      this.adapter.persistPlan
    ) {
      await this.adapter
        .persistPlan(
          plan
        );
    }

    await this.record(
      "AI_CAPACITY_PLAN_CREATED",
      undefined,
      {
        targets:
          forecasts.length,

        critical:
          criticalTargets.length,

        highRisk:
          highRiskTargets.length,

        ownerRequired:
          ownerRequired.length
      }
    );

    return plan;
  }

  public async apply(
    forecast:
      SovereignCapacityForecast
  ): Promise<boolean> {
    const target =
      this.targets.get(
        forecast.targetId
      );

    if (!target) {
      throw new Error(
        `Capacity target not found: ${forecast.targetId}`
      );
    }

    if (
      forecast.action ===
        "NONE" ||
      forecast.action ===
        "OWNER_REQUIRED"
    ) {
      return false;
    }

    if (
      !target.autonomousScaling ||
      target.protected
    ) {
      await this.record(
        "AI_CAPACITY_CHANGE_BLOCKED",
        target.id,
        {
          reason:
            "Target does not permit autonomous capacity changes."
        }
      );

      return false;
    }

    if (
      forecast.recommendedCapacity >
      target.maximumCapacity
    ) {
      await this.record(
        "AI_CAPACITY_OWNER_REQUIRED",
        target.id,
        {
          requested:
            forecast.recommendedCapacity,

          maximum:
            target.maximumCapacity
        }
      );

      return false;
    }

    if (
      !this.adapter.applyCapacity
    ) {
      return false;
    }

    const applied =
      await this.adapter
        .applyCapacity(
          target,
          forecast.recommendedCapacity,
          forecast.action
        );

    await this.record(
      applied
        ? "AI_CAPACITY_CHANGE_APPLIED"
        : "AI_CAPACITY_CHANGE_FAILED",
      target.id,
      {
        action:
          forecast.action,

        recommendedCapacity:
          forecast.recommendedCapacity
      }
    );

    return applied;
  }

  private calculateGrowthRate(
    samples:
      SovereignCapacitySample[]
  ): number {
    if (
      samples.length < 2
    ) {
      return 0;
    }

    const first =
      samples[0].demand;

    const last =
      samples[
        samples.length - 1
      ].demand;

    if (
      first <= 0
    ) {
      return last > 0
        ? 0.25
        : 0;
    }

    return this.clamp(
      (
        last -
        first
      ) /
        first,
      -0.5,
      2
    );
  }

  private recommendedCapacity(
    target:
      SovereignCapacityTarget,
    predictedDemand: number
  ): number {
    const desired =
      predictedDemand /
      target.targetUtilization;

    return this.clamp(
      Math.ceil(
        desired
      ),
      target.minimumCapacity,
      target.maximumCapacity
    );
  }

  private resolveRisk(
    utilization: number
  ): SovereignCapacityRisk {
    if (
      utilization >= 1
    ) {
      return "CRITICAL";
    }

    if (
      utilization >= 0.85
    ) {
      return "HIGH";
    }

    if (
      utilization >= 0.70
    ) {
      return "MEDIUM";
    }

    return "LOW";
  }

  private resolveAction(
    target:
      SovereignCapacityTarget,
    recommendedCapacity: number,
    currentCapacity: number,
    risk:
      SovereignCapacityRisk
  ): SovereignCapacityAction {
    if (
      risk === "LOW" &&
      recommendedCapacity <=
        currentCapacity
    ) {
      return "NONE";
    }

    if (
      target.protected ||
      !target.autonomousScaling
    ) {
      return "OWNER_REQUIRED";
    }

    if (
      recommendedCapacity >
      target.maximumCapacity
    ) {
      return "OWNER_REQUIRED";
    }

    if (
      recommendedCapacity >
      currentCapacity
    ) {
      return "SCALE_OUT";
    }

    if (
      risk === "MEDIUM"
    ) {
      return "OPTIMIZE";
    }

    return "REBALANCE";
  }

  private calculateConfidence(
    samples:
      SovereignCapacitySample[]
  ): number {
    if (!samples.length) {
      return 0.25;
    }

    if (
      samples.length === 1
    ) {
      return 0.4;
    }

    if (
      samples.length < 5
    ) {
      return 0.6;
    }

    if (
      samples.length < 20
    ) {
      return 0.8;
    }

    return 0.95;
  }

  private validateTarget(
    target:
      SovereignCapacityTarget
  ): void {
    if (!target.id.trim()) {
      throw new Error(
        "Capacity target id is required."
      );
    }

    if (!target.name.trim()) {
      throw new Error(
        "Capacity target name is required."
      );
    }

    if (
      !Number.isFinite(
        target.minimumCapacity
      ) ||
      target.minimumCapacity <= 0
    ) {
      throw new Error(
        "Minimum capacity must be greater than zero."
      );
    }

    if (
      !Number.isFinite(
        target.maximumCapacity
      ) ||
      target.maximumCapacity <
        target.minimumCapacity
    ) {
      throw new Error(
        "Maximum capacity must be greater than or equal to minimum capacity."
      );
    }

    if (
      target.targetUtilization <= 0 ||
      target.targetUtilization >= 1
    ) {
      throw new Error(
        "Target utilization must be between 0 and 1."
      );
    }
  }

  private normalize(
    value: number
  ): number {
    return this.clamp(
      value,
      0,
      1
    );
  }

  private clamp(
    value: number,
    minimum: number,
    maximum: number
  ): number {
    if (!Number.isFinite(value)) {
      return minimum;
    }

    return Math.max(
      minimum,
      Math.min(
        maximum,
        value
      )
    );
  }

  private cloneTarget(
    target:
      SovereignCapacityTarget
  ): SovereignCapacityTarget {
    return {
      ...target,

      metadata:
        target.metadata
          ? {
              ...target.metadata
            }
          : undefined
    };
  }

  private async record(
    type: string,
    targetId?: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,

          targetId,

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

export default SovereignAICapacityPlanner;

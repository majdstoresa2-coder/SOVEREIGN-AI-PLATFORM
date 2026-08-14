/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-MONITORING-14
 * ============================================================
 *
 * Purpose:
 * Central Sovereign Monitoring & Health System.
 *
 * Responsibilities:
 * - Monitor platform components.
 * - Track system health.
 * - Record operational metrics.
 * - Detect degraded or failed components.
 * - Generate internal alerts.
 * - Maintain health history.
 *
 * Monitoring NEVER grants authority.
 * Monitoring NEVER executes repairs by itself.
 * Repair actions are delegated to Diagnostics / Core
 * through Policy and Permission boundaries.
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. HEALTH STATUS
 * ============================================================
 */

export type SovereignHealthStatus =
  | "UNKNOWN"
  | "HEALTHY"
  | "DEGRADED"
  | "FAILED"
  | "OFFLINE";

/* ============================================================
 * 2. COMPONENT TYPE
 * ============================================================
 */

export type SovereignComponentType =
  | "CORE"
  | "RUNTIME"
  | "PLANNING"
  | "EXECUTION"
  | "AGENT"
  | "CAPABILITY"
  | "MEMORY"
  | "EVENTS"
  | "JOBS"
  | "SECURITY"
  | "BUILD"
  | "DEPLOYMENT"
  | "DATABASE"
  | "NETWORK"
  | "SYSTEM"
  | "CUSTOM";

/* ============================================================
 * 3. MONITORED COMPONENT
 * ============================================================
 */

export interface SovereignMonitoredComponent {
  id: string;

  name: string;

  type: SovereignComponentType;

  status: SovereignHealthStatus;

  enabled: boolean;

  lastCheckAt?: string;

  lastHealthyAt?: string;

  consecutiveFailures: number;

  metadata?: Record<string, unknown>;

  registeredAt: string;

  updatedAt: string;
}

/* ============================================================
 * 4. HEALTH CHECK RESULT
 * ============================================================
 */

export interface SovereignHealthCheckResult {
  componentId: string;

  status: SovereignHealthStatus;

  message?: string;

  responseTimeMs?: number;

  metrics?: Record<string, number>;

  checkedAt: string;

  error?: string;
}

/* ============================================================
 * 5. HEALTH CHECKER
 * ============================================================
 */

export interface SovereignHealthChecker {
  check(
    component: SovereignMonitoredComponent
  ): Promise<SovereignHealthCheckResult>;
}

/* ============================================================
 * 6. METRIC
 * ============================================================
 */

export interface SovereignMetric {
  id: string;

  componentId: string;

  name: string;

  value: number;

  unit?: string;

  timestamp: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. ALERT
 * ============================================================
 */

export type SovereignAlertSeverity =
  | "INFO"
  | "WARNING"
  | "ERROR"
  | "CRITICAL";

export interface SovereignMonitoringAlert {
  id: string;

  componentId: string;

  severity: SovereignAlertSeverity;

  code: string;

  message: string;

  acknowledged: boolean;

  createdAt: string;

  acknowledgedAt?: string;

  acknowledgedBy?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 8. EVENT BUS
 * ============================================================
 */

export interface MonitoringEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    componentId: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 9. AUDIT
 * ============================================================
 */

export interface MonitoringAudit {
  record(
    operation: string,
    componentId: string | undefined,
    result: "SUCCESS" | "FAILED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 10. MONITORING ENGINE
 * ============================================================
 */

export class SovereignMonitoringEngine {
  public readonly id =
    "SOVEREIGN-MONITORING-14";

  public readonly version = "1.0.0";

  private components =
    new Map<string, SovereignMonitoredComponent>();

  private checkers =
    new Map<string, SovereignHealthChecker>();

  private metrics: SovereignMetric[] = [];

  private alerts =
    new Map<string, SovereignMonitoringAlert>();

  private healthHistory:
    SovereignHealthCheckResult[] = [];

  private eventBus?: MonitoringEventBus;

  private audit?: MonitoringAudit;

  private readonly maxHistory = 10000;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setEventBus(
    eventBus: MonitoringEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: MonitoringAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * REGISTER COMPONENT
   * ==========================================================
   */

  async registerComponent(
    input: {
      id: string;
      name: string;
      type: SovereignComponentType;
      metadata?: Record<string, unknown>;
    },
    checker?: SovereignHealthChecker
  ): Promise<SovereignMonitoredComponent> {
    if (!input.id.trim()) {
      throw new Error(
        "Component ID is required."
      );
    }

    if (!input.name.trim()) {
      throw new Error(
        "Component name is required."
      );
    }

    if (this.components.has(input.id)) {
      throw new Error(
        `Component already registered: ${input.id}`
      );
    }

    const now = this.now();

    const component:
      SovereignMonitoredComponent = {
      id: input.id,

      name: input.name,

      type: input.type,

      status: "UNKNOWN",

      enabled: true,

      consecutiveFailures: 0,

      metadata: input.metadata,

      registeredAt: now,

      updatedAt: now,
    };

    this.components.set(
      component.id,
      component
    );

    if (checker) {
      this.checkers.set(
        component.id,
        checker
      );
    }

    await this.publish(
      "monitoring.component.registered",
      component.id,
      {
        name: component.name,
        type: component.type,
      }
    );

    await this.recordAudit(
      "monitoring.component.register",
      component.id,
      "SUCCESS"
    );

    return component;
  }

  /* ==========================================================
   * SET CHECKER
   * ==========================================================
   */

  setChecker(
    componentId: string,
    checker: SovereignHealthChecker
  ): void {
    this.requireComponent(componentId);

    this.checkers.set(
      componentId,
      checker
    );
  }

  /* ==========================================================
   * HEALTH CHECK
   * ==========================================================
   */

  async checkComponent(
    componentId: string
  ): Promise<SovereignHealthCheckResult> {
    const component =
      this.requireComponent(componentId);

    if (!component.enabled) {
      return {
        componentId,

        status: "OFFLINE",

        message:
          "Monitoring disabled for component.",

        checkedAt:
          this.now(),
      };
    }

    const checker =
      this.checkers.get(componentId);

    if (!checker) {
      const result:
        SovereignHealthCheckResult = {
        componentId,

        status: "UNKNOWN",

        message:
          "No health checker configured.",

        checkedAt:
          this.now(),
      };

      this.applyResult(
        component,
        result
      );

      return result;
    }

    const started =
      Date.now();

    let result:
      SovereignHealthCheckResult;

    try {
      result =
        await checker.check(component);

      result = {
        ...result,

        componentId,

        responseTimeMs:
          result.responseTimeMs ??
          Date.now() - started,

        checkedAt:
          result.checkedAt ??
          this.now(),
      };
    } catch (error) {
      result = {
        componentId,

        status: "FAILED",

        message:
          "Health check failed.",

        responseTimeMs:
          Date.now() - started,

        checkedAt:
          this.now(),

        error:
          error instanceof Error
            ? error.message
            : String(error),
      };
    }

    this.applyResult(
      component,
      result
    );

    await this.recordAudit(
      "monitoring.health.check",
      component.id,
      result.status === "FAILED"
        ? "FAILED"
        : "SUCCESS",
      {
        status:
          result.status,

        responseTimeMs:
          result.responseTimeMs,
      }
    );

    return result;
  }

  /* ==========================================================
   * CHECK ALL
   * ==========================================================
   */

  async checkAll():
    Promise<SovereignHealthCheckResult[]> {
    const results:
      SovereignHealthCheckResult[] = [];

    for (
      const component of
      this.components.values()
    ) {
      if (!component.enabled) {
        continue;
      }

      results.push(
        await this.checkComponent(
          component.id
        )
      );
    }

    return results;
  }

  /* ==========================================================
   * APPLY RESULT
   * ==========================================================
   */

  private applyResult(
    component: SovereignMonitoredComponent,
    result: SovereignHealthCheckResult
  ): void {
    const previousStatus =
      component.status;

    component.status =
      result.status;

    component.lastCheckAt =
      result.checkedAt;

    component.updatedAt =
      this.now();

    if (
      result.status === "HEALTHY"
    ) {
      component.lastHealthyAt =
        result.checkedAt;

      component.consecutiveFailures = 0;
    } else if (
      result.status === "FAILED" ||
      result.status === "OFFLINE"
    ) {
      component.consecutiveFailures += 1;
    }

    this.healthHistory.push(result);

    this.trimHistory();

    if (result.metrics) {
      for (
        const [name, value] of
        Object.entries(result.metrics)
      ) {
        this.recordMetric(
          component.id,
          name,
          value
        );
      }
    }

    if (
      previousStatus !==
      result.status
    ) {
      void this.publish(
        "monitoring.health.changed",
        component.id,
        {
          previousStatus,
          status:
            result.status,
          message:
            result.message,
        }
      );
    }

    if (
      result.status === "DEGRADED"
    ) {
      void this.createAlert({
        componentId:
          component.id,

        severity:
          "WARNING",

        code:
          "COMPONENT_DEGRADED",

        message:
          result.message ??
          `${component.name} is degraded.`,
      });
    }

    if (
      result.status === "FAILED"
    ) {
      void this.createAlert({
        componentId:
          component.id,

        severity:
          component.consecutiveFailures >= 3
            ? "CRITICAL"
            : "ERROR",

        code:
          "COMPONENT_FAILED",

        message:
          result.error ??
          result.message ??
          `${component.name} failed.`,

        metadata: {
          consecutiveFailures:
            component.consecutiveFailures,
        },
      });
    }
  }

  /* ==========================================================
   * METRICS
   * ==========================================================
   */

  recordMetric(
    componentId: string,
    name: string,
    value: number,
    unit?: string,
    metadata?: Record<string, unknown>
  ): SovereignMetric {
    this.requireComponent(componentId);

    if (!Number.isFinite(value)) {
      throw new Error(
        "Metric value must be finite."
      );
    }

    const metric:
      SovereignMetric = {
      id:
        this.createId("METRIC"),

      componentId,

      name,

      value,

      unit,

      timestamp:
        this.now(),

      metadata,
    };

    this.metrics.push(metric);

    if (
      this.metrics.length >
      this.maxHistory
    ) {
      this.metrics.splice(
        0,
        this.metrics.length -
          this.maxHistory
      );
    }

    return metric;
  }

  getMetrics(
    componentId?: string,
    name?: string,
    limit = 100
  ): SovereignMetric[] {
    return this.metrics
      .filter(
        (metric) =>
          (!componentId ||
            metric.componentId ===
              componentId) &&
          (!name ||
            metric.name === name)
      )
      .slice(
        -Math.max(1, limit)
      );
  }

  /* ==========================================================
   * ALERTS
   * ==========================================================
   */

  async createAlert(
    input: {
      componentId: string;
      severity: SovereignAlertSeverity;
      code: string;
      message: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<SovereignMonitoringAlert> {
    this.requireComponent(
      input.componentId
    );

    const alert:
      SovereignMonitoringAlert = {
      id:
        this.createId("ALERT"),

      componentId:
        input.componentId,

      severity:
        input.severity,

      code:
        input.code,

      message:
        input.message,

      acknowledged:
        false,

      createdAt:
        this.now(),

      metadata:
        input.metadata,
    };

    this.alerts.set(
      alert.id,
      alert
    );

    await this.publish(
      "monitoring.alert.created",
      alert.componentId,
      {
        alertId:
          alert.id,

        severity:
          alert.severity,

        code:
          alert.code,

        message:
          alert.message,
      }
    );

    return alert;
  }

  async acknowledgeAlert(
    alertId: string,
    actorId: string
  ): Promise<SovereignMonitoringAlert> {
    const alert =
      this.alerts.get(alertId);

    if (!alert) {
      throw new Error(
        `Alert not found: ${alertId}`
      );
    }

    alert.acknowledged =
      true;

    alert.acknowledgedAt =
      this.now();

    alert.acknowledgedBy =
      actorId;

    await this.publish(
      "monitoring.alert.acknowledged",
      alert.componentId,
      {
        alertId:
          alert.id,

        actorId,
      }
    );

    return alert;
  }

  listAlerts(
    activeOnly = false
  ): SovereignMonitoringAlert[] {
    const alerts =
      Array.from(
        this.alerts.values()
      );

    if (!activeOnly) {
      return alerts;
    }

    return alerts.filter(
      (alert) =>
        !alert.acknowledged
    );
  }

  /* ==========================================================
   * ENABLE / DISABLE
   * ==========================================================
   */

  async enableComponent(
    componentId: string
  ): Promise<SovereignMonitoredComponent> {
    const component =
      this.requireComponent(
        componentId
      );

    component.enabled =
      true;

    component.updatedAt =
      this.now();

    await this.publish(
      "monitoring.component.enabled",
      component.id,
      {}
    );

    return component;
  }

  async disableComponent(
    componentId: string
  ): Promise<SovereignMonitoredComponent> {
    const component =
      this.requireComponent(
        componentId
      );

    component.enabled =
      false;

    component.status =
      "OFFLINE";

    component.updatedAt =
      this.now();

    await this.publish(
      "monitoring.component.disabled",
      component.id,
      {}
    );

    return component;
  }

  /* ==========================================================
   * GET / LIST
   * ==========================================================
   */

  getComponent(
    componentId: string
  ):
    | SovereignMonitoredComponent
    | undefined {
    return this.components.get(
      componentId
    );
  }

  listComponents():
    SovereignMonitoredComponent[] {
    return Array.from(
      this.components.values()
    );
  }

  getHealthHistory(
    componentId?: string,
    limit = 100
  ): SovereignHealthCheckResult[] {
    return this.healthHistory
      .filter(
        (result) =>
          !componentId ||
          result.componentId ===
            componentId
      )
      .slice(
        -Math.max(1, limit)
      );
  }

  /* ==========================================================
   * PLATFORM HEALTH
   * ==========================================================
   */

  platformHealth():
    SovereignHealthStatus {
    const active =
      this.listComponents().filter(
        (component) =>
          component.enabled
      );

    if (active.length === 0) {
      return "UNKNOWN";
    }

    if (
      active.some(
        (component) =>
          component.status ===
          "FAILED"
      )
    ) {
      return "FAILED";
    }

    if (
      active.some(
        (component) =>
          component.status ===
            "DEGRADED" ||
          component.status ===
            "OFFLINE"
      )
    ) {
      return "DEGRADED";
    }

    if (
      active.every(
        (component) =>
          component.status ===
          "HEALTHY"
      )
    ) {
      return "HEALTHY";
    }

    return "UNKNOWN";
  }

  /* ==========================================================
   * STATISTICS
   * ==========================================================
   */

  statistics(): {
    components: number;
    healthy: number;
    degraded: number;
    failed: number;
    offline: number;
    unknown: number;
    activeAlerts: number;
    metrics: number;
  } {
    const components =
      this.listComponents();

    return {
      components:
        components.length,

      healthy:
        components.filter(
          (component) =>
            component.status ===
            "HEALTHY"
        ).length,

      degraded:
        components.filter(
          (component) =>
            component.status ===
            "DEGRADED"
        ).length,

      failed:
        components.filter(
          (component) =>
            component.status ===
            "FAILED"
        ).length,

      offline:
        components.filter(
          (component) =>
            component.status ===
            "OFFLINE"
        ).length,

      unknown:
        components.filter(
          (component) =>
            component.status ===
            "UNKNOWN"
        ).length,

      activeAlerts:
        this.listAlerts(true)
          .length,

      metrics:
        this.metrics.length,
    };
  }

  /* ==========================================================
   * REQUIRE COMPONENT
   * ==========================================================
   */

  private requireComponent(
    componentId: string
  ): SovereignMonitoredComponent {
    const component =
      this.components.get(
        componentId
      );

    if (!component) {
      throw new Error(
        `Monitored component not found: ${componentId}`
      );
    }

    return component;
  }

  /* ==========================================================
   * HISTORY
   * ==========================================================
   */

  private trimHistory(): void {
    if (
      this.healthHistory.length >
      this.maxHistory
    ) {
      this.healthHistory.splice(
        0,
        this.healthHistory.length -
          this.maxHistory
      );
    }
  }

  /* =================================

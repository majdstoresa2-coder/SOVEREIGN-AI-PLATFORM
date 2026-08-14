/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-CAPABILITY-REGISTRY-10
 * ============================================================
 *
 * Purpose:
 * Sovereign Capability Registry & Control Layer.
 *
 * Responsibility:
 * Register, validate, authorize, monitor and control
 * all capabilities available to the Sovereign AI Platform.
 *
 * Flow:
 *
 * CORE
 *   ↓
 * POLICY / PERMISSIONS
 *   ↓
 * CAPABILITY REGISTRY
 *   ↓
 * CAPABILITY
 *   ↓
 * RUNTIME
 *
 * Capabilities NEVER grant themselves authority.
 * Capabilities NEVER bypass Policy or Permissions.
 * Capabilities NEVER execute outside Runtime boundaries.
 *
 * Game Factory, Browser, Coding, Build, Deployment,
 * Automation and future systems are registered here
 * as Sovereign Capabilities.
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. CAPABILITY TYPES
 * ============================================================
 */

export type CapabilityStatus =
  | "REGISTERED"
  | "INITIALIZING"
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "DEGRADED"
  | "FAILED"
  | "DISABLED"
  | "STOPPED";

export type CapabilityHealth =
  | "UNKNOWN"
  | "HEALTHY"
  | "DEGRADED"
  | "FAILED";

export type CapabilityRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type CapabilityType =
  | "BROWSER"
  | "WEB"
  | "CODING"
  | "FILES"
  | "SOFTWARE"
  | "GAME"
  | "TESTING"
  | "SECURITY"
  | "BUILD"
  | "DEPLOYMENT"
  | "AUTOMATION"
  | "DATA"
  | "MAIL"
  | "BILLING"
  | "MONITORING"
  | "DIAGNOSTICS"
  | "CUSTOM";

/* ============================================================
 * 2. CAPABILITY INPUT / OUTPUT
 * ============================================================
 */

export interface CapabilitySchema {
  type: string;

  required?: string[];

  properties?: Record<
    string,
    Record<string, unknown>
  >;

  additionalProperties?: boolean;
}

/* ============================================================
 * 3. CAPABILITY REGISTRATION
 * ============================================================
 */

export interface CapabilityRegistration {
  id: string;

  name: string;

  description: string;

  type: CapabilityType;

  version: string;

  requiredPermissions: string[];

  allowedAgents: string[];

  restrictions: string[];

  riskLevel: CapabilityRiskLevel;

  inputSchema: CapabilitySchema;

  outputSchema: CapabilitySchema;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 4. MANAGED CAPABILITY
 * ============================================================
 */

export interface SovereignManagedCapability
  extends CapabilityRegistration {
  status: CapabilityStatus;

  health: CapabilityHealth;

  enabled: boolean;

  activeExecutions: number;

  totalExecutions: number;

  successfulExecutions: number;

  failedExecutions: number;

  registeredAt: string;

  updatedAt: string;

  lastHealthCheckAt?: string;

  lastExecutionAt?: string;

  error?: CapabilityError;
}

/* ============================================================
 * 5. CAPABILITY ERROR
 * ============================================================
 */

export interface CapabilityError {
  code: string;

  message: string;

  component: string;

  severity:
    | "INFO"
    | "WARNING"
    | "ERROR"
    | "CRITICAL";

  retryable: boolean;

  occurredAt: string;

  details?: Record<string, unknown>;
}

/* ============================================================
 * 6. CAPABILITY EXECUTION REQUEST
 * ============================================================
 */

export interface CapabilityExecutionRequest {
  id: string;

  capabilityId: string;

  requestedBy: string;

  agentId?: string;

  jobId?: string;

  input: Record<string, unknown>;

  permissions: string[];

  riskLevel: CapabilityRiskLevel;

  policyChecked: boolean;

  permissionChecked: boolean;

  metadata?: Record<string, unknown>;

  requestedAt: string;
}

/* ============================================================
 * 7. CAPABILITY AUTHORIZATION RESULT
 * ============================================================
 */

export interface CapabilityAuthorizationResult {
  allowed: boolean;

  capabilityId: string;

  reason: string;

  restrictions: string[];

  evaluatedAt: string;
}

/* ============================================================
 * 8. CAPABILITY EXECUTION RESULT
 * ============================================================
 */

export interface CapabilityExecutionResult {
  success: boolean;

  capabilityId: string;

  requestId: string;

  output?: Record<string, unknown>;

  error?: CapabilityError;

  startedAt: string;

  completedAt: string;

  durationMs: number;
}

/* ============================================================
 * 9. POLICY VALIDATOR CONTRACT
 * ============================================================
 */

export interface CapabilityPolicyValidator {
  validate(
    capability: SovereignManagedCapability,
    request: CapabilityExecutionRequest
  ): {
    allowed: boolean;

    reason?: string;

    restrictions?: string[];
  };
}

/* ============================================================
 * 10. RUNTIME DISPATCH CONTRACT
 * ============================================================
 */

export interface CapabilityRuntimeDispatcher {
  dispatch(
    capability: SovereignManagedCapability,
    request: CapabilityExecutionRequest
  ): Promise<{
    success: boolean;

    output?: Record<string, unknown>;

    error?: CapabilityError;
  }>;
}

/* ============================================================
 * 11. EVENT CONTRACT
 * ============================================================
 */

export interface CapabilityEvent {
  id: string;

  type: string;

  source: string;

  capabilityId: string;

  timestamp: string;

  requestId?: string;

  jobId?: string;

  agentId?: string;

  payload: Record<string, unknown>;
}

export interface CapabilityEventBus {
  publish(
    event: CapabilityEvent
  ): Promise<void>;
}

/* ============================================================
 * 12. AUDIT CONTRACT
 * ============================================================
 */

export interface CapabilityAudit {
  record(
    operation: string,
    capabilityId: string,
    result:
      | "SUCCESS"
      | "FAILED"
      | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 13. CAPABILITY REGISTRY
 * ============================================================
 */

export class SovereignCapabilityRegistry {
  public readonly id =
    "SOVEREIGN-CAPABILITY-REGISTRY-10";

  public readonly version =
    "1.0.0";

  private capabilities =
    new Map<
      string,
      SovereignManagedCapability
    >();

  private policyValidator?:
    CapabilityPolicyValidator;

  private runtimeDispatcher?:
    CapabilityRuntimeDispatcher;

  private eventBus?:
    CapabilityEventBus;

  private audit?:
    CapabilityAudit;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setPolicyValidator(
    validator: CapabilityPolicyValidator
  ): void {
    this.policyValidator = validator;
  }

  setRuntimeDispatcher(
    dispatcher: CapabilityRuntimeDispatcher
  ): void {
    this.runtimeDispatcher = dispatcher;
  }

  setEventBus(
    eventBus: CapabilityEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: CapabilityAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * REGISTER CAPABILITY
   * ==========================================================
   */

  async register(
    registration: CapabilityRegistration
  ): Promise<SovereignManagedCapability> {
    if (
      this.capabilities.has(
        registration.id
      )
    ) {
      throw new Error(
        `Capability already exists: ${registration.id}`
      );
    }

    this.validateRegistration(
      registration
    );

    const now = this.now();

    const capability:
      SovereignManagedCapability = {
      ...registration,

      status: "REGISTERED",

      health: "UNKNOWN",

      enabled: true,

      activeExecutions: 0,

      totalExecutions: 0,

      successfulExecutions: 0,

      failedExecutions: 0,

      registeredAt: now,

      updatedAt: now,
    };

    this.capabilities.set(
      capability.id,
      capability
    );

    await this.publishEvent(
      "capability.registered",
      capability,
      {
        version: capability.version,
        type: capability.type,
      }
    );

    await this.recordAudit(
      "capability.register",
      capability.id,
      "SUCCESS"
    );

    return capability;
  }

  /* ==========================================================
   * INITIALIZE
   * ==========================================================
   */

  async initialize(
    capabilityId: string
  ): Promise<SovereignManagedCapability> {
    const capability =
      this.requireCapability(
        capabilityId
      );

    if (!capability.enabled) {
      throw new Error(
        `Capability ${capabilityId} is disabled.`
      );
    }

    capability.status =
      "INITIALIZING";

    capability.updatedAt =
      this.now();

    await this.publishEvent(
      "capability.initializing",
      capability
    );

    capability.status =
      "READY";

    capability.health =
      "HEALTHY";

    capability.updatedAt =
      this.now();

    capability.lastHealthCheckAt =
      this.now();

    await this.publishEvent(
      "capability.ready",
      capability
    );

    return capability;
  }

  /* ==========================================================
   * AUTHORIZE
   * ==========================================================
   */

  authorize(
    request: CapabilityExecutionRequest
  ): CapabilityAuthorizationResult {
    const capability =
      this.requireCapability(
        request.capabilityId
      );

    if (!capability.enabled) {
      return this.authorizationDenied(
        capability,
        "Capability is disabled."
      );
    }

    if (
      capability.status !== "READY" &&
      capability.status !== "RUNNING"
    ) {
      return this.authorizationDenied(
        capability,
        `Capability status is ${capability.status}.`
      );
    }

    if (
      capability.health === "FAILED"
    ) {
      return this.authorizationDenied(
        capability,
        "Capability failed health validation."
      );
    }

    if (!request.policyChecked) {
      return this.authorizationDenied(
        capability,
        "Policy validation is required."
      );
    }

    if (!request.permissionChecked) {
      return this.authorizationDenied(
        capability,
        "Permission validation is required."
      );
    }

    const missingPermissions =
      capability.requiredPermissions.filter(
        (permission) =>
          !request.permissions.includes(
            permission
          )
      );

    if (
      missingPermissions.length > 0
    ) {
      return this.authorizationDenied(
        capability,
        `Missing permissions: ${missingPermissions.join(
          ", "
        )}.`
      );
    }

    if (
      request.agentId &&
      capability.allowedAgents.length > 0 &&
      !capability.allowedAgents.includes("*") &&
      !capability.allowedAgents.includes(
        request.agentId
      )
    ) {
      return this.authorizationDenied(
        capability,
        `Agent ${request.agentId} is not authorized for this capability.`
      );
    }

    if (
      this.riskRank(
        request.riskLevel
      ) >
      this.riskRank(
        capability.riskLevel
      )
    ) {
      return this.authorizationDenied(
        capability,
        "Requested risk level exceeds capability boundary."
      );
    }

    if (this.policyValidator) {
      const policy =
        this.policyValidator.validate(
          capability,
          request
        );

      if (!policy.allowed) {
        return this.authorizationDenied(
          capability,
          policy.reason ??
            "Capability execution denied by policy.",
          policy.restrictions ?? []
        );
      }

      return {
        allowed: true,

        capabilityId:
          capability.id,

        reason:
          "Capability authorized by policy and permissions.",

        restrictions:
          policy.restrictions ?? [],

        evaluatedAt:
          this.now(),
      };
    }

    return {
      allowed: true,

      capabilityId:
        capability.id,

      reason:
        "Capability authorization passed.",

      restrictions:
        [...capability.restrictions],

      evaluatedAt:
        this.now(),
    };
  }

  /* ==========================================================
   * EXECUTE
   * ==========================================================
   */

  async execute(
    request: CapabilityExecutionRequest
  ): Promise<CapabilityExecutionResult> {
    const capability =
      this.requireCapability(
        request.capabilityId
      );

    const authorization =
      this.authorize(request);

    if (!authorization.allowed) {
      await this.recordAudit(
        "capability.execute",
        capability.id,
        "DENIED",
        {
          requestId: request.id,
          reason:
            authorization.reason,
        }
      );

      await this.publishEvent(
        "capability.execution.denied",
        capability,
        {
          requestId:
            request.id,

          reason:
            authorization.reason,
        },
        request
      );

      const now = this.now();

      return {
        success: false,

        capabilityId:
          capability.id,

        requestId:
          request.id,

        error: {
          code:
            "CAPABILITY_EXECUTION_DENIED",

          message:
            authorization.reason,

          component:
            this.id,

          severity:
            "WARNING",

          retryable:
            false,

          occurredAt:
            now,
        },

        startedAt: now,

        completedAt: now,

        durationMs: 0,
      };
    }

    if (!this.runtimeDispatcher) {
      throw new Error(
        "Capability Runtime dispatcher is not configured."
      );
    }

    const startedAt =
      this.now();

    const started =
      Date.now();

    capability.status =
      "RUNNING";

    capability.activeExecutions += 1;

    capability.totalExecutions += 1;

    capability.lastExecutionAt =
      startedAt;

    capability.updatedAt =
      startedAt;

    await this.publishEvent(
      "capability.execution.started",
      capability,
      {
        requestId:
          request.id,
      },
      request
    );

    try {
      const result =
        await this.runtimeDispatcher.dispatch(
          capability,
          request
        );

      const completedAt =
        this.now();

      const durationMs =
        Date.now() - started;

      if (result.success) {
        capability.successfulExecutions += 1;

        capability.health =
          "HEALTHY";

        capability.error =
          undefined;

        await this.recordAudit(
          "capability.execute",
          capability.id,
          "SUCCESS",
          {
            requestId:
              request.id,

            durationMs,
          }
        );

        await this.publishEvent(
          "capability.execution.completed",
          capability,
          {
            requestId:
              request.id,

            durationMs,
          },
          request
        );

        return {
          success: true,

          capabilityId:
            capability.id,

          requestId:
            request.id,

          output:
            result.output,

          startedAt,

          completedAt,

          durationMs,
        };
      }

      const error =
        result.error ??
        this.createError(
          "CAPABILITY_EXECUTION_FAILED",
          "Capability execution failed.",
          true
        );

      capability.failedExecutions += 1;

      capability.error =
        error;

      capability.health =
        error.severity === "CRITICAL"
          ? "FAILED"
          : "DEGRADED";

      await this.recordAudit(
        "capability.execute",
        capability.id,
        "FAILED",
        {
          requestId:
            request.id,

          error:
            error.code,
        }
      );

      await this.publishEvent(
        "capability.execution.failed",
        capability,
        {
          requestId:
            request.id,

          error,
        },
        request
      );

      return {
        success: false,

        capabilityId:
          capability.id,

        requestId:
          request.id,

        error,

        startedAt,

        completedAt,

        durationMs,
      };
    } catch (error) {
      const normalized =
        this.createError(
          "CAPABILITY_RUNTIME_ERROR",
          error instanceof Error
            ? error.message
            : String(error),
          true
        );

      capability.failedExecutions += 1;

      capability.error =
        normalized;

      capability.health =
        "DEGRADED";

      const completedAt =
        this.now();

      return {
        success: false,

        capabilityId:
          capability.id,

        requestId:
          request.id,

        error:
          normalized,

        startedAt,

        completedAt,

        durationMs:
          Date.now() - started,
      };
    } finally {
      capability.activeExecutions =
        Math.max(
          0,
          capability.activeExecutions - 1
        );

      if (
        capability.enabled &&
        capability.health !== "FAILED"
      ) {
        capability.status =
          "READY";
      }

      capability.updatedAt =
        this.now();
    }
  }

  /* ==========================================================
   * ENABLE / DISABLE
   * ==========================================================
   */

  async enable(
    capabilityId: string
  ): Promise<SovereignManagedCapability> {
    const capability =
      this.requireCapability(
        capabilityId
      );

    capability.enabled =
      true;

    capability.status =
      "READY";

    capability.updatedAt =
      this.now();

    await this.publishEvent(
      "capability.enabled",
      capability
    );

    return capability;
  }

  async disable(
    capabilityId: string
  ): Promise<SovereignManagedCapability> {
    const capability =
      this.requireCapability(
        capabilityId
      );

    if (
      capability.activeExecutions > 0
    ) {
      throw new Error(
        `Capability ${capabilityId} has active executions.`
      );
    }

    capability.enabled =
      false;

    capability.status =
      "DISABLED";

    capability.updatedAt =
      this.now();

    await this.publishEvent(
      "capability.disabled",
      capability
    );

    return capability;
  }

  /* ==========================================================
   * PAUSE / RESUME
   * ==========================================================
   */

  async pause(
    capabilityId: string
  ): Promise<SovereignManagedCapability> {
    const capability =
      this.requireCapability(
        capabilityId
      );

    capability.status =
      "PAUSED";

    capability.updatedAt =
      this.now();

    await this.publishEvent(
      "capability.paused",
      capability
    );

    return capability;
  }

  async resume(
    capabilityId: string
  ): Promise<SovereignManagedCapability> {
    const capability =
      this.requireCapability(
        capabilityId
      );

    if (!capability.enabled) {
      throw new Error(

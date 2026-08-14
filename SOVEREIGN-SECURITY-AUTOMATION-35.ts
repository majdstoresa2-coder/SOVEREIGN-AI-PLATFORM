/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-SECURITY-AUTOMATION-35
 * ============================================================
 *
 * Central Sovereign Security Automation Engine.
 *
 * Responsibilities:
 * - Automate approved security operations.
 * - Execute security playbooks.
 * - React to risk, threat and incident events.
 * - Coordinate containment and defensive actions.
 * - Enforce approval requirements.
 * - Prevent unauthorized automation.
 * - Preserve execution history.
 * - Support rollback and recovery.
 *
 * SECURITY AUTOMATION IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. AUTOMATION TRIGGER
 * ============================================================
 */

export type SovereignSecurityAutomationTrigger =
  | "SECURITY_EVENT"
  | "RISK_HIGH"
  | "RISK_CRITICAL"
  | "THREAT_DETECTED"
  | "THREAT_CONFIRMED"
  | "INCIDENT_CREATED"
  | "INCIDENT_ESCALATED"
  | "POLICY_VIOLATION"
  | "INTEGRITY_FAILURE"
  | "MANUAL";

/* ============================================================
 * 2. ACTION TYPE
 * ============================================================
 */

export type SovereignSecurityAutomationActionType =
  | "MONITOR"
  | "CHALLENGE"
  | "BLOCK"
  | "ISOLATE"
  | "RESTRICT"
  | "REVOKE_SESSION"
  | "REVOKE_CERTIFICATE"
  | "ROTATE_CREDENTIAL"
  | "ROTATE_KEY"
  | "DISABLE_IDENTITY"
  | "DISABLE_AGENT"
  | "DISABLE_SERVICE"
  | "QUARANTINE_NODE"
  | "CREATE_INCIDENT"
  | "ESCALATE"
  | "NOTIFY"
  | "RESTORE"
  | "VERIFY";

/* ============================================================
 * 3. TARGET TYPE
 * ============================================================
 */

export type SovereignSecurityAutomationTargetType =
  | "IDENTITY"
  | "SESSION"
  | "DEVICE"
  | "CERTIFICATE"
  | "KEY"
  | "AGENT"
  | "SERVICE"
  | "NODE"
  | "NETWORK"
  | "RESOURCE"
  | "SYSTEM";

/* ============================================================
 * 4. EXECUTION STATUS
 * ============================================================
 */

export type SovereignSecurityAutomationStatus =
  | "PENDING"
  | "APPROVAL_REQUIRED"
  | "APPROVED"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "DENIED"
  | "ROLLED_BACK"
  | "CANCELLED";

/* ============================================================
 * 5. TARGET
 * ============================================================
 */

export interface SovereignSecurityAutomationTarget {
  id: string;

  type: SovereignSecurityAutomationTargetType;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. PLAYBOOK ACTION
 * ============================================================
 */

export interface SovereignSecurityPlaybookAction {
  id: string;

  type: SovereignSecurityAutomationActionType;

  targetType: SovereignSecurityAutomationTargetType;

  order: number;

  enabled: boolean;

  approvalRequired: boolean;

  rollbackSupported: boolean;

  timeoutSeconds?: number;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. PLAYBOOK
 * ============================================================
 */

export interface SovereignSecurityPlaybook {
  id: string;

  name: string;

  description: string;

  enabled: boolean;

  triggers: SovereignSecurityAutomationTrigger[];

  minimumRiskScore?: number;

  actions: SovereignSecurityPlaybookAction[];

  createdAt: string;

  updatedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 8. EXECUTION ACTION
 * ============================================================
 */

export interface SovereignSecurityAutomationExecutionAction {
  id: string;

  playbookActionId: string;

  type: SovereignSecurityAutomationActionType;

  target: SovereignSecurityAutomationTarget;

  status: SovereignSecurityAutomationStatus;

  startedAt?: string;

  completedAt?: string;

  reason?: string;

  rollbackToken?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 9. EXECUTION
 * ============================================================
 */

export interface SovereignSecurityAutomationExecution {
  id: string;

  playbookId: string;

  trigger: SovereignSecurityAutomationTrigger;

  status: SovereignSecurityAutomationStatus;

  actorId: string;

  incidentId?: string;

  threatId?: string;

  riskScore?: number;

  actions: SovereignSecurityAutomationExecutionAction[];

  createdAt: string;

  startedAt?: string;

  completedAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 10. EXECUTION REQUEST
 * ============================================================
 */

export interface SovereignSecurityAutomationRequest {
  playbookId: string;

  trigger: SovereignSecurityAutomationTrigger;

  targets: SovereignSecurityAutomationTarget[];

  incidentId?: string;

  threatId?: string;

  riskScore?: number;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 11. CONTEXT
 * ============================================================
 */

export interface SovereignSecurityAutomationContext {
  actorId: string;

  authority:
    | "OWNER"
    | "STEWARD"
    | "CORE"
    | "SYSTEM";

  authenticated: boolean;

  policyChecked: boolean;

  securityChecked: boolean;

  authorizationChecked: boolean;

  permissions: string[];

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 12. POLICY BRIDGE
 * ============================================================
 */

export interface SovereignSecurityAutomationPolicyBridge {
  authorize(input: {
    actorId: string;

    authority: SovereignSecurityAutomationContext["authority"];

    action: SovereignSecurityAutomationActionType;

    target: SovereignSecurityAutomationTarget;

    trigger: SovereignSecurityAutomationTrigger;

    riskScore?: number;
  }): Promise<{
    allowed: boolean;

    approvalRequired?: boolean;

    reason?: string;
  }>;
}

/* ============================================================
 * 13. ACTION EXECUTOR
 * ============================================================
 */

export interface SovereignSecurityAutomationExecutor {
  execute(input: {
    executionId: string;

    actionId: string;

    action: SovereignSecurityAutomationActionType;

    target: SovereignSecurityAutomationTarget;

    metadata?: Record<string, unknown>;
  }): Promise<{
    success: boolean;

    reason?: string;

    rollbackToken?: string;

    metadata?: Record<string, unknown>;
  }>;

  rollback?(input: {
    executionId: string;

    actionId: string;

    action: SovereignSecurityAutomationActionType;

    target: SovereignSecurityAutomationTarget;

    rollbackToken?: string;
  }): Promise<{
    success: boolean;

    reason?: string;
  }>;
}

/* ============================================================
 * 14. STORE
 * ============================================================
 */

export interface SovereignSecurityAutomationStore {
  getPlaybook(
    id: string
  ): Promise<SovereignSecurityPlaybook | undefined>;

  savePlaybook(
    playbook: SovereignSecurityPlaybook
  ): Promise<void>;

  saveExecution(
    execution: SovereignSecurityAutomationExecution
  ): Promise<void>;

  getExecution(
    id: string
  ): Promise<SovereignSecurityAutomationExecution | undefined>;

  listExecutions(
    limit?: number
  ): Promise<SovereignSecurityAutomationExecution[]>;
}

/* ============================================================
 * 15. EVENT BUS
 * ============================================================
 */

export interface SovereignSecurityAutomationEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    executionId?: string;

    actorId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 16. AUDIT
 * ============================================================
 */

export interface SovereignSecurityAutomationAudit {
  record(
    operation: string,
    subjectId: string | undefined,
    result: "SUCCESS" | "FAILED" | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

/* ============================================================
 * 17. ENGINE
 * ============================================================
 */

export class SovereignSecurityAutomationEngine {
  public readonly id =
    "SOVEREIGN-SECURITY-AUTOMATION-35";

  public readonly version = "1.0.0";

  private store?: SovereignSecurityAutomationStore;

  private policyBridge?: SovereignSecurityAutomationPolicyBridge;

  private executor?: SovereignSecurityAutomationExecutor;

  private eventBus?: SovereignSecurityAutomationEventBus;

  private audit?: SovereignSecurityAutomationAudit;

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setStore(store: SovereignSecurityAutomationStore): void {
    this.store = store;
  }

  setPolicyBridge(
    bridge: SovereignSecurityAutomationPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setExecutor(
    executor: SovereignSecurityAutomationExecutor
  ): void {
    this.executor = executor;
  }

  setEventBus(
    eventBus: SovereignSecurityAutomationEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignSecurityAutomationAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * REGISTER PLAYBOOK
   * ==========================================================
   */

  async registerPlaybook(
    playbook: SovereignSecurityPlaybook,
    context: SovereignSecurityAutomationContext
  ): Promise<void> {
    this.requireContext(context);

    if (!playbook.id.trim()) {
      throw new Error("Security playbook ID is required.");
    }

    if (!playbook.name.trim()) {
      throw new Error("Security playbook name is required.");
    }

    if (playbook.actions.length === 0) {
      throw new Error(
        "Security playbook requires at least one action."
      );
    }

    const orders = new Set<number>();

    for (const action of playbook.actions) {
      if (orders.has(action.order)) {
        throw new Error(
          `Duplicate playbook action order: ${action.order}`
        );
      }

      orders.add(action.order);
    }

    await this.requireStore().savePlaybook({
      ...playbook,
      updatedAt: this.now(),
    });

    await this.publish(
      "security.automation.playbook.registered",
      undefined,
      context.actorId,
      {
        playbookId: playbook.id,
      }
    );

    await this.recordAudit(
      "security.automation.playbook.register",
      playbook.id,
      "SUCCESS",
      {
        actorId: context.actorId,
      }
    );
  }

  /* ==========================================================
   * CREATE EXECUTION
   * ==========================================================
   */

  async createExecution(
    request: SovereignSecurityAutomationRequest,
    context: SovereignSecurityAutomationContext
  ): Promise<SovereignSecurityAutomationExecution> {
    this.requireContext(context);

    const playbook =
      await this.requirePlaybook(request.playbookId);

    if (!playbook.enabled) {
      throw new Error("Security playbook is disabled.");
    }

    if (!playbook.triggers.includes(request.trigger)) {
      throw new Error(
        `Playbook does not support trigger: ${request.trigger}`
      );
    }

    if (
      playbook.minimumRiskScore !== undefined &&
      (request.riskScore ?? 0) < playbook.minimumRiskScore
    ) {
      throw new Error(
        "Risk score does not meet playbook threshold."
      );
    }

    const actions: SovereignSecurityAutomationExecutionAction[] =
      [];

    const orderedActions = [...playbook.actions]
      .filter((action) => action.enabled)
      .sort((a, b) => a.order - b.order);

    for (const action of orderedActions) {
      const matchingTargets = request.targets.filter(
        (target) => target.type === action.targetType
      );

      for (const target of matchingTargets) {
        actions.push({
          id: this.createId("SECURITY-ACTION"),
          playbookActionId: action.id,
          type: action.type,
          target,
          status: action.approvalRequired
            ? "APPROVAL_REQUIRED"
            : "PENDING",
        });
      }
    }

    if (actions.length === 0) {
      throw new Error(
        "Security automation produced no executable actions."
      );
    }

    const execution: SovereignSecurityAutomationExecution = {
      id: this.createId("SECURITY-AUTOMATION"),

      playbookId: playbook.id,

      trigger: request.trigger,

      status: actions.some(
        (action) => action.status === "APPROVAL_REQUIRED"
      )
        ? "APPROVAL_REQUIRED"
        : "PENDING",

      actorId: context.actorId,

      incidentId: request.incidentId,

      threatId: request.threatId,

      riskScore: request.riskScore,

      actions,

      createdAt: this.now(),

      metadata: request.metadata,
    };

    await this.requireStore().saveExecution(execution);

    await this.publish(
      "security.automation.created",
      execution.id,
      context.actorId,
      {
        playbookId: execution.playbookId,
        trigger: execution.trigger,
        actions: execution.actions.length,
      }
    );

    return execution;
  }

  /* ==========================================================
   * APPROVE ACTION
   * ==========================================================
   */

  async approveAction(
    executionId: string,
    actionId: string,
    context: SovereignSecurityAutomationContext
  ): Promise<SovereignSecurityAutomationExecutionAction> {
    this.requireContext(context);

    const execution =
      await this.requireExecution(executionId);

    const action =
      this.requireExecutionAction(execution, actionId);

    if (action.status !== "APPROVAL_REQUIRED") {
      throw new Error(
        "Security action is not awaiting approval."
      );
    }

    const policy =
      await this.requirePolicyBridge().authorize({
        actorId: context.actorId,
        authority: context.authority,
        action: action.type,
        target: action.target,
        trigger: execution.trigger,
        riskScore: execution.riskScore,
      });

    if (!policy.allowed) {
      action.status = "DENIED";
      action.reason =
        policy.reason ?? "Security automation approval denied.";

      await this.requireStore().saveExecution(execution);

      await this.recordAudit(
        "security.automation.approve",
        execution.id,
        "DENIED",
        {
          actorId: context.actorId,
          actionId,
          reason: action.reason,
        }
      );

      return action;
    }

    action.status = "APPROVED";

    await this.requireStore().saveExecution(execution);

    return action;
  }

  /* ==========================================================
   * RUN EXECUTION
   * ==========================================================
   */

  async run(
    executionId: string,
    context: SovereignSecurityAutomationContext
  ): Promise<SovereignSecurityAutomationExecution> {
    this.requireContext(context);

    const execution =
      await this.requireExecution(executionId);

    if (
      execution.status === "SUCCESS" ||
      execution.status === "CANCELLED" ||
      execution.status === "ROLLED_BACK"
    ) {
      throw new Error(
        `Execution cannot run from status: ${execution.status}`
      );
    }

    execution.status = "RUNNING";
    execution.startedAt = this.now();

    await this.requireStore().saveExecution(execution);

    for (const action of execution.actions) {
      if (
        action.status !== "PENDING" &&
        action.status !== "APPROVED"
      ) {
        continue;
      }

      const policy =
        await this.requirePolicyBridge().authorize({
          actorId: context.actorId,
          authority: context.authority,
          action: action.type,
          target: action.target,
          trigger: execution.trigger,
          riskScore: execution.riskScore,
        });

      if (!policy.allowed) {
        action.status = "DENIED";
        action.reason =
          policy.reason ?? "Security automation denied.";

        continue;
      }

      if (
        policy.approvalRequired &&
        action.status !== "APPROVED"
      ) {
        action.status = "APPROVAL_REQUIRED";
        continue;
      }

      action.status = "RUNNING";
      action.startedAt = this.now();

      try {
        const result =
          await this.requireExecutor().execute({
            executionId: execution.id,
            actionId: action.id,
            action: action.type,
            target: action.target,
            metadata: action.metadata,
          });

        action.status = result.success
          ? "SUCCESS"
          : "FAILED";

        action.reason = result.reason;

        action.rollbackToken = result.rollbackToken;

        action.metadata = {
          ...action.metadata,
          ...result.metadata,
        };

        action.completedAt = this.now();
      } catch (error) {
        action.status = "FAILED";

        action.reason =
          error instanceof Error
            ? error.message
            : "Unknown security automation execution error.";

        action.completedAt = this.now();
      }

      await this.requireStore().saveExecution(execution);
    }

    const failed =
      execution.actions.some(
        (action) =>
          action.status === "FAILED" ||
          action.status === "DENIED"
      );

    const awaitingApproval =
      execution.actions.some(
        (action) =>
          action.status === "APPROVAL_REQUIRED"
      );

    if (awaitingApproval) {
      execution.status = "APPROVAL_REQUIRED";
    } else {
      execution.status = failed
        ? "FAILED"
        : "SUCCESS";

      execution.completedAt = this.now();
    }

    await this.requireStore().saveExecution(execution);

    await this.publish(
      execution.status === "SUCCESS"
        ? "security.automation.success"
        : "security.automation.completed",
      execution.id,
      context.actorId,
      {
        status: execution.status,
        playbookId: execution.playbookId,
      }
    );

    await this.recordAudit(
      "security.automation.run",
      execution.id,
      execution.status === "SUCCESS"
        ? "SUCCESS"
        : execution.status === "FAILED"
        ? "FAILED"
        : "DENIED",
      {
        actorId: context.actorId,
        status: execution.status,
      }
    );

    return execution;
  }

  /* ==========================================================
   * ROLLBACK
   * ==========================================================
   */

  async rollback(
    executionId: string,
    context: SovereignSecurityAutomationContext
  ): Promise<SovereignSecurityAutomationExecution> {
    this.requireContext(context);

    const execution =
      await this.requireExecution(executionId);

    if (!this.executor?.rollback) {
      throw new Error(
        "Security automation rollback executor is not configured."
      );
    }

    const successfulActions =
      [...execution.actions]
        .filter((action) => action.status === "SUCCESS")
        .reverse();

    for (const action of successfulActions) {
      const result =
        await this.executor.rollback({
          executionId: execution.id,
  

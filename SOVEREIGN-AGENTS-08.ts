/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-AGENTS-08
 * ============================================================
 *
 * Purpose:
 * Sovereign Agent Management Layer.
 *
 * Responsibility:
 * Register, validate, control, monitor and coordinate
 * specialized agents under the Sovereign Authority,
 * Policy and Capability boundaries.
 *
 * Authority hierarchy:
 *
 * OWNER
 *   ↓
 * STEWARD
 *   ↓
 * CORE
 *   ↓
 * AGENT
 *   ↓
 * CAPABILITY
 *
 * Agents NEVER become the Owner.
 * Agents NEVER receive authority automatically.
 * Agents can only operate within explicitly granted
 * permissions and capabilities.
 *
 * This layer does NOT execute operating-system commands.
 * Execution remains the responsibility of Runtime/Execution.
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. TYPES
 * ============================================================
 */

export type AgentStatus =
  | "REGISTERED"
  | "INITIALIZING"
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "DEGRADED"
  | "BLOCKED"
  | "FAILED"
  | "STOPPED";

export type AgentHealth =
  | "UNKNOWN"
  | "HEALTHY"
  | "DEGRADED"
  | "FAILED";

export type AgentRole =
  | "STEWARD"
  | "PLANNER"
  | "EXECUTOR"
  | "MONITOR"
  | "SECURITY"
  | "DIAGNOSTICS"
  | "BUILDER"
  | "GAME"
  | "CUSTOM";

/* ============================================================
 * 2. AGENT AUTHORITY
 * ============================================================
 */

export interface AgentAuthority {
  ownerId: string;

  stewardId?: string;

  delegated: boolean;

  delegationScope: string[];

  maxAutonomyLevel:
    | "NONE"
    | "LIMITED"
    | "OPERATIONAL"
    | "HIGH";

  requiresOwnerApproval: boolean;

  requiresStewardApproval: boolean;
}

/* ============================================================
 * 3. AGENT REGISTRATION
 * ============================================================
 */

export interface AgentRegistration {
  id: string;

  name: string;

  description: string;

  type: string;

  role: AgentRole;

  version: string;

  authority: AgentAuthority;

  capabilities: string[];

  permissions: string[];

  restrictions: string[];

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 4. AGENT RECORD
 * ============================================================
 */

export interface SovereignManagedAgent
  extends AgentRegistration {
  status: AgentStatus;

  health: AgentHealth;

  activeJobs: string[];

  completedJobs: number;

  failedJobs: number;

  lastHeartbeat?: string;

  registeredAt: string;

  updatedAt: string;

  error?: AgentError;
}

/* ============================================================
 * 5. AGENT ERROR
 * ============================================================
 */

export interface AgentError {
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
 * 6. AGENT REQUEST
 * ============================================================
 */

export interface AgentTaskRequest {
  agentId: string;

  jobId?: string;

  capabilityId?: string;

  input: Record<string, unknown>;

  requestedBy: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. AGENT TASK RESULT
 * ============================================================
 */

export interface AgentTaskResult {
  accepted: boolean;

  agentId: string;

  jobId?: string;

  capabilityId?: string;

  output?: Record<string, unknown>;

  error?: AgentError;
}

/* ============================================================
 * 8. AGENT POLICY VALIDATOR
 * ============================================================
 */

export interface AgentPolicyValidator {
  validate(
    agent: SovereignManagedAgent,
    request: AgentTaskRequest
  ): {
    allowed: boolean;

    reason?: string;

    restrictions?: string[];
  };
}

/* ============================================================
 * 9. AGENT REGISTRY
 * ============================================================
 */

export class SovereignAgentRegistry {
  private agents =
    new Map<string, SovereignManagedAgent>();

  private policyValidator?:
    AgentPolicyValidator;

  public readonly id =
    "SOVEREIGN-AGENTS-08";

  public readonly version =
    "1.0.0";

  /* ==========================================================
   * POLICY
   * ==========================================================
   */

  setPolicyValidator(
    validator: AgentPolicyValidator
  ): void {
    this.policyValidator = validator;
  }

  /* ==========================================================
   * REGISTER AGENT
   * ==========================================================
   */

  register(
    registration: AgentRegistration
  ): SovereignManagedAgent {
    if (
      this.agents.has(
        registration.id
      )
    ) {
      throw new Error(
        `Agent already exists: ${registration.id}`
      );
    }

    this.validateRegistration(
      registration
    );

    const now =
      this.now();

    const agent: SovereignManagedAgent = {
      ...registration,

      status:
        "REGISTERED",

      health:
        "UNKNOWN",

      activeJobs: [],

      completedJobs: 0,

      failedJobs: 0,

      registeredAt: now,

      updatedAt: now,
    };

    this.agents.set(
      agent.id,
      agent
    );

    return agent;
  }

  /* ==========================================================
   * UPDATE AGENT
   * ==========================================================
   */

  update(
    agentId: string,
    changes: Partial<
      AgentRegistration
    >
  ): SovereignManagedAgent {
    const agent =
      this.requireAgent(
        agentId
      );

    const updated: SovereignManagedAgent = {
      ...agent,

      ...changes,

      id: agent.id,

      updatedAt:
        this.now(),
    };

    this.validateRegistration(
      updated
    );

    this.agents.set(
      agentId,
      updated
    );

    return updated;
  }

  /* ==========================================================
   * START AGENT
   * ==========================================================
   */

  start(
    agentId: string
  ): SovereignManagedAgent {
    const agent =
      this.requireAgent(
        agentId
      );

    if (
      agent.status ===
      "BLOCKED"
    ) {
      throw new Error(
        `Agent ${agentId} is blocked.`
      );
    }

    if (
      agent.health ===
      "FAILED"
    ) {
      throw new Error(
        `Agent ${agentId} is unhealthy.`
      );
    }

    agent.status =
      "READY";

    agent.updatedAt =
      this.now();

    return agent;
  }

  /* ==========================================================
   * PAUSE AGENT
   * ==========================================================
   */

  pause(
    agentId: string
  ): SovereignManagedAgent {
    const agent =
      this.requireAgent(
        agentId
      );

    agent.status =
      "PAUSED";

    agent.updatedAt =
      this.now();

    return agent;
  }

  /* ==========================================================
   * STOP AGENT
   * ==========================================================
   */

  stop(
    agentId: string
  ): SovereignManagedAgent {
    const agent =
      this.requireAgent(
        agentId
      );

    agent.status =
      "STOPPED";

    agent.updatedAt =
      this.now();

    return agent;
  }

  /* ==========================================================
   * BLOCK AGENT
   * ==========================================================
   */

  block(
    agentId: string,
    reason: string
  ): SovereignManagedAgent {
    const agent =
      this.requireAgent(
        agentId
      );

    agent.status =
      "BLOCKED";

    agent.error = {
      code:
        "AGENT_BLOCKED",

      message:
        reason,

      component:
        this.id,

      severity:
        "CRITICAL",

      retryable:
        false,

      occurredAt:
        this.now(),
    };

    agent.updatedAt =
      this.now();

    return agent;
  }

  /* ==========================================================
   * HEALTH
   * ==========================================================
   */

  heartbeat(
    agentId: string,
    health: AgentHealth
  ): SovereignManagedAgent {
    const agent =
      this.requireAgent(
        agentId
      );

    agent.health =
      health;

    agent.lastHeartbeat =
      this.now();

    agent.updatedAt =
      this.now();

    if (
      health ===
      "FAILED"
    ) {
      agent.status =
        "DEGRADED";
    }

    return agent;
  }

  /* ==========================================================
   * AUTHORIZE TASK
   * ==========================================================
   */

  authorizeTask(
    request: AgentTaskRequest
  ): {
    allowed: boolean;

    reason?: string;
  } {
    const agent =
      this.requireAgent(
        request.agentId
      );

    if (
      agent.status !==
        "READY" &&
      agent.status !==
        "RUNNING"
    ) {
      return {
        allowed:
          false,

        reason:
          `Agent ${agent.id} is not ready.`,
      };
    }

    if (
      agent.health ===
      "FAILED"
    ) {
      return {
        allowed:
          false,

        reason:
          `Agent ${agent.id} failed health validation.`,
      };
    }

    if (
      request.capabilityId &&
      !agent.capabilities.includes(
        request.capabilityId
      )
    ) {
      return {
        allowed:
          false,

        reason:
          `Agent ${agent.id} does not have capability ${request.capabilityId}.`,
      };
    }

    if (
      this.policyValidator
    ) {
      const result =
        this.policyValidator.validate(
          agent,
          request
        );

      if (
        !result.allowed
      ) {
        return {
          allowed:
            false,

          reason:
            result.reason ??
            "Task rejected by policy.",
        };
      }
    }

    return {
      allowed:
        true,
    };
  }

  /* ==========================================================
   * ASSIGN JOB
   * ==========================================================
   */

  assignJob(
    agentId: string,
    jobId: string
  ): SovereignManagedAgent {
    const agent =
      this.requireAgent(
        agentId
      );

    if (
      !agent.activeJobs.includes(
        jobId
      )
    ) {
      agent.activeJobs.push(
        jobId
      );
    }

    agent.status =
      "RUNNING";

    agent.updatedAt =
      this.now();

    return agent;
  }

  /* ==========================================================
   * COMPLETE JOB
   * ==========================================================
   */

  completeJob(
    agentId: string,
    jobId: string,
    success = true
  ): SovereignManagedAgent {
    const agent =
      this.requireAgent(
        agentId
      );

    agent.activeJobs =
      agent.activeJobs.filter(
        (id) =>
          id !== jobId
      );

    if (success) {
      agent.completedJobs += 1;
    } else {
      agent.failedJobs += 1;
    }

    agent.status =
      agent.activeJobs.length > 0
        ? "RUNNING"
        : "READY";

    agent.updatedAt =
      this.now();

    return agent;
  }

  /* ==========================================================
   * GET AGENT
   * ==========================================================
   */

  get(
    agentId: string
  ):
    | SovereignManagedAgent
    | undefined {
    return this.agents.get(
      agentId
    );
  }

  /* ==========================================================
   * LIST AGENTS
   * ==========================================================
   */

  list(): SovereignManagedAgent[] {
    return Array.from(
      this.agents.values()
    );
  }

  /* ==========================================================
   * FIND BY ROLE
   * ==========================================================
   */

  findByRole(
    role: AgentRole
  ): SovereignManagedAgent[] {
    return this.list().filter(
      (agent) =>
        agent.role === role
    );
  }

  /* ==========================================================
   * FIND BY CAPABILITY
   * ==========================================================
   */

  findByCapability(
    capabilityId: string
  ): SovereignManagedAgent[] {
    return this.list().filter(
      (agent) =>
        agent.capabilities.includes(
          capabilityId
        )
    );
  }

  /* ==========================================================
   * VALIDATION
   * ==========================================================
   */

  private validateRegistration(
    registration: AgentRegistration
  ): void {
    if (
      !registration.id
    ) {
      throw new Error(
        "Agent ID is required."
      );
    }

    if (
      !registration.name
    ) {
      throw new Error(
        "Agent name is required."
      );
    }

    if (
      !registration.version
    ) {
      throw new Error(
        "Agent version is required."
      );
    }

    if (
      registration.authority
        .delegated === false &&
      registration.authority
        .maxAutonomyLevel !==
        "NONE"
    ) {
      throw new Error(
        "Non-delegated agents cannot have autonomous authority."
      );
    }

    if (
      registration.authority
        .delegationScope
        .length === 0 &&
      registration.authority
        .maxAutonomyLevel !==
        "NONE"
    ) {
      throw new Error(
        "Autonomous authority requires an explicit delegation scope."
      );
    }
  }

  /* ==========================================================
   * INTERNAL HELPERS
   * ==========================================================
   */

  private requireAgent(
    agentId: string
  ): SovereignManagedAgent {
    const agent =
      this.agents.get(
        agentId
      );

    if (!agent) {
      throw new Error(
        `Agent not found: ${agentId}`
      );
    }

    return agent;
  }

  private now(): string {
    return new Date()
      .toISOString();
  }
}

/* ============================================================
 * 10. FACTORY
 * ============================================================
 */

export function
createSovereignAgentRegistry():
  SovereignAgentRegistry {
  return new SovereignAgentRegistry();
}

/* ============================================================
 * 11. ARCHITECTURAL BOUNDARY
 * ============================================================
 *
 * AGENTS-08:
 *
 * DOES:
 * - Register agents.
 * - Define agent roles.
 * - Define delegated authority.
 * - Track capabilities.
 * - Track permissions.
 * - Validate agent health.
 * - Assign jobs.
 * - Track completed/failed work.
 * - Pause, stop and block agents.
 * - Enforce policy validation.
 *
 * DOES NOT:
 * - Replace OWNER authority.
 * - Become OWNER.
 * - Grant itself permissions.
 * - Bypass Policy.
 * - Directly execute OS commands.
 * - Directly deploy software.
 *
 * OWNER remains the SUPREME authority.
 * STEWARD remains delegated executive authority.
 * AGENTS remain subordinate operational actors.
 * ============================================================
 */

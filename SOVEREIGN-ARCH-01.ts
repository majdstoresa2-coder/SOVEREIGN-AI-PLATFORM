/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-ARCH-01
 * ============================================================
 *
 * Purpose:
 * The foundational architectural contract for the Sovereign
 * AI Platform.
 *
 * This file defines the boundaries between:
 * Owner → Steward → Core → Runtime → Planning → Execution
 * → Agents → Capabilities → Memory → Monitoring → Diagnostics
 * → Security → Build → Deployment.
 *
 * This is NOT a Game Factory.
 * Game Factory will later exist as a Capability.
 *
 * This file contains architecture contracts only.
 * It does not grant autonomous authority.
 * All execution remains subject to policy and permissions.
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. PLATFORM IDENTITY
 * ============================================================
 */

export const SOVEREIGN_PLATFORM = {
  id: "SOVEREIGN-AI-PLATFORM",
  architecture: "SOVEREIGN-ARCH-01",
  version: "1.0.0",
  status: "FOUNDATION",
} as const;

/* ============================================================
 * 2. SYSTEM ACTORS
 * ============================================================
 */

export enum ActorType {
  OWNER = "OWNER",
  STEWARD = "STEWARD",
  CORE = "CORE",
  AGENT = "AGENT",
  CAPABILITY = "CAPABILITY",
  RUNTIME = "RUNTIME",
  SYSTEM = "SYSTEM",
}

/**
 * OWNER
 *
 * The highest authority in the platform.
 * The Owner defines the sovereign authority boundary.
 *
 * STEWARD
 *
 * The delegated executive authority.
 * The Steward may operate the platform autonomously,
 * but never exceeds the authority granted by the Owner.
 */
export interface SovereignAuthority {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

/* ============================================================
 * 3. PLATFORM LAYERS
 * ============================================================
 */

export enum SovereignLayer {
  AUTHORITY = "AUTHORITY",
  CORE = "CORE",
  RUNTIME = "RUNTIME",
  PLANNING = "PLANNING",
  EXECUTION = "EXECUTION",
  AGENTS = "AGENTS",
  POLICY = "POLICY",
  CAPABILITIES = "CAPABILITIES",
  MEMORY = "MEMORY",
  EVENTS = "EVENTS",
  JOBS = "JOBS",
  MONITORING = "MONITORING",
  DIAGNOSTICS = "DIAGNOSTICS",
  SECURITY = "SECURITY",
  BUILD = "BUILD",
  DEPLOYMENT = "DEPLOYMENT",
}

/* ============================================================
 * 4. SYSTEM STATUS
 * ============================================================
 */

export type SystemStatus =
  | "INITIALIZING"
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "DEGRADED"
  | "FAILED"
  | "STOPPED"
  | "RECOVERING";

/* ============================================================
 * 5. REQUEST
 * ============================================================
 */

export interface SovereignRequest {
  id: string;

  actorId: string;
  actorType: ActorType;

  type: string;
  description: string;

  input: Record<string, unknown>;

  createdAt: string;

  priority?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 6. PLAN
 * ============================================================
 */

export interface SovereignPlanStep {
  id: string;

  order: number;

  name: string;
  description: string;

  capability?: string;
  agent?: string;

  input: Record<string, unknown>;

  expectedOutput?: Record<string, unknown>;

  requiresApproval: boolean;

  policyChecked: boolean;

  status: SystemStatus;
}

export interface SovereignPlan {
  id: string;

  requestId: string;

  createdAt: string;

  steps: SovereignPlanStep[];

  status:
    | "DRAFT"
    | "POLICY_CHECK"
    | "APPROVED"
    | "REJECTED"
    | "EXECUTING"
    | "COMPLETED"
    | "FAILED";
}

/* ============================================================
 * 7. JOB
 * ============================================================
 */

export interface SovereignJob {
  id: string;

  type: string;

  status: SystemStatus;

  createdAt: string;
  startedAt?: string;
  completedAt?: string;

  attempts: number;

  input: Record<string, unknown>;

  output?: Record<string, unknown>;

  error?: SovereignError;

  logs: string[];

  parentJobId?: string;

  agentId?: string;

  capabilityId?: string;
}

/* ============================================================
 * 8. ERROR
 * ============================================================
 */

export interface SovereignError {
  code: string;

  message: string;

  component: string;

  layer: SovereignLayer;

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
 * 9. AGENT
 * ============================================================
 */

export interface SovereignAgent {
  id: string;

  name: string;

  type: string;

  status: SystemStatus;

  capabilities: string[];

  permissions: string[];

  activeJobs: string[];

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 10. CAPABILITY
 * ============================================================
 */

export interface SovereignCapability {
  id: string;

  name: string;

  type: string;

  version: string;

  status: SystemStatus;

  requiredPermissions: string[];

  inputSchema: Record<string, unknown>;

  outputSchema: Record<string, unknown>;

  restrictions: string[];

  health: "UNKNOWN" | "HEALTHY" | "DEGRADED" | "FAILED";
}

/* ============================================================
 * 11. POLICY
 * ============================================================
 */

export interface SovereignPolicy {
  id: string;

  name: string;

  description: string;

  enabled: boolean;

  priority: number;

  appliesTo: ActorType[];

  allowedCapabilities: string[];

  deniedCapabilities: string[];

  requiresApproval: boolean;

  restrictions: string[];
}

/* ============================================================
 * 12. PERMISSION
 * ============================================================
 */

export interface SovereignPermission {
  id: string;

  name: string;

  description: string;

  resource: string;

  action: string;

  enabled: boolean;
}

/* ============================================================
 * 13. MEMORY
 * ============================================================
 */

export type MemoryType =
  | "RUNTIME"
  | "TASK"
  | "PROJECT"
  | "KNOWLEDGE"
  | "HISTORY"
  | "RESULT"
  | "LESSON"
  | "CONFIGURATION";

export interface SovereignMemoryRecord {
  id: string;

  type: MemoryType;

  key: string;

  value: unknown;

  createdAt: string;

  updatedAt: string;

  expiresAt?: string;

  ownerId?: string;

  accessPolicy?: string;
}

/* ============================================================
 * 14. EVENT
 * ============================================================
 */

export interface SovereignEvent {
  id: string;

  type: string;

  source: string;

  timestamp: string;

  jobId?: string;

  agentId?: string;

  capabilityId?: string;

  payload: Record<string, unknown>;
}

/* ============================================================
 * 15. AUDIT
 * ============================================================
 */

export interface SovereignAuditRecord {
  id: string;

  actorId: string;

  actorType: ActorType;

  operation: string;

  resource: string;

  resourceId?: string;

  permissionUsed?: string;

  result: "ALLOWED" | "DENIED" | "SUCCESS" | "FAILED";

  timestamp: string;

  error?: string;

  metadata

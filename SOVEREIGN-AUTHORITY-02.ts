/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-AUTHORITY-02
 * ============================================================
 *
 * Purpose:
 * Sovereign authority and delegation contract.
 *
 * Authority hierarchy:
 *
 * OWNER
 *   ↓
 * STEWARD
 *   ↓
 * CORE
 *   ↓
 * RUNTIME
 *   ↓
 * AGENTS / CAPABILITIES
 *
 * OWNER is the supreme authority.
 * STEWARD is delegated executive authority.
 *
 * STEWARD may operate the platform autonomously
 * within the delegation granted by OWNER.
 *
 * No lower layer may elevate its own authority.
 * No Agent or Capability may become OWNER.
 *
 * This file defines authority contracts only.
 * It does not execute platform operations.
 * ============================================================
 */

"use strict";

/* ============================================================
 * 1. AUTHORITY LEVELS
 * ============================================================
 */

export enum SovereignAuthorityLevel {
  OWNER = 1000,
  STEWARD = 800,
  CORE = 600,
  RUNTIME = 500,
  AGENT = 300,
  CAPABILITY = 200,
  SYSTEM = 100,
}

/* ============================================================
 * 2. AUTHORITY ACTORS
 * ============================================================
 */

export type SovereignAuthorityActor =
  | "OWNER"
  | "STEWARD"
  | "CORE"
  | "RUNTIME"
  | "AGENT"
  | "CAPABILITY"
  | "SYSTEM";

/* ============================================================
 * 3. OWNER AUTHORITY
 * ============================================================
 */

export interface SovereignOwner {
  id: string;

  type: "OWNER";

  authorityLevel: SovereignAuthorityLevel.OWNER;

  supremeAuthority: true;

  canDelegate: true;

  canRevokeDelegation: true;

  canPausePlatform: true;

  canStopPlatform: true;

  canReplaceSteward: true;

  canOverridePolicy: true;

  createdAt: string;
}

/* ============================================================
 * 4. STEWARD AUTHORITY
 * ============================================================
 */

export interface SovereignSteward {
  id: string;

  type: "STEWARD";

  authorityLevel: SovereignAuthorityLevel.STEWARD;

  delegatedAuthority: true;

  autonomousOperation: true;

  delegationSource: string;

  delegationScope: SovereignDelegationScope;

  status:
    | "ACTIVE"
    | "SUSPENDED"
    | "REVOKED";
}

/* ============================================================
 * 5. DELEGATION SCOPE
 * ============================================================
 */

export interface SovereignDelegationScope {
  allowedOperations: string[];

  allowedLayers: string[];

  allowedCapabilities: string[];

  allowedAgents: string[];

  allowedResources: string[];

  maximumRiskLevel:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  requiresOwnerApprovalFor: string[];

  automaticExecutionEnabled: boolean;
}

/* ============================================================
 * 6. AUTHORITY DELEGATION
 * ============================================================
 */

export interface SovereignDelegation {
  id: string;

  ownerId: string;

  stewardId: string;

  issuedAt: string;

  expiresAt?: string;

  active: boolean;

  scope: SovereignDelegationScope;

  reason?: string;
}

/* ============================================================
 * 7. AUTHORITY DECISION
 * ============================================================
 */

export interface SovereignAuthorityDecision {
  actorId: string;

  actorType: SovereignAuthorityActor;

  requestedOperation: string;

  requestedResource?: string;

  requestedCapability?: string;

  requestedLayer?: string;

  allowed: boolean;

  reason: string;

  authorityLevel:
    | SovereignAuthorityLevel.OWNER
    | SovereignAuthorityLevel.STEWARD
    | SovereignAuthorityLevel.CORE
    | SovereignAuthorityLevel.RUNTIME
    | SovereignAuthorityLevel.AGENT
    | SovereignAuthorityLevel.CAPABILITY
    | SovereignAuthorityLevel.SYSTEM;

  timestamp: string;
}

/* ============================================================
 * 8. AUTHORITY RULES
 * ============================================================
 */

export const SOVEREIGN_AUTHORITY_RULES = {
  ownerIsSupreme: true,

  stewardIsDelegated: true,

  stewardCannotBecomeOwner: true,

  agentsCannotBecomeOwner: true,

  capabilitiesCannotBecomeOwner: true,

  runtimeCannotBecomeOwner: true,

  coreCannotBecomeOwner: true,

  selfElevationForbidden: true,

  delegationRequiredForSteward: true,

  ownerCanRevokeSteward: true,

  ownerCanReplaceSteward: true,

  autonomousOperationAllowedForSteward: true,

  autonomousOperationMustRespectDelegation: true,

  criticalOperationsMayRequireOwnerApproval: true,

  auditRequiredForAuthorityChanges: true,
} as const;

/* ============================================================
 * 9. AUTHORITY VALIDATOR
 * ============================================================
 */

export class SovereignAuthorityValidator {
  /**
   * Determines whether an actor can operate
   * within the requested authority boundary.
   */
  static validate(
    actor: SovereignAuthorityActor,
    requestedLevel: SovereignAuthorityLevel,
    delegation?: SovereignDelegation,
  ): SovereignAuthorityDecision {
    const timestamp = new Date().toISOString();

    const actorLevel = this.getAuthorityLevel(actor);

    if (actor === "OWNER") {
      return {
        actorId: "OWNER",
        actorType: actor,
        requestedOperation: "AUTHORITY_CHECK",
        allowed: requestedLevel <= SovereignAuthorityLevel.OWNER,
        reason: "OWNER holds supreme sovereign authority.",
        authorityLevel: actorLevel,
        timestamp,
      };
    }

    if (actor === "STEWARD") {
      if (!delegation || !delegation.active) {
        return {
          actorId: delegation?.stewardId ?? "UNKNOWN",
          actorType: actor,
          requestedOperation: "AUTHORITY_CHECK",
          allowed: false,
          reason:
            "STEWARD requires an active delegation from OWNER.",
          authorityLevel: actorLevel,
          timestamp,
        };
      }

      if (
        requestedLevel >= SovereignAuthorityLevel.OWNER
      ) {
        return {
          actorId: delegation.stewardId,
          actorType: actor,
          requestedOperation: "AUTHORITY_CHECK",
          allowed: false,
          reason:
            "STEWARD cannot obtain or assume OWNER authority.",
          authorityLevel: actorLevel,
          timestamp,
        };
      }

      return {
        actorId: delegation.stewardId,
        actorType: actor,
        requestedOperation: "AUTHORITY_CHECK",
        allowed:
          requestedLevel <=
          SovereignAuthorityLevel.STEWARD,
        reason:
          "STEWARD operates autonomously within OWNER delegation.",
        authorityLevel: actorLevel,
        timestamp,
      };
    }

    if (
      requestedLevel >=
      SovereignAuthorityLevel.STEWARD
    ) {
      return {
        actorId: actor,
        actorType: actor,
        requestedOperation: "AUTHORITY_CHECK",
        allowed: false,
        reason:
          "Lower-level actors cannot elevate themselves to STEWARD or OWNER.",
        authorityLevel: actorLevel,
        timestamp,
      };
    }

    return {
      actorId: actor,
      actorType: actor,
      requestedOperation: "AUTHORITY_CHECK",
      allowed: requestedLevel <= actorLevel,
      reason:
        "Operation remains within the actor authority boundary.",
      authorityLevel: actorLevel,
      timestamp,
    };
  }

  /* ========================================================
   * AUTHORITY LEVEL RESOLUTION
   * ========================================================
   */

  static getAuthorityLevel(
    actor: SovereignAuthorityActor,
  ): SovereignAuthorityLevel {
    switch (actor) {
      case "OWNER":
        return SovereignAuthorityLevel.OWNER;

      case "STEWARD":
        return SovereignAuthorityLevel.STEWARD;

      case "CORE":
        return SovereignAuthorityLevel.CORE;

      case "RUNTIME":
        return SovereignAuthorityLevel.RUNTIME;

      case "AGENT":
        return SovereignAuthorityLevel.AGENT;

      case "CAPABILITY":
        return SovereignAuthorityLevel.CAPABILITY;

      case "SYSTEM":
        return SovereignAuthorityLevel.SYSTEM;

      default:
        return SovereignAuthorityLevel.SYSTEM;
    }
  }
}

/* ============================================================
 * 10. SOVEREIGN AUTHORITY CONTRACT
 * ============================================================
 */

export const SOVEREIGN_AUTHORITY_CONTRACT = {
  id: "SOVEREIGN-AUTHORITY-02",

  version: "1.0.0",

  hierarchy: [
    "OWNER",
    "STEWARD",
    "CORE",
    "RUNTIME",
    "AGENT",
    "CAPABILITY",
    "SYSTEM",
  ],

  supremeAuthority: "OWNER",

  executiveAuthority: "STEWARD",

  ownerAuthorityLevel:
    SovereignAuthorityLevel.OWNER,

  stewardAuthorityLevel:
    SovereignAuthorityLevel.STEWARD,

  autonomousStewardOperation: true,

  selfElevationForbidden: true,

  delegationRequired: true,

  revocationSupported: true,

  auditRequired: true,

  status: "FOUNDATION",
} as const;

/* ============================================================
 * END OF SOVEREIGN-AUTHORITY-02
 * ============================================================
 */

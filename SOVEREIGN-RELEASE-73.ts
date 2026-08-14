/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-RELEASE-73
 * ============================================================
 *
 * Sovereign Release Engine.
 *
 * Responsibilities:
 * - Create releases only from valid sovereign certificates.
 * - Bind releases to certified lineage.
 * - Track artifacts, versions and integrity hashes.
 * - Freeze release manifests before deployment.
 * - Prevent uncertified outputs from entering deployment.
 *
 * RELEASE ENGINE IS NOT AUTHORITY.
 * RELEASE ENGINE DOES NOT DEPLOY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import {
  createHash,
  randomUUID,
} from "node:crypto";

export type SovereignReleaseStatus =
  | "DRAFT"
  | "PREPARING"
  | "READY"
  | "BLOCKED"
  | "REVOKED"
  | "ARCHIVED";

export interface SovereignReleaseArtifact {
  id: string;

  name: string;

  version: string;

  location: string;

  checksum: string;

  size?: number;

  mediaType?: string;

  createdAt: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignRelease {
  id: string;

  releaseVersion: string;

  certificateId: string;

  validationId: string;

  optimizationId: string;

  candidateId: string;

  adaptationId: string;

  learningId: string;

  feedbackId: string;

  resultId: string;

  executionId: string;

  decisionId: string;

  source: string;

  status: SovereignReleaseStatus;

  artifacts: SovereignReleaseArtifact[];

  manifestHash?: string;

  requestedBy: string;

  preparedBy?: string;

  correlationId?: string;

  causationId?: string;

  idempotencyKey?: string;

  createdAt: string;

  preparedAt?: string;

  revokedAt?: string;

  revokedBy?: string;

  revocationReason?: string;

  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignReleaseContext {
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

export interface SovereignReleaseStore {
  saveRelease(
    release: SovereignRelease
  ): Promise<void>;

  getRelease(
    releaseId: string
  ): Promise<SovereignRelease | undefined>;

  listReleases(
    limit?: number
  ): Promise<SovereignRelease[]>;

  findByCertificateId?(
    certificateId: string
  ): Promise<SovereignRelease | undefined>;

  findByIdempotencyKey?(
    key: string
  ): Promise<SovereignRelease | undefined>;
}

export interface SovereignReleaseCertificationBridge {
  verifyCertificate(
    certificateId: string,
    context: SovereignReleaseContext
  ): Promise<{
    valid: boolean;

    reason?: string;

    certificate: {
      id: string;

      validationId: string;

      optimizationId: string;

      candidateId: string;

      adaptationId: string;

      learningId: string;

      feedbackId: string;

      resultId: string;

      executionId: string;

      decisionId: string;

      status:
        | "ISSUED"
        | "REVOKED"
        | "EXPIRED";

      fingerprint: string;

      issuedAt: string;

      expiresAt?: string;
    };
  }>;
}

export interface SovereignReleaseArtifactBridge {
  collect(input: {
    certificateId: string;

    resultId: string;

    executionId: string;

    context: SovereignReleaseContext;
  }): Promise<
    Array<{
      id?: string;

      name: string;

      version: string;

      location: string;

      checksum: string;

      size?: number;

      mediaType?: string;

      metadata?: Record<string, unknown>;
    }>
  >;
}

export interface SovereignReleasePolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignReleaseContext["authority"];

    operation:
      | "CREATE_RELEASE"
      | "PREPARE_RELEASE"
      | "READ_RELEASE"
      | "REVOKE_RELEASE"
      | "ARCHIVE_RELEASE";

    releaseId?: string;

    certificateId?: string;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

export interface SovereignReleaseEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    releaseId?: string;

    certificateId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignReleaseAudit {
  record(
    operation: string,
    subjectId: string | undefined,
    result:
      | "SUCCESS"
      | "FAILED"
      | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

export class SovereignReleaseEngine {
  public readonly id =
    "SOVEREIGN-RELEASE-73";

  public readonly version =
    "1.0.0";

  private store?: SovereignReleaseStore;

  private certificationBridge?:
    SovereignReleaseCertificationBridge;

  private artifactBridge?:
    SovereignReleaseArtifactBridge;

  private policyBridge?:
    SovereignReleasePolicyBridge;

  private eventBridge?:
    SovereignReleaseEventBridge;

  private audit?: SovereignReleaseAudit;

  private preparing =
    new Set<string>();

  setStore(
    store: SovereignReleaseStore
  ): void {
    this.store = store;
  }

  setCertificationBridge(
    bridge: SovereignReleaseCertificationBridge
  ): void {
    this.certificationBridge = bridge;
  }

  setArtifactBridge(
    bridge: SovereignReleaseArtifactBridge
  ): void {
    this.artifactBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignReleasePolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignReleaseEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignReleaseAudit
  ): void {
    this.audit = audit;
  }

  async createRelease(
    input: {
      id?: string;

      certificateId: string;

      releaseVersion: string;

      source: string;

      correlationId?: string;

      causationId?: string;

      idempotencyKey?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignReleaseContext
  ): Promise<SovereignRelease> {
    this.requireContext(context);

    if (!input.certificateId.trim()) {
      throw new Error(
        "Release certificateId is required."
      );
    }

    if (!input.releaseVersion.trim()) {
      throw new Error(
        "Release version is required."
      );
    }

    if (!input.source.trim()) {
      throw new Error(
        "Release source is required."
      );
    }

   

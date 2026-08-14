/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-CERTIFICATION-72
 * ============================================================
 *
 * Sovereign Certification Engine.
 *
 * Responsibilities:
 * - Certify sovereign outputs that passed validation.
 * - Bind certificates to validation and optimization lineage.
 * - Generate tamper-evident certificate fingerprints.
 * - Verify certificate integrity.
 * - Revoke certificates when sovereign policy requires it.
 * - Preserve complete certification provenance.
 *
 * CERTIFICATION ENGINE IS NOT AUTHORITY.
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

export type SovereignCertificationStatus =
  | "ISSUED"
  | "REVOKED"
  | "EXPIRED";

export interface SovereignCertificate {
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

  source: string;

  status: SovereignCertificationStatus;

  fingerprint: string;

  issuedBy: string;

  issuedAt: string;

  expiresAt?: string;

  revokedBy?: string;

  revokedAt?: string;

  revocationReason?: string;

  correlationId?: string;

  causationId?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignCertificationContext {
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

export interface SovereignCertificationStore {
  saveCertificate(
    certificate: SovereignCertificate
  ): Promise<void>;

  getCertificate(
    certificateId: string
  ): Promise<SovereignCertificate | undefined>;

  listCertificates(
    limit?: number
  ): Promise<SovereignCertificate[]>;

  findByValidationId?(
    validationId: string
  ): Promise<SovereignCertificate | undefined>;
}

export interface SovereignCertificationValidationBridge {
  getValidation(
    validationId: string
  ): Promise<{
    id: string;

    optimizationId: string;

    candidateId: string;

    adaptationId: string;

    learningId: string;

    feedbackId: string;

    resultId: string;

    executionId: string;

    decisionId: string;

    status:
      | "CREATED"
      | "VALIDATING"
      | "PASSED"
      | "FAILED"
      | "REJECTED"
      | "ARCHIVED";

    checks: Array<{
      id: string;

      gate: string;

      passed: boolean;

      required: boolean;
    }>;

    validatedAt?: string;
  }>;
}

export interface SovereignCertificationPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignCertificationContext["authority"];

    operation:
      | "ISSUE_CERTIFICATE"
      | "VERIFY_CERTIFICATE"
      | "READ_CERTIFICATE"
      | "REVOKE_CERTIFICATE";

    certificateId?: string;

    validationId?: string;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

export interface SovereignCertificationEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    certificateId?: string;

    validationId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignCertificationAudit {
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

export class SovereignCertificationEngine {
  public readonly id =
    "SOVEREIGN-CERTIFICATION-72";

  public readonly version =
    "1.0.0";

  private store?: SovereignCertificationStore;

  private validationBridge?:
    SovereignCertificationValidationBridge;

  private policyBridge?:
    SovereignCertificationPolicyBridge;

  private eventBridge?:
    SovereignCertificationEventBridge;

  private audit?: SovereignCertificationAudit;

  setStore(
    store: SovereignCertificationStore
  ): void {
    this.store = store;
  }

  setValidationBridge(
    bridge: SovereignCertificationValidationBridge
  ): void {
    this.validationBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignCertificationPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignCertificationEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(
    audit: SovereignCertificationAudit
  ): void {
    this.audit = audit;
  }

  async issueCertificate(
    input: {
      id?: string;

      validationId: string;

      source: string;

      expiresAt?: string;

      correlationId?: string;

      causationId?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignCertificationContext
  ): Promise<SovereignCertificate> {
    this.requireContext(context);

    if (!input.validationId.trim()) {
      throw new Error(
        "Certification validationId is required."
      );
    }

    if (!input.source.trim()) {
      throw new Error(
        "Certification source is required."
      );
    }

    const validation =
      await this.requireValidationBridge()
        .getValidation(
          input.validationId
        );

    if (
      validation.status !== "PASSED"
    ) {
      throw new Error(
        `Validation is not certifiable: ${validation.status}`
      );
    }

    const failedRequired =
      validation.checks.filter(
        (check) =>
          check.required &&
          !check.passed
      );

    if (failedRequired.length > 0) {
      throw new Error(
        "Certification rejected: validation contains failed required checks."
      );
    }

    const existing =
      this.requireStore()
        .findByValidationId
        ? await this.requireStore()
            .findByValidationId!(
              validation.id
            )
        : undefined;

    if (existing) {
      return existing;
    }

    const certificateId =
      input.id ??
      this.createId(
        "CERTIFICATE"
      );

    await this.requireAuthorized(
      context,
      "ISSUE_CERTIFICATE",
      certificateId,
      validation.id
    );

    if (input.expiresAt) {
      const expires =
        Date.parse(input.expiresAt);

      if (
        Number.isNaN(expires) ||
        expires <= Date.now()
      ) {
        throw new Error(
          "Certificate expiresAt must be a future ISO date."
        );
      }
    }

    const issuedAt =
      this.now();

    const fingerprint =
      this.createFingerprint({
        certificateId,
        validationId:
          validation.id,
        optimizationId:
          validation.optimizationId,
        candidateId:
          validation.candidateId,
        resultId:
          validation.resultId,
        executionId:
          validation.executionId,
        decisionId:
          validation.decisionId,
        issuedAt,
        expiresAt:
          input.expiresAt,
      });

    const certificate:
      SovereignCertificate = {
      id:
        certificateId,

      validationId:
        validation.id,

      optimizationId:
        validation.optimizationId,

      candidateId:
        validation.candidateId,

      adaptationId:
        validation.adaptationId,

      learningId:
        validation.learningId,

      feedbackId:
        validation.feedbackId,

      resultId:
        validation.resultId,

      executionId:
        validation.executionId,

      decisionId:
        validation.decisionId,

      source:
        input.source,

      status:
        "ISSUED",

      fingerprint,

      issuedBy:
        context.actorId,

      issuedAt,

      expiresAt:
        input.expiresAt,

      correlationId:
        input.correlationId,

      causationId:
        input.causationId,

      metadata:
        input.metadata,
    };

    await this.requireStore()
      .saveCertificate(
        certificate
      );

    await this.publishEvent(
      "certification.issued",
      certificate,
      {
        fingerprint:
          certificate.fingerprint,

        candidateId:
          certificate.candidateId,
      }
    );

    await this.recordAudit(
      "certification.issue",
      certificate.id,
      "SUCCESS",
      {
        actorId:
          context.actorId,

        validationId:
          validation.id,
      }
    );

    return certificate;
  }

  async verifyCertificate(
    certificateId: string,
    context: SovereignCertificationContext
  ): Promise<{
    valid: boolean;

    certificate: SovereignCertificate;

    reason?: string;
  }> {
    this.requireContext(context);

    const certificate =
      await this.requireCertificate(
        certificateId
      );

    await this.requireAuthorized(
      context,
      "VERIFY_CERTIFICATE",
      certificate.id,
      certificate.validationId
    );

    if (
      certificate.status ===
      "REVOKED"
    ) {
      return {
        valid: false,
        certificate,
        reason:
          "Certificate is revoked.",
      };
    }

    if (
      certificate.expiresAt &&
      Date.parse(
        certificate.expiresAt
      ) <= Date.now()
    ) {
      certificate.status =
        "EXPIRED";

      await this.requireStore()
        .saveCertificate(
          certificate
        );

      return {
        valid: false,
        certificate,
        reason:
          "Certificate is expired.",
      };
    }

    const expected =
      this.createFingerprint({
        certificateId:
          certificate.id,

        validationId:
          certificate.validationId,

        optimizationId:
          certificate.optimizationId,

        candidateId:
          certificate.candidateId,

        resultId:
          certificate.resultId,

        executionId:
          certificate.executionId,

        decisionId:
          certificate.decisionId,

        issuedAt:
          certificate.issuedAt,

        expiresAt:
          certificate.expiresAt,
      });

    if (
      expected !==
      certificate.fingerprint
    ) {
      await this.recordAudit(
        "certification.verify",
        certificate.id,
        "FAILED",
        {
          actorId:
            context.actorId,

          reason:
            "Fingerprint mismatch",
        }
      );

      return {
        valid: false,

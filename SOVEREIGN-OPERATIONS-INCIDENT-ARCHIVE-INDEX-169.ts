// ============================================================================
// SOVEREIGN AI PLATFORM
// File: SOVEREIGN-OPERATIONS-INCIDENT-ARCHIVE-INDEX-169.ts
// Sequence: 169
// Purpose: Sovereign Incident Archive Indexing, Immutable Reference Mapping,
//          Search Integrity & Historical Traceability
// ============================================================================

export const SOVEREIGN_OPERATIONS_INCIDENT_ARCHIVE_INDEX_ID =
  "SOVEREIGN-OPERATIONS-INCIDENT-ARCHIVE-INDEX-169";

export const SOVEREIGN_OPERATIONS_INCIDENT_ARCHIVE_INDEX_VERSION =
  "1.0.0";

export type SovereignArchiveIndexState =
  | "REGISTERED"
  | "INDEXED"
  | "VERIFIED"
  | "BLOCKED";

export interface SovereignArchiveIndexAuthorityContext {
  ownerId: string;
  stewardId?: string;

  ownerAuthority: "SUPREME";
  stewardAuthority: "DELEGATED";

  delegationEnabled: boolean;
  delegationScope: string[];
}

export interface SovereignArchiveIndexEntry {
  indexEntryId: string;

  archiveId: string;
  incidentId: string;

  certificateId: string;
  auditId: string;
  verificationId: string;

  target: string;

  archiveFingerprint: string;

  archivedAt: number;
  indexedAt: number;

  tags: string[];

  metadata?: Record<string, unknown>;

  immutable: true;
}

export interface SovereignArchiveIndexRequest {
  indexEntryId: string;

  archiveId: string;
  incidentId: string;

  certificateId: string;
  auditId: string;
  verificationId: string;

  target: string;

  archiveFingerprint: string;

  archivedAt: number;

  requestedBy: string;

  authorityContext:
    SovereignArchiveIndexAuthorityContext;

  archiveVerified: boolean;
  certificateVerified: boolean;
  auditVerified: boolean;

  tags?: string[];

  metadata?: Record<string, unknown>;
}

export interface SovereignArchiveIndexResult {
  indexEntryId: string;

  archiveId: string;
  incidentId: string;

  accepted: boolean;

  state: SovereignArchiveIndexState;

  reasons: string[];

  timestamp: number;

  authority: "NONE";
}

export class SovereignOperationsIncidentArchiveIndex {
  public readonly id =
    SOVEREIGN_OPERATIONS_INCIDENT_ARCHIVE_INDEX_ID;

  public readonly version =
    SOVEREIGN_OPERATIONS_INCIDENT_ARCHIVE_INDEX_VERSION;

  public readonly authority: "NONE" = "NONE";

  public readonly ownerAuthority: "SUPREME" =
    "SUPREME";

  public readonly stewardAuthority: "DELEGATED" =
    "DELEGATED";

  public readonly indexCanCreateAuthority = false;
  public readonly indexCanEscalateAuthority = false;
  public readonly indexCanOverrideOwner = false;

  public readonly indexCanBypassVerification = false;
  public readonly indexCanRewriteArchive = false;
  public readonly indexCanRewriteEvidence = false;
  public readonly indexCanMutateImmutableEntry = false;
  public readonly indexCanDeleteHistoricalRecord = false;

  public readonly stewardCanOverrideOwner = false;

  private readonly entries =
    new Map<string, SovereignArchiveIndexEntry>();

  private readonly incidentLookup =
    new Map<string, Set<string>>();

  private readonly archiveLookup =
    new Map<string, string>();

  public register(
    request: SovereignArchiveIndexRequest,
    now = Date.now()
  ): SovereignArchiveIndexResult {
    if (
      this.entries.has(request.indexEntryId)
    ) {
      return this.failure(
        request.indexEntryId,
        request.archiveId,
        request.incidentId,
        "INDEX_ENTRY_ALREADY_EXISTS",
        now
      );
    }

    if (
      this.archiveLookup.has(request.archiveId)
    ) {
      return this.failure(
        request.indexEntryId,
        request.archiveId,
        request.incidentId,
        "ARCHIVE_ALREADY_INDEXED",
        now
      );
    }

    const failures =
      this.validate(request);

    if (failures.length > 0) {
      return {
        indexEntryId:
          request.indexEntryId,

        archiveId:
          request.archiveId,

        incidentId:
          request.incidentId,

        accepted: false,

        state: "BLOCKED",

        reasons:
          failures,

        timestamp:
          now,

        authority:
          "NONE"
      };
    }

    const entry:
      SovereignArchiveIndexEntry = {
        indexEntryId:
          request.indexEntryId,

        archiveId:
          request.archiveId,

        incidentId:
          request.incidentId,

        certificateId:
          request.certificateId,

        auditId:
          request.auditId,

        verificationId:
          request.verificationId,

        target:
          request.target,

        archiveFingerprint:
          request.archiveFingerprint,

        archivedAt:
          request.archivedAt,

        indexedAt:
          now,

        tags:
          this.normalizeTags(
            request.tags ?? []
          ),

        metadata:
          request.metadata
            ? { ...request.metadata }
            : undefined,

        immutable:
          true
      };

    this.entries.set(
      entry.indexEntryId,
      entry
    );

    this.archiveLookup.set(
      entry.archiveId,
      entry.indexEntryId
    );

    const incidentEntries =
      this.incidentLookup.get(
        entry.incidentId
      ) ?? new Set<string>();

    incidentEntries.add(
      entry.indexEntryId
    );

    this.incidentLookup.set(
      entry.incidentId,
      incidentEntries
    );

    return {
      indexEntryId:
        entry.indexEntryId,

      archiveId:
        entry.archiveId,

      incidentId:
        entry.incidentId,

      accepted:
        true,

      state:
        "INDEXED",

      reasons: [
        "INCIDENT_ARCHIVE_INDEXED",
        "IMMUTABLE_ARCHIVE_REFERENCE_CREATED"
      ],

      timestamp:
        now,

      authority:
        "NONE"
    };
  }

  private validate(
    request: SovereignArchiveIndexRequest
  ): string[] {
    const reasons: string[] = [];

    if (!request.indexEntryId) {
      reasons.push(
        "INDEX_ENTRY_ID_REQUIRED"
      );
    }

    if (!request.archiveId) {
      reasons.push(
        "ARCHIVE_ID_REQUIRED"
      );
    }

    if (!request.incidentId) {
      reasons.push(
        "INCIDENT_ID_REQUIRED"
      );
    }

    if (!request.certificateId) {
      reasons.push(
        "CERTIFICATE_ID_REQUIRED"
      );
    }

    if (!request.auditId) {
      reasons.push(
        "AUDIT_ID_REQUIRED"
      );
    }

    if (!request.verificationId) {
      reasons.push(
        "VERIFICATION_ID_REQUIRED"
      );
    }

    if (!request.target) {
      reasons.push(
        "TARGET_REQUIRED"
      );
    }

    if (!request.archiveFingerprint) {
      reasons.push(
        "ARCHIVE_FINGERPRINT_REQUIRED"
      );
    }

    if (
      !Number.isFinite(
        request.archivedAt
      ) ||
      request.archivedAt <= 0
    ) {
      reasons.push(
        "INVALID_ARCHIVED_AT"
      );
    }

    if (!request.requestedBy) {
      reasons.push(
        "REQUESTER_REQUIRED"
      );
    }

    if (
      !request.authorityContext.ownerId
    ) {
      reasons.push(
        "OWNER_ID_REQUIRED"
      );
    }

    if (
      request.authorityContext.ownerAuthority !==
      "SUPREME"
    ) {
      reasons.push(
        "OWNER_MUST_REMAIN_SUPREME"
      );
    }

    if (
      request.authorityContext.stewardAuthority !==
      "DELEGATED"
    ) {
      reasons.push(
        "STEWARD_MUST_REMAIN_DELEGATED"
      );
    }

    if (!request.archiveVerified) {
      reasons.push(
        "ARCHIVE_VERIFICATION_REQUIRED"
      );
    }

    if (!request.certificateVerified) {
      reasons.push(
        "CERTIFICATE_VERIFICATION_REQUIRED"
      );
    }

    if (!request.auditVerified) {
      reasons.push(
        "AUDIT_VERIFICATION_REQUIRED"
      );
    }

    return reasons;
  }

  public verifyEntry(
    indexEntryId: string,
    archiveFingerprint: string,
    now = Date.now()
  ): SovereignArchiveIndexResult {
    const entry =
      this.entries.get(indexEntryId);

    if (!entry) {
      return this.failure(
        indexEntryId,
        "",
        "",
        "INDEX_ENTRY_NOT_FOUND",
        now
      );
    }

    if (
      entry.archiveFingerprint !==
      archiveFingerprint
    ) {
      return {
        indexEntryId:
          entry.indexEntryId,

        archiveId:
          entry.archiveId,

        incidentId:
          entry.incidentId,

        accepted: false,

        state: "BLOCKED",

        reasons: [
          "ARCHIVE_FINGERPRINT_MISMATCH"
        ],

        timestamp:
          now,

        authority:
          "NONE"
      };
    }

    return {
      indexEntryId:
        entry.indexEntryId,

      archiveId:
        entry.archiveId,

      incidentId:
        entry.incidentId,

      accepted: true,

      state: "VERIFIED",

      reasons: [
        "ARCHIVE_INDEX_ENTRY_VERIFIED",
        "ARCHIVE_REFERENCE_INTEGRITY_CONFIRMED"
      ],

      timestamp:
        now,

      authority:
        "NONE"
    };
  }

  public getByIndexEntryId(
    indexEntryId: string
  ): SovereignArchiveIndexEntry | undefined {
    const entry =
      this.entries.get(indexEntryId);

    return entry
      ? this.cloneEntry(entry)
      : undefined;
  }

  public getByArchiveId(
    archiveId: string
  ): SovereignArchiveIndexEntry | undefined {
    const indexEntryId =
      this.archiveLookup.get(archiveId);

    if (!indexEntryId) {
      return undefined;
    }

    return this.getByIndexEntryId(
      indexEntryId
    );
  }

  public getByIncidentId(
    incidentId: string
  ): SovereignArchiveIndexEntry[] {
    const entryIds =
      this.incidentLookup.get(
        incidentId
      );

    if (!entryIds) {
      return [];
    }

    return [...entryIds]
      .map(
        (id) =>
          this.entries.get(id)
      )
      .filter(
        (
          entry
        ): entry is SovereignArchiveIndexEntry =>
          Boolean(entry)
      )
      .map(
        (entry) =>
          this.cloneEntry(entry)
      );
  }

  public searchByTarget(
    target: string
  ): SovereignArchiveIndexEntry[] {
    return [...this.entries.values()]
      .filter(
        (entry) =>
          entry.target === target
      )
      .map(
        (entry) =>
          this.cloneEntry(entry)
      );
  }

  public searchByTag(
    tag: string
  ): SovereignArchiveIndexEntry[] {
    const normalized =
      tag.trim().toLowerCase();

    if (!normalized) {
      return [];
    }

    return [...this.entries.values()]
      .filter(
        (entry) =>
          entry.tags.includes(
            normalized
          )
      )
      .map(
        (entry) =>
          this.cloneEntry(entry)
      );
  }

  public listChronological():
    SovereignArchiveIndexEntry[] {
    return [...this.entries.values()]
      .sort(
        (a, b) =>
          a.archivedAt -
          b.archivedAt
      )
      .map(
        (entry) =>
          this.cloneEntry(entry)
      );
  }

  private normalizeTags(
    tags: string[]
  ): string[] {
    return [
      ...new Set(
        tags
          .map(
            (tag) =>
              tag.trim().toLowerCase()
          )
          .filter(Boolean)
      )
    ];
  }

  private cloneEntry(
    entry: SovereignArchiveIndexEntry
  ): SovereignArchiveIndexEntry {
    return {
      ...entry,

      tags:
        [...entry.tags],

      metadata:
        entry.metadata
          ? { ...entry.metadata }
          : undefined
    };
  }

  private failure(
    indexEntryId: string,
    archiveId: string,
    incidentId: string,
    reason: string,
    now: number
  ): SovereignArchiveIndexResult {
    return {
      indexEntryId,
      archiveId,
      incidentId,

      accepted:
        false,

      state:
        "BLOCKED",

      reasons:
        [reason],

      timestamp:
        now,

      authority:
        "NONE"
    };
  }

  public assertSovereignty(): boolean {
    return (
      this.authority === "NONE" &&
      this.ownerAuthority === "SUPREME" &&
      this.stewardAuthority === "DELEGATED" &&

      this.indexCanCreateAuthority === false &&
      this.indexCanEscalateAuthority === false &&
      this.indexCanOverrideOwner === false &&

      this.indexCanBypassVerification === false &&
      this.indexCanRewriteArchive === false &&
      this.indexCanRewriteEvidence === false &&
      this.indexCanMutateImmutableEntry === false &&
      this.indexCanDeleteHistoricalRecord === false &&

      this.stewardCanOverrideOwner === false
    );
  }
}

export const sovereignOperationsIncidentArchiveIndex =
  new SovereignOperationsIncidentArchiveIndex();

export default sovereignOperationsIncidentArchiveIndex;

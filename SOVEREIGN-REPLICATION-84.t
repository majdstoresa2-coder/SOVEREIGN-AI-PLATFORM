/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-REPLICATION-84
 * ============================================================
 *
 * Sovereign Replication Engine.
 *
 * Responsibilities:
 * - Govern sovereign state replication.
 * - Register replication streams.
 * - Verify source and replica integrity.
 * - Measure synchronization lag.
 * - Detect divergence and stale replicas.
 * - Prevent unsafe replica promotion.
 * - Preserve replication provenance.
 *
 * REPLICATION ENGINE IS NOT AUTHORITY.
 * REPLICATION ENGINE DOES NOT OVERRIDE OWNER.
 * REPLICATION ENGINE DOES NOT GRANT PRIVILEGES.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

import { randomUUID } from "node:crypto";

export type SovereignReplicationStatus =
  | "REGISTERED"
  | "SYNCING"
  | "SYNCHRONIZED"
  | "LAGGING"
  | "DIVERGED"
  | "FAILED"
  | "PAUSED"
  | "ARCHIVED";

export type SovereignReplicationCriticality =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SovereignReplicationEndpoint {
  id: string;
  name: string;
  endpoint: string;

  region?: string;
  failureDomain?: string;

  healthy: boolean;

  sequence: number;

  checksum?: string;

  lastUpdatedAt?: string;
  verifiedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignReplicationStream {
  id: string;

  redundancyGroupId: string;
  serviceId: string;

  name: string;

  criticality: SovereignReplicationCriticality;

  status: SovereignReplicationStatus;

  source: SovereignReplicationEndpoint;

  replicas: SovereignReplicationEndpoint[];

  maximumLagSeconds: number;

  currentLagSeconds: number;

  synchronizedReplicas: number;

  divergenceDetected: boolean;

  createdBy: string;
  verifiedBy?: string;

  correlationId?: string;
  causationId?: string;

  createdAt: string;
  updatedAt: string;

  synchronizedAt?: string;
  pausedAt?: string;
  archivedAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignReplicationContext {
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

  correlationId?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignReplicationStore {
  saveStream(
    stream: SovereignReplicationStream
  ): Promise<void>;

  getStream(
    streamId: string
  ): Promise<SovereignReplicationStream | undefined>;

  listStreams(
    limit?: number
  ): Promise<SovereignReplicationStream[]>;

  findByRedundancyGroupId?(
    redundancyGroupId: string
  ): Promise<SovereignReplicationStream | undefined>;
}

export interface SovereignReplicationProbeBridge {
  inspect(input: {
    streamId: string;

    endpoint: SovereignReplicationEndpoint;

    role: "SOURCE" | "REPLICA";

    context: SovereignReplicationContext;
  }): Promise<{
    healthy: boolean;

    sequence: number;

    checksum?: string;

    lastUpdatedAt?: string;

    lagSeconds?: number;

    reason?: string;
  }>;
}

export interface SovereignReplicationTransportBridge {
  synchronize(input: {
    streamId: string;

    source: SovereignReplicationEndpoint;

    replica: SovereignReplicationEndpoint;

    context: SovereignReplicationContext;
  }): Promise<{
    accepted: boolean;

    operationId?: string;

    reason?: string;
  }>;
}

export interface SovereignReplicationPolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignReplicationContext["authority"];

    operation:
      | "REGISTER_REPLICATION"
      | "VERIFY_REPLICATION"
      | "SYNCHRONIZE_REPLICATION"
      | "READ_REPLICATION"
      | "PAUSE_REPLICATION"
      | "ARCHIVE_REPLICATION";

    streamId?: string;

    serviceId?: string;

    criticality?: SovereignReplicationCriticality;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

export interface SovereignReplicationEventBridge {
  publish(event: {
    id: string;

    type: string;

    source: string;

    streamId?: string;
    serviceId?: string;

    timestamp: string;

    correlationId?: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignReplicationAudit {
  record(
    operation: string,
    subjectId: string | undefined,
    result: "SUCCESS" | "FAILED" | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

export class SovereignReplicationEngine {
  public readonly id =
    "SOVEREIGN-REPLICATION-84";

  public readonly version = "1.0.0";

  private store?: SovereignReplicationStore;

  private probeBridge?: SovereignReplicationProbeBridge;

  private transportBridge?: SovereignReplicationTransportBridge;

  private policyBridge?: SovereignReplicationPolicyBridge;

  private eventBridge?: SovereignReplicationEventBridge;

  private audit?: SovereignReplicationAudit;

  private processing = new Set<string>();

  setStore(store: SovereignReplicationStore): void {
    this.store = store;
  }

  setProbeBridge(
    bridge: SovereignReplicationProbeBridge
  ): void {
    this.probeBridge = bridge;
  }

  setTransportBridge(
    bridge: SovereignReplicationTransportBridge
  ): void {
    this.transportBridge = bridge;
  }

  setPolicyBridge(
    bridge: SovereignReplicationPolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBridge(
    bridge: SovereignReplicationEventBridge
  ): void {
    this.eventBridge = bridge;
  }

  setAudit(audit: SovereignReplicationAudit): void {
    this.audit = audit;
  }

  async registerStream(
    input: {
      id?: string;

      redundancyGroupId: string;
      serviceId: string;
      name: string;

      criticality: SovereignReplicationCriticality;

      maximumLagSeconds: number;

      source: {
        id?: string;
        name: string;
        endpoint: string;
        region?: string;
        failureDomain?: string;
        metadata?: Record<string, unknown>;
      };

      replicas: Array<{
        id?: string;
        name: string;
        endpoint: string;
        region?: string;
        failureDomain?: string;
        metadata?: Record<string, unknown>;
      }>;

      correlationId?: string;
      causationId?: string;

      metadata?: Record<string, unknown>;
    },
    context: SovereignReplicationContext
  ): Promise<SovereignReplicationStream> {
    this.requireContext(context);

    if (!input.redundancyGroupId.trim()) {
      throw new Error(
        "Replication redundancyGroupId is required."
      );
    }

    if (!input.serviceId.trim()) {
      throw new Error(
        "Replication serviceId is required."
      );
    }

    if (!input.name.trim()) {
      throw new Error(
        "Replication stream name is required."
      );
    }

    if (
      !Number.isFinite(input.maximumLagSeconds) ||
      input.maximumLagSeconds < 0
    ) {
      throw new Error(
        "maximumLagSeconds must be zero or greater."
      );
    }

    if (!input.source.endpoint.trim()) {
      throw new Error(
        "Replication source endpoint is required."
      );
    }

    if (input.replicas.length === 0) {
      throw new Error(
        "Replication requires at least one replica."
      );
    }

    const endpoints = [
      input.source.endpoint,
      ...input.replicas.map(
        (replica) => replica.endpoint
      ),
    ];

    if (
      new Set(endpoints).size !== endpoints.length
    ) {
      throw new Error(
        "Replication endpoints must be unique."
      );
    }

    const streamId =
      input.id ??
      this.createId("REPLICATION-STREAM");

    await this.requireAuthorized(
      context,
      "REGISTER_REPLICATION",
      streamId,
      input.serviceId,
      input.criticality
    );

    const now = this.now();

    const stream: SovereignReplicationStream = {
      id: streamId,

      redundancyGroupId:
        input.redundancyGroupId,

      serviceId: input.serviceId,

      name: input.name,

      criticality: input.criticality,

      status: "REGISTERED",

      source: this.createEndpoint(
        input.source
      ),

      replicas: input.replicas.map(
        (replica) =>
          this.createEndpoint(replica)
      ),

      maximumLagSeconds:
        input.maximumLagSeconds,

      currentLagSeconds: 0,

      synchronizedReplicas: 0,

      divergenceDetected: false,

      createdBy: context.actorId,

      correlationId:
        input.correlationId ??
        context.correlationId,

      causationId: input.causationId,

      createdAt: now,

      updatedAt: now,

      metadata: input.metadata,
    };

    await this.requireStore()
      .saveStream(stream);

    await this.publishEvent(
      "replication.registered",
      stream,
      {
        replicas: stream.replicas.length,
      }
    );

    await this.recordAudit(
      "replication.register",
      stream.id,
      "SUCCESS",
      {
        actorId: context.actorId,
        serviceId: stream.serviceId,
      }
    );

    return stream;
  }

  async verify(
    streamId: string,
    context: SovereignReplicationContext
  ): Promise<SovereignReplicationStream> {
    this.requireContext(context);

    const stream =
      await this.requireStream(streamId);

    await this.requireAuthorized(
      context,
      "VERIFY_REPLICATION",
      stream.id,
      stream.serviceId,
      stream.criticality
    );

    if (stream.status === "ARCHIVED") {
      throw new Error(
        "Archived replication stream cannot be verified."
      );
    }

    this.acquire(stream.id);

    try {
      const sourceResult =
        await this.requireProbeBridge().inspect({
          streamId: stream.id,
          endpoint: stream.source,
          role: "SOURCE",
          context,
        });

      this.applyProbe(
        stream.source,
        sourceResult
      );

      if (!stream.source.healthy) {
        stream.status = "FAILED";
        stream.updatedAt = this.now();

        await this.requireStore()
          .saveStream(stream);

        throw new Error(
          "Replication source is unhealthy."
        );
      }

      let synchronized = 0;
      let maximumLag = 0;
      let divergence = false;

      for (const replica of stream.replicas) {
        const result =
          await this.requireProbeBridge().inspect({
            streamId: stream.id,
            endpoint: replica,
            role: "REPLICA",
            context,
          });

        this.applyProbe(replica, result);

        const lag =
          result.lagSeconds ?? 0;

        maximumLag =
          Math.max(maximumLag, lag);

        const checksumMatches =
          !stream.source.checksum ||
          !replica.checksum ||
          stream.source.checksum ===
            replica.checksum;

        const sequenceValid =
          replica.sequence <=
          stream.source.sequence;

        if (!sequenceValid) {
          divergence = true;
        }

        if (
          replica.healthy &&
          checksumMatches &&
          sequenceValid &&
          lag <= stream.maximumLagSeconds
        ) {
          synchronized++;
        } else if (
          replica.healthy &&
          !checksumMatches &&
          replica.sequence ===
            stream.source.sequence
        ) {
          divergence = true;
        }
      }

      stream.currentLagSeconds =
        maximumLag;

      stream.synchronizedReplicas =
        synchronized;

      stream.divergenceDetected =
        divergence;

      if (divergence) {
        stream.status = "DIVERGED";
      } else if (
        synchronized ===
        stream.replicas.length
      ) {
        stream.status = "SYNCHRONIZED";
        stream.synchronizedAt = this.now();
      } else if (synchronized > 0) {
        stream.status = "LAGGING";
      } else {
        stream.status = "FAILED";
      }

      stream.verifiedBy =
        context.actorId;

      stream.updatedAt =
        this.now();

      await this.requireStore()
        .saveStream(stream);

      await this.publishEvent(
        "replication.verified",
        stream,
        {
          status: stream.status,

          synchronizedReplicas:
            stream.synchronizedReplicas,

          totalReplicas:
            stream.replicas.length,

          currentLagSeconds:
            stream.currentLagSeconds,

          divergenceDetected:
            stream.divergenceDetected,
        }
      );

      return stream;
    } finally {
      this.release(stream.id);
    }
  }

  async synchronize(
    streamId: string,
    context: SovereignReplicationContext
  ): Promise<SovereignReplicationStream> {
    this.requireContext(context);

    const stream =
      await this.requireStream(streamId);

    await this.requireAuthorized(
      context,
      "SYNCHRONIZE_REPLICATION",
      stream.id,
      stream.serviceId,
      stream.criticality
    );

    if (
      stream.status === "ARCHIVED" ||
      stream.status === "PAUSED"
    ) {
      throw new Error(
        `Replication cannot synchronize from status: ${stream.status}`
      );
    }

    if (stream.divergenceDetected) {
      throw new Error(
        "Automatic synchronization blocked because divergence was detected."
      );
    }

    this.acquire(stream.id);

    stream.status = "SYNCING";
    stream.updatedAt = this.now();

    await this.requireStore()
      .saveStream(stream);

    try {
      for (const replica of stream.replicas) {
        if (
          replica.healthy &&
          replica.sequence ===
            stream.source.sequence &&
          replica.checksum ===
            stream.source.checksum
        ) {
          continue;
        }

        const result =
          await this.requireTransportBridge()
            .synchronize({
              streamId: stream.id,
              source: stream.source,
              replica,
              context,
            });

        if (!result.accepted) {
          throw new Error(
            result.reason ??
              `Replication synchronization rejected for ${replica.name}.`
          );
        }
      }

      stream.updatedAt = this.now();

      await this.requireStore()
        .saveStream(stream);

      await this.publishEvent(
        "replication.synchronization.requested",
        stream,
        {
          replicas: stream.replicas.length,
        }
      );

      return stream;
    } catch (error) {
      stream.status = "FAILED";
      stream.updatedAt = this.now();

      await this.requireStore()
        .saveStream(stream);

      await this.recordAudit(
        "replication.synchronize",
        stream.id,
        "FAILED",
        {
          actorId: context.actorId,

          error:
            error instanceof Error
              ? error.message
              : String(error),
        }
      );

      throw error;
    } finally {
      this.release(stream.id);
    }
  }

  async pause(
    streamId: string,
    context: SovereignReplicationContext
  ): Promise<SovereignReplicationStream> {
    this.requireContext(context);

    const stream =
      await this.requireStream(streamId);

    await this.requireAuthorized(
      context,
      "PAUSE_REPLICATION",
      stream.id,
      stream.serviceId,
      stream.criticality
    );

    if (stream.status === "ARCHIVED") {
      throw new Error(
        "Archived replication cannot be paused."
      );
    }

    stream.status = "PAUSED";
    stream.pausedAt = this.now();
    stream.updatedAt = this.now();

    await this.requireStore()
      .saveStream(stream);

    await this.publishEvent(
      "replication.paused",
      stream,
      {
        actorId: context.actorId,
      }
    );

    return stream;
  }

  async getStream(
    streamId: string,
    context: SovereignReplicationContext
  ): Promise<SovereignReplicationStream> {
    this.requireContext(context);

    const stream =
      await this.requireStream(streamId);

    await this.requireAuthorized(
      context,
      "READ_REPLICATION",
      stream.id,
      stream.serviceId,
      stream.criticality
    );

    return stream;
  }

  async listStreams(
    context: SovereignReplicationContext,
    limit = 100
  ): Promise<SovereignReplicationStream[]> {
    this.requireContext(context);

    await this.requireAuthorized(
      context,
      "READ_REPLICATION"
    );

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000
    ) {
      throw new Error(
        "Replication limit must be between 1 and 1000."
      );
    }

    return this.requireStore()
      .listStreams(limit);
  }

  async archive(
    streamId: string,
    context: SovereignReplicationContext
  ): Promise<SovereignReplicationStream> {
    this.requireContext(context);

    const stream =
      await this.requireStream(streamId);

    await this.requireAuthorized(
      context,
      "ARCHIVE_REPLICATION",
      stream.id,
      stream.serviceId,
      stream.criticality
    );

    if (
      stream.status === "SYNCING"
    ) {
      throw new Error(
        "Active replication cannot be archived."
      );
    }

    stream.status = "ARCHIVED";
    stream.archivedAt = this.now();
    stream.updatedAt = this.now();

    await this.requireStore()
      .saveStream(stream);

    await this.publishEvent(
      "replication.archived",
      stream,
      {
        actorId: context.actorId,
      }
    );

    return stream;
  }

  private createEndpoint(
    input: {
      id?: string;
      name: string;
      endpoint: string;
      region?: string;
      failureDomain?: string;
      metadata?: Record<string, unknown>;
    }
  ): SovereignReplicationEndpoint {
    return {
      id:
        input.id ??
        this.createId(
          "REPLICATION-ENDPOINT"
        ),

      name: input.name,

      endpoint: input.endpoint,

      region: input.region,

      failureDomain:
        input.failureDomain,

      healthy: false,

      sequence: 0,

      metadata: input.metadata,
    };
  }

  private applyProbe(
    endpoint: SovereignReplicationEndpoint,
    result: {
      healthy: boolean;
      sequence: number;
      checksum?: string;
      lastUpdatedAt?: string;
    }
  ): void {
    if (
      !Number.isInteger(result.sequence) ||
      result.sequence < 0
    ) {
      throw new Error(
        "Replication sequence must be a non-negative integer."
      );
    }

    endpoint.healthy =
      result.healthy;

    endpoint.sequence =
      result.sequence;

    endpoint.checksum =
      result.checksum;

    endpoint.lastUpdatedAt =
      result.lastUpdatedAt;

    endpoint.verifiedAt =
      this.now();
  }

  private acquire(streamId: string): void {
    if (this.processing.has(streamId)) {
      throw new Error(
        "Replication operation is already running."
      );
    }

    this.processing.add(streamId);
  }

  private release(streamId: string): void {
    this.processing.delete(streamId);
  }

  private async requireAuthorized(
    context: SovereignReplicationContext,
    operation:
      | "REGISTER_REPLICATION"
      | "VERIFY_REPLICATION"
      | "SYNCHRONIZE_REPLICATION"
      | "READ_REPLICATION"
      | "PAUSE_REPLICATION"
      | "ARCHIVE_REPLICATION",
    streamId?: string,
    serviceId?: string,
    criticality?: SovereignReplicationCriticality
  ): Promise<void> {
    const result =
      await this.requirePolicyBridge()
        .authorize({
          actorId: context.actorId,
          authority: context.authority,
          operation,
          streamId,
          serviceId,
          criticality,
        });

    if (!result.allowed) {
      await this.recordAudit(
        `replication.${operation.toLowerCase()}`,
        streamId,
        "DENIED",
        {
          actorId: context.actorId,
          reason: result.reason,
        }
      );

      throw new Error

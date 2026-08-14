/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-HIGH-AVAILABILITY-38
 * ============================================================
 *
 * Sovereign High Availability Engine.
 *
 * Responsibilities:
 * - Maintain service availability.
 * - Manage primary and standby nodes.
 * - Detect unavailable nodes.
 * - Coordinate automatic failover.
 * - Prevent split-brain conditions.
 * - Maintain quorum.
 * - Track availability state.
 * - Integrate with resilience and security layers.
 *
 * HIGH AVAILABILITY IS NOT AUTHORITY.
 *
 * OWNER remains SUPREME.
 * STEWARD remains DELEGATED by OWNER.
 * ============================================================
 */

"use strict";

export type SovereignHANodeRole =
  | "PRIMARY"
  | "STANDBY"
  | "REPLICA"
  | "OBSERVER";

export type SovereignHANodeStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "UNREACHABLE"
  | "FAILED"
  | "ISOLATED"
  | "PROMOTING"
  | "DEMOTING";

export type SovereignHAClusterStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "FAILOVER"
  | "NO_QUORUM"
  | "FAILED";

export interface SovereignHANode {
  id: string;
  role: SovereignHANodeRole;
  status: SovereignHANodeStatus;

  priority: number;
  generation: number;

  lastHeartbeatAt?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignHACluster {
  id: string;

  status: SovereignHAClusterStatus;

  nodes: SovereignHANode[];

  primaryNodeId?: string;

  generation: number;

  minimumQuorum: number;

  createdAt: string;
  updatedAt: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignHAHeartbeat {
  clusterId: string;
  nodeId: string;

  healthy: boolean;

  generation: number;

  timestamp?: string;

  metadata?: Record<string, unknown>;
}

export interface SovereignHAContext {
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

export interface SovereignHAStore {
  saveCluster(
    cluster: SovereignHACluster
  ): Promise<void>;

  getCluster(
    clusterId: string
  ): Promise<SovereignHACluster | undefined>;

  listClusters(): Promise<SovereignHACluster[]>;
}

export interface SovereignHAExecutor {
  promote(input: {
    clusterId: string;
    nodeId: string;
    generation: number;
  }): Promise<{
    success: boolean;
    reason?: string;
  }>;

  demote(input: {
    clusterId: string;
    nodeId: string;
    generation: number;
  }): Promise<{
    success: boolean;
    reason?: string;
  }>;

  isolate(input: {
    clusterId: string;
    nodeId: string;
  }): Promise<{
    success: boolean;
    reason?: string;
  }>;
}

export interface SovereignHAEventBus {
  publish(event: {
    id: string;
    type: string;
    source: string;
    clusterId?: string;
    nodeId?: string;
    timestamp: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
}

export interface SovereignHAAudit {
  record(
    operation: string,
    subjectId: string | undefined,
    result: "SUCCESS" | "FAILED" | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void>;
}

export class SovereignHighAvailabilityEngine {
  public readonly id =
    "SOVEREIGN-HIGH-AVAILABILITY-38";

  public readonly version = "1.0.0";

  private store?: SovereignHAStore;
  private executor?: SovereignHAExecutor;
  private eventBus?: SovereignHAEventBus;
  private audit?: SovereignHAAudit;

  private failovers = new Set<string>();

  setStore(store: SovereignHAStore): void {
    this.store = store;
  }

  setExecutor(executor: SovereignHAExecutor): void {
    this.executor = executor;
  }

  setEventBus(eventBus: SovereignHAEventBus): void {
    this.eventBus = eventBus;
  }

  setAudit(audit: SovereignHAAudit): void {
    this.audit = audit;
  }

  async createCluster(
    input: {
      id: string;
      nodes: SovereignHANode[];
      minimumQuorum?: number;
      metadata?: Record<string, unknown>;
    },
    context: SovereignHAContext
  ): Promise<SovereignHACluster> {
    this.requireContext(context);

    if (!input.id.trim()) {
      throw new Error("HA cluster ID is required.");
    }

    if (input.nodes.length < 2) {
      throw new Error(
        "HA cluster requires at least two nodes."
      );
    }

    const existing =
      await this.requireStore().getCluster(input.id);

    if (existing) {
      throw new Error(
        `HA cluster already exists: ${input.id}`
      );
    }

    const nodeIds = new Set<string>();

    for (const node of input.nodes) {
      if (nodeIds.has(node.id)) {
        throw new Error(
          `Duplicate HA node: ${node.id}`
        );
      }

      nodeIds.add(node.id);
    }

    const minimumQuorum =
      input.minimumQuorum ??
      Math.floor(input.nodes.length / 2) + 1;

    if (
      minimumQuorum < 1 ||
      minimumQuorum > input.nodes.length
    ) {
      throw new Error("Invalid HA quorum.");
    }

    const primaryNodes =
      input.nodes.filter(
        (node) => node.role === "PRIMARY"
      );

    if (primaryNodes.length > 1) {
      throw new Error(
        "HA cluster cannot contain multiple primary nodes."
      );
    }

    const now = this.now();

    const cluster: SovereignHACluster = {
      id: input.id,

      status: "HEALTHY",

      nodes: [...input.nodes],

      primaryNodeId:
        primaryNodes[0]?.id,

      generation: 1,

      minimumQuorum,

      createdAt: now,
      updatedAt: now,

      metadata: input.metadata,
    };

    await this.requireStore().saveCluster(cluster);

    await this.publish(
      "ha.cluster.created",
      cluster.id,
      undefined,
      {
        nodes: cluster.nodes.length,
        quorum: cluster.minimumQuorum,
      }
    );

    return cluster;
  }

  async heartbeat(
    heartbeat: SovereignHAHeartbeat
  ): Promise<SovereignHACluster> {
    const cluster =
      await this.requireCluster(
        heartbeat.clusterId
      );

    const node =
      this.requireNode(
        cluster,
        heartbeat.nodeId
      );

    if (
      heartbeat.generation <
      cluster.generation
    ) {
      throw new Error(
        "Stale HA heartbeat generation."
      );
    }

    node.lastHeartbeatAt =
      heartbeat.timestamp ?? this.now();

    node.status =
      heartbeat.healthy
        ? "HEALTHY"
        : "DEGRADED";

    node.metadata = {
      ...node.metadata,
      ...heartbeat.metadata,
    };

    this.updateClusterStatus(cluster);

    cluster.updatedAt = this.now();

    await this.requireStore()
      .saveCluster(cluster);

    return cluster;
  }

  async detectFailures(
    clusterId: string,
    timeoutMs = 30000
  ): Promise<SovereignHACluster> {
    const cluster =
      await this.requireCluster(clusterId);

    const now = Date.now();

    for (const node of cluster.nodes) {
      if (!node.lastHeartbeatAt) {
        continue;
      }

      const elapsed =
        now -
        new Date(
          node.lastHeartbeatAt
        ).getTime();

      if (elapsed > timeoutMs) {
        node.status = "UNREACHABLE";
      }
    }

    this.updateClusterStatus(cluster);

    cluster.updatedAt = this.now();

    await this.requireStore()
      .saveCluster(cluster);

    return cluster;
  }

  async failover(
    clusterId: string,
    context: SovereignHAContext
  ): Promise<SovereignHACluster> {
    this.requireContext(context);

    if (this.failovers.has(clusterId)) {
      throw new Error(
        "HA failover already running."
      );
    }

    const cluster =
      await this.requireCluster(clusterId);

    if (!this.hasQuorum(cluster)) {
      cluster.status = "NO_QUORUM";

      await this.requireStore()
        .saveCluster(cluster);

      throw new Error(
        "HA failover denied because quorum is unavailable."
      );
    }

    const currentPrimary =
      cluster.primaryNodeId
        ? cluster.nodes.find(
            (node) =>
              node.id === cluster.primaryNodeId
          )
        : undefined;

    if (
      currentPrimary &&
      currentPrimary.status === "HEALTHY"
    ) {
      return cluster;
    }

    const candidate =
      this.selectCandidate(cluster);

    if (!candidate) {
      cluster.status = "FAILED";

      await this.requireStore()
        .saveCluster(cluster);

      throw new Error(
        "No healthy HA failover candidate available."
      );
    }

    this.failovers.add(clusterId);

    cluster.status = "FAILOVER";
    cluster.generation += 1;

    candidate.status = "PROMOTING";

    await this.requireStore()
      .saveCluster(cluster);

    try {
      if (currentPrimary) {
        const isolation =
          await this.requireExecutor().isolate({
            clusterId,
            nodeId: currentPrimary.id,
          });

        if (!isolation.success) {
          throw new Error(
            isolation.reason ??
              "Failed to isolate previous primary."
          );
        }

        currentPrimary.status = "ISOLATED";
        currentPrimary.role = "STANDBY";
      }

      const promotion =
        await this.requireExecutor().promote({
          clusterId,
          nodeId: candidate.id,
          generation: cluster.generation,
        });

      if (!promotion.success) {
        candidate.status = "FAILED";

        throw new Error(
          promotion.reason ??
            "HA candidate promotion failed."
        );
      }

      candidate.role = "PRIMARY";
      candidate.status = "HEALTHY";
      candidate.generation =
        cluster.generation;

      cluster.primaryNodeId =
        candidate.id;

      for (const node of cluster.nodes) {
        if (
          node.id !== candidate.id &&
          node.role === "PRIMARY"
        ) {
          node.role = "STANDBY";
        }
      }

      this.updateClusterStatus(cluster);

      cluster.updatedAt = this.now();

      await this.requireStore()
        .saveCluster(cluster);

      await this.publish(
        "ha.failover.success",
        cluster.id,
        candidate.id,
        {
          generation: cluster.generation,
          previousPrimary:
            currentPrimary?.id,
        }
      );

      await this.recordAudit(
        "ha.failover",
        cluster.id,
        "SUCCESS",
        {
          actorId: context.actorId,
          newPrimary: candidate.id,
          generation: cluster.generation,
        }
      );

      return cluster;
    } catch (error) {
      cluster.status = "FAILED";

      cluster.updatedAt = this.now();

      await this.requireStore()
        .saveCluster(cluster);

      await this.recordAudit(
        "ha.failover",
        cluster.id,
        "FAILED",
        {
          actorId: context.actorId,
          error:
            error instanceof Error
              ? error.message
              : "Unknown HA failover error.",
        }
      );

      throw error;
    } finally {
      this.failovers.delete(clusterId);
    }
  }

  private selectCandidate(
    cluster: SovereignHACluster
  ): SovereignHANode | undefined {
    return [...cluster.nodes]
      .filter(
        (node) =>
          node.id !==
            cluster.primaryNodeId &&
          node.status === "HEALTHY" &&
          (
            node.role === "STANDBY" ||
            node.role === "REPLICA"
          )
      )
      .sort(
        (a, b) =>
          b.priority - a.priority
      )[0];
  }

  private hasQuorum(
    cluster: SovereignHACluster
  ): boolean {
    const available =
      cluster.nodes.filter(
        (node) =>
          node.status === "HEALTHY" ||
          node.status === "DEGRADED"
      ).length;

    return (
      available >=
      cluster.minimumQuorum
    );
  }

  private updateClusterStatus(
    cluster: SovereignHACluster
  ): void {
    if (!this.hasQuorum(cluster)) {
      cluster.status = "NO_QUORUM";
      return;
    }

    const failed =
      cluster.nodes.some(
        (node) =>
          node.status === "FAILED" ||
          node.status === "UNREACHABLE"
      );

    const degraded =
      cluster.nodes.some(
        (node) =>
          node.status === "DEGRADED"
      );

    const primary =
      cluster.primaryNodeId
        ? cluster.nodes.find(
            (node) =>
              node.id ===
              cluster.primaryNodeId
          )
        : undefined;

    if (
      !primary ||
      primary.status !== "HEALTHY"
    ) {
      cluster.status = "DEGRADED";
      return;
    }

    cluster.status =
      failed || degraded
        ? "DEGRADED"
        : "HEALTHY";
  }

  async getCluster(
    clusterId: string,
    context: SovereignHAContext
  ): Promise<SovereignHACluster> {
    this.requireContext(context);

    return this.requireCluster(clusterId);
  }

  async listClusters(
    context: SovereignHAContext
  ): Promise<SovereignHACluster[]> {
    this.requireContext(context);

    return this.requireStore()
      .listClusters();
  }

  private requireContext(
    context: SovereignHAContext
  ): void {
    if (!context.authenticated) {
      throw new Error(
        "High availability requires authentication."
      );
    }

    if (!context.policyChecked) {
      throw new Error(
        "High availability requires policy verification."
      );
    }

    if (!context.securityChecked) {
      throw new Error(
        "High availability requires security verification."
      );
    }

    if (!context.authorizationChecked) {
      throw new Error(
        "High availability requires authorization verification."
      );
    }
  }

  private requireStore(): SovereignHAStore {
    if (!this.store) {
      throw new Error(
        "Sovereign HA store is not configured."
      );
    }

    return this.store;
  }

  private requireExecutor(): SovereignHAExecutor {
    if (!this.executor) {
      throw new Error(
        "Sovereign HA executor is not configured."
      );
    }

    return this.executor;
  }

  private async requireCluster(
    id: string
  ): Promise<SovereignHACluster> {
    const cluster =
      await this.requireStore()
        .getCluster(id);

    if (!cluster) {
      throw new Error(
        `HA cluster not found: ${id}`
      );
    }

    return cluster;
  }

  private requireNode(
    cluster: SovereignHACluster,
    nodeId: string
  ): SovereignHANode {
    const node =
      cluster.nodes.find(
        (item) =>
          item.id === nodeId
      );

    if (!node) {
      throw new Error(
        `HA node not found: ${nodeId}`
      );
    }

    return node;
  }

  private async publish(
    type: string,
    clusterId: string | undefined,
    nodeId: string | undefined,
    payload: Record<string, unknown>
  ): Promise<void> {
    if (!this.eventBus) {
      return;
    }

    await this.eventBus.publish({
      id: this.createId("HA-EVENT"),

      type,

      source: this.id,

      clusterId,

      nodeId,

      timestamp: this.now(),

      payload,
    });
  }

  private async recordAudit(
    operation: string,
    subjectId: string | undefined,
    result: "SUCCESS" | "FAILED" | "DENIED",
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.audit) {
      return;
    }

    await this.audit.record(
      operation,
      subjectId,
      result,
      metadata
    );
  }

  private createId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  private now(): string {
    return new Date().toISOString();
  }
}

export function createSovereignHighAvailabilityEngine():
  SovereignHighAvailabilityEngine {
  return new SovereignHighAvailabilityEngine();
}

export const SOVEREIGN_HIGH_AVAILABILITY_CONTRACT = {
  id: "SOVEREIGN-HIGH-AVAILABILITY-38",

  role:
    "CENTRAL_SOVEREIGN_HIGH_AVAILABILITY_ENGINE",

  authority: "NONE",

  highAvailabilityIsAuthority: false,

  ownerAuthority: "SUPREME",

  stewardAuthority: "DELEGATED",

  primaryStandbyManagement: true,

  replicationAwareness: true,

  heartbeatMonitoring: true,

  failureDetection: true,

  automaticFailover: true,

  quorumProtection: true,

  splitBrainProtection: true,

  nodeIsolation: true,

  generationFencing: true,

  candidateSelection: true,

  resilienceIntegration: true,

  securityIntegration: true,

  automaticPrivilegeElevation: false,

  ownerAuthorityFromAvailability: false,

  externalHighAvailabilitySaaSRequired: false,

  status: "FOUNDATION",
} as const;

/* ============================================================
 * END OF SOVEREIGN-HIGH-AVAILABILITY-38
 * ============================================================
 */

// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-LOAD-BALANCER-196.ts
// Sovereign Autonomous AI Load Balancer
// ============================================================

export type SovereignLoadNodeStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "DRAINING"
  | "OFFLINE";

export type SovereignLoadStrategy =
  | "LEAST_LOAD"
  | "LEAST_TASKS"
  | "WEIGHTED"
  | "CAPABILITY"
  | "ADAPTIVE";

export interface SovereignLoadNode {
  id: string;

  capabilities: string[];

  status: SovereignLoadNodeStatus;

  weight: number;

  activeTasks: number;

  maxTasks: number;

  cpuLoad: number;

  memoryLoad: number;

  networkLoad: number;

  latencyScore: number;

  failureRate: number;

  lastHeartbeat: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignLoadRequest {
  id: string;

  taskId: string;

  requiredCapabilities: string[];

  preferredNodeId?: string;

  priority:
    | "LOW"
    | "NORMAL"
    | "HIGH"
    | "CRITICAL";

  createdAt: number;
}

export interface SovereignLoadAssignment {
  id: string;

  requestId: string;

  taskId: string;

  nodeId: string;

  score: number;

  strategy: SovereignLoadStrategy;

  assignedAt: number;

  releasedAt?: number;

  active: boolean;
}

export interface SovereignLoadBalancerAdapter {
  inspect(
    node: SovereignLoadNode
  ): Promise<{
    reachable: boolean;

    cpuLoad: number;

    memoryLoad: number;

    networkLoad: number;

    latencyScore: number;

    failureRate: number;
  }>;

  persistNode?(
    node: SovereignLoadNode
  ): Promise<void>;

  persistAssignment?(
    assignment: SovereignLoadAssignment
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    nodeId?: string;

    taskId?: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAILoadBalancer {
  private readonly nodes =
    new Map<string, SovereignLoadNode>();

  private readonly assignments =
    new Map<string, SovereignLoadAssignment>();

  constructor(
    private readonly adapter:
      SovereignLoadBalancerAdapter,

    private strategy:
      SovereignLoadStrategy = "ADAPTIVE"
  ) {}

  public registerNode(
    node: SovereignLoadNode
  ): void {
    if (!node.id.trim()) {
      throw new Error(
        "Load-balancer node id is required."
      );
    }

    if (
      this.nodes.has(node.id)
    ) {
      throw new Error(
        `Load-balancer node already registered: ${node.id}`
      );
    }

    if (
      !Number.isFinite(node.maxTasks) ||
      node.maxTasks < 1
    ) {
      throw new Error(
        "Node maxTasks must be at least 1."
      );
    }

    node.weight =
      this.positive(
        node.weight,
        1
      );

    node.activeTasks =
      Math.max(
        0,
        node.activeTasks
      );

    node.cpuLoad =
      this.normalize(
        node.cpuLoad
      );

    node.memoryLoad =
      this.normalize(
        node.memoryLoad
      );

    node.networkLoad =
      this.normalize(
        node.networkLoad
      );

    node.latencyScore =
      this.normalize(
        node.latencyScore
      );

    node.failureRate =
      this.normalize(
        node.failureRate
      );

    node.capabilities = [
      ...new Set(
        node.capabilities
          .map(
            capability =>
              capability.trim()
          )
          .filter(Boolean)
      )
    ];

    this.nodes.set(
      node.id,
      this.cloneNode(node)
    );
  }

  public setStrategy(
    strategy: SovereignLoadStrategy
  ): void {
    this.strategy =
      strategy;
  }

  public async refresh():
    Promise<SovereignLoadNode[]> {
    for (
      const node of
        this.nodes.values()
    ) {
      if (
        node.status ===
        "DRAINING"
      ) {
        continue;
      }

      try {
        const state =
          await this.adapter.inspect(
            this.cloneNode(node)
          );

        if (!state.reachable) {
          node.status =
            "OFFLINE";

          await this.persistNode(
            node
          );

          continue;
        }

        node.cpuLoad =
          this.normalize(
            state.cpuLoad
          );

        node.memoryLoad =
          this.normalize(
            state.memoryLoad
          );

        node.networkLoad =
          this.normalize(
            state.networkLoad
          );

        node.latencyScore =
          this.normalize(
            state.latencyScore
          );

        node.failureRate =
          this.normalize(
            state.failureRate
          );

        node.lastHeartbeat =
          Date.now();

        node.status =
          this.resolveStatus(
            node
          );

        await this.persistNode(
          node
        );
      } catch {
        node.status =
          "OFFLINE";

        await this.persistNode(
          node
        );
      }
    }

    return this.listNodes();
  }

  public async assign(
    request: SovereignLoadRequest
  ): Promise<SovereignLoadAssignment> {
    this.validateRequest(
      request
    );

    const candidates =
      this.getCandidates(
        request
      );

    if (!candidates.length) {
      throw new Error(
        `No sovereign execution node available for task: ${request.taskId}`
      );
    }

    let selected:
      SovereignLoadNode;

    if (
      request.preferredNodeId
    ) {
      const preferred =
        candidates.find(
          node =>
            node.id ===
            request.preferredNodeId
        );

      selected =
        preferred ||
        this.selectBest(
          candidates,
          request
        );
    } else {
      selected =
        this.selectBest(
          candidates,
          request
        );
    }

    const score =
      this.calculateScore(
        selected,
        request
      );

    selected.activeTasks +=
      1;

    const assignment:
      SovereignLoadAssignment = {
        id: this.createId(
          "load-assignment"
        ),

        requestId:
          request.id,

        taskId:
          request.taskId,

        nodeId:
          selected.id,

        score,

        strategy:
          this.strategy,

        assignedAt:
          Date.now(),

        active: true
      };

    this.assignments.set(
      assignment.id,
      assignment
    );

    await this.persistNode(
      selected
    );

    if (
      this.adapter
        .persistAssignment
    ) {
      await this.adapter
        .persistAssignment(
          assignment
        );
    }

    await this.record(
      "AI_LOAD_ASSIGNED",
      selected.id,
      request.taskId,
      {
        assignmentId:
          assignment.id,

        strategy:
          this.strategy,

        score
      }
    );

    return {
      ...assignment
    };
  }

  public async release(
    assignmentId: string
  ): Promise<void> {
    const assignment =
      this.assignments.get(
        assignmentId
      );

    if (!assignment) {
      throw new Error(
        `Load assignment not found: ${assignmentId}`
      );
    }

    if (!assignment.active) {
      return;
    }

    const node =
      this.nodes.get(
        assignment.nodeId
      );

    if (node) {
      node.activeTasks =
        Math.max(
          0,
          node.activeTasks - 1
        );

      await this.persistNode(
        node
      );
    }

    assignment.active =
      false;

    assignment.releasedAt =
      Date.now();

    if (
      this.adapter
        .persistAssignment
    ) {
      await this.adapter
        .persistAssignment(
          assignment
        );
    }

    await this.record(
      "AI_LOAD_RELEASED",
      assignment.nodeId,
      assignment.taskId,
      {
        assignmentId:
          assignment.id
      }
    );
  }

  public drain(
    nodeId: string
  ): void {
    const node =
      this.getNode(
        nodeId
      );

    node.status =
      "DRAINING";
  }

  public activate(
    nodeId: string
  ): void {
    const node =
      this.getNode(
        nodeId
      );

    node.status =
      this.resolveStatus(
        node
      );
  }

  public listNodes():
    SovereignLoadNode[] {
    return [
      ...this.nodes.values()
    ].map(
      node =>
        this.cloneNode(
          node
        )
    );
  }

  private getCandidates(
    request: SovereignLoadRequest
  ): SovereignLoadNode[] {
    return [
      ...this.nodes.values()
    ].filter(
      node =>
        node.status ===
          "HEALTHY" &&

        node.activeTasks <
          node.maxTasks &&

        request.requiredCapabilities
          .every(
            capability =>
              node.capabilities
                .includes(
                  capability
                )
          )
    );
  }

  private selectBest(
    nodes: SovereignLoadNode[],
    request: SovereignLoadRequest
  ): SovereignLoadNode {
    return [...nodes]
      .sort(
        (a, b) =>
          this.calculateScore(
            b,
            request
          ) -
          this.calculateScore(
            a,
            request
          )
      )[0];
  }

  private calculateScore(
    node: SovereignLoadNode,
    request: SovereignLoadRequest
  ): number {
    const taskCapacity =
      1 -
      this.normalize(
        node.activeTasks /
          node.maxTasks
      );

    const cpu =
      1 -
      node.cpuLoad;

    const memory =
      1 -
      node.memoryLoad;

    const network =
      1 -
      node.networkLoad;

    const reliability =
      1 -
      node.failureRate;

    const latency =
      node.latencyScore;

    const capabilityScore =
      request.requiredCapabilities
        .length === 0
        ? 1
        : request.requiredCapabilities
            .filter(
              capability =>
                node.capabilities
                  .includes(
                    capability
                  )
            ).length /
          request.requiredCapabilities
            .length;

    switch (this.strategy) {
      case "LEAST_TASKS":
        return taskCapacity;

      case "LEAST_LOAD":
        return this.normalize(
          (
            cpu +
            memory +
            network
          ) /
            3
        );

      case "WEIGHTED":
        return this.normalize(
          taskCapacity *
            0.4 +
          reliability *
            0.3 +
          latency *
            0.2 +
          this.normalize(
            node.weight / 10
          ) *
            0.1
        );

      case "CAPABILITY":
        return this.normalize(
          capabilityScore *
            0.7 +
          reliability *
            0.3
        );

      case "ADAPTIVE":
      default:
        return this.normalize(
          taskCapacity *
            0.20 +
          cpu *
            0.15 +
          memory *
            0.15 +
          network *
            0.10 +
          reliability *
            0.15 +
          latency *
            0.10 +
          capabilityScore *
            0.15
        );
    }
  }

  private resolveStatus(
    node: SovereignLoadNode
  ): SovereignLoadNodeStatus {
    if (
      node.status ===
      "DRAINING"
    ) {
      return "DRAINING";
    }

    if (
      node.failureRate >=
        0.50 ||
      node.cpuLoad >=
        0.95 ||
      node.memoryLoad >=
        0.95
    ) {
      return "DEGRADED";
    }

    return "HEALTHY";
  }

  private validateRequest(
    request: SovereignLoadRequest
  ): void {
    if (!request.id.trim()) {
      throw new Error(
        "Load request id is required."
      );
    }

    if (!request.taskId.trim()) {
      throw new Error(
        "Load request taskId is required."
      );
    }

    request.requiredCapabilities = [
      ...new Set(
        request.requiredCapabilities
          .map(
            capability =>
              capability.trim()
          )
          .filter(Boolean)
      )
    ];
  }

  private getNode(
    nodeId: string
  ): SovereignLoadNode {
    const node =
      this.nodes.get(
        nodeId
      );

    if (!node) {
      throw new Error(
        `Load-balancer node not found: ${nodeId}`
      );
    }

    return node;
  }

  private async persistNode(
    node: SovereignLoadNode
  ): Promise<void> {
    if (
      this.adapter.persistNode
    ) {
      await this.adapter
        .persistNode(
          node
        );
    }
  }

  private async record(
    type: string,
    nodeId?: string,
    taskId?: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,
          nodeId,
          taskId,
          timestamp:
            Date.now(),
          data
        });
    }
  }

  private normalize(
    value: number
  ): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        1,
        value
      )
    );
  }

  private positive(
    value: number,
    fallback: number
  ): number {
    return (
      Number.isFinite(value) &&
      value > 0
    )
      ? value
      : fallback;
  }

  private cloneNode(
    node: SovereignLoadNode
  ): SovereignLoadNode {
    return {
      ...node,

      capabilities: [
        ...node.capabilities
      ],

      metadata:
        node.metadata
          ? {
              ...node.metadata
            }
          : undefined
    };
  }

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}

export default SovereignAILoadBalancer;

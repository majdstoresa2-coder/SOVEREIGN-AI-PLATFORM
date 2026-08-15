// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-TASK-GRAPH-192.ts
// Sovereign Autonomous AI Task Graph Engine
// ============================================================

export type SovereignTaskGraphStatus =
  | "PENDING"
  | "READY"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "BLOCKED"
  | "SKIPPED";

export type SovereignTaskGraphPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export interface SovereignTaskNode {
  id: string;

  goalId: string;

  objective: string;

  capability: string;

  action: string;

  priority: SovereignTaskGraphPriority;

  dependencies: string[];

  status: SovereignTaskGraphStatus;

  autonomous: boolean;

  required: boolean;

  estimatedWeight: number;

  attempts: number;

  maxAttempts: number;

  input?: Record<string, unknown>;

  result?: unknown;

  error?: string;

  createdAt: number;

  startedAt?: number;

  completedAt?: number;

  metadata?: Record<string, unknown>;
}

export interface SovereignTaskGraph {
  id: string;

  parentGoalId: string;

  nodes: SovereignTaskNode[];

  executionLayers: string[][];

  criticalPath: string[];

  readyNodes: string[];

  blockedNodes: string[];

  completedNodes: string[];

  failedNodes: string[];

  createdAt: number;

  updatedAt: number;
}

export interface SovereignTaskGraphAdapter {
  createTasks(
    goalId: string
  ): Promise<
    Omit<
      SovereignTaskNode,
      | "id"
      | "goalId"
      | "status"
      | "attempts"
      | "createdAt"
    >[]
  >;

  capabilityAvailable?(
    capability: string
  ): Promise<boolean>;

  verifyTask?(
    task: SovereignTaskNode
  ): Promise<boolean>;

  persistGraph?(
    graph: SovereignTaskGraph
  ): Promise<void>;

  recordEvent?(event: {
    type: string;

    graphId?: string;

    taskId?: string;

    timestamp: number;

    data?: Record<string, unknown>;
  }): Promise<void>;
}

export class SovereignAITaskGraph {
  constructor(
    private readonly adapter:
      SovereignTaskGraphAdapter
  ) {}

  public async create(
    parentGoalId: string
  ): Promise<SovereignTaskGraph> {
    if (!parentGoalId.trim()) {
      throw new Error(
        "Task graph parent goal id is required."
      );
    }

    const generated =
      await this.adapter.createTasks(
        parentGoalId
      );

    if (!generated.length) {
      throw new Error(
        "Task graph requires at least one task."
      );
    }

    const nodes =
      generated.map(
        task =>
          this.createNode(
            parentGoalId,
            task
          )
      );

    this.validateUniqueNodes(
      nodes
    );

    this.validateDependencies(
      nodes
    );

    this.detectCycles(
      nodes
    );

    await this.validateCapabilities(
      nodes
    );

    await this.verifyNodes(
      nodes
    );

    this.resolveStates(
      nodes
    );

    const graph:
      SovereignTaskGraph = {
        id: this.createId(
          "task-graph"
        ),

        parentGoalId,

        nodes,

        executionLayers:
          this.buildExecutionLayers(
            nodes
          ),

        criticalPath:
          this.calculateCriticalPath(
            nodes
          ),

        readyNodes: [],

        blockedNodes: [],

        completedNodes: [],

        failedNodes: [],

        createdAt:
          Date.now(),

        updatedAt:
          Date.now()
      };

    this.refreshCollections(
      graph
    );

    await this.persist(
      graph
    );

    await this.record(
      "AI_TASK_GRAPH_CREATED",
      graph.id,
      undefined,
      {
        parentGoalId,

        nodes:
          graph.nodes.length,

        layers:
          graph.executionLayers.length,

        criticalPath:
          graph.criticalPath
      }
    );

    return this.cloneGraph(
      graph
    );
  }

  public async markRunning(
    graph: SovereignTaskGraph,
    taskId: string
  ): Promise<SovereignTaskGraph> {
    const task =
      this.findNode(
        graph,
        taskId
      );

    if (
      task.status !== "READY"
    ) {
      throw new Error(
        `Task is not ready: ${taskId}`
      );
    }

    task.status =
      "RUNNING";

    task.startedAt =
      Date.now();

    task.attempts += 1;

    graph.updatedAt =
      Date.now();

    this.refreshCollections(
      graph
    );

    await this.persist(
      graph
    );

    await this.record(
      "AI_TASK_RUNNING",
      graph.id,
      task.id
    );

    return this.cloneGraph(
      graph
    );
  }

  public async markCompleted(
    graph: SovereignTaskGraph,
    taskId: string,
    result?: unknown
  ): Promise<SovereignTaskGraph> {
    const task =
      this.findNode(
        graph,
        taskId
      );

    task.status =
      "COMPLETED";

    task.result =
      result;

    task.error =
      undefined;

    task.completedAt =
      Date.now();

    this.resolveStates(
      graph.nodes
    );

    graph.updatedAt =
      Date.now();

    this.refreshCollections(
      graph
    );

    await this.persist(
      graph
    );

    await this.record(
      "AI_TASK_COMPLETED",
      graph.id,
      task.id
    );

    return this.cloneGraph(
      graph
    );
  }

  public async markFailed(
    graph: SovereignTaskGraph,
    taskId: string,
    error: unknown
  ): Promise<SovereignTaskGraph> {
    const task =
      this.findNode(
        graph,
        taskId
      );

    task.error =
      error instanceof Error
        ? error.message
        : String(error);

    if (
      task.attempts <
      task.maxAttempts
    ) {
      task.status =
        "READY";
    } else {
      task.status =
        "FAILED";

      task.completedAt =
        Date.now();
    }

    this.resolveStates(
      graph.nodes
    );

    graph.updatedAt =
      Date.now();

    this.refreshCollections(
      graph
    );

    await this.persist(
      graph
    );

    await this.record(
      task.status === "FAILED"
        ? "AI_TASK_FAILED"
        : "AI_TASK_RETRY_READY",
      graph.id,
      task.id,
      {
        attempts:
          task.attempts,

        maxAttempts:
          task.maxAttempts,

        error:
          task.error
      }
    );

    return this.cloneGraph(
      graph
    );
  }

  public getReady(
    graph: SovereignTaskGraph
  ): SovereignTaskNode[] {
    return graph.nodes
      .filter(
        node =>
          node.status ===
          "READY"
      )
      .sort(
        (a, b) => {
          const priority =
            this.priorityWeight(
              b.priority
            ) -
            this.priorityWeight(
              a.priority
            );

          if (priority !== 0) {
            return priority;
          }

          return (
            b.estimatedWeight -
            a.estimatedWeight
          );
        }
      )
      .map(
        node =>
          this.cloneNode(
            node
          )
      );
  }

  public getParallelBatch(
    graph: SovereignTaskGraph,
    limit = 10
  ): SovereignTaskNode[] {
    return this.getReady(
      graph
    ).slice(
      0,
      Math.max(
        1,
        limit
      )
    );
  }

  public isComplete(
    graph: SovereignTaskGraph
  ): boolean {
    return graph.nodes.every(
      node =>
        node.status ===
          "COMPLETED" ||
        node.status ===
          "SKIPPED"
    );
  }

  public hasFailure(
    graph: SovereignTaskGraph
  ): boolean {
    return graph.nodes.some(
      node =>
        node.status ===
          "FAILED" ||
        (
          node.required &&
          node.status ===
            "BLOCKED"
        )
    );
  }

  private createNode(
    goalId: string,
    task: Omit<
      SovereignTaskNode,
      | "id"
      | "goalId"
      | "status"
      | "attempts"
      | "createdAt"
    >
  ): SovereignTaskNode {
    return {
      ...task,

      id: this.createId(
        "task"
      ),

      goalId,

      objective:
        task.objective.trim(),

      capability:
        task.capability.trim(),

      action:
        task.action.trim(),

      dependencies: [
        ...new Set(
          task.dependencies ||
          []
        )
      ],

      status:
        "PENDING",

      estimatedWeight:
        this.normalizeWeight(
          task.estimatedWeight
        ),

      attempts: 0,

      maxAttempts:
        Math.max(
          1,
          task.maxAttempts || 3
        ),

      createdAt:
        Date.now()
    };
  }

  private resolveStates(
    nodes: SovereignTaskNode[]
  ): void {
    for (const node of nodes) {
      if (
        node.status ===
          "RUNNING" ||
        node.status ===
          "COMPLETED" ||
        node.status ===
          "FAILED" ||
        node.status ===
          "SKIPPED"
      ) {
        continue;
      }

      const dependencies =
        node.dependencies.map(
          dependencyId =>
            nodes.find(
              candidate =>
                candidate.id ===
                dependencyId
            )
        );

      if (
        dependencies.some(
          dependency =>
            !dependency
        )
      ) {
        node.status =
          "BLOCKED";

        node.error =
          "Task dependency does not exist.";

        continue;
      }

      const dependencyFailed =
        dependencies.some(
          dependency =>
            dependency?.status ===
              "FAILED" ||
            dependency?.status ===
              "BLOCKED"
        );

      if (dependencyFailed) {
        node.status =
          "BLOCKED";

        node.error =
          "Required task dependency failed.";

        continue;
      }

      const dependenciesComplete =
        dependencies.every(
          dependency =>
            dependency?.status ===
              "COMPLETED" ||
            dependency?.status ===
              "SKIPPED"
        );

      node.status =
        dependenciesComplete
          ? "READY"
          : "PENDING";
    }
  }

  private buildExecutionLayers(
    nodes: SovereignTaskNode[]
  ): string[][] {
    const remaining =
      new Set(
        nodes.map(
          node =>
            node.id
        )
      );

    const completed =
      new Set<string>();

    const layers:
      string[][] = [];

    while (
      remaining.size > 0
    ) {
      const layer =
        nodes
          .filter(
            node =>
              remaining.has(
                node.id
              ) &&
              node.dependencies.every(
                dependency =>
                  completed.has(
                    dependency
                  )
              )
          )
          .map(
            node =>
              node.id
          );

      if (!layer.length) {
        throw new Error(
          "Unable to build task execution layers."
        );
      }

      layers.push(
        layer
      );

      for (const id of layer) {
        remaining.delete(
          id
        );

        completed.add(
          id
        );
      }
    }

    return layers;
  }

  private calculateCriticalPath(
    nodes: SovereignTaskNode[]
  ): string[] {
    const memo =
      new Map<
        string,
        {
          weight: number;
          path: string[];
        }
      >();

    const calculate = (
      node: SovereignTaskNode
    ): {
      weight: number;
      path: string[];
    } => {
      const cached =
        memo.get(
          node.id
        );

      if (cached) {
        return cached;
      }

      if (
        !node.dependencies.length
      ) {
        const result = {
          weight:
            node.estimatedWeight,

          path: [
            node.id
          ]
        };

        memo.set(
          node.id,
          result
        );

        return result;
      }

      const candidates =
        node.dependencies
          .map(
            dependencyId =>
              nodes.find(
                candidate =>
                  candidate.id ===
                  dependencyId
              )
          )
          .filter(
            (
              dependency
            ): dependency is SovereignTaskNode =>
              !!dependency
          )
          .map(
            dependency =>
              calculate(
                dependency
              )
          );

      const longest =
        candidates.sort(
          (a, b) =>
            b.weight -
            a.weight
        )[0] || {
          weight: 0,
          path: []
        };

      const result = {
        weight:
          longest.weight +
          node.estimatedWeight,

        path: [
          ...longest.path,
          node.id
        ]
      };

      memo.set(
        node.id,
        result
      );

      return result;
    };

    const paths =
      nodes.map(
        node =>
          calculate(
            node
          )
      );

    return (
      paths.sort(
        (a, b) =>
          b.weight -
          a.weight
      )[0]?.path || []
    );
  }

  private validateUniqueNodes(
    nodes: SovereignTaskNode[]
  ): void {
    const ids =
      new Set<string>();

    for (const node of nodes) {
      if (ids.has(node.id)) {
        throw new Error(
          `Duplicate task node: ${node.id}`
        );
      }

      ids.add(
        node.id
      );

      if (!node.objective) {
        throw new Error(
          "Task objective is required."
        );
      }

      if (!node.capability) {
        throw new Error(
          "Task capability is required."
        );
      }

      if (!node.action) {
        throw new Error(
          "Task action is required."
        );
      }
    }
  }

  private validateDependencies(
    nodes: SovereignTaskNode[]
  ): void {
    const ids =
      new Set(
        nodes.map(
          node =>
            node.id
        )
      );

    for (const node of nodes) {
      for (
        const dependency of
          node.dependencies
      ) {
        if (
          dependency === node.id
        ) {
          throw new Error(
            `Task cannot depend on itself: ${node.id}`
          );
        }

        if (!ids.has(dependency)) {
          throw new Error(
            `Unknown task dependency: ${dependency}`
          );
        }
      }
    }
  }

  private detectCycles(
    nodes: SovereignTaskNode[]
  ): void {
    const visiting =
      new Set<string>();

    const visited =
      new Set<string>();

    const visit = (
      node: SovereignTaskNode
    ): void => {
      if (
        visiting.has(
          node.id
        )
      ) {
        throw new Error(
          `Task graph cycle detected: ${node.id}`
        );
      }

      if (
        visited.has(
          node.id
        )
      ) {
        return;
      }

      visiting.add(
        node.id
      );

      for (
        const dependencyId of
          node.dependencies
      ) {
        const dependency =
          nodes.find(
            candidate =>
              candidate.id ===
              dependencyId
          );

        if (dependency) {
          visit(
            dependency
          );
        }
      }

      visiting.delete(
        node.id
      );

      visited.add(
        node.id
      );
    };

    for (const node of nodes) {
      visit(node);
    }
  }

  private async validateCapabilities(
    nodes: SovereignTaskNode[]
  ): Promise<void> {
    if (
      !this.adapter
        .capabilityAvailable
    ) {
      return;
    }

    for (const node of nodes) {
      const available =
        await this.adapter
          .capabilityAvailable(
            node.capability
          );

      if (!available) {
        node.status =
          "BLOCKED";

        node.error =
          `Capability unavailable: ${node.capability}`;
      }
    }
  }

  private async verifyNodes(
    nodes: SovereignTaskNode[]
  ): Promise<void> {
    if (
      !this.adapter.verifyTask
    ) {
      return;
    }

    for (const node of nodes) {
      if (
        node.status ===
        "BLOCKED"
      ) {
        continue;
      }

      const verified =
        await this.adapter
          .verifyTask(
            node
          );

      if (!verified) {
        node.status =
          "BLOCKED";

        node.error =
          "Task verification failed.";
      }
    }
  }

  private refreshCollections(
    graph: SovereignTaskGraph
  ): void {
    graph.readyNodes =
      graph.nodes
        .filter(
          node =>
            node.status ===
            "READY"
        )
        .map(
          node =>
            node.id
        );

    graph.blockedNodes =
      graph.nodes
        .filter(
          node =>
            node.status ===
            "BLOCKED"
        )
        .map(
          node =>
            node.id
        );

    graph.completedNodes =
      graph.nodes
        .filter(
          node =>
            node.status ===
            "COMPLETED"
        )
        .map(
          node =>
            node.id
        );

    graph.failedNodes =
      graph.nodes
        .filter(
          node =>
            node.status ===
            "FAILED"
        )
        .map(
          node =>
            node.id
        );
  }

  private findNode(
    graph: SovereignTaskGraph,
    taskId: string
  ): SovereignTaskNode {
    const node =
      graph.nodes.find(
        item =>
          item.id ===
          taskId
      );

    if (!node) {
      throw new Error(
        `Task node not found: ${taskId}`
      );
    }

    return node;
  }

  private normalizeWeight(
    weight: number
  ): number {
    if (
      !Number.isFinite(weight) ||
      weight <= 0
    ) {
      return 1;
    }

    return weight;
  }

  private priorityWeight(
    priority:
      SovereignTaskGraphPriority
  ): number {
    switch (priority) {
      case "CRITICAL":
        return 4;

      case "HIGH":
        return 3;

      case "NORMAL":
        return 2;

      case "LOW":
      default:
        return 1;
    }
  }

  private async persist(
    graph: SovereignTaskGraph
  ): Promise<void> {
    if (
      this.adapter.persistGraph
    ) {
      await this.adapter
        .persistGraph(
          graph
        );
    }
  }

  private async record(
    type: string,
    graphId?: string,
    taskId?: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    if (
      this.adapter.recordEvent
    ) {
      await this.adapter
        .recordEvent({
          type,
          graphId,
          taskId,
          timestamp:
            Date.now(),
          data
        });
    }
  }

  private cloneNode(
    node: SovereignTaskNode
  ): SovereignTaskNode {
    return {
      ...node,

      dependencies: [
        ...node.dependencies
      ],

      input:
        node.input
          ? {
              ...node.input
            }
          : undefined,

      metadata:
        node.metadata
          ? {
              ...node.metadata
            }
          : undefined
    };
  }

  private cloneGraph(
    graph: SovereignTaskGraph
  ): SovereignTaskGraph {
    return {
      ...graph,

      nodes:
        graph.nodes.map(
          node =>
            this.cloneNode(
              node
            )
        ),

      executionLayers:
        graph.executionLayers.map(
          layer => [
            ...layer
          ]
        ),

      criticalPath: [
        ...graph.criticalPath
      ],

      readyNodes: [
        ...graph.readyNodes
      ],

      blockedNodes: [
        ...graph.blockedNodes
      ],

      completedNodes: [
        ...graph.completedNodes
      ],

      failedNodes: [
        ...graph.failedNodes
      ]
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

export default SovereignAITaskGraph;

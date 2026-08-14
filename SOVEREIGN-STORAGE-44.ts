/**
 * ============================================================
 * SOVEREIGN AI PLATFORM
 * SOVEREIGN-STORAGE-44
 * ============================================================
 *
 * Sovereign Storage Engine.
 *
 * Responsibilities:
 * - Manage sovereign platform storage.
 * - Manage storage pools and nodes.
 * - Store and retrieve sovereign objects.
 * - Enforce encryption and integrity requirements.
 * - Track object replicas.
 * - Detect unavailable storage nodes.
 * - Enforce sovereign-controlled storage.
 * - Integrate with database, backup and recovery.
 *
 * STORAGE IS NOT AUTHORITY.
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

/* ============================================================
 * 1. STORAGE TYPE
 * ============================================================
 */

export type SovereignStorageType =
  | "OBJECT"
  | "FILE"
  | "BLOCK"
  | "ARCHIVE"
  | "CACHE"
  | "SYSTEM";

/* ============================================================
 * 2. OBJECT TYPE
 * ============================================================
 */

export type SovereignStoredObjectType =
  | "GAME"
  | "ASSET"
  | "MODEL"
  | "MEDIA"
  | "DOCUMENT"
  | "BACKUP"
  | "CONFIGURATION"
  | "LOG"
  | "PACKAGE"
  | "SYSTEM";

/* ============================================================
 * 3. NODE STATUS
 * ============================================================
 */

export type SovereignStorageNodeStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "READ_ONLY"
  | "UNREACHABLE"
  | "FAILED"
  | "MAINTENANCE";

/* ============================================================
 * 4. POOL STATUS
 * ============================================================
 */

export type SovereignStoragePoolStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "READ_ONLY"
  | "FULL"
  | "FAILED"
  | "OFFLINE";

/* ============================================================
 * 5. OBJECT STATUS
 * ============================================================
 */

export type SovereignStoredObjectStatus =
  | "ACTIVE"
  | "REPLICATING"
  | "DEGRADED"
  | "CORRUPTED"
  | "QUARANTINED"
  | "DELETED";

/* ============================================================
 * 6. STORAGE NODE
 * ============================================================
 */

export interface SovereignStorageNode {
  id: string;

  host: string;

  region?: string;

  facilityId?: string;

  capacityBytes: number;

  usedBytes: number;

  status: SovereignStorageNodeStatus;

  sovereignControlled: boolean;

  encryptionEnabled: boolean;

  lastHealthCheckAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 7. STORAGE POOL
 * ============================================================
 */

export interface SovereignStoragePool {
  id: string;

  name: string;

  type: SovereignStorageType;

  status: SovereignStoragePoolStatus;

  nodes: SovereignStorageNode[];

  replicationFactor: number;

  encryptionRequired: boolean;

  integrityVerificationRequired: boolean;

  externalManagedStorage: boolean;

  createdAt: string;

  updatedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 8. OBJECT REPLICA
 * ============================================================
 */

export interface SovereignObjectReplica {
  id: string;

  nodeId: string;

  location: string;

  checksum: string;

  sizeBytes: number;

  healthy: boolean;

  createdAt: string;

  lastVerifiedAt?: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 9. STORED OBJECT
 * ============================================================
 */

export interface SovereignStoredObject {
  id: string;

  poolId: string;

  type: SovereignStoredObjectType;

  name: string;

  status: SovereignStoredObjectStatus;

  sizeBytes: number;

  checksum: string;

  encrypted: boolean;

  immutable: boolean;

  replicas: SovereignObjectReplica[];

  createdBy: string;

  createdAt: string;

  updatedAt: string;

  metadata?: Record<string, unknown>;
}

/* ============================================================
 * 10. CONTEXT
 * ============================================================
 */

export interface SovereignStorageContext {
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

/* ============================================================
 * 11. STORE
 * ============================================================
 */

export interface SovereignStorageStore {
  savePool(
    pool: SovereignStoragePool
  ): Promise<void>;

  getPool(
    poolId: string
  ): Promise<SovereignStoragePool | undefined>;

  listPools():
    Promise<SovereignStoragePool[]>;

  saveObject(
    object: SovereignStoredObject
  ): Promise<void>;

  getObject(
    objectId: string
  ): Promise<SovereignStoredObject | undefined>;

  listObjects(
    poolId: string
  ): Promise<SovereignStoredObject[]>;
}

/* ============================================================
 * 12. STORAGE ADAPTER
 * ============================================================
 */

export interface SovereignStorageAdapter {
  write(input: {
    pool: SovereignStoragePool;

    node: SovereignStorageNode;

    objectId: string;

    data: Buffer | Uint8Array;

    encrypted: boolean;
  }): Promise<{
    success: boolean;

    location?: string;

    sizeBytes?: number;

    checksum?: string;

    reason?: string;
  }>;

  read(input: {
    pool: SovereignStoragePool;

    object: SovereignStoredObject;

    replica: SovereignObjectReplica;
  }): Promise<
    Buffer | Uint8Array
  >;

  remove(input: {
    pool: SovereignStoragePool;

    object: SovereignStoredObject;

    replica: SovereignObjectReplica;
  }): Promise<{
    success: boolean;

    reason?: string;
  }>;

  healthCheck(input: {
    pool: SovereignStoragePool;

    node: SovereignStorageNode;
  }): Promise<{
    healthy: boolean;

    usedBytes?: number;

    reason?: string;
  }>;
}

/* ============================================================
 * 13. POLICY BRIDGE
 * ============================================================
 */

export interface SovereignStoragePolicyBridge {
  authorize(input: {
    actorId: string;

    authority:
      SovereignStorageContext["authority"];

    operation:
      | "WRITE"
      | "READ"
      | "DELETE"
      | "VERIFY";

    poolId: string;

    objectId?: string;
  }): Promise<{
    allowed: boolean;

    reason?: string;
  }>;
}

/* ============================================================
 * 14. EVENT BUS
 * ============================================================
 */

export interface SovereignStorageEventBus {
  publish(event: {
    id: string;

    type: string;

    source: string;

    poolId?: string;

    objectId?: string;

    timestamp: string;

    payload: Record<string, unknown>;
  }): Promise<void>;
}

/* ============================================================
 * 15. AUDIT
 * ============================================================
 */

export interface SovereignStorageAudit {
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

/* ============================================================
 * 16. ENGINE
 * ============================================================
 */

export class SovereignStorageEngine {
  public readonly id =
    "SOVEREIGN-STORAGE-44";

  public readonly version =
    "1.0.0";

  private store?: SovereignStorageStore;

  private adapter?: SovereignStorageAdapter;

  private policyBridge?: SovereignStoragePolicyBridge;

  private eventBus?: SovereignStorageEventBus;

  private audit?: SovereignStorageAudit;

  private activeWrites =
    new Set<string>();

  /* ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  setStore(
    store: SovereignStorageStore
  ): void {
    this.store = store;
  }

  setAdapter(
    adapter: SovereignStorageAdapter
  ): void {
    this.adapter = adapter;
  }

  setPolicyBridge(
    bridge: SovereignStoragePolicyBridge
  ): void {
    this.policyBridge = bridge;
  }

  setEventBus(
    eventBus: SovereignStorageEventBus
  ): void {
    this.eventBus = eventBus;
  }

  setAudit(
    audit: SovereignStorageAudit
  ): void {
    this.audit = audit;
  }

  /* ==========================================================
   * REGISTER POOL
   * ==========================================================
   */

  async registerPool(
    input: {
      id: string;

      name: string;

      type: SovereignStorageType;

      nodes: SovereignStorageNode[];

      replicationFactor?: number;

      encryptionRequired?: boolean;

      integrityVerificationRequired?: boolean;

      externalManagedStorage?: boolean;

      metadata?: Record<string, unknown>;
    },
    context: SovereignStorageContext
  ): Promise<SovereignStoragePool> {
    this.requireContext(context);

    if (!input.id.trim()) {
      throw new Error(
        "Storage pool ID is required."
      );
    }

    if (input.nodes.length === 0) {
      throw new Error(
        "Storage pool requires at least one node."
      );
    }

    const existing =
      await this.requireStore()
        .getPool(input.id);

    if (existing) {
      throw new Error(
        `Storage pool already exists: ${input.id}`
      );
    }

    const nodeIds =
      new Set<string>();

    for (const node of input.nodes) {
      if (nodeIds.has(node.id)) {
        throw new Error(
          `Duplicate storage node: ${node.id}`
        );
      }

      nodeIds.add(node.id);

      if (
        !node.sovereignControlled
      ) {
        throw new Error(
          `Storage node is not sovereign controlled: ${node.id}`
        );
      }

      if (
        !node.encryptionEnabled
      ) {
        throw new Error(
          `Storage node encryption is required: ${node.id}`
        );
      }

      if (
        node.capacityBytes <= 0
      ) {
        throw new Error(
          `Invalid storage capacity: ${node.id}`
        );
      }
    }

    if (
      input.externalManagedStorage ===
      true
    ) {
      throw new Error(
        "Sovereign storage cannot require an external managed storage service."
      );
    }

    const replicationFactor =
      input.replicationFactor ?? 2;

    if (
      replicationFactor < 1 ||
      replicationFactor >
        input.nodes.length
    ) {
      throw new Error(
        "Invalid storage replication factor."
      );
    }

    const now = this.now();

    const pool:
      SovereignStoragePool = {
      id: input.id,

      name: input.name,

      type: input.type,

      status: "HEALTHY",

      nodes: [...input.nodes],

      replicationFactor,

      encryptionRequired:
        input.encryptionRequired ??
        true,

      integrityVerificationRequired:
        input.integrityVerificationRequired ??
        true,

      externalManagedStorage:
        false,

      createdAt: now,

      updatedAt: now,

      metadata:
        input.metadata,
    };

    await this.requireStore()
      .savePool(pool);

    await this.publish(
      "storage.pool.registered",
      pool.id,
      undefined,
      {
        type: pool.type,

        nodes:
          pool.nodes.length,

        replicationFactor:
          pool.replicationFactor,
      }
    );

    return pool;
  }

  /* ==========================================================
   * WRITE OBJECT
   * ==========================================================
   */

  async writeObject(
    input: {
      poolId: string;

      objectId?: string;

      name: string;

      type: SovereignStoredObjectType;

      data: Buffer | Uint8Array;

      immutable?: boolean;

      metadata?: Record<string, unknown>;
    },
    context: SovereignStorageContext
  ): Promise<SovereignStoredObject> {
    this.requireContext(context);

    const pool =
      await this.requirePool(
        input.poolId
      );

    this.requireWritablePool(pool);

    const objectId =
      input.objectId ??
      this.createId("OBJECT");

    if (
      this.activeWrites.has(
        objectId
      )
    ) {
      throw new Error(
        "Storage object write is already running."
      );
    }

    const existing =
      await this.requireStore()
        .getObject(objectId);

    if (existing) {
      throw new Error(
        `Storage object already exists: ${objectId}`
      );
    }

    const authorization =
      await this.requirePolicyBridge()
        .authorize({
          actorId:
            context.actorId,

          authority:
            context.authority,

          operation:
            "WRITE",

          poolId:
            pool.id,

          objectId,
        });

    if (!authorization.allowed) {
      await this.recordAudit(
        "storage.write",
        objectId,
        "DENIED",
        {
          actorId:
            context.actorId,

          reason:
            authorization.reason,
        }
      );

      throw new Error(
        authorization.reason ??
          "Storage write denied."
      );
    }

    this.activeWrites.add(
      objectId
    );

    try {
      const checksum =
        this.checksum(
          input.data
        );

      const candidates =
        pool.nodes
          .filter(
            (node) =>
              node.status ===
                "HEALTHY" &&
              (
                node.capacityBytes -
                node.usedBytes
              ) >=
                input.data.byteLength
          )
          .sort(
            (a, b) =>
              a.usedBytes -
              b.usedBytes
          );

      if (
        candidates.length <
        pool.replicationFactor
      ) {
        throw new Error(
          "Insufficient healthy sovereign storage nodes."
        );
      }

      const selected =
        candidates.slice(
          0,
          pool.replicationFactor
        );

      const replicas:
        SovereignObjectReplica[] =
          [];

      for (const node of selected) {
        const result =
          await this.requireAdapter()
            .write({
              pool,

              node,

              objectId,

              data:
                input.data,

              encrypted:
                pool.encryptionRequired,
            });

        if (
          !result.success ||
          !result.location
        ) {
          throw new Error(
            result.reason ??
              `Storage write failed on node: ${node.id}`
          );
        }

        if (
          result.checksum &&
          result.checksum !==
            checksum
        ) {
          throw new Error(
            `Storage checksum mismatch on node: ${node.id}`
          );
        }

        replicas.push({
          id: this.createId(
            "REPLICA"
          ),

          nodeId:
            node.id,

          location:
            result.location,

          checksum:
            result.checksum ??
            checksum,

          sizeBytes:
            result.sizeBytes ??
            input.data.byteLength,

          healthy:
            true,

          createdAt:
            this.now(),
        });
      }

      const now =
        this.now();

      const object:
        SovereignStoredObject = {
        id:
          objectId,

        poolId:
          pool.id,

        type:
          input.type,

        name:
          input.name,

        status:
          "ACTIVE",

        sizeBytes:
          input.data.byteLength,

        checksum,

        encrypted:
          pool.encryptionRequired,

        immutable:
          input.immutable ??
          false,

        replicas,

        createdBy:
          context.actorId,

        createdAt:
          now,

        updatedAt:
          now,

        metadata:
          input.metadata,
      };

      await this.requireStore()
        .saveObject(object);

      await this.publish(
        "storage.object.created",
        pool.id,
        object.id,
        {
          type:
            object.type,

          sizeBytes:
            object.sizeBytes,

          replicas:
            object.replicas.length,

          encrypted:
            object.encrypted,
        }
      );

      await this.recordAudit(
        "storage.write",
        object.id,
        "SUCCESS",
        {
          actorId:
            context.actorId,

          poolId:
            pool.id,

          replicas:
            replicas.length,
        }
      );

      return object;
    } finally {
      this.activeWrites.delete(
        objectId
      );
    }
  }

  /* ==========================================================
   * READ OBJECT
   * ==========================================================
   */

  async readObject(
    objectId: string,
    context: SovereignStorageContext
  ): Promise<
    Buffer | Uint8Array
  > {
    this.requireContext(context);

    const object =
      await this.requireObject(
        objectId
      );

    if (
      object.status ===
        "DELETED" ||
      object.status ===
        "QUARANTINED"
    ) {
      throw new Error(
        `Storage object cannot be read: ${object.status}`
      );
    }

    const pool =
      await this.requirePool(
        object.poolId
      );

    const authorization =
      await this.requirePolicyBridge()
        .authorize({
          actorId:
            context.actorId,

          authority:
            context.authority,

          operation:
            "READ",

          poolId:
            pool.id,

          objectId:
            object.id,
        });

    if (!authorization.allowed) {
      throw new Error(
        authorization.reason ??
          "Storage read denied."
      );
    }

    const healthyReplicas =
      object.replicas.filter(
        (replica) =>
          replica.healthy
      );

    for (
      const replica
      of healthyReplicas
    ) {
      try {
        const data =
          await this.requireAdapter()
            .read({
              pool,
              object,
              replica,
            });

        const actualChecksum =
          this.checksum(data);

        if (
          actualChecksum !==
          object.checksum
        ) {
          replica.healthy =
            false;

          continue;
        }

        replica.lastVerifiedAt =
          this.now();

        await this.requireStore()
          .saveObject(object);

        await this.recordAudit(
          "storage.read",
          object.id,
          "SUCCESS",
          {
            actorId:
              context.actorId,

            replicaId:
              replica.id,
          }
        );

        return data;
      } catch {
        replica.healthy =
          false;
      }
    }

    object.status =
      "CORRUPTED";

    object.updatedAt =
      this.now();

    await this.requireStore()
      .saveObject(object);

    await this.publish(
      "storage.object.corrupted",
      pool.id,
      object.id,
      {
        reason:
          "No valid replica available.",
      }
    );

    throw new Error(
      "No valid storage replica is available."
    );
  }

  /* ==========================================================
   * VERIFY OBJECT
   * ==========================================================
   */

  async verifyObject(
    objectId: string,
    context: SovereignStorageContext
  ): Promise<{
    valid: bool

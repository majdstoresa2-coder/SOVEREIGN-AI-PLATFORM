// ============================================================
// SOVEREIGN AI PLATFORM
// SOVEREIGN-AI-CODE-WORKSPACE-176.ts
// Sovereign Autonomous Code Workspace
// ============================================================

export type SovereignWorkspaceFileState =
  | "ORIGINAL"
  | "STAGED"
  | "MODIFIED"
  | "CREATED"
  | "VERIFIED"
  | "BLOCKED";

export interface SovereignWorkspaceFile {
  path: string;
  content: string;

  state: SovereignWorkspaceFileState;

  checksum?: string;

  createdAt: number;
  updatedAt: number;
}

export interface SovereignWorkspaceSnapshot {
  id: string;

  label: string;

  files: SovereignWorkspaceFile[];

  createdAt: number;
}

export interface SovereignWorkspaceChange {
  id: string;

  path: string;

  operation:
    | "CREATE"
    | "UPDATE";

  previousContent?: string;

  nextContent: string;

  createdAt: number;
}

export interface SovereignWorkspaceAdapter {
  read(path: string): Promise<string | null>;

  write(
    path: string,
    content: string
  ): Promise<void>;

  exists(path: string): Promise<boolean>;

  listFiles?(): Promise<string[]>;

  validatePath?(
    path: string
  ): Promise<boolean>;

  recordSnapshot?(
    snapshot: SovereignWorkspaceSnapshot
  ): Promise<void>;

  recordChange?(
    change: SovereignWorkspaceChange
  ): Promise<void>;
}

export class SovereignAICodeWorkspace {
  private readonly files =
    new Map<string, SovereignWorkspaceFile>();

  private readonly snapshots =
    new Map<string, SovereignWorkspaceSnapshot>();

  private readonly protectedPaths =
    new Set<string>();

  constructor(
    private readonly adapter: SovereignWorkspaceAdapter
  ) {}

  public protectPath(
    path: string
  ): void {
    if (!path.trim()) {
      throw new Error(
        "Protected path cannot be empty."
      );
    }

    this.protectedPaths.add(
      this.normalizePath(path)
    );
  }

  public isProtected(
    path: string
  ): boolean {
    return this.protectedPaths.has(
      this.normalizePath(path)
    );
  }

  public async load(
    path: string
  ): Promise<SovereignWorkspaceFile> {
    const normalized =
      this.normalizePath(path);

    await this.assertPathAllowed(
      normalized
    );

    const content =
      await this.adapter.read(
        normalized
      );

    if (content === null) {
      throw new Error(
        `Workspace file not found: ${normalized}`
      );
    }

    const now = Date.now();

    const file: SovereignWorkspaceFile = {
      path: normalized,
      content,
      state: "ORIGINAL",
      checksum:
        this.checksum(content),
      createdAt: now,
      updatedAt: now
    };

    this.files.set(
      normalized,
      file
    );

    return this.cloneFile(file);
  }

  public async create(
    path: string,
    content: string
  ): Promise<SovereignWorkspaceFile> {
    const normalized =
      this.normalizePath(path);

    await this.assertPathAllowed(
      normalized
    );

    if (
      await this.adapter.exists(
        normalized
      )
    ) {
      throw new Error(
        `Cannot CREATE existing file: ${normalized}`
      );
    }

    if (!content.trim()) {
      throw new Error(
        "Cannot create empty file."
      );
    }

    const now = Date.now();

    const file: SovereignWorkspaceFile = {
      path: normalized,
      content,
      state: "CREATED",
      checksum:
        this.checksum(content),
      createdAt: now,
      updatedAt: now
    };

    this.files.set(
      normalized,
      file
    );

    return this.cloneFile(file);
  }

  public async update(
    path: string,
    nextContent: string
  ): Promise<SovereignWorkspaceFile> {
    const normalized =
      this.normalizePath(path);

    await this.assertPathAllowed(
      normalized
    );

    if (
      this.isProtected(normalized)
    ) {
      throw new Error(
        `Protected path cannot be modified autonomously: ${normalized}`
      );
    }

    let file =
      this.files.get(normalized);

    if (!file) {
      const existing =
        await this.adapter.read(
          normalized
        );

      if (existing === null) {
        throw new Error(
          `Cannot UPDATE missing file: ${normalized}`
        );
      }

      const now = Date.now();

      file = {
        path: normalized,
        content: existing,
        state: "ORIGINAL",
        checksum:
          this.checksum(existing),
        createdAt: now,
        updatedAt: now
      };

      this.files.set(
        normalized,
        file
      );
    }

    if (!nextContent.trim()) {
      throw new Error(
        "Autonomous update cannot replace a file with empty content."
      );
    }

    const previousContent =
      file.content;

    file.content =
      nextContent;

    file.state =
      "MODIFIED";

    file.updatedAt =
      Date.now();

    file.checksum =
      this.checksum(
        nextContent
      );

    await this.recordChange({
      id: this.createId(
        "workspace-change"
      ),

      path: normalized,

      operation: "UPDATE",

      previousContent,

      nextContent,

      createdAt:
        Date.now()
    });

    return this.cloneFile(file);
  }

  public stage(
    path: string
  ): SovereignWorkspaceFile {
    const normalized =
      this.normalizePath(path);

    const file =
      this.files.get(normalized);

    if (!file) {
      throw new Error(
        `Workspace file not loaded: ${normalized}`
      );
    }

    if (file.state === "BLOCKED") {
      throw new Error(
        `Blocked workspace file cannot be staged: ${normalized}`
      );
    }

    file.state =
      "STAGED";

    file.updatedAt =
      Date.now();

    return this.cloneFile(file);
  }

  public verify(
    path: string
  ): SovereignWorkspaceFile {
    const normalized =
      this.normalizePath(path);

    const file =
      this.files.get(normalized);

    if (!file) {
      throw new Error(
        `Workspace file not found: ${normalized}`
      );
    }

    if (
      file.state !== "STAGED" &&
      file.state !== "MODIFIED" &&
      file.state !== "CREATED"
    ) {
      throw new Error(
        `Workspace file is not ready for verification: ${normalized}`
      );
    }

    file.state =
      "VERIFIED";

    file.updatedAt =
      Date.now();

    return this.cloneFile(file);
  }

  public async commit(
    path: string
  ): Promise<SovereignWorkspaceFile> {
    const normalized =
      this.normalizePath(path);

    const file =
      this.files.get(normalized);

    if (!file) {
      throw new Error(
        `Workspace file not found: ${normalized}`
      );
    }

    if (
      file.state !== "VERIFIED"
    ) {
      throw new Error(
        `Only VERIFIED files may be committed: ${normalized}`
      );
    }

    if (
      this.isProtected(normalized)
    ) {
      throw new Error(
        `Protected file requires higher-level authorization: ${normalized}`
      );
    }

    await this.adapter.write(
      normalized,
      file.content
    );

    file.state =
      "ORIGINAL";

    file.updatedAt =
      Date.now();

    return this.cloneFile(file);
  }

  public createSnapshot(
    label: string
  ): SovereignWorkspaceSnapshot {
    const snapshot:
      SovereignWorkspaceSnapshot = {
        id: this.createId(
          "workspace-snapshot"
        ),

        label:
          label || "AUTONOMOUS",

        files: [
          ...this.files.values()
        ].map(
          file =>
            this.cloneFile(file)
        ),

        createdAt:
          Date.now()
      };

    this.snapshots.set(
      snapshot.id,
      snapshot
    );

    if (
      this.adapter.recordSnapshot
    ) {
      void this.adapter.recordSnapshot(
        snapshot
      );
    }

    return this.cloneSnapshot(
      snapshot
    );
  }

  public restoreSnapshot(
    snapshotId: string
  ): void {
    const snapshot =
      this.snapshots.get(
        snapshotId
      );

    if (!snapshot) {
      throw new Error(
        `Workspace snapshot not found: ${snapshotId}`
      );
    }

    this.files.clear();

    for (
      const file of snapshot.files
    ) {
      this.files.set(
        file.path,
        this.cloneFile(file)
      );
    }
  }

  public getFile(
    path: string
  ): SovereignWorkspaceFile | undefined {
    const file =
      this.files.get(
        this.normalizePath(path)
      );

    return file
      ? this.cloneFile(file)
      : undefined;
  }

  public listWorkspace():
    SovereignWorkspaceFile[] {
    return [
      ...this.files.values()
    ].map(
      file =>
        this.cloneFile(file)
    );
  }

  private async assertPathAllowed(
    path: string
  ): Promise<void> {
    if (!path) {
      throw new Error(
        "Workspace path required."
      );
    }

    if (
      path.includes("..")
    ) {
      throw new Error(
        "Parent traversal is prohibited."
      );
    }

    if (
      this.adapter.validatePath
    ) {
      const valid =
        await this.adapter.validatePath(
          path
        );

      if (!valid) {
        throw new Error(
          `Workspace path rejected: ${path}`
        );
      }
    }
  }

  private async recordChange(
    change: SovereignWorkspaceChange
  ): Promise<void> {
    if (
      this.adapter.recordChange
    ) {
      await this.adapter.recordChange(
        change
      );
    }
  }

  private normalizePath(
    path: string
  ): string {
    return path
      .trim()
      .replace(/\\/g, "/")
      .replace(/\/+/g, "/");
  }

  private checksum(
    value: string
  ): string {
    let hash =
      BigInt(
        "14695981039346656037"
      );

    const prime =
      BigInt(
        "1099511628211"
      );

    const mask =
      BigInt(
        "0xFFFFFFFFFFFFFFFF"
      );

    for (
      let index = 0;
      index < value.length;
      index += 1
    ) {
      hash ^=
        BigInt(
          value.charCodeAt(index)
        );

      hash =
        (hash * prime) & mask;
    }

    return hash
      .toString(16)
      .padStart(16, "0");
  }

  private createId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  private cloneFile(
    file: SovereignWorkspaceFile
  ): SovereignWorkspaceFile {
    return {
      ...file
    };
  }

  private cloneSnapshot(
    snapshot: SovereignWorkspaceSnapshot
  ): SovereignWorkspaceSnapshot {
    return {
      ...snapshot,

      files:
        snapshot.files.map(
          file =>
            this.cloneFile(file)
        )
    };
  }
}

export default SovereignAICodeWorkspace;

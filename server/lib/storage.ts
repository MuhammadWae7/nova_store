/**
 * Storage Adapter — Platform-agnostic file storage.
 *
 * Production: S3-compatible storage (AWS S3, Cloudflare R2, DigitalOcean Spaces, etc.)
 * Development: Local filesystem fallback.
 *
 * Configuration via environment variables:
 *   S3_BUCKET        — Bucket name (enables S3 mode)
 *   S3_REGION        — AWS region (default: "auto")
 *   S3_ACCESS_KEY    — Access key ID
 *   S3_SECRET_KEY    — Secret access key
 *   S3_ENDPOINT      — Custom endpoint URL (for R2, Spaces, MinIO, etc.)
 *   S3_PUBLIC_URL    — Public base URL for uploaded files
 */

import { logger } from "./logger";

// ─── Interface ─────────────────────────────────

export interface IStorageAdapter {
  /**
   * Upload a file and return its public URL.
   */
  upload(key: string, data: Buffer, contentType: string): Promise<string>;
}

// ─── S3-Compatible Adapter ─────────────────────

class S3StorageAdapter implements IStorageAdapter {
  private bucket: string;
  private region: string;
  private endpoint: string | undefined;
  private accessKeyId: string;
  private secretAccessKey: string;
  private publicUrl: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET!;
    this.region = process.env.S3_REGION || "auto";
    this.endpoint = process.env.S3_ENDPOINT || undefined;
    this.accessKeyId = process.env.S3_ACCESS_KEY!;
    this.secretAccessKey = process.env.S3_SECRET_KEY!;
    this.publicUrl = process.env.S3_PUBLIC_URL || "";
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<string> {
    // Dynamic import to avoid bundling @aws-sdk in development
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

    const client = new S3Client({
      region: this.region,
      ...(this.endpoint ? { endpoint: this.endpoint } : {}),
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      })
    );

    const url = this.publicUrl
      ? `${this.publicUrl}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    logger.info("File uploaded to S3", { key, bucket: this.bucket });
    return url;
  }
}

// ─── Local Filesystem Adapter (dev only) ───────

class LocalStorageAdapter implements IStorageAdapter {
  async upload(key: string, data: Buffer, _contentType: string): Promise<string> {
    // Dynamic import — fs/promises may not exist on all runtimes
    const { writeFile, mkdir } = await import("fs/promises");
    const { join } = await import("path");

    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, key);
    await writeFile(filePath, data);

    const url = `/uploads/${key}`;
    logger.info("File uploaded locally (dev)", { path: url });
    return url;
  }
}

// ─── Factory ───────────────────────────────────

let _storageInstance: IStorageAdapter | null = null;

/**
 * Get the storage adapter singleton.
 * S3 in production (if S3_BUCKET is set), local filesystem in development.
 */
export function getStorage(): IStorageAdapter {
  if (_storageInstance) return _storageInstance;

  if (process.env.S3_BUCKET) {
    _storageInstance = new S3StorageAdapter();
    logger.info("Storage: S3-compatible adapter initialized", {
      bucket: process.env.S3_BUCKET,
      endpoint: process.env.S3_ENDPOINT || "default",
    });
  } else {
    if (process.env.NODE_ENV === "production") {
      logger.warn(
        "Storage: No S3_BUCKET configured in production! " +
        "Falling back to local filesystem which may not work on serverless platforms."
      );
    }
    _storageInstance = new LocalStorageAdapter();
    logger.info("Storage: Local filesystem adapter initialized (development)");
  }

  return _storageInstance;
}

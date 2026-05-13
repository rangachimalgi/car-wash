import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

let s3Client = null;

const REQUIRED_R2_ENV_KEYS = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_BASE_URL',
];

export function getMissingR2EnvKeys() {
  return REQUIRED_R2_ENV_KEYS.filter((key) => !process.env[key]?.trim());
}

export function isR2Configured() {
  return getMissingR2EnvKeys().length === 0;
}

function getEndpoint() {
  const custom = process.env.R2_ENDPOINT?.trim();
  if (custom) return custom.replace(/\/$/, '');
  const accountId = process.env.R2_ACCOUNT_ID.trim();
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

function getS3Client() {
  if (!isR2Configured()) {
    throw new Error('R2 env vars are not fully set');
  }
  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: getEndpoint(),
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID.trim(),
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY.trim(),
      },
    });
  }
  return s3Client;
}

export function buildPublicObjectUrl(key) {
  const base = process.env.R2_PUBLIC_BASE_URL.trim().replace(/\/$/, '');
  const k = String(key).replace(/^\//, '');
  return `${base}/${k}`;
}

/** @param {string} url */
export function publicUrlToR2Key(url) {
  if (!url || typeof url !== 'string') return null;
  const baseRaw = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (!baseRaw || !url.startsWith('http')) return null;
  try {
    const base = new URL(baseRaw.includes('://') ? baseRaw : `https://${baseRaw}`);
    const u = new URL(url);
    if (u.origin !== base.origin) return null;
    const path = u.pathname.replace(/^\//, '');
    return path || null;
  } catch {
    return null;
  }
}

/**
 * @param {{ key: string, body: Buffer, contentType?: string }} opts
 * @returns {Promise<string>} public HTTPS URL
 */
export async function uploadObjectToR2({ key, body, contentType }) {
  const bucket = process.env.R2_BUCKET.trim();
  const normalizedKey = key.replace(/^\//, '');
  try {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: normalizedKey,
        Body: body,
        ContentType: contentType || 'application/octet-stream',
      })
    );
  } catch (err) {
    const e = new Error(err?.message || 'R2 PutObject failed');
    e.name = err?.name || err?.Code || err?.code || 'R2UploadError';
    e.code = err?.Code || err?.code || err?.name || 'R2UploadError';
    e.details = {
      bucket,
      key: normalizedKey,
      endpoint: getEndpoint(),
      httpStatusCode: err?.$metadata?.httpStatusCode || null,
      requestId: err?.$metadata?.requestId || null,
      extendedRequestId: err?.$metadata?.extendedRequestId || null,
      cfId: err?.$metadata?.cfId || null,
    };
    throw e;
  }
  return buildPublicObjectUrl(key);
}

export async function deleteR2ObjectByKey(key) {
  if (!key || !isR2Configured()) return;
  const bucket = process.env.R2_BUCKET.trim();
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key.replace(/^\//, ''),
    })
  );
}

/** @param {string} publicUrl */
export async function deleteR2ObjectByPublicUrl(publicUrl) {
  const key = publicUrlToR2Key(publicUrl);
  if (key) await deleteR2ObjectByKey(key);
}

export function randomSuffix() {
  return crypto.randomBytes(8).toString('hex');
}

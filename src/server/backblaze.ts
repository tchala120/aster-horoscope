const B2_API_BASE = "https://api.backblazeb2.com/b2api/v2";
// A fresh account authorization is valid for 24h; refresh a bit early to be safe.
const AUTH_TTL_MS = 20 * 60 * 60 * 1000;
const DOWNLOAD_AUTH_VALID_SECONDS = 3600;

interface B2Authorization {
  accountId: string;
  authorizationToken: string;
  apiUrl: string;
  downloadUrl: string;
  allowed: {
    bucketId: string | null;
    bucketName: string | null;
    capabilities: string[];
  };
}

interface B2Bucket {
  bucketId: string;
  bucketName: string;
}

let cachedAuth: { value: B2Authorization; expiresAt: number } | null = null;
let cachedBucketId: string | null = null;

export class B2Error extends Error {}

async function b2Fetch<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.code ? `${body.code}: ${body.message ?? ""}` : `HTTP ${res.status}`;
    throw new B2Error(`Backblaze request to ${url} failed (${detail})`);
  }
  return res.json() as Promise<T>;
}

async function authorize(): Promise<B2Authorization> {
  if (cachedAuth && cachedAuth.expiresAt > Date.now()) return cachedAuth.value;

  const keyId = process.env.B2_KEY_ID;
  const applicationKey = process.env.B2_APPLICATION_KEY;
  if (!keyId || !applicationKey) {
    throw new B2Error("B2_KEY_ID / B2_APPLICATION_KEY are not configured.");
  }

  const basic = Buffer.from(`${keyId}:${applicationKey}`).toString("base64");
  const auth = await b2Fetch<B2Authorization>(`${B2_API_BASE}/b2_authorize_account`, {
    headers: { Authorization: `Basic ${basic}` },
  });
  cachedAuth = { value: auth, expiresAt: Date.now() + AUTH_TTL_MS };
  return auth;
}

/** Resolves the target bucket's id — from the key's own scope if it's restricted to one
 *  bucket, otherwise via b2_list_buckets (requires the key's "listBuckets" capability). */
async function resolveBucketId(auth: B2Authorization, bucketName: string): Promise<string> {
  if (cachedBucketId) return cachedBucketId;

  if (auth.allowed.bucketId && auth.allowed.bucketName === bucketName) {
    cachedBucketId = auth.allowed.bucketId;
    return cachedBucketId;
  }

  const { buckets } = await b2Fetch<{ buckets: B2Bucket[] }>(
    `${auth.apiUrl}/b2api/v2/b2_list_buckets`,
    {
      method: "POST",
      headers: { Authorization: auth.authorizationToken, "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: auth.accountId, bucketName }),
    },
  );
  const bucket = buckets.find((b) => b.bucketName === bucketName);
  if (!bucket) {
    throw new B2Error(
      `Bucket "${bucketName}" not found or not visible to this key (needs "listBuckets" capability, or restrict the key directly to this bucket).`,
    );
  }
  cachedBucketId = bucket.bucketId;
  return cachedBucketId;
}

/**
 * A time-limited signed URL for a file in a private B2 bucket. Requires the key to have
 * the "shareFiles" capability. Env: B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME.
 */
export async function getSignedB2Url(fileName: string): Promise<string> {
  const bucketName = process.env.B2_BUCKET_NAME;
  if (!bucketName) throw new B2Error("B2_BUCKET_NAME is not configured.");

  const auth = await authorize();
  const bucketId = await resolveBucketId(auth, bucketName);

  const downloadAuth = await b2Fetch<{ authorizationToken: string }>(
    `${auth.apiUrl}/b2api/v2/b2_get_download_authorization`,
    {
      method: "POST",
      headers: { Authorization: auth.authorizationToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        bucketId,
        fileNamePrefix: fileName,
        validDurationInSeconds: DOWNLOAD_AUTH_VALID_SECONDS,
      }),
    },
  );

  return `${auth.downloadUrl}/file/${bucketName}/${encodeURIComponent(fileName)}?Authorization=${downloadAuth.authorizationToken}`;
}

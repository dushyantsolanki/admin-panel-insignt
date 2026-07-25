import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getR2Config() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim() || "";
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() || "";
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() || "";
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim() || "";
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim() || "";

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

export function hasR2Credentials(): boolean {
  const { accountId, accessKeyId, secretAccessKey, bucketName } = getR2Config();
  return Boolean(accountId && accessKeyId && secretAccessKey && bucketName);
}

export function getR2Client(): S3Client {
  if (!hasR2Credentials()) {
    throw new Error(
      "Cloudflare R2 credentials missing. Please set CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_BUCKET_NAME in .env.local"
    );
  }

  const { accountId, accessKeyId, secretAccessKey } = getR2Config();

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function generateR2PresignedUrl(key: string, contentType: string) {
  const client = getR2Client();
  const { bucketName, publicUrl, accountId } = getR2Config();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  const filePublicUrl = publicUrl
    ? `${publicUrl.replace(/\/$/, "")}/${key}`
    : `https://${bucketName}.${accountId}.r2.dev/${key}`;

  return { uploadUrl, filePublicUrl, key, bucketName };
}

export async function uploadR2Buffer(key: string, buffer: Buffer, contentType: string) {
  const client = getR2Client();
  const { bucketName, publicUrl, accountId } = getR2Config();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  const filePublicUrl = publicUrl
    ? `${publicUrl.replace(/\/$/, "")}/${key}`
    : `https://${bucketName}.${accountId}.r2.dev/${key}`;

  return { filePublicUrl, key, bucketName };
}

export async function deleteR2Object(key: string) {
  if (!hasR2Credentials()) return false;
  try {
    const client = getR2Client();
    const { bucketName } = getR2Config();

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch (error) {
    console.error("Failed to delete object from Cloudflare R2:", error);
    return false;
  }
}

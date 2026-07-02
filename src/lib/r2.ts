import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as presignUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;

export const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Files are never linked to R2 directly — DB rows store `/api/files/{key}`,
// which redirects to a freshly-signed URL on every request. That's what
// lets category buckets stay fully private with no custom domain, while
// still behaving like a stable, permanent URL to the rest of the app.
export function fileUrlForKey(key: string): string {
  return `/api/files/${key}`;
}

export function buildR2Key(folder: string, filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${folder}/${Date.now()}-${safeName}`;
}

// Presigned PUT URL — used for the browser-direct upload path (large files,
// e.g. up to 500MB lesson videos, that would blow past Vercel's serverless
// request body limit if routed through an API route).
export async function getUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
  const command = new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, ContentType: contentType });
  return presignUrl(r2Client, command, { expiresIn });
}

// Server-side buffer upload — for files small enough to safely pass through
// an API route (thumbnails, past papers, qualification docs, school docs).
export async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<{ key: string; fileUrl: string }> {
  await r2Client.send(new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, Body: buffer, ContentType: contentType }));
  return { key, fileUrl: fileUrlForKey(key) };
}

export async function getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key });
  return presignUrl(r2Client, command, { expiresIn });
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
}

export interface FileCategory {
  folder: (ids: Record<string, string>) => string;
  maxBytes: number;
  allowedTypes: string[];
}

// Folder conventions per VOA Stage 10 storage split. Categories without an
// existing upload UI yet (past-paper, voice-note, qualification, school-doc,
// hbc-project) are wired here so future features can call uploadToR2()
// immediately without touching this file again.
export const FILE_CATEGORIES: Record<string, FileCategory> = {
  "lesson-video": {
    folder: ({ teacherId, lessonId }) => `videos/${teacherId}/${lessonId}`,
    maxBytes: 500 * 1024 * 1024,
    allowedTypes: ["video/mp4", "video/webm", "video/quicktime"],
  },
  "lesson-thumbnail": {
    folder: ({ teacherId, lessonId }) => `thumbnails/${teacherId}/${lessonId}`,
    maxBytes: 5 * 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  "lesson-material": {
    folder: ({ teacherId, lessonId }) => `lesson-materials/${teacherId}/${lessonId}`,
    maxBytes: 200 * 1024 * 1024,
    allowedTypes: ["application/pdf", "video/mp4", "video/webm", "video/quicktime", "image/jpeg", "image/png"],
  },
  "course-material": {
    folder: ({ courseId }) => `course-materials/${courseId}`,
    maxBytes: 200 * 1024 * 1024,
    allowedTypes: ["application/pdf"],
  },
  "assignment-brief": {
    folder: ({ classId }) => `assignments/${classId}/brief`,
    maxBytes: 50 * 1024 * 1024,
    allowedTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"],
  },
  "assignment-submission": {
    folder: ({ assignmentId, studentId }) => `assignments/${assignmentId}/${studentId}`,
    maxBytes: 50 * 1024 * 1024,
    allowedTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"],
  },
  "hbc-project": {
    folder: ({ studentId, projectId, stage }) => `hbc-projects/${studentId}/${projectId}/stage-${stage}`,
    maxBytes: 100 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png", "video/mp4"],
  },
  "past-paper": {
    folder: ({ level, subject, year }) => `past-papers/${level}/${subject}/${year}`,
    maxBytes: 50 * 1024 * 1024,
    allowedTypes: ["application/pdf"],
  },
  "voice-note": {
    folder: ({ classId }) => `voice-notes/${classId}`,
    maxBytes: 20 * 1024 * 1024,
    allowedTypes: ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/wav"],
  },
  "qualification": {
    folder: ({ teacherId }) => `qualifications/${teacherId}`,
    maxBytes: 20 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  "school-doc": {
    folder: ({ schoolId }) => `school-docs/${schoolId}`,
    maxBytes: 20 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
};

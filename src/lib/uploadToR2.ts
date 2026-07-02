export interface UploadToR2Result {
  key: string;
  fileUrl: string;
}

export function r2KeyFromFileUrl(fileUrl: string): string | null {
  const marker = "/api/files/";
  const idx = fileUrl.indexOf(marker);
  return idx === -1 ? null : fileUrl.slice(idx + marker.length);
}

export async function deleteR2File(fileUrl: string): Promise<void> {
  const key = r2KeyFromFileUrl(fileUrl);
  if (!key) return;
  await fetch("/api/uploads/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
}

function putWithProgress(url: string, file: File, onProgress?: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

/**
 * Uploads a file to Cloudflare R2 via a server-issued presigned PUT URL
 * (the browser talks directly to R2 — files never pass through our server,
 * which matters for the up-to-500MB video case). Retries the PUT once on
 * failure before giving up.
 */
export async function uploadToR2(
  file: File,
  category: string,
  ids: Record<string, string>,
  onProgress?: (pct: number) => void
): Promise<UploadToR2Result> {
  const presignRes = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, filename: file.name, contentType: file.type, fileSize: file.size, ids }),
  });
  if (!presignRes.ok) {
    const data = await presignRes.json().catch(() => ({}));
    throw new Error(data.error ?? "Could not prepare upload");
  }
  const { uploadUrl, key, fileUrl } = await presignRes.json();

  try {
    await putWithProgress(uploadUrl, file, onProgress);
  } catch {
    await putWithProgress(uploadUrl, file, onProgress); // one retry
  }

  return { key, fileUrl };
}

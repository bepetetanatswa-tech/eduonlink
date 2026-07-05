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

async function verifyUploadSize(key: string, expectedSize: number): Promise<boolean> {
  const res = await fetch("/api/uploads/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  if (!res.ok) return false;
  const { size } = await res.json();
  return size === expectedSize;
}

/**
 * Uploads a file to Cloudflare R2 via a server-issued presigned PUT URL
 * (the browser talks directly to R2 — files never pass through our server,
 * which matters for the up-to-500MB video case). Retries the PUT once on
 * failure, and also re-verifies the object landed with the full byte count
 * — browsers can report a presigned PUT as successful while actually
 * sending an empty/truncated body (seen with cloud-placeholder files like
 * OneDrive Files On-Demand that haven't hydrated locally yet), which would
 * otherwise silently produce a 0-byte file that uploads "successfully" but
 * never opens.
 */
export async function uploadToR2(
  file: File,
  category: string,
  ids: Record<string, string>,
  onProgress?: (pct: number) => void
): Promise<UploadToR2Result> {
  if (file.size === 0) {
    throw new Error("This file is empty (0 bytes). If it's synced from OneDrive/Google Drive, make sure it's fully downloaded first.");
  }

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

  const attempt = async () => {
    await putWithProgress(uploadUrl, file, onProgress);
    return verifyUploadSize(key, file.size);
  };

  let ok = false;
  try {
    ok = await attempt();
  } catch {
    ok = false;
  }
  if (!ok) {
    try {
      ok = await attempt(); // one retry, covers both a failed PUT and a verified-empty PUT
    } catch {
      ok = false;
    }
  }
  if (!ok) {
    throw new Error("Upload did not complete correctly (file may be incomplete). Please try again.");
  }

  return { key, fileUrl };
}

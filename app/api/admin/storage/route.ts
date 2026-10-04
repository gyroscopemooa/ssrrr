import { wrap, db, bucket, json, HttpError } from "@/lib/server";
import { admin } from "@/lib/settings";

type StoredSnapshot = {
  capturedAt: number;
  totalBytes: number;
  objectCount: number;
};
type Candidate = {
  key: string;
  size: number;
  reason: string;
  kind: "media" | "shorts";
};
type StoredShort = {
  jobId: string;
  key: string;
  size: number;
  createdAt: number;
  uploaded: boolean;
  status: string;
};
type Inventory = {
  capturedAt: number;
  totalBytes: number;
  objectCount: number;
  categories: Record<string, { bytes: number; count: number }>;
  cleanup: { bytes: number; count: number; items: Candidate[] };
  shorts: StoredShort[];
  previous: StoredSnapshot | null;
};
const DAY = 86_400_000,
  SNAPSHOT_ID = "storage-usage-snapshot";

async function rows<T>(sql: string, ...values: unknown[]) {
  return (
    await db()
      .prepare(sql)
      .bind(...values)
      .all<T>()
  ).results;
}
async function snapshot() {
  const row = await db()
    .prepare("SELECT value FROM settings WHERE id=?")
    .bind(SNAPSHOT_ID)
    .first<{ value: string }>();
  if (!row) return null;
  try {
    return JSON.parse(row.value) as StoredSnapshot;
  } catch {
    return null;
  }
}

async function references() {
  const [posts, media, previews, assets, outputs] = await Promise.all([
    rows<{ body: string; hidden: number; deleted_at: number | null }>(
      "SELECT body,hidden,deleted_at FROM posts",
    ),
    rows<{ id: string; created_at: number; type: string }>("SELECT id,created_at,type FROM media"),
    rows<{ image_id: string | null }>(
      "SELECT image_id FROM previews WHERE image_id IS NOT NULL",
    ),
    rows<{ storage_key: string }>("SELECT storage_key FROM shorts_assets"),
    rows<{
      job_id: string;
      storage_key: string;
      file_size: number;
      created_at: number;
      external_id: string | null;
      status: string | null;
    }>(
      "SELECT o.job_id,o.storage_key,o.file_size,o.created_at,p.external_id,p.status FROM shorts_outputs o LEFT JOIN shorts_publications p ON p.job_id=o.job_id",
    ),
  ]);
  const now = Date.now(),
    protectedKeys = new Set<string>(),
    hiddenExpired = new Set<string>();
  for (const post of posts) {
    let blocks: unknown[] = [];
    try {
      blocks = JSON.parse(post.body);
    } catch {}
    for (const raw of blocks) {
      const block = raw as { type?: string; id?: string };
      if (!["image", "video"].includes(block.type || "") || !block.id) continue;
      if (!post.hidden || !post.deleted_at || now - post.deleted_at < 30 * DAY)
        protectedKeys.add(block.id);
      else hiddenExpired.add(block.id);
    }
  }
  for (const p of previews) if (p.image_id) protectedKeys.add(p.image_id);
  for (const a of assets) protectedKeys.add(a.storage_key);
  const mediaCreated = new Map(media.map((m) => [m.id, m.created_at])),
    mediaTypes = new Map(media.map((m) => [m.id, m.type])),
    successfulShorts = new Set<string>();
  for (const out of outputs) {
    if (
      out.external_id &&
      ["private", "unlisted", "scheduled", "published"].includes(
        out.status || "",
      ) &&
      now - out.created_at >= 30 * DAY
    )
      successfulShorts.add(out.storage_key);
    else protectedKeys.add(out.storage_key);
  }
  return { protectedKeys, hiddenExpired, mediaCreated, mediaTypes, successfulShorts, outputs };
}

async function inventory(): Promise<Inventory> {
  const previous = await snapshot(),
    ref = await references(),
    now = Date.now(),
    categories: Record<string, { bytes: number; count: number }> = {
      images: { bytes: 0, count: 0 },
      videos: { bytes: 0, count: 0 },
      shorts: { bytes: 0, count: 0 },
      assets: { bytes: 0, count: 0 },
      other: { bytes: 0, count: 0 },
    },
    items: Candidate[] = [];
  const storedKeys = new Set<string>();
  let cursor: string | undefined,
    totalBytes = 0,
    objectCount = 0;
  do {
    const page = await bucket().list({ cursor, limit: 1000 });
    for (const object of page.objects) {
      storedKeys.add(object.key);
      totalBytes += object.size;
      objectCount++;
      const mime = ref.mediaTypes.get(object.key) || "",
        category = object.key.startsWith("shorts/")
          ? "shorts"
          : object.key.startsWith("assets/")
            ? "assets"
            : mime.startsWith("video/")
              ? "videos"
              : mime.startsWith("image/")
                ? "images"
                : "other";
      categories[category].bytes += object.size;
      categories[category].count++;
      if (ref.protectedKeys.has(object.key)) continue;
      const uploaded = object.uploaded?.getTime?.() || 0;
      if (ref.successfulShorts.has(object.key))
        items.push({
          key: object.key,
          size: object.size,
          reason: "YouTube 전송 완료 후 30일 경과",
          kind: "shorts",
        });
      else if (ref.hiddenExpired.has(object.key))
        items.push({
          key: object.key,
          size: object.size,
          reason: "삭제된 게시물 보관 30일 경과",
          kind: "media",
        });
      else if (
        ref.mediaCreated.has(object.key) &&
        now - (ref.mediaCreated.get(object.key) || now) >= 7 * DAY
      )
        items.push({
          key: object.key,
          size: object.size,
          reason: "게시물에 사용되지 않은 업로드 7일 경과",
          kind: "media",
        });
      else if (
        !ref.mediaCreated.has(object.key) &&
        !object.key.startsWith("assets/") &&
        !object.key.startsWith("shorts/") &&
        uploaded &&
        now - uploaded >= 7 * DAY
      )
        items.push({
          key: object.key,
          size: object.size,
          reason: "DB와 연결되지 않은 고아 파일 7일 경과",
          kind: "media",
        });
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return {
    capturedAt: now,
    totalBytes,
    objectCount,
    categories,
    cleanup: {
      bytes: items.reduce((n, x) => n + x.size, 0),
      count: items.length,
      items: items.slice(0, 500),
    },
    shorts: ref.outputs
      .filter((output) => storedKeys.has(output.storage_key))
      .map((output) => ({
        jobId: output.job_id,
        key: output.storage_key,
        size: output.file_size,
        createdAt: output.created_at,
        uploaded:
          !!output.external_id &&
          ["private", "unlisted", "scheduled", "published"].includes(
            output.status || "",
          ),
        status: output.status || "미업로드",
      }))
      .sort((a, b) => b.createdAt - a.createdAt),
    previous,
  };
}
async function save(value: Inventory) {
  const compact: StoredSnapshot = {
    capturedAt: value.capturedAt,
    totalBytes: value.totalBytes,
    objectCount: value.objectCount,
  };
  await db()
    .prepare(
      "INSERT INTO settings(id,value,revision) VALUES(?,?,1) ON CONFLICT(id) DO UPDATE SET value=excluded.value,revision=revision+1",
    )
    .bind(SNAPSHOT_ID, JSON.stringify(compact))
    .run();
}

export const GET = wrap(async (req) => {
  await admin(req);
  return Response.json(
    { snapshot: await snapshot() },
    { headers: { "Cache-Control": "no-store" } },
  );
});
export const POST = wrap(async (req) => {
  const user = await admin(req),
    body = await json(req);
  if (body.action === "scan") {
    const result = await inventory();
    await save(result);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  }
  if (body.action === "deleteShort") {
    const jobId = typeof body.jobId === "string" ? body.jobId : "";
    if (!/^[a-f0-9-]{36}$/.test(jobId))
      throw new HttpError(400, "쇼츠 작업 번호가 올바르지 않습니다.");
    const output = await db()
      .prepare(
        "SELECT o.storage_key,o.file_size,p.id publication_id,p.external_id,p.status publication_status FROM shorts_outputs o LEFT JOIN shorts_publications p ON p.job_id=o.job_id WHERE o.job_id=?",
      )
      .bind(jobId)
      .first<{
        storage_key: string;
        file_size: number;
        publication_id: string | null;
        external_id: string | null;
        publication_status: string | null;
      }>();
    if (!output) throw new HttpError(404, "완성된 쇼츠 원본이 없습니다.");
    if (!/^shorts\/[a-f0-9-]+\.mp4$/.test(output.storage_key))
      throw new HttpError(409, "쇼츠 원본 경로를 확인할 수 없습니다.");
    if (
      output.publication_id &&
      (await db()
        .prepare(
          "SELECT id FROM worker_tasks WHERE kind='upload' AND ref_id=? AND status IN ('queued','running')",
        )
        .bind(output.publication_id)
        .first())
    )
      throw new HttpError(409, "YouTube 업로드가 진행 중입니다. 완료 후 삭제해 주세요.");
    const uploaded =
        !!output.external_id &&
        ["private", "unlisted", "scheduled", "published"].includes(
          output.publication_status || "",
        ),
      confirmation = uploaded ? "쇼츠 원본 삭제" : "미업로드 쇼츠 원본 삭제";
    if (body.confirm !== confirmation)
      throw new HttpError(
        400,
        uploaded
          ? "쇼츠 원본 삭제 확인이 필요합니다."
          : "YouTube에 업로드되지 않은 원본 삭제 확인이 필요합니다.",
      );
    await bucket().delete(output.storage_key);
    const changed = await db().batch([
      db()
        .prepare("DELETE FROM shorts_outputs WHERE job_id=? AND storage_key=?")
        .bind(jobId, output.storage_key),
      db()
        .prepare("DELETE FROM shorts_assets WHERE storage_key=? AND type='output'")
        .bind(output.storage_key),
      db()
        .prepare("INSERT INTO audit(id,actor,action,created_at) VALUES(?,?,?,?)")
        .bind(
          crypto.randomUUID(),
          user.userId,
          `쇼츠 사이트 원본 삭제: ${jobId} / ${output.file_size} bytes`,
          Date.now(),
        ),
    ]);
    if (!changed[0].meta.changes)
      throw new HttpError(409, "다른 요청에서 이미 삭제했습니다.");
    const after = await inventory();
    await save(after);
    return Response.json({
      ...after,
      deleted: { count: 1, bytes: output.file_size },
    });
  }
  if (body.action === "cleanup") {
    if (body.confirm !== "안전 청소")
      throw new HttpError(400, "안전 청소 확인이 필요합니다.");
    const result = await inventory(),
      targets = result.cleanup.items;
    if (targets.length) {
      await bucket().delete(targets.map((x) => x.key));
      const mediaIds = targets
        .filter((x) => x.kind === "media" && /^[a-f0-9-]{36}$/.test(x.key))
        .map((x) => x.key);
      if (mediaIds.length)
        await db()
          .prepare(
            "DELETE FROM media WHERE id IN (" +
              mediaIds.map(() => "?").join(",") +
              ")",
          )
          .bind(...mediaIds)
          .run();
    }
    const deleted = {
      count: targets.length,
      bytes: targets.reduce((n, x) => n + x.size, 0),
    };
    await db()
      .prepare("INSERT INTO audit(id,actor,action,created_at) VALUES(?,?,?,?)")
      .bind(
        crypto.randomUUID(),
        user.userId,
        `안전 저장공간 청소: ${deleted.count}개 / ${deleted.bytes} bytes`,
        Date.now(),
      )
      .run();
    const after = await inventory();
    await save(after);
    return Response.json({ ...after, deleted });
  }
  throw new HttpError(400, "지원하지 않는 요청입니다.");
});

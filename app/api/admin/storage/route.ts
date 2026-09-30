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
type Inventory = {
  capturedAt: number;
  totalBytes: number;
  objectCount: number;
  categories: Record<string, { bytes: number; count: number }>;
  cleanup: { bytes: number; count: number; items: Candidate[] };
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
      storage_key: string;
      created_at: number;
      external_id: string | null;
      status: string | null;
    }>(
      "SELECT o.storage_key,o.created_at,p.external_id,p.status FROM shorts_outputs o LEFT JOIN shorts_publications p ON p.job_id=o.job_id",
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
  return { protectedKeys, hiddenExpired, mediaCreated, mediaTypes, successfulShorts };
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
  let cursor: string | undefined,
    totalBytes = 0,
    objectCount = 0;
  do {
    const page = await bucket().list({ cursor, limit: 1000 });
    for (const object of page.objects) {
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

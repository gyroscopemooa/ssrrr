"use client";
import { useState } from "react";
import { api } from "../community";
import { Database, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
type Snapshot = { capturedAt: number; totalBytes: number; objectCount: number };
type Inventory = Snapshot & {
  categories: Record<string, { bytes: number; count: number }>;
  cleanup: {
    bytes: number;
    count: number;
    items: { key: string; size: number; reason: string }[];
  };
  previous: Snapshot | null;
  deleted?: { count: number; bytes: number };
};
const GB = 10 * 1024 * 1024 * 1024,
  names: Record<string, string> = {
    images: "이미지·GIF",
    videos: "첨부 영상",
    shorts: "쇼츠 원본",
    assets: "쇼츠 자산",
    other: "기타",
  };
function size(bytes: number) {
  const sign = bytes < 0 ? "-" : "";
  bytes = Math.abs(bytes);
  if (bytes >= 1024 ** 3) return sign + (bytes / 1024 ** 3).toFixed(2) + "GB";
  if (bytes >= 1024 ** 2) return sign + (bytes / 1024 ** 2).toFixed(1) + "MB";
  if (bytes >= 1024) return sign + (bytes / 1024).toFixed(1) + "KB";
  return sign + bytes + "B";
}
export default function StoragePanel({
  initial,
}: {
  initial: Snapshot | null;
}) {
  const [data, setData] = useState<Inventory | null>(null),
    [snapshot, setSnapshot] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function run(action: "scan" | "cleanup") {
    if (
      action === "cleanup" &&
      !window.confirm(
        "표시된 안전 청소 대상만 삭제합니다. 정상 게시물 첨부는 삭제하지 않습니다. 계속할까요?",
      )
    )
      return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const next = await api<Inventory>("/api/admin/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          confirm: action === "cleanup" ? "안전 청소" : undefined,
        }),
      });
      setData(next);
      setSnapshot(next);
      setMessage(
        action === "cleanup"
          ? `${next.deleted?.count || 0}개 파일을 안전하게 정리했습니다.`
          : "저장공간을 새로 계산했습니다.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const current = data || snapshot,
    percent = current ? Math.min(100, (current.totalBytes / GB) * 100) : 0,
    delta = data?.previous ? data.totalBytes - data.previous.totalBytes : null;
  return (
    <section className="panel admin-section storage-panel">
      <div className="storage-heading">
        <div>
          <h2>
            <Database /> 저장공간
          </h2>
          <p className="subtext">
            Sites 실제 사용량을 집계하고 Cloudflare R2 무료 10GB 기준과
            비교합니다. Sites 자체 한도는 공개되지 않았습니다.
          </p>
        </div>
        <button
          className="secondary"
          disabled={busy}
          onClick={() => run("scan")}
        >
          <RefreshCw />
          {busy ? "계산 중…" : "지금 계산"}
        </button>
      </div>
      {!current ? (
        <div className="storage-empty">
          아직 계산된 기록이 없습니다. <b>지금 계산</b>을 눌러주세요.
        </div>
      ) : (
        <>
          <div className="storage-summary">
            <div>
              <small>현재 미디어</small>
              <strong>{size(current.totalBytes)}</strong>
              <span>{current.objectCount.toLocaleString()}개 파일</span>
            </div>
            <div>
              <small>Cloudflare 무료 10GB 환산</small>
              <strong>{percent.toFixed(2)}%</strong>
              <span>이전했을 때의 비교값</span>
            </div>
            <div>
              <small>직전 검사 대비</small>
              <strong>
                {delta === null
                  ? "첫 기록"
                  : (delta >= 0 ? "+" : "") + size(delta)}
              </strong>
              <span>
                {new Date(current.capturedAt).toLocaleString("ko-KR")}
              </span>
            </div>
          </div>
          {data && (
            <div className="storage-breakdown">
              {Object.entries(data.categories).map(([key, value]) => (
                <div key={key}>
                  <span>{names[key] || key}</span>
                  <b>{size(value.bytes)}</b>
                  <small>{value.count.toLocaleString()}개</small>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {data && (
        <div className="cleanup-box">
          <div>
            <h3>
              <ShieldCheck /> 안전 청소
            </h3>
            <p>
              정상 게시물 파일은 보호됩니다. 미사용·삭제 후 보관기간 만료·전송
              완료 쇼츠만 대상입니다.
            </p>
          </div>
          <strong>
            {data.cleanup.count.toLocaleString()}개 · {size(data.cleanup.bytes)}{" "}
            확보 가능
          </strong>
          {data.cleanup.items.length > 0 && (
            <details>
              <summary>삭제 후보와 이유 보기</summary>
              <div className="cleanup-list">
                {data.cleanup.items.slice(0, 100).map((item) => (
                  <div key={item.key}>
                    <span>{item.reason}</span>
                    <code>{item.key}</code>
                    <b>{size(item.size)}</b>
                  </div>
                ))}
              </div>
            </details>
          )}
          <button
            className="danger-button"
            disabled={busy || !data.cleanup.count}
            onClick={() => run("cleanup")}
          >
            <Trash2 />
            안전 항목 삭제
          </button>
        </div>
      )}
      {message && (
        <p className="status" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="status error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

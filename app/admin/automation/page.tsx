"use client";
import { shortsWorkerReadiness } from "@/lib/automation/worker-readiness";
import { sourceSchema } from "@/lib/automation/config";
import { moderationBoards, boardLabel } from "@/lib/board-label";
import { FIELD_NAMES, MODE_LABELS } from "@/lib/automation/modes.mjs";
import { sourceEditorFields } from "@/lib/automation/source-editor.mjs";
import { isYouTubeReauthRequired } from "@/lib/automation/youtube-errors.mjs";
import { externalVideoCreator, externalVideoRefs } from "@/lib/automation/external-video";
import { SourceNote } from "./source-note";
import { sourceCatalog } from "@/lib/automation/catalog";
import { BulkControls } from "./bulk-controls";
import { SystemHealth } from "./system-health";
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useId,
  useLayoutEffect,
} from "react";
import { Shell, api } from "@/app/community";
import "./ops.css";
import { FieldHelp } from "./field-help";
import { AddSource, SourceVerification } from "./source-controls";
type Row = Record<string, unknown>;
type UploadFeedback = {
  phase: "requesting" | "accepted" | "error";
  message: string;
};
type Data = { config: Row; revision: number; [key: string]: unknown };
const labels: Record<string, string> = {
  paused: "자동 게시 긴급정지",
  siteName: "사이트 이름",
  siteUrl: "실제 사이트 주소",
  authorName: "자동글 작성자",
  economyAuthor: "경제글 작성자",
  start: "게시 시작 (한국시간)",
  intervalMinutes: "간격 (분)",
  windowMinutes: "권장 게시 시간창 (분)",
  nicknames: "가져온 댓글 닉네임 풀",
  gmailEnabled: "Gmail 자동처리",
  gmailMailbox: "전용 Gmail 주소",
  gmailSenders: "허용 발신자",
  gmailSubjects: "제목 포함 단어",
  gmailLabel: "허용 Gmail 라벨",
  privateDenylist: "개인정보 금칙어",
  name: "사이트 이름",
  url: "베스트 1페이지 URL",
  enabled: "자동수집 ON",
  board: "게시판",
  scanLimit: "스캔 개수",
  dailyLimit: "하루 게시 수",
  preferNew: "새 후보 우선",
  fallback: "과거 미사용 후보 허용",
  maxAgeDays: "후보 보관 기간 (일)",
  prefix: "제목 접두어",
  commentLimit: "가져올 댓글 수",
  images: "사진 수집",
  gifs: "GIF 수집",
  videos: "동영상 수집",
  minViews: "최소 조회",
  minLikes: "최소 추천",
  minComments: "최소 댓글",
  denyWords: "금칙어",
  mediaHosts: "허용 미디어 도메인",
  minDuration: "최소 길이 (초)",
  targetDuration: "목표 길이 (초)",
  maxDuration: "최대 길이 (초)",
  maxPosts: "최대 글 수",
  maxComments: "쇼츠 댓글 수",
  includeComments: "댓글 포함",
  autoCombine: "짧은 글 자동 합치기",
  autoSplit: "긴 영상 자동 분할",
  bgmEnabled: "배경음악",
  bgmVolume: "배경음악 볼륨",
  originalVolume: "원본 오디오 볼륨",
  intro: "인트로",
  introStyle: "인증 스탬프 스타일",
  outro: "아웃트로",
  watermark: "워터마크",
  cta: "마지막 안내",
  backgroundId: "배경 이미지 ID",
  bgmId: "배경음악 ID",
  logoId: "로고 이미지 ID",
  speed: "읽기 속도",
  maxRetries: "최대 재시도",
};
Object.assign(labels, {
  bgmRandom: "배경음악 랜덤 선택",
  speechSubtitles: "음성 자막 (원문 / 원문+한글 / 원문+한글+영어)",
  speechSubtitlePosition: "번역 자막 위치",
  captionTone: "영상 분위기",
  humorBgmIds: "유머 전용 BGM ID 목록",
  issueBgmIds: "이슈·심각 전용 BGM ID 목록",
  laughCaptions: "강조 자막 빈도 (off=끔, 그 외=켬)",
  laughIntervalSeconds: "강조 자막 간격 (초, 클수록 적게)",
  autoUpload: "유튜브 자동 업로드",
  autoUploadPrivacy: "자동 업로드 공개 범위 (private/unlisted/public)",
  titlePrefix: "유튜브 제목 접두어",
  titleMaxLength: "유튜브 제목 글자수",
  tags: "유튜브 태그",
  collectionMode: "수집 방식",
  requiredFields: "반드시 필요한 데이터",
  optionalFields: "선택 데이터",
  listSelectors: "목록 데이터 추출 규칙",
  customStages: "직접 설정 단계",
  detail: "상세 요청",
  comments: "댓글 요청",
  media: "미디어 요청",
  thumbnail: "목록 썸네일",
  video: "목록 영상",
  author: "목록 작성자",
  body: "목록 본문·요약",
  adapter: "사이트 읽기 방식 (Adapter)",
  selection: "글 선택 순서 (Selection)",
  mediaFailure: "사진·영상 수집 실패 시 처리",
});
const choices: Record<string, string[]> = {
  speechSubtitles: ["off", "original", "original-ko", "original-en", "original-ko-en"],
  speechSubtitlePosition: ["top", "middle", "bottom"],
  collectionMode: Object.keys(MODE_LABELS),
  adapter: ["generic", "dcinside"],
  board: [
    "유머",
    "짤",
    "영상",
    "SNS",
    "이슈",
    "자유",
    "아이돌·연예인",
    "시사·뉴스",
    "경제",
  ],
  selection: ["hybrid", "score", "newest"],
  mediaFailure: ["review_required", "skip"],
  audioPolicy: ["off", "duck", "keep"],
  effects: ["off", "low", "normal"],
  introStyle: ["classic", "impact", "motion"],
  captionTone: ["humor", "issue", "serious"],
  defaultPrivacy: ["file", "private", "unlisted", "scheduled"],
};
function Fields({
  value,
  onChange,
  scope = "global",
  numberPrefix = "",
}: {
  value: Row;
  onChange: (v: Row) => void;
  scope?: string;
  numberPrefix?: string;
}) {
  const prefix = useId();
  return (
    <div className="ops-fields">
      {Object.entries(scope === "source" ? sourceEditorFields(value) : value)
        .filter(
          ([k]) =>
            !["id", "partIndex", "resolvedMode", "issueBgmId", "externalAutoDownload"].includes(k),
        )
        .map(([k, v], index) => {
          const number = numberPrefix + (index + 1),
            nested = typeof v === "object" && v !== null && !Array.isArray(v),
            title =
              k === "shorts"
                ? "쇼츠 기본 설정"
                : k === "selectors"
                  ? "사이트별 추출 선택자"
                  : k === "weights"
                    ? "인기 점수 가중치"
                    : k === "intervalMinutes"
                      ? scope === "source"
                        ? "수집 간격 (분)"
                        : "게시 간격 (분)"
                      : scope === "weights"
                        ? (
                            {
                              likes: "추천 비중",
                              comments: "댓글 비중",
                              views: "조회 비중",
                            } as Record<string, string>
                          )[k] || k
                        : labels[k] || k,
            id = prefix + "-" + k;
          return (
            <div
              key={k}
              className={nested ? "ops-field ops-field-group" : "ops-field"}
            >
              <div className="ops-field-heading">
                {nested ? (
                  <span>
                    {number}. {title}
                  </span>
                ) : (
                  <label htmlFor={id}>
                    {number}. {title}
                  </label>
                )}
                <FieldHelp field={k} scope={scope} label={title} />
              </div>
              {nested ? (
                <details>
                  <summary>세부 항목 보기</summary>
                  <Fields
                    value={v as Row}
                    scope={k}
                    numberPrefix={number + "."}
                    onChange={(next) => onChange({ ...value, [k]: next })}
                  />
                </details>
              ) : typeof v === "boolean" ? (
                <input
                  id={id}
                  type="checkbox"
                  checked={v}
                  onChange={(e) =>
                    onChange({ ...value, [k]: e.target.checked })
                  }
                />
              ) : choices[k] ? (
                <select
                  id={id}
                  value={String(v)}
                  onChange={(e) => onChange({ ...value, [k]: e.target.value })}
                >
                  {choices[k].map((x) => (
                    <option key={x} value={x}>
                      {k === "collectionMode"
                        ? MODE_LABELS[x as keyof typeof MODE_LABELS]
                        : k === "introStyle"
                          ? (
                              {
                                classic: "기본 인증 스탬프",
                                impact: "임팩트 3컷",
                                motion: "냥이 모션 1.73초",
                              } as Record<string, string>
                            )[x]
                          : k === "captionTone"
                            ? (
                                {
                                  humor: "유머 (ㅋㅋㅋ)",
                                  issue: "이슈 (!!)",
                                  serious: "심각 (강조 자막 없음)",
                                } as Record<string, string>
                              )[x]
                            : k === "speechSubtitlePosition"
                              ? ({ top: "위", middle: "중간", bottom: "아래" } as Record<string, string>)[x]
                            : x}
                    </option>
                  ))}
                </select>
              ) : Array.isArray(v) &&
                ["requiredFields", "optionalFields"].includes(k) ? (
                <div className="ops-field-options">
                  {FIELD_NAMES.filter(
                    (f: string) =>
                      k === "requiredFields" ||
                      !["title", "sourceUrl", "sourcePostId"].includes(f),
                  ).map((f: string) => (
                    <label key={f}>
                      <input
                        type="checkbox"
                        checked={v.includes(f)}
                        onChange={(e) =>
                          onChange({
                            ...value,
                            [k]: e.target.checked
                              ? [...v, f]
                              : v.filter((x) => x !== f),
                          })
                        }
                      />
                      {{
                        title: "제목",
                        sourceUrl: "원문 URL",
                        sourcePostId: "글 ID",
                        body: "본문·요약",
                        image: "이미지",
                        thumbnail: "썸네일",
                        video: "영상",
                        comments: "댓글",
                        views: "조회수",
                        recommends: "추천수",
                        author: "작성자",
                        createdAt: "작성 시각",
                      }[f] || f}
                    </label>
                  ))}
                </div>
              ) : Array.isArray(v) ? (
                <textarea
                  id={id}
                  value={v.join("\n")}
                  placeholder="한 줄에 하나"
                  onChange={(e) =>
                    onChange({
                      ...value,
                      [k]: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                />
              ) : (
                <input
                  id={id}
                  type={typeof v === "number" ? "number" : "text"}
                  step="any"
                  value={String(v ?? "")}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      [k]:
                        typeof v === "number"
                          ? Number(e.target.value)
                          : e.target.value,
                    })
                  }
                />
              )}
            </div>
          );
        })}
    </div>
  );
}

const date = (v: unknown) =>
  v ? new Date(Number(v)).toLocaleString("ko-KR") : "—";
const str = (r: Row, k: string) => String(r[k] ?? "");
const parsed = (v: unknown) => JSON.parse(String(v || "{}"));
export default function Operations() {
  const [data, setData] = useState<Data | null>(null),
    [tab, setTab] = useState("가져올 사이트"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [draft, setDraft] = useState<Row | null>(null),
    [source, setSource] = useState<Row | null>(null),
    [q, setQ] = useState(""),
    [offset, setOffset] = useState(0),
    [postOffset, setPostOffset] = useState(0),
    [shortOffset, setShortOffset] = useState(0),
    [postFilter, setPostFilter] = useState<"all" | "no_economy" | "humor">(
      "no_economy",
    ),
    [selected, setSelected] = useState<string[]>([]),
    [externalRightsConfirmed, setExternalRightsConfirmed] = useState(false),
    [externalRightsBasis, setExternalRightsBasis] = useState(''),
    [force, setForce] = useState(false),
    [mail, setMail] = useState<Row | null>(null),
    [upload, setUpload] = useState<Row | null>(null),
    [shortTone, setShortTone] = useState<"humor" | "issue" | "serious">(
      "humor",
    ),
    [shortConfig, setShortConfig] = useState<Row | null>(null),
    [shortConfigDraft, setShortConfigDraft] = useState<Row | null>(null),
    [shortConfigSaved, setShortConfigSaved] = useState(false),
    [publishBoards, setPublishBoards] = useState<Record<string, string>>({}),
    [shortActionId, setShortActionId] = useState("");
  const [sourceSelection, setSourceSelection] = useState<string[]>([]);
  const [uploadFeedback, setUploadFeedback] = useState<Record<string, UploadFeedback>>({});
  const uploadRequest = useRef(false);
  const uploadEditor = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!upload?.id) return;
    uploadEditor.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    uploadEditor.current?.querySelector("input")?.focus({ preventScroll: true });
  }, [upload?.id]);
  const sourceReturn = useRef<string | null>(null);
  function closeSource() {
    sourceReturn.current = source?.id ? String(source.id) : null;
    setSource(null);
  }
  useLayoutEffect(() => {
    if (source || !sourceReturn.current) return;
    const id = sourceReturn.current;
    const restore = () => {
      const row = document.getElementById("source-row-" + id);
      row?.focus({ preventScroll: true });
      row?.scrollIntoView({ block: "start", behavior: "instant" });
    };
    restore();
    const frame = requestAnimationFrame(() => {
      restore();
      sourceReturn.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [source]);
  const sourceEditor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (source?.id) {
      sourceEditor.current?.focus({ preventScroll: true });
      sourceEditor.current?.scrollIntoView({ block: "nearest" });
    }
  }, [source?.id]);
  const refresh = useCallback(async () => {
    try {
      setData(
        await api<Data>(
          "/api/ops?" +
            new URLSearchParams({
              q,
              offset: String(offset),
              postOffset: String(postOffset),
              shortOffset: String(shortOffset),
              postFilter,
            }),
        ),
      );
    } catch (e) {
      setMessage((e as Error).message);
    }
  }, [q, offset, postOffset, shortOffset, postFilter]);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 5000);
    return () => clearInterval(timer);
  }, [refresh]);
  async function act(action: string, body: Row = {}) {
    setBusy(true);
    setMessage("");
    try {
      const result = await api<{
        selectedPackage?: boolean;
        postCount?: number;
        addedCount?: number;
        testQueued?: boolean;
        resumeAfterTest?: boolean;
        manualRun?: boolean;
        reviewRun?: boolean;
        retestReviewRun?: boolean;
        sourceRun?: boolean;
        sourceCollectOne?: boolean;
        publishQueued?: boolean;
        queued?: number;
        skipped?: number;
      }>("/api/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      setMessage(
        result.selectedPackage
          ? `선택한 글${result.addedCount ? ` + 인기글 ${result.addedCount}개` : ""}, 총 ${result.postCount}개로 제작을 시작했습니다. 검수 통과 후 설정된 공개 범위로 유튜브에 자동 업로드합니다.`
          : result.publishQueued
            ? "즉시 게시를 시작했습니다."
            : result.retestReviewRun
              ? `전체 사이트 ${result.queued || 0}개를 다시 검사합니다. 통과한 곳만 자동으로 켜고, 새 글을 검토함에 여러 건씩 가져옵니다.${result.skipped ? ` 실행 중인 ${result.skipped}개는 건너뛰었습니다.` : ""}`
            : result.reviewRun
              ? `전체 검토 수집을 시작했습니다. ${result.queued || 0}개 사이트에서 다음 미수집 글 1건씩 가져옵니다.${result.skipped ? ` ${result.skipped}개는 실행 중이거나 재검증이 필요해 건너뛰었습니다.` : ""}`
              : result.sourceCollectOne
                ? "다음 미수집 글 1건을 가져옵니다. 완료되면 가져온 글 검토에서 확인할 수 있습니다."
                : result.sourceRun
                  ? "이 사이트의 목록을 확인해 기존 수집 글은 건너뛰고 다음 글 1건을 수집해 바로 게시합니다."
                  : result.manualRun
                    ? `수동 실행을 시작했습니다. 통과한 ON 소스 ${result.queued || 0}개를 지금 수집합니다.${result.skipped ? ` ${result.skipped}개는 이미 실행 중이거나 재검증이 필요해 건너뛰었습니다.` : ""}`
                    : result.testQueued
                      ? result.resumeAfterTest
                        ? "저장했습니다. 자동 검사 통과 후 ON으로 돌아갑니다."
                        : "저장했습니다. 변경된 수집 조건을 자동 검사합니다."
                      : action === "sourceDelete"
                        ? "수집 사이트를 삭제했습니다."
                        : "저장했습니다.",
      );
      await refresh();
      return true;
    } catch (e) {
      setMessage((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function requestUpload() {
    if (!upload || busy || uploadRequest.current) return;
    const id = str(upload, "id");
    const scheduledAt = upload.privacy === "scheduled"
      ? new Date(str(upload, "scheduledAt")).getTime()
      : null;
    if (upload.privacy === "scheduled" && (!scheduledAt || scheduledAt < Date.now() + 600000)) {
      setUploadFeedback((current) => ({ ...current, [id]: {
        phase: "error", message: "예약 시간은 지금부터 10분 이후로 설정해 주세요.",
      } }));
      return;
    }
    uploadRequest.current = true;
    setBusy(true);
    setUploadFeedback((current) => ({ ...current, [id]: {
      phase: "requesting", message: "YouTube 업로드 요청을 접수하고 있습니다…",
    } }));
    try {
      const result = await api<{ id: string }>("/api/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upload", ...upload, scheduledAt }),
        signal: AbortSignal.timeout(30000),
      });
      setData((current) => {
        if (!current) return current;
        const publications = (current.publications || []) as Row[];
        const existing = publications.find((p) => p.job_id === id);
        const queued = { ...existing, id: result.id, job_id: id, status: "upload_queued", upload_task_status: "queued", upload_task_updated_at: Date.now(), error: "" };
        return { ...current, publications: [queued, ...publications.filter((p) => p.job_id !== id)] };
      });
      setUploadFeedback((current) => ({ ...current, [id]: {
        phase: "accepted", message: "업로드 요청이 접수되었습니다. 작업자 대기·진행 상태를 이 카드에서 확인할 수 있습니다.",
      } }));
      setUpload(null);
      await refresh();
    } catch (e) {
      const error = e as Error;
      setUploadFeedback((current) => ({ ...current, [id]: {
        phase: "error",
        message: error.name === "TimeoutError"
          ? "요청 결과를 확인하지 못했습니다. 새로고침으로 업로드 상태를 확인한 뒤 다시 시도해 주세요."
          : "업로드 요청 실패: " + error.message,
      } }));
    } finally {
      uploadRequest.current = false;
      setBusy(false);
    }
  }
  async function registerExternalVideo(event: React.FormEvent<HTMLFormElement>, postId: string, sourceUrl: string) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget, values = new FormData(form), file = values.get("file");
    if (!(file instanceof File) || !file.size) { setMessage("사용 허가된 원본 MP4 또는 WebM 파일을 선택해 주세요."); return; }
    const params = new URLSearchParams({ postId, sourceUrl, creator: String(values.get("creator") || ""), rightsBasis: String(values.get("rightsBasis") || ""), rightsConfirmed: String(values.get("rightsConfirmed") === "on") });
    setBusy(true); setMessage("외부 영상 원본과 권한 정보를 등록하고 있습니다…");
    try {
      const response = await fetch("/api/ops/external-video?" + params, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "외부 영상 등록 실패");
      form.reset(); setMessage("사용 허가된 외부 영상 원본을 등록했습니다. 이제 실제 영상과 음성으로 쇼츠를 제작할 수 있습니다."); await refresh();
    } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  }
  async function removeExternalVideo(id: string) {
    if (busy || !confirm("등록된 외부 영상 원본과 권한 정보를 삭제할까요?")) return;
    setBusy(true); setMessage("");
    try { const response = await fetch("/api/ops/external-video?id=" + encodeURIComponent(id), { method: "DELETE" }); const result = await response.json() as { error?: string }; if (!response.ok) throw new Error(result.error || "삭제 실패"); setMessage("외부 영상 원본 등록을 삭제했습니다."); await refresh(); }
    catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  }
  const rows = (key: string) => (data?.[key] || []) as Row[];
  const selectedNeedsExternalDownload = rows("posts").some((post) => selected.includes(str(post, "id")) && externalVideoRefs(Array.isArray(parsed(post.body)) ? parsed(post.body) : []).some((ref) => !rows("externalVideos").some((source) => source.post_id === post.id && source.source_key === ref.sourceKey && source.status === "ready")));
  const pager = (
    value: number,
    size: number,
    hasNext: boolean,
    setValue: (value: number) => void,
  ) => (
    <div className="ops-actions">
      <button
        disabled={!value}
        onClick={() => setValue(Math.max(0, value - size))}
      >
        이전
      </button>
      <span>{value / size + 1}페이지</span>
      <button disabled={!hasNext} onClick={() => setValue(value + size)}>
        다음
      </button>
    </div>
  );
  const sourceGroups = [
    {
      title: "1. 검사 통과",
      items: rows("sources").filter((r) => r.validation_status === "통과"),
    },
    {
      title: "2. 자동수집 ON",
      items: rows("sources").filter(
        (r) => r.validation_status !== "통과" && !!r.enabled,
      ),
    },
    {
      title: "3. 검사 필요 · OFF",
      items: rows("sources").filter(
        (r) => r.validation_status !== "통과" && !r.enabled,
      ),
    },
  ];
  const sourceRows = sourceGroups.flatMap((group) => group.items);
  const button = (text: string, action: string, body: Row = {}) => (
    <button
      disabled={busy || (action === "shortCreate" && (selected.length === 0 || (selectedNeedsExternalDownload && (!externalRightsConfirmed || externalRightsBasis.trim().length < 5))))}
      className="secondary"
      onClick={() => void act(action, body)}
    >
      {text}
    </button>
  );
  const boardPublish = (r: Row) => {
    const id = str(r, "id"),
      category = publishBoards[id] || "스르륵 유머";
    return (
      <span className="ops-board-publish">
        <select
          aria-label={str(r, "title") + " 게시판 선택"}
          value={category}
          onChange={(e) =>
            setPublishBoards((v) => ({ ...v, [id]: e.target.value }))
          }
        >
          {moderationBoards.map((board) => (
            <option key={board} value={board}>
              {boardLabel(board)}
            </option>
          ))}
        </select>
        <button
          disabled={busy}
          className="secondary"
          onClick={() => void act("publishBoard", { id, category })}
        >
          선택 게시판에 지금 게시
        </button>
      </span>
    );
  };
  const jobProgress = (r: Row) => {
    const job = str(r, "status"),
      task = str(r, "task_status"),
      updated = Number(r.task_updated_at || r.scheduled_at || 0),
      seconds = updated
        ? Math.max(0, Math.floor((Date.now() - updated) / 1000))
        : 0,
      ago =
        seconds < 60 ? seconds + "초 전" : Math.floor(seconds / 60) + "분 전",
      state =
        job === "published"
          ? "완료"
          : job === "failed" || task === "failed"
            ? "실패"
            : job === "review_required"
              ? "검토 필요"
              : task === "running"
                ? "작업자 처리 중"
                : task === "queued" || job === "queued"
                  ? "요청됨"
                  : "대기",
      tone =
        state === "완료"
          ? "done"
          : state === "실패"
            ? "failed"
            : state === "작업자 처리 중"
              ? "running"
              : "waiting";
    return (
      <p className={"ops-job-state " + tone}>
        <b>{state}</b>
        {state === "요청됨" && " · 보통 수초~수분 내 시작"}
        {state === "작업자 처리 중" && " · 글과 미디어 처리 중"}
        {" · 마지막 확인 " + ago}
        {Number(r.task_attempts || 0) > 1 &&
          " · 시도 " + String(r.task_attempts) + "회"}
        {str(r, "last_error") && (
          <>
            <br />
            <span>{str(r, "last_error")}</span>
          </>
        )}
      </p>
    );
  };
  const originalLink = (r: Row) =>
    str(r, "canonical_url") ? (
      <a
        className="secondary"
        href={str(r, "canonical_url")}
        target="_blank"
        rel="noreferrer"
      >
        원글 보기
      </a>
    ) : null;
  const candidatePreview = (r: Row) => {
    const detail = parsed(r.detail),
      blocks = Array.isArray(detail.blocks) ? (detail.blocks as Row[]) : [];
    return (
      <details>
        <summary>내용 미리보기</summary>
        <div className="ops-preview">
          <p>
            <b>원문:</b>{" "}
            {str(r, "canonical_url") ? (
              <a
                href={str(r, "canonical_url")}
                target="_blank"
                rel="noreferrer"
              >
                새 창에서 원글 열기
              </a>
            ) : (
              "원문 주소 없음"
            )}
          </p>
          {blocks.map((block, index) =>
            block.type === "text" ? (
              <p key={index}>{String(block.text || "")}</p>
            ) : block.url ? (
              <p key={index}>
                <a href={String(block.url)} target="_blank" rel="noreferrer">
                  {block.type === "image" ? "원본 이미지" : "원본 미디어"}{" "}
                  {index + 1} 열기
                </a>
              </p>
            ) : null,
          )}
        </div>
      </details>
    );
  };
  const candidateMeta = (r: Row) => {
    const candidates = rows("candidates"),
      same = candidates
        .filter(
          (x) =>
            x.source_id === r.source_id &&
            !x.used_at &&
            !x.selected_at &&
            ["eligible", "review_required"].includes(str(x, "status")),
        )
        .sort(
          (a, b) =>
            Number(b.score || 0) - Number(a.score || 0) ||
            Number(b.first_seen_at || 0) - Number(a.first_seen_at || 0),
        ),
      rank = Math.max(1, same.findIndex((x) => x.id === r.id) + 1),
      source = rows("sources").find((x) => x.id === r.source_id),
      latest = rows("runs").find(
        (x) => x.source_id === r.source_id && x.status === "completed",
      ),
      metrics = parsed(r.metrics);
    return {
      rank,
      sourceName: source ? str(source, "name") : str(r, "source_id"),
      isNew: !!latest && latest.id === r.first_seen_run_id,
      metrics,
    };
  };
  const shortWorkerReady = shortsWorkerReadiness(rows("workers"));
  const shortPosts = (jobId: string) =>
    rows("shortPostRows")
      .filter((r) => r.job_id === jobId)
      .sort((a, b) => Number(a.sequence) - Number(b.sequence));
  const shortState = (r: Row, publication?: Row) => {
    const status = str(r, "status");
    if (status === "rejected")
      return { label: "취소·반려 확정", tone: "cancelled" };
    if (status === "failed") return { label: "제작 실패", tone: "failed" };
    if (
      ["queued", "analyzing", "transcribing", "ready_to_render", "rendering", "qc"].includes(
        status,
      )
    )
      return {
        label: status === "queued" ? "제작 대기" : status === "transcribing" ? "음성 자막 생성 중" : "제작 중",
        tone: "running",
      };
    if (publication && isYouTubeReauthRequired(publication.error))
      return { label: "이전 업로드 실패 · 인증 오류", tone: "failed" };
    if (publication?.status === "failed")
      return { label: "업로드 실패", tone: "failed" };
    if (publication) {
      const status = str(publication, "status");
      const completed = ["published", "scheduled", "private", "unlisted"].includes(status);
      if (!completed && ["failed", "cancelled"].includes(str(publication, "upload_task_status")))
        return { label: "업로드 작업 중단 · 상태 확인 필요", tone: "failed" };
      const activeLabel = publication.upload_task_status === "running"
        ? "YouTube 업로드 처리 중 · 파일 준비·전송"
        : publication.upload_task_status === "queued"
          ? "업로드 접수 완료 · 작업자 대기"
          : "업로드 접수 완료 · 결과 대기";
      return {
        label: ({ upload_queued: activeLabel, uploading: "YouTube 업로드 중", published: "업로드 완료 · 전체 공개", scheduled: "업로드 완료 · 예약 확정", private: "업로드 완료 · 비공개", unlisted: "업로드 완료 · 일부 공개" } as Record<string, string>)[status] || "업로드 상태 확인 중",
        tone: completed ? "done" : "running",
      };
    }
    if (status === "ready")
      return {
        label: r.approved_at ? "검수 승인 확정" : "제작 완료 · 검수 대기",
        tone: "done",
      };
    return { label: status || "상태 확인 중", tone: "waiting" };
  };
  const shortSummary = (r: Row) => {
    const cfg = parsed(r.config),
      posts = shortPosts(str(r, "id")),
      tone =
        (
          { humor: "유머", issue: "이슈", serious: "심각" } as Record<
            string,
            string
          >
        )[String(cfg.captionTone)] || String(cfg.captionTone || "기본"),
      mode = cfg.autoUpload
        ? "풀패키지"
        : cfg.autoCombine
          ? "자동 조합"
          : "선택 제작",
      part = Number(cfg.partIndex || 0);
    return { posts, tone, mode, part: part ? ` · 분할 ${part + 1}편` : "" };
  };
  async function shortAction(
    action: "shortCancel" | "shortRetry" | "shortDismiss",
    r: Row,
  ) {
    const id = str(r, "id"),
      summary = shortSummary(r),
      titles = summary.posts.map((p) => str(p, "title")).join("\n");
    if (
      action === "shortCancel" &&
      !window.confirm(
        `아래 쇼츠 작업을 중단하고 대기열에서 삭제합니다. 진행 중인 렌더링도 함께 종료됩니다.\n\n${titles || id}\n\n확정할까요?`,
      )
    )
      return;
    if (
      action === "shortDismiss" &&
      !window.confirm(
        `아래 작업을 제작 현황에서 정리합니다.\n\n${titles || id}\n\n제작·업로드 기록과 MP4 파일은 삭제하지 않습니다. 정리할까요?`,
      )
    )
      return;
    setShortActionId(id);
    try {
      await act(action, { id });
    } finally {
      setShortActionId("");
    }
  }
  return (
    <Shell>
      <div className="page-head">
        <div>
          <h1>운영 관리</h1>
          <p className="subtext">수집부터 영상 발행까지 한곳에서 관리해요.</p>
        </div>
        <a href="/admin">포인트·인기글 설정</a>
      </div>
      <div className="ops-toolbar">
        <button className="secondary" onClick={() => void refresh()}>
          새로고침
        </button>
        {data && (
          <button
            className="secondary"
            disabled={busy || !!data.config.paused}
            title="기본 사이트를 다시 등록하고 전체 재검사합니다. 통과한 사이트만 ON으로 전환한 뒤, 새 후보를 게시하지 않고 검토함에 수집합니다."
            onClick={() => {
              if (window.confirm("전체 사이트를 다시 검사할까요? 검사 중에는 각 사이트가 잠시 OFF가 되고, 통과한 사이트만 다시 ON되어 새 글을 검토함에 수집합니다. 게시글은 자동 게시하지 않습니다.")) void act("retestEnableCollectReview");
            }}
          >
            전체 재검사·켜기·검토 수집
          </button>
        )}
        {data && (
          <button
            className="primary"
            disabled={busy || !!data.config.paused}
            title={
              data.config.paused
                ? "자동 게시를 재개한 뒤 실행하세요."
                : "ON·통과 소스를 즉시 수집하고 게시합니다."
            }
            onClick={() => void act("runNow")}
          >
            지금 수집·게시
          </button>
        )}
        {data && (
          <button
            className="secondary"
            disabled={busy || !!data.config.paused}
            title="각 ON 사이트에서 다음 미수집 글 1건씩 가져오고 게시하지 않습니다."
            onClick={() => void act("collectReviewAll")}
          >
            전체 수집·검토 대기
          </button>
        )}
        {data &&
          button(
            data.config.paused ? "자동 게시 재개" : "자동 게시 긴급정지",
            "settings",
            {
              config: { ...data.config, paused: !data.config.paused },
              revision: data.revision,
            },
          )}
        <span>
          {data?.config.paused ? "자동 게시 정지 중" : "자동 게시 가동 중"}
        </span>
      </div>
      {data && (
        <SystemHealth
          rows={rows("workers")}
          now={Number(data.serverNow || 0)}
          activityAt={Number(data.workerActivityAt || 0)}
        />
      )}
      <nav className="ops-tabs">
        {[
          "가져올 사이트",
          "가져온 글·게시 예약",
          "쇼츠 만들기",
          "경제 원고",
          "영상 음악·이미지",
          "자동 운영 설정",
          "처리 결과·오류",
        ].map((v, index) => (
          <button
            className={tab === v ? "active" : ""}
            key={v}
            onClick={() => {
              setTab(v);
              setOffset(0);
              setPostOffset(0);
              setShortOffset(0);
              setDraft(null);
            }}
          >
            {index + 1}. {v}
          </button>
        ))}
      </nav>
      <p className="subtext">
        {
          {
            "가져올 사이트":
              "어느 사이트에서 글을 가져올지, 사이트별 수집량과 추출 방법을 정합니다. 상단 지금 수집·게시를 누르면 ON·통과 소스에 현재 규칙을 바로 적용합니다. 하루 게시 수와 중복 제외도 그대로 유지됩니다. 전체 수집·검토 대기는 각 사이트의 다음 글 1건씩만 검토함에 넣습니다. 주소·추출 조건을 바꾸면 저장 후 자동 검사합니다.",
            "가져온 글·게시 예약":
              "가져온 글을 검토하고, 우리 사이트에 올릴 글과 게시 시간을 정합니다.",
            "쇼츠 만들기":
              "게시글로 영상을 만들고 검수한 뒤 YouTube에 발행합니다.",
            "경제 원고":
              "사이트 전용 API로 받은 전체 원고와 기존 Gmail 원고를 함께 검수합니다. API 원고는 기본적으로 검수 대기에 저장됩니다.",
            "영상 음악·이미지":
              "쇼츠에 넣을 배경음악·배경 이미지·로고·효과음을 보관하는 곳입니다.",
            "자동 운영 설정":
              "모든 수집 소스가 함께 쓰는 게시 시간·작성자·Gmail·쇼츠 기본 규칙을 정합니다.",
            "처리 결과·오류":
              "수집·메일·영상 작업의 성공 여부와 오류를 확인합니다.",
          }[tab]
        }
      </p>
      {message && (
        <p role="status" className="ops-message">
          {message}
        </p>
      )}
      {!data ? (
        <p>운영 정보를 불러오는 중…</p>
      ) : (
        <section className="ops-panel">
          {tab === "가져올 사이트" && (
            <>
              <BulkControls
                rows={rows("sources")}
                selected={sourceSelection}
                onSelect={setSourceSelection}
                busy={busy}
                onBusy={setBusy}
                locked={!!source}
                onSaved={refresh}
                renderFields={(value, onChange) => (
                  <Fields value={value} onChange={onChange} scope="source" />
                )}
              />
              <AddSource onSaved={refresh} />
              {button(
                "기본 사이트 " + sourceCatalog.length + "개 등록",
                "seedSources",
              )}
              <p>
                게시 수·간격·인기 기준 변경은 재검사 없이 적용됩니다. 주소·추출
                조건 변경 시 자동 검사하고, 기존 ON 소스는 통과 후 자동으로 다시
                켜집니다. OFF 사이트도 하루 1회씩 자동 재검사하며 통과하면
                자동으로 ON, 실패하면 OFF를 유지합니다.
              </p>
              {sourceGroups.map(
                (group) =>
                  group.items.length > 0 && (
                    <section key={group.title}>
                      <h2>
                        {group.title} <small>{group.items.length}개</small>
                      </h2>
                      {group.items.map((r) => (
                        <div key={str(r, "id")}>
                          <article
                            id={"source-row-" + str(r, "id")}
                            tabIndex={-1}
                            className={
                              r.enabled
                                ? "ops-row ops-source-row ops-source-on"
                                : r.validation_status === "통과"
                                  ? "ops-row ops-source-row ops-source-passed"
                                  : "ops-row ops-source-row"
                            }
                          >
                            <div>
                              <label className="ops-source-select">
                                <input
                                  type="checkbox"
                                  disabled={busy}
                                  aria-label={
                                    str(r, "name") + " 일괄 작업 대상으로 선택"
                                  }
                                  checked={sourceSelection.includes(
                                    str(r, "id"),
                                  )}
                                  onChange={(e) =>
                                    setSourceSelection((ids) =>
                                      e.target.checked
                                        ? [...ids, str(r, "id")]
                                        : ids.filter((id) => id !== r.id),
                                    )
                                  }
                                />
                                <strong>
                                  {sourceRows.indexOf(r) + 1}. {str(r, "name")}
                                </strong>
                              </label>{" "}
                              <span
                                className={
                                  r.enabled ? "tag ops-status-on" : "tag"
                                }
                              >
                                {r.enabled ? "ON" : "OFF"}
                              </span>
                              {!!r.resume_after_test && (
                                <p className="subtext">
                                  자동 검사 통과 후 ON 복귀 예정 · 실패하면 OFF
                                  유지
                                </p>
                              )}
                              <SourceVerification row={r} />
                              <SourceNote row={r} onSaved={refresh} />
                            </div>
                            <div className="ops-source-buttons">
                              <button
                                type="button"
                                className="secondary"
                                aria-expanded={source?.id === r.id}
                                aria-controls={"source-editor-" + str(r, "id")}
                                onClick={() => {
                                  sourceReturn.current = null;
                                  setSource({
                                    ...sourceSchema.parse(parsed(r.config)),
                                    enabled:
                                      !!r.enabled || !!r.resume_after_test,
                                    id: r.id,
                                  });
                                }}
                              >
                                수집 조건 변경
                              </button>
                              {(String(r.id).match(/^(source-|dc-)/) ||
                                sourceCatalog.some((s) => {
                                  try {
                                    return (
                                      new URL(s.url).hostname ===
                                      new URL(parsed(r.config).url).hostname
                                    );
                                  } catch {
                                    return false;
                                  }
                                })) &&
                                button(
                                  "검수된 기본값 적용 (OFF)",
                                  "sourceDefaults",
                                  { id: r.id },
                                )}
                              {button("수집 테스트", "scan", {
                                id: r.id,
                                test: true,
                              })}
                              {!!r.enabled &&
                                !!r.can_enable &&
                                button(
                                  "다음 글 1건 수집·바로 게시",
                                  "sourceRunNow",
                                  { id: r.id },
                                )}
                              <button
                                className="secondary"
                                disabled={busy || (!r.enabled && !r.can_enable)}
                                title={
                                  !r.enabled && !r.can_enable
                                    ? "실제 검사를 통과해야 켤 수 있습니다."
                                    : undefined
                                }
                                onClick={() =>
                                  void act("source", {
                                    source: {
                                      ...parsed(r.config),
                                      enabled: !r.enabled,
                                    },
                                  })
                                }
                              >
                                {r.enabled ? "끄기" : "켜기"}
                              </button>
                              <button
                                type="button"
                                className="secondary"
                                disabled={busy}
                                onClick={async () => {
                                  if (
                                    window.confirm(
                                      str(r, "name") +
                                        " 수집 사이트를 삭제할까요? 대기 중인 수집·게시 예약은 취소됩니다. 이미 게시된 글은 유지됩니다.",
                                    )
                                  ) {
                                    if (
                                      await act("sourceDelete", { id: r.id })
                                    ) {
                                      if (source?.id === r.id) setSource(null);
                                    }
                                  }
                                }}
                              >
                                삭제
                              </button>
                            </div>
                          </article>
                          {source && source.id === r.id && (
                            <div
                              className="ops-editor"
                              id={"source-editor-" + str(r, "id")}
                              ref={sourceEditor}
                              tabIndex={-1}
                              role="region"
                              aria-label={str(r, "name") + " 수집 조건"}
                            >
                              <h2>
                                {sourceRows.indexOf(r) + 1}. {str(r, "name")}{" "}
                                수집 조건
                              </h2>
                              <div className="ops-actions">
                                <button
                                  className="primary"
                                  disabled={busy}
                                  onClick={async () => {
                                    if (source) {
                                      if (
                                        await act("source", {
                                          source,
                                          autoTest: true,
                                        })
                                      )
                                        closeSource();
                                    }
                                  }}
                                >
                                  저장
                                </button>
                                <button disabled={busy} onClick={closeSource}>
                                  닫기
                                </button>
                              </div>
                              <Fields
                                value={source}
                                onChange={setSource}
                                scope="source"
                              />
                              <div className="ops-actions">
                                <button
                                  className="primary"
                                  disabled={busy}
                                  onClick={async () => {
                                    if (source) {
                                      if (
                                        await act("source", {
                                          source,
                                          autoTest: true,
                                        })
                                      )
                                        closeSource();
                                    }
                                  }}
                                >
                                  저장
                                </button>
                                <button disabled={busy} onClick={closeSource}>
                                  닫기
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </section>
                  ),
              )}
            </>
          )}
          {tab === "가져온 글·게시 예약" && (
            <>
              <input
                aria-label="가져온 글 검색"
                placeholder="제목 검색"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setOffset(0);
                }}
              />
              {button("게시 시간 자동 배정", "schedule")}
              <h2>가져온 글 검토</h2>
              {rows("candidates").map((r) => {
                const meta = candidateMeta(r),
                  status = str(r, "status"),
                  reason = str(r, "reason") || "주의 신호 없음";
                return (
                  <article className="ops-row" key={str(r, "id")}>
                    <div>
                      <strong>{str(r, "title")}</strong>
                      <p>
                        <b>
                          {meta.sourceName} · 현재 점수 순위 {meta.rank}위
                        </b>{" "}
                        ·{" "}
                        {meta.isNew
                          ? "이번 수집의 새 후보"
                          : "이전 수집에서 남은 후보"}
                      </p>
                      <p>
                        조회 {Number(meta.metrics.views || 0).toLocaleString()}{" "}
                        · 추천{" "}
                        {Number(meta.metrics.likes || 0).toLocaleString()} ·
                        댓글{" "}
                        {Number(meta.metrics.comments || 0).toLocaleString()} ·
                        종합점수 {Number(r.score || 0).toLocaleString()}
                      </p>
                      <p>
                        {status === "review_required"
                          ? "검토 대기"
                          : status === "eligible"
                            ? "자동 게시 가능"
                            : status === "filtered"
                              ? "기준 미달"
                              : status}{" "}
                        · 사유: {reason}
                      </p>
                      {candidatePreview(r)}
                    </div>
                    <div>
                      {originalLink(r)}
                      {!r.used_at && !r.selected_at && (
                        <>
                          {["eligible", "review_required"].includes(status)
                            ? button(
                                status === "review_required"
                                  ? "승인 후 지금 게시"
                                  : "지금 게시",
                                "candidatePublishNow",
                                { id: r.id },
                              )
                            : status === "filtered" &&
                              button("게시 대상으로 승인", "candidate", {
                                id: r.id,
                                status: "eligible",
                              })}
                          {status !== "duplicate" &&
                            button("제외", "candidate", {
                              id: r.id,
                              status: "excluded",
                            })}
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
              <h2>게시 예약</h2>
              <p className="subtext">
                상태는 5초마다 자동 갱신됩니다. 완료되면 게시글 보기 버튼이
                나타납니다.
              </p>
              {rows("jobs").map((r) => (
                <article className="ops-row" key={str(r, "id")}>
                  <div>
                    <strong>{str(r, "title")}</strong>
                    <p>예약·요청 시각 {date(r.scheduled_at)}</p>
                    {jobProgress(r)}
                  </div>
                  <div>
                    {originalLink(r)}
                    {["queued", "failed", "review_required"].includes(
                      str(r, "status"),
                    ) && (
                      <>
                        {boardPublish(r)}
                        {button("원래 게시판에 지금 게시", "publishNow", {
                          id: r.id,
                        })}
                        {button("제외", "excludeJob", { id: r.id })}
                      </>
                    )}
                    {!!r.post_id && (
                      <a className="primary" href={"/post/" + r.post_id}>
                        게시글 보기
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </>
          )}
          {tab === "쇼츠 만들기" && (
            <>
              <input
                aria-label="쇼츠 글 검색"
                placeholder="글 검색"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPostOffset(0);
                }}
              />
              <section className="ops-row ops-tone-picker">
                <h2>영상 분위기</h2>
                <div
                  className="ops-actions"
                  role="radiogroup"
                  aria-label="영상 분위기"
                >
                  {(
                    [
                      ["humor", "유머 · ㅋㅋㅋ + 유머 BGM"],
                      ["issue", "이슈 · !! + 뉴스 BGM"],
                      ["serious", "심각 · 자막 없음 + 뉴스 BGM"],
                    ] as const
                  ).map(([value, label]) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name="short-tone"
                        value={value}
                        checked={shortTone === value}
                        onChange={() => setShortTone(value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <p className="subtext">
                  아래 풀패키지와 선택 제작 버튼에 바로 적용됩니다.
                </p>
              </section>
              <section className="ops-row">
                <h2>풀패키지 (자동 제작 + 유튜브 업로드)</h2>
                <p>
                  재미 구간 → 인증 스탬프 → 본문 · 현재 1위(추천·댓글·조회 점수) 글 1개 ·
                  분위기별 배경음악 랜덤 · 경제글 제외 · 완성 후 자동 업로드(저장한 이번
                  영상 설정 적용)
                </p>
                {button("풀패키지", "fullPackage", {
                  config: { ...(shortConfig || {}), captionTone: shortTone },
                })}
                {button(
                  "풀패키지 40초+ (글 2~3개 합쳐 재미 구간·인증 스탬프·본문·아웃트로 40초 이상)",
                  "fullPackage40",
                  {
                    config: { ...(shortConfig || {}), captionTone: shortTone },
                  },
                )}
              </section>
              <h2>제작할 글 선택 (최대 2개)</h2>
              <div
                className="ops-actions"
                role="group"
                aria-label="제작할 글 분류"
              >
                {(
                  [
                    ["all", "전체"],
                    ["no_economy", "경제글 미포함"],
                    ["humor", "유머"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="short-post-filter"
                      checked={postFilter === value}
                      onChange={() => {
                        setPostFilter(value);
                        setPostOffset(0);
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
              {rows("posts").map((r) => {
                const refs = externalVideoRefs(Array.isArray(parsed(r.body)) ? parsed(r.body) : []), registered = rows("externalVideos").filter((source) => source.post_id === r.id && source.status === "ready" && refs.some((ref) => ref.sourceKey === source.source_key));
                const policyBlocked = refs.some(ref=>ref.provider==="youtube"&&!registered.some(source=>source.source_key===ref.sourceKey));
                return <article className="ops-row" key={str(r, "id")}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selected.includes(str(r, "id"))}
                      disabled={!!r.short_excluded}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, str(r, "id")].slice(-2)
                            : selected.filter((x) => x !== r.id),
                        )
                      }
                    />
                    {str(r, "title")}{" "}
                    <small>
                      조회 {str(r, "views")} · 추천 {str(r, "likes")} · 댓글{" "}
                      {str(r, "comments")} · 제작 {str(r, "history")}회
                    </small>
                  </label>
                  {button(
                    r.short_excluded ? "제외 해제" : "제작 제외",
                    "postExclude",
                    { id: r.id, excluded: !r.short_excluded },
                  )}
                  {refs.length > 0 && <details className="ops-editor">
                    <summary>{registered.length === refs.length ? `실제 영상·음성 확보 완료 ${registered.length}/${refs.length}` : `원본 미확보 · 제작 요청 전 ${registered.length}/${refs.length}`}</summary>
                    <form onSubmit={(event) => {
                      event.preventDefault();
                      const fields = new FormData(event.currentTarget);
                      void act("shortCreate", {postIds:[r.id],force,config:{...(shortConfig||{}),autoCombine:false,autoUpload:false,bgmEnabled:false,originalVolume:1,speechSubtitles:String(fields.get("subtitles")||"off"),speechSubtitlePosition:String(fields.get("subtitlePosition")||"middle"),externalAutoDownload:registered.length<refs.length,externalRightsBasis:String(fields.get("rightsBasis")||"")}});
                    }}>
                      <p>원본 소리 유지 · 추가 BGM 없음 · 완성 후 미리보기/다운로드 · 유튜브 자동 업로드 안 함</p>
                      {registered.length<refs.length&&<><label>이 영상의 편집·재게시 허가 근거<input name="rightsBasis" required minLength={10} maxLength={1000} placeholder="허가자·허가 내용·증빙 보관 위치" /></label><label><input type="checkbox" required /> 원작자 허가와 플랫폼의 원본 확보 이용 조건을 별도로 확인했습니다.</label></>}
                      <label>음성 자막<select name="subtitles" defaultValue="off"><option value="off">자막 끔</option><option value="original" disabled={!shortWorkerReady.subtitles}>원문 자막</option><option value="original-ko" disabled={!shortWorkerReady.subtitles}>원문 + 한글 번역</option><option value="original-en" disabled={!shortWorkerReady.subtitles}>원문 + 영어 번역</option><option value="original-ko-en" disabled={!shortWorkerReady.subtitles}>원문 + 한글 + 영어</option></select></label>
                      <label>번역 자막 위치<select name="subtitlePosition" defaultValue="middle"><option value="top">위</option><option value="middle">중간</option><option value="bottom">아래</option></select></label>
                      {!shortWorkerReady.subtitles&&<p>자막 서버 연결 미확인 · 엔진 설치 후 활성화됩니다.</p>}
                      <p>외국어는 원문을 유지하면서 한글·영어 번역을 함께 표시합니다. 자동 인식·번역은 검수가 필요합니다.</p>
                      <button type="submit" className="primary" disabled={busy||!!r.short_excluded||policyBlocked||!shortWorkerReady.render||(registered.length<refs.length&&!shortWorkerReady.acquire)}>이 글로 영상 제작 (파일 선택 없음)</button>
                      {policyBlocked&&<p role="status">YouTube 자동 확보는 지원하지 않습니다. 사용 허가된 원본이 등록된 뒤 제작할 수 있습니다.</p>}
                      {!shortWorkerReady.render&&<p role="status">제작 서버 연결 미확인</p>}
                    </form>
                    {refs.map((ref) => {
                      const source = registered.find((item) => item.source_key === ref.sourceKey);
                      return <div className="ops-row" key={ref.sourceKey}>
                        <p><b>{ref.provider === "youtube" ? "YouTube" : "TikTok"}</b> · <a href={ref.sourceUrl} target="_blank" rel="noreferrer">원본 링크</a></p>
                        {source ? <><p>실제 영상·음성 확보 완료 · 원작자 {str(source, "creator")} · 권한 근거 {str(source, "rights_basis")}</p><button type="button" className="secondary" disabled={busy} onClick={() => void removeExternalVideo(str(source, "id"))}>원본 등록 삭제</button></> : <><p>파일 선택 없이 위 ‘이 글로 영상 제작’을 이용하세요. {shortWorkerReady.acquire ? "확보 작업기 최근 연결 확인" : "확보 작업기 연결 미확인 — 파일 업로드 문제가 아닙니다."}</p><details><summary>자동 확보가 안 될 때만: 직접 파일 업로드</summary><form onSubmit={(event) => void registerExternalVideo(event, str(r, "id"), ref.sourceUrl)}>
                          <label>원작자·채널명<input name="creator" required maxLength={120} defaultValue={externalVideoCreator(ref.sourceUrl)} placeholder="틱톡 링크의 @계정명을 자동 입력합니다" /></label>
                          <label>재사용 권한 근거<input name="rightsBasis" required minLength={5} maxLength={1000} placeholder="본인 소유, 원작자 서면 허가, 라이선스 등" /></label>
                          <label>사용 허가된 원본 MP4/WebM<input name="file" type="file" required accept="video/mp4,video/webm" /></label>
                          <label><input name="rightsConfirmed" type="checkbox" required /> 이 영상을 편집·재게시할 권한이 있음을 확인합니다.</label>
                          <button className="primary" disabled={busy}>파일 업로드 (제작 버튼 아님)</button>
                        </form></details></>}
                      </div>;
                    })}
                  </details>}
                </article>
              })}
              {pager(postOffset, 20, !!data.postsHasNext, setPostOffset)}
              <label>
                <input
                  type="checkbox"
                  checked={force}
                  onChange={(e) => setForce(e.target.checked)}
                />
                이미 사용한 글 강제 재생성
              </label>
              <details>
                <summary>이번 영상만 설정 변경</summary>
                <Fields
                  value={
                    shortConfigDraft ||
                    shortConfig ||
                    (data.config.shorts as Row)
                  }
                  onChange={(value) => {
                    setShortConfigDraft(value);
                    setShortConfigSaved(false);
                  }}
                />
                <div className="ops-actions">
                  <button
                    type="button"
                    className="primary"
                    disabled={busy}
                    onClick={() => {
                      const next =
                        shortConfigDraft ||
                        shortConfig ||
                        (data.config.shorts as Row);
                      setShortConfig(next);
                      setShortConfigDraft(next);
                      setShortConfigSaved(true);
                      setMessage(
                        "이번 영상 설정을 저장했습니다. 아래 제작 버튼과 풀패키지 버튼에 적용됩니다.",
                      );
                    }}
                  >
                    이번 영상 설정 저장
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setShortConfig(null);
                      setShortConfigDraft(null);
                      setShortConfigSaved(false);
                      setMessage(
                        "이번 영상 설정을 기본 운영 설정으로 되돌렸습니다.",
                      );
                    }}
                  >
                    기본값으로 되돌리기
                  </button>
                </div>
                {shortConfigSaved && (
                  <p role="status" className="subtext">
                    저장됨 · 제목 접두어{" "}
                    {JSON.stringify(String(shortConfig?.titlePrefix || ""))} ·
                    아래 수동 제작과 풀패키지에 적용
                  </p>
                )}
              </details>
              {selectedNeedsExternalDownload && <div className="ops-editor"><p><b>외부 영상 감지 완료</b> · 제작을 시작하면 원본과 출처를 분석하고 실제 영상·음성을 먼저 확보합니다.</p><label>권리 근거<input value={externalRightsBasis} onChange={(event) => setExternalRightsBasis(event.target.value)} minLength={5} maxLength={1000} placeholder="예: 원작자의 서면 허가를 받음 (증빙 보관 위치)" /></label><label><input type="checkbox" checked={externalRightsConfirmed} onChange={(event) => setExternalRightsConfirmed(event.target.checked)} /> 위 권리 근거와 플랫폼 이용 조건을 확인했습니다.</label></div>}
              {button("선택한 글로 제작", "shortCreate", {
                postIds: selected,
                force,
                config: { ...(shortConfig || {}), captionTone: shortTone, externalAutoDownload: externalRightsConfirmed, externalRightsBasis },
              })}
              <div className="ops-actions">
                <button
                  className="primary"
                  disabled={busy || selected.length === 0 || (selectedNeedsExternalDownload && (!externalRightsConfirmed || externalRightsBasis.trim().length < 5))}
                  onClick={() =>
                    void act("selectedPackage", {
                      postIds: selected,
                      force,
                      config: {
                        ...(shortConfig || {}),
                        captionTone: shortTone,
                        externalAutoDownload: externalRightsConfirmed,
                        externalRightsBasis,
                      },
                      addPopular: false,
                    })
                  }
                >
                  선택한 글만 풀패키지 + 유튜브 업로드
                </button>
                <button
                  className="primary"
                  disabled={busy || selected.length === 0 || (selectedNeedsExternalDownload && (!externalRightsConfirmed || externalRightsBasis.trim().length < 5))}
                  onClick={() =>
                    void act("selectedPackage", {
                      postIds: selected,
                      force,
                      config: {
                        ...(shortConfig || {}),
                        captionTone: shortTone,
                        externalAutoDownload: externalRightsConfirmed,
                        externalRightsBasis,
                      },
                      addPopular: true,
                    })
                  }
                >
                  선택한 글 + 인기글 풀패키지 + 유튜브 업로드
                </button>
              </div>
              <p>
                선택 {selected.length}/2개 · 선택한 순서로 구성합니다. 인기글
                추가는 총 3개 이내에서 영상 길이에 맞춰 채웁니다.
                재미 구간·인증 스탬프·본문·아웃트로와 분위기별 BGM 포함, 검수 통과 후{" "}
                {(shortConfig?.autoUploadPrivacy ||
                  (data.config.shorts as Row).autoUploadPrivacy) === "private"
                  ? "비공개"
                  : (shortConfig?.autoUploadPrivacy ||
                        (data.config.shorts as Row).autoUploadPrivacy) ===
                      "unlisted"
                    ? "일부 공개"
                    : "전체 공개"}
                로 자동 업로드합니다.
              </p>
              <h2>제작 현황</h2>
              {rows("shorts").map((r) => {
                const output = rows("outputs").find((o) => o.job_id === r.id);
                const publication = rows("publications").find(
                  (p) => p.job_id === r.id,
                );
                const state = shortState(r, publication);
                const summary = shortSummary(r);
                const isActing = shortActionId === r.id;
                const feedback = uploadFeedback[str(r, "id")];
                const isUploading = feedback?.phase === "requesting";
                const cancellable =
                  !publication &&
                  [
                    "queued",
                    "analyzing",
                    "transcribing",
                    "ready_to_render",
                    "rendering",
                    "qc",
                    "ready",
                  ].includes(str(r, "status"));
                const retryable = ["failed", "rejected"].includes(
                  str(r, "status"),
                );
                const dismissible = ["ready", "failed", "rejected"].includes(
                  str(r, "status"),
                );
                return (
                  <article
                    className={"ops-job ops-short-job " + state.tone}
                    key={str(r, "id")}
                  >
                    <div className="ops-short-heading">
                      <span className={"ops-short-status " + state.tone}>
                        {isUploading ? "업로드 요청 접수 중…" : isActing ? "요청 처리 중…" : state.label}
                      </span>
                      <strong>영상 제작 {str(r, "progress")}%</strong>
                    </div>
                    <div className="ops-short-session">
                      <b>
                        {summary.posts.length}개 글 · {summary.mode} ·{" "}
                        {summary.tone}
                        {summary.part}
                      </b>
                      <ol>
                        {summary.posts.map((post) => (
                          <li key={str(post, "post_id")}>
                            {str(post, "title")}
                          </li>
                        ))}
                      </ol>
                      <small>
                        작업 ID {str(r, "id").slice(0, 8)} · 시작{" "}
                        {date(r.created_at)}
                      </small>
                    </div>
                    {str(r, "error") && (
                      <p className="ops-short-error">{str(r, "error")}</p>
                    )}
                    <details>
                      <summary>장면 구성·QC 결과</summary>
                      <pre>
                        {JSON.stringify(
                          {
                            plan: parsed(r.plan),
                            qc: output ? parsed(output.qc_json) : null,
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </details>
                    {output && (
                      <>
                        <video
                          controls
                          preload="metadata"
                          src={
                            "/api/worker/files?key=" +
                            encodeURIComponent(str(output, "storage_key"))
                          }
                        />
                        <a
                          href={
                            "/api/worker/files?download=1&key=" +
                            encodeURIComponent(str(output, "storage_key"))
                          }
                        >
                          MP4 다운로드
                        </a>
                      </>
                    )}
                    {feedback && (feedback.phase !== "accepted" || publication?.status === "upload_queued") && (
                      <p className={feedback.phase === "error" ? "ops-short-error" : "ops-message"}
                        role={feedback.phase === "error" ? "alert" : "status"} aria-live="polite">
                        {feedback.message}
                      </p>
                    )}
                    <div className="ops-actions">
                      {r.status === "ready" &&
                        !!!r.approved_at &&
                        button("검수 승인", "shortApprove", { id: r.id })}
                      {!!r.approved_at &&
                        (!publication || publication.status === "failed") && (
                          <button
                            className="primary"
                            disabled={busy || upload?.id === r.id}
                            aria-expanded={upload?.id === r.id}
                            aria-controls={"youtube-upload-" + str(r, "id")}
                            onClick={() => {
                              const metadata = publication ? parsed(publication.metadata) as Row : {};
                              const scheduled = Number(publication?.scheduled_at);
                              setUpload({
                                id: r.id,
                                title: str(metadata, "title") || summary.posts.map((post) => str(post, "title")).join(" / ").slice(0, 100) || data.config.siteName + " 오늘의 웃음",
                                description: str(metadata, "description"),
                                ...(Array.isArray(metadata.tags) ? { tags: metadata.tags } : {}),
                                privacy:
                                  publication?.privacy || ((data.config.shorts as Row).defaultPrivacy ===
                                  "file"
                                    ? "private"
                                    : (data.config.shorts as Row)
                                        .defaultPrivacy),
                                scheduledAt: scheduled ? new Date(scheduled - new Date(scheduled).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
                                confirmPublic: false,
                              });
                            }}
                          >
                            {upload?.id === r.id ? "아래에서 업로드 설정 중" : "YouTube 업로드"}
                          </button>
                        )}
                      {retryable && (
                        <button
                          className="primary"
                          disabled={busy}
                          onClick={() => void shortAction("shortRetry", r)}
                        >
                          {String(r.error || "").includes("SPLIT_REQUIRED")
                            ? "자동 분할로 다시 제작"
                            : "같은 구성으로 다시 제작"}
                        </button>
                      )}
                      {cancellable && (
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() => void shortAction("shortCancel", r)}
                        >
                          이 작업 중단·삭제
                        </button>
                      )}
                      {dismissible && (
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() => void shortAction("shortDismiss", r)}
                        >
                          현황에서 정리
                        </button>
                      )}
                      {publication && !isUploading && (
                        <>
                          <span>
                            {isYouTubeReauthRequired(publication.error) ? (
                              <>
                                <strong>마지막 업로드 당시 인증 오류</strong>{" "}
                                마지막 업로드 당시 인증이 만료되었거나 취소되었습니다. 채널을 이미 재연결했다면 YouTube 업로드를 다시 요청하세요. 아직 연결하지 않았다면 업로드 채널을 다시 인증해 주세요. (invalid_grant)
                              </>
                            ) : (
                              <>
                                {state.label}{" "}
                                {str(publication, "error")}
                              </>
                            )}
                          </span>
                          {publication.status === "failed" &&
                            !!publication.upload_session && (
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "YouTube 채널에 영상이 없는 것을 확인했나요? 새 업로드 세션을 만듭니다.",
                                    )
                                  )
                                    void act("resetUpload", {
                                      id: publication.id,
                                      confirm: "채널 중복 확인 완료",
                                    });
                                }}
                              >
                                실패 업로드 세션 초기화
                              </button>
                            )}
                          {!!publication.external_id && (
                            <>
                              <a
                                href={
                                  "https://www.youtube.com/watch?v=" +
                                  publication.external_id
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                YouTube
                              </a>
                              {button("성과 동기화", "sync", {
                                id: publication.id,
                              })}
                            </>
                          )}
                        </>
                      )}
                    </div>
                    {upload && upload.id === r.id && (
                      <form id={"youtube-upload-" + str(r, "id")} className="ops-editor"
                        ref={uploadEditor} aria-label="YouTube 업로드 설정" aria-busy={isUploading}
                        onSubmit={(event) => { event.preventDefault(); void requestUpload(); }}>
                        <h3>YouTube 업로드 설정</h3>
                        <p>아래 내용을 확인하고 ‘업로드 요청’을 누르면 접수됩니다. 영상은 다시 제작하지 않습니다.</p>
                        <label>
                          제목
                          <input required maxLength={100} value={str(upload, "title")} disabled={isUploading}
                            onChange={(e) => setUpload({ ...upload, title: e.target.value })} />
                        </label>
                        <label>
                          설명
                          <textarea maxLength={5000} value={str(upload, "description")} disabled={isUploading}
                            onChange={(e) => setUpload({ ...upload, description: e.target.value })} />
                        </label>
                        <label>
                          공개 설정
                          <select value={str(upload, "privacy")} disabled={isUploading}
                            onChange={(e) => setUpload({ ...upload, privacy: e.target.value, confirmPublic: false })}>
                            <option value="private">비공개</option>
                            <option value="unlisted">일부 공개</option>
                            <option value="scheduled">예약 공개</option>
                            <option value="public">전체 공개</option>
                          </select>
                        </label>
                        {upload.privacy === "scheduled" && (
                          <label>
                            예약 시간 (현재 기기 시간 기준)
                            <input required type="datetime-local" value={str(upload, "scheduledAt")} disabled={isUploading}
                              onChange={(e) => setUpload({ ...upload, scheduledAt: e.target.value })} />
                          </label>
                        )}
                        {upload.privacy === "public" && (
                          <label>
                            <input required type="checkbox" checked={!!upload.confirmPublic} disabled={isUploading}
                              onChange={(e) => setUpload({ ...upload, confirmPublic: e.target.checked })} />
                            지금 전체 공개
                          </label>
                        )}
                        <button type="submit" className="primary" disabled={busy}>
                          {isUploading ? "업로드 요청 접수 중…" : "업로드 요청"}
                        </button>
                        <button type="button" disabled={isUploading} onClick={() => setUpload(null)}>닫기</button>
                      </form>
                    )}
                  </article>
                );
              })}
              {pager(shortOffset, 5, !!data.shortsHasNext, setShortOffset)}
              <h2>성과</h2>
              {rows("metrics").map((r) => (
                <p key={str(r, "id")}>
                  {date(r.measured_at)} · 조회 {str(r, "views")} · 좋아요{" "}
                  {str(r, "likes")} · 댓글 {str(r, "comments")}
                </p>
              ))}
            </>
          )}
          {tab === "경제 원고" && (
            <>
              <div className="ops-actions">
                {button("Gmail도 확인", "gmail")}
                {button("기존 메일 내용 정리", "scrubTaskUpdateLabels")}
              </div>
              <p>
                API 원고는 전체 본문 그대로 검수 대기에 들어옵니다. 잘린 ChatGPT
                작업 알림 메일은 자동 게시하지 않고 검수 대기로 보냅니다.
              </p>
              {rows("mail").map((r) => {
                const apiSource = str(r, "provider_message_id").startsWith(
                  "api:",
                );
                return (
                  <article className="ops-row" key={str(r, "id")}>
                    <div>
                      <strong>{str(r, "subject")}</strong>
                      <p>
                        {apiSource ? "사이트 API" : "Gmail"} ·{" "}
                        {str(r, "status")} · {str(r, "privacy_status")} ·{" "}
                        {str(r, "privacy_reasons")}
                      </p>
                    </div>
                    {!apiSource &&
                      button("Gmail 라벨 다시 반영", "mailLabelRetry", {
                        id: r.id,
                      })}
                    {r.post_id ? (
                      <a href={"/post/" + r.post_id}>게시글</a>
                    ) : (
                      <div>
                        <button
                          onClick={() =>
                            setMail({
                              ...r,
                              title: r.parsed_title,
                              body: r.parsed_body,
                            })
                          }
                        >
                          검수·수정
                        </button>
                        {button("반려", "mailReject", { id: r.id })}
                      </div>
                    )}
                  </article>
                );
              })}
              {mail && (
                <div className="ops-editor">
                  <label>
                    제목
                    <input
                      value={str(mail, "title")}
                      onChange={(e) =>
                        setMail({ ...mail, title: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    본문
                    <textarea
                      rows={14}
                      value={str(mail, "body")}
                      onChange={(e) =>
                        setMail({ ...mail, body: e.target.value })
                      }
                    />
                  </label>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={async () => {
                      if (
                        await act("mailApprove", {
                          id: mail.id,
                          title: mail.title,
                          body: mail.body,
                        })
                      )
                        setMail(null);
                    }}
                  >
                    다시 검사하고 게시
                  </button>
                  <button onClick={() => setMail(null)}>닫기</button>
                </div>
              )}
            </>
          )}
          {tab === "영상 음악·이미지" && (
            <>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  try {
                    const form = new FormData(e.currentTarget),
                      file = form.get("file") as File;
                    const query = new URLSearchParams({
                      type: String(form.get("type")),
                      name: String(form.get("name")),
                      license: String(form.get("license")),
                    });
                    const r = await fetch("/api/ops/assets?" + query, {
                      method: "POST",
                      headers: { "Content-Type": file.type },
                      body: file,
                    });
                    const d = (await r.json()) as { error?: string };
                    if (!r.ok) throw Error(d.error);
                    setMessage(
                      "영상 재료를 저장했습니다. 자동 운영 설정에서 해당 음악·이미지 ID를 지정하세요.",
                    );
                    await refresh();
                  } catch (e) {
                    setMessage((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label>
                  종류
                  <select name="type">
                    <option value="bgm">배경음악</option>
                    <option value="background">배경</option>
                    <option value="logo">로고</option>
                    <option value="sfx">효과음</option>
                  </select>
                </label>
                <label>
                  이름
                  <input name="name" required />
                </label>
                <label>
                  라이선스·사용 권한 근거
                  <input name="license" required />
                </label>
                <input
                  type="file"
                  name="file"
                  accept="image/png,image/jpeg,image/webp,audio/mpeg,audio/wav"
                  required
                />
                <button className="primary" disabled={busy}>
                  음악·이미지 등록
                </button>
              </form>
              {rows("assets")
                .filter((r) => r.type !== "output")
                .map((r) => (
                  <p key={str(r, "id")}>
                    {str(r, "name")} ({str(r, "type")}) ·{" "}
                    {str(r, "license_note")}
                    <br />
                    <code>{str(r, "id")}</code>
                  </p>
                ))}
            </>
          )}
          {tab === "자동 운영 설정" && (
            <>
              <Fields value={draft || data.config} onChange={setDraft} />
              <button
                className="primary"
                disabled={busy}
                onClick={async () => {
                  if (
                    await act("settings", {
                      config: draft || data.config,
                      revision: data.revision,
                    })
                  )
                    setDraft(null);
                }}
              >
                운영 설정 저장
              </button>
              <p>
                OAuth 키와 워커 인증키는 이 화면에 저장하지 않습니다. 서버
                환경변수로 설정하세요.
              </p>
            </>
          )}
          {tab === "처리 결과·오류" && (
            <>
              <h2>작업자 연결</h2>
              {rows("workers").map((r) => (
                <p key={str(r, "id")}>
                  {str(r, "id")} · {date(r.last_seen_at)} ·{" "}
                  {str(r, "capabilities")}
                </p>
              ))}
              <h2>수집 결과</h2>
              {rows("runs").map((r) => (
                <p key={str(r, "id")}>
                  {str(r, "source_id")} · {str(r, "status")} ·{" "}
                  {str(r, "counts")} · {str(r, "error")}
                </p>
              ))}
              <h2>최근 기록</h2>
              {rows("events").map((r) => (
                <p key={str(r, "id")}>
                  {date(r.created_at)} · {str(r, "stage")} · {str(r, "message")}
                </p>
              ))}
            </>
          )}
          {tab === "가져온 글·게시 예약" &&
            pager(
              offset,
              50,
              !!data.candidatesHasNext || !!data.jobsHasNext,
              setOffset,
            )}
          {tab === "경제 원고" &&
            pager(offset, 50, !!data.mailHasNext, setOffset)}
        </section>
      )}
    </Shell>
  );
}

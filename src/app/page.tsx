"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

/**
 * Lunch Roulette — polished single-file version
 * - Crisp slice separators (repeating-conic-gradient)
 * - Correct pointer math (no flipped direction)
 * - Non‑repeat mode (avoid picking the last N winners)
 * - Share via URL (?items=...)
 * - Keyboard shortcuts: Space/Ctrl+Enter spin, "/" focus input
 * - Haptics (mobile vibrate), optional sound
 * - Responsive wheel size
 */

export default function Page() {
  // -----------------------------
  // State: items (with URL sync)
  // -----------------------------
  const [rawItems, setRawItems] = useState(
    "김치찌개, 제육볶음, 돈까스, 냉면, 칼국수, 부대찌개, 비빔밥, 초밥, 파스타, 쌀국수, 치즈버거, 샐러드"
  );

  // Load items from URL on first mount
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const qs = q.get("items");
    if (qs) setRawItems(qs);
  }, []);

  // Keep URL in sync (so you can share the current list)
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("items", rawItems);
    window.history.replaceState({}, "", url.toString());
  }, [rawItems]);

  const items = useMemo(
    () =>
      rawItems
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [rawItems]
  );

  // -----------------------------
  // Wheel & result state
  // -----------------------------
  const [angle, setAngle] = useState(0); // current rotation deg
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [noRepeat, setNoRepeat] = useState(true); // non-repeat mode
  const [mute, setMute] = useState(false); // sound on/off
  const [recent, setRecent] = useState<string[]>([]); // last results

  const size = useResponsiveWheelSize(); // 320~440 px

  const seg = Math.max(items.length, 1);
  const perDeg = 360 / seg;

  // Pretty color wheel + crisp separators
  const wheelBackground = useMemo(() => {
    if (items.length === 0) return "#eee";
    const palette = [
      "#fde68a", // amber-200
      "#fca5a5", // red-300
      "#93c5fd", // blue-300
      "#a7f3d0", // emerald-200
      "#c7d2fe", // indigo-200
      "#fbcfe8", // pink-200
      "#fcd34d", // amber-300
      "#86efac", // green-300
      "#a5b4fc", // indigo-300
      "#fecaca", // red-200
    ];
    const stops = items.map((_, i) => {
      const color = palette[i % palette.length];
      const start = i * perDeg;
      const end = (i + 1) * perDeg;
      return `${color} ${start}deg ${end}deg`;
    });
    // Overlay thin white tick lines every perDeg
    const lines = `repeating-conic-gradient(\n      rgba(255,255,255,0) 0deg,\n      rgba(255,255,255,0) ${perDeg - 1}deg,\n      rgba(255,255,255,0.9) ${perDeg - 1}deg,\n      rgba(255,255,255,0.9) ${perDeg}deg\n    )`;
    const pie = `conic-gradient(${stops.join(",")})`;
    return `${lines}, ${pie}`;
  }, [items, perDeg]);

  // -----------------------------
  // Spin logic (fair & precise)
  // -----------------------------
  const wheelRef = useRef<HTMLDivElement>(null);

  const spin = useCallback(() => {
    if (spinning || items.length === 0) return;

    // Resolve candidate list respecting no-repeat
    const candidates = noRepeat ? items.filter((it) => it !== recent[0]) : items;
    if (candidates.length === 0) return;
    const targetIdx = randInt(0, candidates.length - 1);
    const targetName = candidates[targetIdx];
    const trueIndex = items.indexOf(targetName);

    // Plan rotation so that selected index lands at 12 o'clock (pointer)
    // Keep adding full turns to maintain momentum
    const baseTurns = 360 * randInt(6, 8); // 6–8 full rotations
    const centerOfSlice = (trueIndex + 0.5) * perDeg; // measured from 0deg (3 o'clock)
    const pointerFromConic = 90; // 12 o'clock is +90deg from conic's 0deg
    const stopAt = pointerFromConic - centerOfSlice; // where the graphic must end

    // small jitter for natural feel (± 10% of slice)
    const jitter = (Math.random() - 0.5) * (perDeg * 0.2);

    const next = angle + baseTurns + stopAt + jitter;

    setWinner(null);
    setSpinning(true);
    setAngle(next);

    // rudimentary haptics
    try {
      navigator.vibrate?.(30);
    } catch {}

    // optional blip
    if (!mute) beep(160, 0.04);
  }, [spinning, items, noRepeat, recent, angle, mute, perDeg]);

  function onSpinEnd() {
    setSpinning(false);

    // Normalize angle to [0, 360)
    const norm = ((angle % 360) + 360) % 360;

    // Convert current graphic orientation to conic index under 12 o'clock pointer
    const pointerDegFromConic = (90 - norm + 360) % 360; // 0..360
    const idx = Math.floor(pointerDegFromConic / perDeg) % seg;

    const picked = items[idx] ?? null;
    setWinner(picked);
    if (picked) setRecent((r) => [picked, ...r].slice(0, 12));

    // finish sound
    if (!mute) beep(440, 0.08);
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.code === "Space" || (e.key === "Enter" && (e.ctrlKey || e.metaKey)))) {
        e.preventDefault();
        spin();
      } else if (e.key === "/") {
        e.preventDefault();
        document.getElementById("items-input")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [spin]);

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-purple-100 text-gray-800 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-6xl px-6 pt-10 pb-4 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-pink-400 via-rose-400 to-purple-500 bg-clip-text text-transparent">
          점심메뉴 룰렛
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <label className="inline-flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-pink-500"
              checked={noRepeat}
              onChange={(e) => setNoRepeat(e.target.checked)}
            />
            노중복
          </label>
          <label className="inline-flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-pink-500"
              checked={mute}
              onChange={(e) => setMute(e.target.checked)}
            />
            음소거
          </label>
        </div>
      </header>

      {/* Main */}
      <section className="w-full max-w-6xl px-6 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Wheel side */}
        <div className="relative flex flex-col items-center">
          {/* pointer (points downward to the wheel) */}
            <div
            aria-hidden
            className="absolute -top-3 z-20 w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[24px] border-b-pink-500 drop-shadow transform rotate-180"
            />

          {/* wheel container */}
          <div className="relative mt-10" style={{ width: size + 40, height: size + 40 }}>
            {/* glow */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)",
                filter: "blur(10px)",
                transform: "translate(-8px, -8px)",
              }}
            />

            {/* wheel */}
            <div
              ref={wheelRef}
              onTransitionEnd={onSpinEnd}
              role="img"
              aria-label="점심 추천 룰렛"
              className="relative z-10 rounded-full shadow-2xl border-8 border-white"
              style={{
                width: size,
                height: size,
                background: wheelBackground,
                transform: `rotate(${angle}deg)`,
                transition: spinning
                  ? "transform 3.4s cubic-bezier(0.22, 0.61, 0.36, 1)"
                  : "none",
              }}
            >
                {/* center hub — full-wheel clickable button */}
                <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={spin}
                  disabled={spinning || items.length === 0}
                  aria-label="돌리기"
                  className={`absolute inset-0 rounded-full flex items-center justify-center transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  spinning ? "" : "hover:shadow-lg"
                  }`}
                  style={{
                  // keep the wheel visible while making the whole circle clickable
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  }}
                >
                  <div className="w-28 h-28 rounded-full bg-white/90 backdrop-blur-md border border-pink-200 shadow-lg flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-gray-400">점심 돌리기</span>
                  <span className="mt-1 text-sm font-semibold text-pink-600">
                    {spinning ? "도는 중..." : "돌려! 🎯"}
                  </span>
                  </div>
                </button>
                </div>
            </div>
          </div>

          {/* Result */}
          <div className="mt-8 text-center" aria-live="polite">
            {winner ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-5 py-3 shadow">
                <span className="text-sm text-gray-500">오늘의 점심</span>
                <strong className="text-xl text-pink-600">{winner}</strong>
                <span className="text-xl">😋</span>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">돌려서 오늘의 메뉴를 정해보세요!</p>
            )}
          </div>
        </div>

        {/* Editor side */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-pink-100 p-6">
          <h2 className="text-xl font-semibold mb-3">메뉴 편집</h2>
          <p className="text-sm text-gray-500 mb-3">
            쉼표(, )로 구분해서 입력하세요. 예: <code className="bg-gray-100 px-1 rounded">김치찌개, 제육볶음, 돈까스</code>
          </p>
          <textarea
            id="items-input"
            value={rawItems}
            onChange={(e) => setRawItems(e.target.value)}
            className="w-full h-36 rounded-xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-pink-300"
            placeholder="여기에 메뉴를 입력하세요"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <Preset
              label="한식 기본"
              onClick={() =>
                setRawItems("김치찌개, 제육볶음, 불고기, 순두부, 갈비탕, 만두전골, 닭갈비, 비빔밥")
              }
            />
            <Preset label="면/분식" onClick={() => setRawItems("라멘, 우동, 칼국수, 냉면, 쌀국수, 떡볶이, 김밥, 만두")} />
            <Preset label="양식" onClick={() => setRawItems("파스타, 피자, 리조또, 샐러드, 치즈버거, 스테이크, 샌드위치")} />
            <Preset label="가볍게" onClick={() => setRawItems("샐러드, 포케, 샌드위치, 주먹밥, 요거트볼, 수프")} />
            <button
              onClick={() => setRawItems("")}
              className="px-3 py-1.5 text-sm rounded-full border border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              비우기
            </button>
          </div>

          {/* Preview */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">현재 항목 ({items.length})</h3>
            {items.length ? (
              <ul className="flex flex-wrap gap-2">
                {items.map((it, i) => (
                  <li key={i} className="text-sm px-3 py-1 rounded-full border border-gray-200 bg-gray-50">
                    {it}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">메뉴를 입력하면 여기 표시됩니다.</p>
            )}

            {recent.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">최근 결과</h3>
                <ul className="flex flex-wrap gap-2">
                  {recent.map((r, i) => (
                    <li key={`${r}-${i}`} className="text-xs px-2.5 py-1 rounded-full border border-pink-200 bg-pink-50 text-pink-700">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-gray-500 text-sm border-t border-pink-200">
        © {new Date().getFullYear()} Vibe Coding. 점심도 개발처럼 빠르게 결정 ✨
      </footer>
    </main>
  );
}

// ---------------------------------
// Small helpers
// ---------------------------------
function Preset({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-sm rounded-full border border-pink-200 bg-pink-50 hover:bg-pink-100 text-pink-700 transition"
    >
      {label}
    </button>
  );
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function useResponsiveWheelSize() {
  const [size, setSize] = useState(380);
  useEffect(() => {
    function onResize() {
      const w = window.innerWidth;
      const base = Math.min(440, Math.max(320, Math.floor(w * 0.6)));
      setSize(base);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}
// Tiny WebAudio beep (no external assets)
let audioCtx: AudioContext | null = null;
function beep(freq: number, durationSec: number) {
  try {
    const win = window as Window & {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioCtor = win.AudioContext || win.webkitAudioContext;
    if (!AudioCtor) return;
    audioCtx = audioCtx || new AudioCtor();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = 0.08;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      o.disconnect();
      g.disconnect();
    }, Math.max(10, durationSec * 1000));
  } catch {}
}


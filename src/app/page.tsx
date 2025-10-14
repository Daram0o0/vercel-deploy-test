"use client";

import { useMemo, useRef, useState } from "react";

export default function LunchRoulettePage() {
  // 기본 메뉴들 (쉼표로 추가/삭제 가능)
  const [rawItems, setRawItems] = useState(
    "김치찌개, 제육볶음, 돈까스, 냉면, 칼국수, 부대찌개, 비빔밥, 초밥, 파스타, 쌀국수, 치즈버거, 샐러드"
  );
  const items = useMemo(
    () =>
      rawItems
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [rawItems]
  );

  // 룰렛 회전 상태
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const seg = items.length || 1;
  const perDeg = 360 / seg;

  // conic-gradient로 영역 색상 생성
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
  const gradient = useMemo(() => {
    if (items.length === 0) return "#eee";
    const stops = items.map((_, i) => {
      const color = palette[i % palette.length];
      const start = (i * perDeg).toFixed(4);
      const end = ((i + 1) * perDeg).toFixed(4);
      return `${color} ${start}deg ${end}deg`;
    });
    return `conic-gradient(${stops.join(",")})`;
  }, [items, perDeg]);

  // 회전 종료 후 승자 계산
  const onSpinEnd = () => {
    setSpinning(false);
    // 각도는 시계방향 증가, 포인터는 "위쪽(12시 방향)"을 가리킴
    const norm = ((angle % 360) + 360) % 360; // [0,360)
    // conic-gradient는 0deg가 3시 방향이지만, transform 회전 기준은 12시 포인터를 기준으로 계산
    // 실제로는 12시(포인터) 기준으로 어떤 구간이 걸렸는지 확인하려면, 90deg 보정
    const pointerDegFromConic = (90 - norm + 360) % 360;
    const idx = Math.floor(pointerDegFromConic / perDeg) % seg;
    setWinner(items[idx] ?? null);
  };

  const spin = () => {
    if (spinning || items.length === 0) return;
    setWinner(null);
    setSpinning(true);

    // 최소 5~7바퀴 + 랜덤 세그먼트 중심으로 정밀 조준
    const baseTurns = 360 * (5 + Math.floor(Math.random() * 3)); // 5~7바퀴
    const targetIndex = Math.floor(Math.random() * seg);
    // 목표 세그먼트 중앙각(포인터 기준 12시 방향에서 seg 중앙에 멈추도록 90deg 보정)
    const targetAngle = 90 - (targetIndex + 0.5) * perDeg;
    // 소수점 미세 랜덤으로 자연스럽게
    const jitter = (Math.random() - 0.5) * (perDeg * 0.2);
    const next = angle + baseTurns + targetAngle + jitter;
    setAngle(next);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-purple-100 text-gray-800 flex flex-col items-center">
      {/* 헤더 */}
      <header className="w-full max-w-6xl px-6 pt-10 pb-4 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-pink-400 via-rose-400 to-purple-500 bg-clip-text text-transparent">
          점심메뉴 룰렛
        </h1>
        <span className="hidden sm:inline text-sm text-gray-500">
          Today is a great day to eat well ✨
        </span>
      </header>

      {/* 메인 레이아웃 */}
      <section className="w-full max-w-6xl px-6 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* 룰렛 영역 */}
        <div className="relative flex flex-col items-center">
          {/* 포인터 */}
          <div className="absolute -top-3 z-20 w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[24px] border-b-pink-500 drop-shadow" />

          {/* 바깥 링 데코 */}
          <div className="relative mt-10">
            <div
              className="rounded-full"
              style={{
                width: 420,
                height: 420,
                background:
                  "radial-gradient(closest-side, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)",
                filter: "blur(8px)",
                position: "absolute",
                inset: 0,
                transform: "translate(-8px, -8px)",
                zIndex: 0,
              }}
            />
          </div>

          {/* 룰렛 휠 */}
          <div
            ref={wheelRef}
            onTransitionEnd={onSpinEnd}
            className="relative z-10 rounded-full shadow-2xl border-8 border-white"
            style={{
              width: 380,
              height: 380,
              background: gradient,
              transform: `rotate(${angle}deg)`,
              transition: spinning
                ? "transform 3.2s cubic-bezier(0.22, 0.61, 0.36, 1)"
                : "none",
            }}
          >
            {/* 가운데 허브 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-white/90 backdrop-blur-md border border-pink-200 shadow-lg flex flex-col items-center justify-center">
                <span className="text-xs text-gray-400">점심 돌리기</span>
                <button
                  onClick={spin}
                  className="mt-1 px-4 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow hover:shadow-md active:scale-95 transition"
                  disabled={spinning || items.length === 0}
                >
                  돌려! 🎯
                </button>
              </div>
            </div>

            {/* 세그먼트 라인 (시각적 경계) */}
            {items.map((_, i) => (
              <div
                key={`line-${i}`}
                className="absolute left-1/2 top-1/2 w-[2px] h-[190px] bg-white/70 origin-bottom"
                style={{ transform: `rotate(${i * perDeg}deg) translate(-1px, -190px)` }}
              />
            ))}
          </div>

          {/* 결과 */}
          <div className="mt-8 text-center">
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

        {/* 메뉴 편집 & 프리셋 */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-pink-100 p-6">
          <h2 className="text-xl font-semibold mb-3">메뉴 편집</h2>
          <p className="text-sm text-gray-500 mb-3">
            쉼표(, )로 구분해서 입력하세요. 예:{" "}
            <code className="bg-gray-100 px-1 rounded">김치찌개, 제육볶음, 돈까스</code>
          </p>
          <textarea
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
            <Preset
              label="면/분식"
              onClick={() =>
                setRawItems("라멘, 우동, 칼국수, 냉면, 쌀국수, 떡볶이, 김밥, 만두")
              }
            />
            <Preset
              label="양식"
              onClick={() =>
                setRawItems("파스타, 피자, 리조또, 샐러드, 치즈버거, 스테이크, 샌드위치")
              }
            />
            <Preset
              label="가볍게"
              onClick={() =>
                setRawItems("샐러드, 포케, 샌드위치, 주먹밥, 요거트볼, 수프")
              }
            />
          </div>

          {/* 현재 항목 미리보기 */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">현재 항목</h3>
            {items.length ? (
              <ul className="flex flex-wrap gap-2">
                {items.map((it, i) => (
                  <li
                    key={i}
                    className="text-sm px-3 py-1 rounded-full border border-gray-200 bg-gray-50"
                  >
                    {it}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">메뉴를 입력하면 여기 표시됩니다.</p>
            )}
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="w-full py-8 text-center text-gray-500 text-sm border-t border-pink-200">
        © {new Date().getFullYear()} Vibe Coding. 점심도 개발처럼 빠르게 결정 ✨
      </footer>
    </main>
  );
}

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
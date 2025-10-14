export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-b from-rose-50 via-pink-50 to-purple-100 text-gray-800">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center pt-32 pb-24 px-6 relative">
        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-pink-400 via-rose-400 to-purple-500 bg-clip-text text-transparent drop-shadow-md">
          감정 일기장
        </h1>
        <p className="mt-6 text-lg max-w-xl text-gray-600 leading-relaxed">
          하루의 감정을 기록하고, 나를 이해하는 여정을 시작하세요. 
          <hr/>
          <span className="font-semibold text-pink-500">감정은 당신의 언어입니다.</span>
        </p>

        <a
          href="/diary"
          className="mt-10 inline-block px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-transform"
        >
          지금 시작하기 💖
        </a>

        {/* Blur glow effect */}
        <div className="absolute top-0 left-0 w-full h-[400px] -z-10 bg-gradient-to-b from-pink-200/50 to-transparent blur-3xl" />
      </section>

      {/* Feature Section */}
      <section className="max-w-6xl w-full px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-24">
        {[
          {
            icon: "📝",
            title: "감정 기록",
            desc: "오늘의 감정을 텍스트, 색상, 또는 이모지로 표현해보세요.",
          },
          {
            icon: "📊",
            title: "무드 리포트",
            desc: "AI가 감정 패턴을 분석해 맞춤형 인사이트를 제공합니다.",
          },
          {
            icon: "💫",
            title: "리마인드",
            desc: "지난 감정을 돌아보며 성장의 여정을 확인하세요.",
          },
        ].map((item, index) => (
          <div
            key={index}
            className="p-8 bg-white/80 backdrop-blur-md rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all text-center"
          >
            <div className="text-5xl mb-4">{item.icon}</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">{item.title}</h3>
            <p className="text-gray-600 text-sm">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* Quote Section */}
      <section className="text-center mb-32 px-8">
        <p className="text-2xl italic text-gray-700 leading-relaxed max-w-3xl mx-auto">
          “기억은 사라지지만 감정은 남는다.  
          <br />
          감정을 기록하는 일은 <span className="text-pink-500 font-semibold">나 자신을 지키는 일</span>입니다.”
        </p>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-gray-500 text-sm border-t border-pink-200">
        © {new Date().getFullYear()} Vibe Coding. All rights reserved.
      </footer>
    </main>
  );
}
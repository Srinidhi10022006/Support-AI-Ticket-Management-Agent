export function FeatureCard({ icon, title, bullets = [] }) {
  return (
    <div className="group rounded-2xl p-2 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[#3B82F6]" aria-hidden>
          {icon}
        </div>
        <div>
          <div className="text-[15px] font-semibold text-white">{title}</div>
          {bullets.length > 0 ? (
            <ul className="mt-1.5 space-y-1 text-sm text-white/70">
              {bullets.map((b) => (
                <li key={b} className="leading-relaxed">
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  )
}

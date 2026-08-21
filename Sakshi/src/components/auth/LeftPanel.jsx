import { Brain, ShieldCheck, Zap } from 'lucide-react'
import robotImage from '../../assets/robot.webp'
import { FeatureCard } from './FeatureCard.jsx'

export function LeftPanel() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#071a4a] via-[#0c2f80] to-[#155dfc]">
      <div className="pointer-events-none absolute inset-0 opacity-85">
        <div className="absolute -left-10 top-12 h-[320px] w-[320px] rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute right-[-60px] top-[40px] h-[260px] w-[260px] rounded-full bg-blue-300/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/2 h-[420px] w-[540px] -translate-x-1/2 rounded-full bg-indigo-400/15 blur-3xl" />

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 600 600"
          preserveAspectRatio="none"
          aria-hidden
        >
          {[0, 1, 2, 3, 4, 5, 6, 7].map((line) => (
            <path
              key={line}
              d={`M-${100 + line * 12},${430 + line * 28} C130,${385 + line * 10} 270,${470 + line * 5} 650,${180 + line * 34}`}
              fill="none"
              stroke="rgba(147,197,253,0.16)"
              strokeWidth="1.2"
            />
          ))}
        </svg>
      </div>

      <div className="relative flex min-h-screen flex-col justify-between px-8 py-8 sm:px-10 lg:px-12">
        <div className="animate-fadeIn">
          <div className="text-[30px] font-medium tracking-tight text-white sm:text-[36px]">Infosys</div>

          <h1 className="mt-12 max-w-md text-[42px] font-bold leading-[1.08] tracking-tight text-white sm:text-[52px]">
            <span className="block">
              Support <span className="text-[#2E89FF]">AI</span>
            </span>
            <span className="mt-2 block text-[0.58em] font-medium text-white">Ticket Management Agent</span>
          </h1>

          <div className="mt-8 h-1 w-14 rounded-full bg-[#2E89FF]" />

          <p className="mt-8 max-w-sm text-[17px] leading-9 text-white">
            AI-powered ticket management system that helps employees raise issues and get faster resolutions.
          </p>

          <div className="mt-8">
            <div className="relative h-[250px] w-full max-w-[360px]">
              <div className="absolute bottom-4 left-4 h-4 w-[260px] rounded-full bg-[#04153f]/55 blur-xl" />

              <div className="absolute left-[34px] top-[58px] animate-floaty">
                <div className="relative">
                  <div className="absolute left-[34px] top-[42px] h-[150px] w-[190px] rounded-full bg-white/28 blur-3xl" />
                  <img
                    src={robotImage}
                    alt="AI support robot working on a laptop"
                    className="relative z-10 w-[290px] max-w-none select-none object-contain drop-shadow-[0_18px_28px_rgba(5,20,60,0.42)]"
                    draggable="false"
                  />
                </div>
              </div>

              <div className="absolute bottom-[18px] left-[8px] h-px w-[92%] bg-white/12" />
            </div>
          </div>
        </div>

        <div className="pb-4">
          <div className="mb-4 h-px w-full bg-white/12" />
          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard
              icon={<Brain className="h-5 w-5" />}
              title="AI Prioritization"
              bullets={['Smart ticket prioritization']}
            />
            <FeatureCard
              icon={<Zap className="h-5 w-5" />}
              title="Faster Resolution"
              bullets={['Quick routing to the right team']}
            />
            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Better Tracking"
              bullets={['Real-time status and transparency']}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

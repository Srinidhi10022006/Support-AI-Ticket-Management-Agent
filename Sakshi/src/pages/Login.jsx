import { LeftPanel } from '../components/auth/LeftPanel.jsx'
import { RightPanel } from '../components/auth/RightPanel.jsx'

export function Login() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen flex-col xl:flex-row">
        <div className="relative w-full xl:w-[42%]">
          <LeftPanel />
        </div>
        <div className="w-full xl:w-[58%]">
          <RightPanel />
        </div>
      </div>
    </div>
  )
}

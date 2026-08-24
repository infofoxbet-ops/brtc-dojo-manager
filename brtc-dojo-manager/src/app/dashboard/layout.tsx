import { ReactNode } from "react"
import { LayoutDashboard, Users, UserPlus, Trophy, Calendar, MapPin, Settings, LogOut, Award } from "lucide-react"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar - base fittizia per ora */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-14 items-center border-b px-6 lg:h-[60px]">
          <span className="font-semibold text-lg tracking-tight">BRTC DojoManager</span>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium gap-1">
            <a href="/dashboard" className="flex items-center gap-3 rounded-lg bg-slate-100 px-3 py-2 text-slate-900 transition-all hover:text-slate-900">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </a>
            <a href="/dashboard/athletes" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 transition-all hover:text-slate-900">
              <Users className="h-4 w-4" />
              Atleti
            </a>
            <a href="/dashboard/attendance" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 transition-all hover:text-slate-900">
              <Calendar className="h-4 w-4" />
              Presenze
            </a>
            <a href="/dashboard/tournaments" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 transition-all hover:text-slate-900">
              <Trophy className="h-4 w-4" />
              Tornei
            </a>
            <a href="/dashboard/locations" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 transition-all hover:text-slate-900">
              <MapPin className="h-4 w-4" />
              Sedi / Filiali
            </a>
            <a href="/dashboard/exams" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 transition-all hover:text-slate-900">
              <Award className="h-4 w-4" />
              Esami / Gradi
            </a>
          </nav>
        </div>
        <div className="mt-auto p-4">
          <nav className="grid items-start gap-1 text-sm font-medium">
            <a href="/dashboard/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 transition-all hover:text-slate-900">
              <Settings className="h-4 w-4" />
              Impostazioni
            </a>
            <form action={async () => {
              'use server'
              const supabase = await createClient()
              await supabase.auth.signOut()
              redirect('/login')
            }}>
              <button type="submit" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 transition-all hover:text-slate-900 text-left w-full">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </form>
          </nav>
        </div>
      </aside>

      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64 w-full">
        {/* Header mobile (semplificato) */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="sm:hidden font-semibold">BRTC DojoManager</div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300"></div>
          </div>
        </header>

        {/* Contenuto principale */}
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  )
}

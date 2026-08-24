import { getExamSessions, createExamSession } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Award, Calendar, Plus, ChevronRight, CheckCircle2, FileClock } from 'lucide-react'
import Link from 'next/link'

export default async function ExamsPage() {
  const sessions = await getExamSessions()

  const activeSessions = sessions.filter(s => s.status === 'draft')
  const completedSessions = sessions.filter(s => s.status === 'completed')

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 w-full max-w-6xl mx-auto">
      {/* Intestazione */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Esami e Gradi</h1>
          <p className="text-muted-foreground text-sm">Pianifica le sessioni d'esame e gestisci l'avanzamento delle cinture degli atleti.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonna Sinistra: Modulo Creazione Sessione */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-card text-card-foreground shadow sticky top-6">
            <div className="p-6 border-b flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">Pianifica Sessione</h2>
            </div>
            
            <form action={createExamSession} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nome Sessione *</Label>
                <Input 
                  id="name" 
                  name="name" 
                  required 
                  placeholder="es. Sessione Estiva 2026" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="date">Data Esame *</Label>
                <Input 
                  id="date" 
                  name="date" 
                  type="date" 
                  required 
                />
              </div>

              <Button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-700">
                Pianifica Esame
              </Button>
            </form>
          </div>
        </div>

        {/* Colonna Destra: Elenco Sessioni d'Esame */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Sezione Sessioni Programmate */}
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileClock className="h-5 w-5 text-amber-500" />
                <h2 className="font-bold text-lg">Sessioni Programmate ({activeSessions.length})</h2>
              </div>
            </div>

            <div className="divide-y">
              {activeSessions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                  <Award className="h-8 w-8 opacity-20" />
                  Nessun esame in programma. Crea una sessione per iniziare.
                </div>
              ) : (
                activeSessions.map((session) => (
                  <Link 
                    key={session.id} 
                    href={`/dashboard/exams/${session.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-50 rounded-full text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base group-hover:text-primary transition-colors">{session.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" /> {new Date(session.date).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                        In Programma
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Sezione Sessioni Completate */}
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 border-b flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <h2 className="font-bold text-lg">Sessioni Completate ({completedSessions.length})</h2>
            </div>

            <div className="divide-y">
              {completedSessions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Nessuna sessione completata in precedenza.
                </div>
              ) : (
                completedSessions.map((session) => (
                  <Link 
                    key={session.id} 
                    href={`/dashboard/exams/${session.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base group-hover:text-primary transition-colors">{session.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" /> {new Date(session.date).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                        Completato
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

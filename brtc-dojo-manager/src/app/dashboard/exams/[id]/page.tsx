import { 
  getExamSessionById, 
  getExamCandidates, 
  getEligibleAthletes, 
  addCandidateToSession, 
  removeCandidateFromSession, 
  updateCandidateEvaluation, 
  finalizeExamSession 
} from '../actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Award, ArrowLeft, Calendar, UserPlus, Trash2, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const BELT_CATEGORIES = [
  'Bianca',
  'Gialla',
  'Arancio',
  'Verde',
  'Blu',
  'Marrone',
  'Nera 1° Dan',
  'Nera 2° Dan',
  'Nera 3° Dan',
  'Nera 4° Dan',
  'Nera 5° Dan'
]

function getNextBelt(currentBelt: string | null) {
  if (!currentBelt) return 'Bianca'
  const index = BELT_CATEGORIES.indexOf(currentBelt)
  if (index === -1 || index === BELT_CATEGORIES.length - 1) return currentBelt
  return BELT_CATEGORIES[index + 1]
}

export default async function ExamSessionDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id: sessionId } = await params

  const session = await getExamSessionById(sessionId)
  if (!session) {
    redirect('/dashboard/exams')
  }

  const candidates = await getExamCandidates(sessionId)
  const eligibleAthletes = await getEligibleAthletes(sessionId)

  const isCompleted = session.status === 'completed'

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-6xl mx-auto">
      {/* Intestazione */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/exams">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{session.name}</h1>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
                ${isCompleted ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}
              >
                {isCompleted ? 'Completata' : 'Bozza (In Corso)'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="h-3.5 w-3.5" /> Data Esame: {new Date(session.date).toLocaleDateString('it-IT')}
            </p>
          </div>
        </div>

        {!isCompleted && candidates.length > 0 && (
          <form action={async () => {
            'use server'
            await finalizeExamSession(sessionId)
          }}>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 font-semibold gap-2">
              <CheckCircle2 className="h-4 w-4" /> Finalizza ed Aggiorna Gradi
            </Button>
          </form>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gestione Candidati (Solo se sessione è in bozza) */}
        {!isCompleted && (
          <div className="lg:col-span-1">
            <div className="rounded-xl border bg-card text-card-foreground shadow sticky top-6">
              <div className="p-6 border-b flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-lg">Aggiungi Candidato</h2>
              </div>
              
              <div className="p-6">
                {eligibleAthletes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">Nessun atleta idoneo disponibile.</p>
                ) : (
                  <form action={async (formData) => {
                    'use server'
                    const athleteId = formData.get('athlete_id') as string
                    const targetBelt = formData.get('target_belt') as string
                    if (athleteId && targetBelt) {
                      await addCandidateToSession(sessionId, athleteId, targetBelt)
                    }
                  }} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="athlete_id">Seleziona Atleta</Label>
                      <select 
                        id="athlete_id" 
                        name="athlete_id" 
                        required
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Scegli atleta...</option>
                        {eligibleAthletes.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.last_name} {a.first_name} ({a.belt_category || 'Nessuna'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="target_belt">Cintura d'Esame</Label>
                      <select 
                        id="target_belt" 
                        name="target_belt" 
                        required
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {BELT_CATEGORIES.map(belt => (
                          <option key={belt} value={belt}>{belt}</option>
                        ))}
                      </select>
                    </div>

                    <Button type="submit" className="w-full mt-2">
                      Aggiungi alla Sessione
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabella Voti / Candidati */}
        <div className={isCompleted ? "lg:col-span-3" : "lg:col-span-2"}>
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 border-b flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">Foglio Candidati ed Esiti ({candidates.length})</h2>
            </div>

            <div className="divide-y">
              {candidates.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                  <Award className="h-10 w-10 opacity-20" />
                  Nessun candidato iscritto a questo esame. Aggiungi atleti a sinistra.
                </div>
              ) : (
                candidates.map((c) => {
                  const today = new Date().toISOString().split('T')[0]
                  const isMedCertExpired = c.athletes.medical_cert_expiry 
                    ? c.athletes.medical_cert_expiry < today 
                    : true

                  return (
                    <div key={c.id} className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:bg-slate-50/30 transition-colors">
                      {/* Dettagli Atleta */}
                      <div className="flex flex-col gap-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-base">{c.athletes.last_name} {c.athletes.first_name}</p>
                          {isMedCertExpired && (
                            <span className="inline-flex items-center gap-1 rounded bg-rose-50 text-rose-700 px-1.5 py-0.5 text-[10px] font-bold border border-rose-100">
                              <AlertTriangle className="h-3 w-3" /> Cert. Medico Scaduto/Assente
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Grado attuale: <span className="font-medium text-foreground">{c.athletes.belt_category || 'Nessuna'}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Esame per cintura: <span className="font-medium text-primary text-sm">{c.target_belt}</span>
                        </p>
                      </div>

                      {/* Gestione Voto e Esito */}
                      {isCompleted ? (
                        <div className="flex flex-col gap-1 text-right md:items-end">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold
                            ${c.status === 'passed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                              c.status === 'failed' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                              'bg-amber-100 text-amber-800 border-amber-200'}`}
                          >
                            {c.status === 'passed' ? 'Superato' : c.status === 'failed' ? 'Non Superato' : 'Rimandato'}
                          </span>
                          {c.notes && <p className="text-xs text-muted-foreground mt-1 max-w-sm italic">"{c.notes}"</p>}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col gap-3">
                          <form action={async (formData) => {
                            'use server'
                            const newStatus = formData.get('status') as any
                            const notes = formData.get('notes') as string
                            await updateCandidateEvaluation(sessionId, c.id, newStatus, notes)
                          }} className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Bottoni Scelta Rapida Esito */}
                              <div className="flex border rounded-lg overflow-hidden w-fit text-xs font-medium">
                                <button
                                  type="submit"
                                  name="status"
                                  value="passed"
                                  className={`px-3 py-1.5 flex items-center gap-1 border-r transition-colors ${c.status === 'passed' ? 'bg-emerald-500 text-white' : 'bg-background hover:bg-slate-50'}`}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Promosso
                                </button>
                                <button
                                  type="submit"
                                  name="status"
                                  value="failed"
                                  className={`px-3 py-1.5 flex items-center gap-1 border-r transition-colors ${c.status === 'failed' ? 'bg-rose-500 text-white' : 'bg-background hover:bg-slate-50'}`}
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Bocciato
                                </button>
                                <button
                                  type="submit"
                                  name="status"
                                  value="postponed"
                                  className={`px-3 py-1.5 flex items-center gap-1 transition-colors ${c.status === 'postponed' ? 'bg-amber-500 text-white' : 'bg-background hover:bg-slate-50'}`}
                                >
                                  <RefreshCw className="h-3.5 w-3.5" /> Rimandato
                                </button>
                              </div>

                              {/* Rimozione Candidato */}
                              <button
                                formAction={async () => {
                                  'use server'
                                  await removeCandidateFromSession(sessionId, c.id)
                                }}
                                className="p-1.5 rounded hover:bg-rose-50 hover:text-rose-600 transition-colors text-muted-foreground ml-auto"
                                title="Rimuovi candidato"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Note di valutazione */}
                            <div className="flex gap-2">
                              <input 
                                name="notes"
                                defaultValue={c.notes || ''}
                                placeholder="Aggiungi note sull'esame, voti o commenti..."
                                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                              <Button type="submit" size="sm" variant="secondary" className="h-8 gap-1 text-xs">
                                <Bookmark className="h-3.5 w-3.5" /> Salva Note
                              </Button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

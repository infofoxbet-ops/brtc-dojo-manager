import { ArrowLeft, Users, Trophy, Play } from "lucide-react"
import Link from "next/link"
import { getCategoryDetails, getAvailableAthletes, addParticipant, generateBracketAction } from "./actions"
import { notFound } from "next/navigation"

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string, catId: string }>
}) {
  const resolvedParams = await params
  const { id: tournamentId, catId: categoryId } = resolvedParams

  const { category, participants, matches } = await getCategoryDetails(tournamentId, categoryId)
  const availableAthletes = await getAvailableAthletes(categoryId)

  if (!category) {
    notFound()
  }

  const addParticipantWithIds = addParticipant.bind(null, tournamentId, categoryId)
  const generateBracketWithIds = generateBracketAction.bind(null, tournamentId, categoryId)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center space-x-4">
        <Link 
          href={`/dashboard/tournaments/${tournamentId}`} 
          className="inline-flex items-center justify-center rounded-md w-9 h-9 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {category.name}
          </h2>
          <div className="flex items-center text-sm text-muted-foreground space-x-2 mt-1">
            <span>{category.tournaments?.name}</span>
            <span>•</span>
            <span className="uppercase">{category.type}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Gestione Iscritti */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 pb-4 border-b flex justify-between items-center">
              <h3 className="font-semibold leading-none tracking-tight">Iscritti ({participants.length})</h3>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="p-4 border-b bg-muted/20">
              <form action={addParticipantWithIds} className="flex gap-2">
                <select 
                  name="athlete_id" 
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Seleziona atleta...</option>
                  {availableAthletes.map(a => (
                    <option key={a.id} value={a.id}>{a.last_name} {a.first_name}</option>
                  ))}
                </select>
                <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-3">
                  Aggiungi
                </button>
              </form>
            </div>

            <div className="p-0 overflow-y-auto max-h-[400px]">
              {participants.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nessun iscritto a questa categoria.
                </div>
              ) : (
                <ul className="divide-y">
                  {participants.map((p: any) => (
                    <li key={p.id} className="p-4 text-sm flex justify-between items-center hover:bg-muted/50">
                      <span className="font-medium">{p.athletes.last_name} {p.athletes.first_name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Tabellone */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-xl border bg-card text-card-foreground shadow h-full flex flex-col">
            <div className="p-6 pb-4 border-b flex justify-between items-center">
              <h3 className="font-semibold leading-none tracking-tight">Tabellone Torneo</h3>
              {matches.length > 0 ? (
                <Link href={`/dashboard/tournaments/${tournamentId}/categories/${categoryId}/bracket`}>
                  <button className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3">
                    <Trophy className="mr-2 h-3.5 w-3.5" /> Gestisci Tabellone & Arbitraggio
                  </button>
                </Link>
              ) : participants.length >= 2 ? (
                <Link href={`/dashboard/tournaments/${tournamentId}/categories/${categoryId}/generate`}>
                  <button className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors bg-emerald-600 text-white shadow hover:bg-emerald-700 h-8 px-3">
                    <Play className="mr-2 h-3.5 w-3.5" /> Genera Tabellone Incontri
                  </button>
                </Link>
              ) : null}
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              {matches.length === 0 ? (
                <div className="flex flex-1 items-center justify-center flex-col text-muted-foreground border-2 border-dashed rounded-lg p-12 text-center">
                  <Trophy className="h-10 w-10 mb-4 opacity-20" />
                  <p className="font-medium text-foreground">Il tabellone non è ancora stato generato.</p>
                  {participants.length >= 2 ? (
                    <div className="mt-4">
                      <Link href={`/dashboard/tournaments/${tournamentId}/categories/${categoryId}/generate`}>
                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4">
                          <Play className="mr-2 h-4 w-4" /> Procedi alla Generazione con Sorteggio
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <p className="text-xs mt-1">Aggiungi almeno 2 iscritti per abilitare la generazione automatica del tabellone.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Stato Incontri</h4>
                    <Link 
                      href={`/dashboard/tournaments/${tournamentId}/categories/${categoryId}/bracket`}
                      className="text-xs text-primary font-medium hover:underline flex items-center"
                    >
                      Apri Vista Completa ad Albero &rarr;
                    </Link>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {matches.slice(0, 8).map((match: any) => (
                      <div key={match.id} className="border rounded-lg p-3 bg-muted/10 text-xs flex flex-col gap-1.5">
                        <div className="flex justify-between text-muted-foreground font-semibold">
                          <span>Round {match.round_number} - Match {match.match_number}</span>
                          {match.is_bye && <span className="text-amber-600 font-bold">BYE</span>}
                        </div>
                        <div className="flex justify-between items-center py-1 border-t">
                          <span className={match.winner_id === match.athlete_a?.id ? "font-bold text-emerald-600" : ""}>
                            {match.athlete_a ? `${match.athlete_a.last_name} ${match.athlete_a.first_name}` : <span className="italic text-muted-foreground">BYE</span>}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t">
                          <span className={match.winner_id === match.athlete_b?.id ? "font-bold text-emerald-600" : ""}>
                            {match.athlete_b ? `${match.athlete_b.last_name} ${match.athlete_b.first_name}` : <span className="italic text-muted-foreground">BYE</span>}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

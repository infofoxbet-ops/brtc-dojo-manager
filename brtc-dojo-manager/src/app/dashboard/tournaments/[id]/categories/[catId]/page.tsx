import { ArrowLeft, Users, Trophy, Play } from "lucide-react"
import Link from "next/link"
import { getCategoryDetails, getAvailableAthletes, addParticipant, generateBracketAction } from "../../../bracket-actions"
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
              <h3 className="font-semibold leading-none tracking-tight">Tabellone (Eliminazione Diretta)</h3>
              {participants.length >= 2 && (
                <form action={generateBracketWithIds}>
                  <button type="submit" className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3">
                    <Play className="mr-2 h-3 w-3" /> Genera Incontri
                  </button>
                </form>
              )}
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              {matches.length === 0 ? (
                <div className="flex flex-1 items-center justify-center flex-col text-muted-foreground border-2 border-dashed rounded-lg p-12 text-center">
                  <Trophy className="h-10 w-10 mb-4 opacity-20" />
                  <p>Il tabellone non è ancora stato generato.</p>
                  <p className="text-xs mt-1">Aggiungi almeno 2 iscritti e clicca "Genera Incontri".</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Primo Turno</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {matches.map((match: any, index: number) => (
                      <div key={match.id} className="border rounded-lg overflow-hidden flex flex-col bg-muted/10 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20"></div>
                        <div className="flex justify-between items-center p-3 border-b bg-background">
                          <span className="text-sm font-medium truncate">
                            {match.athlete1 ? `${match.athlete1.last_name} ${match.athlete1.first_name}` : <span className="text-muted-foreground italic">BYE (Passa turno)</span>}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-background">
                          <span className="text-sm font-medium truncate">
                            {match.athlete2 ? `${match.athlete2.last_name} ${match.athlete2.first_name}` : <span className="text-muted-foreground italic">BYE (Passa turno)</span>}
                          </span>
                        </div>
                        {match.winner_id && (
                          <div className="p-2 text-xs text-center bg-emerald-50 text-emerald-700 font-medium border-t">
                            Vincitore: {match.athlete1 && match.winner_id === match.athlete1_id ? match.athlete1.last_name : match.athlete2?.last_name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                    <strong>Nota MVP:</strong> Questo è il tabellone degli accoppiamenti del primo turno. Nei futuri aggiornamenti verrà mostrato l'albero visivo completo fino alla finale.
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

import { Plus, Trophy, Calendar, MapPin } from "lucide-react"
import Link from "next/link"
import { getTournaments } from "./actions"

export default async function TournamentsPage() {
  const tournaments = await getTournaments()

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tornei</h2>
          <p className="text-muted-foreground">Gestisci le competizioni e crea i tabelloni di gara.</p>
        </div>
        <Link 
          href="/dashboard/tournaments/new" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
        >
          <Plus className="mr-2 h-4 w-4" /> Nuovo Torneo
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Trophy className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Nessun torneo organizzato</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Non hai ancora creato nessun torneo. Inizia creando il tuo primo evento per gestire categorie e tabelloni.
            </p>
            <Link 
              href="/dashboard/tournaments/new" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
            >
              Crea Torneo
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <Link key={tournament.id} href={`/dashboard/tournaments/${tournament.id}`}>
              <div className="group rounded-xl border bg-card text-card-foreground shadow transition-all hover:shadow-md hover:border-primary/50 overflow-hidden cursor-pointer h-full flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
                      ${tournament.status === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                        tournament.status === 'completed' ? 'bg-slate-100 text-slate-800 border-slate-200' : 
                        'bg-amber-100 text-amber-800 border-amber-200'}`}
                    >
                      {tournament.status === 'active' ? 'In corso' : tournament.status === 'completed' ? 'Concluso' : 'Bozza'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-xl leading-none tracking-tight mb-2 group-hover:text-primary transition-colors">
                    {tournament.name}
                  </h3>
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      {new Date(tournament.date).toLocaleDateString('it-IT')}
                    </div>
                    {tournament.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-2 h-4 w-4" />
                        {tournament.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

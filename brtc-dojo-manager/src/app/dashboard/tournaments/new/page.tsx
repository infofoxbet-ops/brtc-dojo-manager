import { Trophy, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createTournament } from "../actions"

export default async function NewTournamentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex flex-col space-y-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center space-x-4">
        <Link 
          href="/dashboard/tournaments" 
          className="inline-flex items-center justify-center rounded-md w-9 h-9 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nuovo Torneo</h2>
          <p className="text-muted-foreground">Crea un nuovo evento per generare i tabelloni.</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <form action={createTournament}>
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-md text-sm font-medium border border-rose-200">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium leading-none">Nome Evento *</label>
              <input
                id="name"
                name="name"
                required
                placeholder="es. Campionato Regionale 2026"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium leading-none">Data dell'Evento *</label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium leading-none">Luogo (opzionale)</label>
                <input
                  id="location"
                  name="location"
                  placeholder="es. Palazzetto dello Sport"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium leading-none">Descrizione o Note (opzionale)</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Regolamento, note aggiuntive..."
              />
            </div>

          </div>
          <div className="flex items-center justify-end p-6 pt-0 space-x-2">
            <Link 
              href="/dashboard/tournaments"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              Annulla
            </Link>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
            >
              <Trophy className="mr-2 h-4 w-4" /> Crea Torneo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

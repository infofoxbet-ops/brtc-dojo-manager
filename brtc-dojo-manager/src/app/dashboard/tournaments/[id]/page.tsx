import { Trophy, ArrowLeft, Calendar, MapPin, Users, Plus } from "lucide-react"
import Link from "next/link"
import { getTournamentById, createCategory } from "../actions"
import { notFound } from "next/navigation"

export default async function TournamentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const resolvedParams = await params
  const { error } = await searchParams
  
  const tournament = await getTournamentById(resolvedParams.id)

  if (!tournament) {
    notFound()
  }

  // Create an action bound to the specific tournament ID
  const createCategoryWithId = createCategory.bind(null, tournament.id)

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center space-x-4">
        <Link 
          href="/dashboard/tournaments" 
          className="inline-flex items-center justify-center rounded-md w-9 h-9 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {tournament.name}
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
              ${tournament.status === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                tournament.status === 'completed' ? 'bg-slate-100 text-slate-800 border-slate-200' : 
                'bg-amber-100 text-amber-800 border-amber-200'}`}
            >
              {tournament.status === 'active' ? 'In corso' : tournament.status === 'completed' ? 'Concluso' : 'Bozza'}
            </span>
          </h2>
          <div className="flex items-center text-sm text-muted-foreground space-x-4 mt-1">
            <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" /> {new Date(tournament.date).toLocaleDateString('it-IT')}</span>
            {tournament.location && <span className="flex items-center"><MapPin className="mr-1 h-3 w-3" /> {tournament.location}</span>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Lista Categorie */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Categorie di Gara</h3>
          </div>
          
          {tournament.tournament_categories && tournament.tournament_categories.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {tournament.tournament_categories.map((cat: any) => (
                <Link key={cat.id} href={`/dashboard/tournaments/${tournament.id}/categories/${cat.id}`}>
                  <div className="rounded-xl border bg-card text-card-foreground shadow hover:border-primary/50 transition-all cursor-pointer p-4 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider
                          ${cat.type === 'kata' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-rose-100 text-rose-800 border-rose-200'}`}>
                          {cat.type}
                        </span>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <h4 className="font-semibold text-lg leading-tight">{cat.name}</h4>
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        {cat.gender && <div>Genere: {cat.gender === 'M' ? 'Maschile' : cat.gender === 'F' ? 'Femminile' : 'Misto'}</div>}
                        {cat.age_group && <div>Fascia: {cat.age_group}</div>}
                        {cat.weight_category && <div>Peso: {cat.weight_category}</div>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              Nessuna categoria creata per questo torneo.
            </div>
          )}
        </div>

        {/* Form Aggiunta Categoria */}
        <div>
          <div className="rounded-xl border bg-card text-card-foreground shadow sticky top-6">
            <div className="p-6 pb-4 border-b">
              <h3 className="font-semibold leading-none tracking-tight">Aggiungi Categoria</h3>
            </div>
            <form action={createCategoryWithId}>
              <div className="p-6 space-y-4">
                {error && (
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-md text-xs font-medium border border-rose-200">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-medium leading-none">Nome Categoria *</label>
                  <input
                    id="name"
                    name="name"
                    required
                    placeholder="es. Kata Esordienti F"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="type" className="text-xs font-medium leading-none">Specialità *</label>
                  <select
                    id="type"
                    name="type"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="kata">Kata</option>
                    <option value="kumite">Kumite</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="gender" className="text-xs font-medium leading-none">Genere</label>
                    <select
                      id="gender"
                      name="gender"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Tutti</option>
                      <option value="M">Maschile</option>
                      <option value="F">Femminile</option>
                      <option value="mixed">Misto</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="weight_category" className="text-xs font-medium leading-none">Peso (Kumite)</label>
                    <input
                      id="weight_category"
                      name="weight_category"
                      placeholder="-60kg, Open..."
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="age_group" className="text-xs font-medium leading-none">Fascia Età</label>
                  <input
                    id="age_group"
                    name="age_group"
                    placeholder="es. Esordienti, Cadetti"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="p-6 pt-0">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                >
                  <Plus className="mr-2 h-4 w-4" /> Crea Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

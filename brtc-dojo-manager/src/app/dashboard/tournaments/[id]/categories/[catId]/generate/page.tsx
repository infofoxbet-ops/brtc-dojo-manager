import { generateBracketPreview, saveBracket, checkExistingBracket } from '../actions'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

export default async function GenerateBracketPreviewPage({
  params
}: {
  params: Promise<{ id: string, catId: string }>
}) {
  const { id, catId } = await params
  
  const exists = await checkExistingBracket(catId)

  if (exists) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-4xl mx-auto">
        <div className="bg-amber-100 text-amber-800 p-6 rounded-xl border border-amber-200 flex flex-col gap-4 items-center text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <h2 className="text-xl font-bold">Attenzione: Tabellone Già Generato</h2>
          <p>Esiste già un tabellone per questa categoria. Rigenerarlo cancellerà i risultati precedenti.</p>
          <div className="flex gap-4 mt-4">
            <Link href={`/dashboard/tournaments/${id}/categories/${catId}/bracket`}>
              <Button variant="default">Vai al Tabellone Esistente</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { matches, athletes } = await generateBracketPreview(id, catId)
  
  const getAthleteName = (athleteId: string | null) => {
    if (!athleteId) return 'BYE'
    const a = athletes.find((x: any) => x.id === athleteId)
    return a ? `${a.first_name} ${a.last_name}` : 'Sconosciuto'
  }

  const firstRoundMatches = matches.filter(m => m.round_number === 1)

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/tournaments/${id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Anteprima Tabellone</h1>
      </div>

      <div className="bg-card text-card-foreground rounded-xl border shadow p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-lg font-semibold">Primo Turno (Round 1)</h2>
            <p className="text-sm text-muted-foreground">{firstRoundMatches.length} match calcolati</p>
          </div>
          
          <form action={async () => {
            'use server'
            await saveBracket(matches)
            redirect(`/dashboard/tournaments/${id}/categories/${catId}/bracket`)
          }}>
            <Button type="submit" size="lg" className="bg-green-600 hover:bg-green-700">
              Conferma e Salva Tabellone
            </Button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {firstRoundMatches.map((m, i) => (
            <div key={m.id} className="border rounded-lg p-4 flex flex-col gap-2">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 border-b pb-2">Match {m.match_number}</div>
              
              <div className={`p-2 rounded flex justify-between items-center ${m.is_bye && m.winner_id === m.athlete_a_id ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
                <span className="font-medium">{getAthleteName(m.athlete_a_id)}</span>
                {m.is_bye && m.winner_id === m.athlete_a_id && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Passa</span>}
              </div>
              
              <div className="text-center text-xs text-muted-foreground font-bold">VS</div>
              
              <div className={`p-2 rounded flex justify-between items-center ${m.is_bye && m.winner_id === m.athlete_b_id ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
                <span className="font-medium">{getAthleteName(m.athlete_b_id)}</span>
                {m.is_bye && m.winner_id === m.athlete_b_id && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Passa</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

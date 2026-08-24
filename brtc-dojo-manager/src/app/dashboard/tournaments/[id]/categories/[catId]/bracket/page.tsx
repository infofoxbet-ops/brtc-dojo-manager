import { getBracket, deleteBracket } from '../actions'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { BracketClient } from './bracket-client'

export default async function BracketPage({
  params
}: {
  params: Promise<{ id: string, catId: string }>
}) {
  const { id, catId } = await params
  
  const matches = await getBracket(catId)

  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  let athletes: any[] = []
  let categoryType = 'kumite'
  
  if (session) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', session.user.id)
      .single()

    if (roleData) {
      const { data: athletesData } = await supabase
        .from('athletes')
        .select('id, first_name, last_name')
        .eq('organization_id', roleData.organization_id)
      
      if (athletesData) {
        athletes = athletesData
      }

      const { data: catData } = await supabase
        .from('tournament_categories')
        .select('type')
        .eq('id', catId)
        .single()
      if (catData) {
        categoryType = catData.type
      }
    }
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-4xl mx-auto">
        <div className="text-center p-8 bg-card rounded border">
          <h2 className="text-xl font-bold mb-4">Nessun tabellone generato</h2>
          <Link href={`/dashboard/tournaments/${id}/categories/${catId}/generate`}>
            <Button>Genera Tabellone</Button>
          </Link>
        </div>
      </div>
    )
  }

  const maxRound = Math.max(...matches.map((m: any) => m.round_number))
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1)

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/tournaments/${id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Gestione Tabellone</h1>
        </div>

        <div className="flex gap-2">
          <form action={async () => {
            'use server'
            await deleteBracket(catId)
          }}>
            <Button variant="destructive" size="sm" type="submit">
              <Trash2 className="h-4 w-4 mr-2" /> Elimina Tabellone
            </Button>
          </form>
        </div>
      </div>

      <div className="bg-card text-card-foreground rounded-xl border shadow p-6 overflow-x-auto">
        <div className="flex min-w-max gap-8">
          {rounds.map(round => {
            const roundMatches = matches.filter((m: any) => m.round_number === round)
            return (
              <div key={round} className="flex flex-col gap-4 w-64">
                <h3 className="font-bold text-center border-b pb-2">
                  {round === maxRound ? 'Finale' : round === maxRound - 1 ? 'Semifinali' : `Round ${round}`}
                </h3>
                
                <div className="flex flex-col justify-around h-full gap-4">
                  {roundMatches.map((m: any) => (
                    <BracketClient 
                      key={m.id} 
                      match={m} 
                      athletes={athletes} 
                      categoryType={categoryType}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

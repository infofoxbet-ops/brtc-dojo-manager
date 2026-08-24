'use client'

import { useState } from 'react'
import { declareWinner } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function BracketClient({ match, athletes, categoryType = 'kumite' }: { match: any, athletes: any[], categoryType?: string }) {
  const [open, setOpen] = useState(false)
  const [scoreA, setScoreA] = useState<string>(match.score_a?.toString() || '')
  const [scoreB, setScoreB] = useState<string>(match.score_b?.toString() || '')
  const [loading, setLoading] = useState(false)

  const getAthleteName = (id: string | null) => {
    if (!id) return 'In attesa...'
    const a = athletes.find((x) => x.id === id)
    return a ? `${a.first_name} ${a.last_name}` : 'Sconosciuto'
  }

  const isCompleted = !!match.winner_id
  const hasAthletes = match.athlete_a_id && match.athlete_b_id

  const handleDeclareWinner = async (winnerId: string) => {
    try {
      setLoading(true)
      const sA = scoreA === '' ? null : parseFloat(scoreA)
      const sB = scoreB === '' ? null : parseFloat(scoreB)
      await declareWinner(match.id, winnerId, sA, sB)
      setOpen(false)
    } catch (e) {
      console.error(e)
      alert("Errore durante l'operazione")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <div 
            className={`border rounded-lg p-3 flex flex-col gap-2 relative ${hasAthletes && !isCompleted ? 'cursor-pointer hover:border-blue-500 shadow-sm' : 'opacity-70'} ${isCompleted ? 'bg-slate-50' : 'bg-white'}`}
          />
        }
        onClick={(e) => {
          if (!hasAthletes || isCompleted || match.is_bye) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
      >
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Match {match.match_number}</div>
        
        <div className={`p-2 rounded text-sm flex justify-between items-center ${match.winner_id === match.athlete_a_id ? 'bg-green-100 font-bold' : 'bg-slate-100'}`}>
          <span className="truncate mr-2">{getAthleteName(match.athlete_a_id)}</span>
          <span className="font-mono text-xs">{match.score_a !== null ? match.score_a : '-'}</span>
        </div>
        
        <div className={`p-2 rounded text-sm flex justify-between items-center ${match.winner_id === match.athlete_b_id ? 'bg-green-100 font-bold' : 'bg-slate-100'}`}>
          <span className="truncate mr-2">{getAthleteName(match.athlete_b_id)}</span>
          <span className="font-mono text-xs">{match.score_b !== null ? match.score_b : '-'}</span>
        </div>

        {match.is_bye && (
          <div className="absolute -top-2 -right-2 bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            BYE
          </div>
        )}
      </DialogTrigger>

      {hasAthletes && !isCompleted && !match.is_bye && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestione Match {match.match_number} ({categoryType.toUpperCase()})</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-6 items-start divide-x">
              {/* Athlete A Column */}
              <div className="flex flex-col gap-3">
                <Label className="text-center font-bold text-base text-blue-600 dark:text-blue-400">
                  {getAthleteName(match.athlete_a_id)}
                </Label>
                <Input 
                  type="number" 
                  step={categoryType === 'kata' ? "0.1" : "1"}
                  value={scoreA} 
                  onChange={e => setScoreA(e.target.value)} 
                  placeholder={categoryType === 'kata' ? "es. 24.5" : "Punti"}
                  className="text-center text-lg font-semibold"
                />
                
                {categoryType === 'kumite' && (
                  <div className="grid grid-cols-3 gap-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => setScoreA(p => (parseInt(p || '0') + 1).toString())}>+1</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setScoreA(p => (parseInt(p || '0') + 2).toString())}>+2</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setScoreA(p => (parseInt(p || '0') + 3).toString())}>+3</Button>
                  </div>
                )}
                
                <Button 
                  disabled={loading} 
                  onClick={() => handleDeclareWinner(match.athlete_a_id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white w-full mt-2"
                >
                  Vincitore
                </Button>
              </div>

              {/* Athlete B Column */}
              <div className="flex flex-col gap-3 pl-6">
                <Label className="text-center font-bold text-base text-rose-600 dark:text-rose-400">
                  {getAthleteName(match.athlete_b_id)}
                </Label>
                <Input 
                  type="number" 
                  step={categoryType === 'kata' ? "0.1" : "1"}
                  value={scoreB} 
                  onChange={e => setScoreB(e.target.value)} 
                  placeholder={categoryType === 'kata' ? "es. 24.5" : "Punti"}
                  className="text-center text-lg font-semibold"
                />
                
                {categoryType === 'kumite' && (
                  <div className="grid grid-cols-3 gap-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => setScoreB(p => (parseInt(p || '0') + 1).toString())}>+1</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setScoreB(p => (parseInt(p || '0') + 2).toString())}>+2</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setScoreB(p => (parseInt(p || '0') + 3).toString())}>+3</Button>
                  </div>
                )}
                
                <Button 
                  disabled={loading} 
                  onClick={() => handleDeclareWinner(match.athlete_b_id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white w-full mt-2"
                >
                  Vincitore
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Inserisci i punteggi ed eventualmente premi "Vincitore" sotto l'atleta desiderato per farlo avanzare al turno successivo.
            </p>
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}

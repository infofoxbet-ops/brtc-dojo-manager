import { getAthletes } from '../athletes/actions'
import { getAttendancesByDate, upsertAttendance } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const date = resolvedSearchParams.date || today

  const athletes = await getAthletes()
  const attendances = await getAttendancesByDate(date)

  // Map of athlete_id -> status
  const attendanceMap = new Map<string, string>()
  attendances.forEach(a => {
    attendanceMap.set(a.athlete_id, a.status)
  })

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Presenze</h1>
        
        <form action={async (formData) => {
          'use server'
          redirect(`/dashboard/attendance?date=${formData.get('date')}`)
        }} className="flex items-center gap-2">
          <Input 
            type="date" 
            name="date" 
            defaultValue={date}
            className="w-auto"
          />
          <Button type="submit" variant="secondary">Cambia Data</Button>
        </form>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Registro del {new Date(date).toLocaleDateString('it-IT')}</h2>
        </div>
        
        <div className="divide-y">
          {athletes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nessun atleta registrato.
            </div>
          ) : (
            athletes.map(athlete => {
              const status = attendanceMap.get(athlete.id) || 'absent'
              
              return (
                <div key={athlete.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                  <div>
                    <p className="font-medium">{athlete.first_name} {athlete.last_name}</p>
                    {athlete.belt_category && (
                      <p className="text-xs text-muted-foreground">{athlete.belt_category}</p>
                    )}
                  </div>
                  
                  <form action={async () => {
                    'use server'
                    const newStatus = status === 'present' ? 'absent' : 'present'
                    await upsertAttendance(athlete.id, date, newStatus)
                  }}>
                    <Button 
                      type="submit" 
                      variant={status === 'present' ? 'default' : 'outline'}
                      className={status === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {status === 'present' ? 'Presente' : 'Assente'}
                    </Button>
                  </form>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

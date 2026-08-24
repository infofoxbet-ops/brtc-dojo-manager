'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function getAttendancesByDate(date: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: roleData } = await adminClient
    .from('user_roles')
    .select('organization_id')
    .eq('user_id', session.user.id)
    .single()

  if (!roleData?.organization_id) return []

  const { data, error } = await adminClient
    .from('attendance')
    .select('*')
    .eq('organization_id', roleData.organization_id)
    .eq('date', date)

  if (error) {
    console.error('Error fetching attendances:', error)
    return []
  }

  return data
}

export async function upsertAttendance(athleteId: string, date: string, status: 'present' | 'absent' | 'excused') {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Non autenticato')

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: roleData } = await adminClient
    .from('user_roles')
    .select('organization_id')
    .eq('user_id', session.user.id)
    .single()

  if (!roleData?.organization_id) throw new Error('Organizzazione non trovata')

  const { error } = await adminClient
    .from('attendance')
    .upsert({
      athlete_id: athleteId,
      date: date,
      status: status,
      organization_id: roleData.organization_id
    }, { onConflict: 'athlete_id,date' })

  if (error) {
    console.error('Error upserting attendance:', error)
    throw new Error('Errore durante il salvataggio della presenza')
  }

  revalidatePath('/dashboard/attendance')
}

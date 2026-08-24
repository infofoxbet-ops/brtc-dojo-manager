'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function getAthletes() {
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
    .from('athletes')
    .select('*')
    .eq('organization_id', roleData.organization_id)
    .order('last_name', { ascending: true })

  if (error) {
    console.error('Error fetching athletes:', error)
    return []
  }

  return data
}

export async function createAthlete(formData: FormData) {
  const supabase = await createClient()

  // Ottieni l'id dell'organizzazione dell'utente loggato
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Utente non autenticato')
  }

  // Usiamo il service role per bypassare i problemi del token JWT (RLS) e leggere dal database
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: roleData, error: roleError } = await adminClient
    .from('user_roles')
    .select('organization_id')
    .eq('user_id', session.user.id)
    .single()

  const organizationId = roleData?.organization_id

  if (!organizationId) {
    throw new Error('Impossibile trovare la palestra nel database. Contatta il supporto.')
  }

  const athleteData = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    date_of_birth: formData.get('date_of_birth') as string,
    gender: formData.get('gender') as string,
    fiscal_code: formData.get('fiscal_code') as string,
    medical_cert_expiry: formData.get('medical_cert_expiry') as string || null,
    weight: formData.get('weight') ? parseFloat(formData.get('weight') as string) : null,
    height: formData.get('height') ? parseInt(formData.get('height') as string) : null,
    belt_category: formData.get('belt_category') as string || null,
    location_id: formData.get('location_id') as string || null,
    organization_id: organizationId,
  }

  const { error } = await adminClient
    .from('athletes')
    .insert(athleteData)

  if (error) {
    console.error('Error creating athlete:', error)
    redirect('/dashboard/athletes/new?error=Errore durante il salvataggio nel database: ' + encodeURIComponent(error.message))
  }

  revalidatePath('/dashboard/athletes')
  redirect('/dashboard/athletes')
}

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function getLocations() {
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
    .from('locations')
    .select('*')
    .eq('organization_id', roleData.organization_id)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching locations:', error)
    return []
  }

  return data
}

export async function createLocation(formData: FormData) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Utente non autenticato')
  }

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: roleData } = await adminClient
    .from('user_roles')
    .select('organization_id')
    .eq('user_id', session.user.id)
    .single()

  const organizationId = roleData?.organization_id

  if (!organizationId) {
    throw new Error('Impossibile trovare la palestra nel database. Contatta il supporto.')
  }

  const locationData = {
    name: formData.get('name') as string,
    address: formData.get('address') as string || null,
    city: formData.get('city') as string || null,
    province: formData.get('province') as string || null,
    cap: formData.get('cap') as string || null,
    phone: formData.get('phone') as string || null,
    email: formData.get('email') as string || null,
    organization_id: organizationId,
  }

  const { error } = await adminClient
    .from('locations')
    .insert(locationData)

  if (error) {
    console.error('Error creating location:', error)
    redirect('/dashboard/locations/new?error=Errore durante il salvataggio: ' + encodeURIComponent(error.message))
  }

  revalidatePath('/dashboard/locations')
  redirect('/dashboard/locations')
}

export async function deleteLocation(id: string) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Utente non autenticato')

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await adminClient
    .from('locations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting location:', error)
    throw new Error("Errore durante l'eliminazione della sede")
  }

  revalidatePath('/dashboard/locations')
}

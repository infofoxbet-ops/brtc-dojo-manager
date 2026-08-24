'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

async function getAdminClientAndOrgId() {
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
    throw new Error('Nessuna palestra associata')
  }

  return { adminClient, organizationId }
}

export async function getTournaments() {
  try {
    const { adminClient, organizationId } = await getAdminClientAndOrgId()

    const { data, error } = await adminClient
      .from('tournaments')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching tournaments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error(error)
    return []
  }
}

export async function getTournamentById(id: string) {
  try {
    const { adminClient, organizationId } = await getAdminClientAndOrgId()

    const { data, error } = await adminClient
      .from('tournaments')
      .select('*, tournament_categories(*)')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching tournament:', error)
      return null
    }

    return data
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function createTournament(formData: FormData) {
  const { adminClient, organizationId } = await getAdminClientAndOrgId()
  
  const name = formData.get('name') as string
  const date = formData.get('date') as string
  const location = formData.get('location') as string
  const description = formData.get('description') as string

  if (!name || !date) {
    redirect('/dashboard/tournaments/new?error=Nome e data sono obbligatori')
  }

  const { data, error } = await adminClient
    .from('tournaments')
    .insert({
      organization_id: organizationId,
      name,
      date,
      location,
      description,
      status: 'draft'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating tournament:', error)
    redirect('/dashboard/tournaments/new?error=Errore durante la creazione del torneo')
  }

  revalidatePath('/dashboard/tournaments')
  redirect(`/dashboard/tournaments/${data.id}`)
}

export async function createCategory(tournamentId: string, formData: FormData) {
  const { adminClient } = await getAdminClientAndOrgId()
  
  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const gender = formData.get('gender') as string
  const age_group = formData.get('age_group') as string
  const weight_category = formData.get('weight_category') as string

  if (!name || !type) {
    redirect(`/dashboard/tournaments/${tournamentId}?error=Nome e tipo sono obbligatori`)
  }

  const { error } = await adminClient
    .from('tournament_categories')
    .insert({
      tournament_id: tournamentId,
      name,
      type,
      gender: gender || null,
      age_group: age_group || null,
      weight_category: weight_category || null
    })

  if (error) {
    console.error('Error creating category:', error)
    redirect(`/dashboard/tournaments/${tournamentId}?error=Errore durante la creazione della categoria: ` + encodeURIComponent(error.message))
  }

  revalidatePath(`/dashboard/tournaments/${tournamentId}`)
  redirect(`/dashboard/tournaments/${tournamentId}`)
}

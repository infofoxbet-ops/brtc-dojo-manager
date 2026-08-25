'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function getOrgId() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Utente non autenticato')
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('organization_id')
    .eq('user_id', session.user.id)
    .single()

  const organizationId = roleData?.organization_id

  if (!organizationId) {
    throw new Error('Nessuna palestra associata')
  }

  return { organizationId }
}

export async function getTournaments() {
  try {
    const { organizationId } = await getOrgId()

    const { data, error } = await createClient().then(s => 
      s.from('tournaments')
        .select('*')
        .eq('organization_id', organizationId)
        .order('date', { ascending: false })
    )

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
    const { organizationId } = await getOrgId()
    const supabase = await createClient()

    const { data, error } = await supabase
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
  const { organizationId } = await getOrgId()
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const date = formData.get('date') as string
  const location = formData.get('location') as string
  const description = formData.get('description') as string

  if (!name || !date) {
    redirect('/dashboard/tournaments/new?error=Nome e data sono obbligatori')
  }

  const { data, error } = await supabase
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
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const gender = formData.get('gender') as string
  const age_group = formData.get('age_group') as string
  const weight_category = formData.get('weight_category') as string

  if (!name || !type) {
    redirect(`/dashboard/tournaments/${tournamentId}?error=Nome e tipo sono obbligatori`)
  }

  const { error } = await supabase
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

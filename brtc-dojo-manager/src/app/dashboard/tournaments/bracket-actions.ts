'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

async function getAdminClientAndOrgId() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) throw new Error('Utente non autenticato')

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: roleData } = await adminClient
    .from('user_roles')
    .select('organization_id')
    .eq('user_id', session.user.id)
    .single()

  if (!roleData?.organization_id) throw new Error('Nessuna palestra associata')

  return { adminClient, organizationId: roleData.organization_id }
}

export async function getCategoryDetails(tournamentId: string, categoryId: string) {
  const { adminClient } = await getAdminClientAndOrgId()

  const { data: category } = await adminClient
    .from('tournament_categories')
    .select('*, tournaments(name, date)')
    .eq('id', categoryId)
    .eq('tournament_id', tournamentId)
    .single()

  const { data: participants } = await adminClient
    .from('tournament_participants')
    .select('id, athletes(id, first_name, last_name, belt_category)')
    .eq('category_id', categoryId)

  const { data: matches } = await adminClient
    .from('tournament_matches')
    .select('*, athlete1:athletes!athlete1_id(first_name, last_name), athlete2:athletes!athlete2_id(first_name, last_name), winner:athletes!winner_id(id)')
    .eq('category_id', categoryId)
    .order('round_number', { ascending: false })
    .order('match_number', { ascending: true })

  return { category, participants: participants || [], matches: matches || [] }
}

export async function getAvailableAthletes(categoryId: string) {
  const { adminClient, organizationId } = await getAdminClientAndOrgId()

  const { data: allAthletes } = await adminClient
    .from('athletes')
    .select('id, first_name, last_name, gender, date_of_birth')
    .eq('organization_id', organizationId)
    .order('last_name')

  const { data: enrolled } = await adminClient
    .from('tournament_participants')
    .select('athlete_id')
    .eq('category_id', categoryId)

  const enrolledIds = new Set(enrolled?.map(p => p.athlete_id) || [])
  
  return (allAthletes || []).filter(a => !enrolledIds.has(a.id))
}

export async function addParticipant(tournamentId: string, categoryId: string, formData: FormData) {
  const athleteId = formData.get('athlete_id') as string
  if (!athleteId) return

  const { adminClient } = await getAdminClientAndOrgId()
  await adminClient.from('tournament_participants').insert({
    tournament_id: tournamentId,
    category_id: categoryId,
    athlete_id: athleteId
  })

  revalidatePath(`/dashboard/tournaments/${tournamentId}/categories/${categoryId}`)
}

export async function generateBracketAction(tournamentId: string, categoryId: string) {
  const { adminClient } = await getAdminClientAndOrgId()

  // 1. Prendi tutti i partecipanti
  const { data: participants } = await adminClient
    .from('tournament_participants')
    .select('athlete_id')
    .eq('category_id', categoryId)

  if (!participants || participants.length < 2) {
    throw new Error("Servono almeno 2 atleti per generare un tabellone")
  }

  // Pulisci vecchi incontri
  await adminClient.from('tournament_matches').delete().eq('category_id', categoryId)

  // Mescola partecipanti (shuffle)
  const shuffled = [...participants].sort(() => Math.random() - 0.5).map(p => p.athlete_id)
  
  const numAthletes = shuffled.length
  // Trova la potenza di 2 più vicina per il tabellone perfetto
  let bracketSize = 2
  while (bracketSize < numAthletes) bracketSize *= 2
  
  const numByes = bracketSize - numAthletes
  const firstRoundMatches = bracketSize / 2
  
  // Algoritmo base: creiamo gli incontri del primo turno (Quarti, Ottavi, etc)
  // Per semplicità MVP: uniamo a coppie. I Bye passano al turno successivo.
  
  let matchesToInsert = []
  
  // Questa logica MVP genera solo il primo turno.
  // Un tabellone completo richiede logiche ricorsive complesse, per l'MVP 
  // mostreremo gli accoppiamenti del primo turno.
  
  let athleteIndex = 0;
  for (let i = 0; i < firstRoundMatches; i++) {
    // Se ci sono byes, il primo atleta non combatte e va diretto al turno successivo (salvato come winner temporaneo o match bye)
    const isBye = i < numByes;
    const a1 = shuffled[athleteIndex++]
    const a2 = isBye ? null : shuffled[athleteIndex++]
    
    matchesToInsert.push({
      tournament_id: tournamentId,
      category_id: categoryId,
      round_number: 1,
      match_number: i + 1,
      athlete1_id: a1,
      athlete2_id: a2,
      winner_id: isBye ? a1 : null, // Se c'è il bye, vince in automatico a1
      status: isBye ? 'completed' : 'pending'
    })
  }

  await adminClient.from('tournament_matches').insert(matchesToInsert)

  revalidatePath(`/dashboard/tournaments/${tournamentId}/categories/${categoryId}`)
}

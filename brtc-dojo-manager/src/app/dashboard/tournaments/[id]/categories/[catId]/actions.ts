'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function checkExistingBracket(categoryId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { count } = await adminClient
    .from('tournament_matches')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId)

  return (count || 0) > 0
}

export async function deleteBracket(categoryId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Unauthorized')

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await adminClient
    .from('tournament_matches')
    .delete()
    .eq('category_id', categoryId)
}

export async function generateBracketPreview(tournamentId: string, categoryId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Unauthorized')

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
  if (!organizationId) throw new Error('Org non trovata')

  const { data: athletes } = await adminClient
    .from('athletes')
    .select('*')
    .eq('organization_id', organizationId)
    .limit(10) 

  if (!athletes || athletes.length === 0) {
    throw new Error('Nessun atleta trovato')
  }

  const numSlots = Math.pow(2, Math.ceil(Math.log2(athletes.length)))
  
  const sortedAthletes = [...athletes].sort((a, b) => {
    const locA = a.location_id || ''
    const locB = b.location_id || ''
    return locA.localeCompare(locB)
  })

  const athletesWithByes = [...sortedAthletes]
  for (let i = sortedAthletes.length; i < numSlots; i++) {
    athletesWithByes.push(null)
  }

  const slots = new Array(numSlots).fill(null)
  let currentSlot = 0
  for (let i = 0; i < athletesWithByes.length; i++) {
    slots[currentSlot] = athletesWithByes[i]
    currentSlot += 2
    if (currentSlot >= numSlots) currentSlot = 1
  }

  const matches = []
  let previousRoundMatches: any[] = []
  const totalRounds = Math.log2(numSlots) || 1

  for (let round = 1; round <= totalRounds; round++) {
    const numMatchesInRound = numSlots / Math.pow(2, round)
    const currentRoundMatches = []

    for (let m = 0; m < numMatchesInRound; m++) {
      const matchId = crypto.randomUUID()
      let athlete_a_id = null
      let athlete_b_id = null
      let winner_id = null
      let is_bye = false

      if (round === 1) {
        const a = slots[m * 2]
        const b = slots[m * 2 + 1]
        athlete_a_id = a ? a.id : null
        athlete_b_id = b ? b.id : null

        if (!athlete_a_id && athlete_b_id) {
          winner_id = athlete_b_id
          is_bye = true
        } else if (athlete_a_id && !athlete_b_id) {
          winner_id = athlete_a_id
          is_bye = true
        }
      }

      const match = {
        id: matchId,
        tournament_id: tournamentId,
        category_id: categoryId,
        organization_id: organizationId,
        round_number: round,
        match_number: m + 1,
        athlete_a_id,
        athlete_b_id,
        winner_id,
        next_match_id: null,
        is_bye
      }
      currentRoundMatches.push(match)
    }

    if (round > 1) {
      for (let i = 0; i < previousRoundMatches.length; i++) {
        const parentMatchIndex = Math.floor(i / 2)
        previousRoundMatches[i].next_match_id = currentRoundMatches[parentMatchIndex].id
      }
    }

    matches.push(...currentRoundMatches)
    previousRoundMatches = currentRoundMatches
  }

  return { matches, athletes }
}

export async function saveBracket(matches: any[]) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Unauthorized')

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await adminClient
    .from('tournament_matches')
    .insert(matches)

  if (error) {
    console.error('Error saving bracket:', error)
    throw new Error('Errore durante il salvataggio del tabellone')
  }

  if (matches.length > 0) {
    revalidatePath(`/dashboard/tournaments/${matches[0].tournament_id}/categories/${matches[0].category_id}`)
  }
}

export async function getBracket(categoryId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await adminClient
    .from('tournament_matches')
    .select('*')
    .eq('category_id', categoryId)
    .order('round_number', { ascending: true })
    .order('match_number', { ascending: true })

  return data || []
}

async function resetDescendants(adminClient: any, matchId: string, oldAthleteId: string) {
  const { data: match } = await adminClient
    .from('tournament_matches')
    .select('*')
    .eq('id', matchId)
    .single()

  if (!match) return

  const updates: any = {}
  let changed = false

  if (match.athlete_a_id === oldAthleteId) {
    updates.athlete_a_id = null
    changed = true
  }
  if (match.athlete_b_id === oldAthleteId) {
    updates.athlete_b_id = null
    changed = true
  }
  if (match.winner_id === oldAthleteId) {
    updates.winner_id = null
    updates.score_a = null
    updates.score_b = null
    changed = true
  }

  if (changed) {
    await adminClient
      .from('tournament_matches')
      .update(updates)
      .eq('id', matchId)

    if (match.next_match_id) {
      await resetDescendants(adminClient, match.next_match_id, oldAthleteId)
    }
  }
}

export async function declareWinner(matchId: string, winnerId: string, scoreA: number | null, scoreB: number | null) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Unauthorized')

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: match } = await adminClient
    .from('tournament_matches')
    .select('*')
    .eq('id', matchId)
    .single()

  if (!match) throw new Error('Match not found')

  // If winner is changing, recursively reset previous winner's descendants
  if (match.winner_id && match.winner_id !== winnerId && match.next_match_id) {
    await resetDescendants(adminClient, match.next_match_id, match.winner_id)
  }

  await adminClient
    .from('tournament_matches')
    .update({ winner_id: winnerId, score_a: scoreA, score_b: scoreB })
    .eq('id', matchId)

  if (match.next_match_id) {
    const { data: nextMatch } = await adminClient
      .from('tournament_matches')
      .select('*')
      .eq('id', match.next_match_id)
      .single()

    if (nextMatch) {
      const updateData: any = {}
      // Deterministic slot assignment based on the match number of the source match
      // Odd match numbers feed Athlete A (first slot), Even match numbers feed Athlete B (second slot)
      if (match.match_number % 2 === 1) {
        updateData.athlete_a_id = winnerId
      } else {
        updateData.athlete_b_id = winnerId
      }
      
      await adminClient
        .from('tournament_matches')
        .update(updateData)
        .eq('id', match.next_match_id)
    }
  }

  revalidatePath(`/dashboard/tournaments/${match.tournament_id}/categories/${match.category_id}/bracket`)
}

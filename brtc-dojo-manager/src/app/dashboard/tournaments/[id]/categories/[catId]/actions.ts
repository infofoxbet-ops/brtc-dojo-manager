'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getOrgId() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) throw new Error('Utente non autenticato')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('organization_id')
    .eq('user_id', session.user.id)
    .single()

  if (!roleData?.organization_id) throw new Error('Nessuna palestra associata')

  return { organizationId: roleData.organization_id }
}

export async function getCategoryDetails(tournamentId: string, categoryId: string) {
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('tournament_categories')
    .select('*, tournaments(name, date)')
    .eq('id', categoryId)
    .eq('tournament_id', tournamentId)
    .single()

  const { data: participants } = await supabase
    .from('tournament_participants')
    .select('id, athletes(id, first_name, last_name, belt_category)')
    .eq('category_id', categoryId)

  const { data: matches } = await supabase
    .from('tournament_matches')
    .select('*, athlete_a:athletes!athlete_a_id(first_name, last_name), athlete_b:athletes!athlete_b_id(first_name, last_name), winner:athletes!winner_id(id)')
    .eq('category_id', categoryId)
    .order('round_number', { ascending: false })
    .order('match_number', { ascending: true })

  return { category, participants: participants || [], matches: matches || [] }
}

export async function getAvailableAthletes(categoryId: string) {
  const supabase = await createClient()
  const { organizationId } = await getOrgId()

  const { data: allAthletes } = await supabase
    .from('athletes')
    .select('id, first_name, last_name, gender, date_of_birth')
    .eq('organization_id', organizationId)
    .order('last_name')

  const { data: enrolled } = await supabase
    .from('tournament_participants')
    .select('athlete_id')
    .eq('category_id', categoryId)

  const enrolledIds = new Set(enrolled?.map(p => p.athlete_id) || [])
  
  return (allAthletes || []).filter(a => !enrolledIds.has(a.id))
}

export async function addParticipant(tournamentId: string, categoryId: string, formData: FormData) {
  const supabase = await createClient()
  const athleteId = formData.get('athlete_id') as string
  if (!athleteId) return

  await supabase.from('tournament_participants').insert({
    tournament_id: tournamentId,
    category_id: categoryId,
    athlete_id: athleteId
  })

  revalidatePath(`/dashboard/tournaments/${tournamentId}/categories/${categoryId}`)
}

export async function generateBracketAction(tournamentId: string, categoryId: string) {
  const supabase = await createClient()

  const { data: participants } = await supabase
    .from('tournament_participants')
    .select('athlete_id')
    .eq('category_id', categoryId)

  if (!participants || participants.length < 2) {
    throw new Error("Servono almeno 2 atleti per generare un tabellone")
  }

  await supabase.from('tournament_matches').delete().eq('category_id', categoryId)

  const shuffled = [...participants].sort(() => Math.random() - 0.5).map(p => p.athlete_id)
  
  const numAthletes = shuffled.length
  let bracketSize = 2
  while (bracketSize < numAthletes) bracketSize *= 2
  
  const numByes = bracketSize - numAthletes
  const firstRoundMatches = bracketSize / 2
  
  let matchesToInsert = []
  
  let athleteIndex = 0;
  for (let i = 0; i < firstRoundMatches; i++) {
    const isBye = i < numByes;
    const a = shuffled[athleteIndex++]
    const b = isBye ? null : shuffled[athleteIndex++]
    
    matchesToInsert.push({
      tournament_id: tournamentId,
      category_id: categoryId,
      round_number: 1,
      match_number: i + 1,
      athlete_a_id: a,
      athlete_b_id: b,
      winner_id: isBye ? a : null,
      is_bye: isBye
    })
  }

  await supabase.from('tournament_matches').insert(matchesToInsert)

  revalidatePath(`/dashboard/tournaments/${tournamentId}/categories/${categoryId}`)
}

export async function checkExistingBracket(categoryId: string) {
  const supabase = await createClient()

  const { count } = await supabase
    .from('tournament_matches')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId)

  return (count || 0) > 0
}

export async function deleteBracket(categoryId: string) {
  const supabase = await createClient()

  await supabase
    .from('tournament_matches')
    .delete()
    .eq('category_id', categoryId)
}

export async function generateBracketPreview(tournamentId: string, categoryId: string) {
  const supabase = await createClient()
  const { organizationId } = await getOrgId()

  const { data: athletes } = await supabase
    .from('athletes')
    .select('*')
    .eq('organization_id', organizationId)
    .limit(10) 

  if (!athletes || athletes.length === 0) {
    throw new Error('Nessun atleta trovato')
  }

  const numAthletes = athletes.length
  const numSlots = Math.pow(2, Math.ceil(Math.log2(numAthletes)))
  const numByes = numSlots - numAthletes
  
  const athletesByLocation = new Map<string, any[]>()
  for (const athlete of athletes) {
    const loc = athlete.location_id || 'unknown'
    if (!athletesByLocation.has(loc)) {
      athletesByLocation.set(loc, [])
    }
    athletesByLocation.get(loc)!.push(athlete)
  }
  
  const topHalfSize = numSlots / 2
  const bottomHalfSize = numSlots / 2
  
  const byesInTopHalf = Math.floor(numByes / 2)
  const byesInBottomHalf = numByes - byesInTopHalf
  
  const athletesInTopHalf = topHalfSize - byesInTopHalf
  const athletesInBottomHalf = bottomHalfSize - byesInBottomHalf
  
  function distributeAthletesWithAntiDerby(athleteList: any[], targetCount: number, existingLocations: Set<string>): any[] {
    const result: any[] = []
    const usedLocations = new Set<string>(existingLocations)
    
    for (const [loc, locAthletes] of athletesByLocation) {
      if (result.length >= targetCount) break
      if (!usedLocations.has(loc) && locAthletes.length > 0) {
        const athlete = locAthletes.shift()
        if (athlete) {
          result.push(athlete)
          usedLocations.add(loc)
        }
      }
    }
    
    for (const [loc, locAthletes] of athletesByLocation) {
      if (result.length >= targetCount) break
      while (locAthletes.length > 0 && result.length < targetCount) {
        result.push(locAthletes.shift()!)
      }
    }
    
    return result
  }
  
  const topHalfLocations = new Set<string>()
  const topHalfAthletes = distributeAthletesWithAntiDerby(athletes, athletesInTopHalf, topHalfLocations)
  
  const bottomHalfLocations = new Set<string>()
  const remainingAthletes: any[] = []
  for (const [loc, locAthletes] of athletesByLocation) {
    remainingAthletes.push(...locAthletes)
  }
  
  const remainingByLocation = new Map<string, any[]>()
  for (const athlete of remainingAthletes) {
    const loc = athlete.location_id || 'unknown'
    if (!remainingByLocation.has(loc)) {
      remainingByLocation.set(loc, [])
    }
    remainingByLocation.get(loc)!.push(athlete)
  }
  
  const bottomHalfAthletes = distributeAthletesWithAntiDerby(remainingAthletes, athletesInBottomHalf, bottomHalfLocations)
  
  const byePositionsTop: number[] = []
  const byePositionsBottom: number[] = []
  
  for (let i = 0; i < byesInTopHalf; i++) {
    byePositionsTop.push(topHalfSize - 1 - i)
  }
  
  for (let i = 0; i < byesInBottomHalf; i++) {
    byePositionsBottom.push(i)
  }
  
  const slots: (any | null)[] = new Array(numSlots).fill(null)
  
  let athleteIndex = 0
  for (let i = 0; i < topHalfSize; i++) {
    if (byePositionsTop.includes(i)) {
      slots[i] = null
    } else {
      slots[i] = topHalfAthletes[athleteIndex++] || null
    }
  }
  
  athleteIndex = 0
  for (let i = 0; i < bottomHalfSize; i++) {
    const slotIndex = topHalfSize + i
    if (byePositionsBottom.includes(i)) {
      slots[slotIndex] = null
    } else {
      slots[slotIndex] = bottomHalfAthletes[athleteIndex++] || null
    }
  }
  
  const seededSlots: (any | null)[] = new Array(numSlots).fill(null)
  
  function getSeededPosition(position: number, size: number): number {
    if (size === 1) return 0
    if (position === 0) return 0
    if (position === 1) return size - 1
    
    const half = size / 2
    if (position < half) {
      return getSeededPosition(position, half)
    } else {
      return half + getSeededPosition(position - half, half)
    }
  }
  
  const finalSlots: (any | null)[] = new Array(numSlots).fill(null)
  
  const seedPositions: number[] = []
  for (let i = 0; i < numSlots / 2; i++) {
    seedPositions.push(i)
    seedPositions.push(numSlots - 1 - i)
  }
  
  let realAthleteIndex = 0
  for (let i = 0; i < numSlots; i++) {
    if (slots[i] !== null) {
      const targetPos = seedPositions[realAthleteIndex]
      finalSlots[targetPos] = slots[i]
      realAthleteIndex++
    }
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
        const a = finalSlots[m * 2]
        const b = finalSlots[m * 2 + 1]
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

  const { error } = await supabase
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

  const { data } = await supabase
    .from('tournament_matches')
    .select('*')
    .eq('category_id', categoryId)
    .order('round_number', { ascending: true })
    .order('match_number', { ascending: true })

  return data || []
}

async function resetDescendants(supabase: any, matchId: string, oldAthleteId: string) {
  const { data: match } = await supabase
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

  if (changed && match.next_match_id) {
    await resetDescendants(supabase, match.next_match_id, oldAthleteId)
  }

  if (changed) {
    await supabase.from('tournament_matches').update(updates).eq('id', matchId)
  }
}

export async function declareWinner(matchId: string, winnerId: string | null, scoreA?: number | null, scoreB?: number | null) {
  const supabase = await createClient()

  const { data: match } = await supabase
    .from('tournament_matches')
    .select('*, tournament_matches(*)')
    .eq('id', matchId)
    .single()

  if (!match) throw new Error('Incontro non trovato')

  const updates: any = { winner_id: winnerId }
  if (scoreA !== undefined) updates.score_a = scoreA === null ? null : scoreA
  if (scoreB !== undefined) updates.score_b = scoreB === null ? null : scoreB

  await supabase.from('tournament_matches').update(updates).eq('id', matchId)

  if (match.next_match_id) {
    const { data: nextMatch } = await supabase
      .from('tournament_matches')
      .select('athlete_a_id, athlete_b_id')
      .eq('id', match.next_match_id)
      .single()

    if (nextMatch) {
      const updateNext: any = {}
      if (!nextMatch.athlete_a_id) {
        updateNext.athlete_a_id = winnerId
      } else if (!nextMatch.athlete_b_id) {
        updateNext.athlete_b_id = winnerId
      }

      if (Object.keys(updateNext).length > 0) {
        await supabase.from('tournament_matches').update(updateNext).eq('id', match.next_match_id)
      }
    }
  }

  revalidatePath(`/dashboard/tournaments/${match.tournament_id}/categories/${match.category_id}`)
}

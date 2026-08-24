'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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

export async function getExamSessions() {
  try {
    const { adminClient, organizationId } = await getAdminClientAndOrgId()

    const { data, error } = await adminClient
      .from('exam_sessions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching exam sessions:', err)
    return []
  }
}

export async function getExamSessionById(id: string) {
  try {
    const { adminClient } = await getAdminClientAndOrgId()

    const { data, error } = await adminClient
      .from('exam_sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error fetching exam session:', err)
    return null
  }
}

export async function getExamCandidates(sessionId: string) {
  try {
    const { adminClient } = await getAdminClientAndOrgId()

    const { data, error } = await adminClient
      .from('exam_candidates')
      .select('*, athletes(id, first_name, last_name, belt_category, medical_cert_expiry)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching exam candidates:', err)
    return []
  }
}

export async function getEligibleAthletes(sessionId: string) {
  try {
    const { adminClient, organizationId } = await getAdminClientAndOrgId()

    // 1. Prendi tutti gli atleti dell'organizzazione
    const { data: allAthletes } = await adminClient
      .from('athletes')
      .select('id, first_name, last_name, belt_category, medical_cert_expiry')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    // 2. Prendi gli atleti già candidati in questa sessione
    const { data: currentCandidates } = await adminClient
      .from('exam_candidates')
      .select('athlete_id')
      .eq('session_id', sessionId)

    const candidateIds = new Set(currentCandidates?.map(c => c.athlete_id) || [])

    return (allAthletes || []).filter(a => !candidateIds.has(a.id))
  } catch (err) {
    console.error('Error fetching eligible athletes:', err)
    return []
  }
}

export async function createExamSession(formData: FormData) {
  const name = formData.get('name') as string
  const date = formData.get('date') as string

  if (!name || !date) throw new Error('Campi obbligatori mancanti')

  const { adminClient, organizationId } = await getAdminClientAndOrgId()

  const { error } = await adminClient
    .from('exam_sessions')
    .insert({
      organization_id: organizationId,
      name,
      date,
      status: 'draft'
    })

  if (error) {
    console.error('Error creating exam session:', error)
    throw new Error('Errore durante la creazione della sessione')
  }

  revalidatePath('/dashboard/exams')
}

export async function addCandidateToSession(sessionId: string, athleteId: string, targetBelt: string) {
  if (!sessionId || !athleteId || !targetBelt) throw new Error('Campi obbligatori mancanti')

  const { adminClient } = await getAdminClientAndOrgId()

  const { error } = await adminClient
    .from('exam_candidates')
    .insert({
      session_id: sessionId,
      athlete_id: athleteId,
      target_belt: targetBelt,
      status: 'pending'
    })

  if (error) {
    console.error('Error adding candidate:', error)
    throw new Error('Errore durante l\'aggiunta del candidato')
  }

  revalidatePath(`/dashboard/exams/${sessionId}`)
}

export async function removeCandidateFromSession(sessionId: string, candidateId: string) {
  const { adminClient } = await getAdminClientAndOrgId()

  const { error } = await adminClient
    .from('exam_candidates')
    .delete()
    .eq('id', candidateId)

  if (error) {
    console.error('Error removing candidate:', error)
    throw new Error('Errore durante la rimozione del candidato')
  }

  revalidatePath(`/dashboard/exams/${sessionId}`)
}

export async function updateCandidateEvaluation(
  sessionId: string,
  candidateId: string,
  status: 'pending' | 'passed' | 'failed' | 'postponed',
  notes: string
) {
  const { adminClient } = await getAdminClientAndOrgId()

  const { error } = await adminClient
    .from('exam_candidates')
    .update({ status, notes })
    .eq('id', candidateId)

  if (error) {
    console.error('Error updating evaluation:', error)
    throw new Error('Errore durante il salvataggio della valutazione')
  }

  revalidatePath(`/dashboard/exams/${sessionId}`)
}

export async function finalizeExamSession(sessionId: string) {
  const { adminClient } = await getAdminClientAndOrgId()

  // 1. Carica la sessione
  const { data: session, error: sessionErr } = await adminClient
    .from('exam_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionErr || !session) throw new Error('Sessione non trovata')
  if (session.status === 'completed') throw new Error('Sessione già completata')

  // 2. Carica i candidati
  const { data: candidates, error: candErr } = await adminClient
    .from('exam_candidates')
    .select('*, athletes(id, belt_category)')
    .eq('session_id', sessionId)

  if (candErr || !candidates) throw new Error('Errore caricamento candidati')

  // 3. Esegui promozioni
  for (const candidate of candidates) {
    if (candidate.status === 'passed') {
      const oldBelt = candidate.athletes.belt_category
      const newBelt = candidate.target_belt

      // Aggiorna l'atleta
      await adminClient
        .from('athletes')
        .update({ belt_category: newBelt })
        .eq('id', candidate.athlete_id)

      // Registra lo storico
      await adminClient
        .from('athlete_belt_history')
        .insert({
          athlete_id: candidate.athlete_id,
          old_belt: oldBelt,
          new_belt: newBelt,
          promotion_date: session.date,
          notes: candidate.notes || 'Promosso durante la sessione d\'esame: ' + session.name
        })
    }
  }

  // 4. Marca la sessione come completata
  const { error: finalizeErr } = await adminClient
    .from('exam_sessions')
    .update({ status: 'completed' })
    .eq('id', sessionId)

  if (finalizeErr) {
    console.error('Error finalising session:', finalizeErr)
    throw new Error('Errore durante la finalizzazione della sessione')
  }

  revalidatePath(`/dashboard/exams/${sessionId}`)
  revalidatePath('/dashboard/exams')
  revalidatePath('/dashboard/athletes')
}

// Keep older helper to maintain compatibility
export async function updateAthleteBelt(athleteId: string, newBelt: string) {
  const { adminClient } = await getAdminClientAndOrgId()

  const { data: athlete } = await adminClient
    .from('athletes')
    .select('belt_category')
    .eq('id', athleteId)
    .single()

  const oldBelt = athlete?.belt_category || null

  const { error } = await adminClient
    .from('athletes')
    .update({ belt_category: newBelt })
    .eq('id', athleteId)

  if (error) {
    console.error('Error updating belt:', error)
    throw new Error("Errore durante l'aggiornamento del grado")
  }

  // Record history
  await adminClient
    .from('athlete_belt_history')
    .insert({
      athlete_id: athleteId,
      old_belt: oldBelt,
      new_belt: newBelt,
      promotion_date: new Date().toISOString().split('T')[0],
      notes: "Aggiornamento manuale rapido"
    })

  revalidatePath('/dashboard/exams')
  revalidatePath('/dashboard/athletes')
}

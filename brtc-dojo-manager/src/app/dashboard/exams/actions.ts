'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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

export async function getExamSessions() {
  try {
    const { organizationId } = await getOrgId()
    const supabase = await createClient()

    const { data, error } = await supabase
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
    const supabase = await createClient()

    const { data, error } = await supabase
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
    const supabase = await createClient()

    const { data, error } = await supabase
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
    const supabase = await createClient()
    const { organizationId } = await getOrgId()

    const { data: allAthletes } = await supabase
      .from('athletes')
      .select('id, first_name, last_name, belt_category, medical_cert_expiry')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    const { data: currentCandidates } = await supabase
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

  const { organizationId } = await getOrgId()
  const supabase = await createClient()

  const { error } = await supabase
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

  const supabase = await createClient()

  const { error } = await supabase
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
  const supabase = await createClient()

  const { error } = await supabase
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
  const supabase = await createClient()

  const { error } = await supabase
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
  const supabase = await createClient()

  const { data: session, error: sessionErr } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionErr || !session) throw new Error('Sessione non trovata')
  if (session.status === 'completed') throw new Error('Sessione già completata')

  // Chiama la funzione RPC per eseguire l'operazione in modo atomico
  const { data: rpcResult, error: rpcError } = await supabase.rpc('finalize_exam_session', {
    p_session_id: sessionId,
    p_session_date: session.date,
    p_session_name: session.name
  })

  if (rpcError) {
    console.error('Error calling RPC finalize_exam_session:', rpcError)
    throw new Error('Errore durante la finalizzazione della sessione: ' + rpcError.message)
  }

  if (!rpcResult || !(rpcResult as any).success) {
    throw new Error('Errore durante la finalizzazione della sessione')
  }

  revalidatePath(`/dashboard/exams/${sessionId}`)
  revalidatePath('/dashboard/exams')
  revalidatePath('/dashboard/athletes')
}

export async function updateAthleteBelt(athleteId: string, newBelt: string) {
  const supabase = await createClient()

  const { data: athlete } = await supabase
    .from('athletes')
    .select('belt_category')
    .eq('id', athleteId)
    .single()

  const oldBelt = athlete?.belt_category || null

  const { error } = await supabase
    .from('athletes')
    .update({ belt_category: newBelt })
    .eq('id', athleteId)

  if (error) {
    console.error('Error updating belt:', error)
    throw new Error("Errore durante l'aggiornamento del grado")
  }

  await supabase
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

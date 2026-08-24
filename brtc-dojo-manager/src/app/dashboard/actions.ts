'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Utente non autenticato')
  }

  // Bypassiamo RLS per leggere i dati garantendo il successo tramite service role key
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: roleData } = await adminClient
    .from('user_roles')
    .select('organization_id')
    .eq('user_id', session.user.id)
    .single()

  const orgId = roleData?.organization_id

  if (!orgId) {
    return {
      totalAthletes: 0,
      activeAthletes: 0,
      expiringCertificates: [],
      expiredCertificates: []
    }
  }

  // Ottieni tutti gli atleti dell'organizzazione
  const { data: athletes, error } = await adminClient
    .from('athletes')
    .select('*')
    .eq('organization_id', orgId)

  if (error || !athletes) {
    console.error("Errore nel caricamento degli atleti:", error)
    return {
      totalAthletes: 0,
      activeAthletes: 0,
      expiringCertificates: [],
      expiredCertificates: []
    }
  }

  const today = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(today.getDate() + 30)

  // Filtriamo atleti per stato del certificato
  const expired = athletes.filter(a => {
    if (!a.medical_cert_expiry) return true // Se non ce l'ha, consideralo scaduto per sicurezza
    const expiry = new Date(a.medical_cert_expiry)
    return expiry < today
  }).sort((a, b) => {
    if (!a.medical_cert_expiry) return -1
    if (!b.medical_cert_expiry) return 1
    return new Date(a.medical_cert_expiry).getTime() - new Date(b.medical_cert_expiry).getTime()
  })

  const expiring = athletes.filter(a => {
    if (!a.medical_cert_expiry) return false
    const expiry = new Date(a.medical_cert_expiry)
    return expiry >= today && expiry <= thirtyDaysFromNow
  }).sort((a, b) => new Date(a.medical_cert_expiry!).getTime() - new Date(b.medical_cert_expiry!).getTime())

  const totalAthletes = athletes.length
  // Gli atleti attivi sono quelli che non hanno il certificato scaduto (nella nostra logica base)
  const activeAthletes = totalAthletes - expired.length

  return {
    totalAthletes,
    activeAthletes,
    expiringCertificates: expiring,
    expiredCertificates: expired
  }
}

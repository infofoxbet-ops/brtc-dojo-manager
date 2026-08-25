'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error || !authData.user) {
    redirect('/login?message=Credenziali non valide')
  }

  // Usa il client autenticato per verificare/creare organizzazione
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single()

  if (!roleData?.organization_id) {
    const { data: orgData } = await supabase
      .from('organizations')
      .insert({
        name: 'Dojo Karate Pro',
        slug: 'dojo-karate-' + Math.random().toString(36).substring(2, 7)
      })
      .select('id')
      .single()

    if (orgData) {
      await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role: 'super-admin',
        organization_id: orgData.id
      })
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Registrazione utente
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error || !authData.user) {
    redirect('/register?message=' + encodeURIComponent(error?.message || 'Errore durante la registrazione'))
  }

  // Crea organizzazione default usando il client autenticato
  const { data: orgData } = await supabase
    .from('organizations')
    .insert({
      name: 'Dojo Karate Pro',
      slug: 'dojo-karate-' + Math.random().toString(36).substring(2, 7)
    })
    .select('id')
    .single()

  if (orgData) {
    await supabase.from('user_roles').insert({
      user_id: authData.user.id,
      role: 'super-admin',
      organization_id: orgData.id
    })
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

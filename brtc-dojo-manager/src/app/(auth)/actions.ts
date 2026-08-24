'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

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

  // Ensure organization exists for this user
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: roleData } = await adminClient
    .from('user_roles')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .single()

  if (!roleData?.organization_id) {
    const { data: orgData } = await adminClient
      .from('organizations')
      .insert({
        name: 'Dojo Karate Pro',
        slug: 'dojo-karate-' + Math.random().toString(36).substring(2, 7)
      })
      .select('id')
      .single()

    if (orgData) {
      await adminClient.from('user_roles').insert({
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

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Crea organizzazione default
  const { data: orgData } = await adminClient
    .from('organizations')
    .insert({
      name: 'Dojo Karate Pro',
      slug: 'dojo-karate-' + Math.random().toString(36).substring(2, 7)
    })
    .select('id')
    .single()

  if (orgData) {
    await adminClient.from('user_roles').insert({
      user_id: authData.user.id,
      role: 'super-admin',
      organization_id: orgData.id
    })
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}


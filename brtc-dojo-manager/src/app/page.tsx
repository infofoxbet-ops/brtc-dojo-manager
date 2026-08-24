import { redirect } from 'next/navigation'

export default function Home() {
  // La pagina root reindirizza direttamente alla dashboard.
  // Il middleware si occuperà di mandare l'utente al login se non è autenticato.
  redirect('/dashboard')
}

import { getAthletes } from './actions'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

export default async function AthletesPage() {
  const athletes = await getAthletes()

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Atleti</h1>
        <Link href="/dashboard/athletes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nuovo Atleta
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cognome e Nome</TableHead>
              <TableHead>Cintura</TableHead>
              <TableHead>Palestra</TableHead>
              <TableHead className="hidden md:table-cell">Data di Nascita</TableHead>
              <TableHead className="hidden lg:table-cell">Scadenza Certificato</TableHead>
              <TableHead>Stato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {athletes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                  Nessun atleta registrato. Clicca su "Nuovo Atleta" per iniziare.
                </TableCell>
              </TableRow>
            ) : (
              athletes.map((athlete) => (
                <TableRow key={athlete.id}>
                  <TableCell className="font-medium">
                    {athlete.last_name} {athlete.first_name}
                  </TableCell>
                  <TableCell>
                    {athlete.belt_category ? (
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10">
                        {athlete.belt_category}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {athlete.gym_branch || <span className="text-muted-foreground text-xs italic">-</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{new Date(athlete.date_of_birth).toLocaleDateString('it-IT')}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {athlete.medical_cert_expiry 
                      ? new Date(athlete.medical_cert_expiry).toLocaleDateString('it-IT') 
                      : <span className="text-yellow-600 font-medium">Non inserito</span>}
                  </TableCell>
                  <TableCell>
                    {athlete.is_active ? (
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">Attivo</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-800">Inattivo</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

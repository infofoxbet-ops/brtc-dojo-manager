import { createAthlete } from '../actions'
import { getLocations } from '../../locations/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewAthletePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const locations = await getLocations()

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/athletes">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Nuovo Atleta</h1>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <form action={createAthlete} className="p-6 flex flex-col gap-6">
          {error && (
            <div className="bg-red-100 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="first_name">Nome</Label>
              <Input id="first_name" name="first_name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name">Cognome</Label>
              <Input id="last_name" name="last_name" required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="date_of_birth">Data di Nascita</Label>
              <Input id="date_of_birth" name="date_of_birth" type="date" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gender">Sesso</Label>
              <Select name="gender" required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Maschio</SelectItem>
                  <SelectItem value="F">Femmina</SelectItem>
                  <SelectItem value="other">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="fiscal_code">Codice Fiscale</Label>
              <Input id="fiscal_code" name="fiscal_code" className="uppercase" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="medical_cert_expiry">Scadenza Certificato Medico</Label>
              <Input id="medical_cert_expiry" name="medical_cert_expiry" type="date" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="belt_category">Cintura / Grado</Label>
              <Select name="belt_category">
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bianca">Bianca</SelectItem>
                  <SelectItem value="Gialla">Gialla</SelectItem>
                  <SelectItem value="Arancio">Arancio</SelectItem>
                  <SelectItem value="Verde">Verde</SelectItem>
                  <SelectItem value="Blu">Blu</SelectItem>
                  <SelectItem value="Marrone">Marrone</SelectItem>
                  <SelectItem value="Nera 1° Dan">Nera 1° Dan</SelectItem>
                  <SelectItem value="Nera 2° Dan">Nera 2° Dan</SelectItem>
                  <SelectItem value="Nera 3° Dan">Nera 3° Dan</SelectItem>
                  <SelectItem value="Nera 4° Dan">Nera 4° Dan</SelectItem>
                  <SelectItem value="Nera 5° Dan">Nera 5° Dan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location_id">Palestra (Sede)</Label>
              <Select name="location_id">
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona sede..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="weight">Peso (Kg)</Label>
              <Input id="weight" name="weight" type="number" step="0.1" placeholder="es. 65.5" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="height">Altezza (cm)</Label>
              <Input id="height" name="height" type="number" placeholder="es. 175" />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <Link href="/dashboard/athletes">
              <Button type="button" variant="outline">Annulla</Button>
            </Link>
            <Button type="submit">Salva Atleta</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

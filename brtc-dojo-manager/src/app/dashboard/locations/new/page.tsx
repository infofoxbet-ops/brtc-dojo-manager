import { createLocation } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewLocationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/locations">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Nuova Sede</h1>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <form action={createLocation} className="p-6 flex flex-col gap-6">
          {error && (
            <div className="bg-red-100 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="name">Nome Sede (Es. Sede Centrale, Succursale Nord)*</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="address">Indirizzo</Label>
              <Input id="address" name="address" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">Città</Label>
              <Input id="city" name="city" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="province">Provincia (Sigla)</Label>
              <Input id="province" name="province" maxLength={2} className="uppercase" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cap">CAP</Label>
              <Input id="cap" name="cap" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <Link href="/dashboard/locations">
              <Button type="button" variant="outline">Annulla</Button>
            </Link>
            <Button type="submit">Salva Sede</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

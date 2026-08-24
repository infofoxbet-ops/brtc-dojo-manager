import { getLocations, deleteLocation } from './actions'
import { Button } from '@/components/ui/button'
import { Plus, MapPin, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default async function LocationsPage() {
  const locations = await getLocations()

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Sedi / Filiali</h1>
        <Link href="/dashboard/locations/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuova Sede
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {locations.map((location) => (
          <div key={location.id} className="flex flex-col gap-2 rounded-xl border bg-card text-card-foreground shadow p-6 relative group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{location.name}</h3>
                <p className="text-sm text-muted-foreground">{location.city || 'Città non specificata'}</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2 text-sm">
              {location.address && <p><span className="text-muted-foreground">Indirizzo:</span> {location.address}</p>}
              {location.phone && <p><span className="text-muted-foreground">Telefono:</span> {location.phone}</p>}
              {location.email && <p><span className="text-muted-foreground">Email:</span> {location.email}</p>}
            </div>

            <form action={async () => {
              'use server'
              await deleteLocation(location.id)
            }} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button type="submit" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-100">
                <Trash2 className="h-4 w-4" />
              </Button>
            </form>
          </div>
        ))}

        {locations.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl text-muted-foreground flex flex-col items-center gap-2">
            <MapPin className="h-8 w-8 opacity-50" />
            <p>Nessuna sede configurata. Aggiungi la tua prima palestra!</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { Trophy, Users, AlertTriangle, CheckCircle2 } from "lucide-react"
import { getDashboardStats } from "./actions"
import Link from "next/link"

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
      {/* Cards di riepilogo */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">Totale Atleti</h3>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="p-6 pt-0">
          <div className="text-2xl font-bold">{stats.totalAthletes}</div>
          <p className="text-xs text-muted-foreground">Iscritti alla palestra</p>
        </div>
      </div>
      
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">Atleti Attivi</h3>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="p-6 pt-0">
          <div className="text-2xl font-bold">{stats.activeAthletes}</div>
          <p className="text-xs text-muted-foreground">In regola con certificato medico</p>
        </div>
      </div>

      <div className="rounded-xl border border-rose-100 bg-rose-50/50 text-card-foreground shadow dark:bg-rose-950/20 dark:border-rose-900/50">
        <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium text-rose-600 dark:text-rose-400">Certificati Scaduti</h3>
          <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="p-6 pt-0">
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.expiredCertificates.length}</div>
          <p className="text-xs text-rose-600/80 dark:text-rose-400/80">Da regolarizzare (Blocco RASD)</p>
        </div>
      </div>

      {/* Sezione Avvisi Importanti RASD */}
      <div className="col-span-full rounded-xl border bg-card text-card-foreground shadow">
        <div className="flex flex-col space-y-1.5 p-6 border-b">
          <h3 className="font-semibold leading-none tracking-tight">Avvisi Compliance RASD</h3>
          <p className="text-sm text-muted-foreground">Atleti con certificato medico scaduto o in scadenza nei prossimi 30 giorni.</p>
        </div>
        <div className="p-0">
          {stats.expiredCertificates.length === 0 && stats.expiringCertificates.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center justify-center py-10">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3 opacity-20" />
              Tutti gli atleti sono in regola con i certificati medici.
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Atleta</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Stato</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Scadenza</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Azione</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {stats.expiredCertificates.map(athlete => (
                    <tr key={athlete.id} className="border-b transition-colors hover:bg-muted/50 bg-rose-50/30 dark:bg-rose-950/10">
                      <td className="p-4 align-middle font-medium">{athlete.first_name} {athlete.last_name}</td>
                      <td className="p-4 align-middle">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800">
                          Scaduto
                        </span>
                      </td>
                      <td className="p-4 align-middle text-rose-600 dark:text-rose-400">
                        {athlete.medical_cert_expiry ? new Date(athlete.medical_cert_expiry).toLocaleDateString('it-IT') : 'Mancante'}
                      </td>
                      <td className="p-4 align-middle">
                        <Link href={`/dashboard/athletes`} className="text-xs text-blue-600 hover:underline">
                          Aggiorna
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {stats.expiringCertificates.map(athlete => (
                    <tr key={athlete.id} className="border-b transition-colors hover:bg-muted/50 bg-amber-50/30 dark:bg-amber-950/10">
                      <td className="p-4 align-middle font-medium">{athlete.first_name} {athlete.last_name}</td>
                      <td className="p-4 align-middle">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                          In Scadenza
                        </span>
                      </td>
                      <td className="p-4 align-middle text-amber-600 dark:text-amber-400">
                        {athlete.medical_cert_expiry ? new Date(athlete.medical_cert_expiry).toLocaleDateString('it-IT') : ''}
                      </td>
                      <td className="p-4 align-middle">
                        <Link href={`/dashboard/athletes`} className="text-xs text-blue-600 hover:underline">
                          Aggiorna
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

# BRTC DojoManager (TANO Karategestionale) - Project Memory & Handoff State

**Ultimo Aggiornamento**: 24 Agosto 2026  
**Proprietà**: Holding BRTC Digital Adv (Alberto Saveriano)  
**Stato Progetto**: Prototipo Avanzato / Alpha Funzionante

---

## 1. Architettura & Stack Tecnologico
- **Frontend / Fullstack**: Next.js 16 (App Router, Turbopack, Server Actions)
- **Styling**: Tailwind CSS + shadcn/ui + Lucide Icons
- **Database & Auth**: Supabase (PostgreSQL + Auth SSR)
- **Istanza Supabase Dedicata**: `https://vusrruedhwxibfnvfotm.supabase.co`
- **Schema Database Completo**: consolidato in `supabase/00_full_schema.sql` (9 tabelle: `organizations`, `locations`, `user_roles`, `athletes`, `attendance`, `tournaments`, `tournament_categories`, `tournament_participants`, `tournament_matches`, `exam_sessions`, `exam_candidates`, `athlete_belt_history`).

---

## 2. Credenziali Master di Test (Locale)
- **URL Locale**: `http://localhost:3000`
- **Admin Email**: `admin@dojo.it`
- **Admin Password**: `password123`
- **Organizzazione Default**: `Dojo Karate BRTC` (`id: 76c91e84-e2ca-4579-a66d-6eda8a443210`)

---

## 3. Moduli Funzionanti & Dati Caricati

### 1. Dashboard (`/dashboard`)
- Statistiche generali (totale atleti, atleti attivi).
- **Compliance RASD**: monitoraggio certificati medici scaduti (10) e in scadenza a 30gg (15).

### 2. Sedi / Filiali (`/dashboard/locations`)
- CRUD completo per gestione palestre operative:
  - *Dojo Shotokan Roma*
  - *Karate Club Milano*
  - *Budokan Napoli*
  - *Sakura Dojo Torino*

### 3. Anagrafica Atleti (`/dashboard/athletes`)
- 100 atleti reali importati da `ISCRITTI.xlsx`.
- Scheda atleta completa: dati anagrafici, peso, altezza, grado cintura (Bianca $\rightarrow$ Nera), sede di appartenenza selezionabile da tendina.

### 4. Registro Presenze (`/dashboard/attendance`)
- Check-in per data e sede con tracciamento presenze/assenze.

### 5. Sessioni Esami Cinture (`/dashboard/exams`)
- Creazione sessioni d'esame e gestione candidati con cambio grado cintura e storico avanzamenti.
- Sessione demo creata: *"Sessione Esami di Grado - Estate 2026"* con 8 candidati.

### 6. Gestione Tornei & Tabelloni (`/dashboard/tournaments`)
- Creazione eventi e categorie Kata / Kumite.
- Iscrizione atleti per categoria.
- Generazione automatica albero incontri a eliminazione diretta (con gestione BYE).
- Torneo demo attivo: *"Gran Premio d'Italia Karate 2026"* con categorie Kumite e Kata popolate.

---

## 4. Script di Utilità
- `import-dataset.py`: legge `../ISCRITTI.xlsx` e popola sedi, atleti, tornei, esami e presenze su Supabase.
- `init-demo-user.js`: crea o reimposta l'utente admin `admin@dojo.it`.
- `check-db.js`: testa lo stato di connessione e il conteggio record di tutte le tabelle Supabase.

---

## 5. Roadmap & Prossimi Sviluppi Prioritari per la Produzione
1. **Stampa PDF Tabelloni di Gara**: Generazione layout referto/tabellone A4 stampabile per arbitri e tavolo giuria a bordo tatami.
2. **Import / Export UI Excel**: Pulsante nell'interfaccia per caricare direttamente file Excel/CSV con mappatura automatica delle colonne.
3. **QR Code Check-in Rapido**: Scansione rapida per ingresso presenze da smartphone.
4. **Blindatura RLS Multi-Tenant**: Configurazione finale delle policy Supabase per isolamento totale tra organizzazioni differenti.
5. **Deployment su Vercel**: Pubblicazione su dominio di produzione con Vercel Web Analytics.

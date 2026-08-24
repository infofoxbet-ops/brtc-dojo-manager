# TANO Karategestionale (BRTC DojoManager) - Memoria di Progetto

**Ultimo Aggiornamento**: 24 Agosto 2026  
**Proprietà**: Holding BRTC Digital Adv (Alberto Saveriano)  
**Percorso Applicazione**: `/brtc-dojo-manager`  

---

## 1. Database & Configurazione Attiva
- **Provider**: Supabase (`https://vusrruedhwxibfnvfotm.supabase.co`)
- **Schema Completo**: `brtc-dojo-manager/supabase/00_full_schema.sql` (9 tabelle verificate)
- **Credenziali Master**: `admin@dojo.it` / `password123`
- **Avvio Server**: `npm run dev` dentro `/brtc-dojo-manager` (ascolta su `http://localhost:3000`)

---

## 2. Stato Moduli & Dataset
- **100 Atleti Reali**: Caricati da `ISCRITTI.xlsx` con età, pesi, altezze e cinture.
- **4 Sedi/Palestre**: Roma, Milano, Napoli, Torino.
- **Alert RASD**: Calcolo automatico scadenze certificati medici (10 scaduti, 15 in scadenza).
- **Torneo Demo**: *"Gran Premio d'Italia Karate 2026"* (16 iscritti, Kata e Kumite).
- **Esami Demo**: *"Sessione Esami di Grado - Estate 2026"* (8 candidati).
- **Presenze**: Registro compilato per le ultime sessioni.

---

## 3. File di Riferimento Dettagliati
- Memoria tecnica completa e handoff: `brtc-dojo-manager/HANDOFF.md`
- Script re-importazione dataset: `brtc-dojo-manager/import-dataset.py`
- Script verifica connessioni: `brtc-dojo-manager/check-db.js`

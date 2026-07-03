# Nest Egg

Nest Egg è una web app per gestire budget familiare annuale, spese, scadenze, ricorrenze e avvisi.

Il progetto è separato da TOTIME. La parte frontend riprende l'impostazione grafica, il layout a card, la navigazione e la semplicità d'uso. La parte dati verrà invece progettata da zero per il budget familiare.

## MVP iniziale

La prima versione base include:

- Dashboard familiare
- spazio sempre visibile per scadenze di oggi e prossimi giorni
- inserimento nuova spesa
- tipologie di spesa familiari
- scadenze e stato pagamento
- budget mensile e annuale base
- notifiche web app
- predisposizione notifiche email
- schema database iniziale

## Tipologie spesa

- Fissa ricorrente
- Ricorrente variabile
- Media stimata
- Una tantum
- Con scadenza
- Rateizzata
- Straordinaria / Progetto

## Avvio locale

Questa prima base è una web app statica con salvataggio locale tramite browser storage.

```bash
python -m http.server 5173
```

poi apri:

```text
http://localhost:5173
```

## Database

Lo schema iniziale è in `supabase/schema.sql`.

Nella fase successiva collegheremo il progetto database già creato e sostituiremo il salvataggio locale con tabelle reali.

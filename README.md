# Schedio

Schedio e un MVP SaaS per tuttofare e piccole squadre operative. Il flusso principale coperto oggi e:

`WhatsApp -> lead qualificato -> sopralluogo confermato -> preventivo -> follow-up -> fattura -> pagamento -> review request`

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL

## Stato attuale

Il progetto non e piu solo uno scaffold UI. Oggi include:

- richieste, clienti, calendario e lavori collegati a Prisma
- intake WhatsApp con thread, lead, qualifica e proposta sopralluogo
- preventivi con pagina pubblica, accetta/rifiuta e follow-up
- fatture con pagina pubblica, mark as paid, reminder e review request
- dashboard ROI con funnel e worklist operative
- auth base con ruoli `owner` e `worker`

## Account demo

- owner: `luca@schedio.it`
- worker: `sara@schedio.it`
- password: `demo1234`

## Avvio locale

1. Copia `.env.example` in `.env`
2. Configura `DATABASE_URL`
3. Configura `NEXT_PUBLIC_APP_URL` se vuoi testare link pubblici da un host diverso
4. Esegui `npx prisma generate`
5. Esegui `npx prisma migrate deploy`
6. Esegui `npm.cmd run seed`
7. Esegui `npm.cmd run dev`

Apri poi [http://localhost:3000](http://localhost:3000).

## Comandi utili

- `npm.cmd run test`
- `npm.cmd run build`
- `npm.cmd run dev`

## Beta online

Schedio e pronto per una beta privata online. Per il primo deploy:

1. crea un PostgreSQL hosted
2. imposta in hosting:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `WHATSAPP_VERIFY_TOKEN`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_GRAPH_VERSION`
3. esegui migrate e seed sul database online
4. pubblica l'app Next.js su Vercel

Nota: i link pubblici per preventivi e fatture usano `NEXT_PUBLIC_APP_URL`. Se non la imposti, in locale il fallback resta `http://localhost:3000`.

## Flussi principali da provare

### Owner

1. Crea una richiesta da `Richieste`
2. Pianifica un sopralluogo da `Calendario`
3. Completa il lavoro da `Lavori`
4. Crea e invia un preventivo
5. Apri la pagina pubblica del preventivo e accettalo
6. Crea e invia la fattura
7. Segna la fattura come pagata
8. Verifica dashboard, worklist e review request

### Worker

1. Entra con `sara@schedio.it`
2. Apri `Calendario` o `Lavori`
3. Verifica che vedi solo i job assegnati
4. Aggiorna lo stato o completa un lavoro

## Nota pratica

Per ora il perimetro e volutamente stretto: Schedio non prova a fare contabilita avanzata, dispatch enterprise o AI complessa. L'obiettivo e chiudere bene il ciclo operativo che va dalla richiesta alla recensione.

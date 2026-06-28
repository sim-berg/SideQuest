# Backend-Integration: das `chain`-Modul

> Status: **Architektur-Plan / theoretisch.** Noch keine Implementierung. Definiert,
> wie die Web3-Schicht (siehe [`blockchain-vision.md`](./blockchain-vision.md) und
> [`smart_contract/web3-speicher-tangle-und-methoden.md`](./smart_contract/web3-speicher-tangle-und-methoden.md))
> sauber als **eigenes NestJS-Modul** in das bestehende Backend einzieht — ohne den
> Rest der App von der Chain abhängig zu machen.

---

## 1. Leitprinzipien

Diese fünf Prinzipien bestimmen jede Designentscheidung unten:

1. **Das Backend ist nicht die Chain — es ist die Brücke.** Rollen: **Indexer**
   (hört auf Events → Mongo), **Relayer** (optional gaslose/Oracle-Tx), **Gateway**
   (bereitet Tx vor, die das Frontend signiert) und **Mesh-Gateway** (IPFS-Pinning).
2. **Chain = Quelle der Wahrheit für *Werte/Eigentum*. Mongo = schnelles Read-Model.**
   Mongo wird **aus Events befüllt** (Event-Sourcing-Projektion), nicht durch optimistisches
   Raten. So gibt es keinen Dual-Write-Konflikt.
3. **Optional & abschaltbar (graceful degradation).** Genau wie `ReplicateService`
   ohne `REPLICATE_API_TOKEN` auf einen Fallback geht, läuft die App ohne
   `CHAIN_ENABLED`/RPC **vollständig weiter** wie heute. Web3 ist additiv.
4. **Klare Modulgrenze.** Das `chain`-Modul kennt die anderen Module (Quest, Dragon,
   User, Geo, Achievement) — aber **kein** Bestandsmodul muss `chain` importieren
   (außer einem dünnen optionalen Hook). Kopplung zeigt nur in eine Richtung.
5. **Idempotenz & Reorg-Sicherheit überall.** Events werden mind. einmal geliefert →
   Verarbeitung per Upsert idempotent; Finalität erst nach N Confirmations.

---

## 2. Wo das Modul im Gesamtbild sitzt

```
┌───────────── Frontend (React + wagmi/viem) ─────────────┐
│  Map · Quests · Wallet-Connect · Reputation              │
└───┬───────────────────────────────┬─────────────────────┘
    │ REST/WS (wie heute)            │ signierte Tx (RPC, direkt)
    ▼                                ▼
┌──────────────── NestJS Backend ────────────────┐   ┌────────────────┐
│  Quest · Dragon · User · Geo · Achievement      │   │  Blockchain L2 │
│                                                  │   │  (Base/Polygon)│
│  ┌─────────────── chain-Modul ───────────────┐  │   │  QuestEscrow   │
│  │ ChainClient · EventIndexer · Relayer       │◄─┼───┤  QuestCoin     │
│  │ Oracle · MeshStorage                       │  │   │  ReputationSBT │
│  └───────────────┬────────────────────────────┘  │   │  AchievementNFT│
└──────────────────┼───────────────────────────────┘   └───────┬────────┘
                   ▼ (Projektionen / Read-Model)                 │
             ┌──────────┐                                  ┌─────▼─────┐
             │ MongoDB  │                                  │ IPFS/Mesh │
             │ (Cache/  │                                  │ (Proofs/  │
             │  Index)  │                                  │  Bilder)  │
             └──────────┘                                  └───────────┘
```

Die **Schreib-Tx auf die Chain macht bevorzugt das Frontend** (User signiert mit
seiner Wallet → kein Treuhänder über fremde Schlüssel). Das Backend **liest** die Chain
(Indexer), **bereitet Tx vor** (Gateway) und **signiert nur eigene Rollen** (Oracle-
Bestätigung, optional Paymaster/Relayer).

---

## 3. Modulstruktur (an die bestehende Konvention angelehnt)

Spiegelt den Aufbau von `quest/` und `achievement/` (ESM `.js`-Imports,
`MongooseModule.forFeature`, `services/`, `schemas/`, `dto/`, `enums/`):

```
backend/src/chain/
├── chain.module.ts                # bindet alles zusammen, exportiert Public-Services
├── chain.controller.ts            # Read-Endpoints + Tx-Vorbereitung + Wallet-Link
├── services/
│   ├── chain-client.service.ts    # viem PublicClient/WalletClient, ABIs, Adressen, Confirmations
│   ├── event-indexer.service.ts   # pollt/abonniert Logs → Projektionen (mit Checkpoint)
│   ├── relayer.service.ts         # OPTIONAL: gaslose Tx / Paymaster / Backend-Signaturen
│   ├── oracle.service.ts          # Proof-of-Presence → confirmByOracle (nutzt GeoService)
│   └── mesh-storage.service.ts    # IPFS/Arweave-Pinning → CID (Fallback wie ReplicateService)
├── schemas/
│   ├── chain-quest.schema.ts      # On-chain-Projektion einer Quest (onChainId, status, txHash)
│   ├── wallet-link.schema.ts      # userId ↔ Wallet-Adresse (verifiziert per Signatur)
│   ├── chain-tx.schema.ts         # verfolgte Tx (status, confirmations, type)
│   └── indexer-checkpoint.schema.ts # letzter verarbeiteter Block je Contract
├── dto/
│   ├── link-wallet.dto.ts
│   └── prepare-quest.dto.ts
├── abi/                           # exportierte Contract-ABIs (JSON) aus Foundry
│   ├── QuestEscrow.json
│   ├── QuestCoin.json
│   ├── ReputationSBT.json
│   └── AchievementNFT.json
└── enums/
    └── chain-status.enum.ts       # Pending | Confirmed | Finalized | Failed | Reverted
```

### `chain.module.ts` (Skizze)

```ts
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChainQuest.name, schema: ChainQuestSchema },
      { name: WalletLink.name, schema: WalletLinkSchema },
      { name: ChainTx.name, schema: ChainTxSchema },
      { name: IndexerCheckpoint.name, schema: IndexerCheckpointSchema },
    ]),
    ScheduleModule.forRoot(), // @nestjs/schedule für den Indexer-Poller
    GeoModule,        // Oracle braucht Haversine-Distanz (existiert bereits)
    DragonModule,     // XP bei Abschluss spiegeln
    UserModule,       // Wallet ↔ User
    AchievementModule,// NFT-Badges spiegeln
  ],
  controllers: [ChainController],
  providers: [
    ChainClientService, EventIndexerService, RelayerService,
    OracleService, MeshStorageService,
  ],
  exports: [ChainClientService, MeshStorageService, OracleService],
})
export class ChainModule {}
```

In `app.module.ts` wird `ChainModule` **bedingt** geladen — bzw. immer geladen, aber
intern inert, wenn `CHAIN_ENABLED !== 'true'` (siehe §7).

---

## 4. Die fünf Services im Detail

### 4.1 `ChainClientService` — die Anbindung
- Kapselt **viem** `PublicClient` (lesen) und optional `WalletClient` (Oracle/Relayer-Key).
- Hält **Contract-Adressen** + **ABIs** + **Chain-ID** + `REQUIRED_CONFIRMATIONS`.
- Liefert getypte Reader/Writer; einzige Stelle, die RPC kennt.
- **Kein Key konfiguriert → nur Read-Modus.** Kein RPC → `enabled=false`.

> **Warum viem statt ethers?** Erstklassige TypeScript-Typen (ABI-Inferenz), modern,
> klein, gleiche Lib wie im Frontend (`wagmi/viem`) → geteilte ABIs/Typen.

### 4.2 `EventIndexerService` — das Herzstück (Chain → Mongo)
Übersetzt Contract-Events in das schnelle Mongo-Read-Model.

- **Mechanik:** `@Interval`/`@Cron` (@nestjs/schedule) pollt alle ~5–15 s
  `getLogs(fromBlock, toBlock)`; alternativ `watchEvent` für Live. Polling ist
  robuster (überlebt Reconnects, einfacher Backfill).
- **Checkpoint:** `IndexerCheckpoint` speichert pro Contract den letzten verarbeiteten
  Block → **Backfill** beim Start, **Resume** nach Neustart.
- **Idempotenz:** Dedupe-Key `txHash + logIndex`; alle Schreibvorgänge sind **Upserts**.
- **Reorg-Schutz:** Events erst als `Finalized` markieren nach `REQUIRED_CONFIRMATIONS`
  (z. B. 5–12 Blöcke je Chain). Vorher `Confirmed` (sichtbar, aber „vorläufig").
- **Verarbeitete Events → Aktionen:**

  | Event (aus `QuestEscrow.sol`) | Projektion / Seiteneffekt |
  |---|---|
  | `QuestCreated` | `ChainQuest` upsert (status=Open, onChainId, contentCid, reward) |
  | `QuestAccepted` | `ChainQuest.worker`, status=Accepted |
  | `ProofSubmitted` | status=ProofSubmitted, proofCid |
  | `QuestCompleted` | status=Completed; **DragonService.awardXp** spiegeln; ggf. User.questsCompleted |
  | `QuestCancelled` | status=Cancelled/Expired |
  | `Withdrawn` | `ChainTx`/Guthaben-Log aktualisieren |
  | `AchievementMinted` (NFT) | AchievementService-Spiegelung (Badge anzeigen) |
  | `ReputationUpdated` (SBT) | Reputation-Cache am User |

> **Später skalierbar:** Wird der Eigen-Indexer zu aufwendig, lässt er sich durch einen
> **The-Graph-Subgraph** ersetzen — die Projektions-Logik bleibt, nur die Quelle wechselt.

### 4.3 `OracleService` — Proof of Presence (Realwelt → Chain)
- Nimmt den GPS-/Zeit-Nachweis des Erfüllers (kommt über das bestehende
  Quest-Complete-Flow), prüft Distanz mit dem **vorhandenen `GeoService`** (Haversine,
  100 m), Zeit-/Bewegungsplausibilität.
- Bei Erfolg: signiert und ruft **`confirmByOracle(questId, peopleHelped, volunteerMinutes)`**
  am Escrow auf (braucht `ORACLE_ROLE`-Key im `WalletClient`).
- **Anti-Cheat:** kennt das `salt` zum `geoCommit` (verdeckter Standort on-chain) und
  verifiziert, dass der Commit aufgeht. Mehrere Oracles → später Mehrheitsentscheid.
- Ohne Oracle-Key: Bestätigung läuft **manuell durch den Auftraggeber**
  (`confirmByCreator`) — Modul bleibt funktionsfähig.

### 4.4 `RelayerService` — optional, für UX
- **Gaslose Tx** via Paymaster (ERC-4337) oder Backend-Relay, damit Nutzer ohne
  ETH/MATIC spielen (siehe Vision §5 — größte Hürde).
- Reicht vorbereitete, vom User signierte UserOps an einen Bundler weiter, oder
  sponsert ausgewählte Aktionen.
- **Standardmäßig aus.** Erst in einer späteren Phase relevant.

### 4.5 `MeshStorageService` — IPFS/Arweave-Pinning
- Lädt Quest-Inhalte/Bilder/Proofs ins Mesh, liefert die **CID** zurück (die on-chain
  in `contentCid`/`proofCid` wandert). Siehe Storage-Doc §4–5.
- **Exakt das Fallback-Muster von `ReplicateService`:** mit `IPFS_TOKEN`
  (web3.storage/Pinata) → echtes Pinning; ohne → Fallback (lokal speichern unter
  `uploads/` + Pseudo-CID als Hash) für lokale Entwicklung.

---

## 5. Datenmodelle (neue Schemas)

Alle mit `{ timestamps: true }`, `_id`→`id`-Mapping wie der Rest (siehe `data-models.md`).

### `WalletLink`
| Feld | Typ | Hinweis |
|---|---|---|
| `userId` | string | indexed, → User |
| `address` | string | lowercase, unique, EVM-Adresse |
| `verifiedAt` | Date | per Signatur (SIWE) verifiziert |
| `chainId` | number | Netz |

### `ChainQuest` (Projektion, kein Ersatz für `Quest`)
| Feld | Typ | Hinweis |
|---|---|---|
| `onChainId` | number | Quest-ID aus dem Escrow, unique je Contract |
| `questId` | string\|null | Verknüpfung zur bestehenden Mongo-`Quest` (falls vorhanden) |
| `creatorAddress` / `workerAddress` | string\|null | |
| `reward` | string | als String (BigInt-sicher) |
| `xpReward` | number | |
| `status` | `ChainQuestStatus` | aus Events abgeleitet |
| `contentCid` / `proofCid` / `geoCommit` | string\|null | Mesh-/Hash-Referenzen |
| `txHash` / `blockNumber` | string / number | Herkunft |
| `confirmations` | number | für Reorg-Schutz |

### `ChainTx`
| Feld | Typ | Hinweis |
|---|---|---|
| `txHash` | string | unique |
| `type` | string | createQuest \| confirm \| withdraw \| mint … |
| `status` | `ChainStatus` | Pending\|Confirmed\|Finalized\|Failed\|Reverted |
| `userId` | string\|null | wer ausgelöst hat |
| `meta` | Mixed | type-spezifische Felder |

### `IndexerCheckpoint`
| Feld | Typ | Hinweis |
|---|---|---|
| `contract` | string | unique (Adresse oder Name) |
| `lastBlock` | number | letzter verarbeiteter Block |

---

## 6. Schreib-Flows (Sequenzen)

### 6.1 Quest mit On-chain-Reward erstellen (Frontend signiert)

```
User → Frontend: "Quest erstellen + 5 QUEST Einsatz"
Frontend → Backend (POST /api/chain/quests/prepare):
        Inhalte (Titel/Bild) hochladen
Backend (MeshStorage): pin → contentCid
Backend (ChainController): liefert { contentCid, geoCommit, calldata, to, value }
Frontend (wagmi): approve(QUEST) + createQuest(...)  ← User signiert mit Wallet
Chain: QuestCreated-Event
Backend (EventIndexer): upsert ChainQuest(status=Open)  ← Mongo-Read-Model aktuell
Frontend: pollt /api/chain/quests/:onChainId  oder bekommt WS-Push
```

Kein Backend-Schlüssel über Nutzergelder — der **User** sperrt seinen eigenen Einsatz.

### 6.2 Abschluss via Oracle (Proof of Presence)

```
Worker → Frontend: "Quest abschließen" (GPS-Position)
Frontend → Backend (POST /api/chain/quests/:id/proof): GPS + optional Foto
Backend (MeshStorage): proof-Bild → proofCid;  on-chain submitProof (vom Worker signiert
        oder via Relayer)
Backend (OracleService): GeoService prüft Distanz ≤ Radius, Zeit/Plausibilität, geoCommit
   ok → WalletClient.confirmByOracle(questId, peopleHelped, minutes)   [ORACLE_ROLE]
Chain: QuestCompleted + ReputationUpdated
Backend (EventIndexer): ChainQuest=Completed; DragonService.awardXp(worker); User-Stats
Frontend: Belohnung sichtbar; Worker ruft später withdraw() (Pull-Pattern)
```

### 6.3 Graceful Fallback (kein Oracle-Key)
`submitProof` läuft, **Bestätigung manuell** durch Auftraggeber (`confirmByCreator`).
Der Indexer verarbeitet dasselbe `QuestCompleted`-Event — Read-Model identisch.

---

## 7. Konfiguration & Abschaltbarkeit

Neue Env-Variablen (`.env`, via `ConfigService`):

```dotenv
CHAIN_ENABLED=false                 # Master-Schalter; false ⇒ Modul inert
CHAIN_RPC_URL=                      # z. B. Base Sepolia RPC
CHAIN_ID=84532
CHAIN_REQUIRED_CONFIRMATIONS=5
ESCROW_ADDRESS=
QUESTCOIN_ADDRESS=
REPUTATION_SBT_ADDRESS=
ACHIEVEMENT_NFT_ADDRESS=
INDEXER_START_BLOCK=0               # ab hier backfillen
ORACLE_PRIVATE_KEY=                 # leer ⇒ keine Oracle-Bestätigung (manuell)
RELAYER_PRIVATE_KEY=                # leer ⇒ keine gaslosen Tx
IPFS_TOKEN=                         # leer ⇒ Mesh-Fallback (lokal)
```

**Degradationsstufen (analog `ReplicateService`):**

| Konfiguration | Verhalten |
|---|---|
| `CHAIN_ENABLED=false` | Modul lädt, alle Services no-op. App = heute. |
| RPC gesetzt, keine Keys | **Read-only**: Indexer läuft, Tx-Vorbereitung ja, keine Backend-Signaturen |
| + `ORACLE_PRIVATE_KEY` | Automatische Proof-of-Presence-Bestätigung |
| + `RELAYER_PRIVATE_KEY` | Gaslose UX |
| + `IPFS_TOKEN` | Echtes Mesh-Pinning statt lokalem Fallback |

So ist die lokale Dev-Umgebung **null-konfiguration-lauffähig** und CI bleibt grün.

---

## 8. Kopplung zu Bestandsmodulen (Einbahnstraße)

| Bestandsmodul | Beziehung |
|---|---|
| **GeoService** | `chain` **importiert** es (Oracle-Distanzprüfung). Keine Änderung an Geo. |
| **DragonService** | `chain` ruft `awardXp` beim `QuestCompleted`-Event (XP-Spiegelung). |
| **UserService** | Wallet-Link, `questsCompleted`-Spiegelung. |
| **AchievementService** | NFT-Mint-Events → vorhandene Badge-Anzeige. |
| **QuestService** | **Optionaler, dünner Hook**: beim Erstellen einer „paid" Quest kann es `chain` fragen, ob on-chain. Sonst unverändert. Bevorzugt bleibt Quest-Erstellung Frontend-getrieben. |

**Wichtig:** Kein Bestandsmodul braucht das `chain`-Modul, um zu funktionieren. Entfernt
man `ChainModule` aus `app.module.ts`, läuft die App wie vor Web3.

---

## 9. Sicherheit & Betrieb

- **Schlüssel-Hygiene:** Oracle-/Relayer-Keys nur serverseitig, via Secret-Manager,
  **nie** im Frontend. Getrennte Keys je Rolle, minimale Rechte (`ORACLE_ROLE`).
- **Nie fremde Nutzergelder verwahren:** User signieren ihren Escrow-Einsatz selbst.
- **Idempotenz & At-least-once:** alle Event-Handler upserten; Dedupe via `txHash+logIndex`.
- **Reorg-Finalität:** erst nach N Confirmations finalisieren.
- **Rate-Limits/Backoff** gegen RPC-Provider; mehrere RPC-Fallbacks.
- **DSGVO:** personenbezogene Daten **nie** on-chain/ins öffentliche Mesh — nur Hashes/
  Pseudonyme (siehe Storage-Doc §3.3).
- **Monitoring:** Indexer-Lag (Kopf-Block − lastBlock), fehlgeschlagene Tx, Oracle-Quote.

---

## 10. Verwandte Dokumente
- [`blockchain-vision.md`](./blockchain-vision.md) — Vision & Stack
- [`smart_contract/web3-speicher-tangle-und-methoden.md`](./smart_contract/web3-speicher-tangle-und-methoden.md) — Speicher/Tangle/Methoden
- [`smart_contract/contracts/`](./smart_contract/contracts/) — die Beispiel-Contracts, gegen die der Indexer arbeitet
- [`blockchain-rollout-plan.md`](./blockchain-rollout-plan.md) — phasenweiser Einführungsplan & Entscheidungen
- [`backend.md`](./backend.md) · [`architecture.md`](./architecture.md) · [`data-models.md`](./data-models.md)

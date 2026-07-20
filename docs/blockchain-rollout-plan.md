# Web3-Einführung: phasenweiser Rollout-Plan

> Status: **Plan / theoretisch.** Begleitdokument zu
> [`blockchain-backend-integration.md`](./blockchain-backend-integration.md). Beschreibt
> die Reihenfolge, in der das `chain`-Modul gefahrlos eingeführt wird, plus
> Architektur-Entscheidungen (ADR-Stil) und Risiken. Ziel: **früh testen, jederzeit
> abschaltbar, kein Big-Bang.**

---

## 1. Phasen-Übersicht

Jede Phase ist eigenständig wertvoll und hinter `CHAIN_ENABLED` / Feature-Flags
versteckt. Reihenfolge nach Risiko/Wert: erst lesen, dann nicht-monetäre Werte, zuletzt
echte Vergütung.

| Phase | Ziel | Backend-Teile | Risiko |
|---|---|---|---|
| **0 — Fundament** | Contracts auf Testnet, ABIs exportiert, Read-only-Anbindung | `ChainClientService` (read) | sehr niedrig |
| **1 — Indexer** | Chain-Events → Mongo-Projektionen, sichtbar im Frontend | `EventIndexerService`, Schemas, Checkpoint | niedrig |
| **2 — Reputation (SBT)** | Geholfene Menschen / Stunden on-chain (nicht handelbar) | Indexer für `ReputationSBT`, Wallet-Link | niedrig (kein Geldwert) |
| **3 — Mesh-Storage** | Quest-Bilder/Proofs in IPFS, CID on-chain | `MeshStorageService` | niedrig |
| **4 — Escrow (Test-Credits)** | Quest-Vergütung end-to-end auf Testnet | `OracleService`, Tx-Vorbereitung | mittel |
| **5 — Gaslose UX** | Account Abstraction + Paymaster | `RelayerService` | mittel |
| **6 — Pilot Mainnet (L2)** | Eine Community, echte (kleine) Werte | alles, Monitoring, Audit | hoch |

> **Nie Phase 6 ohne externen Smart-Contract-Audit** und ausreichende Foundry-Test-
> Coverage der Contracts.

---

## 2. Phase-Details (Definition of Done)

### Phase 0 — Fundament
- Contracts aus [`smart_contract/contracts/`](./smart_contract/contracts/) mit Foundry
  bauen + testen, auf **Base Sepolia / Polygon Amoy** deployen.
- ABIs nach `backend/src/chain/abi/` exportieren.
- `ChainClientService` verbindet read-only, liest z. B. `nextQuestId`.
- **DoD:** Backend kann eine Test-Quest von der Chain lesen; `CHAIN_ENABLED=false`
  ändert nichts an der App.

### Phase 1 — Indexer
- `EventIndexerService` mit Checkpoint + Backfill + Idempotenz (`txHash+logIndex`).
- Projektion `ChainQuest`; Read-Endpoint `GET /api/chain/quests/:onChainId`.
- **DoD:** Eine manuell auf dem Testnet erstellte Quest erscheint korrekt in Mongo und
  im Frontend; Backend-Neustart führt zu konsistentem Resume (kein Doppel-Eintrag).

### Phase 2 — Reputation-SBT
- Indexer verarbeitet `ProfileMinted` / `ReputationUpdated`.
- `WalletLink` (SIWE-Signatur verifiziert userId ↔ Adresse).
- **DoD:** Verifizierte Stunden/geholfene Menschen erscheinen als nicht-handelbare
  Reputation im Profil. Keine Vergütung im Spiel.

### Phase 3 — Mesh-Storage
- `MeshStorageService` mit IPFS-Pinning (web3.storage/Pinata) + lokalem Fallback.
- Quest-Inhalte/Proofs → CID; CID in `contentCid`/`proofCid`.
- **DoD:** Bild liegt im Mesh, CID on-chain verankert, Frontend lädt über Gateway;
  ohne `IPFS_TOKEN` greift der lokale Fallback.

### Phase 4 — Escrow mit Test-Credits
- Tx-Vorbereitung (`/prepare`), Frontend signiert `approve`+`createQuest`.
- `OracleService` bestätigt Proof of Presence (GeoService) → `confirmByOracle`.
- XP-Spiegelung über `DragonService` beim `QuestCompleted`-Event.
- **DoD:** Eine Quest-Vergütung läuft mit Test-QUEST komplett durch (erstellen →
  annehmen → proof → bestätigen → withdraw); manueller Fallback (`confirmByCreator`)
  ebenfalls getestet.

### Phase 5 — Gaslose UX
- `RelayerService` + Paymaster/Bundler (ERC-4337), Social-Login-Wallet im Frontend.
- **DoD:** Ein Nutzer ohne native Gas-Coins kann eine Quest annehmen/abschließen.

### Phase 6 — Pilot auf L2-Mainnet
- Audit bestanden, Monitoring/Alerting (Indexer-Lag, Tx-Fehler), Notfall-Pause.
- Kleine reale Beträge, eine Community.
- **DoD:** These „Tausch ohne Geld funktioniert" wird in einer echten Gruppe gemessen.

---

## 3. Architektur-Entscheidungen (ADR-kompakt)

| # | Entscheidung | Begründung | Alternative |
|---|---|---|---|
| ADR-1 | **Eigenes `chain`-Modul**, Einbahn-Kopplung | klare Grenze, App bleibt ohne Chain lauffähig | Logik in Quest-Modul streuen (verworfen: Kopplung) |
| ADR-2 | **Mongo = Read-Model aus Events**, nicht Dual-Write | keine Inkonsistenz Chain↔DB | optimistisch in Mongo schreiben (verworfen: Drift) |
| ADR-3 | **viem** als Chain-Lib | TS-Typen, gleiche Lib wie Frontend, geteilte ABIs | ethers.js (ok, aber schwächere Typen) |
| ADR-4 | **Eigener Poll-Indexer zuerst**, The Graph später | weniger Infra im MVP, einfacher Backfill | sofort Subgraph (mehr Setup) |
| ADR-5 | **User signiert eigenen Escrow-Einsatz** | Backend verwahrt nie fremde Gelder | Backend-Custody (verworfen: Risiko/Recht) |
| ADR-6 | **EVM-L2 (Base/Polygon) als Haupt-Chain**, Tangle optional | reifes Tooling, Solidity, Auditoren | IOTA/Tangle primär (kleineres Ökosystem) |
| ADR-7 | **Feature-Flag + graceful degradation** | risikofreies Ausrollen, grüne CI | harte Abhängigkeit (verworfen) |
| ADR-8 | **Oracle-Bestätigung optional**, manueller Fallback | Modul ohne Oracle-Key nutzbar | nur-Oracle (verworfen: Single Point) |

---

## 4. Offene Fragen (aus der Vision, hier zu klären)

1. **Tausch-Einheit:** reine Zeit-Credits (1 h = 1) vs. frei bewerteter QuestCoin?
   → beeinflusst `QuestCoin`-Mint-Politik und Demurrage.
2. **Demurrage an/aus?** (Gesell-Modell, „rostendes Geld") — per Governance schaltbar
   im Contract vorgesehen.
3. **Wie viel muss wirklich on-chain?** MVP kann mit reiner Reputation (Phase 2) starten.
4. **Rechtliches:** Token + Tausch berühren MiCA/Steuer-/Finanzaufsichtsrecht (DE/EU).
   **Vor Phase 6 juristisch klären.**
5. **Tangle als Daten-Layer?** Erst evaluieren, wenn feeless Massendaten (Proof-of-
   Presence-Rohdaten) zum echten Kostenproblem werden — nicht im MVP.

---

## 5. Risiken & Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|---|---|
| Smart-Contract-Bug (unveränderlich) | Foundry-Tests, externer Audit, Upgrade-Proxy in frühen Phasen, Pause-Funktion |
| Chain-Reorg → falsche Projektion | N Confirmations vor Finalität; `Confirmed`→`Finalized` |
| RPC-Ausfall | mehrere RPC-Provider, Backoff, Indexer holt nach (Checkpoint) |
| Doppelte Event-Verarbeitung | Idempotente Upserts, Dedupe `txHash+logIndex` |
| Krypto-UX schreckt ab | Account Abstraction + gaslos (Phase 5), Social-Login |
| Schlüssel-Leak (Oracle/Relayer) | Secret-Manager, rollengetrennt, minimale Rechte, rotierbar |
| DSGVO-Verstoß durch On-chain-PII | nur Hashes/Pseudonyme on-chain, PII bleibt in Mongo |
| Rechtliche Einordnung Token | Phase 6 erst nach juristischer Prüfung |
| Indexer driftet von Chain | Monitoring Indexer-Lag, automatischer Re-Sync ab Checkpoint |

---

## 6. Sofort startbarer erster Schritt

1. `backend/src/chain/`-Gerüst anlegen (leere Services, Feature-Flag `CHAIN_ENABLED`).
2. Contracts auf Base Sepolia deployen, ABIs nach `chain/abi/` exportieren.
3. `ChainClientService` read-only + ein `GET /api/chain/health` (Kopf-Block, enabled-Status).
4. Danach Phase 1 (Indexer) — ab hier wird Web3 im Frontend sichtbar.

---

## 7. Verwandte Dokumente
- [`blockchain-backend-integration.md`](./blockchain-backend-integration.md) — Modul-Architektur
- [`blockchain-vision.md`](./blockchain-vision.md) — Vision & Stack
- [`smart_contract/web3-speicher-tangle-und-methoden.md`](./smart_contract/web3-speicher-tangle-und-methoden.md) — Speicher/Tangle/Methoden
- [`smart_contract/contracts/`](./smart_contract/contracts/) — Beispiel-Contracts

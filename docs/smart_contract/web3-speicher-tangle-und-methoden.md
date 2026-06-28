# Web3-Speicher, Tangle & die effektivsten Methoden (Stand 2026)

> Status: **Recherche / Vertiefung.** Baut auf [`blockchain-vision.md`](../blockchain-vision.md)
> (EVM/Solidity-Linie) und den beiden Solana-Erklärdateien in diesem Ordner auf.
> Dieses Dokument beantwortet konkret: *Was sind Smart Contracts & Tangle, was kann
> ich on-chain speichern, was gehört in ein „Mesh"/dezentralen Speicher, und welche
> Methoden sind aktuell am effektivsten?* Die Beispiel-Contracts dazu liegen unter
> [`contracts/`](./contracts/).

---

## 0. TL;DR — die wichtigsten Antworten zuerst

- **Smart Contract** = Programmcode auf einer Blockchain, der Regeln ohne Mittelsmann
  erzwingt (Escrow, Token, Reputation). Für SideQuest: Quest-Vergütung, Eigentum, XP.
- **Tangle** = Alternative zur Blockchain. Statt einer Kette von Blöcken ist es ein
  **DAG** (gerichteter azyklischer Graph). Bekanntester Vertreter: **IOTA**. Vorteil:
  **gebührenfreie Micro-Transaktionen**, gut für IoT/Sensorik. Nachteil: kleineres
  Smart-Contract-Ökosystem als EVM.
- **On-chain speichern kannst du fast alles — aber du willst es nicht.** Speicher ist
  extrem teuer. Regel: **Werte, Eigentum, Konsens und Hashes** on-chain; **große Daten
  (Bilder, Quest-Texte, GPS-Tracks, Chat) off-chain** in einem dezentralen Speicher.
- **„Mesh"-Speicher** = dezentraler, verteilter Speicher (IPFS, Arweave, Swarm,
  Filecoin, Storj). Daten liegen über viele Knoten verteilt; on-chain liegt nur der
  **Content-Hash (CID)** als unveränderlicher Fingerabdruck.
- **Effektivste Methode 2026**: **Hybrid** — Hash/Merkle-Root on-chain, Nutzdaten im
  Mesh, Events als günstiges Log, L2 (Base/Polygon) + EIP-4844-Blobs für niedrige
  Kosten. Genau das, was die Vision bereits skizziert.

---

## 1. Smart Contracts — kurze Auffrischung

Ein Smart Contract ist ein Programm, das **deterministisch** auf jeder Node gleich
ausgeführt wird und dessen Zustand (State) für alle nachprüfbar in der Chain liegt.

```
WENN  Auftraggeber bestätigt Quest-Abschluss
DANN  gib die hinterlegten Credits an den Erfüller frei
```

Eigenschaften, die uns wichtig sind:

| Eigenschaft | Bedeutung für SideQuest |
|---|---|
| **Unveränderlich** nach Deploy | Bugs sind teuer → Tests (Foundry) + ggf. Upgrade-Proxy |
| **Transparent** | Jede Quest-Auszahlung ist öffentlich nachvollziehbar |
| **Trustless** | Escrow ersetzt die Plattform als Mittelsmann |
| **Komponierbar** | Token + Reputation + NFT greifen ineinander |
| **Isoliert** | Kennt **kein** GPS, keine Uhr, kein Internet → **Oracles** nötig |

Die ausführliche Erklärung von Accounts, PDAs, Instructions etc. steht (Solana-Sicht)
in *„🐉 Solana für deinen Drachen"*. Auf EVM heißen die Pendants: Contract-Address,
Storage-Slots, Function-Calls, Transactions.

---

## 1.5 Warum Smart Contracts so krass sind

Smart Contracts sind nicht „eine teurere Datenbank". Sie können etwas, das ein
klassischer Server **prinzipiell nicht** kann: **Regeln durchsetzen, denen niemand
vertrauen muss — auch dem Betreiber nicht.** Genau das macht die SideQuest-Vision
(„Protokoll statt Plattform-Konzern", siehe [`blockchain-vision.md`](../blockchain-vision.md))
überhaupt erst möglich. Die Superkräfte konkret:

### a) Trustless statt „vertrau uns"
Bei einer normalen App hält *die Plattform* die Quest-Vergütung und entscheidet, ob
ausgezahlt wird. Du musst dem Betreiber vertrauen, dass er nicht einbehält,
manipuliert oder pleitegeht. Ein **Escrow-Contract** ([`QuestEscrow.sol`](./contracts/QuestEscrow.sol))
sperrt die Credits in *Code*: Bei Erfüllung **muss** ausgezahlt werden, bei Abbruch
fließt zurück — der Betreiber kann den Topf weder anfassen noch verschwinden lassen.
Vertrauen verlagert sich von einer Firma auf öffentlich prüfbaren Code.

### b) Programmierbares Geld
Ein ERC-20 wie [`QuestCoin.sol`](./contracts/QuestCoin.sol) ist Geld, in das man
*Regeln einbauen* kann. Die Vision will eine Einheit, die **zirkuliert statt sich
anzuhäufen** — Demurrage / „rostendes Geld" lässt sich direkt in den Token codieren.
Mit klassischem Geld auf einer Bank ist das unmöglich; im Contract sind es ein paar
Zeilen. Geld wird vom passiven Wert zum **aktiven Mechanismus**.

### c) Komponierbarkeit (das „Lego-Prinzip")
Contracts greifen wie Bausteine ineinander: Der Escrow zahlt in `QuestCoin`, vergibt
gleichzeitig Reputation über das [`ReputationSBT`](./contracts/ReputationSBT.sol) und
mintet ein Achievement-NFT — **alles in einer Transaktion, atomar**. Entweder passiert
alles, oder nichts. Und: *fremde* Apps können auf SideQuest-Token/Reputation aufsetzen,
ohne uns um Erlaubnis zu fragen. Eine API kann morgen abgeschaltet werden, ein
deployter Contract nicht.

### d) Eigentum, das wirklich dem Nutzer gehört
XP, Badges und Coins liegen heute in *unserer* DB — wir könnten sie löschen, der
Nutzer kann sie nicht mitnehmen. On-chain gehören sie der Wallet des Nutzers.
Reputation als **Soulbound Token** ist fälschungs- und kaufsicher: „Beitrag ist die
Währung" wird damit technisch erzwungen, nicht nur versprochen.

### e) Transparenz & Nachprüfbarkeit by default
Jede Quest-Auszahlung, jede Reputationsvergabe ist öffentlich nachvollziehbar. Niemand
muss unseren Zahlen glauben — jeder kann sie selbst verifizieren. Für eine
Gemeingüter-/Tausch-Ökonomie ist das die Grundlage: Der Gemeinschaftspool ist
**auditierbar**, nicht eine Blackbox.

### f) Automatisch & immer an
Kein Cronjob, kein Server, der ausfallen kann, keine Öffnungszeiten: Sind die
Bedingungen erfüllt, *führt sich der Contract selbst aus*. Er läuft auf hunderten
Nodes gleichzeitig — es gibt keinen einzelnen „Aus-Schalter".

### g) Permissionless & global
Es gibt keinen Gatekeeper. Jeder mit Wallet kann teilnehmen — keine Kontoeröffnung,
keine Bonitätsprüfung, keine Ländergrenze. Genau das, was „Selbst-Finanzierung der
Menschen" ohne kapitalistische Mittelsmänner voraussetzt.

> | Klassisches Backend | Smart Contract |
> |---|---|
> | Betreiber kann Daten/Geld ändern | Regeln nach Deploy unveränderlich |
> | „Vertrau uns" | „Prüf es selbst" |
> | Login/Konto nötig | Permissionless |
> | Wert/Eigentum bei der Plattform | beim Nutzer (Wallet) |
> | API kann abgeschaltet werden | Contract läuft weiter |

### ⚠️ Die Kehrseite (ehrlich)
Dieselben Eigenschaften, die krass sind, sind auch gefährlich: **Unveränderlich heißt
auch unverzeihlich** — ein Bug ist deployed Geld weg (→ Audits, Tests, ggf. Upgrade-Proxy,
siehe §6.9). **Transparent heißt auch öffentlich** — personenbezogene Daten dürfen nie
roh on-chain (§3.3). Und der Contract ist **isoliert** — er kennt kein GPS und keine
Uhr, dafür brauchen wir Oracles (§6.8). Smart Contracts sind also kein Ersatz für unser
NestJS/Mongo-Backend, sondern die **Vertrauens- und Wert-Schicht darüber**. Genau diese
Arbeitsteilung beschreibt die Hybrid-Architektur in §7.

---

## 2. Blockchain vs. Tangle (DAG)

### 2.1 Klassische Blockchain (Bitcoin, Ethereum, Solana, Polygon)

```
Block 1 → Block 2 → Block 3 → Block 4
```

Transaktionen werden in **Blöcke** gepackt, Blöcke bilden eine **lineare Kette**.
Ein globaler Konsens (PoW/PoS) entscheidet, welcher Block als nächstes kommt. Das ist
sehr sicher, aber: begrenzter Durchsatz, Gebühren (Gas), und Transaktionen
„konkurrieren" um Blockplatz.

### 2.2 Tangle (IOTA) — ein DAG statt einer Kette

```
        tx ──► tx ──► tx
       ╱   ╲  ╱   ╲  ╱
   tx        tx        tx   (jede neue Tx bestätigt 2 frühere)
       ╲   ╱  ╲   ╱  ╲
        tx ──► tx ──► tx
```

Im **Tangle** gibt es keine Blöcke und keine Miner im klassischen Sinn. **Jede neue
Transaktion bestätigt zwei vorherige.** Je mehr Aktivität, desto schneller und
sicherer wird das Netz — das Gegenteil des „Blöcke konkurrieren"-Problems.

| Kriterium | Blockchain (EVM/Solana) | Tangle (IOTA) |
|---|---|---|
| Struktur | Lineare Kette von Blöcken | DAG, jede Tx bestätigt 2 andere |
| Gebühren | Gas pro Tx | **Feeless** (klassisch); IOTA 2.0 mit Mana |
| Durchsatz-Verhalten | Sinkt unter Last (Konkurrenz) | **Skaliert mit Last** |
| Smart Contracts | Sehr ausgereift (Solidity, riesiges Ökosystem) | **IOTA Smart Contracts (ISC)**, EVM-kompatibel, aber kleiner |
| Stärke | DeFi, NFTs, Eigentum, große Tooling-Basis | **Micro-Transaktionen, IoT, Sensor-/Maschinendaten** |
| Reife/Liquidität | Sehr hoch | Geringer, kleineres Auditor-/Tooling-Umfeld |
| „Data on Tangle" | – | Daten direkt feeless als Tx anhängbar |

> **Begriffsklärung „Mesh".** Tangle wird wegen seiner Netz-Struktur oft mit einem
> „Mesh" verwechselt. Genau genommen sind das zwei Dinge:
> 1. **Tangle/DAG** = die *Konsens-/Ledger*-Struktur (wie Transaktionen verknüpft sind).
> 2. **Mesh-/dezentraler Speicher** (IPFS, Swarm …) = wo die *Nutzdaten* liegen.
> In diesem Dokument behandeln wir beides getrennt (Abschnitt 2 = Ledger,
> Abschnitt 5 = Speicher).

### 2.3 Relevanz für SideQuest

- **Wenn der Fokus auf Vergütung, Eigentum, Reputation, NFTs liegt** → klassische
  EVM-L2 (**Base/Polygon**, siehe Vision). Ausgereiftes Tooling, Solidity, Auditoren,
  Account Abstraction für gute UX. **Das ist die empfohlene Hauptlinie.**
- **Wenn extrem viele feeless Micro-Events anfallen** (z. B. jeder einzelne
  GPS-/Proof-of-Presence-Datenpunkt soll dezentral verankert werden) → **Tangle/IOTA**
  ist hier konzeptionell stark, weil gebührenfrei. Mögliche Rolle: **Daten-Layer für
  Sensor-/Bewegungsnachweise**, während Werte/Eigentum auf der EVM-Chain bleiben.
- Realistische Empfehlung: **EVM-L2 als Haupt-Chain**, Tangle nur als *optionaler*
  Daten-/Proof-Layer prüfen, falls feeless-Massendaten zum echten Engpass werden. Nicht
  beides gleichzeitig im MVP — Komplexität.

---

## 3. Was kann ich on-chain in einem Smart Contract speichern?

**Technisch:** beliebige Bytes. **Praktisch** limitiert durch Kosten und Block-Limits.

### 3.1 Datenarten & wo sie hingehören

| Datenart | On-chain? | Begründung |
|---|---|---|
| Token-Guthaben, Eigentum, Stakes | ✅ ja (State) | Das ist der Kern-Wert, muss trustless sein |
| Quest-Status (offen/angenommen/erfüllt) | ✅ ja (State) | Konsens-kritisch, klein |
| Reputation / XP-Summen | ✅ ja (State/SBT) | Soll fälschungssicher & öffentlich sein |
| Eindeutige IDs, Adressen, Zeitstempel (Block) | ✅ ja | Klein, billig |
| **Hash/CID** großer Off-chain-Daten | ✅ ja (32 Bytes) | Verankert Integrität ohne die Daten selbst |
| Merkle-Root vieler Einträge | ✅ ja (32 Bytes) | Beweist Zugehörigkeit von 1000en Items mit 1 Slot |
| Quest-Beschreibung, Bilder, Avatare | ❌ nein → Mesh | Zu groß/teuer |
| GPS-Tracks, Sensorrohdaten, Chat | ❌ nein → Mesh/DB | Massendaten, privat, teuer |
| Live-Standorte, Echtzeit | ❌ nein → Backend | Latenz + Datenschutz |

### 3.2 Drei Speicherorte auf der EVM — Kostenklassen

1. **`storage` (permanenter State)** — am teuersten. Ein neuer 32-Byte-Slot kostet
   ~20.000 Gas. Hier liegen Guthaben, Mappings, Quest-Status. **Sparsam einsetzen.**
2. **`calldata` / Transaction-Input** — Daten der Transaktion. Wird **nicht** dauerhaft
   gespeichert, ist aber in der Historie. Günstiger als storage.
3. **`events` / Logs** — sehr günstig zu schreiben, **nicht aus Contracts lesbar**,
   aber perfekt für Indexer (The Graph) und Frontend. Für SideQuest die zentrale
   Brücke „on-chain Ereignis → schnelles Backend".

> **Faustregel Kosten:** State-Slot schreiben ≫ Event emittieren ≫ off-chain
> speichern. Speichere on-chain nur, was ein Contract *später lesen/prüfen* muss.
> Alles, was nur *protokolliert* werden soll, gehört in ein **Event**.

### 3.3 Limits, an die du denken musst

- **Block-Gas-Limit:** eine einzelne Tx kann nicht beliebig viel schreiben.
- **Wachsende Listen** (z. B. „alle je abgeschlossenen Quests") niemals als
  unbegrenztes Array iterieren → Gas-Explosion. Stattdessen: Mappings, Merkle-Roots,
  oder off-chain indexieren.
- **Keine echte Zeit/GPS/Random** im Contract → Oracle (Chainlink) bzw. `block.timestamp`
  nur grob.
- **Datenschutz/DSGVO:** On-chain ist **öffentlich & unlöschbar**. Personenbezogene
  Daten gehören **nie** roh on-chain — nur Hashes/Pseudonyme.

---

## 4. Kann ich Daten in einem „Mesh" speichern? — Ja, das ist sogar der richtige Weg

„Mesh-Speicher" meint einen **dezentralen, verteilten Speicher**: Daten liegen
**verteilt über viele unabhängige Knoten**, adressiert über ihren **Inhalts-Hash**
(Content-Addressing) statt über einen Server-Pfad. On-chain landet nur der Hash.

```
   großes Quest-Bild / GPS-Track
            │  upload
            ▼
   ┌──────────── Mesh (verteilte Knoten) ────────────┐
   │  node ── node ── node ── node ── node ── node    │
   │     ╲   ╱    ╲   ╱   ╲   ╱   ╲   ╱   ╲   ╱        │
   │      node ──── node ──── node ──── node          │
   └──────────────────────┬───────────────────────────┘
                          │  liefert CID (Hash)
                          ▼
                Smart Contract speichert nur:
                bytes32 cid   ◄── 32 Bytes, billig, integritätssicher
```

**Warum das funktioniert:** Ändert jemand auch nur 1 Byte der Datei, ändert sich der
Hash → die on-chain verankerte CID passt nicht mehr → Manipulation sofort erkennbar.
Der Contract „besitzt" also einen **fälschungssicheren Zeiger** auf beliebig große
Daten, ohne sie zu bezahlen.

---

## 5. Mesh-/dezentrale Speicher im Vergleich (2026)

| System | Modell | Persistenz | Gut für | Achtung |
|---|---|---|---|---|
| **IPFS** | Content-addressed P2P | Nur solange jemand „pinnt" | Bilder, Metadaten, NFT-Assets | Daten verschwinden, wenn niemand pinnt → Pinning-Dienst (Pinata, web3.storage) |
| **Filecoin** | IPFS + bezahlte Speicher-Deals | Vertraglich garantiert | Langzeit-IPFS mit Garantie | Mehr Overhead/Kosten |
| **Arweave** | „Pay once, store forever" | **Permanent** (einmalzahlung) | Unveränderliche Proofs, Quest-Archiv, NFT-Metadaten | Wirklich permanent → nichts Privates/Löschbares |
| **Swarm** | Ethereum-natives P2P, incentiviert | Über BZZ-Anreize | EVM-nahe DApps | Kleineres Ökosystem |
| **Storj / Sia** | Verteilter, verschlüsselter Cloud-Storage | Bezahlt, S3-kompatibel | Größere/private Dateien, Backups | Eher „dezentrale Cloud" als Web3-nativ |
| **Ceramic / OrbitDB** | Mutable, verteilte Datenbanken/Streams | Knoten-abhängig | **Veränderliche** Profile, Feeds, DIDs | Komplexer, andere Garantien |
| **Tangle (IOTA) „data tx"** | Daten feeless als Tx | Ledger-abhängig | Sensor-/Bewegungsnachweise | Kein klassischer Datei-Speicher |

### Wann was für SideQuest?

- **Quest-Bilder, Avatare, Achievement-Art** → **IPFS + Pinning** (oder Arweave, wenn
  sie nie verschwinden sollen).
- **Unveränderliche Proofs** (Abschluss-Nachweis, „diese Quest wurde so erfüllt") →
  **Arweave** (permanent) oder Hash-on-chain + IPFS.
- **Veränderliche Profildaten** (Bio, Settings) → **Ceramic** *oder* schlicht das
  bestehende NestJS/Mongo-Backend (siehe unten).
- **Privates/Personenbezogenes** → **verschlüsselt** in Storj/Backend, **nie** roh in
  ein öffentliches Mesh oder on-chain.

> **Wichtig für SideQuest:** Du hast bereits ein **NestJS + MongoDB**-Backend. Nicht
> alles muss ins Mesh. Pragmatisch: **on-chain = Werte/Eigentum**, **Mesh = öffentliche
> unveränderliche Assets/Proofs**, **Mongo-Backend = schneller Cache, Geo-Queries,
> Echtzeit, private Daten**. Das deckt sich mit der Hybrid-Architektur der Vision.

---

## 6. Die aktuell effektivsten Methoden (Pattern-Katalog 2026)

Konkrete, bewährte Muster — nach Wirkung sortiert.

### 6.1 Hybrid „Hash-on-chain, Daten off-chain" (das wichtigste Muster)
Speichere on-chain nur `bytes32` (Keccak-Hash oder IPFS-CID). Nutzdaten ins Mesh.
→ Integrität garantiert, Kosten minimal. **Für jeden Quest-Proof, jedes Bild.**

### 6.2 Events statt State für alles „nur zum Protokollieren"
Was der Contract nicht selbst wieder lesen muss, wird **`emit`**-tet, nicht gespeichert.
Ein Indexer (**The Graph** / das NestJS-Backend) hört zu und füllt Mongo.
→ 1–2 Größenordnungen billiger als State.

### 6.3 Merkle-Roots / Merkle-Drops
Tausende Berechtigungen (z. B. „diese 5.000 Nutzer dürfen Badge X claimen") als **ein
einziger 32-Byte-Root** on-chain. Nutzer beweist Zugehörigkeit per Merkle-Proof.
→ Massendaten mit konstanten On-chain-Kosten.

### 6.4 Layer-2 + EIP-4844 „Blobs"
Auf **Base/Polygon/Arbitrum** statt L1 deployen. Seit **EIP-4844 (Proto-Danksharding)**
gibt es günstige **Blob**-Datenräume für Rollups → drastisch niedrigere Tx-Kosten.
→ Macht Micro-Quests überhaupt erst bezahlbar.

### 6.5 Account Abstraction (ERC-4337) + Paymaster
Nutzer brauchen **keine Seed-Phrase** und können **gaslos** spielen (Sponsoring per
Paymaster), Login via Social. → Beseitigt die größte UX-Hürde (siehe Vision §5).

### 6.6 Soulbound Tokens (SBT) für Reputation
Nicht-übertragbare Tokens → Reputation lässt sich **nicht kaufen/handeln**. Genau
richtig für „Beitrag ist die Währung".

### 6.7 Storage-Mikrooptimierung
- **Struct-Packing:** mehrere kleine Felder in einen 32-Byte-Slot (z. B.
  `uint128 reward` + `uint64 expiry` + `uint8 status`).
- **`uint256` statt kleiner Typen** für Einzelvariablen (EVM-Wort = 32 Bytes).
- **`immutable`/`constant`** für unveränderliche Werte (kein Storage).
- **Mappings statt Arrays** für Lookups; nie über unbegrenzte Arrays iterieren.

### 6.8 Oracles für Realwelt-Daten (Proof of Presence)
GPS/Zeit/Distanz kommen **signiert** über ein Oracle (Chainlink Functions oder eigener
Verifier) on-chain. Mehrere Oracles → Mehrheitsentscheid (Anti-Cheat). Siehe die
ausführliche Oracle-Erklärung in *„🐉 Der Drache entwickelt ein SideQuest-System"*.

### 6.9 Sicherheits-Pflichtmuster
- **Checks-Effects-Interactions** + **ReentrancyGuard** (gegen Re-Entrancy).
- **Pull-over-Push** Auszahlungen (Nutzer „claimt" statt automatischem Senden).
- **Replay-Schutz** (Nonce/verbrauchte Hashes), **einmalige** Reward-Einlösung.
- **Rollen/Access-Control** (nur autorisierte Ersteller).
- Audit + viel Test-Coverage (Foundry), bevor echtes Geld fließt.

---

## 7. Konkrete Zuordnung für SideQuest

| SideQuest-Datenmodell (siehe `data-models.md`) | Wohin | Wie |
|---|---|---|
| Quest-Vergütung / Einsatz (`reward`) | **On-chain** | Escrow-Contract, Credits gesperrt → freigegeben |
| Quest-Status (`acceptedBy`, `completedBy`) | **On-chain** (kompakt) + Event | Status-Enum im Struct, `emit` für Indexer |
| Quest-Text/Bild (`title`, `description`, Foto) | **Mesh (IPFS/Arweave)** | CID `bytes32` on-chain |
| Reputation / `questsCompleted` / `level` | **On-chain (SBT)** | nicht übertragbarer Reputation-Token |
| Reward-Währung (`QUEST`/Time-Credit) | **On-chain (ERC-20)** | optional Demurrage |
| Achievements / Badges | **On-chain (ERC-721)** + Mesh-Metadaten | NFT mint, Art im Mesh |
| GPS-Track / Proof of Presence | **Off-chain** (Oracle bringt nur Ergebnis) | Hash des Tracks ggf. on-chain |
| Chat (`Message`), Live-Standort, Geo-Suche | **NestJS/Mongo (wie heute)** | bleibt off-chain |

---

## 8. Beispiel-Smart-Contracts (Solidity)

Lauffähige, kommentierte Beispiele im Ordner [`contracts/`](./contracts/). Sie sind
**Lern-/Prototyp-Code** (Solidity ^0.8.24, OpenZeppelin) — vor echtem Einsatz auditieren.

| Datei | Zweck | Demonstriert |
|---|---|---|
| [`QuestCoin.sol`](./contracts/QuestCoin.sol) | ERC-20 Tausch-Einheit „QUEST" | Token, Rollen-Mint, optionale Demurrage-Idee |
| [`ReputationSBT.sol`](./contracts/ReputationSBT.sol) | Soulbound Reputation/XP | Nicht-übertragbar, On-chain-Reputation |
| [`AchievementNFT.sol`](./contracts/AchievementNFT.sol) | Achievement-Badges | ERC-721, Metadaten-CID im Mesh |
| [`QuestEscrow.sol`](./contracts/QuestEscrow.sol) | **Kern**: Quest-Lifecycle + Escrow | Hash-on-chain, Events, ReentrancyGuard, Pull-Pattern, Oracle-Hook |

Empfohlene Lese-Reihenfolge: `QuestCoin` → `ReputationSBT` → `AchievementNFT` →
`QuestEscrow` (bindet die anderen drei zusammen).

### Lokales Testen (Foundry)

```bash
# Foundry installieren
curl -L https://foundry.paradigm.xyz | bash && foundryup

# Projekt + OpenZeppelin
forge init sidequest-contracts && cd sidequest-contracts
forge install OpenZeppelin/openzeppelin-contracts

# .sol-Dateien nach src/ kopieren, dann:
forge build
forge test
```

---

## 9. Empfohlener nächster Schritt

1. **Escrow-Prototyp** (`QuestEscrow.sol`) auf **Base Sepolia / Polygon Amoy** (Testnet)
   deployen, eine Quest end-to-end durchspielen.
2. **IPFS-Pinning** (web3.storage/Pinata) für Quest-Bilder anbinden, CID on-chain.
3. **NestJS-Backend zum Event-Indexer** ausbauen (auf Contract-Events hören → Mongo).
4. **Reputation-SBT** als erstes „echtes" Feature (geholfene Menschen / Stunden).
5. *Optional später:* prüfen, ob ein **Tangle/IOTA-Daten-Layer** für feeless
   Massen-Proofs Sinn ergibt — nur falls Kosten/Volumen es erzwingen.

---

*Verwandte Docs: [`blockchain-vision.md`](../blockchain-vision.md) ·
[`architecture.md`](../architecture.md) · [`data-models.md`](../data-models.md) ·
„🐉 Solana für deinen Drachen" · „🐉 Der Drache entwickelt ein SideQuest-System"*

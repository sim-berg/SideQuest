# Vision: SideQuest on-chain & die Tausch-Ökonomie

> Status: **Konzept / Brainstorm** — noch keine Implementierung. Dieses Dokument
> hält die Idee, die ökonomische These und den Technologie-Stack fest, damit wir
> später konkrete Entscheidungen treffen können.

## 1. Die Grundidee

SideQuest ist heute eine Quest-App: Menschen erledigen Aufgaben in der realen
Welt und verdienen XP und Coins. Die Vision geht weiter:

**Quests werden zu echten Aufträgen zwischen Menschen — und ihre Vergabe,
Erfüllung und Vergütung laufen über eine Blockchain statt über Geld und Banken.**

Statt „Arbeit gegen Lohn" entsteht ein Netzwerk aus **gegenseitiger Hilfe und
Tausch**: Wer eine Aufgabe vergibt, gibt etwas in den Pool; wer sie erfüllt,
bekommt etwas heraus. Der Wert zirkuliert in der Community, nicht in einem
Kapitalmarkt.

## 2. Die ökonomische These — „Kapitalismus abschaffen"

Wir wollen den Kern-Mechanismus des Kapitalismus ersetzen, nicht nur eine App
bauen. Konkret heißt das:

| Kapitalismus heute | SideQuest-Ökonomie |
|---|---|
| Geld als Ware, das Zinsen abwirft | Tausch-Einheit, die **zirkuliert statt sich anzuhäufen** |
| Arbeit gegen Lohn, Mehrwert beim Eigentümer | Auftrag gegen Auftrag, Wert bleibt bei den Beteiligten |
| Mittelsmänner (Banken, Plattformen) nehmen Marge | Peer-to-Peer, Protokoll statt Plattform-Konzern |
| Vertrauen durch Verträge & Institutionen | Vertrauen durch Code, Reputation & Transparenz |
| Akkumulation belohnt | **Beitrag** belohnt (geholfene Menschen, geleistete Stunden) |

Wichtige Designprinzipien, die diese These tragen:

- **Tausch statt Hortung.** Die interne Einheit (nennen wir sie vorerst
  *QuestCoin* / *Time-Credit*) soll Fluss belohnen. Optionen: Demurrage
  (negativer Zins / „rostendes Geld" nach Silvio Gesell), damit Anhäufen sich
  nicht lohnt; oder reine Zeit-Gutschriften (1 Stunde Hilfe = 1 Credit, wie bei
  Timebanking).
- **Beitrag ist die Währung.** Reputation, geholfene Menschen, verifizierte
  ehrenamtliche Stunden und gelaufene Kilometer (existieren bereits im
  Backend-Konzept, siehe `sidequest_master_plan.md`) werden on-chain
  nachvollziehbar.
- **Gemeingüter-Logik.** Ein Teil jeder Quest-Vergütung kann in einen
  Gemeinschaftspool fließen, der lokale Bedürfnisse finanziert (statt Profit für
  einen Plattformbetreiber).
- **Selbst-Finanzierung der Menschen.** Wer im Netzwerk Aufträge erfüllt, kann
  sich darüber Lebensbedarf „verdienen" — nicht über Lohnarbeit, sondern über
  direkten Tausch von Fähigkeiten und Zeit.

> ⚠️ Ehrliche Einordnung: „Kapitalismus abschaffen" ist ein politisches Ziel,
> das eine App allein nicht erreicht. Realistisch bauen wir eine **parallele
> Tausch-Ökonomie**, die innerhalb von Communities funktioniert und beweist,
> dass es ohne kapitalistische Mittelsmänner geht. Das ist die testbare,
> erreichbare Version der Vision.

## 3. Wie eine Quest on-chain abläuft (Konzept)

```
Auftraggeber                  Smart Contract (Escrow)            Erfüller
     │                                  │                            │
     │ 1. Quest erstellen + Einsatz ───►│ Credits/Stake gesperrt     │
     │                                  │◄─── 2. Quest annehmen ─────│
     │                                  │                            │
     │                                  │  3. Erfüllung vor Ort      │
     │                                  │     (GPS/Proof, off-chain) │
     │                                  │◄─── 4. Nachweis einreichen ┤
     │ 5. Bestätigen ──────────────────►│                            │
     │                                  │ 6. Credits freigeben ─────►│
     │                                  │ 7. Reputation + Pool-Anteil │
     │                                  │    on-chain verbucht        │
```

1. **Erstellen** — Auftraggeber legt eine Quest an und hinterlegt einen Einsatz
   (Credits, Tausch-Angebot oder Zeit-Zusage) im Escrow-Contract.
2. **Annehmen** — Erfüller verpflichtet sich; optional kleiner Stake gegen
   Missbrauch.
3. **Erfüllen** — Reale Welt: GPS-Verifizierung (existiert schon, Haversine
   100 m), Fotos, Peer-Bestätigung.
4. **Nachweis** — Proof wird referenziert (Hash on-chain, Daten off-chain).
5. **Freigabe** — Bei Bestätigung (oder nach Streit-Schlichtung) gibt der
   Contract die Vergütung frei.
6. **Verbuchung** — Reputation, Stunden, Pool-Anteil werden transparent
   eingetragen.

Streitfälle: Schlichtung über zufällig gewählte Community-Mitglieder
(Juror-Modell wie Kleros) oder gestaffelte Eskalation.

## 4. Technologie-Stack (Vorschlag)

Wir trennen bewusst, **was wirklich on-chain muss** (Werte, Eigentum, Konsens)
von dem, **was off-chain bleibt** (große Daten, Geo, Echtzeit). Blockchain ist
teuer und langsam — nur das Vertrauens-kritische gehört darauf.

### Blockchain-Layer

| Bereich | Empfehlung | Warum |
|---|---|---|
| Chain / L2 | **Polygon PoS** oder **Base** (Ethereum-L2) | niedrige Gas-Kosten, EVM-kompatibel, große Tooling-Basis; gut für viele Micro-Transaktionen |
| Alternative | **Gnosis Chain** | community-/Gemeingut-nah, stabile Tx-Kosten, xDAI |
| Smart Contracts | **Solidity** + **Foundry** (Tests) | Standard, viele Auditoren, unser Agent „Solidity Smart Contract Engineer" passt |
| Token-Standard | **ERC-20** (QuestCoin) + **ERC-721/1155** (Quest-/Badge-NFTs) | fungible Tausch-Einheit + nicht-fungible Quests & Achievements |
| Reputation | **Soulbound Tokens (SBT, ERC-5114)** | nicht handelbar → Reputation lässt sich nicht kaufen |
| Identität | **DID / Verifiable Credentials** (z. B. Ceramic, Veramo) | selbstsouveräne Identität ohne zentralen Account-Konzern |
| Wallet / UX | **Account Abstraction (ERC-4337)** + Social Login | Nutzer brauchen keine Seed-Phrase; gaslose Tx möglich (Paymaster) |
| Off-chain Daten | **IPFS / Arweave** | Quest-Beschreibungen, Bilder, Proofs dezentral; nur Hash on-chain |
| Orakel / Geo-Proof | **Chainlink Functions** oder eigener Verifier | bringt GPS-/Off-chain-Bestätigung kontrolliert on-chain |
| Schlichtung | **Kleros**-Modell oder eigener Juror-Contract | dezentrale Streitbeilegung ohne Plattform-Richter |

### Bestehender Stack (bleibt)

| Layer | Technologie (heute) | Rolle in der Vision |
|---|---|---|
| Frontend | React 19, Vite, MapLibre, Zustand | bleibt die UI; + Wallet-Integration (wagmi/viem) |
| Backend | NestJS 11, MongoDB, Socket.IO | bleibt für Geo-Queries, Echtzeit, Caching; wird **Indexer** für on-chain Events |
| Wallet-Lib | *neu:* **wagmi + viem** oder **ethers.js** | Contract-Calls aus dem Frontend |
| Indexing | *neu:* **The Graph** (Subgraph) | on-chain Events durchsuchbar machen, ohne jede Query auf die Chain |

### Empfohlene Architektur: Hybrid (on-chain + off-chain)

```
┌────────────── Frontend (React + wagmi/viem) ──────────────┐
│  Map · Quests · Wallet · Reputation                        │
└──────┬───────────────────────────────┬────────────────────┘
       │ REST/WS (wie heute)            │ Contract-Calls (RPC)
       ▼                                ▼
┌─────────────── Backend (NestJS) ───────────────┐   ┌──────────────────┐
│  Geo-Queries · Echtzeit · Indexer · Caching    │   │  Blockchain (L2) │
│  hört auf Chain-Events, spiegelt sie in Mongo  │◄──┤  Escrow · Token  │
└─────────────────────┬──────────────────────────┘   │  SBT · NFT       │
                      ▼                               └────────┬─────────┘
                ┌──────────┐                              ┌────▼────┐
                │ MongoDB  │                              │  IPFS   │
                │ (Cache/  │                              │ /Arweave│
                │  Index)  │                              │ (Proofs)│
                └──────────┘                              └─────────┘
```

**Warum hybrid und nicht „alles on-chain":** Geo-Suche, Live-Standorte und Chat
sind auf einer Blockchain unbezahlbar und zu langsam. Wir halten nur **Werte,
Eigentum und Konsens** (Vergütung, Quest-Besitz, Reputation) on-chain und nutzen
das bestehende NestJS-Backend als schnellen Index/Cache, der auf Chain-Events
lauscht.

## 5. Offene Fragen / Entscheidungen

1. **Welche Tausch-Einheit?** Reine Zeit-Credits (1 h = 1 Credit, sehr egalitär)
   vs. frei bewerteter QuestCoin (flexibler, aber näher am Markt)?
2. **Demurrage ja/nein?** Soll Horten aktiv bestraft werden (Gesell-Modell)?
3. **Wie viel muss wirklich on-chain?** MVP könnte mit reiner Reputation-SBT
   starten und Vergütung später dazunehmen.
4. **Rechtliches.** Token + Tausch berühren Steuer- und Finanzaufsichtsrecht
   (DE/EU, MiCA). Vor echtem Token-Launch juristisch klären.
5. **Onboarding.** Krypto-UX ist die größte Hürde — Account Abstraction +
   gaslose Tx sind fast Pflicht, sonst nutzt es niemand außerhalb der Krypto-Bubble.

## 6. Empfohlener nächster Schritt (MVP)

Klein anfangen, These früh testen:

1. **Reputation on-chain** als erstes Feature: geholfene Menschen / verifizierte
   Stunden als **Soulbound Token** auf einem günstigen L2 (Base/Polygon).
2. **Escrow-Prototyp** für genau eine Quest-Vergütung mit Test-Credits auf einem
   Testnet (Foundry).
3. Bestehendes Backend zum **Event-Indexer** ausbauen, Frontend um Wallet
   (wagmi/viem, Social Login) erweitern.
4. In einer einzelnen Community pilotieren und messen, ob echter Tausch ohne Geld
   funktioniert.

---

*Verwandte Docs: [`architecture.md`](architecture.md) ·
[`sidequest_master_plan.md`](sidequest_master_plan.md) ·
[`game-systems.md`](game-systems.md)*

# Vector Search — Quests als Embeddings in Qdrant

Jedes Quest-Dokument wird eingebettet und in Qdrant gespiegelt. Darauf laufen
drei Features:

| Feature | Endpoint |
|---|---|
| Semantische Suche | `GET /api/quests/search?q=…` |
| Ähnliche Quests | `GET /api/quests/:id/similar` |
| Duplikat-Erkennung | automatisch bei `POST /api/quests` |
| Index-Health | `GET /api/health/vector` |

---

## 1. Aufbau

```
Quest (Mongo)
   │  Text: title + description + address
   ▼
EmbeddingService ──► Replicate: multilingual-e5-large (1024 dim, normalisiert)
   │                     ▲
   │                     └── EmbeddingCache (Mongo, sha256 → Vektor als base64)
   ▼
QdrantService ──► Collection "quests", Cosine, Payload-Filter (geo/category/…)
```

**Der Cache ist der Grund, warum das billig bleibt.** SideQuests spawnen aus
einer Handvoll Templates, derselbe Wortlaut landet hunderte Male im Index. Der
Schlüssel ist `sha256(model + text)`, also kostet jede Formulierung genau einen
Replicate-Call — für immer. In der Praxis: 82 Quests → 41 tatsächliche
Embedding-Aufrufe.

## 2. Die „immer"-Garantie

Nicht „jede Schreibstelle ruft brav den Indexer" — sondern ein Reconciler:

- Ein Quest gilt als **dirty**, solange `vectorAt < updatedAt`. Mongoose setzt
  `updatedAt` bei jedem `save()`, also macht **jede** Änderung irgendwo im
  Code das Quest automatisch neu indexierbar. Auch eine, die es morgen gibt.
- Alle 30 s (`VECTOR_RECONCILE_INTERVAL_MS`) werden bis zu 50 dirty Quests
  eingebettet und geupsertet.
- Schreibpfade rufen zusätzlich `indexNow()` — das ist reine **Latenz**-
  Optimierung. Vergisst jemand den Aufruf, ist das Quest 30 s später trotzdem
  drin.
- Schlägt das Embedding fehl, bleibt das Quest dirty und wird erneut versucht.
  Es landet nie mit einem kaputten Vektor im Index.

### Sweep: der Zwei-Wege-Abgleich

`vectorAt` ist nur Mongos *Behauptung* über Qdrant. Alle 15 Minuten (jeder
30. Tick) werden die echten ID-Mengen verglichen:

- **Punkt ohne Quest** → löschen (despawnte SideQuests).
- **Quest ohne Punkt** → `vectorAt = null`, wird neu indexiert.

Die zweite Richtung ist der Grund, warum ein verlorener Index sich selbst
repariert: Snapshot zurückgespielt, Collection manuell gelöscht, Volume
weg — der Index füllt sich ohne Zutun wieder auf. Getestet: Collection im
laufenden Betrieb gelöscht → nach dem nächsten Tick 82/82 wieder drin.

**Schutzschalter:** Sollen mehr als 50 % der Punkte gelöscht werden (ab 25
Punkten aufwärts), bricht der Sweep ab und loggt einen Fehler. Das ist der
Fall „falsche DB / geteilte Collection" — dann soll er schreien, nicht den
Index leeren.

### INDEX_VERSION

`updatedAt` sieht keine Code-Änderung. Ändert sich also, *was* eingebettet
wird (`buildText`) oder was im Payload landet (`payloadFor`), liegen die alten
Vektoren still weiter im Index — nach alten Regeln gebaut, für immer.

Deshalb trägt `vectorHash` ein Präfix: `2:a3f9…`. Der Sweep stellt alles neu
in die Queue, dessen Version nicht mehr passt. **Beim Ändern von `buildText`
oder `payloadFor` also `INDEX_VERSION` hochzählen** — den Rest macht der
Reconciler. Live verifiziert: v1 → v2 hat 82 Quests ohne einen Handgriff neu
eingebettet, das Ranking kippte danach auf das richtige Ergebnis.

> ⚠️ **Eine Collection pro Deployment.** Zwei Backends auf derselben Mongo,
> aber unterschiedlichen `QDRANT_COLLECTION`, markieren sich gegenseitig als
> „fertig" (`vectorAt` ist ein globales Feld). Für lokale Lanes deshalb
> `QDRANT_COLLECTION=quests_<lane>` setzen.

## 3. Was eingebettet wird

`title + description + address` — mehr nicht.

Die Kategorie steht bewusst **nicht** drin. Eine Zeile wie `Kategorie: sport`
ist über alle Quests hinweg fast identischer Boilerplate und hat das Ranking
messbar verflacht: mit ihr rankte „ich will mich richtig auspowern" das Quest
*Erkunde die Karte* über *Mach 10 Kniebeugen!*, ohne sie gewinnen die
Kniebeugen. Kategorie ist ein Payload-Filter, keine Bedeutung.

E5 braucht Präfixe: Dokumente werden als `passage: …`, Suchanfragen als
`query: …` eingebettet. Ohne das sinkt die Trefferqualität deutlich.

### Score-Erwartung

E5-Scores sind gestaucht. Grobe Orientierung auf echten Daten:

| Score | Bedeutung |
|---|---|
| ~0.80 | unverwandt (Grundrauschen) |
| 0.85 | thematisch verwandt |
| 0.89 | dasselbe Thema, anderes Quest |
| > 0.95 | dasselbe Quest, andere Worte |

Deshalb ist die Duplikat-Schwelle **0.93** und nicht 0.80.

## 4. Endpoints

### `GET /api/quests/search`

| Param | Bedeutung |
|---|---|
| `q` | Freitext (2–400 Zeichen), Pflicht |
| `lat`, `lng`, `radius` | Geo-Vorfilter in km (Qdrant `geo_radius`) |
| `categories`, `types` | kommasepariert |
| `limit` | 1–50, default 20 |
| `minScore` | Cosine-Schwelle, 0–1 |
| `includeSideQuests`, `includeCompleted` | default `false` |

Antwort: `{ mode: "semantic" | "text", query, results: [...Quest, score] }`.

`mode: "text"` heißt: Qdrant oder Replicate war nicht erreichbar, die Antwort
kommt aus einem Substring-Match. Der Endpoint fällt nie hart aus.

### `POST /api/quests` — Duplikat-Erkennung

Vor dem Anlegen wird im Umkreis von **300 m** nach einem Quest mit Cosine
**≥ 0.93** gesucht. Treffer → `409` mit `similarity` und dem `duplicate`-Quest.
Der Client zeigt das an; `"force": true` legt trotzdem an.

Der Check hat **4 s Timeout**. Ein kalter Replicate-Container darf niemanden
am Posten hindern — läuft er in den Timeout, wird ohne Prüfung angelegt.
Auto-gespawnte SideQuests werden nicht geprüft (die sind absichtlich
repetitiv).

Verifiziert:

| Fall | Ergebnis |
|---|---|
| Original anlegen | 201 |
| Umformuliert, 40 m entfernt | **409**, similarity 0.97 |
| Dasselbe mit `force: true` | 201 |
| Gleicher Text, 6 km entfernt | 201 (Geo-Filter greift) |
| Anderes Thema, gleicher Ort | 201 |

## 5. Betrieb

`GET /api/health/vector`:

```json
{ "enabled": true, "ready": true, "collection": "quests", "dims": 1024,
  "indexedPoints": 82, "pendingQuests": 0, "quests": 82 }
```

`pendingQuests` fällt nach einem Deploy auf 0 → Backfill fertig.
`indexedPoints` ≈ `quests` → Index vollständig.

**Ohne `REPLICATE_API_TOKEN` oder `QDRANT_URL`** startet alles normal, nur ohne
Vektoren: Suche fällt auf Substring zurück, `similar` gibt `[]`, die
Duplikat-Prüfung entfällt. Kein Feature blockiert.

**Modellwechsel:** `REPLICATE_EMBED_MODEL` + `EMBEDDING_DIMS` ändern **und**
`QDRANT_COLLECTION` auf einen neuen Namen zeigen lassen — Vektoren
unterschiedlicher Länge passen nicht in eine Collection. Der alte Cache wird
automatisch ignoriert, weil das Modell Teil des Cache-Keys ist.

## 6. Deployment

- **Lokal:** `docker compose up qdrant` → Dashboard auf
  <http://localhost:6343/dashboard>. Port 6343 statt 6333, weil auf der
  Dev-Maschine schon andere Qdrants laufen.
- **Coolify:** `docker-compose.coolify.yml`. Qdrant hängt ohne öffentliche
  Domain im internen Netz, der API-Key kommt aus `SERVICE_PASSWORD_QDRANT`,
  Storage und Snapshots liegen auf benannten Volumes.

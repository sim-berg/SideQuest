# Beispiel-Smart-Contracts (Solidity)

Prototyp-/Lern-Contracts zur SideQuest-Web3-Vision. Erklärung der Konzepte:
[`../web3-speicher-tangle-und-methoden.md`](../web3-speicher-tangle-und-methoden.md).

> ⚠️ **Nicht auditiert.** Lern- und Prototyp-Code. Vor jedem echten Einsatz mit Wert
> auditieren und auf einem Testnet (Base Sepolia / Polygon Amoy) erproben.

## Dateien

| Datei | Zweck |
|---|---|
| [`QuestCoin.sol`](./QuestCoin.sol) | ERC-20 „QUEST" Tausch-Einheit, Rollen-Mint, optionale Demurrage |
| [`ReputationSBT.sol`](./ReputationSBT.sol) | Soulbound Reputation/XP-Profil (nicht übertragbar) |
| [`AchievementNFT.sol`](./AchievementNFT.sol) | ERC-721 Badges, Metadaten als IPFS-CID (Mesh) |
| [`QuestEscrow.sol`](./QuestEscrow.sol) | **Kern**: Quest-Lifecycle + Treuhand, bindet die anderen ein |

## Abhängigkeiten

- Solidity `^0.8.24`
- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts) v5.x

## Build & Test (Foundry)

```bash
curl -L https://foundry.paradigm.xyz | bash && foundryup
forge init sidequest-contracts && cd sidequest-contracts
forge install OpenZeppelin/openzeppelin-contracts
# .sol-Dateien nach src/ kopieren:
cp ../*.sol src/
forge build
forge test
```

Deploy-Reihenfolge: `QuestCoin` → `ReputationSBT` → `AchievementNFT` → `QuestEscrow`
(Escrow bekommt im Constructor die Adressen von Token + Reputation). Danach dem
`QuestEscrow` die `SCORER_ROLE` auf der `ReputationSBT` und die `MINTER_ROLE` auf
`QuestCoin` geben, damit es Reputation verbuchen und (falls gewünscht) Credits prägen kann.

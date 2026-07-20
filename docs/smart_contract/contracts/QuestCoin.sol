// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title QuestCoin (QUEST)
 * @notice Fungible Tausch-Einheit der SideQuest-Ökonomie.
 *         "Beitrag ist die Währung" — Coins zirkulieren statt sich anzuhäufen.
 *
 * @dev Lern-/Prototyp-Code. Vor Mainnet auditieren.
 *      Demonstriert:
 *        - ERC-20 Standard (OpenZeppelin)
 *        - Rollen-basiertes Minting (nur Escrow/Backend darf prägen)
 *        - OPTIONALE Demurrage-Idee ("rostendes Geld" nach Silvio Gesell):
 *          ein kleiner Anteil verfällt über Zeit, damit Horten sich nicht lohnt.
 *
 *      Die Demurrage hier ist bewusst SIMPEL (claim-basiert) gehalten, um das
 *      Prinzip zu zeigen. Eine produktive Variante würde Guthaben "rebasen"
 *      oder einen Index pro Konto führen — das ist deutlich aufwendiger.
 */
contract QuestCoin is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Demurrage-Rate in Basispunkten pro 30 Tage (z. B. 100 = 1 %). 0 = aus.
    uint16 public demurrageBpsPer30Days;

    /// @notice Adresse, an die verfallene Demurrage fließt (z. B. Gemeinschaftspool).
    address public communityPool;

    /// @dev Letzter Zeitpunkt, zu dem für ein Konto Demurrage abgerechnet wurde.
    mapping(address => uint256) public lastDemurrageAt;

    event DemurrageApplied(address indexed account, uint256 amountBurnedToPool);
    event DemurrageConfigured(uint16 bpsPer30Days, address communityPool);

    constructor(address admin, address communityPool_)
        ERC20("QuestCoin", "QUEST")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        communityPool = communityPool_;
        demurrageBpsPer30Days = 0; // Default: aus. Bewusst per Governance einschaltbar.
    }

    // --------------------------------------------------------------------- //
    //  Minting — nur autorisierte Rollen (Escrow-Contract, Backend-Relayer)
    // --------------------------------------------------------------------- //

    /// @notice Prägt neue QUEST (z. B. Zeit-Credits für geleistete Stunden).
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // --------------------------------------------------------------------- //
    //  Demurrage (optional)
    // --------------------------------------------------------------------- //

    function configureDemurrage(uint16 bpsPer30Days, address communityPool_)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(bpsPer30Days <= 5000, "rate too high"); // Sicherheits-Cap: max 50 %/30d
        require(communityPool_ != address(0), "pool=0");
        demurrageBpsPer30Days = bpsPer30Days;
        communityPool = communityPool_;
        emit DemurrageConfigured(bpsPer30Days, communityPool_);
    }

    /**
     * @notice Berechnet die seit der letzten Abrechnung aufgelaufene Demurrage.
     * @dev Linear nach Zeit; rein illustrativ.
     */
    function pendingDemurrage(address account) public view returns (uint256) {
        if (demurrageBpsPer30Days == 0) return 0;
        uint256 last = lastDemurrageAt[account];
        if (last == 0) return 0; // erstes Mal: ab jetzt zählen
        uint256 elapsed = block.timestamp - last;
        uint256 bal = balanceOf(account);
        // amount = bal * rate * elapsed / (30 Tage * 10_000 bps)
        return (bal * demurrageBpsPer30Days * elapsed) / (30 days * 10_000);
    }

    /// @notice Wendet aufgelaufene Demurrage an: verschiebt Anteil in den Pool.
    function applyDemurrage(address account) public {
        uint256 due = pendingDemurrage(account);
        lastDemurrageAt[account] = block.timestamp;
        if (due > 0) {
            _transfer(account, communityPool, due);
            emit DemurrageApplied(account, due);
        }
    }

    /// @dev Bei jeder Bewegung Demurrage beider Seiten abrechnen + Zeitstempel setzen.
    function _update(address from, address to, uint256 value)
        internal
        override
    {
        if (demurrageBpsPer30Days != 0) {
            if (from != address(0) && from != communityPool) _settle(from);
            if (to != address(0) && to != communityPool) _settle(to);
        }
        super._update(from, to, value);
        if (from != address(0)) lastDemurrageAt[from] = block.timestamp;
        if (to != address(0)) lastDemurrageAt[to] = block.timestamp;
    }

    function _settle(address account) private {
        uint256 due = pendingDemurrage(account);
        if (due > 0) {
            super._update(account, communityPool, due);
            emit DemurrageApplied(account, due);
        }
        lastDemurrageAt[account] = block.timestamp;
    }
}

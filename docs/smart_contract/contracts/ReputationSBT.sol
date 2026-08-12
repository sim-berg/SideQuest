// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ReputationSBT
 * @notice Soulbound Token (SBT) für SideQuest-Reputation.
 *         "Beitrag ist die Währung" — Reputation darf NICHT handelbar sein,
 *         sonst könnte man sie kaufen. Deshalb: nicht übertragbar.
 *
 * @dev Lern-/Prototyp-Code. Demonstriert:
 *        - Soulbound: jede Übertragung (außer mint/burn) wird geblockt
 *        - Genau EIN Reputations-Token pro Adresse (das "Profil")
 *        - On-chain Reputations-Kennzahlen (XP, abgeschlossene Quests,
 *          geholfene Menschen) — fälschungssicher und öffentlich prüfbar
 *
 *      Diese Kennzahlen spiegeln die Felder aus data-models.md (level,
 *      questsCompleted) auf die Chain. Aktualisiert wird nur durch autorisierte
 *      Rollen (Escrow-Contract nach verifiziertem Quest-Abschluss).
 */
contract ReputationSBT is ERC721, AccessControl {
    bytes32 public constant SCORER_ROLE = keccak256("SCORER_ROLE");

    struct Reputation {
        uint64 xp; // gesammelte Erfahrungspunkte
        uint32 questsCompleted; // abgeschlossene Quests
        uint32 peopleHelped; // geholfene Menschen
        uint32 volunteerMinutes; // verifizierte ehrenamtliche Minuten
        uint16 level; // abgeleitetes Level
    }

    uint256 private _nextId = 1;

    /// @notice tokenId je Adresse (0 = noch kein Profil).
    mapping(address => uint256) public profileOf;
    /// @notice Reputations-Daten je tokenId.
    mapping(uint256 => Reputation) public reputation;

    event ProfileMinted(address indexed account, uint256 indexed tokenId);
    event ReputationUpdated(
        address indexed account,
        uint64 xp,
        uint32 questsCompleted,
        uint16 level
    );

    constructor(address admin) ERC721("SideQuest Reputation", "SQ-REP") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SCORER_ROLE, admin);
    }

    // --------------------------------------------------------------------- //
    //  Profil anlegen
    // --------------------------------------------------------------------- //

    /// @notice Legt das (einmalige) Reputations-Profil für eine Adresse an.
    function mintProfile(address account)
        external
        onlyRole(SCORER_ROLE)
        returns (uint256 tokenId)
    {
        require(profileOf[account] == 0, "profile exists");
        tokenId = _nextId++;
        profileOf[account] = tokenId;
        _safeMint(account, tokenId);
        emit ProfileMinted(account, tokenId);
    }

    // --------------------------------------------------------------------- //
    //  Reputation aktualisieren (nur nach verifiziertem Abschluss)
    // --------------------------------------------------------------------- //

    /// @notice Schreibt Belohnung nach einem bestätigten Quest-Abschluss gut.
    function award(
        address account,
        uint64 xpDelta,
        uint32 peopleHelpedDelta,
        uint32 volunteerMinutesDelta
    ) external onlyRole(SCORER_ROLE) {
        uint256 tokenId = profileOf[account];
        require(tokenId != 0, "no profile");

        Reputation storage r = reputation[tokenId];
        r.xp += xpDelta;
        r.questsCompleted += 1;
        r.peopleHelped += peopleHelpedDelta;
        r.volunteerMinutes += volunteerMinutesDelta;
        r.level = _levelForXp(r.xp);

        emit ReputationUpdated(account, r.xp, r.questsCompleted, r.level);
    }

    /// @dev Einfache XP→Level-Kurve (illustrativ): Level = floor(sqrt(xp/100)) + 1.
    function _levelForXp(uint64 xp) private pure returns (uint16) {
        uint256 n = xp / 100;
        uint256 x = n;
        if (x == 0) return 1;
        // ganzzahlige Wurzel (Babylonian)
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return uint16(y + 1);
    }

    // --------------------------------------------------------------------- //
    //  Soulbound: jede Übertragung verbieten
    // --------------------------------------------------------------------- //

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        // Erlaubt sind nur mint (from==0) und burn (to==0). Alles andere blockt.
        require(from == address(0) || to == address(0), "soulbound: non-transferable");
        return super._update(to, tokenId, auth);
    }

    // --------------------------------------------------------------------- //
    //  Interface-Support (ERC721 + AccessControl)
    // --------------------------------------------------------------------- //

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

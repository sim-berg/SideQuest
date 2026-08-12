// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AchievementNFT
 * @notice Handelbare/sammelbare Achievement-Badges (z. B. "Alle Berliner Burgen
 *         besucht"). Im Gegensatz zur Reputation-SBT sind das echte NFTs.
 *
 * @dev Lern-/Prototyp-Code. Demonstriert das WICHTIGSTE Speicher-Muster:
 *        - Die NFT-Metadaten (Name, Bild, Beschreibung) liegen NICHT on-chain,
 *          sondern im MESH (IPFS/Arweave). On-chain steht nur die CID.
 *        - tokenURI() baut daraus eine ipfs://-URI.
 *      So bleiben Bilder beliebig groß, ohne teuren On-chain-Speicher.
 */
contract AchievementNFT is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 private _nextId = 1;

    /// @notice IPFS-/Arweave-CID der Metadaten je tokenId (Hash, ~32+ Bytes).
    mapping(uint256 => string) private _metadataCid;

    /// @notice Optionaler Achievement-Typ-Code (z. B. Kampagnen-ID) je tokenId.
    mapping(uint256 => bytes32) public achievementType;

    event AchievementMinted(
        address indexed to,
        uint256 indexed tokenId,
        bytes32 indexed achievementType,
        string metadataCid
    );

    constructor(address admin) ERC721("SideQuest Achievements", "SQ-ACH") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    /**
     * @notice Mintet ein Achievement-Badge.
     * @param to            Empfänger
     * @param type_         Achievement-Typ (z. B. keccak256("berlin-castles"))
     * @param metadataCid   IPFS-CID der Metadaten-JSON (Mesh-Speicher)
     */
    function mint(address to, bytes32 type_, string calldata metadataCid)
        external
        onlyRole(MINTER_ROLE)
        returns (uint256 tokenId)
    {
        tokenId = _nextId++;
        _metadataCid[tokenId] = metadataCid;
        achievementType[tokenId] = type_;
        _safeMint(to, tokenId);
        emit AchievementMinted(to, tokenId, type_, metadataCid);
    }

    /// @notice Baut die Metadaten-URI aus der im Mesh liegenden CID.
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireOwned(tokenId);
        return string.concat("ipfs://", _metadataCid[tokenId]);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

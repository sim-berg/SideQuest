// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @dev Minimal-Interface zur Reputation-SBT (siehe ReputationSBT.sol).
interface IReputation {
    function award(
        address account,
        uint64 xpDelta,
        uint32 peopleHelpedDelta,
        uint32 volunteerMinutesDelta
    ) external;
    function profileOf(address account) external view returns (uint256);
    function mintProfile(address account) external returns (uint256);
}

/**
 * @title QuestEscrow
 * @notice Kern der on-chain SideQuest-Ökonomie: bildet den Quest-Lifecycle ab und
 *         hält die Vergütung treuhänderisch (Escrow), bis der Abschluss bestätigt
 *         ist. Ersetzt die Plattform als Mittelsmann durch Code.
 *
 *         Lifecycle (vgl. blockchain-vision.md §3 und data-models.md):
 *           erstellen → annehmen → erfüllen (off-chain Proof) → bestätigen → claimen
 *
 * @dev Lern-/Prototyp-Code. Vor Mainnet auditieren. Demonstriert die Methoden aus
 *      web3-speicher-tangle-und-methoden.md §6:
 *        - HASH-ON-CHAIN: Quest-Inhalt (Titel/Text/Bild) liegt im Mesh (IPFS),
 *          on-chain steht nur die CID + ein optionaler Geo-Hash.
 *        - EVENTS statt State für alles "nur protokollieren" → Indexer/Backend.
 *        - STRUCT-PACKING: kompakte Quest-Struktur.
 *        - REENTRANCYGUARD + CHECKS-EFFECTS-INTERACTIONS + PULL-PATTERN.
 *        - ORACLE-HOOK: Proof of Presence (GPS/Zeit) kommt signiert vom Oracle.
 *        - REPLAY-/DOUBLE-CLAIM-SCHUTZ über den Quest-Status.
 */
contract QuestEscrow is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // Enums spiegeln data-models.md
    enum Status {
        None,
        Open,
        Accepted,
        ProofSubmitted,
        Completed,
        Cancelled,
        Expired
    }
    enum Category {
        Sport,
        Social,
        Adventure,
        Skill,
        Mystery
    }
    enum Difficulty {
        Easy,
        Medium,
        Hard
    }

    /**
     * @dev Kompakte, gepackte Quest. Große/Klartext-Daten bewusst NICHT hier,
     *      sondern off-chain im Mesh — referenziert über contentCid.
     */
    struct Quest {
        address creator; // 20 Bytes  ┐ Slot 1
        uint96 reward; //  12 Bytes  ┘ (QUEST-Token-Betrag, reicht für realistische Beträge)
        address worker; // 20 Bytes  ┐ Slot 2
        uint64 expiresAt; //  8 Bytes  │
        uint32 xpReward; //  4 Bytes  ┘
        Status status; //   1 Byte   ┐ Slot 3 (packt mit den nächsten)
        Category category; // 1 Byte   │
        Difficulty difficulty; // 1 Byte   ┘
        bytes32 contentCid; // IPFS-CID der Quest-Inhalte (Titel/Text/Bild)  Slot 4
        bytes32 geoCommit; // Hash von (lat,lng,radius,salt) — Standort verdeckt  Slot 5
    }

    IERC20 public immutable token; // QuestCoin
    IReputation public immutable reputation; // ReputationSBT

    uint256 public nextQuestId = 1;
    mapping(uint256 => Quest) public quests;

    /// @notice Pull-Pattern: ausstehende, abholbare Guthaben je Adresse.
    mapping(address => uint256) public withdrawable;

    /// @notice Anteil (in Basispunkten), der bei Abschluss in den Gemeinschaftspool geht.
    uint16 public communityFeeBps; // z. B. 250 = 2,5 %
    address public communityPool;

    // ---- Events (günstig; der Indexer/NestJS-Backend hört darauf) ---- //
    event QuestCreated(
        uint256 indexed questId,
        address indexed creator,
        uint96 reward,
        Category category,
        Difficulty difficulty,
        uint64 expiresAt,
        bytes32 contentCid,
        bytes32 geoCommit
    );
    event QuestAccepted(uint256 indexed questId, address indexed worker);
    event ProofSubmitted(uint256 indexed questId, address indexed worker, bytes32 proofCid);
    event QuestCompleted(uint256 indexed questId, address indexed worker, uint96 payout, uint96 fee);
    event QuestCancelled(uint256 indexed questId);
    event Withdrawn(address indexed account, uint256 amount);

    constructor(
        address admin,
        IERC20 token_,
        IReputation reputation_,
        address communityPool_,
        uint16 communityFeeBps_
    ) {
        require(communityFeeBps_ <= 2000, "fee too high"); // Cap 20 %
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        token = token_;
        reputation = reputation_;
        communityPool = communityPool_;
        communityFeeBps = communityFeeBps_;
    }

    // --------------------------------------------------------------------- //
    //  1. Erstellen — Auftraggeber sperrt die Vergütung im Escrow
    // --------------------------------------------------------------------- //

    /**
     * @param reward       QUEST-Betrag, der hinterlegt wird (Approve vorher nötig)
     * @param xpReward     XP, die der Erfüller bei Abschluss erhält
     * @param category     siehe data-models.md
     * @param difficulty   siehe data-models.md
     * @param duration     Sekunden bis Ablauf (timeLimit)
     * @param contentCid   IPFS-CID: Titel, Beschreibung, Bild liegen im Mesh
     * @param geoCommit    keccak256(abi.encode(lat, lng, radius, salt)) — verdeckt
     *                     den genauen Standort on-chain (Datenschutz), Oracle kennt salt
     */
    function createQuest(
        uint96 reward,
        uint32 xpReward,
        Category category,
        Difficulty difficulty,
        uint64 duration,
        bytes32 contentCid,
        bytes32 geoCommit
    ) external nonReentrant returns (uint256 questId) {
        require(reward > 0, "reward=0");
        require(duration > 0 && duration <= 365 days, "bad duration");

        // Effects
        questId = nextQuestId++;
        quests[questId] = Quest({
            creator: msg.sender,
            reward: reward,
            worker: address(0),
            expiresAt: uint64(block.timestamp) + duration,
            xpReward: xpReward,
            status: Status.Open,
            category: category,
            difficulty: difficulty,
            contentCid: contentCid,
            geoCommit: geoCommit
        });

        // Interaction (Escrow einziehen) — nach den Effects
        token.safeTransferFrom(msg.sender, address(this), reward);

        emit QuestCreated(
            questId, msg.sender, reward, category, difficulty,
            quests[questId].expiresAt, contentCid, geoCommit
        );
    }

    // --------------------------------------------------------------------- //
    //  2. Annehmen — ein Erfüller reserviert die Quest exklusiv
    // --------------------------------------------------------------------- //

    function acceptQuest(uint256 questId) external {
        Quest storage q = quests[questId];
        require(q.status == Status.Open, "not open");
        require(block.timestamp < q.expiresAt, "expired");
        require(msg.sender != q.creator, "creator!=worker");

        q.worker = msg.sender;
        q.status = Status.Accepted;
        emit QuestAccepted(questId, msg.sender);
    }

    // --------------------------------------------------------------------- //
    //  3./4. Nachweis einreichen — nur Referenz (CID) on-chain, Daten im Mesh
    // --------------------------------------------------------------------- //

    function submitProof(uint256 questId, bytes32 proofCid) external {
        Quest storage q = quests[questId];
        require(q.status == Status.Accepted, "not accepted");
        require(msg.sender == q.worker, "not worker");
        q.status = Status.ProofSubmitted;
        emit ProofSubmitted(questId, msg.sender, proofCid);
    }

    // --------------------------------------------------------------------- //
    //  5. Bestätigen & freigeben
    //     Variante A: Auftraggeber bestätigt manuell.
    //     Variante B: Oracle bestätigt Proof of Presence (GPS/Zeit) automatisch.
    // --------------------------------------------------------------------- //

    /// @notice Manuelle Bestätigung durch den Auftraggeber.
    function confirmByCreator(uint256 questId) external nonReentrant {
        Quest storage q = quests[questId];
        require(msg.sender == q.creator, "not creator");
        require(
            q.status == Status.ProofSubmitted || q.status == Status.Accepted,
            "bad state"
        );
        _settleCompletion(questId, q, 0, 0);
    }

    /**
     * @notice Automatische Bestätigung durch das Oracle-Netzwerk (Anti-Cheat).
     *         Das Oracle prüft off-chain GPS/Zeit/Distanz (Proof of Presence) und
     *         bestätigt erst, wenn der Geo-Commit aufgeht (kennt lat,lng,radius,salt).
     * @param peopleHelped         vom Nachweis bestätigte geholfene Menschen
     * @param volunteerMinutes     verifizierte Minuten vor Ort
     */
    function confirmByOracle(
        uint256 questId,
        uint32 peopleHelped,
        uint32 volunteerMinutes
    ) external onlyRole(ORACLE_ROLE) nonReentrant {
        Quest storage q = quests[questId];
        require(q.status == Status.ProofSubmitted, "no proof");
        _settleCompletion(questId, q, peopleHelped, volunteerMinutes);
    }

    /// @dev Gemeinsame Abschlusslogik: Status setzen, Pool-Anteil, Pull-Gutschrift, Reputation.
    function _settleCompletion(
        uint256 questId,
        Quest storage q,
        uint32 peopleHelped,
        uint32 volunteerMinutes
    ) private {
        require(q.worker != address(0), "no worker");

        // Effects zuerst (Double-Claim-/Replay-Schutz: Status → Completed)
        q.status = Status.Completed;

        uint96 fee = uint96((uint256(q.reward) * communityFeeBps) / 10_000);
        uint96 payout = q.reward - fee;

        // Pull-Pattern statt Push: Empfänger holt sich das Guthaben selbst ab.
        withdrawable[q.worker] += payout;
        if (fee > 0) withdrawable[communityPool] += fee;

        // Reputation verbuchen (Profil bei Bedarf anlegen).
        if (reputation.profileOf(q.worker) == 0) {
            reputation.mintProfile(q.worker);
        }
        reputation.award(q.worker, uint64(q.xpReward), peopleHelped, volunteerMinutes);

        emit QuestCompleted(questId, q.worker, payout, fee);
    }

    // --------------------------------------------------------------------- //
    //  Abbruch / Ablauf — Rückerstattung an den Auftraggeber
    // --------------------------------------------------------------------- //

    function cancelOrExpire(uint256 questId) external nonReentrant {
        Quest storage q = quests[questId];
        bool isOpen = q.status == Status.Open;
        bool isStaleAccept = q.status == Status.Accepted && block.timestamp >= q.expiresAt;
        require(isOpen || isStaleAccept, "not cancellable");
        require(
            msg.sender == q.creator || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "not allowed"
        );

        q.status = isOpen ? Status.Cancelled : Status.Expired;
        withdrawable[q.creator] += q.reward; // Rückerstattung via Pull
        emit QuestCancelled(questId);
    }

    // --------------------------------------------------------------------- //
    //  Pull-Auszahlung (sicher gegen Re-Entrancy)
    // --------------------------------------------------------------------- //

    function withdraw() external nonReentrant {
        uint256 amount = withdrawable[msg.sender];
        require(amount > 0, "nothing to withdraw");
        withdrawable[msg.sender] = 0; // Effects vor Interaction
        token.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    // --------------------------------------------------------------------- //
    //  Admin
    // --------------------------------------------------------------------- //

    function setCommunityFee(uint16 bps, address pool)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(bps <= 2000, "fee too high");
        require(pool != address(0), "pool=0");
        communityFeeBps = bps;
        communityPool = pool;
    }
}

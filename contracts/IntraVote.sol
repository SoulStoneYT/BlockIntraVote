// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IntraVote - Decentralized Inter-College Voting Smart Contract
 * @author Computer Science & Design - 7th Semester Blockchain Project
 * @notice Provides tamper-proof, transparent, and verifiable ballot casting on Ethereum EVM.
 * @dev Enforces single-vote-per-position rules and cryptographic anonymity using keccak256 voter hashes.
 */
contract IntraVote {
    // --- Data Types ---
    enum ElectionStatus {
        NotStarted,
        Active,
        Paused,
        Ended
    }

    struct Candidate {
        string id;
        string name;
        string positionId;
        uint256 voteCount;
        bool exists;
    }

    struct VoteRecord {
        bytes32 voterHash;
        string positionId;
        string candidateId;
        uint256 timestamp;
        uint256 blockNumber;
    }

    // --- State Variables ---
    address public admin;
    ElectionStatus public electionStatus;

    // voterHash => (positionId => hasVoted)
    mapping(bytes32 => mapping(string => bool)) private _hasVoted;

    // candidateId => Candidate
    mapping(string => Candidate) public candidates;
    string[] public registeredCandidateIds;

    // candidateId => total votes received
    mapping(string => uint256) public candidateVotes;

    // Chronological on-chain ledger of all cast votes
    VoteRecord[] public voteRecords;

    // --- Events ---
    event VoteCast(
        bytes32 indexed voterHash,
        string indexed positionId,
        string candidateId,
        uint256 timestamp,
        uint256 blockNumber
    );

    event CandidateRegistered(
        string indexed candidateId,
        string name,
        string indexed positionId
    );

    event ElectionStatusChanged(
        ElectionStatus oldStatus,
        ElectionStatus newStatus
    );

    event ElectionReset(uint256 timestamp);

    // --- Modifiers ---
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only contract admin can execute this");
        _;
    }

    modifier electionIsActive() {
        require(electionStatus == ElectionStatus.Active, "Election is not currently active");
        _;
    }

    // --- Constructor ---
    constructor() {
        admin = msg.sender;
        electionStatus = ElectionStatus.Active;
        emit ElectionStatusChanged(ElectionStatus.NotStarted, ElectionStatus.Active);
    }

    // --- Candidate Management ---
    /**
     * @notice Registers or synchronizes a candidate on the blockchain ledger
     */
    function registerCandidate(
        string memory _id,
        string memory _name,
        string memory _positionId
    ) public {
        require(bytes(_id).length > 0, "Candidate ID cannot be empty");
        
        if (!candidates[_id].exists) {
            registeredCandidateIds.push(_id);
        }

        candidates[_id] = Candidate({
            id: _id,
            name: _name,
            positionId: _positionId,
            voteCount: candidateVotes[_id],
            exists: true
        });

        emit CandidateRegistered(_id, _name, _positionId);
    }

    // --- Core Voting Logic ---
    /**
     * @notice Casts an immutable ballot for a candidate in a specific position
     * @param _positionId The position being voted for
     * @param _candidateId The chosen candidate's unique identifier
     * @param _voterHash Keccak256 hash of the student's authenticated UID
     */
    function castVote(
        string memory _positionId,
        string memory _candidateId,
        bytes32 _voterHash
    ) external electionIsActive {
        require(_voterHash != bytes32(0), "Invalid voter cryptographic hash");
        require(bytes(_positionId).length > 0, "Position ID cannot be empty");
        require(bytes(_candidateId).length > 0, "Candidate ID cannot be empty");

        // Cryptographically guard against double voting
        require(
            !_hasVoted[_voterHash][_positionId],
            "EVM Guard: Student has already cast a ballot for this position"
        );

        // Record vote
        _hasVoted[_voterHash][_positionId] = true;
        candidateVotes[_candidateId] += 1;
        candidates[_candidateId].voteCount += 1;

        // Append to immutable public ledger
        voteRecords.push(
            VoteRecord({
                voterHash: _voterHash,
                positionId: _positionId,
                candidateId: _candidateId,
                timestamp: block.timestamp,
                blockNumber: block.number
            })
        );

        emit VoteCast(
            _voterHash,
            _positionId,
            _candidateId,
            block.timestamp,
            block.number
        );
    }

    // --- Verification & Read Queries ---
    /**
     * @notice Checks if a voter's anonymous hash has already voted for a position
     */
    function hasVoterVoted(
        bytes32 _voterHash,
        string memory _positionId
    ) external view returns (bool) {
        return _hasVoted[_voterHash][_positionId];
    }

    /**
     * @notice Returns current vote count for a candidate
     */
    function getCandidateVotes(
        string memory _candidateId
    ) external view returns (uint256) {
        return candidateVotes[_candidateId];
    }

    /**
     * @notice Total number of votes recorded across all positions
     */
    function getTotalVotes() external view returns (uint256) {
        return voteRecords.length;
    }

    /**
     * @notice Retrieves the total number of registered candidates
     */
    function getCandidateCount() external view returns (uint256) {
        return registeredCandidateIds.length;
    }

    /**
     * @notice Fetches the latest N vote records for the live blockchain audit page
     */
    function getRecentVotes(
        uint256 _limit
    ) external view returns (VoteRecord[] memory) {
        uint256 total = voteRecords.length;
        if (total == 0) {
            return new VoteRecord[](0);
        }

        uint256 count = _limit > total ? total : _limit;
        VoteRecord[] memory recent = new VoteRecord[](count);

        for (uint256 i = 0; i < count; i++) {
            recent[i] = voteRecords[total - 1 - i];
        }

        return recent;
    }

    // --- Election Lifecycle Controls ---
    function setElectionStatus(ElectionStatus _status) external onlyAdmin {
        ElectionStatus oldStatus = electionStatus;
        electionStatus = _status;
        emit ElectionStatusChanged(oldStatus, _status);
    }

    /**
     * @notice Emergency reset of blockchain test records for re-testing
     */
    function resetElection() external onlyAdmin {
        for (uint256 i = 0; i < registeredCandidateIds.length; i++) {
            string memory cId = registeredCandidateIds[i];
            candidateVotes[cId] = 0;
            candidates[cId].voteCount = 0;
        }

        delete voteRecords;
        electionStatus = ElectionStatus.Active;
        emit ElectionReset(block.timestamp);
    }
}

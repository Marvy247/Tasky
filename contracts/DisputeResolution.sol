// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DisputeResolution is Ownable {
    uint256 public constant VOTING_PERIOD = 144; // ~24 hours in blocks
    uint256 public constant MIN_VOTES_REQUIRED = 3;

    enum DisputeStatus { Open, Resolved }
    enum Resolution { None, ForInitiator, ForCounterparty }

    struct Dispute {
        uint256 escrowId;
        address initiator;
        address counterparty;
        string reason;
        DisputeStatus status;
        uint256 createdAt;
        uint256 votesFor;
        uint256 votesAgainst;
        Resolution resolution;
    }

    mapping(uint256 => Dispute) public disputes;
    mapping(address => bool) public arbitrators;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public lastDisputeId;
    uint256 public arbitratorReward = 100;

    event DisputeRaised(uint256 indexed disputeId, uint256 escrowId, address indexed initiator);
    event ArbitratorVoted(uint256 indexed disputeId, address indexed arbitrator, bool vote);
    event DisputeResolved(uint256 indexed disputeId, Resolution resolution);
    event ArbitratorAdded(address indexed arbitrator);
    event ArbitratorRemoved(address indexed arbitrator);

    error NotAuthorized();
    error DisputeNotFound();
    error InvalidState();
    error NotArbitrator();
    error AlreadyVoted();
    error VotingClosed();
    error InsufficientVotes();
    error InvalidInput();
    error InvalidPrincipal();

    constructor() Ownable(msg.sender) {}

    function raiseDispute(uint256 escrowId, address counterparty, string calldata reason) external returns (uint256) {
        if (escrowId == 0) revert InvalidInput();
        if (bytes(reason).length == 0 || bytes(reason).length > 256) revert InvalidInput();
        if (msg.sender == counterparty) revert InvalidInput();

        uint256 disputeId = ++lastDisputeId;
        disputes[disputeId] = Dispute({
            escrowId: escrowId,
            initiator: msg.sender,
            counterparty: counterparty,
            reason: reason,
            status: DisputeStatus.Open,
            createdAt: block.number,
            votesFor: 0,
            votesAgainst: 0,
            resolution: Resolution.None
        });

        emit DisputeRaised(disputeId, escrowId, msg.sender);
        return disputeId;
    }

    function voteOnDispute(uint256 disputeId, bool vote) external {
        if (disputeId == 0 || disputeId > lastDisputeId) revert DisputeNotFound();
        if (!arbitrators[msg.sender]) revert NotArbitrator();
        Dispute storage dispute = disputes[disputeId];
        if (dispute.status != DisputeStatus.Open) revert VotingClosed();
        if (block.number > dispute.createdAt + VOTING_PERIOD) revert VotingClosed();
        if (hasVoted[disputeId][msg.sender]) revert AlreadyVoted();

        hasVoted[disputeId][msg.sender] = true;
        if (vote) dispute.votesFor++; else dispute.votesAgainst++;

        emit ArbitratorVoted(disputeId, msg.sender, vote);
    }

    function resolveDispute(uint256 disputeId) external {
        if (disputeId == 0 || disputeId > lastDisputeId) revert DisputeNotFound();
        Dispute storage dispute = disputes[disputeId];
        if (dispute.status != DisputeStatus.Open) revert InvalidState();
        if (dispute.votesFor + dispute.votesAgainst < MIN_VOTES_REQUIRED) revert InsufficientVotes();
        if (block.number > dispute.createdAt + VOTING_PERIOD) revert VotingClosed();

        dispute.status = DisputeStatus.Resolved;
        dispute.resolution = dispute.votesFor > dispute.votesAgainst
            ? Resolution.ForInitiator
            : Resolution.ForCounterparty;

        emit DisputeResolved(disputeId, dispute.resolution);
    }

    function addArbitrator(address arbitrator) external onlyOwner {
        if (arbitrator == owner() || arbitrator == address(this)) revert InvalidPrincipal();
        arbitrators[arbitrator] = true;
        emit ArbitratorAdded(arbitrator);
    }

    function removeArbitrator(address arbitrator) external onlyOwner {
        arbitrators[arbitrator] = false;
        emit ArbitratorRemoved(arbitrator);
    }

    function setArbitratorReward(uint256 newReward) external onlyOwner {
        if (newReward == 0) revert InvalidInput();
        arbitratorReward = newReward;
    }

    function getDispute(uint256 disputeId) external view returns (Dispute memory) {
        if (disputeId == 0 || disputeId > lastDisputeId) revert DisputeNotFound();
        return disputes[disputeId];
    }
}

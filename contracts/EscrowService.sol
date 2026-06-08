// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract EscrowService is Ownable {
    uint256 public constant ESCROW_DURATION = 1008; // ~7 days in blocks

    enum EscrowState { Locked, Released, Refunded }

    struct Escrow {
        address buyer;
        address seller;
        uint256 amount;
        EscrowState state;
        uint256 createdAt;
        uint256 expiresAt;
    }

    mapping(uint256 => Escrow) public escrows;
    uint256 public lastEscrowId;

    event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount);
    event FundsReleased(uint256 indexed escrowId, address indexed seller, uint256 amount);
    event BuyerRefunded(uint256 indexed escrowId, address indexed buyer, uint256 amount);

    error InvalidAmount();
    error InvalidSeller();
    error EscrowNotFound();
    error NotAuthorized();
    error AlreadyReleased();
    error EscrowExpired();
    error TransferFailed();

    constructor() Ownable(msg.sender) {}

    function createEscrow(address seller) external payable returns (uint256) {
        if (msg.value == 0) revert InvalidAmount();
        if (seller == msg.sender || seller == address(this)) revert InvalidSeller();

        uint256 escrowId = ++lastEscrowId;
        escrows[escrowId] = Escrow({
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            state: EscrowState.Locked,
            createdAt: block.number,
            expiresAt: block.number + ESCROW_DURATION
        });

        emit EscrowCreated(escrowId, msg.sender, seller, msg.value);
        return escrowId;
    }

    function releaseFunds(uint256 escrowId) external {
        if (escrowId == 0 || escrowId > lastEscrowId) revert EscrowNotFound();
        Escrow storage escrow = escrows[escrowId];
        if (msg.sender != owner() && msg.sender != escrow.buyer) revert NotAuthorized();
        if (escrow.state != EscrowState.Locked) revert AlreadyReleased();
        if (block.number > escrow.expiresAt) revert EscrowExpired();

        escrow.state = EscrowState.Released;
        (bool ok,) = payable(escrow.seller).call{value: escrow.amount}("");
        if (!ok) revert TransferFailed();

        emit FundsReleased(escrowId, escrow.seller, escrow.amount);
    }

    function refundBuyer(uint256 escrowId) external onlyOwner {
        if (escrowId == 0 || escrowId > lastEscrowId) revert EscrowNotFound();
        Escrow storage escrow = escrows[escrowId];
        if (escrow.state != EscrowState.Locked) revert AlreadyReleased();

        escrow.state = EscrowState.Refunded;
        (bool ok,) = payable(escrow.buyer).call{value: escrow.amount}("");
        if (!ok) revert TransferFailed();

        emit BuyerRefunded(escrowId, escrow.buyer, escrow.amount);
    }

    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        if (escrowId == 0 || escrowId > lastEscrowId) revert EscrowNotFound();
        return escrows[escrowId];
    }
}

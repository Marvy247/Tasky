// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract EscrowService is Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant ESCROW_DURATION = 1008; // ~7 days in blocks

    IERC20 public immutable gDollar;

    enum EscrowState { Locked, Released, Refunded }
    enum Currency { CELO, G$ }

    struct Escrow {
        address buyer;
        address seller;
        uint256 amount;
        Currency currency;
        EscrowState state;
        uint256 createdAt;
        uint256 expiresAt;
    }

    mapping(uint256 => Escrow) public escrows;
    uint256 public lastEscrowId;

    event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount, Currency currency);
    event FundsReleased(uint256 indexed escrowId, address indexed seller, uint256 amount, Currency currency);
    event BuyerRefunded(uint256 indexed escrowId, address indexed buyer, uint256 amount, Currency currency);

    error InvalidAmount();
    error InvalidSeller();
    error EscrowNotFound();
    error NotAuthorized();
    error AlreadyReleased();
    error EscrowExpired();
    error TransferFailed();

    constructor(address _gDollar) Ownable(msg.sender) {
        gDollar = IERC20(_gDollar);
    }

    /// @notice Create a CELO escrow
    function createEscrow(address seller) external payable returns (uint256) {
        if (msg.value == 0) revert InvalidAmount();
        if (seller == msg.sender || seller == address(this)) revert InvalidSeller();
        return _createEscrow(seller, msg.value, Currency.CELO);
    }

    /// @notice Create a G$ escrow (buyer must approve this contract first)
    function createEscrowGD(address seller, uint256 amount) external returns (uint256) {
        if (amount == 0) revert InvalidAmount();
        if (seller == msg.sender || seller == address(this)) revert InvalidSeller();
        gDollar.safeTransferFrom(msg.sender, address(this), amount);
        return _createEscrow(seller, amount, Currency.G$);
    }

    function _createEscrow(address seller, uint256 amount, Currency currency) internal returns (uint256) {
        uint256 escrowId = ++lastEscrowId;
        escrows[escrowId] = Escrow({
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            currency: currency,
            state: EscrowState.Locked,
            createdAt: block.number,
            expiresAt: block.number + ESCROW_DURATION
        });
        emit EscrowCreated(escrowId, msg.sender, seller, amount, currency);
        return escrowId;
    }

    function releaseFunds(uint256 escrowId) external {
        if (escrowId == 0 || escrowId > lastEscrowId) revert EscrowNotFound();
        Escrow storage escrow = escrows[escrowId];
        if (msg.sender != owner() && msg.sender != escrow.buyer) revert NotAuthorized();
        if (escrow.state != EscrowState.Locked) revert AlreadyReleased();
        if (block.number > escrow.expiresAt) revert EscrowExpired();

        escrow.state = EscrowState.Released;
        _transfer(escrow.seller, escrow.amount, escrow.currency);
        emit FundsReleased(escrowId, escrow.seller, escrow.amount, escrow.currency);
    }

    function refundBuyer(uint256 escrowId) external onlyOwner {
        if (escrowId == 0 || escrowId > lastEscrowId) revert EscrowNotFound();
        Escrow storage escrow = escrows[escrowId];
        if (escrow.state != EscrowState.Locked) revert AlreadyReleased();

        escrow.state = EscrowState.Refunded;
        _transfer(escrow.buyer, escrow.amount, escrow.currency);
        emit BuyerRefunded(escrowId, escrow.buyer, escrow.amount, escrow.currency);
    }

    function _transfer(address to, uint256 amount, Currency currency) internal {
        if (currency == Currency.G$) {
            gDollar.safeTransfer(to, amount);
        } else {
            (bool ok,) = payable(to).call{value: amount}("");
            if (!ok) revert TransferFailed();
        }
    }

    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        if (escrowId == 0 || escrowId > lastEscrowId) revert EscrowNotFound();
        return escrows[escrowId];
    }
}

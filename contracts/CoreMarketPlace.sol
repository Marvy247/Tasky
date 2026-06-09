// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CoreMarketPlace is Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_LISTING_DURATION = 52560; // ~1 year in blocks

    IERC20 public immutable gDollar;

    enum Status { Active, Sold, Cancelled }
    enum Currency { CELO, G$ }

    struct Listing {
        address seller;
        string name;
        string description;
        uint256 price;
        Currency currency;
        Status status;
        uint256 createdAt;
        uint256 expiresAt;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public lastListingId;

    event ListingCreated(uint256 indexed listingId, address indexed seller, Currency currency);
    event ListingUpdated(uint256 indexed listingId, address indexed seller);
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    event ListingPurchased(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 price, Currency currency);

    error InvalidPrice();
    error InvalidInput();
    error InvalidDuration();
    error ListingNotFound();
    error NotSeller();
    error NotActive();
    error ListingExpired();
    error InvalidSeller();
    error InsufficientPayment();
    error WrongCurrency();

    constructor(address _gDollar) Ownable(msg.sender) {
        gDollar = IERC20(_gDollar);
    }

    function createListing(string calldata name, string calldata description, uint256 price, uint256 duration) external returns (uint256) {
        return _createListing(name, description, price, duration, Currency.CELO);
    }

    function createListingGD(string calldata name, string calldata description, uint256 price, uint256 duration) external returns (uint256) {
        return _createListing(name, description, price, duration, Currency.G$);
    }

    function _createListing(string calldata name, string calldata description, uint256 price, uint256 duration, Currency currency) internal returns (uint256) {
        if (price == 0) revert InvalidPrice();
        if (bytes(name).length == 0 || bytes(name).length > 64) revert InvalidInput();
        if (bytes(description).length == 0 || bytes(description).length > 256) revert InvalidInput();
        if (duration == 0 || duration > MAX_LISTING_DURATION) revert InvalidDuration();

        uint256 listingId = ++lastListingId;
        listings[listingId] = Listing({
            seller: msg.sender,
            name: name,
            description: description,
            price: price,
            currency: currency,
            status: Status.Active,
            createdAt: block.number,
            expiresAt: block.number + duration
        });

        emit ListingCreated(listingId, msg.sender, currency);
        return listingId;
    }

    function updateListing(uint256 listingId, uint256 newPrice, string calldata newDescription) external {
        if (listingId == 0 || listingId > lastListingId) revert ListingNotFound();
        Listing storage listing = listings[listingId];
        if (listing.seller != msg.sender) revert NotSeller();
        if (listing.status != Status.Active) revert NotActive();
        if (newPrice == 0) revert InvalidPrice();
        if (bytes(newDescription).length == 0 || bytes(newDescription).length > 256) revert InvalidInput();

        listing.price = newPrice;
        listing.description = newDescription;
        emit ListingUpdated(listingId, msg.sender);
    }

    function cancelListing(uint256 listingId) external {
        if (listingId == 0 || listingId > lastListingId) revert ListingNotFound();
        Listing storage listing = listings[listingId];
        if (listing.seller != msg.sender) revert NotSeller();
        if (listing.status != Status.Active) revert NotActive();

        listing.status = Status.Cancelled;
        emit ListingCancelled(listingId, msg.sender);
    }

    /// @notice Purchase a CELO-priced listing
    function purchaseListing(uint256 listingId) external payable {
        if (listingId == 0 || listingId > lastListingId) revert ListingNotFound();
        Listing storage listing = listings[listingId];
        if (listing.status != Status.Active) revert NotActive();
        if (block.number > listing.expiresAt) revert ListingExpired();
        if (listing.seller == msg.sender) revert InvalidSeller();
        if (listing.currency != Currency.CELO) revert WrongCurrency();
        if (msg.value < listing.price) revert InsufficientPayment();

        listing.status = Status.Sold;
        payable(listing.seller).transfer(listing.price);
        if (msg.value > listing.price) payable(msg.sender).transfer(msg.value - listing.price);

        emit ListingPurchased(listingId, msg.sender, listing.seller, listing.price, Currency.CELO);
    }

    /// @notice Purchase a G$-priced listing (buyer must approve this contract first)
    function purchaseListingGD(uint256 listingId) external {
        if (listingId == 0 || listingId > lastListingId) revert ListingNotFound();
        Listing storage listing = listings[listingId];
        if (listing.status != Status.Active) revert NotActive();
        if (block.number > listing.expiresAt) revert ListingExpired();
        if (listing.seller == msg.sender) revert InvalidSeller();
        if (listing.currency != Currency.G$) revert WrongCurrency();

        listing.status = Status.Sold;
        gDollar.safeTransferFrom(msg.sender, listing.seller, listing.price);

        emit ListingPurchased(listingId, msg.sender, listing.seller, listing.price, Currency.G$);
    }

    function getListing(uint256 listingId) external view returns (Listing memory) {
        if (listingId == 0 || listingId > lastListingId) revert ListingNotFound();
        return listings[listingId];
    }
}

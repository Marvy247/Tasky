// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract UserProfile is Ownable {
    struct Profile {
        string username;
        string bio;
        string email;
        uint256 registrationDate;
        uint256 totalRatings;
        uint256 ratingSum;
        uint256 reputationScore;
    }

    mapping(address => Profile) private users;
    mapping(address => bool) public registered;
    mapping(address => bool) public authorized;

    event UserRegistered(address indexed user, string username);
    event ProfileUpdated(address indexed user);
    event UserRated(address indexed rater, address indexed user, uint256 rating);
    event ReputationCalculated(address indexed user, uint256 score);
    event UserAuthorized(address indexed user);
    event AuthorizationRevoked(address indexed user);

    error AlreadyRegistered();
    error UserNotFound();
    error InvalidInput();
    error InvalidRating();
    error SelfRating();
    error NotAuthorized();
    error InvalidPrincipal();

    constructor() Ownable(msg.sender) {
        authorized[msg.sender] = true;
    }

    function registerUser(string calldata username, string calldata bio, string calldata email) external {
        if (registered[msg.sender]) revert AlreadyRegistered();
        if (bytes(username).length == 0 || bytes(username).length > 64) revert InvalidInput();
        if (bytes(bio).length == 0 || bytes(bio).length > 256) revert InvalidInput();
        if (bytes(email).length == 0 || bytes(email).length > 64) revert InvalidInput();

        registered[msg.sender] = true;
        users[msg.sender] = Profile({
            username: username,
            bio: bio,
            email: email,
            registrationDate: block.number,
            totalRatings: 0,
            ratingSum: 0,
            reputationScore: 0
        });

        emit UserRegistered(msg.sender, username);
    }

    function updateProfile(string calldata bio, string calldata email) external {
        if (!registered[msg.sender]) revert UserNotFound();
        if (bytes(bio).length == 0 || bytes(bio).length > 256) revert InvalidInput();
        if (bytes(email).length == 0 || bytes(email).length > 64) revert InvalidInput();

        users[msg.sender].bio = bio;
        users[msg.sender].email = email;
        emit ProfileUpdated(msg.sender);
    }

    function rateUser(address user, uint256 rating) external {
        if (user == address(this)) revert InvalidPrincipal();
        if (msg.sender == user) revert SelfRating();
        if (rating < 1 || rating > 5) revert InvalidRating();
        if (!registered[user]) revert UserNotFound();

        users[user].totalRatings++;
        users[user].ratingSum += rating;
        emit UserRated(msg.sender, user, rating);
    }

    function calculateReputation(address user) external {
        if (user == address(this)) revert InvalidPrincipal();
        if (!registered[user]) revert UserNotFound();

        Profile storage p = users[user];
        uint256 avgRating = p.totalRatings > 0 ? p.ratingSum / p.totalRatings : 0;
        p.reputationScore = avgRating * 20 + p.totalRatings * 2;
        emit ReputationCalculated(user, p.reputationScore);
    }

    function authorizeUser(address user) external onlyOwner {
        if (user == address(this)) revert InvalidPrincipal();
        authorized[user] = true;
        emit UserAuthorized(user);
    }

    function revokeAuthorization(address user) external onlyOwner {
        if (user == address(this)) revert InvalidPrincipal();
        authorized[user] = false;
        emit AuthorizationRevoked(user);
    }

    function getUserProfile(address user) external view returns (Profile memory) {
        if (!registered[user]) revert UserNotFound();
        return users[user];
    }

    function getUserRating(address user) external view returns (uint256) {
        if (!registered[user]) revert UserNotFound();
        Profile storage p = users[user];
        return p.totalRatings > 0 ? p.ratingSum / p.totalRatings : 0;
    }
}

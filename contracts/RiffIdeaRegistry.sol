// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Riff Idea Registry
/// @notice Canonical provenance for executable, remixable investment ideas.
/// @dev Vibenet deployment for the Base Builders demonstration. This contract
///      records composition and purchase receipts; an issuer-approved execution
///      adapter is required before real tokenized securities can settle.
contract RiffIdeaRegistry {
    struct Idea {
        address creator;
        bytes32 parentIdeaId;
        bytes32 contentHash;
        uint64 version;
        uint64 createdAt;
    }

    mapping(bytes32 => Idea) public ideas;

    event IdeaPublished(
        bytes32 indexed ideaId,
        bytes32 indexed parentIdeaId,
        address indexed creator,
        bytes32 contentHash,
        uint64 version,
        bytes32[] assetIds,
        uint16[] weightsBps
    );

    event IdeaPurchased(
        bytes32 indexed ideaId,
        address indexed buyer,
        uint256 amountCents,
        uint256 testnetValue
    );

    error IdeaAlreadyExists();
    error IdeaNotFound();
    error InvalidAllocation();
    error InvalidVersion();

    function publishIdea(
        bytes32 ideaId,
        bytes32 parentIdeaId,
        bytes32 contentHash,
        uint64 version,
        bytes32[] calldata assetIds,
        uint16[] calldata weightsBps
    ) external {
        if (ideas[ideaId].creator != address(0)) revert IdeaAlreadyExists();
        if (version == 0 || (parentIdeaId == bytes32(0) && version != 1)) revert InvalidVersion();
        if (parentIdeaId != bytes32(0) && ideas[parentIdeaId].creator == address(0)) revert IdeaNotFound();
        if (assetIds.length < 2 || assetIds.length > 12 || assetIds.length != weightsBps.length) revert InvalidAllocation();

        uint256 total;
        for (uint256 i; i < weightsBps.length; ++i) total += weightsBps[i];
        if (total != 10_000) revert InvalidAllocation();

        ideas[ideaId] = Idea(msg.sender, parentIdeaId, contentHash, version, uint64(block.timestamp));
        emit IdeaPublished(ideaId, parentIdeaId, msg.sender, contentHash, version, assetIds, weightsBps);
    }

    function buyIdea(bytes32 ideaId, uint256 amountCents) external payable {
        if (ideas[ideaId].creator == address(0)) revert IdeaNotFound();
        if (amountCents == 0) revert InvalidAllocation();
        emit IdeaPurchased(ideaId, msg.sender, amountCents, msg.value);
    }
}


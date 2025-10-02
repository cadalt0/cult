// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPool {
    struct Config {
        address token;
        uint256 contributionAmount;
        uint256 cycleDuration;
        uint256 minMembers;
        uint256 maxMembers;
        address creator;
    }

    enum Status { Created, Active, Completed, Cancelled }

    function getConfig() external view returns (Config memory);
    function getStatus() external view returns (Status);
    function getMembers() external view returns (address[] memory);
    function currentCycle() external view returns (uint256);
    function hasJoined(address user) external view returns (bool);
    function hasPaid(uint256 cycleId, address user) external view returns (bool);
    function hasWonInCurrentRound(address user) external view returns (bool);
    function hasVotedToStartCycle(uint256 cycleId, address user) external view returns (bool);
    function getVotesToStartCount(uint256 cycleId) external view returns (uint256);
    function isCycleStartVotingActive() external view returns (bool);
    function isMemberBanned(address user) external view returns (bool);
    function getLastContributedCycle(address user) external view returns (uint256);
    function hasVotedToRemoveMember(address voter, address target) external view returns (bool);
    function getVotesToRemoveCount(address target) external view returns (uint256);
    function isRemovalVoteActiveFor(address target) external view returns (bool);

    // Join workflow
    function requestJoin() external;
    function approveJoin(address user) external;
    function approveAllJoins() external;
    function rejectJoin(address user) external;

    // Queries
    function getPendingJoinRequests() external view returns (address[] memory);
    function hasPendingJoinRequest(address user) external view returns (bool);
    function start() external;
    function activateCycleStartVoting() external;
    function voteToStartCycle() external;
    function unbanMember(address member) external;
    function startRemovalVote(address targetMember) external;
    function voteToRemove(address targetMember) external;
    function contribute(uint256 cycleId) external;
    function openBids(uint256 cycleId) external;
    function placeBid(uint256 cycleId, uint256 amount) external;
    function closeBids(uint256 cycleId) external;
    function settle(uint256 cycleId) external;
}

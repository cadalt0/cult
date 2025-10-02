// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library PoolEvents {
    // Join workflow events
    event Joined(address indexed user);
    event JoinRequested(address indexed user);
    event JoinApproved(address indexed user);
    event JoinRejected(address indexed user);
    event AllPendingApproved(uint256 approvedCount);
    
    // Pool lifecycle events
    event Started(uint256 startTime);
    event VoteToStartCycle(address indexed voter, uint256 indexed cycleId, uint256 votesCount, uint256 totalMembers);
    event CycleStartVotingActivated(uint256 indexed cycleId);
    
    // Member management events
    event MemberBanned(address indexed member, uint256 indexed cycleId);
    event MemberUnbanned(address indexed member);
    event RemovalVoteStarted(address indexed targetMember, address indexed initiator);
    event VoteToRemove(address indexed voter, address indexed targetMember, uint256 votesCount, uint256 totalMembers);
    event MemberRemoved(address indexed member, uint256 votesCount);
    
    // Cycle events
    event Contributed(uint256 indexed cycleId, address indexed user, uint256 amount);
    event BidsOpened(uint256 indexed cycleId, uint256 closeAt);
    event BidPlaced(uint256 indexed cycleId, address indexed user, uint256 amount);
    event BidsClosed(uint256 indexed cycleId);
    event Settled(uint256 indexed cycleId, address indexed winner, uint256 pot);
}

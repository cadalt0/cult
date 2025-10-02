// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {PoolEvents} from "../events/PoolEvents.sol";

library PoolVoting {
    struct VotingData {
        mapping(uint256 => mapping(address => bool)) hasVotedToStart;
        mapping(uint256 => uint256) votesToStartCount;
        bool cycleStartVotingActive;
        mapping(address => mapping(address => bool)) hasVotedToRemove;
        mapping(address => uint256) votesToRemoveCount;
        mapping(address => bool) isRemovalVoteActive;
    }

    function activateCycleStartVoting(
        VotingData storage self,
        uint256 currentCycle
    ) external {
        require(!self.cycleStartVotingActive, "voting already active");
        
        self.cycleStartVotingActive = true;
        emit PoolEvents.CycleStartVotingActivated(currentCycle);
    }

    function voteToStartCycle(
        VotingData storage self,
        uint256 cycleId,
        address sender,
        uint256 totalMembers
    ) external returns (bool shouldStart) {
        require(self.cycleStartVotingActive, "voting not active");
        require(!self.hasVotedToStart[cycleId][sender], "already voted");
        
        self.hasVotedToStart[cycleId][sender] = true;
        self.votesToStartCount[cycleId] += 1;
        
        emit PoolEvents.VoteToStartCycle(sender, cycleId, self.votesToStartCount[cycleId], totalMembers);
        
        // Check if 60% threshold reached
        uint256 requiredVotes = (totalMembers * 60) / 100;
        if (self.votesToStartCount[cycleId] >= requiredVotes) {
            self.cycleStartVotingActive = false;
            shouldStart = true;
        }
    }

    function startRemovalVote(
        VotingData storage self,
        address targetMember,
        address sender
    ) external {
        require(sender != targetMember, "cannot vote yourself");
        require(!self.isRemovalVoteActive[targetMember], "vote already active");

        self.isRemovalVoteActive[targetMember] = true;
        self.votesToRemoveCount[targetMember] = 0;
        emit PoolEvents.RemovalVoteStarted(targetMember, sender);
    }

    function voteToRemove(
        VotingData storage self,
        address targetMember,
        address sender,
        uint256 totalMembers
    ) external returns (bool shouldRemove) {
        require(self.isRemovalVoteActive[targetMember], "no active vote");
        require(!self.hasVotedToRemove[sender][targetMember], "already voted");
        require(sender != targetMember, "cannot vote yourself");

        self.hasVotedToRemove[sender][targetMember] = true;
        self.votesToRemoveCount[targetMember] += 1;

        emit PoolEvents.VoteToRemove(sender, targetMember, self.votesToRemoveCount[targetMember], totalMembers);

        // Check if 80% threshold reached
        uint256 requiredVotes = (totalMembers * 80) / 100;
        if (self.votesToRemoveCount[targetMember] >= requiredVotes) {
            self.isRemovalVoteActive[targetMember] = false;
            shouldRemove = true;
        }
    }

    function resetRemovalVote(VotingData storage self, address targetMember) external {
        self.isRemovalVoteActive[targetMember] = false;
        self.votesToRemoveCount[targetMember] = 0;
    }
}

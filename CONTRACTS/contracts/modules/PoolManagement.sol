// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {PoolEvents} from "../events/PoolEvents.sol";

library PoolManagement {
    struct ManagementData {
        address[] members;
        mapping(address => bool) isMember;
        address[] pendingJoinRequests;
        mapping(address => bool) isPendingJoin;
        mapping(address => uint256) pendingIndexPlusOne;
        mapping(address => bool) isBanned;
        mapping(address => uint256) lastContributedCycle;
    }

    function requestJoin(
        ManagementData storage self,
        address sender,
        uint256 maxMembers
    ) external {
        require(!self.isMember[sender], "already member");
        require(!self.isPendingJoin[sender], "already requested");
        require(self.members.length + self.pendingJoinRequests.length < maxMembers, "pool full");
        
        self.isPendingJoin[sender] = true;
        self.pendingJoinRequests.push(sender);
        self.pendingIndexPlusOne[sender] = self.pendingJoinRequests.length;
        emit PoolEvents.JoinRequested(sender);
    }

    function approveJoin(
        ManagementData storage self,
        address user,
        uint256 maxMembers
    ) external {
        require(self.isPendingJoin[user], "no request");
        require(!self.isMember[user], "already member");
        require(self.members.length < maxMembers, "pool full");

        _removePending(self, user);
        self.isMember[user] = true;
        self.members.push(user);
        emit PoolEvents.JoinApproved(user);
        emit PoolEvents.Joined(user);
    }

    function approveAllJoins(
        ManagementData storage self,
        uint256 maxMembers
    ) external returns (uint256 approved) {
        while (self.pendingJoinRequests.length > 0 && self.members.length < maxMembers) {
            address user = self.pendingJoinRequests[self.pendingJoinRequests.length - 1];
            _removePending(self, user);
            if (self.isMember[user]) { continue; }
            self.isMember[user] = true;
            self.members.push(user);
            emit PoolEvents.JoinApproved(user);
            emit PoolEvents.Joined(user);
            approved += 1;
        }
        emit PoolEvents.AllPendingApproved(approved);
    }

    function rejectJoin(ManagementData storage self, address user) external {
        require(self.isPendingJoin[user], "no request");
        _removePending(self, user);
        emit PoolEvents.JoinRejected(user);
    }

    function banMember(ManagementData storage self, address member, uint256 cycleId) external {
        if (!self.isBanned[member]) {
            self.isBanned[member] = true;
            emit PoolEvents.MemberBanned(member, cycleId);
        }
    }

    function unbanMember(ManagementData storage self, address member) external {
        require(self.isBanned[member], "member not banned");
        self.isBanned[member] = false;
        emit PoolEvents.MemberUnbanned(member);
    }

    function removeMember(ManagementData storage self, address member) external {
        // Remove from members array
        for (uint256 i = 0; i < self.members.length; i++) {
            if (self.members[i] == member) {
                self.members[i] = self.members[self.members.length - 1];
                self.members.pop();
                break;
            }
        }
        
        // Update mappings
        self.isMember[member] = false;
        self.isBanned[member] = true;
        emit PoolEvents.MemberRemoved(member, 0);
    }

    function _removePending(ManagementData storage self, address user) internal {
        uint256 idxPlusOne = self.pendingIndexPlusOne[user];
        if (idxPlusOne == 0) return;
        uint256 idx = idxPlusOne - 1;
        uint256 lastIdx = self.pendingJoinRequests.length - 1;
        if (idx != lastIdx) {
            address last = self.pendingJoinRequests[lastIdx];
            self.pendingJoinRequests[idx] = last;
            self.pendingIndexPlusOne[last] = idx + 1;
        }
        self.pendingJoinRequests.pop();
        self.isPendingJoin[user] = false;
        self.pendingIndexPlusOne[user] = 0;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IPool} from "./interfaces/IPool.sol";
import {IERC20} from "./lib/IERC20.sol";
import {PoolEvents} from "./events/PoolEvents.sol";
import {PoolCore} from "./modules/PoolCore.sol";
import {PoolVoting} from "./modules/PoolVoting.sol";
import {PoolManagement} from "./modules/PoolManagement.sol";

contract Pool is IPool {
    Config private config;
    Status private status;

    // Module data
    PoolCore.CoreData private coreData;
    PoolVoting.VotingData private votingData;
    PoolManagement.ManagementData private managementData;

    uint256 private _currentCycle;
    mapping(uint256 => uint256) public cycleStart;

    // shortened for testing
    uint256 public constant BID_WINDOW = 10 minutes;
    uint256 public constant MIN_CYCLE_DURATION = 60;
    uint256 public constant VOTE_THRESHOLD_PERCENT = 60;
    uint256 public constant REMOVAL_VOTE_THRESHOLD_PERCENT = 80;

    modifier onlyCreator() {
        require(msg.sender == config.creator, "not creator");
        _;
    }

    constructor(Config memory _config) {
        require(_config.token != address(0), "invalid token");
        require(_config.contributionAmount > 0, "invalid amount");
        require(_config.cycleDuration >= MIN_CYCLE_DURATION, "cycle too short");
        require(_config.minMembers >= 2 && _config.minMembers <= _config.maxMembers, "members bounds");

        config = _config;
        status = Status.Created;
        _currentCycle = 0;
    }

    // View functions
    function getConfig() external view returns (Config memory) { return config; }
    function getStatus() external view returns (Status) { return status; }
    function getMembers() external view returns (address[] memory) { return managementData.members; }
    function getPendingJoinRequests() external view returns (address[] memory) { return managementData.pendingJoinRequests; }
    function hasPendingJoinRequest(address user) external view returns (bool) { return managementData.isPendingJoin[user]; }
    function currentCycle() external view returns (uint256) { return _currentCycle; }
    function hasJoined(address user) external view returns (bool) { return managementData.isMember[user]; }
    function hasPaid(uint256 cycleId, address user) external view returns (bool) { return coreData.paid[cycleId][user]; }
    function hasWonInCurrentRound(address user) external view returns (bool) { return coreData.wonThisRound[user]; }
    function hasVotedToStartCycle(uint256 cycleId, address user) external view returns (bool) { return votingData.hasVotedToStart[cycleId][user]; }
    function getVotesToStartCount(uint256 cycleId) external view returns (uint256) { return votingData.votesToStartCount[cycleId]; }
    function isCycleStartVotingActive() external view returns (bool) { return votingData.cycleStartVotingActive; }
    function isMemberBanned(address user) external view returns (bool) { return managementData.isBanned[user]; }
    function getLastContributedCycle(address user) external view returns (uint256) { return managementData.lastContributedCycle[user]; }
    function hasVotedToRemoveMember(address voter, address target) external view returns (bool) { return votingData.hasVotedToRemove[voter][target]; }
    function getVotesToRemoveCount(address target) external view returns (uint256) { return votingData.votesToRemoveCount[target]; }
    function isRemovalVoteActiveFor(address target) external view returns (bool) { return votingData.isRemovalVoteActive[target]; }

    // Management functions
    function requestJoin() external {
        require(status == Status.Created, "join requests closed");
        PoolManagement.requestJoin(managementData, msg.sender, config.maxMembers);
    }

    function approveJoin(address user) external onlyCreator {
        require(status == Status.Created, "already started");
        PoolManagement.approveJoin(managementData, user, config.maxMembers);
    }

    function approveAllJoins() external onlyCreator {
        require(status == Status.Created, "already started");
        PoolManagement.approveAllJoins(managementData, config.maxMembers);
    }

    function rejectJoin(address user) external onlyCreator {
        require(status == Status.Created, "already started");
        PoolManagement.rejectJoin(managementData, user);
    }

    function unbanMember(address member) external onlyCreator {
        PoolManagement.unbanMember(managementData, member);
    }

    // Voting functions
    function activateCycleStartVoting() external onlyCreator {
        require(status == Status.Created, "not in created state");
        require(managementData.members.length >= config.minMembers, "insufficient members");
        PoolVoting.activateCycleStartVoting(votingData, _currentCycle);
    }

    function voteToStartCycle() external {
        require(status == Status.Created, "not in created state");
        require(votingData.cycleStartVotingActive, "voting not active");
        require(managementData.isMember[msg.sender], "not member");
        
        bool shouldStart = PoolVoting.voteToStartCycle(votingData, _currentCycle, msg.sender, managementData.members.length);
        if (shouldStart) {
            status = Status.Active;
            _currentCycle = 1;
            cycleStart[_currentCycle] = block.timestamp;
            emit PoolEvents.Started(block.timestamp);
        }
    }

    function startRemovalVote(address targetMember) external {
        require(status == Status.Active, "pool not active");
        require(managementData.isMember[msg.sender], "not member");
        require(managementData.isMember[targetMember], "target not member");
        require(!managementData.isBanned[targetMember], "target already banned");
        PoolVoting.startRemovalVote(votingData, targetMember, msg.sender);
    }

    function voteToRemove(address targetMember) external {
        require(status == Status.Active, "pool not active");
        require(managementData.isMember[msg.sender], "not member");
        require(managementData.isMember[targetMember], "target not member");
        
        bool shouldRemove = PoolVoting.voteToRemove(votingData, targetMember, msg.sender, managementData.members.length);
        if (shouldRemove) {
            PoolManagement.removeMember(managementData, targetMember);
        }
    }

    // Core functions
    function start() external {
        require(status == Status.Created, "already started");
        require(managementData.members.length >= config.minMembers, "insufficient members");
        
        if (msg.sender != config.creator) {
            require(votingData.cycleStartVotingActive, "voting not active");
            require(_currentCycle > 0, "no cycle to start");
            uint256 requiredVotes = (managementData.members.length * VOTE_THRESHOLD_PERCENT) / 100;
            require(votingData.votesToStartCount[_currentCycle] >= requiredVotes, "insufficient votes");
        }
        
        status = Status.Active;
        if (_currentCycle == 0) {
            _currentCycle = 1;
        }
        cycleStart[_currentCycle] = block.timestamp;
        votingData.cycleStartVotingActive = false;
        emit PoolEvents.Started(block.timestamp);
    }

    function contribute(uint256 cycleId) external {
        require(status == Status.Active, "not active");
        require(cycleId == _currentCycle, "wrong cycle");
        require(managementData.isMember[msg.sender], "not member");
        require(!managementData.isBanned[msg.sender], "banned member");
        
        PoolCore.contribute(coreData, cycleId, msg.sender, config.token, config.contributionAmount);
        managementData.lastContributedCycle[msg.sender] = cycleId;
    }

    function openBids(uint256 cycleId) external {
        require(status == Status.Active && cycleId == _currentCycle, "invalid state");
        PoolCore.openBids(coreData, cycleId, cycleStart[cycleId], config.cycleDuration);
    }

    function placeBid(uint256 cycleId, uint256 amount) external {
        require(status == Status.Active, "not active");
        require(cycleId == _currentCycle, "wrong cycle");
        require(managementData.isMember[msg.sender], "not member");
        require(!managementData.isBanned[msg.sender], "banned member");
        require(coreData.paid[cycleId][msg.sender], "must contribute first");
        require(!coreData.wonThisRound[msg.sender], "already won this round");
        require(amount <= (config.contributionAmount * 95) / 100, "bid above 95% max");
        require(amount >= (config.contributionAmount * 60) / 100, "bid below 60% min");

        // Auto-open bidding if contribution phase ended
        if (!coreData.bidsOpen[cycleId]) {
            require(block.timestamp >= cycleStart[cycleId] + config.cycleDuration, "contribution phase not ended");
            coreData.bidsOpen[cycleId] = true;
            coreData.bidsCloseAt[cycleId] = block.timestamp + BID_WINDOW;
            emit PoolEvents.BidsOpened(cycleId, coreData.bidsCloseAt[cycleId]);
        }

        require(block.timestamp <= coreData.bidsCloseAt[cycleId], "bids closed");
        coreData.bids[cycleId][msg.sender] = amount;
        emit PoolEvents.BidPlaced(cycleId, msg.sender, amount);
    }

    function closeBids(uint256 cycleId) external {
        require(status == Status.Active && cycleId == _currentCycle, "invalid state");
        PoolCore.closeBids(coreData, cycleId);
    }

    function settle(uint256 cycleId) external {
        require(status == Status.Active, "not active");
        require(cycleId == _currentCycle, "wrong cycle");
        require(block.timestamp >= cycleStart[cycleId] + config.cycleDuration, "cycle not ended");
        require(coreData.cycleWinner[cycleId] == address(0), "already settled");

        PoolCore.settle(coreData, cycleId, managementData.members, config.contributionAmount, config.token);

        // Ban members who didn't contribute to this cycle
        for (uint256 i = 0; i < managementData.members.length; i++) {
            address member = managementData.members[i];
            if (!managementData.isBanned[member] && !coreData.paid[cycleId][member]) {
                PoolManagement.banMember(managementData, member, cycleId);
            }
        }

        if (coreData.winnersThisRound >= managementData.members.length) {
            status = Status.Completed;
        } else {
            _currentCycle += 1;
            cycleStart[_currentCycle] = block.timestamp;
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "../lib/IERC20.sol";
import {PoolEvents} from "../events/PoolEvents.sol";

library PoolCore {
    struct CoreData {
        mapping(uint256 => mapping(address => bool)) paid;
        mapping(uint256 => uint256) paidCount;
        mapping(uint256 => bool) bidsOpen;
        mapping(uint256 => uint256) bidsCloseAt;
        mapping(uint256 => mapping(address => uint256)) bids;
        mapping(uint256 => address) cycleWinner;
        mapping(address => bool) wonThisRound;
        uint256 winnersThisRound;
    }

    function _selectWinner(
        CoreData storage self,
        uint256 cycleId,
        address[] memory members
    ) internal view returns (address winner) {
        winner = address(0);
        uint256 lowest = type(uint256).max;
        for (uint256 i = 0; i < members.length; i++) {
            address m = members[i];
            if (!self.paid[cycleId][m] || self.wonThisRound[m]) continue;
            uint256 b = self.bids[cycleId][m];
            if (b > 0 && b < lowest) {
                lowest = b;
                winner = m;
            }
        }
        if (winner == address(0)) {
            for (uint256 j = 0; j < members.length; j++) {
                address m2 = members[j];
                if (self.paid[cycleId][m2] && !self.wonThisRound[m2]) { winner = m2; break; }
            }
        }
    }

    function _distributeRemainder(
        CoreData storage self,
        uint256 cycleId,
        address[] memory members,
        address token,
        address winner,
        uint256 remainder
    ) internal {
        if (remainder == 0) return;
        uint256 recipients = 0;
        for (uint256 i = 0; i < members.length; i++) {
            address m = members[i];
            if (m != winner && self.paid[cycleId][m]) { recipients += 1; }
        }
        if (recipients == 0) return;

        uint256 share = remainder / recipients;
        uint256 dust = remainder - (share * recipients);

        for (uint256 i = 0; i < members.length; i++) {
            address rcpt = members[i];
            if (rcpt == winner || !self.paid[cycleId][rcpt]) { continue; }
            uint256 payout = share;
            if (dust > 0) { payout += 1; dust -= 1; }
            if (payout > 0) { IERC20(token).transfer(rcpt, payout); }
        }
    }

    function contribute(
        CoreData storage self,
        uint256 cycleId,
        address sender,
        address token,
        uint256 contributionAmount
    ) external {
        require(!self.paid[cycleId][sender], "already paid");
        
        IERC20(token).transferFrom(sender, address(this), contributionAmount);
        
        self.paid[cycleId][sender] = true;
        self.paidCount[cycleId] += 1;
        emit PoolEvents.Contributed(cycleId, sender, contributionAmount);
    }

    function openBids(
        CoreData storage self,
        uint256 cycleId,
        uint256 cycleStart,
        uint256 cycleDuration
    ) external {
        require(!self.bidsOpen[cycleId], "bids already open");
        require(block.timestamp >= cycleStart + cycleDuration, "contribution phase not ended");

        self.bidsOpen[cycleId] = true;
        self.bidsCloseAt[cycleId] = block.timestamp + 3 days;
        emit PoolEvents.BidsOpened(cycleId, self.bidsCloseAt[cycleId]);
    }

    function placeBid(
        CoreData storage self,
        uint256 cycleId,
        uint256 amount,
        address sender,
        uint256 cycleStart,
        uint256 cycleDuration,
        uint256 contributionAmount
    ) external {
        require(!self.paid[cycleId][sender], "must contribute first");
        require(!self.wonThisRound[sender], "already won this round");
        require(amount <= (contributionAmount * 95) / 100, "bid above 95% max");
        require(amount >= (contributionAmount * 60) / 100, "bid below 60% min");

        // Auto-open bidding if contribution phase ended
        if (!self.bidsOpen[cycleId]) {
            require(block.timestamp >= cycleStart + cycleDuration, "contribution phase not ended");
            self.bidsOpen[cycleId] = true;
            self.bidsCloseAt[cycleId] = block.timestamp + 3 days;
            emit PoolEvents.BidsOpened(cycleId, self.bidsCloseAt[cycleId]);
        }

        require(block.timestamp <= self.bidsCloseAt[cycleId], "bids closed");

        self.bids[cycleId][sender] = amount;
        emit PoolEvents.BidPlaced(cycleId, sender, amount);
    }

    function closeBids(CoreData storage self, uint256 cycleId) external {
        require(self.bidsOpen[cycleId], "bids not open");
        require(block.timestamp > self.bidsCloseAt[cycleId], "too early");
        self.bidsOpen[cycleId] = false;
        emit PoolEvents.BidsClosed(cycleId);
    }

    function settle(
        CoreData storage self,
        uint256 cycleId,
        address[] memory members,
        uint256 contributionAmount,
        address token
    ) external returns (address winner) {
        require(self.cycleWinner[cycleId] == address(0), "already settled");

        winner = _selectWinner(self, cycleId, members);
        require(winner != address(0), "no eligible winner");

        uint256 pot = contributionAmount * self.paidCount[cycleId];
        uint256 winnerBid = self.bids[cycleId][winner];

        if (winnerBid == 0) {
            IERC20(token).transfer(winner, pot);
        } else {
            uint256 numContributors = self.paidCount[cycleId];
            if (numContributors > 0) {
                uint256 winnerPayout = winnerBid * numContributors;
                if (winnerPayout > pot) { winnerPayout = pot; }
                uint256 remainder = pot - winnerPayout;

                if (winnerPayout > 0) {
                    IERC20(token).transfer(winner, winnerPayout);
                }

                _distributeRemainder(self, cycleId, members, token, winner, remainder);
            } else {
                IERC20(token).transfer(winner, pot);
            }
        }

        self.cycleWinner[cycleId] = winner;
        if (!self.wonThisRound[winner]) {
            self.wonThisRound[winner] = true;
            self.winnersThisRound += 1;
        }

        emit PoolEvents.Settled(cycleId, winner, pot);
    }
}

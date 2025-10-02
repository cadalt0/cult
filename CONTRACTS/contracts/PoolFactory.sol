// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IPool} from "./interfaces/IPool.sol";
import {Pool} from "./Pool.sol";

contract PoolFactory {
    event PoolCreated(address indexed creator, address pool, IPool.Config config);

    address[] private allPools;

    function getAllPools() external view returns (address[] memory) {
        return allPools;
    }

    function createPool(IPool.Config memory config) external returns (address poolAddr) {
        require(config.token != address(0), "invalid token");
        require(config.contributionAmount > 0, "invalid amount");
        require(config.cycleDuration >= 60, "cycle too short"); // lowered for testing
        require(config.minMembers >= 2 && config.minMembers <= config.maxMembers, "members bounds");

        config.creator = msg.sender;
        Pool pool = new Pool(config);
        poolAddr = address(pool);
        allPools.push(poolAddr);
        emit PoolCreated(msg.sender, poolAddr, config);
    }
}

// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.0;
pragma abicoder v2;

interface IWorkTogetherPool {
    function enter(uint256 amount) external;

    function withdraw(uint256 amount) external;

    function distributeReward() external;
}

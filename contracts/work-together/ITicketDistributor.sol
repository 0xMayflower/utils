// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.0;
pragma abicoder v2;

interface ITicketDistributor {
    function mintTo(uint256 amount, address to) external;
}

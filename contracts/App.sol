// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

import {IDividendPool} from "@workhard/protocol/contracts/core/dividend/interfaces/IDividendPool.sol";

interface WETH9 {
    function deposit() external payable;
}

interface IERC20 {
    function approve(address spender, uint256 amount) external;
}

/** @dev implement your own contract */
contract App {
    address public dividendPool;
    address public weth9;

    constructor(address dividendPool_, address weth9_) {
        dividendPool = dividendPool_;
        weth9 = weth9_;
        IERC20(weth9).approve(dividendPool_, type(uint256).max);
    }

    /** @dev This is a sample function. Implement your own logic. */
    function buy() public payable {
        WETH9(weth9).deposit{value: msg.value}();
        IDividendPool(dividendPool).distribute(weth9, msg.value);
    }
}

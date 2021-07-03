// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.0;
pragma abicoder v2;

import {Governed} from "@workhard/protocol/contracts/core/governance/Governed.sol";
import {IDividendPool} from "@workhard/protocol/contracts/core/dividend/interfaces/IDividendPool.sol";
import {AccessControlEnumerable} from "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {OneInch} from "../helpers/one-inch/OneInch.sol";
import {IUniswapV2Pair} from "../helpers/uni-v2/interfaces/IUniswapV2Pair.sol";

contract FeeManager is Governed, AccessControlEnumerable {
    using OneInch for bytes;
    using SafeMath for uint256;

    bytes32 public constant FEE_MANAGER_ADMIN_ROLE =
        keccak256("FEE_MANAGER_ADMIN_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    address public dividendPool;
    address public rewardToken;
    address public oneInch;

    constructor(
        address gov_,
        address dividendPool_,
        address rewardToken_,
        address oneInch_
    ) {
        Governed.initialize(gov_);
        dividendPool = dividendPool_;
        rewardToken = rewardToken_;
        oneInch = oneInch_;
        IERC20(rewardToken).approve(dividendPool_, type(uint256).max);
        _setRoleAdmin(FEE_MANAGER_ADMIN_ROLE, FEE_MANAGER_ADMIN_ROLE);
        _setRoleAdmin(EXECUTOR_ROLE, FEE_MANAGER_ADMIN_ROLE);

        // deployer + self administration
        _setupRole(FEE_MANAGER_ADMIN_ROLE, gov_);
        _setupRole(FEE_MANAGER_ADMIN_ROLE, address(this));
    }

    function convert(address pair, uint256 amount)
        public
        onlyRole(EXECUTOR_ROLE)
    {
        IUniswapV2Pair(pair).transferFrom(address(this), pair, amount); // send liquidity to pair
        IUniswapV2Pair(pair).burn(address(this));
    }

    function swapOn1Inch(bytes calldata swapData)
        public
        onlyRole(EXECUTOR_ROLE)
    {
        // Swap to stable coin and transfer them to the commit pool
        (
            uint256 amount,
            address srcToken,
            address dstToken,
            address dstReceiver
        ) = swapData.decode();
        require(
            IERC20(srcToken).balanceOf(address(this)) >= amount,
            "FeeManager: NOT ENOUGH BALANCE"
        );
        require(srcToken != rewardToken, "FeeManager: SPENDING YAPE");
        require(dstToken == rewardToken, "FeeManager: SHOULD BUY YAPE");
        require(dstReceiver == address(this), "FeeManager: INVALID DST");
        uint256 prevBal = IERC20(rewardToken).balanceOf(address(this));
        (bool success, bytes memory result) = oneInch.call(swapData);
        require(success, "failed to swap tokens");
        uint256 swappedAmount;
        assembly {
            swappedAmount := mload(add(result, 0x20))
        }
        require(
            swappedAmount ==
                IERC20(rewardToken).balanceOf(address(this)).sub(prevBal),
            "Swapped amount is different with the real swapped amount"
        );
    }

    function distribute(uint256 amount) public onlyRole(EXECUTOR_ROLE) {
        IDividendPool(dividendPool).distribute(rewardToken, amount);
    }
}

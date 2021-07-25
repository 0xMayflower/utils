pragma solidity >=0.8.0;

import "./WorkTogetherPool.sol";

contract WorkTogetherPoolManager {
    uint256 internal currentIndex;
    mapping(uint256 => address) poolAddresses;

    function createTokenRewardPool(
        Ticket _ticket,
        IERC20 _rewardToken,
        IERC20 _feeToken,
        RNGInterface _rng,
        string memory _poolName,
        uint256 _startTime,
        uint256 _endPeriod
    ) external returns (uint256, address) {
        address poolAddress = address(
            new WorkTogetherPool(
                _ticket,
                _rewardToken,
                _feeToken,
                _rng,
                _poolName,
                _startTime,
                _endPeriod
            )
        );
        currentIndex += 1;
        poolAddresses[currentIndex] = poolAddress;
        return (currentIndex, poolAddress);
    }

    function getPoolAddressOf(uint256 poolIndex) public view returns (address) {
        return poolAddresses[poolIndex];
    }

    function getLatestPool() public view returns (address) {
        return poolAddresses[currentIndex];
    }

    function getSizeOfPool() public view returns (uint256) {
        return currentIndex + 1;
    }
}

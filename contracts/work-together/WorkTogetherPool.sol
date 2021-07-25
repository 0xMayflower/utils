pragma solidity >=0.8.0;

import "./IWorkTogetherPool.sol";
import "./Ticket.sol";
import "../helpers/sortion-sum-tree-factory/SortitionSumTreeFactory.sol";
import "../helpers/uniform-random-number/UniformRandomNumber.sol";
import "../helpers/rng-service/RNGInterface.sol";

contract WorkTogetherPool is IWorkTogetherPool {
    using SortitionSumTreeFactory for SortitionSumTreeFactory.SortitionSumTrees;

    bytes32 private constant TREE_KEY = keccak256("WorkTogether/Ticket");
    uint256 private constant MAX_TREE_LEAVES = 5;
    uint256 private constant DISTRIBUTE_CALLER_REWARD = 5; //percent of total locked ticket.

    Ticket internal ticket;
    IERC20 internal rewardToken;
    IERC20 internal feeToken;
    RNGInterface internal rng;
    uint256 internal startTime;
    uint256 internal endPeriod;
    uint256 internal totalTickets;

    string public poolName;

    struct RngRequest {
        uint32 id;
        uint32 lockBlock;
        uint32 requestedAt;
    }

    // Current RNG Request
    RngRequest internal rngRequest;

    SortitionSumTreeFactory.SortitionSumTrees internal sortitionSumTrees;

    event PoolCreated(
        string name,
        IERC20 rewardToken,
        IERC20 feeToken,
        RNGInterface rng,
        uint256 startTime,
        uint256 endPeriod
    );

    constructor(
        Ticket _ticket,
        IERC20 _rewardToken,
        IERC20 _feeToken,
        RNGInterface _rng,
        string memory _poolName,
        uint256 _startTime,
        uint256 _endPeriod
    ) {
        ticket = _ticket;
        rewardToken = _rewardToken;
        feeToken = _feeToken;
        rng = _rng;
        poolName = _poolName;
        startTime = _startTime;
        endPeriod = _endPeriod;
        sortitionSumTrees.createTree(TREE_KEY, MAX_TREE_LEAVES);
        totalTickets = 0;
        emit PoolCreated(
            poolName,
            rewardToken,
            feeToken,
            rng,
            startTime,
            endPeriod
        );
    }

    event Enter(
        address participant,
        uint256 amount,
        uint256 currentStakedAmount
    );

    function enter(uint256 amount) external override {
        require(block.timestamp > startTime, "Pool not started");
        require(block.timestamp < startTime + endPeriod, "Pool already ended");
        ticket.transferFrom(msg.sender, address(this), amount);
        totalTickets += amount;
        uint256 staked = sortitionSumTrees.stakeOf(
            TREE_KEY,
            bytes32(uint256(uint160(msg.sender)))
        );
        sortitionSumTrees.set(
            TREE_KEY,
            staked + amount,
            bytes32(uint256(uint160(msg.sender)))
        );
        emit Enter(msg.sender, amount, staked + amount);
    }

    event Withdraw(
        address participant,
        uint256 amount,
        uint256 currentStakedAmount
    );

    function withdraw(uint256 amount) external override {
        require(block.timestamp > startTime, "Pool not started");
        require(block.timestamp < startTime + endPeriod, "Pool already ended");
        ticket.transferFrom(address(this), msg.sender, amount);
        totalTickets -= amount;
        uint256 staked = sortitionSumTrees.stakeOf(
            TREE_KEY,
            bytes32(uint256(uint160(msg.sender)))
        );
        require(
            staked > amount,
            "insufficient amount to withdraw at this pool"
        );
        sortitionSumTrees.set(
            TREE_KEY,
            staked - amount,
            bytes32(uint256(uint160(msg.sender)))
        );
        emit Withdraw(msg.sender, amount, staked - amount);
    }

    event RequestRandomNumber(
        uint256 currentTime,
        uint32 requestId,
        uint256 lockBlock
    );

    function requestRandomNumber() external {
        require(block.timestamp > startTime, "Pool not started");
        require(block.timestamp > startTime + endPeriod, "Pool not yet ended");

        // if we use Chainlink. feeToken is needed.
        (address feeToken, uint256 requestFee) = rng.getRequestFee();
        if (feeToken != address(0) && requestFee > 0) {
            IERC20(feeToken).approve(address(rng), requestFee);
        }

        (uint32 requestId, uint32 lockBlock) = rng.requestRandomNumber();

        rngRequest.id = requestId;
        rngRequest.lockBlock = lockBlock;
        rngRequest.requestedAt = uint32(_currentTime());
        emit RequestRandomNumber(
            rngRequest.requestedAt,
            rngRequest.id,
            rngRequest.lockBlock
        );
    }

    event DistributeReward(
        address recipient,
        uint256 rewardAmount,
        uint256 randomNumber
    );

    function distributeReward() public override {
        require(block.timestamp > startTime, "Pool not started");
        require(block.timestamp > startTime + endPeriod, "Pool not yet ended");

        //reward to caller, and burn all the rest ticket from this pool.
        ticket.transfer(
            msg.sender,
            (totalTickets / 100) * DISTRIBUTE_CALLER_REWARD
        );
        ticket.burn(ticket.balanceOf(address(this)));
        totalTickets = 0;

        rewardToken.transfer(_selectedRecipient(), poolReward());
        emit DistributeReward(
            _selectedRecipient(),
            poolReward(),
            _currentRandomNumber()
        );
    }

    function chanceOf(address user) external view returns (uint256) {
        return
            sortitionSumTrees.stakeOf(
                TREE_KEY,
                bytes32(sha256(abi.encodePacked(msg.sender, "address")))
            );
    }

    function poolReward() public view returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }

    function _selectedRecipient() internal returns (address) {
        address selected;
        if (totalTickets == 0) {
            selected = address(0);
        } else {
            uint256 token = UniformRandomNumber.uniform(
                _currentRandomNumber(),
                totalTickets
            );
            selected = address(
                uint160(uint256(sortitionSumTrees.draw(TREE_KEY, token)))
            );
        }
        return selected;
    }

    function _currentRandomNumber() internal returns (uint256) {
        require(rngRequest.id != 0, "there is no random number requests");
        require(
            rngRequest.lockBlock < block.number,
            "lock block number is bigger than current block number"
        );
        return rng.randomNumber(rngRequest.id);
    }

    function draw(uint256 randomNumber) public view returns (address) {
        address selected;
        if (totalTickets == 0) {
            selected = address(0);
        } else {
            uint256 token = UniformRandomNumber.uniform(
                randomNumber,
                totalTickets
            );
            selected = address(
                uint160(uint256(sortitionSumTrees.draw(TREE_KEY, token)))
            );
        }
        return selected;
    }

    function _currentTime() internal view virtual returns (uint256) {
        return block.timestamp;
    }
}

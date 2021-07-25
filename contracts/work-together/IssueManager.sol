pragma solidity >=0.8.0;

import "./ITicketDistributor.sol";
import "./IERC20.sol";

contract IssueManager is ITicketDistributor {
    address admin;
    IERC20 ticket;

    constructor(IERC20 _ticket) {
        admin = msg.sender;
        ticket = _ticket;
    }

    //    function registerIssue(uint256 tokenToMint) returns (uint256){
    //
    //    }
    //    function claimResolveIssue(uint256 issueId, string memo) returns (uint256){
    //
    //    }
    function verifyAndRewardToSolver(uint256 issueId, uint256 claimId) public {}

    function mintTo(uint256 amount, address to) public override onlyAdmin {}

    /// @dev Function modifier to ensure that the caller is the controller contract
    modifier onlyAdmin {
        require(msg.sender == address(admin), "IssueManager/only-admin");
        _;
    }
}

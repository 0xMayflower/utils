pragma solidity >=0.8.0;

import "./ITicketDistributor.sol";
import "./Ticket.sol";

contract IssueManager is ITicketDistributor {
    address admin;
    Ticket ticket;

    struct Claim {
        address claimer;
        string memo;
    }

    struct Issue {
        uint256 issueId;
        uint256 rewardAmount;
        address resolver;
    }

    mapping(uint256 => Issue) public issues;
    mapping(uint256 => mapping(address => Claim)) public claims; // issueId => claimer => Claim

    constructor() {
        admin = msg.sender;
    }

    function initTicket(Ticket _ticket) public onlyAdmin {
        ticket = _ticket;
    }

    event IssueRegistered(uint256 issueId, uint256 rewardAmount);

    function registerIssue(uint256 issueId, uint256 rewardAmount)
        public
        returns (uint256)
    {
        require(issueId != 0, "IssueManager/id should not be zero");
        require(
            issues[issueId].issueId == 0,
            "IssueManager/already registered"
        );
        require(
            rewardAmount > 0,
            "IssueManager/reward amount should be positive"
        );

        if (msg.sender == admin) {
            ticket.controllerMint(address(this), rewardAmount);
        } else {
            require(
                ticket.balanceOf(msg.sender) >= rewardAmount,
                "IssueManager/sender has less ticket to create this issue"
            );
            ticket.transferFrom(msg.sender, address(this), rewardAmount);
        }

        Issue memory issue;
        issue.issueId = issueId;
        issue.rewardAmount = rewardAmount;
        issues[issueId] = issue;
        emit IssueRegistered(issueId, rewardAmount);
        return issueId;
    }

    event IssueClaimed(uint256 issueId, address claimer, string memo);

    function claimResolveIssue(uint256 issueId, string memory memo) public {
        require(issues[issueId].issueId != 0, "IssueManager/not registered");
        require(issues[issueId].resolver == address(0), "issue already solved");
        Claim memory claim;
        claim.claimer = msg.sender;
        claim.memo = memo;
        claims[issueId][msg.sender] = claim;
        emit IssueClaimed(issueId, msg.sender, memo);
    }

    event IssueResolved(uint256 issueId, address resolver);

    function selectIssueResolver(uint256 issueId, address resolver) public {
        require(issues[issueId].issueId != 0, "IssueManager/not registered");
        require(
            issues[issueId].resolver == address(0),
            "IssueManager/issue already solved"
        );
        require(
            claims[issueId][resolver].claimer != address(0),
            "IssueManager/this address does not claimed"
        );
        issues[issueId].resolver = resolver;
        ticket.transfer(resolver, issues[issueId].rewardAmount);
        emit IssueResolved(issueId, resolver);
    }

    function mintTo(uint256 amount, address to) public override onlyAdmin {
        ticket.controllerMint(to, amount);
    }

    /// @dev Function modifier to ensure that the caller is the controller contract
    modifier onlyAdmin {
        require(msg.sender == address(admin), "IssueManager/only-admin");
        _;
    }
}

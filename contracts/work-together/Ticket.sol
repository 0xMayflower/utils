pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import "./ITicketDistributor.sol";

contract Ticket is ERC20PresetMinterPauser {
    ITicketDistributor public controller;

    constructor() ERC20PresetMinterPauser("WHF-TICKET", "TICKET") {}

    //    function initialize (
    //        string memory _name,
    //        string memory _symbol,
    //        uint8 _decimals,
    //        ITicketDistributor _controller
    //    )
    //    public
    //    virtual
    //    initializer
    //    {
    //        __ERC20_init(_name, _symbol);
    //        controller = _controller;
    //        _setupDecimals(_decimals);
    //    }

    /// @notice Allows the controller to mint tokens for a user account
    /// @dev May be overridden to provide more granular control over minting
    /// @param _user Address of the receiver of the minted tokens
    /// @param _amount Amount of tokens to mint
    function controllerMint(address _user, uint256 _amount)
        external
        virtual
        onlyController
    {
        _mint(_user, _amount);
    }

    /// @notice Allows the controller to burn tokens from a user account
    /// @dev May be overridden to provide more granular control over burning
    /// @param _user Address of the holder account to burn tokens from
    /// @param _amount Amount of tokens to burn
    function controllerBurn(address _user, uint256 _amount)
        external
        virtual
        onlyController
    {
        _burn(_user, _amount);
    }

    /// @notice Allows an operator via the controller to burn tokens on behalf of a user account
    /// @dev May be overridden to provide more granular control over operator-burning
    /// @param _operator Address of the operator performing the burn action via the controller contract
    /// @param _user Address of the holder account to burn tokens from
    /// @param _amount Amount of tokens to burn
    function controllerBurnFrom(
        address _operator,
        address _user,
        uint256 _amount
    ) external virtual onlyController {
        if (_operator != _user) {
            uint256 decreasedAllowance = allowance(_user, _operator) - _amount;
            _approve(_user, _operator, decreasedAllowance);
        }
        _burn(_user, _amount);
    }

    /// @dev Function modifier to ensure that the caller is the controller contract
    modifier onlyController {
        require(_msgSender() == address(controller), "Ticket/only-controller");
        _;
    }

    /// @dev Controller hook to provide notifications & rule validations on token transfers to the controller.
    /// This includes minting and burning.
    /// May be overridden to provide more granular control over operator-burning
    /// @param from Address of the account sending the tokens (address(0x0) on minting)
    /// @param to Address of the account receiving the tokens (address(0x0) on burning)
    /// @param amount Amount of tokens being transferred
    //    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override virtual {
    //        controller.beforeTokenTransfer(from, to, amount);
    //    }
}

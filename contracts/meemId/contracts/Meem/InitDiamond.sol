// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {LibAppStorage} from './storage/LibAppStorage.sol';
import {LibAccessControl} from './libraries/LibAccessControl.sol';
import {IDiamondCut} from './interfaces/IDiamondCut.sol';
import {IDiamondLoupe} from './interfaces/IDiamondLoupe.sol';
import {MeemID} from './interfaces/IMeemID.sol';

import '@solidstate/contracts/introspection/ERC165.sol';

contract InitDiamond {
	using ERC165Storage for ERC165Storage.Layout;

	// struct Args {

	// }

	// function init(Args memory _args) external {
	function init() external {
		ERC165Storage.Layout storage erc165 = ERC165Storage.layout();
		erc165.setSupportedInterface(type(IDiamondCut).interfaceId, true);
		erc165.setSupportedInterface(type(IDiamondLoupe).interfaceId, true);

		LibAppStorage.AppStorage storage s = LibAppStorage.diamondStorage();
		s.ADMIN_ROLE = keccak256('ADMIN_ROLE');
		s.ID_VERIFIER_ROLE = keccak256('ID_VERIFIER_ROLE');

		LibAccessControl._grantRole(s.ADMIN_ROLE, msg.sender);
		LibAccessControl._grantRole(s.ID_VERIFIER_ROLE, msg.sender);

		// Set the 0-th id element to the zero address to make sure no real users are mapped to zero, making existence checks easier
		address[] memory wallets = new address[](1);
		string[] memory twitters = new string[](0);
		wallets[0] = address(0);

		s.ids.push(
			MeemID({
				wallets: wallets,
				twitters: twitters,
				defaultWallet: address(0),
				defaultTwitter: ''
			})
		);
	}
}

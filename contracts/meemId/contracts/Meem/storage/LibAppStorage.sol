// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {MeemID} from '../interfaces/IMeemID.sol';

library LibAppStorage {
	bytes32 constant DIAMOND_STORAGE_POSITION = keccak256('meemid.app.storage');

	struct RoleData {
		mapping(address => bool) members;
		bytes32 adminRole;
	}

	struct AppStorage {
		/** AccessControl Role: Admin */
		bytes32 ADMIN_ROLE;
		bytes32 ID_VERIFIER_ROLE;
		mapping(bytes32 => RoleData) roles;
		MeemID[] ids;
		/** Ids */
		mapping(address => uint256) walletIdIndex;
		mapping(string => uint256) twitterIdIndex;
	}

	function diamondStorage() internal pure returns (AppStorage storage ds) {
		bytes32 position = DIAMOND_STORAGE_POSITION;
		assembly {
			ds.slot := position
		}
	}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
pragma experimental ABIEncoderV2;

import {LibAppStorage} from '../storage/LibAppStorage.sol';
import {LibArray} from '../libraries/LibArray.sol';
import {LibStrings} from '../libraries/LibStrings.sol';
import {LibAccessControl} from '../libraries/LibAccessControl.sol';
import {TwitterAlreadyAdded, MeemIDNotFound, MeemIDAlreadyExists, MeemIDAlreadyAssociated, NoRemoveSelf} from '../libraries/Errors.sol';
import {IMeemID, MeemID} from '../interfaces/IMeemID.sol';

contract MeemIdFacet is IMeemID {
	function createOrAddMeemID(address addy, string memory twitterId)
		external
		override
	{
		LibAppStorage.AppStorage storage s = LibAppStorage.diamondStorage();
		LibAccessControl.requireRole(s.ID_VERIFIER_ROLE);
		uint256 idx = s.walletIdIndex[addy];
		uint256 twitterIdx = s.twitterIdIndex[twitterId];

		if (idx == 0 && twitterIdx == 0) {
			// Create the ID
			address[] memory wallets = new address[](1);
			string[] memory twitters = new string[](1);
			wallets[0] = addy;
			twitters[0] = twitterId;

			s.ids.push(
				MeemID({
					wallets: wallets,
					twitters: twitters,
					defaultWallet: addy,
					defaultTwitter: twitterId
				})
			);

			idx = s.ids.length - 1;

			s.walletIdIndex[addy] = idx;
			s.twitterIdIndex[twitterId] = idx;
		} else if (idx != 0 && twitterIdx == 0) {
			// Add twitter
			s.ids[idx].twitters.push(twitterId);
			s.twitterIdIndex[twitterId] = idx;

			if (bytes(s.ids[idx].defaultTwitter).length == 0) {
				s.ids[idx].defaultTwitter = twitterId;
			}
			if (s.ids[idx].defaultWallet == address(0)) {
				s.ids[idx].defaultWallet = addy;
			}
		} else if (idx == 0 && twitterIdx != 0) {
			// Add wallet
			s.ids[twitterIdx].wallets.push(addy);
			s.walletIdIndex[addy] = twitterIdx;

			if (bytes(s.ids[twitterIdx].defaultTwitter).length == 0) {
				s.ids[twitterIdx].defaultTwitter = twitterId;
			}
			if (s.ids[twitterIdx].defaultWallet == address(0)) {
				s.ids[twitterIdx].defaultWallet = addy;
			}
		} else if (idx != 0 && twitterIdx != 0 && idx != twitterIdx) {
			// Mismatched ids
			revert MeemIDAlreadyAssociated();
		}

		// Else it's already been added. Nothing to do.
	}

	function getMeemIDByWalletAddress(address addy)
		external
		view
		override
		returns (MeemID memory)
	{
		LibAppStorage.AppStorage storage s = LibAppStorage.diamondStorage();

		if (s.walletIdIndex[addy] == 0) {
			revert MeemIDNotFound();
		}

		return s.ids[s.walletIdIndex[addy]];
	}

	function getMeemIDByTwitterId(string memory twitterId)
		external
		view
		override
		returns (MeemID memory)
	{
		LibAppStorage.AppStorage storage s = LibAppStorage.diamondStorage();

		if (s.twitterIdIndex[twitterId] == 0) {
			revert MeemIDNotFound();
		}

		return s.ids[s.twitterIdIndex[twitterId]];
	}

	function removeWalletAddressByWalletAddress(
		address lookupWalletAddress,
		address addressToRemove
	) external override {
		LibAppStorage.AppStorage storage s = LibAppStorage.diamondStorage();
		LibAccessControl.requireRole(s.ID_VERIFIER_ROLE);

		if (lookupWalletAddress == addressToRemove) {
			revert NoRemoveSelf();
		}

		uint256 idx = s.walletIdIndex[lookupWalletAddress];

		if (idx == 0) {
			revert MeemIDNotFound();
		}

		for (uint256 i = 0; i < s.ids[idx].wallets.length; i++) {
			if (s.ids[idx].wallets[i] == addressToRemove) {
				s.ids[idx].wallets = LibArray.removeAddressAt(
					s.ids[idx].wallets,
					i
				);

				delete s.walletIdIndex[addressToRemove];
			}
		}

		if (s.ids[idx].defaultWallet == addressToRemove) {
			s.ids[idx].defaultWallet = s.ids[idx].wallets[0];
		}
	}

	function removeWalletAddressByTwitterId(
		string memory lookupTwitterId,
		address addressToRemove
	) external override {
		LibAppStorage.AppStorage storage s = LibAppStorage.diamondStorage();
		LibAccessControl.requireRole(s.ID_VERIFIER_ROLE);

		uint256 idx = s.twitterIdIndex[lookupTwitterId];

		if (idx == 0) {
			revert MeemIDNotFound();
		}

		for (uint256 i = 0; i < s.ids[idx].wallets.length; i++) {
			if (s.ids[idx].wallets[i] == addressToRemove) {
				s.ids[idx].wallets = LibArray.removeAddressAt(
					s.ids[idx].wallets,
					i
				);

				delete s.walletIdIndex[addressToRemove];
			}
		}

		if (s.ids[idx].defaultWallet == addressToRemove) {
			s.ids[idx].defaultWallet = s.ids[idx].wallets[0];
		}
	}

	function removeTwitterIdByWalletAddress(
		address lookupWalletAddress,
		string memory twitterIdToRemove
	) external override {
		LibAppStorage.AppStorage storage s = LibAppStorage.diamondStorage();
		LibAccessControl.requireRole(s.ID_VERIFIER_ROLE);

		uint256 idx = s.walletIdIndex[lookupWalletAddress];

		if (idx == 0) {
			revert MeemIDNotFound();
		}

		for (uint256 i = 0; i < s.ids[idx].twitters.length; i++) {
			if (
				LibStrings.compareStrings(
					s.ids[idx].twitters[i],
					twitterIdToRemove
				)
			) {
				s.ids[idx].twitters = LibArray.removeStringAt(
					s.ids[idx].twitters,
					i
				);

				delete s.twitterIdIndex[twitterIdToRemove];
			}
		}

		if (
			LibStrings.compareStrings(
				s.ids[idx].defaultTwitter,
				twitterIdToRemove
			)
		) {
			s.ids[idx].defaultTwitter = s.ids[idx].twitters[0];
		}
	}

	function removeTwitterIdByTwitterId(
		string memory lookupTwitterId,
		string memory twitterIdToRemove
	) external override {
		LibAppStorage.AppStorage storage s = LibAppStorage.diamondStorage();
		LibAccessControl.requireRole(s.ID_VERIFIER_ROLE);

		if (LibStrings.compareStrings(lookupTwitterId, twitterIdToRemove)) {
			revert NoRemoveSelf();
		}

		uint256 idx = s.twitterIdIndex[lookupTwitterId];

		if (idx == 0) {
			revert MeemIDNotFound();
		}

		for (uint256 i = 0; i < s.ids[idx].twitters.length; i++) {
			if (
				LibStrings.compareStrings(
					s.ids[idx].twitters[i],
					twitterIdToRemove
				)
			) {
				s.ids[idx].twitters = LibArray.removeStringAt(
					s.ids[idx].twitters,
					i
				);

				delete s.twitterIdIndex[twitterIdToRemove];
			}
		}

		if (
			LibStrings.compareStrings(
				s.ids[idx].defaultTwitter,
				twitterIdToRemove
			)
		) {
			s.ids[idx].defaultTwitter = s.ids[idx].twitters[0];
		}
	}
}

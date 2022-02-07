// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

struct MeemID {
	address[] wallets;
	string[] twitters;
	address defaultWallet;
	string defaultTwitter;
}

interface IMeemID {
	function createOrAddMeemID(address addy, string memory twitterId) external;

	function removeWalletAddressByWalletAddress(
		address lookupWalletAddress,
		address addressToRemove
	) external;

	function removeWalletAddressByTwitterId(
		string memory twitterId,
		address addressToRemove
	) external;

	function removeTwitterIdByWalletAddress(
		address lookupWalletAddress,
		string memory twitterIdToRemove
	) external;

	function removeTwitterIdByTwitterId(
		string memory lookupTwitterId,
		string memory twitterIdToRemove
	) external;

	function getMeemIDByWalletAddress(address addy)
		external
		view
		returns (MeemID memory);

	function getMeemIDByTwitterId(string memory twitterId)
		external
		view
		returns (MeemID memory);
}

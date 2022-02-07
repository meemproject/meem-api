// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
*
* Implementation of a diamond.
/******************************************************************************/

import '@solidstate/contracts/proxy/diamond/Diamond.sol';
import '@solidstate/contracts/introspection/ERC165.sol';

contract MeemIdDiamond is Diamond {
	using ERC165Storage for ERC165Storage.Layout;

	constructor() {}
}

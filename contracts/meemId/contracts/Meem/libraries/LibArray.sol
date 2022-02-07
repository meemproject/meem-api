// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {IndexOutOfRange} from './Errors.sol';

library LibArray {
	function removeStringAt(string[] storage array, uint256 index)
		internal
		returns (string[] memory)
	{
		if (index >= array.length) {
			revert('Index out of range');
		}

		for (uint256 i = index; i < array.length - 1; i++) {
			array[i] = array[i + 1];
		}
		array.pop();
		return array;
	}

	function removeAddressAt(address[] storage array, uint256 index)
		internal
		returns (address[] memory)
	{
		if (index >= array.length) {
			revert('Index out of range');
		}

		for (uint256 i = index; i < array.length - 1; i++) {
			array[i] = array[i + 1];
		}
		array.pop();
		return array;
	}

	function removeUintAt(uint256[] storage array, uint256 index)
		internal
		returns (uint256[] memory)
	{
		if (index >= array.length) {
			revert('Index out of range');
		}

		for (uint256 i = index; i < array.length - 1; i++) {
			array[i] = array[i + 1];
		}
		array.pop();
		return array;
	}
}

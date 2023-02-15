// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import {Babylonian} from './libraries/Babylonian.sol';
import {FixedPoint} from './libraries/FixedPoint.sol';
import {UniswapV2OracleLibrary} from './libraries/UniswapV2OracleLibrary.sol';
import {ISwapPair} from './interfaces/ISwapPair.sol';

contract Oracle {

    using FixedPoint for *;

    address public admin;

    uint256 public PERIOD = 10 minutes;

    ISwapPair public pair;
    address public token0;
    address public token1;

    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;
    uint32 public blockTimestampLast;
    FixedPoint.uq112x112 public price0Average;
    FixedPoint.uq112x112 public price1Average;

    constructor() {
        admin = msg.sender;
    }

    function init(address _pair) external {
        require(msg.sender == admin, "not admin");
        pair = ISwapPair(_pair);
        token0 = pair.token0();
        token1 = pair.token1();
        price0CumulativeLast = pair.price0CumulativeLast(); // fetch the current accumulated price value (1 / 0)
        price1CumulativeLast = pair.price1CumulativeLast(); // fetch the current accumulated price value (0 / 1)
        uint112 reserve0;
        uint112 reserve1;
        (reserve0, reserve1, blockTimestampLast) = pair.getReserves();
        require(reserve0 != 0 && reserve1 != 0, 'Oracle: NO_RESERVES'); // ensure that there's liquidity in the pair
    }

    function setPeriod(uint256 _period) external {
        require(msg.sender == admin, "not admin");
        PERIOD = _period;
    }

    /** @dev Updates 1-day EMA price from Uniswap.  */
    function update() external {
        (
            uint256 price0Cumulative,
            uint256 price1Cumulative,
            uint32 blockTimestamp
        ) = UniswapV2OracleLibrary.currentCumulativePrices(address(pair));
        uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired

        if (timeElapsed < PERIOD) {
            // doesn't need to be updated, since a minimum period is not elapsed yet
            return;
        }

        // overflow is desired, casting never truncates
        // cumulative price is in (uq112x112 price * seconds) units so we simply wrap it after division by time elapsed
        price0Average = FixedPoint.uq112x112(
            uint224((price0Cumulative - price0CumulativeLast) / timeElapsed)
        );
        price1Average = FixedPoint.uq112x112(
            uint224((price1Cumulative - price1CumulativeLast) / timeElapsed)
        );

        price0CumulativeLast = price0Cumulative;
        price1CumulativeLast = price1Cumulative;
        blockTimestampLast = blockTimestamp;

        emit Updated(price0Cumulative, price1Cumulative);
    }

    // note this will always return 0 before update has been called successfully for the first time.
    function consult(address token, uint256 amountIn)
        external
        view
        returns (uint144 amountOut)
    {
        if (token == token0) {
            amountOut = price0Average.mul(amountIn).decode144();
        } else {
            require(token == token1, 'Oracle: INVALID_TOKEN');
            amountOut = price1Average.mul(amountIn).decode144();
        }
    }

    event Updated(uint256 price0CumulativeLast, uint256 price1CumulativeLast);
}
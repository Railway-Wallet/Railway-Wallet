import { NetworkName } from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LiquidityV2PoolSerialized } from "../../models/liquidity-pool";
import { compareTokenAddress } from "../../utils";
import { logDevRedux } from "../../utils/logging";

export type NetworkLiquidityPoolsPayload = {
  networkName: NetworkName;
  liquidityPools: LiquidityV2PoolSerialized[];
};

export type UpdateLiqudityPoolPayload = {
  networkName: NetworkName;
  liquidityPool: LiquidityV2PoolSerialized;
};

export type LiquidityState = {
  allPools: LiquidityV2PoolSerialized[];
  updatedAt: Optional<number>;
};

export type NetworkLiquidityState = {
  forNetwork: MapType<LiquidityState>;
};

const initialState = {
  forNetwork: {},
} as NetworkLiquidityState;

const slice = createSlice({
  name: "liquidity",
  initialState,
  reducers: {
    updateLiquidityPools(
      state,
      action: PayloadAction<NetworkLiquidityPoolsPayload>
    ) {
      const { networkName, liquidityPools } = action.payload;

      state.forNetwork[networkName] = {
        allPools: liquidityPools,
        updatedAt: Date.now(),
      };

      logDevRedux(`Update all liquidity pools: ${networkName}`);
      logDevRedux(state.forNetwork[networkName]);
    },
    updateLiquidityPool(
      state,
      action: PayloadAction<UpdateLiqudityPoolPayload>
    ) {
      const { networkName, liquidityPool: updatedLiquidityPool } =
        action.payload;

      const networkLiquidityState: LiquidityState = state.forNetwork[
        networkName
      ] ?? {
        allPools: [],
        updatedAt: Date.now(),
      };

      const filteredPoolList = networkLiquidityState.allPools.filter(
        (lp) =>
          !compareTokenAddress(lp.pairAddress, updatedLiquidityPool.pairAddress)
      );

      state.forNetwork[networkName] = {
        allPools: [...filteredPoolList, updatedLiquidityPool],
        updatedAt: networkLiquidityState.updatedAt,
      };

      logDevRedux(`Update liquidity pool: ${networkName}`);
      logDevRedux(state.forNetwork[networkName]);
    },
  },
});

export const { updateLiquidityPools, updateLiquidityPool } = slice.actions;
export const liquidityReducer = slice.reducer;

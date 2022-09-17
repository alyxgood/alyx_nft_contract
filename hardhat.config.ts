import * as dotenv from "dotenv";
import {HardhatUserConfig, task} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";


dotenv.config();

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});



const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      accounts: {
        accountsBalance: "100000000000000000000000000"
      }
    },

    matic: {
      url: process.env.RPC_URL?process.env.RPC_URL:"",
      chainId: 137,
      gasMultiplier: 1.5,
      accounts: {
        mnemonic: process.env.PRIVATE_MNEMONIC ? process.env.PRIVATE_MNEMONIC : "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10
      }
    },
  }
};

export default config;

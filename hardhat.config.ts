import * as dotenv from "dotenv";
import {HardhatUserConfig, task} from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import 'hardhat-deploy';
import mintMockUSDT from "./scripts/tasks/mintMockUSDT";
import auditLevelBot from "./scripts/tasks/auditLevelBot";


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
  namedAccounts: {
    deployer1: 0,
    deployer2: 1,
    owner1: 2,
    owner2: 3,
    proxy_admin1: 4,
    proxy_admin2: 5,
    team_addr: 6,
    user1: 7,
    user2: 8,
    user3: 9,
    user4: 10,
    user5: 11,
    user6: 12
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
    mumbai: {
      url: process.env.MUMBAI_RPC,
      chainId: 80001,
      gasMultiplier: 1.5,
      accounts: {
        mnemonic: process.env.MNEMONIC_MUMBAI ? process.env.MNEMONIC_MUMBAI : "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 14
      }
    },
    alyx: {
      url: process.env.ALYX_RPC,
      chainId: 1314,
      gasMultiplier: 1.5,
      accounts: {
        mnemonic: process.env.MNEMONIC_ALYX ? process.env.MNEMONIC_ALYX : "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 14
      }
    },
    alyx_test: {
      url: process.env.ALYX_RPC,
      chainId: 1314,
      gasMultiplier: 1.5,
      accounts: {
        mnemonic: process.env.MNEMONIC_ALYX ? process.env.MNEMONIC_ALYX : "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 14
      }
    },
    alyx_prod: {
      url: process.env.ALYX_RPC,
      chainId: 1314,
      gasMultiplier: 1.5,
      accounts: {
        mnemonic: process.env.MNEMONIC_ALYX ? process.env.MNEMONIC_ALYX : "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 14
      }
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC,
      chainId: 11155111,
      gasMultiplier: 1.5,
      accounts: {
        mnemonic: process.env.MNEMONIC_SEPOLIA ? process.env.MNEMONIC_SEPOLIA : "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 14
      }
    }
  },
  gasReporter: {
    enabled: (process.env.REPORT_GAS) ? true : false
  },
  mocha: {
    timeout: 5000000
  }
};

export default config;

task("mint-mock-usdt", "Mint mock USDT", mintMockUSDT);
task("auto-audit", "auto audit level", auditLevelBot);

import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {MockERC20} from "../typechain-types";
import {ENV_FIX, get_env} from "../test/start_up";
import {PROD_EVN} from "../constants/constants";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const {deployments, ethers, getNamedAccounts} = hre;
    const {deploy} = deployments;

    const {deployer1} = await getNamedAccounts();

    let env: ENV_FIX = get_env()
    if (env.environment !== PROD_EVN) {
        await deploy('mock_usdt', {
            from: deployer1,
            args: ["MOCK USDT", "mUSDT", 6],
            log: true,
            contract: "MockERC20"
        });
    }
};
export default func;
func.tags = ['MockERC20'];

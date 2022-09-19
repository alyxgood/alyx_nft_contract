import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {MockERC20} from "../typechain-types";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const {deployments, ethers, getNamedAccounts} = hre;
    const {deploy} = deployments;

    const {deployer1} = await getNamedAccounts();

    await deploy('mock_usdc', {
        from: deployer1,
        args: ["usdc", "mock_usdc", 6],
        log: true,
        contract: "MockERC20"
    });


};
export default func;
func.tags = ['MockERC20'];

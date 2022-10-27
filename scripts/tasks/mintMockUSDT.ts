import {HardhatRuntimeEnvironment, TaskArguments} from "hardhat/types";

const main = async (
    _taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment
) => {
    const deploymentsMockUSDT = await hre.deployments.get("mock_usdt")
    const MockUSDT = await hre.ethers.getContractFactory('MockERC20')
    const mockUSDT = await MockUSDT.attach(deploymentsMockUSDT.address)
    const tx = await mockUSDT.mint('0x', hre.ethers.utils.parseEther('10000'))
    await tx.wait()
}

export default main
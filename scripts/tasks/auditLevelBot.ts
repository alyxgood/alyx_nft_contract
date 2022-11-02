import {HardhatRuntimeEnvironment, TaskArguments} from "hardhat/types";

const main = async (
    _taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment
) => {
    const logs = await hre.ethers.provider.getLogs({
        fromBlock: 178041,
        toBlock: 178041
    })

    const deploymentsMockUSDT = await hre.deployments.get("mock_usdt")
    // console.log(deploymentsMockUSDT.receipt?.blockNumber)

    const MockUSDT = await hre.ethers.getContractFactory('MockERC20')
    for (let index = 0; index < logs.length; index++) {
        if (logs[index].address === deploymentsMockUSDT.address) {
            const transfer = MockUSDT.interface.parseLog(logs[index])
            if (transfer == null) {
                console.log('null')
            } else {
                console.log(transfer)
            }
        }
    }
}

export default main
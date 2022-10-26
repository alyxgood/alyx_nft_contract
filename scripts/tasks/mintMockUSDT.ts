import {HardhatRuntimeEnvironment, TaskArguments} from "hardhat/types";

const main = async (
    _taskArgs: TaskArguments,
    hre: HardhatRuntimeEnvironment
) => {
    // const deploymentsMockUSDT = await hre.deployments.get("mock_usdt")
    // const MockUSDT = await hre.ethers.getContractFactory('MockERC20')
    // const mockUSDT = await MockUSDT.attach(deploymentsMockUSDT.address)
    // const tx = await mockUSDT.mint('0x393E62575B5a72c6998F293468d48Cf7c7eeBFce', hre.ethers.utils.parseEther('10000'))
    // await tx.wait()

    const DB = await hre.ethers.getContractFactory('DBContract')
    const db = await DB.attach('0x36D562000a11476A78105D4f72A50Dc572927678')
    await db.connect((await hre.ethers.getSigners())[6]).setAddresses([
        '0x9Fe3A936E4FEA895627060FC83a0041CbfA67B6e',
        '0x02c6b35E8d4A26C4e02c868fE3b0d78071B09B14',
        '0x92585A0Bd0E9A9c979B693e6fdda8d431AE42141',
        '0x091930c7949816b6EcB557B54c9d5175a5063520',
        '0x80CB49ee8da5D2177867075dDe3723E57eDBaF8D',
        '0x1133Bd3962008F207D1832f559C9957187a6278d',
        '0x1dA874E79ac69645D824a26635F3dA20B46a54f2',
        '0xC9a19Bea912B06bBf383bc0DCA642b851204b1b0',
        (await hre.ethers.getSigners())[7].address,
    ])
}

export default main
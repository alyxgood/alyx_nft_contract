import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {MockERC20} from "../typechain-types";
import {get_user, USER_FIX} from "../test/start_up";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const {deployments, ethers, getNamedAccounts} = hre
    const {deploy} = deployments
    let users: USER_FIX = await get_user()

    const mockUSDTAddress = (await deployments.get('mock_usdc')).address

    let initData = '0x'
    // deploy db logic
    const dbLogic = await deploy(
        'DBContract_Logic',
        {
            from: users.deployer1.address,
            args: [mockUSDTAddress],
            log: true,
            contract: 'DBContract'
        }
    )

    const dbProxy = await deploy(
        'DBContract_Proxy',
        {
            from: users.owner1.address,
            args: [dbLogic.address, users.proxy_admin1.address, initData],
            log: true,
            contract: 'LYNKProxy'
        }
    )

    // deploy tokens
    const apTokenLogic = await deploy(
        'APToken_Logic',
        {
            from: users.deployer1.address,
            args: [dbProxy.address],
            log: true,
            contract: 'APToken'
        }
    )

    const APToken = await ethers.getContractFactory('APToken')
    initData = APToken.interface.encodeFunctionData('__APToken_init')
    const apTokenProxy = await deploy(
        'APToken_Proxy',
        {
            from: users.owner1.address,
            args: [apTokenLogic.address, users.proxy_admin1.address, initData],
            log: true,
            contract: 'LYNKProxy'
        }
    )

    const lynkTokenLogic = await deploy(
        'LYNKToken_Logic',
        {
            from: users.deployer1.address,
            args: [dbProxy.address],
            log: true,
            contract: 'LYNKToken'
        }
    )

    const LYNKToken = await ethers.getContractFactory('LYNKToken')
    initData = LYNKToken.interface.encodeFunctionData('__LYNKToken_init')
    const lynkTokenProxy = await deploy(
        'LYNKToken_Proxy',
        {
            from: users.owner1.address,
            args: [lynkTokenLogic.address, users.proxy_admin1.address, initData],
            log: true,
            contract: 'LYNKProxy'
        }
    )

    const lxnkNFTLogic = await deploy(
        'LYNKNFT_Logic',
        {
            from: users.deployer1.address,
            args: [dbProxy.address],
            log: true,
            contract: 'LYNKNFT'
        }
    )

    const LYNKNFT = await ethers.getContractFactory('LYNKNFT')
    initData = LYNKNFT.interface.encodeFunctionData('__LYNKNFT_init')
    const lynkNFTProxy = await deploy(
        'LYNKNFT_Proxy',
        {
            from: users.owner1.address,
            args: [lxnkNFTLogic.address, users.proxy_admin1.address, initData],
            log: true,
            contract: 'LYNKProxy'
        }
    )

    const BNFT = await ethers.getContractFactory('BNFT')
    const bTokenLogic = await deploy(
        'BNFT_Logic',
        {
            from: users.deployer1.address,
            log: true,
            contract: 'BNFT'
        }
    )

    initData = BNFT.interface.encodeFunctionData(
        'initialize',
        [
            lynkNFTProxy.address,
            'Staking LYNK',
            'sLYNK'
        ]
    )
    const sLYNKNFTProxy = await deploy(
        'sLYNKNFT_Proxy',
        {
            from: users.owner1.address,
            args: [bTokenLogic.address, users.proxy_admin1.address, initData],
            log: true,
            contract: 'LYNKProxy'
        }
    )

    initData = BNFT.interface.encodeFunctionData(
        'initialize',
        [
            lynkNFTProxy.address,
            'List LYNK',
            'lLYNK'
        ]
    )
    const lLYNKTokenProxy = await deploy(
        'lLYNKNFT_Proxy',
        {
            from: users.owner1.address,
            args: [bTokenLogic.address, users.proxy_admin1.address, initData],
            log: true,
            contract: 'LYNKProxy'
        }
    )

    // deploy user
    const userLogic = await deploy(
        'User_Logic',
        {
            from: users.deployer1.address,
            args: [dbProxy.address],
            log: true,
            contract: 'User'
        }
    )

    const User = await ethers.getContractFactory('User')
    initData = User.interface.encodeFunctionData('__User_init')
    const userProxy = await deploy(
        'User_Proxy',
        {
            from: users.owner1.address,
            args: [userLogic.address, users.proxy_admin1.address, initData],
            log: true,
            contract: 'LYNKProxy'
        }
    )

    // deploy staking
    const stakingLogic = await deploy(
        'Staking_Logic',
        {
            from: users.deployer1.address,
            args: [dbProxy.address],
            log: true,
            contract: 'Staking'
        }
    )

    const Staking = await ethers.getContractFactory('Staking')
    initData = Staking.interface.encodeFunctionData('__Staking_init')
    const stakingProxy = await deploy(
        'Staking_Proxy',
        {
            from: users.owner1.address,
            args: [stakingLogic.address, users.proxy_admin1.address, initData],
            log: true,
            contract: 'LYNKProxy'
        }
    )

    // deploy market
    const marketLogic = await deploy(
        'Market_Logic',
        {
            from: users.deployer1.address,
            args: [dbProxy.address],
            log: true,
            contract: 'Market'
        }
    )

    const Market = await ethers.getContractFactory('Market')
    initData = Market.interface.encodeFunctionData('__Market_init')
    const marketProxy = await deploy(
        'Market_Proxy',
        {
            from: users.owner1.address,
            args: [marketLogic.address, users.proxy_admin1.address, initData],
            log: true,
            contract: 'LYNKProxy'
        }
    )

    // init db contract
    try {
        const tx = await dbProxy.connect(users.owner1).__DBContract_init([
            lynkTokenProxy.address,
            apTokenProxy.address,
            stakingProxy.address,
            lynkNFTProxy.address,
            sLYNKNFTProxy.address,
            lLYNKTokenProxy.address,
            marketProxy.address,
            userProxy.address,
            users.team_addr,
        ])
        await tx.wait()
    } catch (e: any) {
        console.log(e.reason)
    }
}

export default func
func.tags = ['test_net']
func.dependencies = ['MockERC20']

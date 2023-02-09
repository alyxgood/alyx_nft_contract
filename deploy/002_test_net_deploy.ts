import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DBContract, MockERC20} from "../typechain-types";
import {ENV_FIX, get_env, get_user, USER_FIX} from "../test/start_up";
import {PROD_EVN, TEST_EVN} from "../constants/constants";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const {deployments, ethers, getNamedAccounts} = hre
    const {deploy} = deployments
    let users: USER_FIX = await get_user()
    let env: ENV_FIX = get_env()

    let USDTAddress = env.USDT_ADDRESS
    if (env.environment === TEST_EVN) {
        USDTAddress = (await deployments.get('mock_usdt')).address
    }

    const dbProxy = await deploy(
        'DBContract',
        {
            args: [USDTAddress],
            from: users.owner1.address,
            log: true,
            proxy: {
                owner: users.proxy_admin1.address,
                proxyContract: 'LYNKProxy',
            }
        }
    )

    const apTokenProxy = await deploy(
        'APToken',
        {
            from: users.owner1.address,
            args: [dbProxy.address],
            log: true,
            proxy: {
                owner: users.proxy_admin1.address,
                proxyContract: 'LYNKProxy',
                execute: {
                    init: {
                        methodName: '__APToken_init',
                        args: []
                    }
                }
            }
        }
    )

    const lynkTokenProxy = await deploy(
        'LYNKToken',
        {
            contract: 'LRTToken',
            from: users.owner1.address,
            args: [dbProxy.address],
            log: true,
            proxy: {
                owner: users.proxy_admin1.address,
                proxyContract: 'LYNKProxy',
                execute: {
                    init: {
                        methodName: '__LRTToken_init',
                        args: []
                    }
                }
            }
        }
    )

    const alyxTokenProxy = await deploy(
        'ALYXToken',
        {
            contract: 'LYNKToken',
            from: users.owner1.address,
            args: [dbProxy.address],
            log: true,
            proxy: {
                owner: users.proxy_admin1.address,
                proxyContract: 'LYNKProxy',
                execute: {
                    init: {
                        methodName: '__LYNKToken_init',
                        args: []
                    }
                }
            }
        }
    )

    const lynkNFTProxy = await deploy(
        'LYNKNFT',
        {
            from: users.owner1.address,
            args: [dbProxy.address],
            log: true,
            proxy: {
                owner: users.proxy_admin1.address,
                proxyContract: 'LYNKProxy',
                execute: {
                    init: {
                        methodName: '__LYNKNFT_init',
                        args: []
                    }
                }
            }
        }
    )

    const sLYNKNFTProxy = await deploy(
        'sLYNKNFT',
        {
            contract: 'BNFT',
            from: users.owner1.address,
            log: true,
            proxy: {
                owner: users.proxy_admin1.address,
                proxyContract: 'LYNKProxy',
                execute: {
                    init: {
                        methodName: 'initialize',
                        args: [
                            lynkNFTProxy.address,
                            'Staking LYNK',
                            'sLYNK'
                        ]
                    }
                }
            }
        }
    )

    const lLYNKTokenProxy = await deploy(
        'lLYNKNFT',
        {
            contract: 'BNFT',
            from: users.owner1.address,
            log: true,
            proxy: {
                owner: users.proxy_admin1.address,
                proxyContract: 'LYNKProxy',
                execute: {
                    init: {
                        methodName: 'initialize',
                        args: [
                            lynkNFTProxy.address,
                            'List LYNK',
                            'lLYNK'
                        ]
                    }
                }
            }
        }
    )

    const userProxy = await deploy(
        'User',
        {
            from: users.owner1.address,
            args: [dbProxy.address],
            log: true,
            proxy: {
                owner: users.proxy_admin1.address,
                proxyContract: 'LYNKProxy',
                execute: {
                    init: {
                        methodName: '__User_init',
                        args: []
                    }
                }
            }
        }
    )

    const stakingProxy = await deploy(
        'Staking',
        {
            from: users.owner1.address,
            args: [dbProxy.address],
            log: true,
            proxy: {
                owner: users.proxy_admin1.address,
                proxyContract: 'LYNKProxy',
                execute: {
                    init: {
                        methodName: '__Staking_init',
                        args: []
                    }
                }
            }
        }
    )

    const marketProxy = await deploy(
        'Market',
        {
            from: users.owner1.address,
            args: [dbProxy.address],
            log: true,
            proxy: {
                owner: users.proxy_admin1.address,
                proxyContract: 'LYNKProxy',
                execute: {
                    init: {
                        methodName: '__Market_init',
                        args: []
                    }
                }
            }
        }
    )

    await deploy(
        'Swap',
        {
            from: users.owner1.address,
            args: [dbProxy.address],
            log: true,
            proxy: {
                owner: users.proxy_admin1.address,
                proxyContract: 'LYNKProxy',
                execute: {
                    init: {
                        methodName: '__Swap_init',
                        args: []
                    }
                }
            }
        }
    )

    // init db contract

    let dbProxyAttached = <DBContract> await (await ethers.getContractFactory('DBContract')).attach(dbProxy.address)
        if (await dbProxyAttached.LYNKNFT() === ethers.constants.AddressZero) {
            console.log('init the db contract...')
            let teamAddr = users.team_addr.address
            if (env.environment === PROD_EVN) {
                teamAddr = env.TEAM_ADDRESS
            }
            const tx = await dbProxyAttached.connect(users.owner1).__DBContract_init([
                lynkTokenProxy.address,
                apTokenProxy.address,
                stakingProxy.address,
                lynkNFTProxy.address,
                sLYNKNFTProxy.address,
                lLYNKTokenProxy.address,
                marketProxy.address,
                userProxy.address,
                teamAddr,
            ])
            await tx.wait()
        }

}

export default func
func.tags = ['test_net']
func.dependencies = ['MockERC20']

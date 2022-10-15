import {
    CONTRACT_FIX,
    CONTRACT_STATE,
    ENV_FIX, get_contract_state,
    get_user,
    get_env,
    set_up_fixture,
    set_up_level,
    USER_FIX, USER_LEVEL_FIX
} from "./start_up";

describe("main_process", function () {
    let state: CONTRACT_STATE
    let envs: ENV_FIX
    let users: USER_FIX
    let contracts: CONTRACT_FIX
    let levels: USER_LEVEL_FIX

    beforeEach(async () => {
        console.log('start test1...');
        state = get_contract_state()
        envs = get_env()
        users = await get_user()
        contracts = await set_up_fixture("test_net")
        levels = await set_up_level(contracts, envs, users, state)
    });


    describe('main_process_1', () => {
        it("main_process1111", async function () {
            console.log('start test2...')
        })
    })
});

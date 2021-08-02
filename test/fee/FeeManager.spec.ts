import { ethers, waffle } from 'hardhat'
import chai, { expect } from 'chai'
import { getFixtures } from '../shared/fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { DAO, Workhard, IDividendPool__factory } from '@workhard/protocol'
import { FeeManager, fm } from '../../src/'
import { keccak256, parseEther, toUtf8Bytes } from 'ethers/lib/utils'

chai.use(waffle.solidity)

const MAINNET_DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const MAINNET_1INCH = '0x11111112542d85b3ef69ae05771c2dccff4faa26'
const MAINNET_WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

describe('FeeManager.sol', () => {
  let snapshot: string
  let gov: SignerWithAddress, executor: SignerWithAddress
  let forkedDAO: DAO
  let workhard: Workhard
  let feeManager: FeeManager

  before(async () => {
    ;[gov, executor] = await ethers.getSigners()
    // Please run this process via WHF UI on public network when u try to deploy your DAO.
    // Visit https://workhard.finance/tutorial/fork
    const fixtures = await getFixtures({
      wallet: gov,
      param: {
        forkParam: {
          multisig: gov.address,
          treasury: gov.address,
          baseCurrency: MAINNET_DAI, // todo update to dai
          projectName: 'Workhard Forked Dev',
          projectSymbol: 'WFK',
          visionName: 'Flovoured Vision',
          visionSymbol: 'fVISION',
          commitName: 'Flavoured Commit',
          commitSymbol: 'fCOMMIT',
          rightName: 'Flavoured Right',
          rightSymbol: 'fRIGHT',
          emissionStartDelay: 86400 * 7,
          minDelay: 86400,
          voteLaunchDelay: 86400 * 7 * 4,
          initialEmission: parseEther('24000000'),
          minEmissionRatePerWeek: 60,
          emissionCutRate: 3000,
          founderShare: 500,
        },
        launchParam: {
          commitMiningWeight: 4750,
          liquidityMiningWeight: 4750,
          treasuryWeight: 499,
          callerBonus: 1,
        },
      },
    })
    forkedDAO = fixtures.forkedDAO
    workhard = fixtures.workhard
    // Deploying your own contracts for testing
    feeManager = (await (
      await ethers.getContractFactory('FeeManager')
    ).deploy(gov.address, forkedDAO.dividendPool.address, MAINNET_DAI, MAINNET_WETH)) as FeeManager
    // Setup roles
    await feeManager.connect(gov).grantRole(keccak256(toUtf8Bytes('DEX_ROLE')), MAINNET_1INCH)
    await feeManager.connect(gov).grantRole(keccak256(toUtf8Bytes('EXECUTOR_ROLE')), executor.address)
  })
  beforeEach(async () => {
    snapshot = await ethers.provider.send('evm_snapshot', [])
  })
  afterEach(async () => {
    await ethers.provider.send('evm_revert', [snapshot])
  })

  describe('swap erc20 token to the reward token & distribute it to the dividend pool', async () => {
    it('should distribute the WETH to the dividend pool contract', async () => {
      expect(
        await IDividendPool__factory.connect(forkedDAO.dividendPool.address, ethers.provider).totalDistributed(
          MAINNET_DAI
        )
      ).to.eq(0)
      await gov.sendTransaction({ to: feeManager.address, value: parseEther('100') })
      const swapData = await fm.getOneInchSwapData(
        MAINNET_WETH,
        MAINNET_DAI,
        parseEther('1').toString(),
        feeManager.address, // should be feeManager.address in the production version
        1
      )
      await feeManager.connect(executor).swap(swapData.to, MAINNET_WETH, parseEther('1'), swapData.data)
      expect(
        await IDividendPool__factory.connect(forkedDAO.dividendPool.address, ethers.provider).totalDistributed(
          MAINNET_DAI
        )
      ).not.to.eq(0)
    })
  })
})

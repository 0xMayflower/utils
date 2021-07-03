import { ethers, waffle } from 'hardhat'
import chai, { expect } from 'chai'
import { getFixtures } from './shared/fixtures'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { DAO, Workhard } from '@workhard/protocol'
import { App } from '../src/types'
import { parseEther } from 'ethers/lib/utils'

chai.use(waffle.solidity)

const MAINNET_DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

describe('App spec test', () => {
  let snapshot: string
  let wallet: SignerWithAddress, other: SignerWithAddress
  let forkedDAO: DAO
  let workhard: Workhard
  let app: App

  before(async () => {
    ;[wallet, other] = await ethers.getSigners()
    // Please run this process via WHF UI on public network when u try to deploy your DAO.
    // Visit https://workhard.finance/tutorial/fork
    const fixtures = await getFixtures({
      wallet,
      param: {
        forkParam: {
          multisig: wallet.address,
          treasury: wallet.address,
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
    app = (await (
      await ethers.getContractFactory('App')
    ).deploy(forkedDAO.dividendPool.address, workhard.commons.weth.address)) as App
  })
  beforeEach(async () => {
    snapshot = await ethers.provider.send('evm_snapshot', [])
  })
  afterEach(async () => {
    await ethers.provider.send('evm_revert', [snapshot])
  })

  describe('buy', async () => {
    it('should distribute the WETH to the dividend pool contract', async () => {
      expect(await forkedDAO.dividendPool.totalDistributed(workhard.commons.weth.address)).to.eq(0)
      await app.buy({ value: parseEther('100') })
      expect(await forkedDAO.dividendPool.totalDistributed(workhard.commons.weth.address)).to.eq(parseEther('100'))
    })
  })
})

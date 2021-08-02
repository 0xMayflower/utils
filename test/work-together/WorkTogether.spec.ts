import { ethers, waffle } from 'hardhat'
import chai, { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import {
  IssueManager,
  IssueManager__factory,
  RNGBlockhash,
  RNGBlockhash__factory,
  Ticket,
  Ticket__factory,
  WorkTogetherPool,
  WorkTogetherPoolManager,
  WorkTogetherPoolManager__factory,
} from '../../src'
import { goTo } from '../utils/utilities'
import { BigNumber } from 'ethers'
import exp = require('constants')

chai.use(waffle.solidity)

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

describe('WorkTogether', () => {
  let snapshot: string
  let gov: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress
  let ticket: Ticket
  let rewardToken: Ticket
  let rng: RNGBlockhash
  let poolManager: WorkTogetherPoolManager
  let issueManager: IssueManager

  before(async () => {
    ;[gov, user1, user2] = await ethers.getSigners()

    //sortition summ tree library
    const treeLibraryFactory = await ethers.getContractFactory('SortitionSumTreeFactory')
    const treeLibrary = await treeLibraryFactory.connect(gov).deploy()

    //pool manager
    const poolManagerFactory: WorkTogetherPoolManager__factory = await ethers.getContractFactory(
      'WorkTogetherPoolManager',
      { libraries: { SortitionSumTreeFactory: treeLibrary.address } }
    )
    poolManager = await poolManagerFactory.connect(gov).deploy()

    // issue manager
    const issueManagerFactory: IssueManager__factory = await ethers.getContractFactory('IssueManager')
    issueManager = await issueManagerFactory.connect(gov).deploy()

    //ticket and reward token(ERC20)
    const ticketFactory: Ticket__factory = await ethers.getContractFactory('Ticket')
    ticket = await ticketFactory.connect(gov).deploy(issueManager.address)
    rewardToken = await ticketFactory.connect(gov).deploy(gov.address)

    //init issue manager with deployed ticket
    await issueManager.connect(gov).initTicket(ticket.address)

    //random number generator factory
    const rngFactory: RNGBlockhash__factory = (await ethers.getContractFactory('RNGBlockhash')) as RNGBlockhash__factory
    rng = await rngFactory.connect(gov).deploy()
  })
  describe('IssueManager', async () => {
    beforeEach(async () => {
      snapshot = await ethers.provider.send('evm_snapshot', [])
    })

    afterEach(async () => {
      await ethers.provider.send('evm_revert', [snapshot])
    })
    describe('registerIssue()', () => {
      it('should register issue', async () => {
        await issueManager.connect(gov).registerIssue(100, 10)

        expect(await issueManager.issues(100)).to.be.deep.eq([BigNumber.from(100), BigNumber.from(10), ZERO_ADDRESS])
        expect(await ticket.balanceOf(issueManager.address)).to.be.eq(10)
      })
      it('should not register issue when id is duplicated', async () => {
        await issueManager.connect(gov).registerIssue(100, 10)

        await expect(issueManager.registerIssue(100, 10)).to.be.revertedWith('IssueManager/already registered')
      })
    })
    describe('claimResolveIssue()', () => {
      it('should not claim when issue is not registered', async () => {
        await expect(issueManager.claimResolveIssue(100, 'i solve this issue')).to.be.revertedWith(
          'IssueManager/not registered'
        )
      })
      it('should  claim when issue is registered', async () => {
        await issueManager.connect(gov).registerIssue(100, 10)
        await expect(issueManager.connect(gov).claimResolveIssue(100, 'i solve this issue'))
          .to.emit(issueManager, 'IssueClaimed')
          .withArgs(100, gov.address, 'i solve this issue')
      })
    })
    describe('selectResolver()', () => {
      it('should not able to select non claimed resolver', async () => {
        await issueManager.connect(gov).registerIssue(100, 10)
        await issueManager.connect(gov).claimResolveIssue(100, 'i solve this issue')

        await expect(issueManager.connect(gov).selectIssueResolver(100, user1.address)).to.be.revertedWith(
          'IssueManager/this address does not claimed'
        )
      })

      it('should select resolver', async () => {
        await issueManager.connect(gov).registerIssue(100, 10)
        await issueManager.connect(gov).claimResolveIssue(100, 'i solve this issue')

        await expect(issueManager.connect(gov).selectIssueResolver(100, gov.address))
          .to.emit(issueManager, 'IssueResolved')
          .withArgs(100, gov.address)
      })

      it('should not select resolver when already resolved', async () => {
        await issueManager.connect(gov).registerIssue(100, 10)
        await issueManager.connect(gov).claimResolveIssue(100, 'i solve this issue')
        await issueManager.connect(gov).selectIssueResolver(100, gov.address)

        await expect(issueManager.connect(gov).selectIssueResolver(100, gov.address)).to.be.revertedWith(
          'IssueManager/issue already solved'
        )
      })
    })
    describe('mintTo()', () => {
      beforeEach(async () => {
        snapshot = await ethers.provider.send('evm_snapshot', [])
      })

      afterEach(async () => {
        await ethers.provider.send('evm_revert', [snapshot])
      })
      it('should not mint when she is not admin', async () => {
        await expect(issueManager.connect(user1).mintTo(100, gov.address)).to.be.revertedWith('IssueManager/only-admin')
      })
      it('should mint when she is not admin', async () => {
        await expect(issueManager.connect(gov).mintTo(100, gov.address))
          .to.emit(ticket, 'Transfer')
          .withArgs(ZERO_ADDRESS, gov.address, 100)
      })
    })
  })

  describe('WorkTogetherPoolManager', async () => {
    const now = Math.floor(Date.now() / 1000)
    beforeEach(async () => {
      snapshot = await ethers.provider.send('evm_snapshot', [])
      await poolManager
        .connect(gov)
        .createTokenRewardPool(
          ticket.address,
          rewardToken.address,
          rewardToken.address,
          rng.address,
          'POOL1',
          now - 1000,
          1000
        )
    })
    afterEach(async () => {
      await ethers.provider.send('evm_revert', [snapshot])
    })
    describe('createTokenRewardPool', () => {
      it('should create pool', async () => {
        const newPool = (await ethers.getContractAt(
          'WorkTogetherPool',
          await poolManager.getPoolAddressOf(await poolManager.getSizeOfPool())
        )) as WorkTogetherPool

        expect(newPool.address).to.be.not.eq(ZERO_ADDRESS)
      })
    })
    describe('getPoolAddressOf', () => {
      it('should get address', async () => {
        expect(await poolManager.getPoolAddressOf(1)).to.be.not.eq(ZERO_ADDRESS)
      })
    })
    describe('getSizeOfPool', () => {
      it('should get size', async () => {
        expect(await poolManager.getSizeOfPool()).to.be.eq(1)
      })
    })
  })

  describe('Pool', async () => {
    let pool: WorkTogetherPool

    before('set pool', async () => {
      let now = Math.floor(Date.now() / 1000)
      await poolManager
        .connect(gov)
        .createTokenRewardPool(
          ticket.address,
          rewardToken.address,
          rewardToken.address,
          rng.address,
          'POOL1',
          now - 1000,
          1000
        )
      pool = (await ethers.getContractAt(
        'WorkTogetherPool',
        await poolManager.getPoolAddressOf(await poolManager.getSizeOfPool())
      )) as WorkTogetherPool
    })

    beforeEach(async () => {
      snapshot = await ethers.provider.send('evm_snapshot', [])
      await issueManager.connect(gov).mintTo(100, user1.address)

      await issueManager.connect(gov).mintTo(100, user2.address)

      await ticket.connect(user1).approve(pool.address, 100)

      await ticket.connect(user2).approve(pool.address, 100)

      await rewardToken.connect(gov).controllerMint(pool.address, 1000)
    })

    afterEach(async () => {
      await ethers.provider.send('evm_revert', [snapshot])
    })

    it('should be able to enter', async () => {
      await pool.connect(user1).enter(100)
      expect(await pool.chanceOf(user1.address)).to.be.eq(100)

      await pool.connect(user2).enter(20)
      expect(await pool.chanceOf(user2.address)).to.be.eq(20)
    })

    it('should not be able to enter after time goes to end', async () => {
      await pool.connect(user1).enter(50)
      await goTo(10000)
      await expect(pool.connect(user1).enter(10)).to.be.revertedWith('Pool already ended')
    })

    it('should choose the winner', async () => {
      //enter
      await pool.connect(user1).enter(100)
      await pool.connect(user2).enter(20)

      //end
      await goTo(20000)

      //request random number
      await pool.connect(gov).requestRandomNumber()
      await goTo(10000)

      //distribute
      await pool.connect(gov).distributeReward()
      expect(await rewardToken.balanceOf(pool.address)).to.be.eq(0)
    })
  })
})

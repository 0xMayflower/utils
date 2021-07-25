import { ethers, waffle } from 'hardhat'
import chai, { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { keccak256, parseEther, toUtf8Bytes } from 'ethers/lib/utils'

chai.use(waffle.solidity)

describe('WorkTogether', () => {
  let snapshot: string
  let gov: SignerWithAddress, executor: SignerWithAddress

  before(async () => {
    ;[gov, executor] = await ethers.getSigners()
    // const poolManagerFactory = await ethers.getContractFactory("WorkTogetherPoolManager");
  })
  beforeEach(async () => {
    snapshot = await ethers.provider.send('evm_snapshot', [])
  })
  afterEach(async () => {
    await ethers.provider.send('evm_revert', [snapshot])
  })

  describe('WorkTogetherPoolManager', async () => {
    it('should', async () => {})
  })

  describe('Pool', async () => {
    it('should', async () => {})
  })
})

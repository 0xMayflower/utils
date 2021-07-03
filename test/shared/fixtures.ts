// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from 'hardhat'
import { DAO, Workhard, deployed } from '@workhard/protocol'
import { BigNumberish, Signer } from 'ethers'

export type ForkParam = {
  multisig: string
  treasury: string
  baseCurrency: string
  projectName: string
  projectSymbol: string
  visionName: string
  visionSymbol: string
  commitName: string
  commitSymbol: string
  rightName: string
  rightSymbol: string
  emissionStartDelay: BigNumberish
  minDelay: BigNumberish
  voteLaunchDelay: BigNumberish
  initialEmission: BigNumberish
  minEmissionRatePerWeek: BigNumberish
  emissionCutRate: BigNumberish
  founderShare: BigNumberish
}

export type LaunchParam = {
  commitMiningWeight: number
  liquidityMiningWeight: number
  treasuryWeight: number
  callerBonus: number
}

export async function getFixtures({
  wallet,
  daoId,
  param,
}: {
  wallet: Signer
  daoId?: number
  param?: {
    forkParam: ForkParam
    launchParam: LaunchParam
  }
}): Promise<{
  daoId: number
  forkedDAO: DAO
  workhard: Workhard
}> {
  const workhard = await Workhard.from(ethers.provider, deployed.mainnet.Project)
  const project = workhard.project.connect(wallet)

  let forkedDAOId: number
  if (daoId) {
    forkedDAOId = daoId
  } else if (param) {
    await project.createProject(0, 'mockuri')
    const projId = await project.projectsOfDAOByIndex(0, (await project.projectsOf(0)).sub(1))
    await project.upgradeToDAO(projId, param.forkParam)
    await project.launch(
      projId,
      param.launchParam.liquidityMiningWeight,
      param.launchParam.commitMiningWeight,
      param.launchParam.treasuryWeight,
      param.launchParam.callerBonus
    )
    forkedDAOId = projId.toNumber()
  }
  const forkedDAO = await workhard.getDAO(forkedDAOId)

  return {
    daoId: forkedDAOId,
    forkedDAO,
    workhard,
  }
}

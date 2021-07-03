import { task } from 'hardhat/config'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'hardhat-dependency-compiler'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

import { HardhatUserConfig } from 'hardhat/types'

require('dotenv').config()

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (args, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
const forking = process.env.FORK_URL ? { url: process.env.FORK_URL } : undefined
if (!forking?.url) {
  console.error('----------WHF starter recommendation----------')
  console.error('We recommend you to use forked mainnet.')
  console.error('Please create .env and setup FORK_URL with your Alchemy API endpoint or other web3 endpoint.')
  console.error('----------------------------------------------')
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      forking,
    },
  },
  typechain: {
    outDir: 'src/types',
    target: 'ethers-v5',
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    externalArtifacts: ['externalArtifacts/*.json'], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
  },
  mocha: {
    timeout: 60000,
  },
}

export default config

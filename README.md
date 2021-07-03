# Work Hard Template

This repository is a template repository to build application on top of WHF forked DAO.

# Start your project using this template

[Click to generate a project](https://github.com/workhard-finance/starter/generate)

# Install dependency

```shell
$ yarn
```

# Run tests

1. To run the tests, you should use hardhat's forking feature.
    * Go to alchemy & get API KEY.
    * Copy `.env.example` file and create your own `.env` file.
      ```shell
      $ cp .env.example .env
      ```
    * Replace `<key>` with your own API KEY.
      ```shell
      FORK_URL=https://eth-mainnet.alchemyapi.io/v2/<key>
      ```
    * Or you can use your own RPC server using geth. For example,
      ```shell
      $ geth --http.api "eth,net,web3" --http.addr localhost --http.port 8888

      #.env file
      FORK_URL=http://localhost:8888
      ```
2. Run the following command
    ```shell
    $ yarn test
    ```

# Deploy your contracts

1. Make sure that you successfully forked WHF. We recommend you to use [the Web UI](https://app.workhard.finance/dao)
2. Deploy your contract. Please take a look at this post: https://hardhat.org/guides/deploying

# Deploy your contracts' artifacts to NPM

1. Go to npm & get token
2. Go to Github Actions menu and setup the env variable `NPM_TOKEN`
3. Prepare a release with 
    ```shell
    yarn version
    ```
4. Go to Github Releases menu and write a new release with tagging.
5. Go to your frontend app & import the deployed artifacts.

# License

We PROUDLY release codes under GPL v3.0.

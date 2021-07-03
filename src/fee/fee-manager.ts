import fetch from 'node-fetch'

export const getOneInchSwapData = (
  fromToken: string,
  toToken: string,
  amount: string,
  fromAddress: string,
  slippage: number
): Promise<{
  to: string
  data: string
}> => {
  return new Promise<{ to: string; data: string }>((resolve) => {
    fetch(
      `https://api.1inch.exchange/v3.0/1/swap?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${fromAddress}&slippage=${slippage}&disableEstimate=true`
    )
      .then((res) => res.json())
      .then((json) => {
        const { to, data } = json.tx
        resolve({
          to,
          data,
        })
      })
      .catch(() => resolve(undefined))
  })
}

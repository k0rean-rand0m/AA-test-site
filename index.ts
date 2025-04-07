import "dotenv/config"
import { toSafeSmartAccount } from "permissionless/accounts"
import { Hex, createPublicClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { base } from "viem/chains"
import { createPimlicoClient } from "permissionless/clients/pimlico"
import {  entryPoint07Address } from "viem/account-abstraction"
import { createSmartAccountClient } from "permissionless"

import {
	EntryPointVersion,
} from "viem/account-abstraction";


const apiKey = process.env.PIMLICO_API_KEY
if (!apiKey) throw new Error("Missing PIMLICO_API_KEY")

const infuraKey = process.env.INFURA_API_KEY
if (!infuraKey) throw new Error("Missing INFURA_API_KEY")

const privateKey = process.env.PRIVATE_KEY as Hex
if (!privateKey) throw new Error("Missing PRIVATE_KEY")

const pimlicoTransport = http(`https://api.pimlico.io/v2/8453/rpc?apikey=${apiKey}`)
const rpcTransport = http(`https://base-mainnet.infura.io/v3/${infuraKey}`)
const chain = base

const account = await toSafeSmartAccount({
	client: createPublicClient({chain, transport: rpcTransport}),
	owners: [privateKeyToAccount(privateKey)],
	entryPoint: {
		address: entryPoint07Address,
		version: "0.7" as EntryPointVersion,
	},
	version: "1.4.1",
})

const pimlicoClient = createPimlicoClient({
	transport: pimlicoTransport,
	entryPoint: {
		address: entryPoint07Address,
		version: "0.7",
	},
})

const smartAccountClient = createSmartAccountClient({
	account,
	chain: chain,
	bundlerTransport: pimlicoTransport,
	paymaster: pimlicoClient,
	userOperation: {
		estimateFeesPerGas: async () => {
			return (await pimlicoClient.getUserOperationGasPrice()).fast
		},
	},
})

// LD USDC deposit
const userOperationHash = await smartAccountClient.sendUserOperation({
	calls: [
		{
			to: "0x5BADb0143f69015c5c86cbd9373474a9c8Ab713B",
			value: 0n,
			data: "0x65abb5e1000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda029130000000000000000000000001fb67325d7e23198c7360b2a3d268f231f27a34800000000000000000000000000000000000000000000000000000000000027100000000000000000000000000000000000000000000000000000000069b16976000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000004152859dfd503a0140dae886021048eb4bb1a656222eb81591bd06a72f19eef59613e1de3582eec88b113ac8290aac535db413aa8cbcc659d65daa4121955d4b371b00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
		},
	],
})
const { receipt } = await smartAccountClient.waitForUserOperationReceipt({hash: userOperationHash})

console.log(`Smart account address: https://basescan.org/address/${account.address}`)
console.log(`UserOperation Hash: ${userOperationHash}`)
console.log(`Transaction: https://basescan.org/tx/${receipt.transactionHash}`)

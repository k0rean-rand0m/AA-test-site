import "dotenv/config"
import { toSafeSmartAccount } from "permissionless/accounts"
import { Hex, createPublicClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { base } from "viem/chains"
import { createPimlicoClient } from "permissionless/clients/pimlico"
import {  entryPoint07Address } from "viem/account-abstraction"
import { createSmartAccountClient } from "permissionless"
import axios from "axios";

import {
	EntryPointVersion,
} from "viem/account-abstraction";

async function postToLocalhost(method: string, path: string, data?: any): Promise<any> {
	try {
		const response = await axios({
			method: method,
			url: `http://localhost:9090${path}`,
			data,
			headers: {
				"Content-Type": "application/json",
			},
		});
		return response.data;
	} catch (error) {
		console.error(`Request error: ${error instanceof Error ? error.message : "Unknown error"}`);
		throw error;
	}
}

async function main() {
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

	console.log(`Smart account address: https://basescan.org/address/${account.address}`)

	// Create new Claim Link (singleton)
	try {
		const apiResp: {url: string} = await postToLocalhost("GET", `/claim_link?sender=${account.address}`);
		console.log(`Claim Link: ${apiResp.url}`)
	} catch (error) {
		console.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
		throw error;
	}

	// Get Transaction Data
	let data: `0x${string}`
	try {
		const apiResp: {data: string} = await postToLocalhost("GET", "/tx_data");
		data = `0x${apiResp.data}`
		console.log(`Transaction data: ${data}`)
	} catch (error) {
		console.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
		throw error;
	}

	// LD USDC deposit
	const userOperationHash = await smartAccountClient.sendUserOperation({
		calls: [
			{
				to: "0x5BADb0143f69015c5c86cbd9373474a9c8Ab713B",
				value: 0n,
				data,
			},
		],
	})
	console.log(`UserOperation Hash: ${userOperationHash}`)

	const { receipt } = await smartAccountClient.waitForUserOperationReceipt({hash: userOperationHash})
	console.log(`Transaction: https://basescan.org/tx/${receipt.transactionHash}`)

	try {
		const apiResp: {success: boolean} = await postToLocalhost(
			"POST",
			"/deposit",
			{txHash: userOperationHash}
		);
		console.log("Deposit: " + (apiResp.success ? "registered" : "failed"))
	} catch (error) {
		console.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
		throw error;
	}
}
main()

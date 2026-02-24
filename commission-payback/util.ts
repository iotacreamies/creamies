import {
  getFullnodeUrl,
  IotaClient,
  type IotaValidatorSummary,
} from "@iota/iota-sdk/client";
import { graphURL, network, stakingPoolId, validatorAddress } from "./const.js";
import type {
  Delegation,
  GraphQLReturnStakes,
  JSONData,
  PaybackEntry,
} from "./types.ts";
import { NFTCollection } from "./nfts.js";
import { graphQueryStakes } from "./graphql.js";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import { Transaction } from "@iota/iota-sdk/transactions";

const iota = new IotaClient({ url: getFullnodeUrl(network) });

export const getDataFromSystemState = async () => {
  const state = await iota.getLatestIotaSystemState();
  const currentEpoch = parseInt(state.epoch);
  const validator = state.activeValidators.find(
    (v) => v.iotaAddress === validatorAddress,
  );
  return { currentEpoch, validator };
};

export const getAllDelegations = async () => {
  const delegations: Delegation[] = [];
  let cursor = null;
  let hasNextPage = true;
  console.log("Starting delegator retrieval");
  const intervalId = setInterval(
    () => console.log(`Delegations found: ${delegations.length}`),
    2000,
  );
  while (hasNextPage) {
    const response: Response = await fetch(graphURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: graphQueryStakes,
        variables: { cursor },
      }),
    });
    const result = await response.json();
    if (result.errors) {
      console.error("Error fetching data:", result.errors);
      break;
    }
    const { nodes, pageInfo } = (result as GraphQLReturnStakes).data.objects;
    nodes.forEach((node) => {
      const { pool_id, principal, stake_activation_epoch } =
        node.asMoveObject.contents.json;
      if (pool_id && pool_id === stakingPoolId) {
        const owner = node.owner?.owner.address;
        const amount = principal.value;
        if (owner) {
          const newDelegation = {
            address: owner,
            activationEpoch: parseInt(stake_activation_epoch),
            value: parseInt(amount),
            formattedValue: `${new Intl.NumberFormat("en-US", {
              notation: "compact",
              compactDisplay: "short",
              maximumFractionDigits: 2,
            }).format(parseInt(amount) / 1000000000)} IOTA`,
          };
          delegations.push(newDelegation);
        }
      }
    });
    cursor = pageInfo.endCursor;
    hasNextPage = pageInfo.hasNextPage;
  }
  clearInterval(intervalId);
  return delegations;
};

export const getNFTCollectionOwners = async () => {
  const owners: string[] = [];
  const batchSize = 50;
  console.log(`Starting retrieval of ${NFTCollection.length} NFTs`);

  for (let i = 0; i < NFTCollection.length; i += batchSize) {
    const batchIds = NFTCollection.slice(i, i + batchSize);
    const response = await iota.multiGetObjects({
      ids: batchIds,
      options: { showOwner: true },
    });
    response.forEach((creamy) => {
      //@ts-expect-error AddressOwner doesn't exist
      const ownerAddr = creamy.data?.owner?.AddressOwner;
      if (ownerAddr && !owners.includes(ownerAddr)) {
        owners.push(ownerAddr);
      }
    });
    console.log(
      `Fetched ${Math.min(i + batchSize, NFTCollection.length)} NFTs`,
    );
  }
  return owners;
};

export const getPoolRate = async (tableId: string, epoch: number) => {
  const field = await iota.getDynamicFieldObject({
    parentObjectId: tableId,
    name: { type: "u64", value: epoch.toString() },
    options: { showContent: true },
  });
  const fields = (field.data?.content as any).fields.value.fields;
  return Number(fields.iota_amount) / Number(fields.pool_token_amount);
};

export const calculateRewardsAndCommission = async (
  validator: IotaValidatorSummary,
  currentEpoch: number,
  delegationsWithNFTs: Delegation[],
  jsonData: JSONData,
) => {
  const activationRateCache = new Map();
  const commissionRateDecimal = parseFloat(validator.commissionRate) / 10000;
  const exchangeRateNow = await getPoolRate(
    validator.exchangeRatesId,
    currentEpoch,
  );
  const exchangeRatePrev = await getPoolRate(
    validator.exchangeRatesId,
    currentEpoch - 1,
  );
  const growthFactor = exchangeRateNow / exchangeRatePrev;

  for (const dwc of delegationsWithNFTs) {
    console.log(`New entry for epoch ${currentEpoch} ${dwc.address}`);
    let rateAtActivation = activationRateCache.get(dwc.activationEpoch);
    if (!rateAtActivation) {
      rateAtActivation = await getPoolRate(
        validator.exchangeRatesId,
        dwc.activationEpoch,
      );
      activationRateCache.set(dwc.activationEpoch, rateAtActivation);
    }
    const compoundedValueAtStartOfEpoch =
      dwc.value * (exchangeRatePrev / rateAtActivation);
    const reward = compoundedValueAtStartOfEpoch * (growthFactor - 1);
    const commission = Math.floor(
      (reward * commissionRateDecimal) / (1 - commissionRateDecimal),
    );
    jsonData[currentEpoch]![dwc.address] = {
      delegation: dwc,
      reward: reward,
      formattedReward: `${new Intl.NumberFormat("en-US", {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 2,
      }).format(reward / 1000000000)} IOTA`,
      commission: commission,
      formattedCommission: `${new Intl.NumberFormat("en-US", {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 2,
      }).format(commission / 1000000000)} IOTA`,
      didReceivePayback: false,
    };
  }
};

export const executePayback = async (jsonData: JSONData) => {
  const secretKey = process.env.IOTA_PRIVATE_KEY!;
  const keypair = Ed25519Keypair.fromSecretKey(secretKey);
  const tx = new Transaction();

  const paidDelegations: PaybackEntry[] = [];
  Object.keys(jsonData).forEach((epoch) => {
    console.log(`Checking epoch ${epoch} for unpaid entries`);
    const epochData = jsonData[epoch];
    if (epochData) {
      Object.keys(epochData).forEach((address) => {
        const delegation = epochData[address]!;
        const { commission, didReceivePayback } = delegation;
        if (didReceivePayback) {
          console.log(`Already paid: ${address}`);
          return;
        }
        if (commission === 0) {
          console.log(`No commission entry: ${address}`);
          delegation.didReceivePayback = true;
        } else if (commission > 0) {
          console.log(`Unpaid entry! Adding to transaction: ${address}`);
          const amountInNanos = Math.floor(commission);
          const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInNanos)]);
          tx.transferObjects([coin!], tx.pure.address(address));
          paidDelegations.push(delegation);
        }
      });
    }
  });
  const iotaDevnet = new IotaClient({ url: getFullnodeUrl("devnet") });
  if (paidDelegations.length > 0) {
    try {
      console.log(`Executing ${paidDelegations.length} paybacks...`);
      const result = await iotaDevnet.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showEffects: true },
      });
      if (result.effects?.status.status === "success") {
        console.log(`Transaction successful: ${result.digest}`);
        paidDelegations.forEach((d) => (d.didReceivePayback = true));
      } else {
        console.error(`Transaction failed: ${result.digest}`);
      }
    } catch (error) {
      console.error("Blockchain execution failed:", error);
    }
  }
};

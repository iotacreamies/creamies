import {
  getFullnodeUrl,
  IotaClient,
  type IotaValidatorSummary,
} from "@iota/iota-sdk/client";
import { graphURL, network, stakingPoolId, validatorAddress } from "./const.js";
import type { Delegation, GraphQLReturnStakes, JSONData } from "./types.ts";
import { NFTCollection } from "./nfts.js";
import { graphQueryStakes } from "./graphql.js";

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

  console.log("Starting delegator retrieval...");
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
          console.log(`Delegations found: ${delegations.length}`);
        }
      }
    });
    cursor = pageInfo.endCursor;
    hasNextPage = pageInfo.hasNextPage;
  }
  return delegations;
};

export const getNFTCollectionOwners = async () => {
  const owners: string[] = [];
  const batchSize = 50;
  console.log(`Starting retrieval for ${NFTCollection.length} NFTs...`);

  for (let i = 0; i < NFTCollection.length; i += batchSize) {
    const batchIds = NFTCollection.slice(i, i + batchSize);
    console.log(
      `Fetching NFTs: ${i} to ${Math.min(i + batchSize, NFTCollection.length)}...`,
    );
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
    console.log(`Adding entry for ${dwc.address}`);
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

import { IotaClient } from "@iota/iota-sdk/client";
import { graphQueryStakes, graphURL, stakingPoolId } from "./const.js";
import type { Delegator, GraphQLReturnStakes } from "./types.ts";
import { creamiesAddresses } from "./creamies.js";

export const getAllDelegations = async () => {
  const delegations: Delegator[] = [];
  let cursor = null;
  let hasNextPage = true;

  console.log("Starting delegator retrieval...");
  while (hasNextPage) {
    const response = await fetch(graphURL, {
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

export const getCreamiesOwners = async (iota: IotaClient) => {
  const owners: string[] = [];
  const batchSize = 50;
  console.log(`Starting retrieval for ${creamiesAddresses.length} Creamies...`);

  for (let i = 0; i < creamiesAddresses.length; i += batchSize) {
    const batchIds = creamiesAddresses.slice(i, i + batchSize);
    console.log(
      `Fetching Creamies: ${i} to ${Math.min(i + batchSize, creamiesAddresses.length)}...`,
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

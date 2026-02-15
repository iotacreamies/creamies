import { IotaClient, getFullnodeUrl } from "@iota/iota-sdk/client";
import { getAllDelegations, getCreamiesOwners } from "./util.js";

const iota = new IotaClient({ url: getFullnodeUrl("mainnet") });

async function run() {
  try {
    const delegations = await getAllDelegations();
    console.log(`Cream has ${delegations.length} delegations.`);

    const owners = await getCreamiesOwners(iota);
    console.log(`Found ${owners.length} unique Creamies owners.`);

    const delegationsWithCreamies = delegations.filter((delegation) =>
      owners.some((owner) => owner === delegation.address),
    );

    console.log(
      `${delegationsWithCreamies.length} of ${delegations.length} delegations have Creamies and are eligible for commission payback.`,
    );
  } catch (error) {
    console.error("Error executing script:", error);
  }
}

run();

import { IotaClient, getFullnodeUrl } from "@iota/iota-sdk/client";
import { getAllDelegations, getCreamiesOwners } from "./util.js";
import { validatorAddress } from "./const.js";
import { readFile, writeFile } from "fs/promises";
import type { JSONData, Payback } from "./types.js";

const iota = new IotaClient({ url: getFullnodeUrl("mainnet") });

async function run() {
  try {
    //Get current epoch
    const state = await iota.getLatestIotaSystemState();

    //Get all Cream delegations
    const delegations = await getAllDelegations();
    console.log(`Cream has ${delegations.length} delegations.`);

    //Filter for eligible delegations (those who have staked during the entire previous epoch)
    const eligibleDelegations = delegations.filter(
      (d) => d.activationEpoch < parseInt(state.epoch) - 1,
    );
    console.log(
      `Cream has ${eligibleDelegations.length} eligible delegations.`,
    );

    //Get all Creamies owners
    const owners = await getCreamiesOwners(iota);
    console.log(`Found ${owners.length} unique Creamies owners.`);

    //Filter eligible delegations for Creamies owners
    const delegationsWithCreamies = eligibleDelegations.filter((delegation) =>
      owners.some((owner) => owner === delegation.address),
    );
    console.log(
      `${delegationsWithCreamies.length} of ${eligibleDelegations.length} delegations have Creamies and are eligible for commission payback.`,
    );

    //Calculate commission payback for addresses
    const commissionForCream =
      parseFloat(
        state.activeValidators.find((v) => v.iotaAddress === validatorAddress)!
          .commissionRate,
      ) / 100;

    //Read data.json and write new epoch entries
    console.log("Reading data file...");
    const data: JSONData = JSON.parse(await readFile("./data.json", "utf8"));
    if (!data[state.epoch]) data[state.epoch] = {};

    delegationsWithCreamies.forEach(async (dwc) => {
      console.log(`Adding delegation entry ${dwc.address}`);
      data[state.epoch]![dwc.address] = {
        delegation: dwc,
        didReceivePayback: true,
      };
    });

    console.log("Saving epoch data...");
    await writeFile("data.json", JSON.stringify(data, null, 2), "utf8");

    console.log("SUCCESS");
  } catch (error) {
    console.error("Error executing script:", error);
  }
}

run();

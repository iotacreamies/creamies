import {
  calculateRewardsAndCommission,
  getAllDelegations,
  getDataFromSystemState,
  getNFTCollectionOwners,
} from "./util.js";
import { readFile, writeFile } from "fs/promises";
import type { JSONData } from "./types.js";

async function run() {
  try {
    //Get necessary data from IOTA system state
    const { currentEpoch, validator } = await getDataFromSystemState();
    if (!validator) {
      console.error("Couldn't find validator");
      return;
    }
    console.log(`Current epoch: ${currentEpoch}`);
    console.log(`Validator: ${validator.name}`);

    //Get all delegations from validator
    const delegations = await getAllDelegations();
    console.log(`Validator has ${delegations.length} delegations.`);

    //Filter for eligible delegations (those who have staked during the entire previous epoch)
    const eligibleDelegations = delegations.filter(
      (d) => d.activationEpoch < currentEpoch - 1,
    );
    console.log(
      `Validator has ${eligibleDelegations.length} eligible delegations.`,
    );

    //Get all NFT collection owners
    const owners = await getNFTCollectionOwners();
    console.log(`Found ${owners.length} unique owners of NFT collection.`);

    //Filter eligible delegations for NFT owners
    const delegationsWithNFTs = eligibleDelegations.filter((delegation) =>
      owners.some((owner) => owner === delegation.address),
    );
    console.log(
      `${delegationsWithNFTs.length} of ${eligibleDelegations.length} delegators own one or more of the desired NFTs and are therefore eligible for commission payback.`,
    );

    //Reading data from data.json
    console.log("Reading data file...");
    let data: JSONData = {};
    const fileContent = await readFile("./data.json", "utf8");
    if (fileContent.length > 0) data = JSON.parse(fileContent);
    if (!data[currentEpoch]) data[currentEpoch] = {};

    //Calculate commission payback for previous epoch
    await calculateRewardsAndCommission(
      validator,
      currentEpoch,
      delegationsWithNFTs,
      data,
    );

    //Write new epoch data into data.json
    console.log("Saving epoch data...");
    await writeFile("data.json", JSON.stringify(data, null, 2), "utf8");
    console.log("SUCCESS");
  } catch (error) {
    console.error("Error executing script:", error);
  }
}

run();

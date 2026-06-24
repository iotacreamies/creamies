import {
  calculateRewardsAndCommission,
  executePayback,
  getAllDelegations,
  getDataFromSystemState,
  getNFTCollectionOwners,
} from "./util.js";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import type { EpochData } from "./types.js";

const EPOCH_DIR = "./epoch";

async function readEpochFile(epoch: number): Promise<EpochData | null> {
  try {
    const content = await readFile(join(EPOCH_DIR, `${epoch}.json`), "utf8");
    return JSON.parse(content) as EpochData;
  } catch {
    return null;
  }
}

async function writeEpochFile(epoch: number, data: EpochData): Promise<void> {
  await mkdir(EPOCH_DIR, { recursive: true });
  await writeFile(
    join(EPOCH_DIR, `${epoch}.json`),
    JSON.stringify(data, null, 2),
    "utf8",
  );
  console.log(`Saved epoch/${epoch}.json`);
}

async function run() {
  try {
    const { currentEpoch, validator } = await getDataFromSystemState();
    if (!validator) {
      console.error("Couldn't find validator");
      return;
    }
    console.log(`Current epoch: ${currentEpoch}`);
    console.log(`Validator: ${validator.name}`);

    const epochData = await readEpochFile(currentEpoch);
    if (epochData) {
      console.error(
        "Data for current epoch already exists. Running payback mechanism now",
      );
      await executePayback(EPOCH_DIR);
      console.log("SUCCESS");
      return;
    }

    console.log("NEW EPOCH FOUND! Running data retrieval mechanism now");

    const prevEpochData = await readEpochFile(currentEpoch - 1);
    const previousEpochCommission = prevEpochData?.epochCommission ?? 0;

    const newEpochData: EpochData = {
      epochCommission: Math.max(
        parseFloat(validator.votingPower) / 100,
        parseFloat(validator.commissionRate) / 100,
      ),
      paybackData: [],
    };

    const delegations = await getAllDelegations();
    console.log(`Number of delegations: ${delegations.length}`);

    const eligibleDelegations = delegations.filter(
      (d) => d.activationEpoch < currentEpoch - 1,
    );
    console.log(
      `Delegations with rewards last epoch: ${eligibleDelegations.length}`,
    );

    const owners = await getNFTCollectionOwners();
    console.log(`Found ${owners.length} unique owners of NFT collection`);

    const delegationsWithNFTs = eligibleDelegations.filter((delegation) =>
      owners.some((owner) => owner === delegation.address),
    );
    console.log(
      `${delegationsWithNFTs.length} of ${eligibleDelegations.length} delegators own one or more of the desired NFTs and are therefore eligible for commission payback`,
    );

    await calculateRewardsAndCommission(
      validator,
      currentEpoch,
      delegationsWithNFTs,
      newEpochData,
      previousEpochCommission,
    );

    await writeEpochFile(currentEpoch, newEpochData);

    console.log("Running payback mechanism now");
    await executePayback(EPOCH_DIR);

    console.log("SUCCESS");
  } catch (error) {
    console.error("Error executing script:", error);
  }
}

run();

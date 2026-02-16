export const stakingPoolId =
  "0xe0ef68e5e0d777d287a8de0b4c50de3ad2bf75d2db58d9051fd3ae79712e7a23";
export const validatorAddress =
  "0x7d49a79ca16e3986b2221ee7bf93d9a34e2192517c7efea995b34f69615ee053";
export const graphURL = "https://graphql.mainnet.iota.cafe/";
export const graphQueryStakes = `query GetAllStakes($cursor: String) {
  objects(
    filter: { type: "0x3::staking_pool::StakedIota" }
    after: $cursor
    first: 50
  ) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      address
      owner {
        ... on AddressOwner {
          owner {
            address
          }
        }
      }
      asMoveObject {
        contents {
          json
        }
      }
    }
  }
}
    `;
export const graphQueryCreamies = `query GetCreamies($cursor: String) {
  objects(
    filter: { type: "0x6560abfa36fd7b93eb98b94abe62e538549e1f59c12a192830199eac1eb867bf::creamies::Creamies" }
    after: $cursor
    first: 50
  ) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      address
      owner {
        ... on AddressOwner {
          owner {
            address
          }
        }
      }
    }
  }
}
    `;

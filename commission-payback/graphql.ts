export const graphQueryStakes = `query GetAllDelegations($cursor: String) {
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

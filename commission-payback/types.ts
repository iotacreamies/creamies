type Epoch = string;
export type JSONData = Record<Epoch, Payback>;

export type PaybackEntry = {
  delegation: Delegation;
  reward: number;
  formattedReward: string;
  commission: number;
  formattedCommission: string;
  didReceivePayback: boolean;
};

export type Payback = Record<string, PaybackEntry>;

export type Delegation = {
  address: string;
  activationEpoch: number;
  value: number;
  formattedValue: string;
};

export type Creamies = {
  address: string;
  owner: string;
};

export type GraphQLReturnStakes = {
  data: {
    objects: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
      };
      nodes: [
        {
          address: string;
          owner?: {
            owner: {
              address: string;
            };
          };
          asMoveObject: {
            contents: {
              json: {
                id: string;
                pool_id: string;
                stake_activation_epoch: string;
                principal: {
                  value: string;
                };
              };
            };
          };
        },
      ];
    };
  };
};

export type GraphQLReturnCreamies = {
  data: {
    objects: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
      };
      nodes: [
        {
          address: string;
          owner?: {
            owner: {
              address: string;
            };
          };
        },
      ];
    };
  };
};

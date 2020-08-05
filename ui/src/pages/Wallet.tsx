import * as React from 'react';
import {Suspense, useCallback} from 'react';
import {selector, useRecoilValue, useSetRecoilState} from 'recoil';
import {rpcClient} from '../client';
import {FilecoinNumber} from '../utils/FilecoinNumber';
import Text from '../components/Text';
import Space from '../components/Space';
import {VStack} from '../components/Stack';
import Button from '../components/Button';
import {suggestedCidsState} from '../recoil/shared';
import {Cid} from '../sharedTypes';
import ErrorBoundary from '../utils/ErrorBoundary';

const userIDQuery = selector<string>({
  key: 'CurrentUserID',
  get: async ({get}) => {
    const client = get(rpcClient);
    const addr = await client.walletDefaultAddress();
    const userID = await client.stateLookupID(addr, []);
    return userID;
  },
});
type TitleProps = {
  name?: string;
};
const Title = ({name}: TitleProps) => {
  return (
    <VStack mt={7}>
      <Text is="h2">{name ? `Welcome, ${name}` : `Welcome`}</Text>
    </VStack>
  );
};
const UserTitle = () => {
  const userID = useRecoilValue(userIDQuery);
  return <Title name={userID} />;
};

const walletBalanceQuery = selector<string>({
  key: 'WalletBalance',
  get: async ({get}) => {
    const client = get(rpcClient);
    const addr = await client.walletDefaultAddress();
    const balance = await client.walletBalance(addr);
    return new FilecoinNumber(balance, 'attofil').toFixed(4);
  },
});
const Balance = () => {
  const balance = useRecoilValue(walletBalanceQuery);
  return (
    <Space scale={2}>
      <Text is="label">Balance</Text>
      <Text is="balance">
        <Text is="sups">⨎</Text>
        {balance}
      </Text>
    </Space>
  );
};

const statusInfo = {
  Online: 'Your node is online and running properly',
  PendingSync: 'Your node is still catching up with the latest blocks',
  Offline: 'Your node is down or there is a network issue',
};
type NodeStatus = 'Online' | 'PendingSync' | 'Offline';
type NodeInfo = {
  version: string;
  apiVersion: string;
  blockDelay: string;
  status: NodeStatus;
};
const statusQuery = selector({
  key: 'NodeStatus',
  get: async ({get}) => {
    const client = get(rpcClient);
    const info = await client.version();
    return {
      version: info.Version,
      apiVersion: info.APIVersion,
      blockDelay: info.BlockDelay,
      status: info.BlockDelay > 0 ? 'PendingSync' : 'Online',
    };
  },
});
const NodeStatus = () => {
  const info = useRecoilValue(statusQuery);
  return (
    <Space scale={4}>
      <Text is="body">{statusInfo[info.status as NodeStatus]}</Text>
    </Space>
  );
};

const connectedFaucetQuery = selector({
  key: 'ConnectedFaucets',
  get: async ({get}) => {
    const client = get(rpcClient);
    const peers = await client.connectedFaucets();
    return peers;
  },
});

const ConnectedFaucets = () => {
  const client = useRecoilValue(rpcClient);
  const setNewCids = useSetRecoilState(suggestedCidsState);
  const faucets = useRecoilValue(connectedFaucetQuery);
  const start = useCallback(() => {
    client.queryFaucet((cid: Cid) => setNewCids((cids) => [...cids, cid]));
  }, [client, setNewCids]);

  console.log(faucets);

  return (
    <>
      {faucets.map((f: any, i: number) => (
        <VStack p={4}>
          <Space scale={4}>
            <Text is="body">New faucet detected</Text>
          </Space>
          <Button onPress={start}>Start</Button>
        </VStack>
      ))}
    </>
  );
};
const FaucetError = () => {
  return (
    <VStack>
      <Text is="body">
        Error connecting to the faucet make sure you are running a Myel client
      </Text>
    </VStack>
  );
};

const Wallet = () => {
  return (
    <Space scale={3}>
      <ErrorBoundary fallback={<Title />}>
        <Suspense fallback={null}>
          <UserTitle />
        </Suspense>
      </ErrorBoundary>
      <Suspense fallback={null}>
        <NodeStatus />
      </Suspense>
      <Suspense fallback={null}>
        <Balance />
      </Suspense>
      <ErrorBoundary fallback={<FaucetError />}>
        <Suspense fallback={null}>
          <ConnectedFaucets />
        </Suspense>
      </ErrorBoundary>
    </Space>
  );
};

export default Wallet;
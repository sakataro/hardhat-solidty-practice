import detectEthereumProvider from '@metamask/detect-provider';
import { useEffect, useState } from 'react';
import FundraiserFactory from './contracts/contracts/FundraiserFactory.sol/FundraiserFactory.json';
import { config } from './utils/config';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { provider } from 'web3-core/types';
import { Contract } from 'web3-eth-contract';
import { Box } from '@mui/system';
import { FundraiserCard } from './FundraiserCard';

export const Home = (): JSX.Element => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [funds, setFunds] = useState<string[]>([]);

  const init = async () => {
    try {
      const provider = (await detectEthereumProvider()) as provider;
      const web3 = new Web3(provider);
      const accounts = await web3.eth.getAccounts();
      const instance = new web3.eth.Contract(
        FundraiserFactory.abi as AbiItem[],
        config.fundraiserFactoryAddress
      );
      setContract(instance);
      setAccounts(accounts);

      const funds = await instance.methods.fundraisers(10, 0).call();
      setFunds(funds);
    } catch (e) {
      alert(
        'Home.tsx: Failed to load web3, accounts, or contract. Check console for details...'
      );
      console.error(e);
    }
  };
  useEffect(() => {
    init();
  }, []);
  return (
    <Box sx={{ margin: '20px' }}>
      {funds.map((fund) => (
        <FundraiserCard fundraiserAddress={fund} key={fund} />
      ))}
    </Box>
  );
};

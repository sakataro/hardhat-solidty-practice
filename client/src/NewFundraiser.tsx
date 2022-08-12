import { Button, TextField, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { styled } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { AbiItem } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import getWeb3 from './utils/getWeb3';
import FundraiserFactory from './contracts/contracts/FundraiserFactory.sol/FundraiserFactory.json';
import { config } from './utils/config';

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
}));

export const NewFundraiser = (): JSX.Element => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [contract, setContract] = useState<Contract | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const web3 = await getWeb3();
        const accounts = await web3.eth.getAccounts();
        const instance = new web3.eth.Contract(
          FundraiserFactory.abi as AbiItem[],
          config.fundraiserFactoryAddress
        );
        setContract(instance);
        setAccounts(accounts);
      } catch (e) {
        alert(
          'Failed to load web3, accounts, or contract.\nCheck console for details.'
        );
        console.error(e);
      }
    };
    init();
  }, []);

  const handleSubmit = async () => {
    if (!contract) {
      alert('contract is null');
      return;
    }
    await contract?.methods
      .createFundraiser(name, url, imageUrl, description, beneficiary)
      .send({ from: accounts[0] });
    alert('Successfully created fundraiser');
  };

  return (
    <Box>
      <Typography variant="h2">Create A New Fundraiser</Typography>
      <label>Name</label>
      <TextField
        placeholder="Fundraiser Name"
        margin="normal"
        onChange={(e) => setName(e.target.value)}
        variant="outlined"
      />
      <label>Website</label>
      <TextField
        placeholder="Fundraiser Website"
        margin="normal"
        onChange={(e) => setUrl(e.target.value)}
        variant="outlined"
      />
      <label>Description</label>
      <TextField
        placeholder="Fundraiser Description"
        margin="normal"
        onChange={(e) => setDescription(e.target.value)}
        variant="outlined"
      />
      <label>Image</label>
      <TextField
        placeholder="Fundraiser Image"
        margin="normal"
        onChange={(e) => setImageUrl(e.target.value)}
        variant="outlined"
      />
      <label>Address</label>
      <TextField
        placeholder="Fundraiser Ethereum Address"
        margin="normal"
        onChange={(e) => setBeneficiary(e.target.value)}
        variant="outlined"
      />
      <Button
        onClick={handleSubmit}
        variant="contained"
        sx={{ marginLeft: (theme) => theme.spacing(1) }}
      >
        Submit
      </Button>
    </Box>
  );
};

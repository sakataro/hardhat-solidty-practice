import detectEthereumProvider from '@metamask/detect-provider';
import {
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Input,
  Typography,
} from '@mui/material';
import { AbiItem } from 'web3-utils';
import { Box } from '@mui/system';
import { useEffect, useState } from 'react';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { provider } from 'web3-core/types';
import Fundraiser from './contracts/contracts/Fundraiser.sol/Fundraiser.json';
import { Link } from 'react-router-dom';

export const FundraiserCard = ({
  fundraiserAddress,
}: {
  fundraiserAddress: string;
}) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [fundName, setFundName] = useState('');
  const [description, setDescription] = useState('');
  const [totalDonations, setTotalDonations] = useState('');
  const [donationCount, setDonationCount] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [url, setUrl] = useState('');
  const [open, setOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(0);
  const [userDonations, setUserDonations] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [beneficiary, setBeneficiary] = useState('');
  const ethAmount = Number(donationAmount) / exchangeRate || 0;

  useEffect(() => {
    if (fundraiserAddress) {
      init(fundraiserAddress);
    }
  }, [fundraiserAddress]);

  const init = async (fundraiserAddress: string) => {
    try {
      const provider = (await detectEthereumProvider()) as provider;
      const web3 = new Web3(provider);
      const accounts = await web3.eth.getAccounts();
      const instance = new web3.eth.Contract(
        Fundraiser.abi as AbiItem[],
        fundraiserAddress
      );
      setWeb3(web3);
      setContract(instance);
      setAccounts(accounts);
      setFundName(await instance.methods.name().call());
      setDescription(await instance.methods.description().call());
      setImageUrl(await instance.methods.imageURL().call());
      setUrl(await instance.methods.url().call());
      const userDonations = await instance.methods
        .myDonations()
        .call({ from: accounts[0] });
      setUserDonations(userDonations);

      const totalDonations = await instance.methods.totalDonations().call();
      // @ts-ignore
      const cc = await import('cryptocompare');
      const exchangeRage = await cc.price('ETH', ['USD']);
      setExchangeRate(exchangeRage.USD);

      const eth = web3.utils.fromWei(totalDonations, 'ether');
      const dollarDonationAmount = exchangeRage.USD * Number(eth);
      setTotalDonations(`${dollarDonationAmount}`);

      const user = accounts[0];
      const owner = await instance.methods.owner().call();
      setIsOwner(user === owner);
      window.ethereum?.on('accountsChanged', () => {
        window.location.reload();
      });
    } catch (e) {
      alert(
        'FundraiserCard: Failed to load web3 ,accounts, or contract. Check console for details.'
      );
      console.error(e);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const submitFunds = async () => {
    const ethTotal = Number(donationAmount) / exchangeRate;
    const donation = web3?.utils.toWei(ethTotal.toString());
    await contract?.methods.donate().send({
      from: accounts[0],
      value: donation,
    });
    setOpen(false);
  };

  const withdrawalFunds = async () => {
    await contract?.methods.withdraw().send({
      from: accounts[0],
    });
    alert('Funds Withdrawn!');
    setOpen(false);
  };

  const changeBeneficiary = async () => {
    await contract?.methods.setBeneficiary(beneficiary).send({
      from: accounts[0],
    });
    alert('Fundraiser Beneficiary Changed');
    setOpen(false);
  };

  return (
    <Box
      sx={{
        display: 'inline-flex',
        width: '250px',
        height: '250px',
        margin: '20px',
      }}
    >
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Donate to {fundName}</DialogTitle>
        <DialogContent>
          <img src={imageUrl} width="200px" height="130px" />
          <DialogContentText>{description}</DialogContentText>
          <div style={{ display: 'flex' }}>
            <FormControl
              sx={{
                margin: (theme) => theme.spacing(1),
                display: 'table-cell',
              }}
            >
              $
              <Input
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="0.00"
              />
            </FormControl>
            <p>Eth: {ethAmount}</p>
          </div>
          <Button onClick={submitFunds} variant="contained" color="primary">
            Donate
          </Button>
          <div>
            <h3>My donations</h3>
            {userDonations &&
              (userDonations.dates as string[]).map((date, index) => {
                const ethAmount = web3?.utils.fromWei(
                  (userDonations.values as string[])[index]
                );
                const donation = (exchangeRate * Number(ethAmount)).toFixed(2);
                return (
                  <div
                    key={`${date}-${index}`}
                    style={{
                      marginTop: '10px',
                      marginBottom: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <p>${donation}</p>
                    <Button variant="contained" color="primary">
                      <Link
                        style={{ color: 'inherit', textDecoration: 'none' }}
                        to="/receipts"
                        state={{ fund: fundName, donation, date }}
                      >
                        Request Receipt
                      </Link>
                    </Button>
                  </div>
                );
              })}
          </div>
          {isOwner && (
            <div>
              <FormControl
                sx={{
                  margin: (theme) => theme.spacing(1),
                  display: 'table-cell',
                }}
              >
                Beneficiary:
                <Input
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  placeholder="Set Beneficiary"
                />
              </FormControl>

              <Button
                variant="contained"
                sx={{ marginTop: '20px' }}
                color="primary"
                onClick={changeBeneficiary}
              >
                Set Beneficiary
              </Button>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          {isOwner && (
            <Button
              variant="contained"
              color="primary"
              onClick={withdrawalFunds}
            >
              Withdrawal
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <Card sx={{ maxWidth: '450px', height: '400px' }} onClick={handleOpen}>
        <CardActionArea>
          {imageUrl && (
            <CardMedia
              sx={{ height: '140px' }}
              image={imageUrl}
              title="Fundraiser Image"
            />
          )}
          <CardContent>
            <Typography gutterBottom variant="h5" component="h2">
              {fundName}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {description}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Donations: ${totalDonations}
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions>
          <Button
            onClick={handleOpen}
            variant="contained"
            sx={{ margin: (theme) => theme.spacing(1) }}
          >
            View More
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
};

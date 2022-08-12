import { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import FundraiserFactory from './contracts/contracts/FundraiserFactory.sol/FundraiserFactory.json';
import getWeb3 from './utils/getWeb3';
import { config } from './utils/config';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { BrowserRouter, Route, Routes, NavLink } from 'react-router-dom';
import { Home } from './Home';
import { NewFundraiser } from './NewFundraiser';
import { AppBar, Toolbar, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Box } from '@mui/system';
import { Receipts } from './Receipts';

const activeStyle = {
  color: 'black',
  textDecoration: 'none',
};

const StyledNavLink = styled(NavLink)({
  color: 'inherit',
  textDecoration: 'none',
  marginRight: 15,
  '&:hover': activeStyle,
  '&:active': activeStyle,
  '&:visited': activeStyle,
});

const App = (): JSX.Element => {
  const [state, setState] = useState<{
    web3: Web3 | null;
    accounts: string[] | null;
    contract: Contract | null;
  }>({
    web3: null,
    accounts: null,
    contract: null,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const web3 = await getWeb3();
        const accounts = await web3.eth.getAccounts();
        const instance = new web3.eth.Contract(
          FundraiserFactory.abi as AbiItem[],
          config.fundraiserFactoryAddress
        );
        setState({ web3, accounts, contract: instance });
      } catch (e) {
        alert(
          'App.ts: Failed to load web3, accounts, or contract.\nCheck console for details.'
        );
        console.error(e);
      }
    };
    init();
  }, []);

  const runExample = async () => {
    const { accounts, contract } = state;
  };

  return (
    <BrowserRouter>
      <Box
        component="div"
        sx={{
          flexGrow: 1,
        }}
      >
        <AppBar position="static" color="default">
          <Toolbar>
            <Typography variant="h6" color="inherit">
              <StyledNavLink to="/">Home</StyledNavLink>
            </Typography>
            <StyledNavLink to="/new/">New</StyledNavLink>
          </Toolbar>
        </AppBar>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new/" element={<NewFundraiser />} />
          <Route path="/receipts" element={<Receipts />} />
        </Routes>
      </Box>
    </BrowserRouter>
  );
};

export default App;

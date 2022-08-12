import { Box } from '@mui/system';
import { useLocation } from 'react-router-dom';

type State = {
  fund: string;
  donation: string;
  date: string;
};

export const Receipts = (): JSX.Element => {
  const { fund, donation, date } = useLocation().state as State;

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ borderBottom: '1px solid gray' }}>
        <h3>Thank you for your donation to {fund}</h3>
      </Box>

      <Box
        sx={{
          display: 'flex',
          padding: '50px',
          justifyContent: 'space-between',
        }}
      >
        <Box>{`Date of Donation: ${new Date(
          parseInt(date) * 1000
        ).toString()}`}</Box>
        <Box>Donation Value: ${donation}</Box>
      </Box>
    </Box>
  );
};

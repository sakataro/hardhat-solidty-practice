const FUNDRAISER_FACTORY_ADDRESS = import.meta.env
  .VITE_FUNDRAISER_FACTORY_ADDRESS;

export const config = {
  fundraiserFactoryAddress: FUNDRAISER_FACTORY_ADDRESS,
} as const;

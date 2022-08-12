import { ethers } from 'hardhat';

async function main() {
  const FundraiserFactory = await ethers.getContractFactory(
    'FundraiserFactory'
  );
  const fundraiserFactory = await FundraiserFactory.deploy();

  await fundraiserFactory.deployed();

  console.log('FundraiserFactory deployed to:', fundraiserFactory.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

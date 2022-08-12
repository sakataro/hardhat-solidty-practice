import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect, assert } from 'chai';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { Contract } from '@ethersproject/contracts';

describe('FundraiserFactory', () => {
  async function deployFundraiserFactoryFixture() {
    const FundraiserFactory = await ethers.getContractFactory(
      'FundraiserFactory'
    );
    const fundraiserFactory = await FundraiserFactory.deploy();
    const [custodian, beneficiary, otherAccount] = await ethers.getSigners();

    return {
      fundraiserFactory,
      custodian,
      beneficiary,
      otherAccount,
    };
  }
  it('has been deployed', async () => {
    const { fundraiserFactory } = await loadFixture(
      deployFundraiserFactoryFixture
    );
    expect(fundraiserFactory).to.be.not.null;
  });

  describe('FundraiserFactory: createFundraiser', () => {
    const name = 'Beneficiary Name';
    const url = 'http://example.com/beneficiaryname';
    const imageUrl = 'https://placekitten.com/600/350';
    const description = 'Beneficiary Description';

    it('increments the fundraisersCount', async () => {
      const { fundraiserFactory, beneficiary } = await loadFixture(
        deployFundraiserFactoryFixture
      );

      const currentFundraisersCount =
        await fundraiserFactory.fundraisersCount();
      await fundraiserFactory.createFundraiser(
        name,
        url,
        imageUrl,
        description,
        beneficiary.address
      );
      const newFundraisersCount = await fundraiserFactory.fundraisersCount();

      expect(
        newFundraisersCount.toBigInt() - currentFundraisersCount.toBigInt()
      ).to.eq(1);
    });
    it('emits the FundraiserCreated event', async () => {
      const { fundraiserFactory, beneficiary, custodian } = await loadFixture(
        deployFundraiserFactoryFixture
      );

      await expect(
        fundraiserFactory.createFundraiser(
          name,
          url,
          imageUrl,
          description,
          beneficiary.address
        )
      )
        .to.emit(fundraiserFactory, 'FundraiserCreated')
        .withArgs(
          // created fundraiser instance
          anyValue,
          custodian.address
        );
    });
  });
  describe('FundraiserFactory: fundraisers', () => {
    const addFundraisers = async (
      factory: Contract,
      count: number,
      beneficiary: any
    ) => {
      const name = 'Beneficiary Name';
      const lowerCaseName = name.toLowerCase();
      for (let i = 0; i < count; i++) {
        await factory.createFundraiser(
          `${name} ${i}`,
          `${lowerCaseName}${i}.com`,
          `${lowerCaseName}${i}.png`,
          `Description for ${name} ${i}`,
          beneficiary.address
        );
      }
    };

    const getFundraiser = async (address: any) => {
      return (await ethers.getContractFactory('Fundraiser')).attach(address);
    };

    it('returns an empty collection', async () => {
      const { fundraiserFactory } = await loadFixture(
        deployFundraiserFactoryFixture
      );

      const fundraisers = await fundraiserFactory.fundraisers(10, 0);

      expect(fundraisers.length).to.eq(0);
    });

    describe('verying limits', () => {
      it('returns 10 results when limit requested is 10', async () => {
        const { fundraiserFactory, beneficiary } = await loadFixture(
          deployFundraiserFactoryFixture
        );

        await addFundraisers(fundraiserFactory, 30, beneficiary);

        const fundraisers = await fundraiserFactory.fundraisers(10, 0);
        expect(fundraisers.length).to.eq(10);
      });
      it('return 20 results when limit requested is 20', async () => {
        const { fundraiserFactory, beneficiary } = await loadFixture(
          deployFundraiserFactoryFixture
        );

        await addFundraisers(fundraiserFactory, 30, beneficiary);

        const fundraisers = await fundraiserFactory.fundraisers(20, 0);
        expect(fundraisers.length).to.eq(20);
      });
      it('return 20 results when limit requested is 30', async () => {
        const { fundraiserFactory, beneficiary } = await loadFixture(
          deployFundraiserFactoryFixture
        );

        await addFundraisers(fundraiserFactory, 30, beneficiary);

        const fundraisers = await fundraiserFactory.fundraisers(30, 0);
        expect(fundraisers.length).to.eq(20);
      });
    });
    describe('verying offset', () => {
      it('contains the fundraiser with the apropriate offset', async () => {
        const { fundraiserFactory, beneficiary } = await loadFixture(
          deployFundraiserFactoryFixture
        );

        await addFundraisers(fundraiserFactory, 10, beneficiary);

        const fundraisers = await fundraiserFactory.fundraisers(1, 0);
        const name = await (await getFundraiser(fundraisers[0])).name();
        expect(name).to.includes('0');
      });
      it('contains the fundraiser with the appropriate offset', async () => {
        const { fundraiserFactory, beneficiary } = await loadFixture(
          deployFundraiserFactoryFixture
        );

        await addFundraisers(fundraiserFactory, 10, beneficiary);

        const fundraisers = await fundraiserFactory.fundraisers(1, 7);
        const name = await (await getFundraiser(fundraisers[0])).name();
        expect(name).to.includes('7');
      });
    });
    describe('boundary conditions', () => {
      it('raises out of bounds error', async () => {
        const { fundraiserFactory, beneficiary } = await loadFixture(
          deployFundraiserFactoryFixture
        );

        await addFundraisers(fundraiserFactory, 10, beneficiary);

        await expect(fundraiserFactory.fundraisers(1, 11)).to.rejectedWith(
          'offset out of bounds'
        );
      });
      it('adjusts return size to prevent out of bounds error', async () => {
        const { fundraiserFactory, beneficiary } = await loadFixture(
          deployFundraiserFactoryFixture
        );

        await addFundraisers(fundraiserFactory, 10, beneficiary);

        const fundraisers = await fundraiserFactory.fundraisers(10, 5);
        expect(fundraisers.length).to.eq(5);
      });
    });
  });
});

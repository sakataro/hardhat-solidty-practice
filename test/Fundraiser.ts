import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect, assert } from 'chai';

describe('Fundraiser', () => {
  async function deployFundraiserFixture() {
    const name = 'Beneficiary Name';
    const url = 'beneficiaryname.org';
    const imageURL = 'https://placekitten.com/600/350';
    const description = 'Beneficiary description';
    const [custodian, beneficiary, otherAccount] = await ethers.getSigners();

    const Fundraiser = await ethers.getContractFactory('Fundraiser');
    const fundraiser = await Fundraiser.deploy(
      name,
      url,
      imageURL,
      description,
      beneficiary.address,
      custodian.address
    );

    return {
      fundraiser,
      name,
      url,
      imageURL,
      description,
      otherAccount,
      beneficiary,
      custodian,
    };
  }

  describe('initialization', () => {
    it('gets the beneficiary name', async () => {
      const { fundraiser, name } = await loadFixture(deployFundraiserFixture);
      const actual = await fundraiser.name();

      expect(actual).to.eq(name);
    });
    it('gets the beneficiary url', async () => {
      const { fundraiser, url } = await loadFixture(deployFundraiserFixture);
      const actual = await fundraiser.url();

      expect(actual).to.eq(url);
    });
    it('gets the beneficiary image url', async () => {
      const { fundraiser, imageURL } = await loadFixture(
        deployFundraiserFixture
      );
      const actual = await fundraiser.imageURL();

      expect(actual).to.eq(imageURL);
    });
    it('gets the beneficiary description', async () => {
      const { fundraiser, description } = await loadFixture(
        deployFundraiserFixture
      );
      const actual = await fundraiser.description();

      expect(actual).to.eq(description);
    });
    it('gets the beneficiary', async () => {
      const { fundraiser, beneficiary } = await loadFixture(
        deployFundraiserFixture
      );
      const actual = await fundraiser.beneficiary();

      expect(actual).to.eq(beneficiary.address);
    });
    it('gets the owner', async () => {
      const { fundraiser, custodian } = await loadFixture(
        deployFundraiserFixture
      );
      const actual = await fundraiser.owner();

      expect(actual).to.eq(custodian.address);
    });
  });

  describe('setBeneficiary', () => {
    it('updated beneficiary when called by owner account', async () => {
      const { fundraiser, otherAccount, custodian } = await loadFixture(
        deployFundraiserFixture
      );

      await fundraiser.setBeneficiary(otherAccount.address);
      const actual = await fundraiser.beneficiary();

      expect(actual).to.eq(otherAccount.address);
    });
    it('thrown an error when called from a non-owner account', async () => {
      const { fundraiser, otherAccount } = await loadFixture(
        deployFundraiserFixture
      );

      await expect(
        fundraiser.connect(otherAccount).setBeneficiary(otherAccount.address)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('making donations', () => {
    const value = ethers.utils.parseEther('0.0289');

    it('increase myDonationCount', async () => {
      const { fundraiser, otherAccount } = await loadFixture(
        deployFundraiserFixture
      );

      const currentDonationCount = await fundraiser
        .connect(otherAccount)
        .myDonationsCount();

      await fundraiser.connect(otherAccount).donate({ value });

      const newDonationCount = await fundraiser
        .connect(otherAccount)
        .myDonationsCount();

      expect(
        newDonationCount.toBigInt() - currentDonationCount.toBigInt()
      ).to.eq(1);
    });
    it('includes donation in myDonations', async () => {
      const { fundraiser, otherAccount } = await loadFixture(
        deployFundraiserFixture
      );

      await fundraiser.connect(otherAccount).donate({ value });

      const [values, dates] = await fundraiser
        .connect(otherAccount)
        .myDonations();

      expect(values[0].toBigInt()).to.eq(value.toBigInt());
      expect(dates[0]).to.be.not.null;
    });
    it('increases the totalDonations amount', async () => {
      const { fundraiser, otherAccount } = await loadFixture(
        deployFundraiserFixture
      );
      const currentTotalDonations = await fundraiser.totalDonations();

      await fundraiser.connect(otherAccount).donate({ value });
      const newTotalDonations = await fundraiser.totalDonations();

      const diff =
        newTotalDonations.toBigInt() - currentTotalDonations.toBigInt();

      expect(diff).to.eq(value.toBigInt());
    });
    it('increases donationsCount', async () => {
      const { fundraiser, otherAccount } = await loadFixture(
        deployFundraiserFixture
      );
      const currentDonationsCount = await fundraiser.donationsCount();
      await fundraiser.connect(otherAccount).donate({ value });

      const newDonationsCount = await fundraiser.donationsCount();

      expect(
        newDonationsCount.toBigInt() - currentDonationsCount.toBigInt()
      ).to.eq(1);
    });
    it('emits the DonationReceived event', async () => {
      const { fundraiser, otherAccount } = await loadFixture(
        deployFundraiserFixture
      );

      const expectedEvent = 'DonationReceived';

      await expect(fundraiser.connect(otherAccount).donate({ value }))
        .to.emit(fundraiser, expectedEvent)
        .withArgs(otherAccount.address, value);
    });
  });
  describe('withDrawing funds', () => {
    const value = ethers.utils.parseEther('0.1');
    describe('access controls', () => {
      it('throws an error whencalled from a non-owner account', async () => {
        const { fundraiser, otherAccount } = await loadFixture(
          deployFundraiserFixture
        );
        await expect(
          fundraiser.connect(otherAccount).withdraw()
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });
      it('permits the owner to call the function', async () => {
        const { fundraiser, custodian } = await loadFixture(
          deployFundraiserFixture
        );
        await expect(fundraiser.connect(custodian).withdraw()).not.to.be
          .reverted;
      });
    });
    it('transfers balance to beneficiary', async () => {
      const { fundraiser, beneficiary, otherAccount } = await loadFixture(
        deployFundraiserFixture
      );

      await fundraiser.connect(otherAccount).donate({ value });

      const currentContractBalance = await ethers.provider.getBalance(
        fundraiser.address
      );
      const currentBeneficiaryBalance = await ethers.provider.getBalance(
        beneficiary.address
      );

      await fundraiser.withdraw();

      const newContractBalance = await ethers.provider.getBalance(
        fundraiser.address
      );
      const newBeneficiaryBalance = await ethers.provider.getBalance(
        beneficiary.address
      );

      expect(newContractBalance).to.eq(0);
      expect(
        newBeneficiaryBalance.toBigInt() - currentBeneficiaryBalance.toBigInt()
      ).to.eq(currentContractBalance.toBigInt());
    });
    it('emits Withdraw event', async () => {
      const { fundraiser, otherAccount } = await loadFixture(
        deployFundraiserFixture
      );
      await fundraiser.connect(otherAccount).donate({ value });

      const expectedEvent = 'Withdraw';

      await expect(fundraiser.withdraw())
        .to.emit(fundraiser, expectedEvent)
        .withArgs(value);
    });
  });
  describe('fallback function', () => {
    const value = ethers.utils.parseEther('0.0289');

    it('increases the totalDonations amount', async () => {
      const { fundraiser, otherAccount } = await loadFixture(
        deployFundraiserFixture
      );

      const currentTotalDonations = await fundraiser.totalDonations();

      await otherAccount.sendTransaction({
        to: fundraiser.address,
        value,
      });

      const newTotalDonations = await fundraiser.totalDonations();

      expect(
        newTotalDonations.toBigInt() - currentTotalDonations.toBigInt()
      ).to.eq(value.toBigInt());
    });

    it('increases donationCount', async () => {
      const { fundraiser, otherAccount } = await loadFixture(
        deployFundraiserFixture
      );

      const currentDonationCount = await fundraiser.donationsCount();

      await otherAccount.sendTransaction({
        to: fundraiser.address,
        value,
      });

      const newDonationCount = await fundraiser.donationsCount();

      expect(
        newDonationCount.toBigInt() - currentDonationCount.toBigInt()
      ).to.eq(1);
    });
  });
});

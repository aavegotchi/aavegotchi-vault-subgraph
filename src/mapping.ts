import { BigInt, store } from "@graphprotocol/graph-ts";
import { Transfer, Contract } from "../generated/Contract/Contract";
import {
  GotchiVault,
  OwnershipTransferred,
} from "../generated/GotchiVault/GotchiVault";
import { VAULT_ADDRESS } from "./constants";
import {
  getOrCreateAavegotchi,
  getOrCreateOwner,
  getOrCreateVault,
} from "./helper";

export function handleTransfer(event: Transfer): void {
  // deposit into vault
  if (event.params._to.equals(VAULT_ADDRESS)) {
    let contract = GotchiVault.bind(VAULT_ADDRESS);
    let depositor = contract.try_getDepositor(
      event.address, //diamond contract
      event.params._tokenId
    );

    //getDepositor function has been added
    if (!depositor.reverted) {
      let vault = getOrCreateVault(event.params._to);
      let gotchi = getOrCreateAavegotchi(event.params._tokenId);
      let owner = getOrCreateOwner(depositor.value);
      gotchi.vault = vault.id;
      gotchi.owner = owner.id;
      gotchi.save();

      vault.numGotchis = vault.numGotchis.plus(BigInt.fromI32(1));
      vault.save();

      owner.numGotchis = owner.numGotchis.plus(BigInt.fromI32(1));
      owner.save();
    }

    //getDepositor function probably wasn't added in yet
    else {
      let vault = getOrCreateVault(event.params._to);
      let gotchi = getOrCreateAavegotchi(event.params._tokenId);
      let owner = getOrCreateOwner(event.params._from);
      gotchi.vault = vault.id;
      gotchi.owner = owner.id;
      gotchi.save();

      vault.numGotchis = vault.numGotchis.plus(BigInt.fromI32(1));
      vault.save();

      owner.numGotchis = owner.numGotchis.plus(BigInt.fromI32(1));
      owner.save();
    }
  }
  // withdraw from vault
  else if (event.params._from.equals(VAULT_ADDRESS)) {
    let vault = getOrCreateVault(event.params._from);
    vault.numGotchis = vault.numGotchis.minus(BigInt.fromI32(1));
    vault.save();

    store.remove("Aavegotchi", event.params._tokenId.toString());

    let gotchi = getOrCreateAavegotchi(event.params._tokenId);
    let currentOwner = gotchi.owner;

    //Withdrawing from the Vault by original owner
    if (currentOwner === event.params._to.toHexString()) {
      let owner = getOrCreateOwner(event.params._to);
      owner.numGotchis = owner.numGotchis.minus(BigInt.fromI32(1));

      if (owner.numGotchis.equals(BigInt.fromI32(0))) {
        store.remove("Owner", owner.id);
      } else {
        owner.save();
      }
    }

    //Being lent out
    else {
      //do nothing?
    }
  }
}

// export function handleUpdateItemPrice(event: UpdateItemPrice): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

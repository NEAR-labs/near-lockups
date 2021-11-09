import {connect, Contract, keyStores, WalletConnection} from 'near-api-js'
import getConfig from './config'
import 'regenerator-runtime/runtime';

const nearConfig = getConfig(process.env.NODE_ENV || 'development')
const storage = JSON.parse(window.localStorage.getItem('lockups_local_storage'));
const contract = (storage !== null && storage.useMultisig) ? nearConfig.multisigAccount : nearConfig.contractName;
console.log(contract);

export async function initContract() {
  const near = await connect(Object.assign({deps: {keyStore: new keyStores.BrowserLocalStorageKeyStore()}}, nearConfig))
  window.walletConnection = new WalletConnection(near)
  window.accountId = contract === nearConfig.contractName ? window.walletConnection.getAccountId() : "multi.sigs.near"
  window.contract = await new Contract(window.walletConnection.account(), contract, {
    viewMethods: contract === nearConfig.contractName ? ['get_foundation_account_id', 'get_master_account_id', 'get_lockup_master_account_id', 'get_min_attached_balance'] : [],
    changeMethods: contract === nearConfig.contractName ? ['create'] : ['add_request'],
  })
}

export function logout() {
  window.walletConnection.signOut()
  window.location.replace(window.location.origin + window.location.pathname)
}

export function login() {

  console.log(window.walletConnection);
  window.walletConnection.requestSignIn(contract)
}

/* --------------------------------------- Ledger support ----------------------------------------------------------- */
export function getKeys() {
  let keys = window.localStorage.getItem('keys');
  return keys ? JSON.parse(keys) : [];
}

export function setKeys(keys) {
  window.localStorage.setItem('keys', JSON.stringify(keys));
}

export async function findPath(accessKeys) {
  let keys = getKeys();
  for (let i = 0; i < keys.length; ++i) {
    let publicKey = 'ed25519:' + encode(Buffer.from(keys[i].publicKey));
    console.log(accessKeys, publicKey, accessKeys.includes(publicKey));
    if (accessKeys.includes(publicKey)) {
      console.log({publicKey, path: keys[i].path});
      return {publicKey, path: keys[i].path};
    }
  }
  return {publicKey: null, path: null};
}


import { Provider, Contract, Signer, utils } from 'koilib';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default RPC endpoint
const DEFAULT_RPC = 'https://api.koinos.io';
const RPC_STORAGE_KEY = 'koinos_rpc_url';

// Mainnet KOIN contract address (verified)
const KOIN_CONTRACT = '19GYjDBVXU7keLbYvMLazsGQn3GTWHjHkK';

// Token ABI (from kcli - proven to work)
const tokenAbi = {
  methods: {
    name: {
      argument: "koinos.contracts.token.name_arguments",
      return: "koinos.contracts.token.name_result",
      entry_point: 2191741823,
      read_only: true
    },
    symbol: {
      argument: "koinos.contracts.token.symbol_arguments",
      return: "koinos.contracts.token.symbol_result",
      entry_point: 3076815009,
      read_only: true
    },
    decimals: {
      argument: "koinos.contracts.token.decimals_arguments",
      return: "koinos.contracts.token.decimals_result",
      entry_point: 4001430831,
      read_only: true
    },
    total_supply: {
      argument: "koinos.contracts.token.total_supply_arguments",
      return: "koinos.contracts.token.total_supply_result",
      entry_point: 2967091508,
      read_only: true
    },
    balance_of: {
      argument: "koinos.contracts.token.balance_of_arguments",
      return: "koinos.contracts.token.balance_of_result",
      entry_point: 1550980247,
      read_only: true
    },
    transfer: {
      argument: "koinos.contracts.token.transfer_arguments",
      return: "koinos.contracts.token.transfer_result",
      entry_point: 670398154,
      read_only: false
    }
  },
  koilib_types: {
    nested: {
      koinos: {
        nested: {
          contracts: {
            nested: {
              token: {
                nested: {
                  name_arguments: { fields: {} },
                  name_result: { fields: { value: { type: "string", id: 1 } } },
                  symbol_arguments: { fields: {} },
                  symbol_result: { fields: { value: { type: "string", id: 1 } } },
                  decimals_arguments: { fields: {} },
                  decimals_result: { fields: { value: { type: "uint32", id: 1 } } },
                  total_supply_arguments: { fields: {} },
                  total_supply_result: { fields: { value: { type: "uint64", id: 1, options: { jstype: "JS_STRING" } } } },
                  balance_of_arguments: { fields: { owner: { type: "bytes", id: 1, options: { "(koinos.btype)": "ADDRESS" } } } },
                  balance_of_result: { fields: { value: { type: "uint64", id: 1, options: { jstype: "JS_STRING" } } } },
                  transfer_arguments: {
                    fields: {
                      from: { type: "bytes", id: 1, options: { "(koinos.btype)": "ADDRESS" } },
                      to: { type: "bytes", id: 2, options: { "(koinos.btype)": "ADDRESS" } },
                      value: { type: "uint64", id: 3, options: { jstype: "JS_STRING" } }
                    }
                  },
                  transfer_result: { fields: {} }
                }
              }
            }
          }
        }
      }
    }
  }
};

export class KoinosService {
  private provider: Provider;
  private rpcUrl: string;

  constructor(rpcUrl: string = DEFAULT_RPC) {
    this.rpcUrl = rpcUrl;
    this.provider = new Provider(rpcUrl);
  }

  async getRpcUrl(): Promise<string> {
    const stored = await AsyncStorage.getItem(RPC_STORAGE_KEY);
    const nextUrl = stored || this.rpcUrl || DEFAULT_RPC;
    if (nextUrl !== this.rpcUrl) {
      this.rpcUrl = nextUrl;
      this.provider = new Provider(nextUrl);
    }
    return this.rpcUrl;
  }

  async setRpcUrl(url: string): Promise<void> {
    this.rpcUrl = url;
    this.provider = new Provider(url);
    await AsyncStorage.setItem(RPC_STORAGE_KEY, url);
  }

  async getChainInfo() {
    return await this.provider.getHeadInfo();
  }

  async getBalance(address: string): Promise<string> {
    try {
      const rc = await this.provider.getAccountRc(address);
      if (rc) {
        return utils.formatUnits(rc, 8);
      }
      return '0';
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  async getMana(address: string): Promise<{ current: string; max: string }> {
    try {
      const rc = await this.provider.getAccountRc(address);
      const currentMana = utils.formatUnits(rc || '0', 8);
      return {
        current: currentMana,
        max: currentMana,
      };
    } catch (error) {
      console.error('Error getting mana:', error);
      return { current: '0', max: '0' };
    }
  }

  async getNonce(address: string): Promise<string> {
    try {
      const nonce = await this.provider.getNonce(address);
      return String(nonce || '0');
    } catch (error) {
      console.error('Error getting nonce:', error);
      return '0';
    }
  }

  async sendKoin(
    signer: Signer,
    toAddress: string,
    amount: string
  ): Promise<{ transactionId: string; success: boolean }> {
    try {
      // Connect signer to provider
      signer.provider = this.provider;

      const fromAddress = signer.getAddress();

      // Debug: verify signer
      console.log('=== TRANSACTION DEBUG ===');
      console.log('Signer address:', fromAddress);
      console.log('Signer has provider:', !!signer.provider);

      // Verify the address has balance
      const rc = await this.provider.getAccountRc(fromAddress);
      console.log('Account RC:', rc);

      // Create contract with signer and the proven ABI
      const koinContract = new Contract({
        id: KOIN_CONTRACT,
        abi: tokenAbi,
        provider: this.provider,
        signer: signer,
      });

      // Convert amount to satoshis (8 decimals)
      const amountSatoshis = utils.parseUnits(amount, 8);

      console.log('Sending transaction:', {
        from: fromAddress,
        to: toAddress,
        value: amountSatoshis,
        rcLimit: "100000000",
      });

      // Execute transfer with rc_limit (mana limit for the transaction)
      // 100000000 = 1 KOIN worth of mana, should be more than enough
      const { transaction, receipt } = await koinContract.functions.transfer(
        {
          from: fromAddress,
          to: toAddress,
          value: amountSatoshis,
        },
        {
          rcLimit: "100000000",
        }
      );

      // Wait for transaction to be mined
      if (transaction) {
        console.log('Transaction submitted, waiting for confirmation...');
        const blockInfo = await transaction.wait();
        console.log('Transaction mined:', blockInfo);
      }

      const txId = receipt?.id || transaction?.id || 'unknown';

      return {
        transactionId: txId,
        success: true,
      };
    } catch (error: any) {
      console.error('Error sending KOIN:', error);
      throw new Error(error.message || 'Failed to send KOIN');
    }
  }

  // Validate Koinos address format
  static isValidAddress(address: string): boolean {
    try {
      if (!address || address.length < 26 || address.length > 35) {
        return false;
      }
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
      return base58Regex.test(address);
    } catch {
      return false;
    }
  }
}

export default new KoinosService();

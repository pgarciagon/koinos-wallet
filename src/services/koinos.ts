import { Provider, Contract, Signer, utils, Transaction } from 'koilib';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default RPC endpoint
const DEFAULT_RPC = 'https://api.koinos.io';
const RPC_STORAGE_KEY = 'koinos_rpc_url';

// Mainnet KOIN contract address (verified)
const KOIN_CONTRACT = '19GYjDBVXU7keLbYvMLazsGQn3GTWHjHkK';

// Mainnet VHP contract address
const VHP_CONTRACT = '12Y5vW6gk8GceH53YfRkRre2Rrcsgw7Naq';

// Mainnet Free Mana Sharer contract (community-funded)
const FREE_MANA_SHARER = '162GhJwsciDiKsgwzj2t6VoFHt3RMzGKdG';

// Mainnet Mana Meter contract — used for dry-run estimation (same as Kondor)
const MANA_METER = '1MqveNK3piSGPHGocsRUCVhpCPLgQA58K9';

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
      const koinContract = new Contract({
        id: KOIN_CONTRACT,
        abi: tokenAbi,
        provider: this.provider,
      });

      const { result } = await koinContract.functions.balance_of({
        owner: address,
      });

      if (result?.value) {
        return utils.formatUnits(result.value, 8);
      }
      return '0';
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  async getVhpBalance(address: string): Promise<string> {
    try {
      const vhpContract = new Contract({
        id: VHP_CONTRACT,
        abi: tokenAbi,
        provider: this.provider,
      });

      const { result } = await vhpContract.functions.balance_of({
        owner: address,
      });

      if (result?.value) {
        return utils.formatUnits(result.value, 8);
      }
      return '0';
    } catch (error) {
      console.error('Error getting VHP balance:', error);
      return '0';
    }
  }

  async getMana(address: string): Promise<{ current: string; max: string }> {
    try {
      const rc = await this.provider.getAccountRc(address);
      const currentMana = utils.formatUnits(rc || '0', 8);

      // Max mana equals the KOIN balance (mana regenerates from KOIN)
      const koinBalance = await this.getBalance(address);

      return {
        current: currentMana,
        max: koinBalance || currentMana,
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

  async getResourceLimits(): Promise<{
    disk_storage_cost: number;
    network_bandwidth_cost: number;
    compute_bandwidth_cost: number;
  }> {
    try {
      const result = await this.provider.call<{
        resource_limit_data: {
          disk_storage_limit: string;
          disk_storage_cost: string;
          network_bandwidth_limit: string;
          network_bandwidth_cost: string;
          compute_bandwidth_limit: string;
          compute_bandwidth_cost: string;
        };
      }>('chain.get_resource_limits', {});

      return {
        disk_storage_cost: Number(result.resource_limit_data.disk_storage_cost) || 0,
        network_bandwidth_cost: Number(result.resource_limit_data.network_bandwidth_cost) || 0,
        compute_bandwidth_cost: Number(result.resource_limit_data.compute_bandwidth_cost) || 0,
      };
    } catch (error) {
      console.error('Error getting resource limits:', error);
      return { disk_storage_cost: 0, network_bandwidth_cost: 0, compute_bandwidth_cost: 0 };
    }
  }

  /**
   * Estimate the mana cost for a simple token transfer.
   * Uses typical resource usage from observed transactions and current network costs.
   * Returns the estimated cost in KOIN (8 decimals formatted).
   */
  async estimateTransferCost(): Promise<{ rcEstimate: string; koinEstimate: string }> {
    try {
      const costs = await this.getResourceLimits();

      // Typical resource usage for a simple token transfer (from observed transactions)
      const TYPICAL_DISK_STORAGE = 112;         // bytes
      const TYPICAL_NETWORK_BANDWIDTH = 313;    // bytes
      const TYPICAL_COMPUTE_BANDWIDTH = 565000; // compute units

      const estimatedRc =
        TYPICAL_DISK_STORAGE * costs.disk_storage_cost +
        TYPICAL_NETWORK_BANDWIDTH * costs.network_bandwidth_cost +
        TYPICAL_COMPUTE_BANDWIDTH * costs.compute_bandwidth_cost;

      // Add 20% buffer for safety
      const bufferedRc = Math.round(estimatedRc * 1.2);

      return {
        rcEstimate: String(bufferedRc),
        koinEstimate: utils.formatUnits(String(bufferedRc), 8),
      };
    } catch (error) {
      console.error('Error estimating transfer cost:', error);
      return { rcEstimate: '0', koinEstimate: '0' };
    }
  }

  /**
   * Check available mana from the Free Mana Sharer contract.
   */
  async getFreeManaAvailable(): Promise<{ available: boolean; mana: string }> {
    try {
      console.log('Checking free mana sharer RC for:', FREE_MANA_SHARER);
      const rc = await this.provider.getAccountRc(FREE_MANA_SHARER);
      console.log('Free mana sharer raw RC:', rc);
      const mana = utils.formatUnits(rc || '0', 8);
      console.log('Free mana sharer formatted mana:', mana);
      const available = parseFloat(mana) > 0.01;
      return { available, mana };
    } catch (error: any) {
      console.error('Error checking free mana sharer:', error?.message || error);
      return { available: false, mana: '0' };
    }
  }

  /**
   * Determine if user needs free mana for a transfer.
   * Returns true if user's remaining mana after the transfer won't cover the RC cost.
   */
  async needsFreeMana(
    address: string,
    token: 'KOIN' | 'VHP',
    sendAmount: string
  ): Promise<boolean> {
    try {
      const [mana, cost] = await Promise.all([
        this.getMana(address),
        this.estimateTransferCost(),
      ]);

      let remainingMana = parseFloat(mana.current);

      // If sending KOIN, the balance drops and so does max mana
      if (token === 'KOIN') {
        const currentBalance = parseFloat(await this.getBalance(address));
        const sending = parseFloat(sendAmount) || 0;
        const newBalance = currentBalance - sending;
        // After transfer, mana is capped by new KOIN balance
        remainingMana = Math.min(remainingMana, newBalance);
      }

      const rcNeeded = parseFloat(cost.koinEstimate);
      return remainingMana < rcNeeded;
    } catch {
      return false;
    }
  }

  getFreeManaSharerAddress(): string {
    return FREE_MANA_SHARER;
  }

  async sendKoin(
    signer: Signer,
    toAddress: string,
    amount: string,
    options?: { useFreeMana?: boolean }
  ): Promise<{ transactionId: string; success: boolean }> {
    try {
      // Connect signer to provider
      signer.provider = this.provider;

      const fromAddress = signer.getAddress();

      console.log('=== TRANSACTION DEBUG ===');
      console.log('Signer address:', fromAddress);
      console.log('Signer has provider:', !!signer.provider);
      console.log('Use free mana:', options?.useFreeMana);
      console.log('Amount (string):', amount);

      const amountSatoshis = utils.parseUnits(amount, 8);
      console.log('Amount (satoshis):', amountSatoshis);

      // KOIN contract enforces: from.mana >= transfer_amount.
      // Check this before attempting the transaction to give a clear error.
      const accountRc = await this.provider.getAccountRc(fromAddress);
      const amountNum = parseFloat(amount);
      const manaNum = parseFloat(utils.formatUnits(accountRc, 8));
      console.log('Account mana:', manaNum, 'KOIN, Transfer amount:', amountNum, 'KOIN');
      if (amountNum > manaNum) {
        throw new Error(
          `Cannot send ${amountNum} KOIN: your current mana is only ${manaNum.toFixed(4)} KOIN. ` +
          `The KOIN contract requires mana >= transfer amount. ` +
          `Mana regenerates over 5 days up to your KOIN balance.`
        );
      }

      // Create contract (for encoding operations only, no direct send)
      const koinContract = new Contract({
        id: KOIN_CONTRACT,
        abi: tokenAbi,
        provider: this.provider,
        signer: signer,
      });

      if (options?.useFreeMana) {
        // === TWO-PHASE MANA METER APPROACH (like Kondor) ===
        // Phase 1: Build TX with mana meter as payer for dry-run estimation
        const manaMeterRc = await this.provider.getAccountRc(MANA_METER);
        const manaMeterRcLimit = Math.floor(0.9 * Number(manaMeterRc));
        console.log('Mana meter RC:', manaMeterRc, '-> rcLimit for dry-run:', manaMeterRcLimit);

        const tx = new Transaction({
          signer,
          provider: this.provider,
          options: {
            payer: FREE_MANA_SHARER,
            rcLimit: String(manaMeterRcLimit),
          },
        });

        // Push the transfer operation
        await tx.pushOperation(koinContract.functions.transfer, {
          from: fromAddress,
          to: toAddress,
          value: amountSatoshis,
        });

        // Override payer to mana meter for the dry-run
        tx.transaction.header!.payee = fromAddress;
        tx.transaction.header!.payer = MANA_METER;
        tx.transaction.header!.rc_limit = manaMeterRcLimit;
        tx.transaction.id = Transaction.computeTransactionId(tx.transaction.header!);

        // Prepare (fills nonce, chain_id, merkle root) and sign
        await tx.prepare();
        await tx.sign();

        // Phase 1: Dry-run to get actual rc_used
        console.log('Phase 1: Dry-run with mana meter...');
        console.log('TX header before dry-run:', JSON.stringify(tx.transaction.header));
        const dryRunReceipt = await tx.send({ broadcast: false });
        console.log('Dry-run receipt:', JSON.stringify({
          rc_used: dryRunReceipt?.rc_used,
          reverted: dryRunReceipt?.reverted,
          logs: dryRunReceipt?.logs,
        }));

        if (!dryRunReceipt || !dryRunReceipt.rc_used) {
          throw new Error('Dry-run failed: no rc_used returned');
        }

        // Phase 2: Set free mana sharer as real payer
        let rcLimit = Math.round(1.1 * Number(dryRunReceipt.rc_used));
        console.log('Phase 2: Initial rcLimit (1.1 * rc_used):', rcLimit);

        tx.transaction.header!.payer = FREE_MANA_SHARER;
        tx.transaction.header!.payee = fromAddress;
        tx.transaction.header!.rc_limit = rcLimit;
        tx.transaction.id = Transaction.computeTransactionId(tx.transaction.header!);
        tx.transaction.signatures = [];
        await tx.sign();

        // Phase 2b: Dry-run with actual payer, retry with +1 KOIN on "insufficient rc"
        // (Kondor does this because the free mana sharer's authorize() adds extra RC overhead)
        let phase2Receipt;
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            console.log(`Phase 2 attempt ${attempt + 1}: dry-run with payer=${FREE_MANA_SHARER}, rcLimit=${rcLimit}`);
            phase2Receipt = await tx.send({ broadcast: false });
            console.log(`Phase 2 attempt ${attempt + 1} SUCCESS. rc_used:`, phase2Receipt?.rc_used);
            break; // dry-run succeeded
          } catch (retryError: any) {
            const errMsg = retryError?.message || '';
            console.log(`Phase 2 attempt ${attempt + 1} FAILED:`, errMsg);
            if (attempt >= 4 || !errMsg.includes('insufficient rc')) {
              throw retryError; // give up after 5 tries or on non-rc errors
            }
            // Add 1 KOIN (100_000_000 satoshis) to rcLimit and retry
            rcLimit += 100000000;
            console.log(`Bumping rcLimit to ${rcLimit} (+1 KOIN) and retrying...`);
            tx.transaction.header!.rc_limit = rcLimit;
            tx.transaction.id = Transaction.computeTransactionId(tx.transaction.header!);
            tx.transaction.signatures = [];
            await tx.sign();
          }
        }

        // Phase 3: Send for real with the validated rcLimit
        console.log('Phase 3: Broadcasting with final rcLimit:', rcLimit);
        console.log('Final header:', JSON.stringify(tx.transaction.header));
        // Need to re-sign since dry-run consumed the send
        tx.transaction.signatures = [];
        await tx.sign();
        const receipt = await tx.send();

        console.log('Transaction sent! Receipt:', JSON.stringify(receipt));

        // Wait for mining
        if (tx.waitFunction) {
          console.log('Waiting for transaction to be mined...');
          const blockInfo = await tx.waitFunction();
          console.log('Transaction mined:', blockInfo);
        }

        return {
          transactionId: receipt?.id || tx.transaction.id || 'unknown',
          success: true,
        };
      } else {
        // === STANDARD SELF-PAY: use Contract.functions.transfer directly ===
        const rc = await this.provider.getAccountRc(fromAddress);
        console.log('Self-pay, Account RC:', rc);

        const { transaction, receipt } = await koinContract.functions.transfer(
          {
            from: fromAddress,
            to: toAddress,
            value: amountSatoshis,
          },
          { rcLimit: rc || '10000000' }
        );

        if (transaction) {
          console.log('Transaction submitted, waiting for confirmation...');
          const blockInfo = await transaction.wait();
          console.log('Transaction mined:', blockInfo);
        }

        return {
          transactionId: receipt?.id || transaction?.id || 'unknown',
          success: true,
        };
      }
    } catch (error: any) {
      console.error('Error sending KOIN:', error);
      throw new Error(error.message || 'Failed to send KOIN');
    }
  }

  async sendVhp(
    signer: Signer,
    toAddress: string,
    amount: string,
    options?: { useFreeMana?: boolean }
  ): Promise<{ transactionId: string; success: boolean }> {
    try {
      // Connect signer to provider
      signer.provider = this.provider;

      const fromAddress = signer.getAddress();

      console.log('=== VHP TRANSACTION DEBUG ===');
      console.log('Signer address:', fromAddress);
      console.log('Use free mana:', options?.useFreeMana);

      // Create VHP contract
      const vhpContract = new Contract({
        id: VHP_CONTRACT,
        abi: tokenAbi,
        provider: this.provider,
        signer: signer,
      });

      const amountSatoshis = utils.parseUnits(amount, 8);

      if (options?.useFreeMana) {
        // === TWO-PHASE MANA METER APPROACH (like Kondor) ===
        const manaMeterRc = await this.provider.getAccountRc(MANA_METER);
        const manaMeterRcLimit = Math.floor(0.9 * Number(manaMeterRc));
        console.log('Mana meter RC:', manaMeterRc, '-> rcLimit for dry-run:', manaMeterRcLimit);

        const tx = new Transaction({
          signer,
          provider: this.provider,
          options: {
            payer: FREE_MANA_SHARER,
            rcLimit: String(manaMeterRcLimit),
          },
        });

        // Push the transfer operation
        await tx.pushOperation(vhpContract.functions.transfer, {
          from: fromAddress,
          to: toAddress,
          value: amountSatoshis,
        });

        // Override payer to mana meter for the dry-run
        tx.transaction.header!.payee = fromAddress;
        tx.transaction.header!.payer = MANA_METER;
        tx.transaction.header!.rc_limit = manaMeterRcLimit;
        tx.transaction.id = Transaction.computeTransactionId(tx.transaction.header!);

        // Prepare and sign
        await tx.prepare();
        await tx.sign();

        // Phase 1: Dry-run
        console.log('Phase 1: Dry-run with mana meter...');
        const dryRunReceipt = await tx.send({ broadcast: false });
        console.log('Dry-run rc_used:', dryRunReceipt.rc_used);

        if (!dryRunReceipt || !dryRunReceipt.rc_used) {
          throw new Error('Dry-run failed: no rc_used returned');
        }

        // Phase 2: Set free mana sharer as real payer
        let rcLimit = Math.round(1.1 * Number(dryRunReceipt.rc_used));
        console.log('Phase 2: Initial rcLimit (1.1 * rc_used):', rcLimit);

        tx.transaction.header!.payer = FREE_MANA_SHARER;
        tx.transaction.header!.payee = fromAddress;
        tx.transaction.header!.rc_limit = rcLimit;
        tx.transaction.id = Transaction.computeTransactionId(tx.transaction.header!);
        tx.transaction.signatures = [];
        await tx.sign();

        // Phase 2b: Dry-run with actual payer, retry with +1 KOIN on "insufficient rc"
        let phase2Receipt;
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            console.log(`VHP Phase 2 attempt ${attempt + 1}: dry-run with payer=${FREE_MANA_SHARER}, rcLimit=${rcLimit}`);
            phase2Receipt = await tx.send({ broadcast: false });
            console.log(`VHP Phase 2 attempt ${attempt + 1} SUCCESS. rc_used:`, phase2Receipt?.rc_used);
            break;
          } catch (retryError: any) {
            const errMsg = retryError?.message || '';
            console.log(`VHP Phase 2 attempt ${attempt + 1} FAILED:`, errMsg);
            if (attempt >= 4 || !errMsg.includes('insufficient rc')) {
              throw retryError;
            }
            rcLimit += 100000000;
            console.log(`Bumping rcLimit to ${rcLimit} (+1 KOIN) and retrying...`);
            tx.transaction.header!.rc_limit = rcLimit;
            tx.transaction.id = Transaction.computeTransactionId(tx.transaction.header!);
            tx.transaction.signatures = [];
            await tx.sign();
          }
        }

        // Phase 3: Send for real
        console.log('VHP Phase 3: Broadcasting with final rcLimit:', rcLimit);
        console.log('Final header:', JSON.stringify(tx.transaction.header));
        tx.transaction.signatures = [];
        await tx.sign();
        const receipt = await tx.send();

        console.log('VHP Transaction sent! Receipt:', JSON.stringify(receipt));

        if (tx.waitFunction) {
          console.log('Waiting for VHP transaction to be mined...');
          const blockInfo = await tx.waitFunction();
          console.log('VHP Transaction mined:', blockInfo);
        }

        return {
          transactionId: receipt?.id || tx.transaction.id || 'unknown',
          success: true,
        };
      } else {
        // === STANDARD SELF-PAY ===
        const rc = await this.provider.getAccountRc(fromAddress);
        console.log('Self-pay, Account RC:', rc);

        const { transaction, receipt } = await vhpContract.functions.transfer(
          {
            from: fromAddress,
            to: toAddress,
            value: amountSatoshis,
          },
          { rcLimit: rc || '10000000' }
        );

        if (transaction) {
          console.log('VHP Transaction submitted, waiting for confirmation...');
          const blockInfo = await transaction.wait();
          console.log('VHP Transaction mined:', blockInfo);
        }

        return {
          transactionId: receipt?.id || transaction?.id || 'unknown',
          success: true,
        };
      }
    } catch (error: any) {
      console.error('Error sending VHP:', error);
      throw new Error(error.message || 'Failed to send VHP');
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

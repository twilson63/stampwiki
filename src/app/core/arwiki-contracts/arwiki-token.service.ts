import { Injectable } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { ArweaveService } from '../arweave.service';
import { map, tap } from 'rxjs/operators';
import { JWKInterface } from 'arweave/node/lib/wallet';
import { WarpContractsService } from '../warp-contracts.service';
import { UtilsService } from '../utils.service';

@Injectable({
  providedIn: 'root'
})
export class ArwikiTokenContract {
  // Old Contract (ArWiki v1)
  // private _contractAddress: string = 'ewepANKEVffP0cm_XKjwTYhSBqaiQrJbVrCcBiWqw-s';

  // New contract demo (ArWiki v2)
  // Single level
  // private _contractAddress = 'JGrP0IV4aVOAx1lgozOjQhZkUVv8-y1xfUcCR9ra8QQ';
  // private _contractAddress = '85laIArWvKoJ1SZBvBzM6yUmVD-JbnS5EsV67Dya83k';

  // One holder
  // private _contractAddress = '2nZIuLR0g9EqhDm7M-5Si0QeJfhL07oYLlkrHTVvHQE';
  // private _contractAddress = 'FBF6LiAtREEaGu5ejKbEdRZcUn16yqQeVIwcjgysWTc';
  // private _contractAddress = '1VjJfXCKHuctK221iK8TKza66N3SnBKvWgZvfxqojjw';
  private _contractAddress = 'VGnXS4_MwUwPA5HvNT6kvon41Hst9E7jqwUaS99VyFQ';

  // Multi level
  // private _contractAddress = 'aYnwKbqL603IKdP-Ba_kG73K7EeURTeF1jUoz4YJqxA';

  private _state: any = {};

  get contractAddress() {
    return this._contractAddress;
  }

  constructor(
    private _arweave: ArweaveService,
    private _warp: WarpContractsService,
    private _utils: UtilsService
  ) { }

  /*
  *  @dev Get full contract state as Observable
  */
  getState(reload: boolean = false): Observable<any> {
    const obs = new Observable<any>((subscriber) => {
      if (Object.keys(this._state).length > 0 && !reload) {
        subscriber.next(this._state);
        subscriber.complete();
      } else {
        this._warp.readState(this._contractAddress).subscribe({
          next: (res) => {
            const cachedValue = res.cachedValue;
            const sortKey = res.sortKey;
            const state = cachedValue &&
              Object.prototype.hasOwnProperty.call(cachedValue, 'state') ?
              cachedValue.state : {};
            this._state = state;

            //this._adminList = Object.keys(this._state.roles).filter((address) => {
            //  return this._state.roles[address].toUpperCase() === 'MODERATOR';
            //});

            subscriber.next(this._state);
            subscriber.complete();
          }, error: (err) => {
            subscriber.error(err);
          }
        })

      }

    });

    return obs;
  }


  /*
  *  @dev Return state
  */
  getStateFromLocal(): any {
    return this._utils.cloneObject(this._state);
  }

  /*
  *	@dev Execute read function on PST contract
  */
  getBalance(address: string, reload: boolean = false): Observable<any> {
    return this.getState(reload).pipe(
      map((_state: any) => {
        const balances = _state.balances;
        const vault = _state.vault;
        const stakes = _state.stakes;
        const balance = this.getBalanceDetail(address, balances, vault, stakes);
        return balance.result;
      })
    );
  }

  /*
  *  @dev Execute read function on PST contract
  */
  getBalanceAndTotalSupply(address: string, reload: boolean = false): Observable<any> {
    return this.getState(reload).pipe(
      map((_state: any) => {
        const balances = _state.balances;
        const vault = _state.vault;
        const stakes = _state.stakes;
        const balance = this.getBalanceDetail(address, balances, vault, stakes);
        const totalSupply = this._calculate_total_supply(
          vault, balances, stakes
        );
        return { balance: balance.result, totalSupply: totalSupply };
      })
    );
  }

  /*
  *  @dev Execute read function on PST contract
  */
  getTotalSupply(reload: boolean = false): Observable<any> {
    return this.getState(reload).pipe(
      map((_state: any) => {
        const balances = _state.balances;
        const vault = _state.vault;
        const stakes = _state.stakes;
        const totalSupply = this._calculate_total_supply(
          vault, balances, stakes
        );
        return totalSupply;
      })
    );
  }

  _calculate_total_supply(vault: any, balances: any, stakes: any) {
    const vaultValues2 = Object.values(vault);
    let totalSupply = 0;
    for (let i = 0, j = vaultValues2.length; i < j; i++) {
      const locked: any = vaultValues2[i];
      for (let j2 = 0, k = locked.length; j2 < k; j2++) {
        totalSupply += locked[j2].balance;
      }
    }
    const balancesValues: any = Object.values(balances);
    for (let i = 0, j = balancesValues.length; i < j; i++) {
      totalSupply += balancesValues[i];
    }
    for (const target of Object.keys(stakes)) {
      for (const vLang of Object.keys(stakes[target])) {
        for (const vSlug of Object.keys(stakes[target][vLang])) {
          totalSupply += stakes[target][vLang][vSlug];
        }
      }
    }
    return totalSupply;
  }


  /*
  *	@dev Get the settings property from full state contract
  */
  getSettings(reload = false): Observable<any> {
    return this.getState(reload).pipe(
      map((_state: any) => {
        const settings_obj = this._utils.cloneObject(_state.settings);
        const settings = new Map(settings_obj);
        return settings;
      })
    );
  }

  getBalanceDetail(_target: string, _balances: any, _vault: any, _stakes: any) {
    const target = _target;
    const balances = _balances;
    const vault = _vault;
    const stakes = _stakes;
    let unlockedBalance = 0;
    let vaultBalance = 0;
    let stakingBalance = 0;
    if (target in balances) {
      unlockedBalance = balances[target];
    }
    if (target in vault && vault[target].length) {
      try {
        vaultBalance += vault[target].map((a: any) => a.balance).reduce((a: any, b: any) => a + b, 0);
      } catch (e) {
      }
    }
    const stakingDict = stakes[target] ? stakes[target] : {};
    for (const vLang of Object.keys(stakingDict)) {
      for (const vSlug of Object.keys(stakingDict[vLang])) {
        stakingBalance += stakes[target][vLang][vSlug];
      }
    }
    return { result: { target, unlockedBalance, vaultBalance, stakingBalance } };
  }

  /*
  * @dev Transfer wiki tokens
  */
  transferTokens(
    _target: string,
    _privateKey: any,
    _amount: number,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      { name: 'Service', value: 'ArWiki' },
      { name: 'Arwiki-Type', value: 'TransferTokens' },
      { name: 'Arwiki-Version', value: _arwikiVersion },
    ];
    const input = {
      function: 'transfer',
      target: _target,
      qty: _amount,
    };

    return this._warp.writeInteraction(
      this._contractAddress, jwk, input, tags
    );
  }


  /*
  *  @dev Get all balances variables
  */
  getAllBalances(_reload = false): Observable<any> {
    return this.getState(_reload).pipe(
      map((_state: any) => {
        const res = {
          'vault': this._utils.cloneObject(_state.vault),
          'stakes': this._utils.cloneObject(_state.stakes),
          'balances': this._utils.cloneObject(_state.balances)
        };
        return res;
      })
    );
  }

  /*
  * @dev Lock tokens in vault
  */
  lockTokensInVault(
    _lockLength: number,
    _amount: number,
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      { name: 'Service', value: 'ArWiki' },
      { name: 'Arwiki-Type', value: 'LockInVault' },
      { name: 'Arwiki-Version', value: _arwikiVersion },
    ];
    const input = {
      function: 'lock',
      lockLength: _lockLength,
      qty: _amount,
    };

    return this._warp.writeInteraction(
      this._contractAddress, jwk, input, tags
    );
  }

  /*
  * @dev Unlock vault
  */
  unlockVault(
    _privateKey: any,
    _arwikiVersion: string
  ) {
    const jwk = _privateKey;
    const tags = [
      { name: 'Service', value: 'ArWiki' },
      { name: 'Arwiki-Type', value: 'UnlockVault' },
      { name: 'Arwiki-Version', value: _arwikiVersion },
    ];
    const input = {
      function: 'unlock'
    };

    return this._warp.writeInteraction(
      this._contractAddress, jwk, input, tags
    );
  }


  /*
  *  @dev Get balances
  */
  getBalancesFromLocal(): { balances: any, vault: any, stakes: any } {
    const state = { ...this._utils.cloneObject(this._state) };
    return { balances: { ...state.balances }, vault: { ...state.vault }, stakes: { ...state.stakes } };
  }

  /*
  *  @dev Get all balances variables
  */
  getTokenNameAndTicker(): Observable<any> {
    return this.getState().pipe(
      map((_state: any) => {
        const res = {
          'name': _state.name,
          'ticker': _state.ticker
        };
        return res;
      })
    );
  }


}
import { Injectable } from '@angular/core';
import { catchError, tap, map } from 'rxjs/operators';
import { from, of } from 'rxjs';
import Web3 from 'web3';
import { RegisteredSubscription } from 'web3/lib/commonjs/eth.exports';

const GETH_URL_HTTP = 'http://GETH_URL_HTTP';
const GETH_URL_WS = 'ws://GETH_URL_WS';

export const web3 = new Web3(GETH_URL_HTTP);

@Injectable()
export class Web3Service {
  public web3WS: Web3<RegisteredSubscription> | null = null;

  constructor() {}

  public web3WebSockets() {
    if (this.web3WS) {
      return of(this.web3WS);
    }
    const web3WS = new Web3(new Web3.providers.WebsocketProvider(GETH_URL_WS));
    return from(web3WS.eth.net.isListening()).pipe(
      catchError(() => {
        this.web3WS = null;
        console.log('websocket disabled');
        return of(this.web3WS);
      }),
      tap(() => {
        console.log('websocket enabled');
        this.web3WS = web3WS;
      }),
      map(() => {
        return this.web3WS;
      })
    );
  }
}

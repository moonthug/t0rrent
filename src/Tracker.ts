import { EventEmitter } from 'events';
import { createSocket, Socket } from 'dgram';
import { parse as parseURL, Url } from 'url';

import { Protocol, ResponseType } from './Protocol';
import { Torrent } from './Torrent';

import Debug from 'debug';
const debug = Debug('t0rrent:tracker');

/**
 *
 */
export class Tracker extends EventEmitter {

  /**
   *
   */
  private readonly torrent: Torrent;

  /**
   *
   */
  private readonly socket: Socket;

  /**
   *
   */
  constructor(torrent: Torrent) {
    super();
    this.torrent = torrent;
    this.socket = createSocket('udp4');
    this._createSocketHandler();
  }

  /**
   *
   */
  public async getPeers(): Promise<number> {
    debug('get peers');
    return this._socketSend(Protocol.connectionRequest());
  }

  /**
   *
   * @param message
   * @private
   */
  private async _socketSend (message: Buffer): Promise<number> {
    debug(`socket send: ${this.torrent.announceURL()}`);

    const parsedUrl: Url = parseURL(this.torrent.announceURL());

    return new Promise((resolve, reject) => {
      this.socket.send(message, 0, message.length, parseInt(parsedUrl.port, 10), parsedUrl.hostname, (error, bytes) => {
        if (error) {
          return reject(error);
        }
        resolve(bytes);
      });
    });
  }

  /**
   *
   * @private
   */
  private _createSocketHandler(): void {
    this.socket.on('message', async (response: Buffer) => {
      const responseType = Protocol.getResponseType(response);

      if (responseType === ResponseType.connect) {
        debug(`received connect`);

        const connectionResponse = Protocol.connectionResponse(response);
        const announcementRequest = Protocol.announcementRequest(connectionResponse.connectionId, this.torrent);
        this.emit('connected');
        await this._socketSend(announcementRequest);
      } else if (responseType === ResponseType.announce) {
        debug(`received announce`);

        const announcementResponse = Protocol.announcementResponse(response);
        this.emit('peers', announcementResponse.peers)
      }
    });
  }
}

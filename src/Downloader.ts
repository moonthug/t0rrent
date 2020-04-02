import { EventEmitter } from 'events'

import { Torrent } from './Torrent';
import { Tracker } from './Tracker';
import { DownloadSocket } from './DownloadSocket';
import { Peer } from './Peer';
import { Pieces } from './Pieces';

import Debug from 'debug';
const debug = Debug('t0rrent:downloader');

export class Downloader extends EventEmitter {

  /**
   *
   */
  private readonly _torrent: Torrent;

  /**
   *
   */
  private readonly _tracker: Tracker;

  /**
   *
   */
  private readonly _pieces: Pieces;

  /**
   *
   */
  private readonly _sockets: Array<DownloadSocket>;

  /**
   *
   */
  constructor (torrent: Torrent) {
    super();
    this._torrent = torrent;

    this._tracker = new Tracker(this._torrent);
    this._pieces = new Pieces(this._torrent);
    this._sockets = [];

    this._createTrackerHandler();
  }

  /**
   *
   */
  public async start(): Promise<void> {
    debug(`start download: ${this._torrent.info().name.toString('utf-8')}`);

    const interval = setInterval(async () => {
      await this._tracker.getPeers();
    }, 10000);

    await this._tracker.getPeers();
  }

  /**
   *
   * @private
   */
  private _createTrackerHandler(): void {
    this._tracker.on('peers', (peers: Array<Peer>) => {
      this.emit('peers', peers);
      peers.forEach((peer: Peer) => {
        this._createDownloaderSocket(peer);
      })
    });
  }

  /**
   *
   * @private
   */
  private _createDownloaderSocket(peer: Peer): void {
    const socket = new DownloadSocket(peer, this._torrent, this._pieces);

    socket.on('error', (error: Error) => {
      console.log(`Socket Error => Connected: ${socket.isConnected}`);
    });

    socket.on('connected', () => {
      console.log(`Socket Connected => Connected: ${socket.isConnected}`);
    });

    socket.on('handshake', () => {
      console.log(`Handshake Complete`);
    });

    socket.on('complete', () => {
      console.log(`Socket download Complete`);
    });

    this._sockets.push(socket);
  }
}

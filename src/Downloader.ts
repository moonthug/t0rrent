import { EventEmitter } from 'events'

import { Torrent } from './Torrent';
import { Tracker } from './Tracker';
import { DownloadSocket } from './DownloadSocket';
import { Peer } from './Peer';

export class Downloader extends EventEmitter{

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
  private readonly _requested: Array<boolean>;

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
    this._requested = [];
    this._sockets = [];

    this._createTrackerHandler();
  }

  /**
   *
   */
  public async start(): Promise<void> {
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
    const socket = new DownloadSocket(peer, this._torrent, this._requested);

    socket.on('error', (error: Error) => {
      console.log(`Socket Error => Connected: ${socket.isConnected}`)
    });

    socket.on('connected', (error: Error) => {
      console.log(`Socket Connected => Connected: ${socket.isConnected}`)
    });

    this._sockets.push(socket);
  }
}

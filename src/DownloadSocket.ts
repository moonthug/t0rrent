import { EventEmitter } from 'events';
import { Socket } from 'net';

import { Peer } from './Peer';
import { Torrent } from './Torrent';
import { Protocol } from './Protocol'
import { MessageFactory } from './MessageFactory';
import { Bitfield, Choke, Have, Piece, Unchoke } from './messages';
import { Queue } from './Queue';
import { Pieces } from './Pieces';
import * as fs from 'fs';


export class DownloadSocket extends EventEmitter {

  /**
   *
   */
  private _isConnected: boolean;

  /**
   *
   */
  private readonly _peer: Peer;

  /**
   *
   */
  private readonly _torrent: Torrent;

  /**
   *
   */
  private readonly _requested: Array<boolean>;

  /**
   *
   */
  private readonly _socket: Socket;

  /**
   *
   */
  private readonly _queue: Queue;

  /**
   *
   */
  private readonly _pieces: Pieces;
  /**
   *
   */
  private readonly _messageFactory: MessageFactory;

  /**
   *
   */
  private readonly _fileHandle: number;

  /**
   *
   */
  constructor (peer: Peer, torrent: Torrent, requested: Array<boolean>) {
    super();
    this._peer = peer;
    this._torrent = torrent;
    this._requested = requested;

    this._socket = new Socket();
    this._queue = new Queue(this._torrent);
    this._pieces = new Pieces(this._torrent);
    this._messageFactory = new MessageFactory();

    this._fileHandle = fs.openSync('.temp', 'w');

    console.log(`Created Download Socket: ${this._peer}`);

    this._createSocketHandler();
  }

  /**
   *
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   *
   */
  get peer(): boolean {
    return this._isConnected;
  }

  /**
   *
   * @private
   */
  private _createSocketHandler(): void {
    let savedBuffer = Buffer.alloc(0);
    let handshake = true;

    this._socket.on('error', (error: Error) => {
      this._isConnected = false;
      this.emit('error', error);
    });

    this._socket.on('data', data => {
      const msgLen = () => handshake ? savedBuffer.readUInt8(0) + 49 : savedBuffer.readInt32BE(0) + 4;
      savedBuffer = Buffer.concat([savedBuffer, data]);

      while (savedBuffer.length >= 4 && savedBuffer.length >= msgLen()) {
        this._messageHandler(savedBuffer.slice(0, msgLen()));
        savedBuffer = savedBuffer.slice(msgLen());
        handshake = false;
      }
    });

    this._socket.connect(this._peer.port, this._peer.address, () => {
      this._isConnected = true;
      this.emit('connected');
      this._socket.write(Protocol.handshakeRequest(this._torrent));
    });
  }

  /**
   *
   * @param messageData
   * @private
   */
  private _messageHandler (messageData: Buffer) {
    if (Protocol.isHandshake(messageData)) {
      this._socket.write(Protocol.interested());
    } else {
      const message = this._messageFactory.createMessage(messageData);

      if (message instanceof Choke) {
        this._chokeHandler(message);
      }

      if (message instanceof Unchoke) {
        this._unchokeHandler(message);
      }

      if (message instanceof Have) {
        this._haveHandler(message);
      }

      if (message instanceof Bitfield) {
        this._bitfieldHandler(message);
      }

      if (message instanceof Piece) {
        this._pieceHandler(message);
      }
    }
  }

  private _chokeHandler (message: Choke) {
    this._socket.end();
  }

  private _unchokeHandler (message: Unchoke) {
    this._queue.choked = false;
    this._requestPiece();
  }

  private _haveHandler (message: Have) {
    const pieceIndex = message.payload.readUInt32BE(0);

    const queueEmpty = this._queue.isEmpty();
    this._queue.enqueue(pieceIndex);

    if (queueEmpty) {
      this._requestPiece();
    }
  }

  private _bitfieldHandler(message: Bitfield) {
    const queueEmpty = this._queue.isEmpty();
    message.payload.forEach((byte, i) => {
      for (let j = 0; j < 8; j++) {
        if (byte % 2) {
          this._queue.enqueue(i * 8 + 7 - j);
        }
        byte = Math.floor(byte / 2);
      }
    });

    if (queueEmpty) {
      this._requestPiece();
    }
  }

  private _pieceHandler (message: Piece) {
    this._pieces.printPercentDone();

    this._pieces.addReceived(message.payload);

    const offset = message.payload.index * this._torrent.info()['piece length'] + message.payload.begin;
    fs.write(this._fileHandle, message.payload.block, 0, message.payload.block.length, offset, () => {});

    if (this._pieces.isDone()) {
      console.log('DONE!');
      this._socket.end();
      try {
        fs.closeSync(this._fileHandle);
      } catch(e) {
      }
    } else {
      this._requestPiece();
    }
  }

  private _requestPiece (): void {
    if (this._queue.choked) return null;

    while (this._queue.length()) {
      const pieceBlock = this._queue.dequeue();
      if (this._pieces.needed(pieceBlock)) {
        this._socket.write(Protocol.request(pieceBlock));
        this._pieces.addRequested(pieceBlock);
        break;
      }
    }
  }
}

import { BLOCK_LEN, Torrent } from './Torrent';
import { Block } from './Block';

export class Queue {

  /**
   *
   */
  private readonly _torrent: Torrent;

  /**
   *
   */
  private readonly _queue: Array<Block>;

  /**
   *
   */
  public choked: boolean;

  /**
   *
   * @param torrent
   */
  constructor (torrent: Torrent) {
    this._torrent = torrent;
    this._queue = new Array<Block>();
    this.choked = true;
  }

  /**
   *
   * @param pieceIndex
   */
  public enqueue(pieceIndex: number) {
    const nBlocks = this._torrent.blocksPerPiece(pieceIndex);

    for (let i = 0; i < nBlocks; i++) {
      const pieceBlock = new Block(
        pieceIndex,
        i * BLOCK_LEN,
        this._torrent.blockLength(pieceIndex, i)
      );
      this._queue.push(pieceBlock);
    }
  }

  public dequeue() {
    return this._queue.shift();
  }

  public peek() {
    return this._queue[0];
  }

  public length() {
    return this._queue.length;
  }

  public isEmpty() {
    return this._queue.length === 0;
  }
}

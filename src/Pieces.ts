import { BLOCK_LEN, Torrent } from './Torrent';
import { Block } from './Block';

export class Pieces {

  /**
   *
   */
  private _requested:Array<Array<boolean>>;

  /**
   *
   */
  private _received:Array<Array<boolean>>;

  constructor(torrent: Torrent) {
    const buildPiecesArray = () => {
      const nPieces = torrent.info().pieces.length / 20;
      const arr = new Array(Math.floor(nPieces)).fill(null);
      return arr.map((_, i) => {
        return new Array(torrent.blocksPerPiece(i)).fill(false)
      });
    };

    this._requested = buildPiecesArray();
    this._received = buildPiecesArray();
  }

  addRequested(pieceBlock: Block) {
    const blockIndex = pieceBlock.begin / BLOCK_LEN;
    this._requested[pieceBlock.index][blockIndex] = true;
  }

  addReceived(pieceBlock: Block) {
    const blockIndex = pieceBlock.begin / BLOCK_LEN;
    this._received[pieceBlock.index][blockIndex] = true;
  }

  needed(pieceBlock: Block) {
    if (this._requested.every(blocks => blocks.every(i => i))) {
      this._requested = this._received.map(blocks => blocks.slice());
    }
    const blockIndex = pieceBlock.begin / BLOCK_LEN;
    return !this._requested[pieceBlock.index][blockIndex];
  }

  isDone() {
    return this._received.every(blocks => blocks.every(i => i));
  }

  printPercentDone() {
    const downloaded = this._received.reduce((totalBlocks, blocks) => {
      return blocks.filter(i => i).length + totalBlocks;
    }, 0);

    const total = this._received.reduce((totalBlocks, blocks) => {
      return blocks.length + totalBlocks;
    }, 0);

    const percent = Math.floor(downloaded / total * 100);

    process.stdout.write('progress: ' + percent + '%\r');
  }
};

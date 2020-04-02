import fs from 'fs';
import crypto from 'crypto';

import bencode, { ITorrent, ITorrentInfo } from 'bencode';

export const BLOCK_LEN = Math.pow(2, 14);

export class Torrent {

  /**
   *
   */
  torrent: ITorrent;

  /**
   * ]
   * @param filename
   */
  constructor (filename: string) {
    const torrentFile = fs.readFileSync(filename);
    this.torrent = bencode.decode(torrentFile);
  }

  /**
   *
   */
  public announceURL(): string {
    return this.torrent.announce.toString('utf-8');
  }

  /**
   *
   */
  public info(): ITorrentInfo {
    return this.torrent.info;
  }

  /**
   *
   */
  public infoHash(): Buffer {
    const info = bencode.encode(this.info());
    return crypto.createHash('sha1').update(info).digest();
  }

  /**
   *
   */
  public size(): Buffer {
    const size = this.torrent.info.files ?
      this.torrent.info.files
        .map((file: Buffer) => file.length)
        .reduce((a: number, b: number) => a + b) :
      this.torrent.info.length;

    return Buffer.from(BigInt(size).toString(8));
  }

  /**
   *
   * @param pieceIndex
   */
  public pieceLength(pieceIndex: number) {
    const totalLength = BigInt(this.size()).valueOf();
    const pieceLength = this.torrent.info['piece length'];

    const lastPieceLength = Number(totalLength) % pieceLength;
    const lastPieceIndex = Math.floor(Number(totalLength) / pieceLength);

    return lastPieceIndex === pieceIndex ? lastPieceLength : pieceLength;
  }

  /**
   *
   * @param pieceIndex
   */
  public blocksPerPiece(pieceIndex: number) {
    const pieceLength = this.pieceLength(pieceIndex);
    return Math.ceil(pieceLength / BLOCK_LEN);
  }

  /**
   *
   * @param pieceIndex
   * @param blockIndex
   */
  public blockLength(pieceIndex: number, blockIndex:number) {
    const pieceLength = this.pieceLength(pieceIndex);

    const lastPieceLength = pieceLength % BLOCK_LEN;
    const lastPieceIndex = Math.floor(pieceLength / BLOCK_LEN);

    return blockIndex === lastPieceIndex ? lastPieceLength : BLOCK_LEN;
  }
}

declare module 'bencode' {
  export function byteLength(value: any): number;

  export function encodingLength(value: any): number;

  export function encode(data: any, buffer?: Buffer, offset?: number): Buffer;

  export function decode(
    data: Buffer,
    start?: number,
    end?: number,
    encoding?: string
  ): ITorrent;
  
  export interface ITorrent {
    announce: Buffer;
    info: ITorrentInfo;
    encoding: Buffer;
    ['created by']?: Buffer;
    ['creation date']?: number;
  }

  export interface ITorrentInfo {
    name: Buffer,
    length: number,
    private: number,
    pieces: Buffer,
    files: Array<Buffer>,
    ['piece length']: number,
  }
}

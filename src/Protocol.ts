import crypto from 'crypto';

import { generateId } from './utils/generateId';
import { Torrent } from './Torrent';
import { Peer } from './Peer';
import { Block } from './Block';

/**
 *
 */
export enum ResponseType {
  connect,
  announce
}

/**
 *
 */
export class Protocol {

  /////////////////////////////////////
  //
  // UDP

  //
  // Connection
  static connectionRequest() {
    const request = Buffer.alloc(16); // 2

    // connection id
    request.writeBigInt64BE(BigInt(0x41727101980), 0);
    
    // action
    request.writeUInt32BE(0, 8);
    
    // transaction id
    crypto.randomBytes(4).copy(request, 12);

    return request;
  }
  static connectionResponse (response: Buffer) {
    return {
      action: response.readBigInt64BE(0),
      transactionId: response.readBigInt64BE(4),
      connectionId: response.readBigInt64BE(8)
    }
  }

  //
  // Announcement
  static announcementRequest(connectionId: bigint, torrent: Torrent, port: number = 6881) {
    const request = Buffer.allocUnsafe(98);

    // connection id
    request.writeBigInt64BE(BigInt(connectionId), 0);

    // action
    request.writeUInt32BE(1, 8);

    // transaction id
    crypto.randomBytes(4).copy(request, 12);

    // info hash
    torrent.infoHash().copy(request, 16);

    // peerId
    generateId().copy(request, 36);

    // downloaded
    request.writeBigInt64BE(BigInt(0), 56);

    // left
    torrent.size().copy(request, 64);

    // uploaded
    request.writeBigInt64BE(BigInt(0), 72);

    // event
    request.writeUInt32BE(0, 80);

    // ip address
    request.writeUInt32BE(0, 80);

    // key
    crypto.randomBytes(4).copy(request, 88);

    // num want
    request.writeInt32BE(-1, 92);

    // port
    request.writeUInt16BE(port, 96);

    return request;
  }
  static announcementResponse(response: Buffer) {
    function group(iterable: Buffer, groupSize: number) {
      let groups = [];
      for (let i = 0; i < iterable.length; i += groupSize) {
        groups.push(iterable.slice(i, i + groupSize));
      }
      return groups;
    }

    return {
      action: response.readUInt32BE(0),
      transactionId: response.readUInt32BE(4),
      leechers: response.readUInt32BE(8),
      seeders: response.readUInt32BE(12),
      peers: group(response.slice(20), 6).map(address => {
        return new Peer(
          address.slice(0, 4).join('.'),
          address.readUInt16BE(4)
        );
      })
    }
  }

  //
  // General
  static getResponseType(response: Buffer): ResponseType {
    const action = response.readUInt32BE(0);

    if (action === 0) {
      return ResponseType.connect
    }
    if (action === 1) {
      return ResponseType.announce
    }
  }


  /////////////////////////////////////
  //
  // TCP

  static handshakeRequest(torrent: Torrent) {
    const request = Buffer.alloc(68);

    // pstrlen
    request.writeUInt8(19, 0);

    // pstr
    request.write('BitTorrent protocol', 1);

    // reserved
    request.writeUInt32BE(0, 20);
    request.writeUInt32BE(0, 24);

    // info hash
    torrent.infoHash().copy(request, 28);

    // peer id
    generateId().copy(request, 48);

    return request;
  }

  static keepAlive() {
    return Buffer.alloc(4);
  }

  static choke() {
    const request = Buffer.alloc(5);

    // length
    request.writeUInt32BE(1, 0);

    // id
    request.writeUInt8(0, 4);

    return request;
  }

  static unchoke() {
    const request = Buffer.alloc(5);

    // length
    request.writeUInt32BE(1, 0);

    // id
    request.writeUInt8(1, 4);

    return request;
  }

  static interested() {
    const request = Buffer.alloc(5);

    // length
    request.writeUInt32BE(1, 0);

    // id
    request.writeUInt8(2, 4);

    return request;
  }

  static uninterested() {
    const request = Buffer.alloc(5);

    // length
    request.writeUInt32BE(1, 0);

    // id
    request.writeUInt8(3, 4);

    return request;
  }

  static have(payload: number) {
    const request = Buffer.alloc(9);

    // length
    request.writeUInt32BE(5, 0);

    // id
    request.writeUInt8(4, 4);

    // piece index
    request.writeUInt32BE(payload, 5);

    return request;
  }

  static bitfield(bitfield: Buffer) {
    const request = Buffer.alloc(14);

    // length
    request.writeUInt32BE(bitfield.length + 1, 0);

    // id
    request.writeUInt8(5, 4);

    // bitfield
    bitfield.copy(request, 5);

    return request;
  }

  static request (payload: Block) {
    const request = Buffer.alloc(17);

    // length
    request.writeUInt32BE(13, 0);

    // id
    request.writeUInt8(6, 4);

    // piece index
    request.writeUInt32BE(payload.index, 5);

    // begin
    request.writeUInt32BE(payload.begin, 9);

    // length
    request.writeUInt32BE(payload.length, 13);

    return request;
  };

  static piece (payload: Block) {
    const request = Buffer.alloc(payload.block.length + 13);

    // length
    request.writeUInt32BE(payload.block.length + 9, 0);

    // id
    request.writeUInt8(7, 4);

    // piece index
    request.writeUInt32BE(payload.index, 5);

    // begin
    request.writeUInt32BE(payload.begin, 9);

    // block
    payload.block.copy(request, 13);

    return request;
  };

  static cancel (payload: Block) {
    const request = Buffer.alloc(17);

    // length
    request.writeUInt32BE(13, 0);

    // id
    request.writeUInt8(8, 4);

    // piece index
    request.writeUInt32BE(payload.index, 5);

    // begin
    request.writeUInt32BE(payload.begin, 9);

    // length
    request.writeUInt32BE(payload.length, 13);

    return request;
  };

  static port (payload: number) {
    const request = Buffer.alloc(7);

    // length
    request.writeUInt32BE(3, 0);

    // id
    request.writeUInt8(9, 4);

    // listen-port
    request.writeUInt16BE(payload, 5);

    return request;
  };

  //
  // General

  static isHandshake (request: Buffer): Boolean {
    return request.length === request.readUInt8(0) + 49 &&
      request.toString('utf8', 1) === 'BitTorrent protocol';
  }
}

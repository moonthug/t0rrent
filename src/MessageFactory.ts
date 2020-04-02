import { Bitfield, Cancel, Choke, Have, Interested, NotInterested, Piece, Request, Unchoke } from './messages';

export class MessageFactory {
  public createMessage(data: Buffer) {
    const id = data.length > 4 ? data.readInt8(4) : null;

    switch (id) {
      case 0: return new Choke(data);
      case 1: return new Unchoke(data);
      case 2: return new Interested(data);
      case 3: return new NotInterested(data);
      case 4: return new Have(data);
      case 5: return new Bitfield(data);
      case 6: return new Request(data);
      case 7: return new Piece(data);
      case 8: return new Cancel(data);
    }
  }
}

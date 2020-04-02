import { BaseMessage } from './BaseMessage';
import { Block } from '../Block';

export class Request extends BaseMessage<Block> {
  public id: number = 6;

  /**
   *
   * @param data
   */
  constructor(data: Buffer) {
    super(data);

    const payload = data.slice(5);
    this.payload = new Block(payload.readInt32BE(0), payload.readInt32BE(4));
  }
}

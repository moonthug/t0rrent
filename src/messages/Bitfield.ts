import { BaseMessage } from './BaseMessage';

export class Bitfield extends BaseMessage<Buffer> {
  /**
   *
   */
  public id: number = 5;

  /**
   *
   * @param data
   */
  constructor(data: Buffer) {
    super(data);
    this.payload = data.slice(5);
  }
}

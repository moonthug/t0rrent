import { BaseMessage } from './BaseMessage';

export class Have extends BaseMessage<Buffer> {
  /**
   *
   */
  public id: number = 4;

  /**
   *
   * @param data
   */
  constructor(data: Buffer) {
    super(data);
    this.payload = data.slice(5);
  }
}

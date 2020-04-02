export abstract class BaseMessage<T = void> {
  public readonly id: number;
  public readonly size: number;
  public payload?: T;

  constructor(data: Buffer) {
    this.size = data.readInt32BE(0);
  }
}

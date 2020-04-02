export class Peer {
  /**
   *
   */
  public readonly address: string;

  /**
   *
   */
  public readonly port: number;

  /**
   *
   * @param address
   * @param port
   */
  constructor (address: string, port: number) {
    this.address = address;
    this.port = port;
  }

  /**
   *
   */
  toString() {
    return `${this.address}:${this.port}`;
  }
}

export class Block {
  /**
   *
   */
  public readonly index: number;

  /**
   *
   */
  public readonly begin: number;

  /**
   *
   */
  public length: number;

  /**
   *
   */
  public block: Buffer;

  /**
   *
   * @param index
   * @param begin
   * @param block
   * @param length
   */
  constructor (index: number, begin: number, length: number = 0, block?: Buffer) {
    this.index = index;
    this.begin = begin;
    this.length = length;
    this.block = block;
  }
}

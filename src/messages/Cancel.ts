import { BaseMessage } from './BaseMessage';
import { Block } from '../Block';

export class Cancel extends BaseMessage<Block> {
  public id: number = 8;
}

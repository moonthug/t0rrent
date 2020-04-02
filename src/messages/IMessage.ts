export interface IMessage<T> {
  id: string;
  size: number;
  payload?: T;
}

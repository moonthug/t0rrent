import crypto from 'crypto';

let id: Buffer = null;

export const generateId = (): Buffer => {
  if (!id) {
    id = crypto.randomBytes(20);
    Buffer.from('-t00001-').copy(id, 0);
  }

  return id;
};

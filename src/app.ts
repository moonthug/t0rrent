import { Torrent } from './Torrent';
import { Downloader } from './Downloader';
import { Peer } from './Peer';

const main = async () => {
  const torrent: Torrent = new Torrent('/Users/alicks/Workspace/_my/_code/t0rrent/src/big-buck-bunny.torrent');
  const downloader = new Downloader(torrent);

  downloader.on('connected', () => {
    console.log('connected');
  });

  downloader.on('peers', (peers: Array<Peer>) => {
    console.log('peers', peers);
  });

  downloader.start();
};

main().catch(e => console.error(e));

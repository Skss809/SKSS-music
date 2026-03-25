import ytdl from '@distube/ytdl-core';

async function test(id: string) {
  const url = `https://www.youtube.com/watch?v=${id}`;
  try {
    const stream = ytdl(url, {
      filter: 'audioonly',
      quality: 'highestaudio',
    });
    
    return new Promise((resolve) => {
      stream.on('data', (chunk) => {
        console.log(`Received ${chunk.length} bytes`);
        stream.destroy();
        resolve(true);
      });
      stream.on('error', (err) => {
        console.error(`Error for ID ${id}:`, err.message || err);
        resolve(false);
      });
    });
  } catch (err: any) {
    console.error(`Error for ID ${id}:`, err.message || err);
  }
}

async function run() {
  await test("9bZkp7q19f0");
}

run();

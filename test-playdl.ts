import play from 'play-dl';

async function test(id: string) {
  const url = `https://www.youtube.com/watch?v=${id}`;
  try {
    const stream = await play.stream(url);
    console.log("Success for ID:", id);
    console.log("Type:", stream.type);
    stream.stream.on('data', (chunk) => {
      console.log(`Received ${chunk.length} bytes`);
      stream.stream.destroy();
    });
  } catch (err: any) {
    console.error(`Error for ID ${id}:`, err.message || err);
  }
}

async function run() {
  await test("9bZkp7q19f0");
}

run();

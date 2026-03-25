import youtubedl from "youtube-dl-exec";

async function test(id: string) {
  const url = `https://www.youtube.com/watch?v=${id}`;
  try {
    const output = await youtubedl(url, {
      dumpJson: true,
      format: 'bestaudio[ext=m4a]/bestaudio',
      noCheckCertificates: true,
      noWarnings: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      ]
    });
    console.log("Success for ID:", id);
  } catch (err: any) {
    console.error(`Error for ID ${id}:`, err.message || err);
  }
}

async function run() {
  await test("9bZkp7q19f0");
}

run();

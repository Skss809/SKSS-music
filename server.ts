import express from "express";
import cors from "cors";
import yts from "yt-search";
import youtubedl from "youtube-dl-exec";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import os from "os";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/yt/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }
      const r = await yts(query);
      const videos = r.videos.slice(0, 15).map(v => ({
        id: v.videoId,
        title: v.title,
        artist: v.author.name,
        duration: v.seconds,
        coverUrl: v.thumbnail,
      }));
      res.json(videos);
    } catch (error) {
      console.error("YT Search Error:", error);
      res.status(500).json({ error: "Failed to search YouTube" });
    }
  });

  app.get("/api/yt/stream", async (req, res) => {
    let cookieFile: string | null = null;
    try {
      const id = req.query.id as string;
      if (!id) {
        return res.status(400).send("ID is required");
      }
      const url = `https://www.youtube.com/watch?v=${id}`;
      
      const options: any = {
        format: 'bestaudio',
        output: '-',
        noCheckCertificates: true,
        noWarnings: true,
        extractorArgs: 'youtube:player_client=android_music',
        addHeader: [
          'referer:youtube.com',
          'user-agent:com.google.android.youtube.music/6.39.52 (Linux; U; Android 11; en_US) gzip'
        ]
      };

      // Support for optional YouTube cookies via environment variable
      if (process.env.YOUTUBE_COOKIES) {
        cookieFile = path.join(os.tmpdir(), `cookies_${Date.now()}.txt`);
        fs.writeFileSync(cookieFile, process.env.YOUTUBE_COOKIES);
        options.cookies = cookieFile;
      }

      const subprocess = youtubedl.exec(url, options);

      subprocess.stdout?.once('data', () => {
        // Most YouTube audio streams are WebM/Opus or M4A
        // We'll use audio/mpeg as a generic fallback or let the browser figure it out
        res.header("Content-Type", "audio/mpeg");
      });

      subprocess.stdout?.pipe(res, { end: false });

      subprocess.then(() => {
        if (!res.writableEnded) {
          res.end();
        }
      }).catch((err: any) => {
        if (req.destroyed || res.destroyed) return;
        
        console.error("yt-dlp error:", err.message || err);
        if (!res.headersSent) {
          res.status(500).send("Stream error: " + (err.message || "Unknown error"));
        } else if (!res.writableEnded) {
          res.end();
        }
      }).finally(() => {
        if (cookieFile && fs.existsSync(cookieFile)) {
          try { fs.unlinkSync(cookieFile); } catch (e) {}
        }
      });

      req.on('close', () => {
        if (!subprocess.killed) {
          subprocess.kill('SIGKILL');
        }
        if (cookieFile && fs.existsSync(cookieFile)) {
          try { fs.unlinkSync(cookieFile); } catch (e) {}
        }
      });

    } catch (error) {
      console.error("YT Stream Error:", error);
      if (cookieFile && fs.existsSync(cookieFile)) {
        try { fs.unlinkSync(cookieFile); } catch (e) {}
      }
      if (!res.headersSent) res.status(500).send("Failed to stream from YouTube");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

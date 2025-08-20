import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { storage } from "./storage";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    host: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Only use Vite middleware for non-API routes
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/')) {
      return next();
    }
    vite.middlewares(req, res, next);
  });
  
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    
    // Skip API routes - let Express handle them
    if (url.startsWith('/api/')) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      
      // Fetch current theme from database
      let currentTheme = 'light'; // fallback
      try {
        const themeSetting = await storage.getSetting('app_theme');
        if (themeSetting?.value) {
          currentTheme = themeSetting.value;
        }
      } catch (error) {
        console.log('Failed to fetch theme, using fallback:', error);
      }
      
      // Inject theme into HTML template
      template = template.replace(
        'data-theme="light"',
        `data-theme="${currentTheme}"`
      );
      
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist, with theme injection
  app.use("*", async (_req, res) => {
    try {
      const indexPath = path.resolve(distPath, "index.html");
      let template = await fs.promises.readFile(indexPath, "utf-8");
      
      // Fetch current theme from database
      let currentTheme = 'light'; // fallback
      try {
        const themeSetting = await storage.getSetting('app_theme');
        if (themeSetting?.value) {
          currentTheme = themeSetting.value;
        }
      } catch (error) {
        console.log('Failed to fetch theme for production, using fallback:', error);
      }
      
      // Inject theme into HTML template
      template = template.replace(
        'data-theme="light"',
        `data-theme="${currentTheme}"`
      );
      
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (error) {
      console.error('Error serving index.html:', error);
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });
}

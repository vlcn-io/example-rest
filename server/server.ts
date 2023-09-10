import Fastify from "fastify";
import { encode, decode, tags, hexToBytes } from "@vlcn.io/ws-common";
import { createDb } from "./DBWrapper.js";
import cors from "@fastify/cors";
import path from "path";
import fastifyStatic from "@fastify/static";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const PORT = 8081;

// Create our Fastify server
const app = Fastify({
  logger: true,
});
// Add a parser to handle binary data sent by the client
app.addContentTypeParser(
  "application/octet-stream",
  { parseAs: "buffer" },
  (_req, body, done) => {
    try {
      done(null, {
        raw: body,
      });
    } catch (error: any) {
      error.statusCode = 400;
      done(error, undefined);
    }
  }
);

// If we're in production, serve the static files from the dist folder
if (process.env.NODE_ENV === "production") {
  console.log('serving static files');
  await app.register(fastifyStatic, {
    root: path.join(__dirname, '..', "dist"),
  });
} else {
  // If we're not in production, vite is serving our files and the server is accessed
  // across origins.
  await app.register(cors);
}

/**
 * Endpoint that clients can call to `get` or `pull` changes
 * from the server.
 */
app.get<{
  Params: { room: string };
  Querystring: {
    schemaName: string;
    schemaVersion: string;
    requestor: string;
    since: string;
  };
}>("/changes/:room", async (req, res) => {
  const db = await createDb(
    req.params.room,
    req.query.schemaName as string,
    BigInt(req.query.schemaVersion as string)
  );
  try {
    const requestorSiteId = hexToBytes(req.query.requestor as string);
    const sinceVersion = BigInt(req.query.since as string);

    const changes = db.getChanges(sinceVersion, requestorSiteId);
    const encoded = encode({
      _tag: tags.Changes,
      changes,
      sender: db.getId(),
      since: [sinceVersion, 0],
    });
    res.header("Content-Type", "application/octet-stream");

    console.log(`returning ${changes.length} changes`);
    res.send(encoded);
  } finally {
    db.close();
  }
});

/**
 * Endpoint for clients to post their database changes to.
 */
app.post<{
  Params: { room: string };
  Querystring: { schemaName: string; schemaVersion: string };
}>("/changes/:room", {
  config: {
    rawBody: true,
  },
  handler: async (req, res) => {
    const data = new Uint8Array((req.body as any).raw);

    const msg = decode(data);
    if (msg._tag != tags.Changes) {
      throw new Error(`Expected Changes message but got ${msg._tag}`);
    }

    const db = await createDb(
      req.params.room,
      req.query.schemaName as string,
      BigInt(req.query.schemaVersion as string)
    );
    try {
      db.applyChanges(msg);
      res.send({ status: "OK" });
    } finally {
      db.close();
    }
  },
});

await app.listen({ port: PORT });

import App from "./App.tsx";
import schemaContent from "./schemas/main.sql?raw";
import { DBProvider } from "@vlcn.io/react";
import { useEffect, useState } from "react";

/**
 * Generates a random room name to sync with or pulls one from local storage.
 */
function getRoom(hash: HashBag): string {
  return hash.room || localStorage.getItem("room") || newRoom();
}

function hashChanged() {
  const hash = parseHash();
  const room = getRoom(hash);
  if (room != hash.room) {
    hash.room = room;
    window.location.hash = writeHash(hash);
  }
  localStorage.setItem("room", room);
  return room;
}
const room = hashChanged();

const schema = {
  name: "main.sql",
  content: schemaContent,
};
export default function Root() {
  const [theRoom, setTheRoom] = useState(room);
  useEffect(() => {
    const cb = () => {
      const room = hashChanged();
      if (room != theRoom) {
        setTheRoom(room);
      }
    };
    addEventListener("hashchange", cb);
    return () => {
      removeEventListener("hashchange", cb);
    };
  }, []);

  return (
    <DBProvider
      dbname={theRoom}
      schema={schema}
      Render={() => <App room={theRoom} />}
    ></DBProvider>
  );
}

type HashBag = { [key: string]: string };
function parseHash(): HashBag {
  const hash = window.location.hash;
  const ret: { [key: string]: string } = {};
  if (hash.length > 1) {
    const substr = hash.substring(1);
    const parts = substr.split(",");
    for (const part of parts) {
      const [key, value] = part.split("=");
      ret[key] = value;
    }
  }

  return ret;
}

function writeHash(hash: HashBag) {
  const parts = [];
  for (const key in hash) {
    parts.push(`${key}=${hash[key]}`);
  }
  return parts.join(",");
}

function newRoom() {
  return crypto.randomUUID().replaceAll("-", "");
}

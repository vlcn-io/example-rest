import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import vlcnLogo from "./assets/vlcn.png";
import "./App.css";
import randomWords from "./support/randomWords.js";
import { first, useCachedState, useDB, useQuery } from "@vlcn.io/react";
import { useSyncer } from "./Syncer.js";
import { useState } from "react";
import TimeAgo from "javascript-time-ago";
import ReactTimeAgo from "react-time-ago";
import en from "javascript-time-ago/locale/en.json";
import DynamicTable from "./table/DynamicTable.js";
import { newId } from "@vlcn.io/id";

TimeAgo.addDefaultLocale(en);

const wordOptions = { exactly: 3, join: " " };
const editableColumns = new Set(["content"]);

function App({ room }: { room: string }) {
  const ctx = useDB(room);
  const syncer = useSyncer(ctx.db, room);

  const addData = () => {
    ctx.db.exec("INSERT INTO test (id, content, position) VALUES (?, ?, -1);", [
      newId(ctx.db.siteid, "decimal"),
      randomWords(wordOptions) as string,
    ]);
  };

  const dropData = () => {
    ctx.db.exec("DELETE FROM test;");
  };

  const [pushPullMsg, setPushPullMsg] = useState("");
  const [pushPullTime, setPushPullTime] = useState<Date | null>(null);
  const pushChanges = async () => {
    setPushPullTime(new Date());
    try {
      setPushPullMsg(`Pushing changes...`);
      const num = (await syncer?.pushChanges()) || 0;
      setPushPullMsg(`Pushed ${num} changes`);
    } catch (e: any) {
      setPushPullMsg(`Err pushing: ${e.message}`);
    }
  };
  const pullChanges = async () => {
    setPushPullTime(new Date());
    try {
      setPushPullMsg(`Pulling changes...`);
      const num = (await syncer?.pullChanges()) || 0;
      setPushPullMsg(`Pulled ${num} changes`);
    } catch (e: any) {
      console.log(e);
      setPushPullMsg(`Err pulling: ${e.message || e}`);
    }
  };

  const localNotes = first(
    useQuery<{ content: string | null }>(
      ctx,
      `SELECT content FROM local_notes WHERE id = 1`
    ).data
  ) ?? { content: "" };

  const [cachedLocalNotes, setCachedLocalNotes] = useCachedState(
    localNotes.content || ""
  );

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a href="https://vlcn.io" target="_blank">
          <img src={vlcnLogo} className="logo vlcn" alt="Vulcan logo" />
        </a>
      </div>
      <h1>Vite + React + Vulcan</h1>
      <div className="card">
        <div>
          <button onClick={addData} style={{ marginRight: "1em" }}>
            Add Data
          </button>
          <button onClick={dropData}>Drop Data</button>
        </div>
        <DynamicTable room={room} tableName="test" editable={editableColumns} />
        <textarea
          value={cachedLocalNotes}
          placeholder="Local notes"
          style={{ width: "100%", height: 100 }}
          onChange={(e) => {
            setCachedLocalNotes(e.target.value);
            return ctx.db.exec(
              `INSERT OR REPLACE INTO local_notes VALUES (1, ?)`,
              [e.target.value]
            );
          }}
        />
        <div className="push-pull">
          <div>
            <button
              onClick={pushChanges}
              style={{ marginRight: "1em" }}
              className="push-btn"
            >
              Push Changes
            </button>
            <button onClick={pullChanges} className="pull-btn">
              Pull Changes
            </button>
          </div>
          <div className="push-pull-msg">
            {pushPullMsg}
            <div>
              {pushPullTime ? (
                <ReactTimeAgo
                  date={pushPullTime}
                  locale="en-US"
                  timeStyle="round"
                />
              ) : null}
            </div>
          </div>
        </div>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        <p>
          Open another browser and navigate to{" "}
          <a href={window.location.href} target="_blank">
            this window's url
          </a>{" "}
          to test sync.
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite, React and Vulcan logos to learn more
      </p>
    </>
  );
}

export default App;

# example-rest

While a streaming WebSocket server does exist, the simplicity of rest provides a great example of how to start rolling your own `cr-sqlite` server and networking code.

# server/server.ts

The server has one endpoint: `/changes/:room` which can be called via `get` or `post`.

- `get` to get a set of changes from the server for the DB identified by `room`
- `post` to post a set of changes to the server to the DB identified by `room`

## get /changes/:room

**Path Parameters**

1. **room** - The room from which to get changes. A room corresponds to a single SQLite database on the backend. A SQLite DB on the frontend would generally connect to a single room but, if rooms have the same schema, it is possible to have a client push and pull changes from many different rooms.

**Query Parameters:**

There is a question of how rooms get initialized. In this demo, clients can create rooms at will. Given that, clients send the server the name of the schema they expect the room to have. If the room does not yet exist the server will create it with the named schema.

1. **schemaName** - The name of the schema that the database should be created with if the DB does not yet exist on the server. If the DB does exist, the schema name must match what the client provided.
2. **schemaVersion** - The schema version we expect the server to have. If client and server are on different versions they'll attempt to be migrated to the same version. Filled in by the client library.
3. **requestor** - The identifier of the client requesting changes. Filled in by the client library.
4. **since** - Used to fetch incremental changes. I.e., "give me changes _since_ this database version"

## post /changes/:room

**Path Parameters**

1. **room** - The room to post changes to. See [get /changes/:room](#get-/changes/:room) for more details.

**Query Parameters:**

1. **schemaName** - The name of the schema that the database should be created with if the DB does not yet exist on the server. If the DB does exist, the schema name must match what the client provided.
2. **schemaVersion** - The schema version we expect the server to have. If client and server are on different versions they'll attempt to be migrated to the same version. Filled in by the client library.

# src/Syncer.ts

This is the client library responsible for calling the rest server. It keeps track of database version information such that only incremental changes are passed back and forth during sync operations.

It is used in the App component like so:

```ts
function App({ctx}) {
  ...
  const syncer = useSyncer(ctx.db, room);
  const pushChanges = () => syncer?.pushChanges();
  const pullChanges = () => syncer?.pullChanges();

  return (
    <>
      ...
      <button onClick={pushChanges}>
        Push Changes
      </button>
      <button onClick={pullChanges} className="pull-btn">
        Pull Changes
      </button>
    </>
  );
}
```
import { CtxAsync, useCachedState, useDB, useQuery } from "@vlcn.io/react";
import { useMemo } from "react";
import styled from "styled-components";
import { Table } from "./Table.js";
import { Column } from "react-table";
import { UniqueIdentifier } from "@dnd-kit/core";

const Styles = styled.div`
  padding: 1rem;

  table {
    width: 100%;
    border-spacing: 0;
    border-top: 1px solid black;
    border-left: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`;

export default function DynamicTable({
  tableName,
  room,
  editable,
}: {
  tableName: string;
  room: string;
  editable: Set<string>;
}) {
  const ctx = useDB(room);
  const tableInfo = useQuery<{ name: string }>(
    ctx,
    `SELECT name FROM pragma_table_info WHERE arg = ?`,
    [tableName]
  ).data;
  const data = useQuery<{ id: UniqueIdentifier }>(
    ctx,
    `SELECT * FROM ${tableName} ORDER BY position, id ASC`
  ).data;

  const columns: Column<any>[] = useMemo(() => {
    const ret = tableInfo.map((info) => {
      return {
        Header: info.name,
        Cell: ({ cell }) => {
          if (info.name === "id") {
            const idstr = (cell.row.original as any).id.toString();
            return "..." + idstr.substring(idstr.length - 5);
          } else if (editable.has(info.name)) {
            return (
              <EditableItem
                ctx={ctx}
                name={info.name}
                id={(cell.row.original as any).id}
                value={(cell.row.original as any)[info.name]}
              />
            );
          }
          return (cell.row.original as any)[info.name]?.toString();
        },
      } satisfies Column;
    });
    ret.push({
      Header: "Action",
      Cell: ({ cell }) => {
        return (
          <div
            onClick={() =>
              ctx.db.exec(`DELETE FROM ${tableName} WHERE id = ?`, [
                (cell.row.original as any).id,
              ])
            }
            style={{ cursor: "pointer" }}
          >
            ❌
          </div>
        );
      },
    });
    return ret;
  }, [tableInfo]);

  return (
    <Styles>
      <Table columns={columns} data={data} ctx={ctx} />
    </Styles>
  );
}

function EditableItem({
  ctx,
  id,
  value,
  name,
}: {
  ctx: CtxAsync;
  id: string | bigint;
  value: string;
  name: string;
}) {
  // Generally you will not need to use `useCachedState`. It is only required for highly interactive components
  // that write to the database on every interaction (e.g., keystroke or drag) or in cases where you want
  // to de-bounce your writes to the DB.
  //
  // `useCachedState` will never be required once when one of the following is true:
  // a. We complete the synchronous Reactive SQL layer (SQLiteRX)
  // b. We figure out how to get SQLite-WASM to do a write + read round-trip in a single event loop tick
  const [cachedValue, setCachedValue] = useCachedState(value);
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setCachedValue(e.target.value);
    // You could de-bounce your write to the DB here if so desired.
    return ctx.db.exec(`UPDATE test SET [${name}] = ? WHERE id = ?;`, [
      e.target.value,
      id,
    ]);
  };

  return (
    <input
      type="text"
      value={cachedValue}
      onChange={onChange}
      style={{ fontSize: "1em", padding: 5 }}
    />
  );
}

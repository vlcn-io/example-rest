import { useDB, useQuery } from "@vlcn.io/react";
import { useMemo } from "react";
import styled from "styled-components";
import { Table } from "./Table.js";
import { Column } from "react-table";
import { UniqueIdentifier } from "@dnd-kit/core";

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

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
}: {
  tableName: string;
  room: string;
}) {
  const ctx = useDB(room);
  const tableInfo = useQuery<{ name: string }>(
    ctx,
    `SELECT name FROM pragma_table_info WHERE arg = ?`,
    [tableName]
  ).data;
  const data = useQuery<{ id: UniqueIdentifier }>(
    ctx,
    `SELECT * FROM ${tableName} ORDER BY id DESC`
  ).data;

  const columns: Column<any>[] = useMemo(() => {
    return tableInfo.map((info) => {
      return {
        Header: info.name,
        accessor: info.name,
      } satisfies Column;
    });
  }, [tableInfo]);

  return (
    <Styles>
      <Table columns={columns} data={data} />
    </Styles>
  );
}

import { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Column, useTable } from "react-table";
import { DraggableTableRow } from "./DraggableTableRow.js";
import { StaticTableRow } from "./StaticTableRow.js";
import { CtxAsync } from "@vlcn.io/react";

export function Table<Data extends { id: UniqueIdentifier }>({
  columns,
  data,
  ctx,
}: {
  columns: Column<Data>[];
  data: Data[];
  ctx: CtxAsync;
}) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>();
  // Use the state and functions returned from useTable to build your UI
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({
      columns,
      data,
    });
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      // TODO: crsql only exposes an `after_id` function for re-ordering. We should add a `before_id` as well.
      const currIndex =
        over?.id == null
          ? null
          : data.findIndex((d) => {
              return d.id === over.id;
            });
      const afterId =
        currIndex == null || currIndex <= 0 ? null : data[currIndex - 1].id;
      ctx.db.exec(`UPDATE test_fractindex SET after_id = ? WHERE id = ?`, [
        afterId,
        active.id,
      ]);
    }

    setActiveId(null);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  const selectedRow = useMemo(() => {
    if (!activeId) {
      return null;
    }
    const row = rows.find(({ original }) => original.id === activeId);
    if (!row) {
      return null;
    }
    prepareRow(row);
    return row;
  }, [activeId, rows, prepareRow]);

  // Render the UI for your table
  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
    >
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          <SortableContext items={data} strategy={verticalListSortingStrategy}>
            {rows.map((row) => {
              prepareRow(row);
              return <DraggableTableRow key={row.original.id} row={row} />;
            })}
          </SortableContext>
        </tbody>
      </table>
      <DragOverlay dropAnimation={null}>
        {activeId && (
          <table style={{ width: "100%" }}>
            <tbody>
              <StaticTableRow row={selectedRow} />
            </tbody>
          </table>
        )}
      </DragOverlay>
    </DndContext>
  );
}

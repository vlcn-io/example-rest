import { UniqueIdentifier } from "@dnd-kit/core";
import { DragHandle } from "./DragHandle";
import styled from "styled-components";
import { Row } from "react-table";

const StyledStaticData = styled.td`
  &:first-of-type {
    min-width: 20ch;
  }
`;

const StyledStaticTableRow = styled.tr`
  box-shadow: rgb(0 0 0 / 10%) 0px 20px 25px -5px,
    rgb(0 0 0 / 30%) 0px 10px 10px -5px;
  outline: #3e1eb3 solid 1px;
`;

export function StaticTableRow<Data extends { id: UniqueIdentifier }>({
  row,
}: {
  row?: Row<Data> | null;
}) {
  if (!row) {
    return null;
  }

  return (
    <StyledStaticTableRow {...row.getRowProps()}>
      {row.cells.map((cell, i) => {
        if (i === 0) {
          return (
            <StyledStaticData {...cell.getCellProps()}>
              <DragHandle isDragging />
              <span>{cell.render("Cell")}</span>
            </StyledStaticData>
          );
        }
        return (
          <StyledStaticData {...cell.getCellProps()}>
            {cell.render("Cell")}
          </StyledStaticData>
        );
      })}
    </StyledStaticTableRow>
  );
}

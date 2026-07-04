import * as React from "react";

export interface EvilBrushRange {
  startIndex: number;
  endIndex: number;
}

export function useEvilBrush({ data }: { data: any[] }) {
  const [range, setRange] = React.useState<EvilBrushRange>({
    startIndex: 0,
    endIndex: Math.max(0, data.length - 1),
  });

  React.useEffect(() => {
    setRange({
      startIndex: 0,
      endIndex: Math.max(0, data.length - 1),
    });
  }, [data]);

  return {
    visibleData: data.slice(range.startIndex, range.endIndex + 1),
    brushProps: {
      startIndex: range.startIndex,
      endIndex: range.endIndex,
      onChange: setRange,
    },
  };
}

export function EvilBrush(props: any) {
  return null;
}

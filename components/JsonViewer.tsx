"use client";

import { useTheme } from "next-themes";
import {
  JsonView,
  collapseAllNested,
  allExpanded,
  darkStyles,
  defaultStyles,
} from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

const JsonViewer = ({
  expanded = false,
  ...props
}: { expanded?: boolean } & Parameters<typeof JsonView>[0]) => {
  const { resolvedTheme } = useTheme();

  return (
    <JsonView
      style={resolvedTheme === "light" ? defaultStyles : darkStyles}
      shouldExpandNode={expanded ? allExpanded : collapseAllNested}
      {...props}
    />
  );
};

export default JsonViewer;

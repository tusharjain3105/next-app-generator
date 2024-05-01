"use client";
import useMounted from "@/hooks/useMounted";
import { Switch } from "@nextui-org/switch";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  return (
    <Switch
      key={`theme-toggle-${mounted ? "client" : "server"}`}
      defaultSelected={resolvedTheme === "dark"}
      onValueChange={(value) => setTheme(value ? "dark" : "light")}
      color="warning"
    />
  );
}

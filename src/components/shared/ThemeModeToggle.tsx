"use client";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import SettingsBrightnessOutlined from "@mui/icons-material/SettingsBrightnessOutlined";
import { useThemeMode, type ThemeModeSetting } from "@/theme";

const modes: { value: ThemeModeSetting; label: string; Icon: typeof LightModeOutlined }[] = [
  { value: "light", label: "Light", Icon: LightModeOutlined },
  { value: "dark", label: "Dark", Icon: DarkModeOutlined },
  { value: "system", label: "System", Icon: SettingsBrightnessOutlined },
];

interface ThemeModeToggleProps {
  /** Compact shows just the pill toggle; full shows labels too */
  variant?: "compact" | "full";
  /** Custom sx for the outer container */
  sx?: Record<string, unknown>;
}

export function ThemeModeToggle({ variant = "compact", sx }: ThemeModeToggleProps) {
  const { modeSetting, setModeSetting } = useThemeMode();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      role="radiogroup"
      aria-label="Theme mode"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "2px",
        backgroundColor: isDark
          ? "rgba(255,255,255,0.06)"
          : "rgba(0,0,0,0.06)",
        borderRadius: 9999,
        padding: "3px",
        ...sx,
      }}
    >
      {modes.map(({ value, label, Icon }) => {
        const isActive = modeSetting === value;

        return (
          <Tooltip key={value} title={label} arrow>
            <IconButton
              role="radio"
              aria-checked={isActive}
              aria-label={`${label} mode`}
              onClick={() => setModeSetting(value)}
              size="small"
              sx={{
                width: variant === "full" ? "auto" : 36,
                height: 36,
                borderRadius: 9999,
                px: variant === "full" ? 2 : 0,
                gap: 0.75,
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: isActive
                  ? (isDark ? "#fff" : "#fff")
                  : theme.palette.text.secondary,
                backgroundColor: isActive
                  ? (isDark ? "rgba(255,255,255,0.14)" : theme.palette.primary.dark)
                  : "transparent",
                boxShadow: isActive
                  ? (isDark
                    ? "0 1px 4px rgba(0,0,0,0.3)"
                    : "0 1px 4px rgba(0,0,0,0.12)")
                  : "none",
                "&:hover": {
                  backgroundColor: isActive
                    ? (isDark ? "rgba(255,255,255,0.18)" : theme.palette.primary.main)
                    : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
                },
              }}
            >
              <Icon sx={{ fontSize: 18 }} />
              {variant === "full" && label}
            </IconButton>
          </Tooltip>
        );
      })}
    </Box>
  );
}

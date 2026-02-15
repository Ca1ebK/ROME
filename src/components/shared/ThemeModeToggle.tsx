"use client";

import { useRef, useEffect, useState } from "react";
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

  const activeIndex = modes.findIndex((m) => m.value === modeSetting);

  // Measure button widths for sliding pill positioning
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const btn = buttonRefs.current[activeIndex];
    if (btn && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setPillStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [activeIndex, variant]);

  const BUTTON_SIZE = variant === "full" ? undefined : 36;
  const HEIGHT = 36;

  return (
    <Box
      ref={containerRef}
      role="radiogroup"
      aria-label="Theme mode"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        position: "relative",
        gap: "2px",
        backgroundColor: isDark
          ? "rgba(255,255,255,0.06)"
          : "rgba(0,0,0,0.06)",
        borderRadius: 9999,
        padding: "3px",
        ...sx,
      }}
    >
      {/* Sliding pill indicator */}
      <Box
        sx={{
          position: "absolute",
          top: 3,
          left: 0,
          height: HEIGHT,
          borderRadius: 9999,
          transform: `translateX(${pillStyle.left}px)`,
          width: pillStyle.width || HEIGHT,
          transition: "transform 300ms cubic-bezier(0.2, 0, 0, 1), width 300ms cubic-bezier(0.2, 0, 0, 1)",
          backgroundColor: isDark
            ? "rgba(255,255,255,0.14)"
            : theme.palette.primary.dark,
          boxShadow: isDark
            ? "0 1px 4px rgba(0,0,0,0.3)"
            : "0 1px 4px rgba(0,0,0,0.12)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {modes.map(({ value, label, Icon }, i) => {
        const isActive = modeSetting === value;

        return (
          <Tooltip key={value} title={label} arrow>
            <IconButton
              ref={(el) => { buttonRefs.current[i] = el; }}
              role="radio"
              aria-checked={isActive}
              aria-label={`${label} mode`}
              onClick={() => setModeSetting(value)}
              size="small"
              sx={{
                position: "relative",
                zIndex: 1,
                width: BUTTON_SIZE,
                height: HEIGHT,
                borderRadius: 9999,
                px: variant === "full" ? 2 : 0,
                gap: 0.75,
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: isActive
                  ? "#fff"
                  : theme.palette.text.secondary,
                backgroundColor: "transparent",
                transition: "color 200ms ease",
                "&:hover": {
                  backgroundColor: isActive
                    ? "transparent"
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

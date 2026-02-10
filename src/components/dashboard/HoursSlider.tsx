"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Remove from "@mui/icons-material/Remove";
import Add from "@mui/icons-material/Add";
import { m3Tokens } from "@/theme";

interface HoursSliderProps {
  paidHours: number;
  unpaidHours: number;
  onPaidHoursChange: (hours: number) => void;
  onUnpaidHoursChange: (hours: number) => void;
  startDate?: string;
  endDate?: string;
}

function calculateWorkDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;

  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return Math.max(count, 1);
}

export function HoursSlider({
  paidHours,
  unpaidHours,
  onPaidHoursChange,
  onUnpaidHoursChange,
  startDate,
  endDate,
}: HoursSliderProps) {
  const totalHours = paidHours + unpaidHours;

  const suggestedTotal = useMemo(() => {
    if (!startDate || !endDate) return 8;
    const workDays = calculateWorkDays(startDate, endDate);
    return workDays * 8;
  }, [startDate, endDate]);

  const setSuggestedHours = () => {
    onPaidHoursChange(suggestedTotal);
    onUnpaidHoursChange(0);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Paid Hours Row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: m3Tokens.colors.surface.containerHigh,
          borderRadius: m3Tokens.shape.large,
          p: 1.5,
          pl: 2,
        }}
      >
        <Box>
          <Typography variant="body2" fontWeight={500}>
            Paid Hours
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Regular pay
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            onClick={() => onPaidHoursChange(Math.max(0, paidHours - 1))}
            disabled={paidHours <= 0}
            size="small"
            sx={{
              backgroundColor: m3Tokens.colors.surface.containerHighest,
              width: 36,
              height: 36,
              "&:hover": { backgroundColor: m3Tokens.colors.outline.variant },
            }}
          >
            <Remove sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              minWidth: 48,
              textAlign: "center",
              color: m3Tokens.colors.success.main,
            }}
          >
            {paidHours}
          </Typography>
          <IconButton
            onClick={() => onPaidHoursChange(paidHours + 1)}
            size="small"
            sx={{
              backgroundColor: m3Tokens.colors.surface.containerHighest,
              width: 36,
              height: 36,
              "&:hover": { backgroundColor: m3Tokens.colors.outline.variant },
            }}
          >
            <Add sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Unpaid Hours Row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: m3Tokens.colors.surface.containerHigh,
          borderRadius: m3Tokens.shape.large,
          p: 1.5,
          pl: 2,
        }}
      >
        <Box>
          <Typography variant="body2" fontWeight={500}>
            Unpaid Hours
          </Typography>
          <Typography variant="caption" color="text.secondary">
            No pay
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            onClick={() => onUnpaidHoursChange(Math.max(0, unpaidHours - 1))}
            disabled={unpaidHours <= 0}
            size="small"
            sx={{
              backgroundColor: m3Tokens.colors.surface.containerHighest,
              width: 36,
              height: 36,
              "&:hover": { backgroundColor: m3Tokens.colors.outline.variant },
            }}
          >
            <Remove sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              minWidth: 48,
              textAlign: "center",
              color: m3Tokens.colors.onSurface.variant,
            }}
          >
            {unpaidHours}
          </Typography>
          <IconButton
            onClick={() => onUnpaidHoursChange(unpaidHours + 1)}
            size="small"
            sx={{
              backgroundColor: m3Tokens.colors.surface.containerHighest,
              width: 36,
              height: 36,
              "&:hover": { backgroundColor: m3Tokens.colors.outline.variant },
            }}
          >
            <Add sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Total Display */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Total
        </Typography>
        <Typography variant="subtitle1" fontWeight={700}>
          {totalHours}h
        </Typography>
      </Box>

      {/* Quick Presets */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {[4, 8, 16, 24, 40].map((hours) => (
          <Chip
            key={hours}
            label={`${hours}h`}
            onClick={() => {
              onPaidHoursChange(hours);
              onUnpaidHoursChange(0);
            }}
            sx={{
              backgroundColor:
                totalHours === hours && unpaidHours === 0
                  ? m3Tokens.colors.primary.main
                  : m3Tokens.colors.surface.containerHigh,
              color:
                totalHours === hours && unpaidHours === 0
                  ? m3Tokens.colors.primary.contrastText
                  : m3Tokens.colors.onSurface.variant,
              fontWeight: 500,
              "&:hover": {
                backgroundColor:
                  totalHours === hours && unpaidHours === 0
                    ? m3Tokens.colors.primary.dark
                    : m3Tokens.colors.surface.containerHighest,
              },
            }}
          />
        ))}
        {startDate && endDate && totalHours !== suggestedTotal && (
          <Button
            variant="text"
            size="small"
            onClick={setSuggestedHours}
            sx={{
              color: m3Tokens.colors.primary.main,
              fontSize: "0.75rem",
              textTransform: "none",
            }}
          >
            Auto ({suggestedTotal}h)
          </Button>
        )}
      </Box>
    </Box>
  );
}

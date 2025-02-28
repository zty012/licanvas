import { Delete, ImportExport } from "@mui/icons-material";
import {
  Box,
  Button,
  ButtonGroup,
  FormControlLabel,
  Radio,
  RadioGroup,
  Slider,
  Typography,
} from "@mui/material";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { useEffect, useRef, useState } from "react";

export default function App() {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const [mouseDown, setMouseDown] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [lineWidth, setLineWidth] = useState(1);
  const [color, setColor] = useState("black");

  useEffect(() => {
    if (!canvasEl.current) return;
    const ctx = canvasEl.current.getContext("2d");
    if (!ctx) return;
  }, [canvasEl]);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!canvasEl.current) return;
    const ctx = canvasEl.current.getContext("2d");
    if (!ctx) return;
    if (mouseDown) {
      const rect = canvasEl.current.getBoundingClientRect();
      const x =
        ((e.clientX - rect.left) / (rect.right - rect.left)) *
        canvasEl.current.width;
      const y =
        ((e.clientY - rect.top) / (rect.bottom - rect.top)) *
        canvasEl.current.height;
      if (lastPoint) {
        ctx.beginPath();
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = color;
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      setLastPoint({ x, y });
    }
  };

  const exportCanvas = async () => {
    const path = await save({
      title: "导出画布",
      filters: [
        {
          name: "li",
          extensions: ["li"],
        },
      ],
    });
    if (!path) return;
    const ctx = canvasEl.current?.getContext("2d");
    if (!ctx || !canvasEl.current) return;
    // 导出为二进制格式，1=white, 0=black
    const imageData = ctx.getImageData(
      0,
      0,
      canvasEl.current.width,
      canvasEl.current.height
    );
    const data = imageData.data;
    const liData = new Uint8Array(
      canvasEl.current.width * canvasEl.current.height
    );
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      if (r === 0) {
        liData[i / 4] = 0;
      } else {
        liData[i / 4] = 1;
      }
    }
    await writeFile(path, liData);
  };

  return (
    <Box display={"flex"} flexDirection={"column"}>
      <Box display={"flex"} gap={2} alignItems={"center"} flexWrap={"wrap"}>
        <ButtonGroup>
          <Button
            startIcon={<Delete />}
            onClick={() => {
              canvasEl.current
                ?.getContext("2d")
                ?.clearRect(
                  0,
                  0,
                  canvasEl.current.width,
                  canvasEl.current.height
                );
            }}
          >
            清空画布
          </Button>
          <Button startIcon={<ImportExport />} onClick={exportCanvas}>
            导出
          </Button>
        </ButtonGroup>
        <RadioGroup
          row={true}
          value={color}
          onChange={(_, v) => setColor(v as string)}
        >
          <FormControlLabel value="black" control={<Radio />} label="画笔" />
          <FormControlLabel value="white" control={<Radio />} label="橡皮擦" />
        </RadioGroup>
        <Typography>画笔粗细: {lineWidth}</Typography>
        <Slider
          value={lineWidth}
          onChange={(_, v) => setLineWidth(v as number)}
          min={1}
          max={500}
          step={1}
          sx={{ width: 300 }}
        />
        {/* <Typography>
          鼠标位置: {lastPoint?.x}, {lastPoint?.y}
        </Typography> */}
      </Box>
      <canvas
        width={1500}
        height={1500}
        ref={canvasEl}
        style={{
          border: "1px solid black",
          aspectRatio: "1/1",
          width: "80vh",
          height: "80vh",
        }}
        onMouseDown={() => {
          setMouseDown(true);
        }}
        onMouseUp={() => {
          setMouseDown(false);
          setLastPoint(null);
        }}
        onMouseMove={onMouseMove}
      ></canvas>
    </Box>
  );
}

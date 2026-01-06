import { createEffect } from "solid-js";

import { interpretData, type ChartData, type LegendItem } from "../lib/interpretData";

interface BarChartProps {
  title: string;
  data: ChartData | null;
}

export default function BarChart(props: BarChartProps) {
  const drawBarChart = () => {
    const canvas = document.getElementById("barChart") as HTMLCanvasElement;
    if (!canvas || !props.data) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data = props.data;
    if (data.headers.length < 2) return;

    // Interpret data structure
    const { chartPoints, legend, isMultiSeries, categoryHeader } = interpretData(data);
    if (!chartPoints.length) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Chart dimensions
    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    // Calculate scales
    const maxValue = Math.max(...chartPoints.map((d) => d.value));
    const categoryCount = Array.from(new Set(chartPoints.map((d) => d.label))).length;

    // Adjust bar width for grouped bars
    const seriesCount = isMultiSeries ? new Set(chartPoints.map((d) => d.series)).size : 1;
    const groupWidth = chartWidth / categoryCount;
    const barWidth = (groupWidth * 0.8) / seriesCount;
    const barSpacing = (groupWidth * 0.2) / seriesCount;

    // Draw axes
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw Y-axis labels and grid
    ctx.fillStyle = "#666";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const value = (maxValue / 5) * i;
      const y = canvas.height - padding - (chartHeight / 5) * i;
      ctx.fillText(value.toFixed(0), padding - 10, y + 4);

      // Grid lines
      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Draw bars
    const categories = Array.from(new Set(chartPoints.map((d) => d.label)));
    const colors = ["#007acc", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"];

    ctx.textAlign = "center";
    categories.forEach((category, categoryIndex) => {
      const categoryData = chartPoints.filter((d) => d.label === category);
      const groupX = padding + categoryIndex * groupWidth + groupWidth / 2;

      // Center group
      const totalBarWidth = categoryData.length * barWidth + (categoryData.length - 1) * barSpacing;
      const startX = groupX - totalBarWidth / 2;

      categoryData.forEach((item, seriesIndex) => {
        const barHeight = (item.value / maxValue) * chartHeight;
        const x = startX + seriesIndex * (barWidth + barSpacing);
        const y = canvas.height - padding - barHeight;

        // Draw bar with appropriate color
        if (item.series && isMultiSeries) {
          const seriesIdx = Array.from(new Set(chartPoints.map((d) => d.series))).indexOf(
            item.series,
          );
          ctx.fillStyle = colors[seriesIdx] || "#007acc";
        } else {
          ctx.fillStyle = "#007acc";
        }
        ctx.fillRect(x, y, barWidth, barHeight);

        // Draw value on top of bar
        ctx.fillStyle = "#333";
        ctx.font = "10px sans-serif";
        ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
      });

      // Draw X-axis label
      ctx.fillStyle = "#666";
      ctx.font = "12px sans-serif";
      ctx.fillText(category, groupX, canvas.height - padding + 20);
    });

    // Draw axis labels
    ctx.fillStyle = "#333";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";

    // X-axis label
    ctx.fillText(categoryHeader, canvas.width / 2, canvas.height - 10);

    // Y-axis label (rotated)
    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(isMultiSeries ? "Values" : data.headers[1] || "Value", 0, 0);
    ctx.restore();

    // Draw legend for multi-series
    if (legend.length > 0) {
      drawLegend(ctx, legend, padding);
    }
  };

  const drawLegend = (ctx: CanvasRenderingContext2D, legend: LegendItem[], padding: number) => {
    const legendX = ctx.canvas.width - padding - 120;
    const legendY = padding;

    legend.forEach((item, index) => {
      // Color box
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, legendY + index * 25, 15, 15);

      // Label
      ctx.fillStyle = "#333";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(item.label, legendX + 20, legendY + index * 25 + 12);
    });
  };

  // Redraw chart when data changes
  createEffect(() => {
    if (props.data) {
      // Wait for DOM to update
      setTimeout(drawBarChart, 100);
    }
  });

  return (
    <div class="text-center mt-5">
      <h2 class="text-2xl font-semibold text-gray-800 mb-5">{props.title}</h2>
      <canvas
        id="barChart"
        width="800"
        height="400"
        class="border border-gray-200 rounded-lg max-w-full mx-auto shadow-sm"
      ></canvas>
    </div>
  );
}

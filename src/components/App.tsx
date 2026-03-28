import { createSignal, Show } from "solid-js";

import BarChart from "./BarChart";
import CsvUpload from "./CsvUpload";

interface ChartData {
  headers: string[];
  data: Record<string, string | number>[];
}

export default function App() {
  const [chartData, setChartData] = createSignal<ChartData | null>(null);

  return (
    <div class="min-h-screen bg-gray-50 p-5">
      <div class="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-10">
        <Show
          when={chartData()}
          fallback={
            <CsvUpload
              onDataLoaded={(data) => {
                setChartData(data);
              }}
            />
          }
        >
          <div class="space-y-5">
            <BarChart title="Data Visualization" data={chartData()} />
            <div class="text-center">
              <button
                class="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-md cursor-pointer text-sm hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                onClick={() => {
                  setChartData(null);
                }}
              >
                Upload New File
              </button>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}

"use client";

import {
  type ChartConfig,
  ChartContainer,
  getColorsCount,
  LoadingIndicator,
} from "@/components/evilcharts/ui/chart";
import {
  ChartTooltip,
  ChartTooltipContent,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/components/evilcharts/ui/tooltip";
import { ChartLegend, ChartLegendContent, type ChartLegendVariant } from "@/components/evilcharts/ui/legend";
import { ChartBackground, type BackgroundVariant } from "@/components/evilcharts/ui/background";
import { ChartDot, type DotVariant } from "@/components/evilcharts/ui/dot";
import {
  Children,
  createContext,
  isValidElement,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type ComponentProps,
  type FC,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  PolarAngleAxis as RechartsPolarAngleAxis,
  PolarGrid as RechartsPolarGrid,
  PolarRadiusAxis as RechartsPolarRadiusAxis,
  Radar as RechartsRadar,
  RadarChart as RechartsRadarChart,
} from "recharts";

// Constants
const STROKE_WIDTH = 1;
const DEFAULT_FILL_OPACITY = 0.3;
const LOADING_POINTS = 6;
const LOADING_ANIMATION_DURATION = 1500; // in milliseconds
const LOADING_RADAR_DATA_KEY = "value";

type RadarVariant = "filled" | "lines";

// ─────────────────────────────────────────────────────────────────────────────
// Shared context
// ─────────────────────────────────────────────────────────────────────────────

type RadarChartContextValue = {
  config: ChartConfig; // colors + labels for every series
  isLoading: boolean; // whether the chart shows its loading skeleton
  selectedDataKey: string | null; // currently selected series, or null when none
  selectDataKey: (dataKey: string | null) => void; // sets the selected series
};

const RadarChartContext = createContext<RadarChartContextValue | null>(null);

function useRadarChart() {
  const context = use(RadarChartContext);

  if (!context) {
    throw new Error(
      "Radar chart parts (<Radar />, <PolarAngleAxis />, …) must be used within <EvilRadarChart />",
    );
  }

  return context;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root container
// ─────────────────────────────────────────────────────────────────────────────

type ValidateConfigKeys<TData, TConfig> = {
  [K in keyof TConfig]: K extends keyof TData ? ChartConfig[string] : never;
};

type EvilRadarChartBaseProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  config: TConfig & ValidateConfigKeys<TData, TConfig>; // series colors + labels
  data: TData[]; // rows rendered by the chart
  children: ReactNode; // composed parts — <Radar />, <PolarGrid />, <Legend />, …
  className?: string; // extra classes for the chart container
  chartProps?: ComponentProps<typeof RechartsRadarChart>; // escape hatch for the raw Recharts chart
  backgroundVariant?: BackgroundVariant; // background pattern drawn behind the chart
  defaultSelectedDataKey?: string | null; // series selected on first render
  onSelectionChange?: (selectedDataKey: string | null) => void; // fires when the selected series changes
  isLoading?: boolean; // shows the animated loading skeleton
  loadingPoints?: number; // number of points in the loading skeleton
};

type EvilRadarChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = EvilRadarChartBaseProps<TData, TConfig>;

export function EvilRadarChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({
  config,
  data,
  children,
  className,
  chartProps,
  backgroundVariant,
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  loadingPoints,
}: EvilRadarChartProps<TData, TConfig>) {
  const chartId = useId().replace(/:/g, ""); // colon-free id keeps CSS/SVG selectors valid
  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);
  const loadingData = useLoadingData(isLoading, loadingPoints);

  const selectDataKey = useCallback(
    (newSelectedDataKey: string | null) => {
      setSelectedDataKey(newSelectedDataKey);
      onSelectionChange?.(newSelectedDataKey);
    },
    [onSelectionChange],
  );

  const contextValue = useMemo<RadarChartContextValue>(
    () => ({
      config,
      isLoading,
      selectedDataKey,
      selectDataKey,
    }),
    [config, isLoading, selectedDataKey, selectDataKey],
  );

  return (
    <RadarChartContext value={contextValue}>
      <ChartContainer className={className} config={config}>
        <LoadingIndicator isLoading={isLoading} />
        <RechartsRadarChart id={chartId} data={isLoading ? loadingData : data} {...chartProps}>
          {backgroundVariant && <ChartBackground variant={backgroundVariant} />}
          {children}
          {isLoading && <LoadingRadar />}
        </RechartsRadarChart>
      </ChartContainer>
    </RadarChartContext>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composible parts
// ─────────────────────────────────────────────────────────────────────────────

type RadarProps = {
  dataKey: string; // series key — must exist on the data and config
  variant?: RadarVariant; // fill style for this radar only
  fillOpacity?: number; // opacity of the filled area when `variant="filled"`
  isGlowing?: boolean; // adds a soft outer glow around this radar
  isClickable?: boolean; // lets this radar be selected by clicking it
  children?: ReactNode; // optional <Dot /> and <ActiveDot /> composition
  radarProps?: Omit<ComponentProps<typeof RechartsRadar>, "dataKey">; // escape hatch for raw Recharts Radar props
};

export function Radar({
  dataKey,
  variant = "filled",
  fillOpacity = DEFAULT_FILL_OPACITY,
  isGlowing = false,
  isClickable = false,
  children,
  radarProps,
}: RadarProps) {
  const { config, isLoading, selectedDataKey, selectDataKey } = useRadarChart();
  const id = useId().replace(/:/g, "");

  if (isLoading) return null;

  const isSelected = selectedDataKey === null || selectedDataKey === dataKey;
  const opacity = isClickable && !isSelected ? 0.2 : 1;
  const isFilled = variant === "filled";

  const { dot, activeDot } = resolveDots(children, id, dataKey, opacity);

  return (
    <>
      <RechartsRadar
        dataKey={dataKey}
        stroke={`url(#${id}-radar-stroke-${dataKey})`}
        strokeOpacity={opacity}
        strokeWidth={STROKE_WIDTH}
        fill={isFilled ? `url(#${id}-radar-fill-${dataKey})` : "none"}
        fillOpacity={isFilled ? fillOpacity * opacity : 0}
        dot={dot}
        activeDot={activeDot}
        filter={isGlowing ? `url(#${id}-radar-glow-${dataKey})` : undefined}
        className="transition-opacity duration-200"
        style={isClickable ? { cursor: "pointer" } : undefined}
        onClick={() => {
          if (!isClickable) return;
          selectDataKey(selectedDataKey === dataKey ? null : dataKey);
        }}
        {...radarProps}
      />
      <defs>
        <ColorGradient id={id} dataKey={dataKey} config={config} />
        <StrokeGradient id={id} dataKey={dataKey} config={config} />
        {isFilled && <FillGradient id={id} dataKey={dataKey} config={config} />}
        {isGlowing && <GlowFilter id={id} dataKey={dataKey} />}
      </defs>
    </>
  );
}

type DotProps = {
  variant?: DotVariant;
};

export const Dot: FC<DotProps> = () => null;

export const ActiveDot: FC<DotProps> = () => null;

type PolarGridProps = ComponentProps<typeof RechartsPolarGrid>;

export function PolarGrid({
  gridType = "polygon",
  stroke = "currentColor",
  strokeOpacity = 0.2,
  strokeDasharray = "3 4",
  ...props
}: PolarGridProps) {
  return (
    <RechartsPolarGrid
      gridType={gridType}
      stroke={stroke}
      strokeOpacity={strokeOpacity}
      strokeDasharray={strokeDasharray}
      {...props}
    />
  );
}

type PolarAngleAxisProps = ComponentProps<typeof RechartsPolarAngleAxis>;

export function PolarAngleAxis({
  tick = { fill: "currentColor", fontSize: 12 },
  tickLine = false,
  ...props
}: PolarAngleAxisProps) {
  const { isLoading } = useRadarChart();

  if (isLoading) return null;

  return <RechartsPolarAngleAxis tick={tick} tickLine={tickLine} {...props} />;
}

type PolarRadiusAxisProps = ComponentProps<typeof RechartsPolarRadiusAxis>;

export function PolarRadiusAxis({
  tick = { fill: "currentColor", fontSize: 10 },
  tickLine = false,
  axisLine = false,
  ...props
}: PolarRadiusAxisProps) {
  const { isLoading } = useRadarChart();

  if (isLoading) return null;

  return (
    <RechartsPolarRadiusAxis tick={tick} tickLine={tickLine} axisLine={axisLine} {...props} />
  );
}

type TooltipProps = {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  defaultIndex?: number;
};

export function Tooltip({ variant, roundness, defaultIndex }: TooltipProps) {
  const { isLoading, selectedDataKey } = useRadarChart();

  if (isLoading) return null;

  return (
    <ChartTooltip
      defaultIndex={defaultIndex}
      cursor={false}
      content={
        <ChartTooltipContent selected={selectedDataKey} roundness={roundness} variant={variant} />
      }
    />
  );
}

type LegendProps = {
  variant?: ChartLegendVariant;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  isClickable?: boolean;
};

export function Legend({
  variant,
  align = "center",
  verticalAlign = "bottom",
  isClickable = false,
}: LegendProps) {
  const { isLoading, selectedDataKey, selectDataKey } = useRadarChart();

  if (isLoading) return null;

  return (
    <ChartLegend
      verticalAlign={verticalAlign}
      align={align}
      content={
        <ChartLegendContent
          selected={selectedDataKey}
          onSelectChange={selectDataKey}
          isClickable={isClickable}
          variant={variant}
        />
      }
    />
  );
}

type RadarDotProp = ComponentProps<typeof RechartsRadar>["dot"];
type RadarActiveDotProp = ComponentProps<typeof RechartsRadar>["activeDot"];

const resolveDots = (
  children: ReactNode,
  id: string,
  dataKey: string,
  dotOpacity: number,
): { dot: RadarDotProp; activeDot: RadarActiveDotProp } => {
  let dot: RadarDotProp = false;
  let activeDot: RadarActiveDotProp = false;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    if (child.type === Dot) {
      const { variant } = (child as ReactElement<DotProps>).props;
      dot = <ChartDot type={variant} dataKey={dataKey} chartId={id} fillOpacity={dotOpacity} />;
    }

    if (child.type === ActiveDot) {
      const { variant } = (child as ReactElement<DotProps>).props;
      activeDot = (
        <ChartDot type={variant} dataKey={dataKey} chartId={id} fillOpacity={dotOpacity} />
      );
    }
  });

  return { dot, activeDot };
};

type StyleProps = {
  id: string;
  dataKey: string;
  config: ChartConfig;
};

type ColorStopsProps = {
  dataKey: string;
  colorsCount: number;
  opacities?: number[];
};

const ColorStops = ({ dataKey, colorsCount, opacities }: ColorStopsProps) => {
  if (colorsCount === 1) {
    return (
      <>
        <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} stopOpacity={opacities?.[0]} />
        <stop
          offset="100%"
          stopColor={`var(--color-${dataKey}-0)`}
          stopOpacity={opacities?.[opacities.length - 1]}
        />
      </>
    );
  }

  return (
    <>
      {Array.from({ length: colorsCount }, (_, index) => {
        const offset = `${(index / (colorsCount - 1)) * 100}%`;
        return (
          <stop
            key={offset}
            offset={offset}
            stopColor={`var(--color-${dataKey}-${index}, var(--color-${dataKey}-0))`}
            stopOpacity={opacities?.[index]}
          />
        );
      })}
    </>
  );
};

const ColorGradient = ({ id, dataKey, config }: StyleProps) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {});

  return (
    <linearGradient id={`${id}-colors-${dataKey}`} x1="0" y1="0" x2="1" y2="0">
      <ColorStops dataKey={dataKey} colorsCount={colorsCount} />
    </linearGradient>
  );
};

const StrokeGradient = ({ id, dataKey, config }: StyleProps) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {});

  return (
    <linearGradient id={`${id}-radar-stroke-${dataKey}`} x1="0" y1="0" x2="1" y2="1">
      <ColorStops dataKey={dataKey} colorsCount={colorsCount} />
    </linearGradient>
  );
};

const FillGradient = ({ id, dataKey, config }: StyleProps) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {});
  const opacities =
    colorsCount === 1 ? [0.8, 0.3] : Array.from({ length: colorsCount }, (_, i) => (i === 0 ? 0.8 : 0.3));

  return (
    <radialGradient id={`${id}-radar-fill-${dataKey}`} cx="50%" cy="50%" r="50%">
      <ColorStops dataKey={dataKey} colorsCount={colorsCount} opacities={opacities} />
    </radialGradient>
  );
};

const GlowFilter = ({ id, dataKey }: Pick<StyleProps, "id" | "dataKey">) => {
  return (
    <filter id={`${id}-radar-glow-${dataKey}`} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
      <feColorMatrix
        in="blur"
        type="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.6 0"
        result="glow"
      />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
};

const generateLoadingData = (points: number) => {
  const categories = ["A", "B", "C", "D", "E", "F"];

  return categories.slice(0, points).map((category) => ({
    name: category,
    [LOADING_RADAR_DATA_KEY]: 30 + Math.random() * 70,
  }));
};

export function useLoadingData(isLoading: boolean, loadingPoints: number = LOADING_POINTS) {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, LOADING_ANIMATION_DURATION);

    return () => clearInterval(interval);
  }, [isLoading]);

  const loadingData = useMemo(
    () => generateLoadingData(loadingPoints),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadingPoints, refreshKey],
  );

  return loadingData;
}

const LoadingRadar = () => {
  return (
    <RechartsRadar
      dataKey={LOADING_RADAR_DATA_KEY}
      stroke="currentColor"
      strokeOpacity={0.3}
      strokeWidth={2}
      fill="currentColor"
      fillOpacity={0.1}
      dot={false}
      isAnimationActive
      animationDuration={LOADING_ANIMATION_DURATION}
      animationEasing="ease-in-out"
    />
  );
};

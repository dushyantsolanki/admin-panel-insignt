"use client";

import {
  type ChartConfig,
  ChartContainer,
  getColorsCount,
  getLoadingData,
  LoadingIndicator,
} from "@/components/evilcharts/ui/chart";
import { EvilBrush, useEvilBrush, type EvilBrushRange } from "@/components/evilcharts/ui/evil-brush";
import {
  ChartTooltip,
  ChartTooltipContent,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/components/evilcharts/ui/tooltip";
import { ChartLegend, ChartLegendContent, type ChartLegendVariant } from "@/components/evilcharts/ui/legend";
import { ChartBackground, type BackgroundVariant } from "@/components/evilcharts/ui/background";
import {
  createContext,
  use,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  Bar as RechartsBar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Rectangle,
  ReferenceLine,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
} from "recharts";
import { RectRadius } from "recharts/types/shape/Rectangle";
import { motion, useReducedMotion } from "framer-motion";

// Constants
const DEFAULT_BAR_RADIUS = 2;
const LOADING_BAR_DATA_KEY = "loading";
const LOADING_ANIMATION_DURATION = 2000; // in milliseconds
const STACK_ID = "evil-stacked";
const BAR_GROW_DURATION = 0.5; // per-bar grow-in length, in seconds
const BAR_STAGGER = 0.05; // delay between consecutive bars, in seconds
const REVEAL_EASE: [number, number, number, number] = [0, 0.7, 0.5, 1]; // grow-in easing

type BarVariant = "default" | "hatched" | "duotone" | "duotone-reverse" | "gradient" | "stripped";
type StackType = "default" | "stacked" | "percent";
type BarLayout = "vertical" | "horizontal";

/**
 * Order in which bars grow into view. Recharts' own bar animation is permanently
 * disabled — every bar instead grows from its baseline (bottom for vertical
 * layout, left for horizontal), and this controls the stagger sequence.
 *
 * NOTE: the grow-in is a per-frame animation, so it is heavier than a static
 * chart. `"none"` opts out entirely; it is also what a device with the OS
 * "reduce motion" preference falls back to automatically.
 */
type BarAnimationType = "none" | "left-to-right" | "right-to-left" | "center-out" | "edges-in";

// ─────────────────────────────────────────────────────────────────────────────
// Shared context
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared state for every part of the chart. Lifted into <EvilBarChart /> so that
 * <Bar />, <XAxis />, <Legend />, and friends can read it without prop drilling.
 * Sub-components are composed freely — the provider is the single source of truth.
 */
type BarChartContextValue = {
  config: ChartConfig; // colors + labels for every series
  isStacked: boolean; // whether bars stack on top of each other
  isHorizontal: boolean; // whether bars are laid out horizontally
  isLoading: boolean; // whether the chart shows its loading skeleton
  barRadius: number; // default corner radius each <Bar /> inherits
  animationType: BarAnimationType; // default grow-in order each <Bar /> inherits
  introStartedAt: number; // timestamp the chart mounted — anchors the one-shot grow-in
  dataLength: number; // number of rows currently rendered
  selectedDataKey: string | null; // currently selected series, or null when none
  selectDataKey: (dataKey: string | null) => void; // sets the selected series
  isMouseInChart: boolean; // whether the pointer is currently over the chart
};

const BarChartContext = createContext<BarChartContextValue | null>(null);

// Reads the chart context, throwing a helpful error when used outside <EvilBarChart />
function useBarChart() {
  const context = use(BarChartContext);

  if (!context) {
    throw new Error(
      "Bar chart parts (<Bar />, <XAxis />, …) must be used within <EvilBarChart />",
    );
  }

  return context;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root container
// ─────────────────────────────────────────────────────────────────────────────

// Validates that every config key also exists on the data row type
type ValidateConfigKeys<TData, TConfig> = {
  [K in keyof TConfig]: K extends keyof TData ? ChartConfig[string] : never;
};

type EvilBarChartBaseProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  config: TConfig & ValidateConfigKeys<TData, TConfig>; // series colors + labels
  data: TData[]; // rows rendered by the chart
  children: ReactNode; // composed parts — <Bar />, <XAxis />, <Legend />, …
  className?: string; // extra classes for the chart container
  chartProps?: ComponentProps<typeof RechartsBarChart>; // escape hatch for the raw Recharts chart
  stackType?: StackType; // how multiple bars combine
  layout?: BarLayout; // orientation of the bars
  barRadius?: number; // default corner radius for every <Bar />
  animationType?: BarAnimationType; // default grow-in order for every <Bar />
  barGap?: number; // gap between bars within the same category
  barCategoryGap?: number; // gap between categories of bars
  backgroundVariant?: BackgroundVariant; // background pattern drawn behind the chart
  defaultSelectedDataKey?: string | null; // series selected on first render
  onSelectionChange?: (selectedDataKey: string | null) => void; // fires when the selected series changes
  isLoading?: boolean; // shows the animated loading skeleton
  loadingBars?: number; // number of bars in the loading skeleton
  showBrush?: boolean; // renders a zoom brush below the chart
  xDataKey?: keyof TData & string; // x-axis key — only needed for the brush footer
  brushHeight?: number; // height of the brush preview in pixels
  brushFormatLabel?: (value: unknown, index: number) => string; // formats brush axis labels
  onBrushChange?: (range: EvilBrushRange) => void; // fires when the brush range changes
};

type EvilBarChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = EvilBarChartBaseProps<TData, TConfig>;

/**
 * Root of the composible bar chart. Owns the data, the shared context, the
 * loading skeleton, and the optional zoom brush. Everything visual — axes,
 * grid, tooltip, legend, and the bars themselves — is composed as children,
 * so a consumer renders exactly the parts they need.
 */
export function EvilBarChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({
  config,
  data,
  children,
  className,
  chartProps,
  stackType = "default",
  layout = "vertical",
  barRadius = DEFAULT_BAR_RADIUS,
  animationType = "left-to-right",
  barGap,
  barCategoryGap,
  backgroundVariant,
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  loadingBars,
  showBrush = false,
  xDataKey,
  brushHeight,
  brushFormatLabel,
  onBrushChange,
}: EvilBarChartProps<TData, TConfig>) {
  const chartId = useId().replace(/:/g, ""); // colon-free id keeps SVG selectors valid
  const [introStartedAt] = useState(() => Date.now());
  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);
  const [isMouseInChart, setIsMouseInChart] = useState(false);
  const { loadingData, onShimmerExit } = useLoadingData(isLoading, loadingBars);
  const { visibleData, brushProps } = useEvilBrush({ data });

  const isStacked = stackType === "stacked" || stackType === "percent";
  const isHorizontal = layout === "horizontal";
  const displayData = showBrush && !isLoading ? visibleData : data;

  // Updates selection state and notifies the parent
  const selectDataKey = useCallback(
    (newSelectedDataKey: string | null) => {
      setSelectedDataKey(newSelectedDataKey);
      onSelectionChange?.(newSelectedDataKey);
    },
    [onSelectionChange],
  );

  const contextValue = useMemo<BarChartContextValue>(
    () => ({
      config,
      isStacked,
      isHorizontal,
      isLoading,
      barRadius,
      animationType,
      introStartedAt,
      dataLength: displayData.length,
      selectedDataKey,
      selectDataKey,
      isMouseInChart,
    }),
    [
      config,
      isStacked,
      isHorizontal,
      isLoading,
      barRadius,
      animationType,
      introStartedAt,
      displayData.length,
      selectedDataKey,
      selectDataKey,
      isMouseInChart,
    ],
  );

  return (
    <BarChartContext value={contextValue}>
      <ChartContainer
        className={className}
        config={config}
        footer={
          showBrush &&
          !isLoading && (
            <EvilBrush
              data={data}
              chartConfig={config}
              xDataKey={xDataKey}
              variant="bar"
              barRadius={barRadius}
              height={brushHeight}
              formatLabel={brushFormatLabel}
              stacked={isStacked}
              skipStyle
              className="mt-1"
              {...brushProps}
              onChange={(range: EvilBrushRange) => {
                brushProps.onChange(range);
                onBrushChange?.(range);
              }}
            />
          )
        }
      >
        <LoadingIndicator isLoading={isLoading} />
        <RechartsBarChart
          id={chartId}
          accessibilityLayer
          layout={isHorizontal ? "vertical" : "horizontal"}
          data={isLoading ? loadingData : displayData}
          barGap={barGap}
          barCategoryGap={barCategoryGap}
          stackOffset={stackType === "percent" ? "expand" : undefined}
          onMouseEnter={() => setIsMouseInChart(true)}
          onMouseLeave={() => setIsMouseInChart(false)}
          {...chartProps}
        >
          {backgroundVariant && <ChartBackground variant={backgroundVariant} />}
          <ReferenceLine color="white" />
          {children}
          {isLoading && <LoadingBar chartId={chartId} onShimmerExit={onShimmerExit} />}
        </RechartsBarChart>
      </ChartContainer>
    </BarChartContext>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composible parts
// ─────────────────────────────────────────────────────────────────────────────

type BarProps = {
  dataKey: string; // series key — must exist on the data and config
  variant?: BarVariant; // fill style for this bar only
  radius?: number; // corner radius — falls back to the chart default
  animationType?: BarAnimationType; // grow-in order — falls back to the chart default
  isClickable?: boolean; // lets this bar be selected by clicking it
  enableHoverHighlight?: boolean; // dims this bar while another bar is hovered
  glowing?: boolean; // applies a soft outer glow to this bar
  bufferBar?: boolean; // renders the last data point as a hatched "buffer" bar
  barProps?: ComponentProps<typeof RechartsBar>; // escape hatch for raw Recharts Bar props
};

export function Bar({
  dataKey,
  variant = "default",
  radius,
  animationType,
  isClickable = false,
  enableHoverHighlight = false,
  glowing = false,
  bufferBar = false,
  barProps,
}: BarProps) {
  const {
    config,
    isStacked,
    isHorizontal,
    isLoading,
    barRadius: defaultRadius,
    animationType: defaultAnimation,
    introStartedAt,
    dataLength,
    selectedDataKey,
    selectDataKey,
    isMouseInChart,
  } = useBarChart();
  const id = useId().replace(/:/g, ""); // unique id scopes this bar's style defs
  const shouldReduceMotion = useReducedMotion();

  if (isLoading) return null;

  const resolvedRadius = radius ?? defaultRadius;
  const isSelected = selectedDataKey === dataKey;

  const revealType: BarAnimationType = shouldReduceMotion
    ? "none"
    : (animationType ?? defaultAnimation);

  const customBarProps = {
    id,
    dataKey,
    variant,
    barRadius: resolvedRadius,
    glowing,
    bufferBar,
    isClickable,
    enableHoverHighlight,
    isMouseInChart,
    isHorizontal,
    introStartedAt,
    selectedDataKey,
    dataLength,
    onClick: () => {
      if (!isClickable) return;
      selectDataKey(isSelected ? null : dataKey);
    },
  };

  return (
    <>
      <RechartsBar
        dataKey={dataKey}
        stackId={isStacked ? STACK_ID : undefined}
        fill={`url(#${id}-colors-${dataKey})`}
        radius={resolvedRadius}
        isAnimationActive={false}
        style={isClickable || enableHoverHighlight ? { cursor: "pointer" } : undefined}
        shape={(props: unknown) => (
          <CustomBar {...(props as BarShapeProps)} {...customBarProps} animationType={revealType} />
        )}
        activeBar={(props: unknown) => (
          <CustomBar {...(props as BarShapeProps)} {...customBarProps} animationType="none" />
        )}
        {...barProps}
      />
      <defs>
        <ColorGradient id={id} dataKey={dataKey} config={config} />
        {variant === "hatched" && <HatchedPattern id={id} dataKey={dataKey} />}
        {variant === "duotone" && <DuotonePattern id={id} dataKey={dataKey} config={config} />}
        {variant === "duotone-reverse" && (
          <DuotoneReversePattern id={id} dataKey={dataKey} config={config} />
        )}
        {variant === "gradient" && <GradientPattern id={id} dataKey={dataKey} />}
        {variant === "stripped" && <StrippedPattern id={id} dataKey={dataKey} />}
        {bufferBar && <BufferHatchedPattern id={id} dataKey={dataKey} />}
        {glowing && <GlowFilter id={id} dataKey={dataKey} />}
      </defs>
    </>
  );
}

type XAxisProps = ComponentProps<typeof RechartsXAxis>;

export function XAxis({
  tickLine = false,
  axisLine = false,
  tickMargin = 8,
  minTickGap = 8,
  ...props
}: XAxisProps) {
  const { isLoading, isHorizontal } = useBarChart();

  if (isLoading) return null;

  return (
    <RechartsXAxis
      tickLine={tickLine}
      axisLine={axisLine}
      tickMargin={tickMargin}
      minTickGap={minTickGap}
      type={props.type ?? (isHorizontal ? "number" : "category")}
      {...props}
    />
  );
}

type YAxisProps = ComponentProps<typeof RechartsYAxis>;

export function YAxis({
  tickLine = false,
  axisLine = false,
  tickMargin = 8,
  minTickGap = 8,
  width = "auto",
  ...props
}: YAxisProps) {
  const { isLoading, isHorizontal } = useBarChart();

  if (isLoading) return null;

  return (
    <RechartsYAxis
      tickLine={tickLine}
      axisLine={axisLine}
      tickMargin={tickMargin}
      minTickGap={minTickGap}
      width={width}
      type={props.type ?? (isHorizontal ? "category" : "number")}
      {...props}
    />
  );
}

type GridProps = ComponentProps<typeof CartesianGrid>;

export function Grid({ strokeDasharray = "3 3", vertical, horizontal, ...props }: GridProps) {
  const { isHorizontal } = useBarChart();

  return (
    <CartesianGrid
      strokeDasharray={strokeDasharray}
      vertical={vertical ?? isHorizontal}
      horizontal={horizontal ?? !isHorizontal}
      {...props}
    />
  );
}

type TooltipProps = {
  variant?: TooltipVariant;
  roundness?: TooltipRoundness;
  defaultIndex?: number;
};

export function Tooltip({ variant, roundness, defaultIndex }: TooltipProps) {
  const { isLoading, selectedDataKey } = useBarChart();

  if (isLoading) return null;

  return (
    <ChartTooltip
      cursor={false}
      defaultIndex={defaultIndex}
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
  align = "right",
  verticalAlign = "top",
  isClickable = false,
}: LegendProps) {
  const { selectedDataKey, selectDataKey } = useBarChart();

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

type BarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  fillOpacity?: number;
  dataKey?: string;
  index?: number;
  [key: string]: unknown;
};

type CustomBarProps = {
  id: string;
  dataKey: string;
  variant: BarVariant;
  barRadius: number;
  glowing?: boolean;
  bufferBar?: boolean;
  isClickable?: boolean;
  enableHoverHighlight?: boolean;
  isMouseInChart?: boolean;
  isHorizontal?: boolean;
  animationType?: BarAnimationType;
  introStartedAt?: number;
  selectedDataKey?: string | null;
  isActive?: boolean;
  dataLength?: number;
  onClick?: () => void;
} & BarShapeProps;

const CustomBar = (props: CustomBarProps) => {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    id,
    dataKey,
    variant,
    barRadius,
    glowing,
    bufferBar,
    isClickable,
    enableHoverHighlight,
    isMouseInChart,
    isHorizontal = false,
    animationType = "none",
    introStartedAt = 0,
    selectedDataKey,
    isActive,
    dataLength = 0,
    onClick,
  } = props;

  const index = typeof props.index === "number" ? props.index : -1;
  const isLastBar = bufferBar && dataLength > 0 && index === dataLength - 1;
  const isStripped = variant === "stripped";
  const grow = getBarGrowAnimation(animationType, index, dataLength, isHorizontal, introStartedAt);

  const fill = isLastBar
    ? `url(#${id}-buffer-hatched-${dataKey})`
    : getVariantFill(variant, id, dataKey);
  const filter = glowing ? `url(#${id}-bar-glow-${dataKey})` : undefined;

  const fillOpacity = getBarOpacity({
    isClickable,
    selectedDataKey,
    dataKey,
    enableHoverHighlight,
    isMouseInChart,
    isActive,
  });
  const cursorStyle = isClickable || enableHoverHighlight ? { cursor: "pointer" } : undefined;

  const radius: RectRadius = isStripped ? [barRadius, barRadius, 0, 0] : barRadius;

  const visibleBar = (
    <>
      <Rectangle
        x={x}
        y={y}
        width={width}
        opacity={fillOpacity}
        height={Math.max(0, height - 3)}
        radius={radius}
        fill={fill}
        filter={filter}
        stroke={isLastBar ? `url(#${id}-colors-${dataKey})` : undefined}
        strokeWidth={isLastBar ? 1 : undefined}
      />
      {isStripped && (
        <Rectangle
          x={x}
          y={y - 4}
          width={width}
          height={2}
          radius={1}
          fill={`url(#${id}-colors-${dataKey})`}
        />
      )}
    </>
  );

  return (
    <g style={cursorStyle} onClick={onClick}>
      <Rectangle {...props} fill="transparent" />
      {grow ? (
        <motion.g
          initial={grow.initial}
          animate={grow.animate}
          transition={grow.transition}
          style={grow.style}
        >
          {visibleBar}
        </motion.g>
      ) : (
        visibleBar
      )}
    </g>
  );
};

const getBarGrowAnimation = (
  animationType: BarAnimationType,
  index: number,
  dataLength: number,
  isHorizontal: boolean,
  introStartedAt: number,
) => {
  if (animationType === "none" || index < 0 || dataLength <= 0) return null;

  const lastIndex = dataLength - 1;
  const center = lastIndex / 2;

  let step: number;
  switch (animationType) {
    case "right-to-left":
      step = lastIndex - index;
      break;
    case "center-out":
      step = Math.abs(index - center);
      break;
    case "edges-in":
      step = center - Math.abs(index - center);
      break;
    default:
      step = index;
  }

  const startMs = step * BAR_STAGGER * 1000;
  const durationMs = BAR_GROW_DURATION * 1000;
  const endMs = startMs + durationMs;
  const elapsed = Date.now() - introStartedAt;

  if (elapsed >= endMs) return null;

  const from = elapsed <= startMs ? 0 : (elapsed - startMs) / durationMs;
  const transition = {
    duration: (endMs - Math.max(elapsed, startMs)) / 1000,
    ease: REVEAL_EASE,
    delay: Math.max(0, startMs - elapsed) / 1000,
  };

  return isHorizontal
    ? { initial: { scaleX: from }, animate: { scaleX: 1 }, transition, style: { originX: 0 } }
    : { initial: { scaleY: from }, animate: { scaleY: 1 }, transition, style: { originY: 1 } };
};

const getVariantFill = (variant: BarVariant, id: string, dataKey: string): string => {
  switch (variant) {
    case "hatched":
      return `url(#${id}-hatched-${dataKey})`;
    case "duotone":
      return `url(#${id}-duotone-${dataKey})`;
    case "duotone-reverse":
      return `url(#${id}-duotone-reverse-${dataKey})`;
    case "gradient":
      return `url(#${id}-gradient-${dataKey})`;
    case "stripped":
      return `url(#${id}-stripped-${dataKey})`;
    default:
      return `url(#${id}-colors-${dataKey})`;
  }
};

const getBarOpacity = ({
  isClickable,
  selectedDataKey,
  dataKey,
  enableHoverHighlight,
  isMouseInChart,
  isActive,
}: {
  isClickable?: boolean;
  selectedDataKey?: string | null;
  dataKey: string;
  enableHoverHighlight?: boolean;
  isMouseInChart?: boolean;
  isActive?: boolean;
}) => {
  const isSelectedDataKey = selectedDataKey === null || selectedDataKey === dataKey;
  const clickOpacity = isClickable && selectedDataKey !== null ? (isSelectedDataKey ? 1 : 0.3) : 1;

  if (enableHoverHighlight && isMouseInChart) {
    return isActive ? clickOpacity : clickOpacity * 0.3;
  }

  return clickOpacity;
};

type StyleProps = {
  id: string;
  dataKey: string;
};

const ColorGradient = ({
  id,
  dataKey,
  config,
}: StyleProps & { config: ChartConfig }) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {});

  return (
    <linearGradient id={`${id}-colors-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
      {colorsCount === 1 ? (
        <>
          <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} />
          <stop offset="100%" stopColor={`var(--color-${dataKey}-0)`} />
        </>
      ) : (
        Array.from({ length: colorsCount }, (_, index) => {
          const offset = `${(index / (colorsCount - 1)) * 100}%`;
          return (
            <stop
              key={offset}
              offset={offset}
              stopColor={`var(--color-${dataKey}-${index}, var(--color-${dataKey}-0))`}
            />
          );
        })
      )}
    </linearGradient>
  );
};

const HatchedPattern = ({ id, dataKey }: StyleProps) => {
  return (
    <>
      <pattern
        id={`${id}-hatched-mask-pattern`}
        x="0"
        y="0"
        width="5"
        height="5"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-45)"
      >
        <rect width="5" height="5" fill="white" fillOpacity={0.3} />
        <rect width="1.5" height="5" fill="white" fillOpacity={1} />
      </pattern>
      <mask id={`${id}-hatched-mask-${dataKey}`}>
        <rect width="100%" height="100%" fill={`url(#${id}-hatched-mask-pattern)`} />
      </mask>
      <pattern
        id={`${id}-hatched-${dataKey}`}
        patternUnits="userSpaceOnUse"
        width="100%"
        height="100%"
      >
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-colors-${dataKey})`}
          mask={`url(#${id}-hatched-mask-${dataKey})`}
        />
      </pattern>
    </>
  );
};

const BufferHatchedPattern = ({ id, dataKey }: StyleProps) => {
  return (
    <>
      <pattern
        id={`${id}-buffer-hatched-mask-pattern`}
        x="0"
        y="0"
        width="5"
        height="5"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-45)"
      >
        <rect width="5" height="5" fill="black" fillOpacity={0} />
        <rect width="1" height="5" fill="white" fillOpacity={1} />
      </pattern>
      <mask id={`${id}-buffer-hatched-mask-${dataKey}`}>
        <rect width="100%" height="100%" fill={`url(#${id}-buffer-hatched-mask-pattern)`} />
      </mask>
      <pattern
        id={`${id}-buffer-hatched-${dataKey}`}
        patternUnits="userSpaceOnUse"
        width="100%"
        height="100%"
      >
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-colors-${dataKey})`}
          mask={`url(#${id}-buffer-hatched-mask-${dataKey})`}
        />
      </pattern>
    </>
  );
};

const DuotonePattern = ({ id, dataKey, config }: StyleProps & { config: ChartConfig }) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {});

  return (
    <>
      <linearGradient
        id={`${id}-duotone-mask-gradient-${dataKey}`}
        gradientUnits="objectBoundingBox"
        x1="0"
        y1="0"
        x2="1"
        y2="0"
      >
        <stop offset="50%" stopColor="white" stopOpacity={0.4} />
        <stop offset="50%" stopColor="white" stopOpacity={1} />
      </linearGradient>
      <linearGradient
        id={`${id}-duotone-colors-${dataKey}`}
        gradientUnits="objectBoundingBox"
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        {colorsCount === 1 ? (
          <>
            <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} />
            <stop offset="100%" stopColor={`var(--color-${dataKey}-0)`} />
          </>
        ) : (
          Array.from({ length: colorsCount }, (_, index) => {
            const offset = `${(index / (colorsCount - 1)) * 100}%`;
            return (
              <stop
                key={offset}
                offset={offset}
                stopColor={`var(--color-${dataKey}-${index}, var(--color-${dataKey}-0))`}
              />
            );
          })
        )}
      </linearGradient>
      <mask id={`${id}-duotone-mask-${dataKey}`} maskContentUnits="objectBoundingBox">
        <rect
          x="0"
          y="0"
          width="1"
          height="1"
          fill={`url(#${id}-duotone-mask-gradient-${dataKey})`}
        />
      </mask>
      <pattern
        id={`${id}-duotone-${dataKey}`}
        patternUnits="objectBoundingBox"
        patternContentUnits="objectBoundingBox"
        width="1"
        height="1"
      >
        <rect
          x="0"
          y="0"
          width="1"
          height="1"
          fill={`url(#${id}-duotone-colors-${dataKey})`}
          mask={`url(#${id}-duotone-mask-${dataKey})`}
        />
      </pattern>
    </>
  );
};

const DuotoneReversePattern = ({ id, dataKey, config }: StyleProps & { config: ChartConfig }) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {});

  return (
    <>
      <linearGradient
        id={`${id}-duotone-reverse-mask-gradient-${dataKey}`}
        gradientUnits="objectBoundingBox"
        x1="0"
        y1="0"
        x2="1"
        y2="0"
      >
        <stop offset="50%" stopColor="white" stopOpacity={1} />
        <stop offset="50%" stopColor="white" stopOpacity={0.4} />
      </linearGradient>
      <linearGradient
        id={`${id}-duotone-reverse-colors-${dataKey}`}
        gradientUnits="objectBoundingBox"
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        {colorsCount === 1 ? (
          <>
            <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} />
            <stop offset="100%" stopColor={`var(--color-${dataKey}-0)`} />
          </>
        ) : (
          Array.from({ length: colorsCount }, (_, index) => {
            const offset = `${(index / (colorsCount - 1)) * 100}%`;
            return (
              <stop
                key={offset}
                offset={offset}
                stopColor={`var(--color-${dataKey}-${index}, var(--color-${dataKey}-0))`}
              />
            );
          })
        )}
      </linearGradient>
      <mask id={`${id}-duotone-reverse-mask-${dataKey}`} maskContentUnits="objectBoundingBox">
        <rect
          x="0"
          y="0"
          width="1"
          height="1"
          fill={`url(#${id}-duotone-reverse-mask-gradient-${dataKey})`}
        />
      </mask>
      <pattern
        id={`${id}-duotone-reverse-${dataKey}`}
        patternUnits="objectBoundingBox"
        patternContentUnits="objectBoundingBox"
        width="1"
        height="1"
      >
        <rect
          x="0"
          y="0"
          width="1"
          height="1"
          fill={`url(#${id}-duotone-reverse-colors-${dataKey})`}
          mask={`url(#${id}-duotone-reverse-mask-${dataKey})`}
        />
      </pattern>
    </>
  );
};

const GradientPattern = ({ id, dataKey }: StyleProps) => {
  return (
    <>
      <linearGradient id={`${id}-gradient-mask-gradient`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="20%" stopColor="white" stopOpacity={1} />
        <stop offset="90%" stopColor="white" stopOpacity={0} />
      </linearGradient>
      <mask id={`${id}-gradient-mask-${dataKey}`}>
        <rect width="100%" height="100%" fill={`url(#${id}-gradient-mask-gradient)`} />
      </mask>
      <pattern
        id={`${id}-gradient-${dataKey}`}
        patternUnits="userSpaceOnUse"
        width="100%"
        height="100%"
      >
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-colors-${dataKey})`}
          mask={`url(#${id}-gradient-mask-${dataKey})`}
        />
      </pattern>
    </>
  );
};

const StrippedPattern = ({ id, dataKey }: StyleProps) => {
  return (
    <>
      <linearGradient id={`${id}-stripped-mask-gradient`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity={0.2} />
        <stop offset="100%" stopColor="white" stopOpacity={0.2} />
      </linearGradient>
      <mask id={`${id}-stripped-mask-${dataKey}`}>
        <rect width="100%" height="100%" fill={`url(#${id}-stripped-mask-gradient)`} />
      </mask>
      <pattern
        id={`${id}-stripped-${dataKey}`}
        patternUnits="userSpaceOnUse"
        width="100%"
        height="100%"
      >
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-colors-${dataKey})`}
          mask={`url(#${id}-stripped-mask-${dataKey})`}
        />
      </pattern>
    </>
  );
};

const GlowFilter = ({ id, dataKey }: StyleProps) => {
  return (
    <filter id={`${id}-bar-glow-${dataKey}`} x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
      <feColorMatrix
        in="blur"
        type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.5 0"
        result="glow"
      />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
};

const generateEasedGradientStops = (
  steps: number = 17,
  minOpacity: number = 0.05,
  maxOpacity: number = 0.9,
) => {
  return Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1);
    const eased = Math.sin(t * Math.PI) ** 2;
    const opacity = minOpacity + eased * (maxOpacity - minOpacity);
    return { offset: `${(t * 100).toFixed(0)}%`, opacity: Number(opacity.toFixed(3)) };
  });
};

export function useLoadingData(isLoading: boolean, loadingBars: number = 12) {
  const [loadingDataKey, setLoadingDataKey] = useState(false);

  const onShimmerExit = useCallback(() => {
    if (isLoading) {
      setLoadingDataKey((prev) => !prev);
    }
  }, [isLoading]);

  const loadingData = useMemo(
    () => getLoadingData(loadingBars, 20, 80),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadingBars, loadingDataKey],
  );

  return { loadingData, onShimmerExit };
}

const LoadingBar = ({
  chartId,
  onShimmerExit,
}: {
  chartId: string;
  onShimmerExit: () => void;
}) => {
  return (
    <>
      <RechartsBar
        dataKey={LOADING_BAR_DATA_KEY}
        fill="currentColor"
        fillOpacity={0.15}
        radius={DEFAULT_BAR_RADIUS}
        isAnimationActive={false}
        legendType="none"
        style={{ mask: `url(#${chartId}-loading-mask)` }}
      />
      <defs>
        <LoadingBarPattern chartId={chartId} onShimmerExit={onShimmerExit} />
      </defs>
    </>
  );
};

const LoadingBarPattern = ({
  chartId,
  onShimmerExit,
}: {
  chartId: string;
  onShimmerExit: () => void;
}) => {
  const gradientStops = generateEasedGradientStops();

  const patternWidth = 3;
  const startX = -1;
  const endX = 2;

  const lastXRef = useRef(startX);

  return (
    <>
      <linearGradient id={`${chartId}-loading-mask-gradient`} x1="0" y1="0" x2="1" y2="0">
        {gradientStops.map(({ offset, opacity }) => (
          <stop key={offset} offset={offset} stopColor="white" stopOpacity={opacity} />
        ))}
      </linearGradient>
      <pattern
        id={`${chartId}-loading-mask-pattern`}
        patternUnits="objectBoundingBox"
        patternContentUnits="objectBoundingBox"
        patternTransform="rotate(25)"
        width={patternWidth}
        height="1"
        x="0"
        y="0"
      >
        <motion.rect
          y="0"
          width="1"
          height="1"
          fill={`url(#${chartId}-loading-mask-gradient)`}
          initial={{ x: startX }}
          animate={{ x: endX }}
          transition={{
            duration: LOADING_ANIMATION_DURATION / 1000,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop",
          }}
          onUpdate={(latest) => {
            const xValue = typeof latest.x === "number" ? latest.x : startX;
            const lastX = lastXRef.current;

            if (xValue >= 1 && lastX < 1) {
              onShimmerExit();
            }

            lastXRef.current = xValue;
          }}
        />
      </pattern>
      <mask id={`${chartId}-loading-mask`} maskUnits="userSpaceOnUse">
        <rect width="100%" height="100%" fill={`url(#${chartId}-loading-mask-pattern)`} />
      </mask>
    </>
  );
};

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { dateFromDayNumber, nearestIndex, weightAxis } from '../core';
import { formatShort } from '../lib/dates';
import { AppText } from './kit';
import { useTheme } from './ThemeProvider';
import { font } from './tokens';

export interface ChartPoint {
  t: number; // day number
  kg: number;
}

export function WeightChart(props: {
  points: ChartPoint[];
  goalKg: number;
  stretchKg: number | null;
  plan: { from: ChartPoint; to: ChartPoint } | null;
  xMin: number;
  xMax: number;
  selected: number | null;
  onSelect?: (index: number) => void;
  height?: number;
}) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const height = props.height ?? 220;
  const padL = 40;
  const padR = 12;
  const padT = 12;
  const padB = 26;
  const plotW = Math.max(1, width - padL - padR);
  const plotH = height - padT - padB;

  const values = [
    ...props.points.map((p) => p.kg),
    props.goalKg,
    ...(props.stretchKg !== null ? [props.stretchKg] : []),
    ...(props.plan ? [props.plan.from.kg, props.plan.to.kg] : []),
  ];
  const axis = weightAxis(values);
  const span = Math.max(1, props.xMax - props.xMin);
  const X = (day: number) => padL + ((day - props.xMin) / span) * plotW;
  const Y = (kg: number) => padT + ((axis.max - kg) / (axis.max - axis.min)) * plotH;
  const ticks = [axis.max, (axis.max + axis.min) / 2, axis.min];

  const xs = props.points.map((p) => X(p.t));
  const showDots = props.points.length <= 45;
  const last = props.points.length - 1;
  const sel = props.selected !== null ? props.points[props.selected] : undefined;

  return (
    <View>
      <Pressable
        style={{ height }}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        onPressIn={(e) => {
          const i = nearestIndex(xs, e.nativeEvent.locationX);
          if (i >= 0) props.onSelect?.(i);
        }}
      >
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {width > 0 ? (
            <>
              <Svg width={width} height={height}>
                {ticks.map((v) => (
                  <Line
                    key={v}
                    x1={padL}
                    x2={padL + plotW}
                    y1={Y(v)}
                    y2={Y(v)}
                    stroke={t.border}
                    strokeWidth={1}
                  />
                ))}

                {props.stretchKg !== null ? (
                  <Line
                    x1={padL}
                    x2={padL + plotW}
                    y1={Y(props.stretchKg)}
                    y2={Y(props.stretchKg)}
                    stroke={t.accent}
                    strokeOpacity={0.45}
                    strokeWidth={2}
                    strokeDasharray="3 6"
                  />
                ) : null}
                <Line
                  x1={padL}
                  x2={padL + plotW}
                  y1={Y(props.goalKg)}
                  y2={Y(props.goalKg)}
                  stroke={t.accent}
                  strokeWidth={2.5}
                  strokeDasharray="7 6"
                />

                {props.plan ? (
                  <Line
                    x1={X(props.plan.from.t)}
                    y1={Y(props.plan.from.kg)}
                    x2={X(props.plan.to.t)}
                    y2={Y(props.plan.to.kg)}
                    stroke={t.chartPlan}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                ) : null}

                {props.points.length > 1 ? (
                  <Polyline
                    points={props.points.map((p) => `${X(p.t)},${Y(p.kg)}`).join(' ')}
                    fill="none"
                    stroke={t.chartLine}
                    strokeWidth={3}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ) : null}

                {sel ? (
                  <Line
                    x1={X(sel.t)}
                    x2={X(sel.t)}
                    y1={padT}
                    y2={padT + plotH}
                    stroke={t.chartLine}
                    strokeOpacity={0.35}
                    strokeWidth={1.5}
                  />
                ) : null}

                {showDots
                  ? props.points.slice(0, last).map((p, i) => (
                      <Circle key={i} cx={X(p.t)} cy={Y(p.kg)} r={4} fill={t.chartLine} />
                    ))
                  : null}
                {last >= 0 ? (
                  <Circle
                    cx={X(props.points[last].t)}
                    cy={Y(props.points[last].kg)}
                    r={7}
                    fill={t.chartLine}
                    stroke={t.card}
                    strokeWidth={3}
                  />
                ) : null}
                {sel && props.selected !== last ? (
                  <Circle
                    cx={X(sel.t)}
                    cy={Y(sel.kg)}
                    r={7}
                    fill={t.chartLine}
                    stroke={t.card}
                    strokeWidth={3}
                  />
                ) : null}
              </Svg>

              {ticks.map((v) => (
                <Text
                  key={`tick-${v}`}
                  style={{
                    position: 'absolute',
                    left: 0,
                    width: padL - 8,
                    top: Y(v) - 8,
                    textAlign: 'right',
                    fontFamily: font.medium,
                    fontSize: 12,
                    color: t.muted,
                  }}
                >
                  {Math.round(v)}
                </Text>
              ))}
              <Text
                style={{
                  position: 'absolute',
                  left: padL,
                  top: height - 20,
                  fontFamily: font.medium,
                  fontSize: 12,
                  color: t.muted,
                }}
              >
                {formatShort(dateFromDayNumber(props.xMin))}
              </Text>
              <Text
                style={{
                  position: 'absolute',
                  right: padR,
                  top: height - 20,
                  fontFamily: font.medium,
                  fontSize: 12,
                  color: t.muted,
                }}
              >
                {formatShort(dateFromDayNumber(props.xMax), true)}
              </Text>
            </>
          ) : null}
        </View>
      </Pressable>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 8 }}>
        <Key color={t.chartLine} label="Your weight" />
        {props.plan ? <Key color={t.chartPlan} label="Plan" /> : null}
        <Key color={t.accent} label={`Goal ${props.goalKg}`} />
        {props.stretchKg !== null ? (
          <Key color={t.accent} faded label={`Stretch ${props.stretchKg}`} />
        ) : null}
      </View>
    </View>
  );
}

function Key(props: { color: string; label: string; faded?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View
        style={{
          width: 9,
          height: 9,
          borderRadius: 5,
          backgroundColor: props.color,
          opacity: props.faded ? 0.45 : 1,
        }}
      />
      <AppText variant="caption" tone="muted">
        {props.label}
      </AppText>
    </View>
  );
}
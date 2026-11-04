import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { dateFromDayNumber, weightAxis } from '../core';
import { formatShort } from '../lib/dates';
import { colors } from './theme';

export interface ChartPoint {
  t: number; // day number
  kg: number;
}

const LINE = '#1B5FAA';
const PLAN = '#9A9A92';
const STRETCH = '#7FB89A';

function Segment(p: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  thickness?: number;
}) {
  const thickness = p.thickness ?? 2;
  const dx = p.x2 - p.x1;
  const dy = p.y2 - p.y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.5) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: p.x1,
        top: p.y1 - thickness / 2,
        width: len,
        height: thickness,
        backgroundColor: p.color,
        transformOrigin: 'left center',
        transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
      }}
    />
  );
}

export function WeightChart(props: {
  points: ChartPoint[];
  goalKg: number;
  stretchKg: number | null;
  plan: { from: ChartPoint; to: ChartPoint } | null;
  xMin: number;
  xMax: number;
  height?: number;
}) {
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
  const X = (t: number) => padL + ((t - props.xMin) / span) * plotW;
  const Y = (kg: number) => padT + ((axis.max - kg) / (axis.max - axis.min)) * plotH;
  const ticks = [axis.max, (axis.max + axis.min) / 2, axis.min];
  const showDots = props.points.length <= 45;

  return (
    <View>
      <View
        style={{ height }}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      >
        {width > 0 ? (
          <>
            {ticks.map((v) => (
              <View key={v}>
                <View
                  style={{
                    position: 'absolute',
                    left: padL,
                    width: plotW,
                    top: Y(v),
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: colors.border,
                  }}
                />
                <Text style={[s.tick, { top: Y(v) - 8, width: padL - 6 }]}>{Math.round(v)}</Text>
              </View>
            ))}

            {props.stretchKg !== null ? (
              <Segment
                x1={padL}
                y1={Y(props.stretchKg)}
                x2={padL + plotW}
                y2={Y(props.stretchKg)}
                color={STRETCH}
                thickness={1.5}
              />
            ) : null}
            <Segment
              x1={padL}
              y1={Y(props.goalKg)}
              x2={padL + plotW}
              y2={Y(props.goalKg)}
              color={colors.primary}
              thickness={1.5}
            />
            {props.plan ? (
              <Segment
                x1={X(props.plan.from.t)}
                y1={Y(props.plan.from.kg)}
                x2={X(props.plan.to.t)}
                y2={Y(props.plan.to.kg)}
                color={PLAN}
              />
            ) : null}

            {props.points.slice(1).map((p, i) => {
              const a = props.points[i];
              return (
                <Segment
                  key={`seg-${i}`}
                  x1={X(a.t)}
                  y1={Y(a.kg)}
                  x2={X(p.t)}
                  y2={Y(p.kg)}
                  color={LINE}
                  thickness={2.5}
                />
              );
            })}
            {showDots || props.points.length === 1
              ? props.points.map((p, i) => (
                  <View
                    key={`dot-${i}`}
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: X(p.t) - 4,
                      top: Y(p.kg) - 4,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: LINE,
                    }}
                  />
                ))
              : null}

            <Text style={[s.xLabel, { left: padL, top: height - 18 }]}>
              {formatShort(dateFromDayNumber(props.xMin))}
            </Text>
            <Text style={[s.xLabel, { right: padR, top: height - 18 }]}>
              {formatShort(dateFromDayNumber(props.xMax), true)}
            </Text>
          </>
        ) : null}
      </View>

      <View style={s.legend}>
        <Key color={LINE} label="Your weight" />
        {props.plan ? <Key color={PLAN} label="Plan" /> : null}
        <Key color={colors.primary} label={`Goal ${props.goalKg}`} />
        {props.stretchKg !== null ? <Key color={STRETCH} label={`Stretch ${props.stretchKg}`} /> : null}
      </View>
    </View>
  );
}

function Key(p: { color: string; label: string }) {
  return (
    <View style={s.key}>
      <View style={[s.swatch, { backgroundColor: p.color }]} />
      <Text style={s.keyText}>{p.label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  tick: { position: 'absolute', left: 0, textAlign: 'right', fontSize: 11, color: colors.muted },
  xLabel: { position: 'absolute', fontSize: 11, color: colors.muted },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
  key: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 14, height: 3, borderRadius: 2 },
  keyText: { fontSize: 12, color: colors.muted },
});
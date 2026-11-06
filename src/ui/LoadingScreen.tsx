import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { font } from './tokens';

const LIME = '#CDEB6B';
const SOFT = '#CFE3D8';

export function LoadingScreen() {
  const { width, height } = useWindowDimensions();
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [x]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-90, 200] });

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Defs>
          <RadialGradient
            id="bg"
            cx={width / 2}
            cy={height * 0.36}
            fx={width / 2}
            fy={height * 0.36}
            rx={height * 0.62}
            ry={height * 0.62}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#17694A" />
            <Stop offset="1" stopColor="#082A1F" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#bg)" />
      </Svg>

      <View style={s.center}>
        <Image source={require('../../assets/images/splash-icon.png')} style={s.tile} />
        <Text style={s.wordmark}>
          Steps<Text style={{ color: LIME }}>Kcal</Text>
        </Text>
        <Text style={s.tagline}>Eat smart. Walk it off.</Text>
        <View style={s.track}>
          <Animated.View style={[s.bar, { transform: [{ translateX }] }]} />
        </View>
      </View>

      <View style={s.footer}>
        <Text style={s.by}>developed by</Text>
        <Text style={s.name}>Ayoblvck</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#082A1F' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  tile: { width: 128, height: 128, marginBottom: 14 },
  wordmark: { fontFamily: font.extrabold, fontSize: 44, lineHeight: 52, color: '#FFFFFF', letterSpacing: -1 },
  tagline: { fontFamily: font.medium, fontSize: 17, color: SOFT },
  track: {
    width: 200,
    height: 6,
    borderRadius: 3,
    marginTop: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  bar: { width: 90, height: 6, borderRadius: 3, backgroundColor: LIME },
  footer: { alignItems: 'center', paddingBottom: 56, gap: 2 },
  by: { fontFamily: font.medium, fontSize: 14, color: SOFT },
  name: { fontFamily: font.extrabold, fontSize: 20, color: LIME },
});
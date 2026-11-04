import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, ChartLine, House, Plus, Sun, Target } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

function Ring(props: { size: number; stroke: number; progress: number; color: string }) {
  const r = (props.size - props.stroke) / 2;
  const c = 2 * Math.PI * r;
  const mid = props.size / 2;
  return (
    <Svg width={props.size} height={props.size}>
      <Circle cx={mid} cy={mid} r={r} stroke="rgba(255,255,255,0.14)" strokeWidth={props.stroke} fill="none" />
      <Circle
        cx={mid}
        cy={mid}
        r={r}
        stroke={props.color}
        strokeWidth={props.stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${c * props.progress} ${c}`}
        transform={`rotate(-90 ${mid} ${mid})`}
      />
    </Svg>
  );
}

function RingStat(props: { value: string; label: string; progress: number; color: string }) {
  return (
    <View style={{ width: 132, height: 132, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute' }}>
        <Ring size={132} stroke={13} progress={props.progress} color={props.color} />
      </View>
      <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 24, color: '#fff' }}>
        {props.value}
      </Text>
      <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, color: '#CFE3D8' }}>
        {props.label}
      </Text>
    </View>
  );
}

export default function DevR0() {
  const router = useRouter();
  return (
    <ScrollView style={{ backgroundColor: '#F6F5F0' }} contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 20 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: '#1B7F4B', fontSize: 16 }}>‹ Back</Text>
      </Pressable>

      <LinearGradient
        colors={['#17694A', '#0C3326']}
        style={{ borderRadius: 28, padding: 20, flexDirection: 'row', justifyContent: 'space-around' }}
      >
        <RingStat value="2,568" label="steps to go" progress={0.68} color="#CDEB6B" />
        <RingStat value="612" label="kcal left" progress={0.62} color="#F2A33A" />
      </LinearGradient>

      <View style={{ flexDirection: 'row', gap: 22 }}>
        {[House, Target, ChartLine, Bell, Sun, Plus].map((Icon, i) => (
          <Icon key={i} size={26} color={i % 2 ? '#1B7F4B' : '#5C6B63'} />
        ))}
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 18, color: '#10241C' }}>500 Medium: Eba (garri)</Text>
        <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 18, color: '#10241C' }}>600 SemiBold: Egusi soup</Text>
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: '#10241C' }}>700 Bold: 1,175 kcal</Text>
        <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 18, color: '#10241C' }}>800 ExtraBold: Today</Text>
      </View>
    </ScrollView>
  );
}
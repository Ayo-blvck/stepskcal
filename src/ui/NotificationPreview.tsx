import { Image, View } from 'react-native';
import { AppText } from './kit';
import { useTheme } from './ThemeProvider';

export function NotificationPreview(props: { time: string; title: string; body: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.mode === 'dark' ? '#1F362B' : '#10241C',
        borderRadius: 24,
        padding: 16,
        flexDirection: 'row',
        gap: 14,
      }}
    >
      <Image
        source={require('../../assets/images/splash-icon.png')}
        style={{ width: 40, height: 40, borderRadius: 11 }}
      />
      <View style={{ flex: 1, gap: 3 }}>
        <AppText variant="small" style={{ color: '#CFE3D8' }}>
          StepsKcal · {props.time}
        </AppText>
        <AppText variant="bodyStrong" style={{ color: '#FFFFFF' }}>
          {props.title}
        </AppText>
        <AppText style={{ color: '#EAF2ED' }}>{props.body}</AppText>
      </View>
    </View>
  );
}
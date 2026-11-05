import { useRouter } from 'expo-router';
import { Plus, Sun } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Field, Segmented } from '../ui/form';
import {
  AppText,
  Button,
  Card,
  Chip,
  HeroCard,
  IconButton,
  ListRow,
  ProgressBar,
  RingStat,
  Toggle,
} from '../ui/kit';
import { ThemeOverride, useTheme, useThemePreference, type ThemePreference } from '../ui/ThemeProvider';

function Specimen(props: { title: string }) {
  const t = useTheme();
  const [serving, setServing] = useState('1½');
  const [tone, setTone] = useState<'gentle' | 'banter' | 'roast'>('banter');
  const [on, setOn] = useState(true);
  const [text, setText] = useState('1.5');

  return (
    <View style={{ backgroundColor: t.bg, borderRadius: 24, padding: 16, gap: 14 }}>
      <AppText variant="small" tone="muted">
        {props.title}
      </AppText>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <AppText variant="small" tone="muted">
            Wednesday, 4 Nov
          </AppText>
          <AppText variant="title">Today</AppText>
        </View>
        <IconButton icon={Sun} label="Theme" onPress={() => undefined} />
      </View>

      <HeroCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <RingStat value="2,568" label="steps to go" sub="5,432 of 8,000" progress={0.68} color={t.lime} />
          <RingStat value="612" label="kcal left" sub="1,175 of 1,882" progress={0.62} color={t.amber} />
        </View>
        <View style={{ backgroundColor: t.heroPanel, borderRadius: 16, padding: 14, marginTop: 16 }}>
          <AppText tone="onHero">Within budget, so your target stays at 8,000 steps.</AppText>
        </View>
      </HeroCard>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Update steps" variant="secondary" onPress={() => undefined} style={{ flex: 1 }} />
        <Button title="Log activity" variant="secondary" onPress={() => undefined} style={{ flex: 1 }} />
      </View>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="h2">Goal: 80 kg</AppText>
          <AppText variant="small" tone="muted">
            184 days left
          </AppText>
        </View>
        <View style={{ marginVertical: 10 }}>
          <ProgressBar value={0.04} />
        </View>
        <AppText variant="small" tone="muted">
          95.0 kg now · 15.0 kg to go · right on plan
        </AppText>
      </Card>

      <Card>
        <AppText variant="h2">Eaten today</AppText>
        <ListRow title="Eba (garri)" right="570 kcal" />
        <ListRow title="Egusi soup" right="605 kcal" last />
      </Card>

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {['½', '1', '1½', '2', '3'].map((s) => (
          <Chip key={s} label={s} tone="green" selected={serving === s} onPress={() => setServing(s)} />
        ))}
      </View>
      <Segmented
        options={[
          { value: 'gentle', label: 'Gentle' },
          { value: 'banter', label: 'Banter' },
          { value: 'roast', label: 'Roast' },
        ]}
        value={tone}
        onChange={setTone}
      />

      <Field label="Or type a number" value={text} onChangeText={setText} keyboardType="decimal-pad" />
      <Field label="With an error" value="abc" onChangeText={() => undefined} error="Enter a number from 0.25 to 20" />

      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <AppText variant="h2">Morning check</AppText>
          <AppText variant="small" tone="muted">
            Reacts to yesterday
          </AppText>
        </View>
        <Toggle value={on} onValueChange={setOn} />
      </Card>

      <Button title="Add to today" icon={Plus} onPress={() => undefined} />
      <Button title="Quick add calories" variant="dashed" onPress={() => undefined} />
      <Button title="Cancel" variant="secondary" onPress={() => undefined} />
      <Button title="Delete entry" variant="danger" onPress={() => undefined} />
      <Button title="Skip for now" variant="ghost" onPress={() => undefined} />
    </View>
  );
}

export default function DevR1() {
  const router = useRouter();
  const { preference, setPreference } = useThemePreference();

  return (
    <ScrollView style={{ backgroundColor: '#888' }} contentContainerStyle={{ padding: 16, paddingTop: 56, gap: 16 }}>
      <Button title="‹ Back" variant="ghost" size="sm" onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
      <AppText variant="small" style={{ color: '#fff' }}>
        Saved theme preference (old screens are still light-only, so leave this on Light):
      </AppText>
      <Segmented<ThemePreference>
        options={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
        value={preference}
        onChange={setPreference}
      />
      <ThemeOverride mode="light">
        <Specimen title="LIGHT" />
      </ThemeOverride>
      <ThemeOverride mode="dark">
        <Specimen title="DARK" />
      </ThemeOverride>
    </ScrollView>
  );
}
import { Tabs } from 'expo-router';
import { TabBar } from '../../ui/TabBar';
import { useTheme } from '../../ui/ThemeProvider';

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: t.bg } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="foods" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="reminders" />
    </Tabs>
  );
}
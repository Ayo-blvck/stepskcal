const fs = require('fs');

const file = 'app.json';
const json = JSON.parse(fs.readFileSync(file, 'utf8'));
const e = json.expo;

e.name = 'StepsKcal';
e.slug = 'stepskcal';
e.scheme = 'stepskcal';
e.icon = './assets/images/icon.png';
e.userInterfaceStyle = 'automatic';
delete e.splash;

e.android = e.android || {};
e.android.package = 'com.ayoblvck.kcalsteps';
e.android.adaptiveIcon = {
  foregroundImage: './assets/images/adaptive-foreground.png',
  backgroundImage: './assets/images/adaptive-background.png',
  monochromeImage: './assets/images/adaptive-monochrome.png',
};

e.plugins = e.plugins || [];
function setPlugin(name, options) {
  const i = e.plugins.findIndex((p) => (Array.isArray(p) ? p[0] : p) === name);
  const entry = [name, options];
  if (i >= 0) e.plugins[i] = entry;
  else e.plugins.push(entry);
}
setPlugin('expo-splash-screen', {
  image: './assets/images/splash-icon.png',
  imageWidth: 200,
  resizeMode: 'contain',
  backgroundColor: '#0C3326',
});
setPlugin('expo-notifications', {
  icon: './assets/images/notification-icon.png',
  color: '#1B7F4B',
});

fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
console.log('app.json updated');
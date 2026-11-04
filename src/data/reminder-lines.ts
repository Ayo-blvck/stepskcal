export type Spice = 'gentle' | 'banter' | 'roast';

export type ReminderKind =
  | 'overBudget'
  | 'lowSteps'
  | 'onTrack'
  | 'lowIntake'
  | 'generic'
  | 'evening'
  | 'weighIn';

export interface KindLines {
  gentle: string[];
  banter: string[];
  roast: string[];
  near: string[]; // 3 kg or less to go
  goal: string[]; // goal reached / maintain mode
}

// Placeholders you can use: {kg} {over} {steps} {target} {eaten}
export const TITLES: Record<ReminderKind, string> = {
  overBudget: "Yesterday's numbers",
  lowSteps: "Yesterday's numbers",
  onTrack: "Yesterday's numbers",
  lowIntake: 'Quick note',
  generic: 'Good morning',
  evening: 'Evening check-in',
  weighIn: 'Weigh-in day',
};

export const LINES: Record<Exclude<ReminderKind, 'lowIntake'>, KindLines> & {
  lowIntake: string[];
} = {
  overBudget: {
    gentle: [
      'Yesterday ran {over} kcal over budget. It happens. Start today with a walk and carry on.',
      "You went {over} kcal over yesterday. No drama. Keep today on budget and you're fine.",
    ],
    banter: [
      "Hope you haven't eaten the whole house? Yesterday ran {over} kcal over. Shoes on, let's work it off.",
      '{over} kcal over yesterday. The kitchen won that round. Today we take it back.',
    ],
    roast: [
      '{over} kcal over yesterday. Your stomach has no loyalty and your sofa has no shame. Up, and walk.',
      'Soup, swallow and {over} kcal of confidence. Get up and walk it off, kitchen champion.',
    ],
    near: [
      "{over} kcal over yesterday, but you're only {kg} kg from your goal. One slip is nothing. Reset today.",
      "A small slip yesterday ({over} kcal over). You're {kg} kg away, so keep it tidy today.",
    ],
    goal: [
      'Yesterday ran {over} kcal over. At your goal weight a day like that is fine. Back to normal today.',
      '{over} kcal over yesterday. No stress, just get back to your usual routine today.',
    ],
  },
  lowSteps: {
    gentle: [
      'Yesterday: {steps} steps against a target of {target}. A longer walk today will fix that.',
      'Only {steps} steps logged yesterday. Try to reach {target} today.',
    ],
    banter: [
      '{steps} steps yesterday. Were you commuting between the bed and the fridge? Aim for {target} today.',
      'Your legs filed a complaint: {steps} steps yesterday. Give them some work today.',
    ],
    roast: [
      '{steps} steps yesterday. A snail with a mortgage moves more. Up, and go and walk.',
      "Yesterday's cardio was lifting the remote. {steps} steps. Do better today.",
    ],
    near: [
      "{steps} steps yesterday, and you're only {kg} kg from your goal. Make today's walk count.",
      'A quiet step day yesterday ({steps}). {kg} kg to go, so one good walk puts you back on track.',
    ],
    goal: [
      'Steps were low yesterday ({steps}). A decent walk today keeps you steady.',
      'Only {steps} steps logged yesterday. An easy walk today will do.',
    ],
  },
  onTrack: {
    gentle: [
      'Yesterday was on plan, on budget and on steps. Keep it going.',
      'Good day yesterday. Repeat it today.',
    ],
    banter: [
      'On budget, steps done. Who are you, and what did you do with the couch potato? Again today.',
      'Look at you, behaving. Do it again today.',
    ],
    roast: [
      "Fine, yesterday was clean. Don't get comfortable, the jollof is still watching. Go again.",
      'On budget and steps done. Suspicious. Keep it up.',
    ],
    near: [
      'On plan yesterday and only {kg} kg to go. Keep that energy.',
      'A clean day yesterday. {kg} kg left, so you are nearly there.',
    ],
    goal: ['Solid day yesterday. Steady wins in maintenance.', 'On plan yesterday. Same again today.'],
  },
  generic: {
    gentle: [
      'New day. Log your food, walk your target, and keep going.',
      'Good morning. Steps and meals are the two things to log today.',
    ],
    banter: [
      "Hope you haven't eaten the house yet? New day, {kg} kg to go.",
      'Good morning. {kg} kg to go and your shoes are waiting.',
    ],
    roast: [
      "Rise and shine, lazy bones. {kg} kg won't walk itself off.",
      'Your bed is not a fitness plan. Up, and walk.',
    ],
    near: [
      "Only {kg} kg to go. Make today's walk a good one.",
      'Morning. {kg} kg left, and the finish line is in sight.',
    ],
    goal: [
      'Maintenance mode: log your meals, hit your steps, enjoy the day.',
      'Good morning. A steady day ahead.',
    ],
  },
  evening: {
    gentle: [
      'Evening check-in: log your steps and anything you ate.',
      "Quick one: have you logged today's food and steps?",
    ],
    banter: [
      'Evening. Did you walk, or did the walking only happen in your head? Log your steps.',
      'Dinner don land? Log it, then log your steps.',
    ],
    roast: [
      "It's evening. Either you walked or you didn't. Log the steps, no excuses.",
      "Last call for steps and food before the day closes. Don't make me ask twice.",
    ],
    near: [
      "Almost there, {kg} kg to go. Log today's steps and meals.",
      "Evening check-in. Log it all, you're close.",
    ],
    goal: [
      'Evening check-in: log your steps and meals to stay steady.',
      "Quick one: log today's steps and food.",
    ],
  },
  weighIn: {
    gentle: ['Weigh-in day. Same scale, same time, log it.', 'Time for your weekly weigh-in.'],
    banter: [
      "Weigh-in day. The scale doesn't lie, but it does gossip. Step on and log it.",
      "Let's see what the week did. Weigh in and log it.",
    ],
    roast: [
      'Scale time. No excuses and no rearranging the bathroom mat. Step on and log it.',
      'Weigh-in day. Facts only. Step on and log it.',
    ],
    near: [
      "Weigh-in day. You're {kg} kg from your goal, so log it.",
      "Time to weigh in. You're so close.",
    ],
    goal: [
      "Weekly weigh-in: check that you're holding steady.",
      'Weigh-in day. Log it and see how steady you are.',
    ],
  },
  lowIntake: [
    "Yesterday's log shows only {eaten} kcal. If that's right, please eat properly today. Starving backfires. If you forgot to log, log it now.",
    'Only {eaten} kcal logged yesterday. Eat a proper meal today, and log everything so the numbers are honest.',
  ],
};
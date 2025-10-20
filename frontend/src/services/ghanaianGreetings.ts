/**
 * Ghanaian/Twi Greeting System
 * Provides culturally relevant greetings based on time of day and context
 */

export interface Greeting {
  twi: string;
  ahanta?: string;
  english: string;
  emoji: string;
}

export interface WelcomeMessage {
  greeting: Greeting;
  message: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

/**
 * Time-based Twi & Ahanta greetings with English translations
 */
const greetings = {
  morning: [
    { twi: 'Maakye', ahanta: 'Ɔkyre', english: 'Good morning', emoji: '🌅' },
    { twi: 'Mema wo akye', ahanta: 'Ndze wo akyer', english: 'I greet you this morning', emoji: '☀️' },
    { twi: 'Ɛte sɛn? Maakye', ahanta: 'Edziban? Ɔkyre', english: 'How is it? Good morning', emoji: '🌄' },
  ],
  afternoon: [
    { twi: 'Maaha', ahanta: 'Ndzeɛɛ', english: 'Good afternoon', emoji: '☀️' },
    { twi: 'Mema wo aha', ahanta: 'Ndze wo ndzɛ', english: 'I greet you this afternoon', emoji: '🌞' },
    { twi: 'Ɛte sɛn? Maaha', ahanta: 'Edziban? Ndzeɛɛ', english: 'How is it? Good afternoon', emoji: '☀️' },
  ],
  evening: [
    { twi: 'Maadwo', ahanta: 'Mɛndzidwo', english: 'Good evening', emoji: '🌆' },
    { twi: 'Mema wo adwo', ahanta: 'Ndze wo ndzidwo', english: 'I greet you this evening', emoji: '🌇' },
    { twi: 'Ɛte sɛn? Maadwo', ahanta: 'Edziban? Mɛndzidwo', english: 'How is it? Good evening', emoji: '🌃' },
  ],
  night: [
    { twi: 'Da yie', ahanta: 'Da ɔkɔlɔ', english: 'Good night / Sleep well', emoji: '🌙' },
    { twi: 'Me kra wo da yie', ahanta: 'Medze wo da ɔkɔlɔ', english: 'I wish you goodnight', emoji: '✨' },
    { twi: 'Ɔdɛɛfo da yie', ahanta: 'Ɔdɔfo da ɔkɔlɔ', english: 'Beloved one, sleep well', emoji: '🌟' },
  ],
};

/**
 * Welcome messages in Twi for different contexts
 */
const welcomeMessages = {
  general: [
    'Akwaaba! Yɛn ani agye sɛ woaba',  // Welcome! We are happy you came
    'Woaba nti yɛn ani agye',  // We are happy because you came
    'Yɛma wo akwaaba',  // We welcome you
    'Yɛn koma mu agye akwaaba',  // You are heartily welcomed
  ],
  returning: [
    'Yɛn ani agye sɛ woaba bio',  // We are happy you came again
    'Woasan aba, yɛda wo ase',  // You returned, we thank you
    'Akwaaba bio!',  // Welcome again!
    'Woaba bio! Yɛn ani agye',  // You came again! We are happy
  ],
  work: [
    'Ɛnnɛ nso, yɛnkɔ adwuma!',  // Today too, let's go to work!
    'Ɔbra pa!',  // Good work!
    'Mema wo adwuma pa ho ahoɔden',  // I give you strength for good work
    'Nyame nhyira wo adwuma',  // God bless your work
  ],
};

/**
 * Motivational phrases in Twi & Ahanta
 */
const motivationalPhrases = [
  { twi: 'Wobɛyɛ yie!', ahanta: 'Wo bɛyɛ kɔlɔ!', english: 'You will do well!' },
  { twi: 'Hwɛ wo ho yie', ahanta: 'Bisa wo naano kɔlɔ', english: 'Take care of yourself' },
  { twi: 'Nyame ne wo ho', ahanta: 'Nyamenle ne wo naano', english: 'God is with you' },
  { twi: 'Kɔ so!', ahanta: 'Koɔ ye!', english: 'Keep going!' },
  { twi: 'Di nkonim', ahanta: 'Bo kunyin', english: 'Be victorious' },
  { twi: 'Ɛbɛyɛ yie', ahanta: 'E bɛyɛ kɔlɔ', english: 'It will be well' },
  { twi: 'Gye wo ho di', ahanta: 'Dwene wo naano', english: 'Believe in yourself' },
  { twi: 'Nya anigye', ahanta: 'Nya asɛmbɔ', english: 'Have joy' },
];

/**
 * Role-specific greetings
 */
const roleGreetings: Record<string, string[]> = {
  manager: [
    'Wura, akwaaba!',  // Boss, welcome!
    'Sahene, yɛma wo akwaaba',  // Leader, we welcome you
    'Kannifo, da yie',  // Leader, good day
  ],
  ceo: [
    'Sahene, akwaaba!',  // Chief/Leader, welcome!
    'Wura kɛseɛ, yɛma wo akwaaba',  // Big boss, we welcome you
    'Otumfoɔ, da yie',  // Powerful one, good day
  ],
  shop_keeper: [
    'Dwamaofoɔ, akwaaba!',  // Trader/Seller, welcome!
    'Aguadifoɔ, da yie',  // Businessperson, good day
    'Adwumayɛfoɔ pa, akwaaba',  // Good worker, welcome
  ],
  repairer: [
    'Adwumayɛfoɔ, akwaaba!',  // Worker, welcome!
    'Nsamannefoɔ, da yie',  // Repairer/Fixer, good day
    'Nyansafoɔ, yɛma wo akwaaba',  // Skilled one, we welcome you
  ],
  admin: [
    'Ɔhwɛfoɔ, akwaaba!',  // Overseer, welcome!
    'Ɔkannifoɔ, da yie',  // Administrator, good day
    'Systemni ɔhwɛfoɔ, akwaaba',  // System overseer, welcome
  ],
  super_admin: [
    'Ɔkannifoɔ kɛseɛ, akwaaba!',  // Chief administrator, welcome!
    'Systemni wura, da yie',  // System boss, good day
    'Otumfoɔ, yɛma wo akwaaba',  // Powerful one, we welcome you
  ],
};

/**
 * Get the current time of day
 */
export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Get a random item from an array
 */
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get a time-appropriate greeting
 */
export function getTimeBasedGreeting(): Greeting {
  const timeOfDay = getTimeOfDay();
  return getRandomItem(greetings[timeOfDay]);
}

/**
 * Get a role-specific greeting in Twi
 */
export function getRoleGreeting(role: string): string {
  const roleKey = role.toLowerCase();
  if (roleGreetings[roleKey]) {
    return getRandomItem(roleGreetings[roleKey]);
  }
  return 'Akwaaba!';  // Default welcome
}

/**
 * Get a general welcome message in Twi
 */
export function getWelcomeMessage(context: 'general' | 'returning' | 'work' = 'general'): string {
  return getRandomItem(welcomeMessages[context]);
}

/**
 * Get a motivational phrase
 */
export function getMotivationalPhrase(): { twi: string; english: string } {
  return getRandomItem(motivationalPhrases);
}

/**
 * Generate a complete welcome message for dashboard
 */
export function generateDashboardWelcome(userName: string, userRole: string, isReturningUser: boolean = true): WelcomeMessage {
  const timeOfDay = getTimeOfDay();
  const greeting = getTimeBasedGreeting();
  
  let welcomeContext: 'general' | 'returning' | 'work' = isReturningUser ? 'returning' : 'general';
  
  // Add work context during business hours
  if (timeOfDay === 'morning' || timeOfDay === 'afternoon') {
    welcomeContext = 'work';
  }
  
  const roleGreeting = getRoleGreeting(userRole);
  const welcomeMsg = getWelcomeMessage(welcomeContext);
  const motivation = getMotivationalPhrase();
  
  // Construct personalized message
  const message = `${roleGreeting} ${userName}! ${welcomeMsg}. ${motivation.twi}`;
  
  return {
    greeting,
    message,
    timeOfDay,
    motivation,
    day_motivation: getDayMotivation(),
    business_phrase: getBusinessPhrase(userRole), // Pass role for dynamic tips
  };
}

/**
 * Generate a login success message
 */
export function generateLoginSuccessMessage(userName: string, userRole: string): {
  title: string;
  subtitle: string;
  emoji: string;
} {
  const greeting = getTimeBasedGreeting();
  const roleGreeting = getRoleGreeting(userRole);
  const welcomeMsg = getWelcomeMessage('general');
  
  return {
    title: `${greeting.twi}, ${userName}!`,
    subtitle: `${welcomeMsg} (${greeting.english})`,
    emoji: greeting.emoji,
  };
}

/**
 * Get day-specific motivational message
 */
export function getDayMotivation(): { twi: string; english: string } {
  const dayOfWeek = new Date().getDay();
  
  const dayMessages: Record<number, { twi: string; english: string }> = {
    0: { twi: 'Kwasida pa!', english: 'Happy Sunday!' },
    1: { twi: 'Dwowda pa! Yɛnfiri aseɛ yie', english: 'Happy Monday! Let\'s start well' },
    2: { twi: 'Benada pa! Kɔ so yɛ adwuma', english: 'Happy Tuesday! Keep working' },
    3: { twi: 'Wukuda pa! Yɛn adwuma rekɔ so yie', english: 'Happy Wednesday! Our work is going well' },
    4: { twi: 'Yawda pa! Yɛrebɛn nnaawɔtwe awieeɛ', english: 'Happy Thursday! We\'re nearing the weekend' },
    5: { twi: 'Fida pa! Nnaawɔtwe yi aba nʼawieeɛ', english: 'Happy Friday! The week has come to an end' },
    6: { twi: 'Memeneda pa! Nya ahomegyeɛ', english: 'Happy Saturday! Enjoy your rest' },
  };
  
  return dayMessages[dayOfWeek] || { twi: 'Da pa!', english: 'Good day!' };
}

/**
 * Store last login date to track returning users
 */
export function markUserLogin(userId: string | number): void {
  const key = `last_login_${userId}`;
  localStorage.setItem(key, new Date().toISOString());
}

/**
 * Check if user is a returning user (logged in before today)
 */
export function isReturningUser(userId: string | number): boolean {
  const key = `last_login_${userId}`;
  const lastLogin = localStorage.getItem(key);
  
  if (!lastLogin) return false;
  
  const lastLoginDate = new Date(lastLogin);
  const today = new Date();
  
  // Check if last login was on a different day
  return lastLoginDate.toDateString() !== today.toDateString();
}

/**
 * Role-based business tips (dynamic based on user privilege)
 */
const roleBasedTips = {
  shop_keeper: {
    morning: [
      { twi: 'Kyerɛ wo customers adwuma pa', english: 'Show your customers good service today' },
      { twi: 'Twerɛ wo aguade nyinaa', english: 'Record all your sales properly' },
      { twi: 'Hwɛ wo stock na sua nea aka', english: 'Check your stock and know what remains' },
    ],
    afternoon: [
      { twi: 'Kɔ so kyerɛ customers saa adwuma', english: 'Continue showing customers great service' },
      { twi: 'Monhwɛ aguade a woayɛ ɛnnɛ', english: 'Review the sales you\'ve made today' },
      { twi: 'Twerɛ resale biara a ɛwɔ hɔ', english: 'Record any resales available' },
    ],
    evening: [
      { twi: 'Kan wo aguade a woayɛ ɛnnɛ', english: 'Count the sales you made today' },
      { twi: 'Yɛ balance na sua nea woanya', english: 'Do your balance and know your profit' },
      { twi: 'Siesie shop na kɔ fie', english: 'Organize the shop and go home' },
    ],
    night: [
      { twi: 'Da yie, ɔkyena yɛbɛtɔn pii', english: 'Sleep well, tomorrow we\'ll sell more' },
      { twi: 'Menya nhyɛso ɛnnɛ ho', english: 'Plan for tomorrow' },
    ],
  },
  manager: {
    morning: [
      { twi: 'Hwɛ wo adwumayɛfoɔ sɛ wɔreyɛ adwuma', english: 'Monitor your staff to ensure they\'re working' },
      { twi: 'Hwɛ reports nyinaa ɛnnɛ', english: 'Check all reports today' },
      { twi: 'Yɛ nkontoaho a ɛho hia', english: 'Make necessary calculations' },
    ],
    afternoon: [
      { twi: 'Sua sɛnea aguade rekɔ so', english: 'Monitor how business is progressing' },
      { twi: 'Boa wo staff sɛ wohia', english: 'Help your staff if needed' },
      { twi: 'Check stock levels pɛpɛɛpɛ', english: 'Check stock levels carefully' },
    ],
    evening: [
      { twi: 'Review ɛnnɛ wiase', english: 'Review today\'s business' },
      { twi: 'Sua wo profit margins', english: 'Know your profit margins' },
      { twi: 'Plan ɔkyena adwuma', english: 'Plan tomorrow\'s work' },
    ],
    night: [
      { twi: 'Hwɛ final reports na kɔ fie', english: 'Check final reports and go home' },
    ],
  },
  ceo: {
    morning: [
      { twi: 'Hwɛ wo business statistics', english: 'Check your business statistics' },
      { twi: 'Sua profit trends ɛnnɛ', english: 'Know profit trends today' },
      { twi: 'Monitor all departments', english: 'Monitor all departments' },
    ],
    afternoon: [
      { twi: 'Review aguade nyinaa', english: 'Review all business operations' },
      { twi: 'Sua sika a ɛwɔ system mu', english: 'Know money in the system' },
    ],
    evening: [
      { twi: 'Check daily performance', english: 'Check daily performance' },
      { twi: 'Sua nea ɛkɔ yie ne nea ɛnyɛ yie', english: 'Know what went well and what didn\'t' },
    ],
    night: [
      { twi: 'Plan business strategies', english: 'Plan business strategies' },
    ],
  },
  repairer: {
    morning: [
      { twi: 'Hwɛ repairs a aka', english: 'Check pending repairs' },
      { twi: 'Yɛ repairs pɛpɛɛpɛ', english: 'Do repairs carefully' },
      { twi: 'Kyerɛ customers sɛ repairs bɛba', english: 'Inform customers when repairs will be ready' },
    ],
    afternoon: [
      { twi: 'Kɔ so yɛ repairs', english: 'Continue doing repairs' },
      { twi: 'Twerɛ parts a wode di dwuma', english: 'Record parts you use' },
    ],
    evening: [
      { twi: 'Kan repairs a woayɛ ɛnnɛ', english: 'Count repairs you completed today' },
      { twi: 'Frɛ customers ma wɔnbɛgye', english: 'Call customers to come collect' },
    ],
    night: [
      { twi: 'Plan ɔkyena repairs', english: 'Plan tomorrow\'s repairs' },
    ],
  },
  admin: {
    morning: [
      { twi: 'Hwɛ system status', english: 'Check system status' },
      { twi: 'Monitor all users', english: 'Monitor all users' },
    ],
    afternoon: [
      { twi: 'Sua sɛnea system rekɔ so', english: 'Know how system is performing' },
    ],
    evening: [
      { twi: 'Check activity logs', english: 'Check activity logs' },
    ],
    night: [
      { twi: 'System maintenance bɛyɛ', english: 'Do system maintenance' },
    ],
  },
  super_admin: {
    morning: [
      { twi: 'Monitor platform nyinaa', english: 'Monitor entire platform' },
    ],
    afternoon: [
      { twi: 'Sua all companies performance', english: 'Know all companies performance' },
    ],
    evening: [
      { twi: 'Review platform analytics', english: 'Review platform analytics' },
    ],
    night: [
      { twi: 'Plan platform updates', english: 'Plan platform updates' },
    ],
  },
};

/**
 * Get dynamic business phrase based on role and time
 */
export function getBusinessPhrase(userRole?: string): { twi: string; english: string } {
  const timeOfDay = getTimeOfDay();
  
  // Get role-specific tips if role is provided
  if (userRole) {
    const roleKey = userRole.toLowerCase() as keyof typeof roleBasedTips;
    if (roleBasedTips[roleKey] && roleBasedTips[roleKey][timeOfDay]) {
      return getRandomItem(roleBasedTips[roleKey][timeOfDay]);
    }
  }
  
  // Fallback to general phrases if role not found
  const generalPhrases = {
    morning: [
      { twi: 'Ɛnnɛ bɛyɛ da pa!', english: 'Today will be a good day!' },
      { twi: 'Yɛn aguade bɛkɔ yie ɛnnɛ', english: 'Our business will go well today' },
    ],
    afternoon: [
      { twi: 'Yɛn adwuma rekɔ so yie', english: 'Our work is going well' },
      { twi: 'Yɛnkɔ so', english: 'Let\'s continue' },
    ],
    evening: [
      { twi: 'Yɛayɛ adwuma pa ɛnnɛ', english: 'We\'ve done good work today' },
      { twi: 'Yɛda Nyame ase', english: 'We thank God' },
    ],
    night: [
      { twi: 'Yɛn wiase yɛ', english: 'We are done' },
      { twi: 'Kɔ fie na kɔhome', english: 'Go home and rest' },
    ],
  };
  
  return getRandomItem(generalPhrases[timeOfDay]);
}


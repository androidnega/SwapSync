/**
 * Ghanaian/Twi Greeting System
 * Provides culturally relevant greetings based on time of day and context
 */

export interface Greeting {
  twi: string;
  english: string;
  emoji: string;
}

export interface WelcomeMessage {
  greeting: Greeting;
  message: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

/**
 * Time-based Twi greetings with English translations
 */
const greetings = {
  morning: [
    { twi: 'Maakye', english: 'Good morning', emoji: '🌅' },
    { twi: 'Mema wo akye', english: 'I greet you this morning', emoji: '☀️' },
    { twi: 'Ɛte sɛn? Maakye', english: 'How is it? Good morning', emoji: '🌄' },
  ],
  afternoon: [
    { twi: 'Maaha', english: 'Good afternoon', emoji: '☀️' },
    { twi: 'Mema wo aha', english: 'I greet you this afternoon', emoji: '🌞' },
    { twi: 'Ɛte sɛn? Maaha', english: 'How is it? Good afternoon', emoji: '☀️' },
  ],
  evening: [
    { twi: 'Maadwo', english: 'Good evening', emoji: '🌆' },
    { twi: 'Mema wo adwo', english: 'I greet you this evening', emoji: '🌇' },
    { twi: 'Ɛte sɛn? Maadwo', english: 'How is it? Good evening', emoji: '🌃' },
  ],
  night: [
    { twi: 'Da yie', english: 'Good night / Sleep well', emoji: '🌙' },
    { twi: 'Me kra wo da yie', english: 'I wish you goodnight', emoji: '✨' },
    { twi: 'Ɔdɛɛfo da yie', english: 'Beloved one, sleep well', emoji: '🌟' },
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
 * Motivational phrases in Twi
 */
const motivationalPhrases = [
  { twi: 'Wobɛyɛ yie!', english: 'You will do well!' },
  { twi: 'Hwɛ wo ho yie', english: 'Take care of yourself' },
  { twi: 'Nyame ne wo ho', english: 'God is with you' },
  { twi: 'Kɔ so!', english: 'Keep going!' },
  { twi: 'Di nkonim', english: 'Be victorious' },
  { twi: 'Ɛbɛyɛ yie', english: 'It will be well' },
  { twi: 'Gye wo ho di', english: 'Believe in yourself' },
  { twi: 'Nya anigye', english: 'Have joy' },
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
 * Ghanaian business phrases for different times
 */
export function getBusinessPhrase(): { twi: string; english: string } {
  const timeOfDay = getTimeOfDay();
  
  const phrases = {
    morning: [
      { twi: 'Ɛnnɛ bɛyɛ da pa!', english: 'Today will be a good day!' },
      { twi: 'Yɛn aguade bɛkɔ yie ɛnnɛ', english: 'Our business will go well today' },
      { twi: 'Yɛnfiri aseɛ nkonimdie mu', english: 'Let\'s start in victory' },
    ],
    afternoon: [
      { twi: 'Yɛn adwuma rekɔ so yie', english: 'Our work is going well' },
      { twi: 'Yɛnkɔ so', english: 'Let\'s continue' },
      { twi: 'Awia yi yɛ yi bɛkɔ yie', english: 'This afternoon will go well' },
    ],
    evening: [
      { twi: 'Yɛayɛ adwuma pa ɛnnɛ', english: 'We\'ve done good work today' },
      { twi: 'Yɛda Nyame ase', english: 'We thank God' },
      { twi: 'Ɛnnɛ kɔɔ yie', english: 'Today went well' },
    ],
    night: [
      { twi: 'Yɛn wiase yɛ', english: 'We are done' },
      { twi: 'Ɛnnɛ adwuma aba nʼawieeɛ', english: 'Today\'s work has ended' },
      { twi: 'Kɔ fie na kɔhome', english: 'Go home and rest' },
    ],
  };
  
  return getRandomItem(phrases[timeOfDay]);
}


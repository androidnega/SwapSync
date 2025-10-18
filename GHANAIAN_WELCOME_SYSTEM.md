# Ghanaian/Twi Welcome System 🇬🇭

A culturally relevant greeting and welcome system for SwapSync that provides warm, contextual greetings in Twi (Ghanaian language) for all users.

## Overview

This system enhances user experience by welcoming users with authentic Ghanaian/Twi greetings that change based on:
- **Time of day** (Morning, Afternoon, Evening, Night)
- **User role** (Manager, Shop Keeper, Repairer, Admin, etc.)
- **Context** (Login, Dashboard visit, Returning user)
- **Day of week** (Special motivations for each day)

## Features

### 1. **Time-Based Greetings** ⏰
The system provides appropriate Twi greetings based on the current time:

- **Morning (5 AM - 12 PM)**: 
  - "Maakye" (Good morning)
  - "Mema wo akye" (I greet you this morning)
  - "Ɛte sɛn? Maakye" (How is it? Good morning)

- **Afternoon (12 PM - 5 PM)**:
  - "Maaha" (Good afternoon)
  - "Mema wo aha" (I greet you this afternoon)
  - "Ɛte sɛn? Maaha" (How is it? Good afternoon)

- **Evening (5 PM - 9 PM)**:
  - "Maadwo" (Good evening)
  - "Mema wo adwo" (I greet you this evening)
  - "Ɛte sɛn? Maadwo" (How is it? Good evening)

- **Night (9 PM - 5 AM)**:
  - "Da yie" (Good night / Sleep well)
  - "Me kra wo da yie" (I wish you goodnight)
  - "Ɔdɛɛfo da yie" (Beloved one, sleep well)

### 2. **Role-Specific Greetings** 👥
Each user role receives appropriate Twi greetings:

- **Manager/CEO**: "Sahene, akwaaba!" (Chief/Leader, welcome!)
- **Shop Keeper**: "Dwamaofoɔ, akwaaba!" (Trader, welcome!)
- **Repairer**: "Adwumayɛfoɔ, akwaaba!" (Worker, welcome!)
- **Admin**: "Ɔhwɛfoɔ, akwaaba!" (Overseer, welcome!)

### 3. **Motivational Phrases** 💪
Random Twi motivational phrases to encourage users:

- "Wobɛyɛ yie!" (You will do well!)
- "Nyame ne wo ho" (God is with you)
- "Kɔ so!" (Keep going!)
- "Di nkonim" (Be victorious)
- "Ɛbɛyɛ yie" (It will be well)
- "Gye wo ho di" (Believe in yourself)

### 4. **Business Phrases** 💼
Context-aware business phrases that change throughout the day:

- Morning: "Ɛnnɛ bɛyɛ da pa!" (Today will be a good day!)
- Afternoon: "Yɛn adwuma rekɔ so yie" (Our work is going well)
- Evening: "Yɛayɛ adwuma pa ɛnnɛ" (We've done good work today)

### 5. **Day-Specific Greetings** 📅
Special greetings for each day of the week:

- Monday: "Dwowda pa! Yɛnfiri aseɛ yie" (Happy Monday! Let's start well)
- Friday: "Fida pa! Nnaawɔtwe yi aba nʼawieeɛ" (Happy Friday! The week has ended)
- Saturday: "Memeneda pa! Nya ahomegyeɛ" (Happy Saturday! Enjoy your rest)

## Components

### 1. **WelcomeBanner Component**
Located: `frontend/src/components/WelcomeBanner.tsx`

A beautiful, animated banner that displays on the dashboard with:
- Time-appropriate gradient colors
- Animated emoji
- Twi greeting with English translation
- Day motivation
- Business phrase
- Role indicator for admins

**Props:**
```typescript
interface WelcomeBannerProps {
  userName: string;        // User's full name
  userRole: string;        // User's role (manager, shop_keeper, etc.)
  userId: string | number; // User's unique ID
  compact?: boolean;       // Optional compact mode
}
```

**Usage:**
```tsx
<WelcomeBanner 
  userName="Kwame Mensah"
  userRole="shop_keeper"
  userId={123}
/>
```

### 2. **WelcomeToast Component**
Located: `frontend/src/components/WelcomeToast.tsx`

A notification toast that appears on successful login:
- Animated slide-in from right
- Automatic dismissal after duration
- Progress bar showing remaining time
- Twi greeting with translation

**Props:**
```typescript
interface WelcomeToastProps {
  userName: string;      // User's name
  userRole: string;      // User's role
  onClose: () => void;   // Callback when closed
  duration?: number;     // Display duration in ms (default: 5000)
}
```

### 3. **Greeting Service**
Located: `frontend/src/services/ghanaianGreetings.ts`

Core service providing all greeting functionality:

**Key Functions:**

```typescript
// Get time of day
getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night'

// Get time-based greeting
getTimeBasedGreeting(): Greeting

// Get role-specific greeting
getRoleGreeting(role: string): string

// Get welcome message
getWelcomeMessage(context: 'general' | 'returning' | 'work'): string

// Get motivational phrase
getMotivationalPhrase(): { twi: string; english: string }

// Generate complete dashboard welcome
generateDashboardWelcome(userName: string, userRole: string, isReturningUser: boolean): WelcomeMessage

// Generate login success message
generateLoginSuccessMessage(userName: string, userRole: string): {
  title: string;
  subtitle: string;
  emoji: string;
}

// Get day motivation
getDayMotivation(): { twi: string; english: string }

// Get business phrase
getBusinessPhrase(): { twi: string; english: string }

// Mark user login (tracking)
markUserLogin(userId: string | number): void

// Check if returning user
isReturningUser(userId: string | number): boolean
```

## Integration

### Dashboard Integration
The welcome banner is integrated into `RoleDashboard.tsx`:

```tsx
import WelcomeBanner from '../components/WelcomeBanner';

// In component:
{currentUser && (
  <WelcomeBanner 
    userName={currentUser.full_name || currentUser.username}
    userRole={currentUser.role}
    userId={currentUser.id}
  />
)}
```

### Login Integration
The welcome toast is shown on successful login in `Login.tsx`:

```tsx
import WelcomeToast from '../components/WelcomeToast';

// After successful login:
setLoggedInUser(response.user);
setShowWelcomeToast(true);

// In JSX:
{showWelcomeToast && loggedInUser && (
  <WelcomeToast
    userName={loggedInUser.full_name || loggedInUser.username}
    userRole={loggedInUser.role}
    onClose={() => setShowWelcomeToast(false)}
    duration={1500}
  />
)}
```

## User Tracking

The system tracks user logins to determine if they're returning users:
- Uses localStorage to store last login timestamp
- Compares dates to show appropriate welcome messages
- First-time users see "general" welcome
- Returning users see "returning" or "work" context messages

## Styling & Animations

### Color Gradients by Time
- **Morning**: Orange/Yellow (sunrise colors)
- **Afternoon**: Blue/Cyan/Teal (bright sky)
- **Evening**: Purple/Pink/Rose (sunset)
- **Night**: Indigo/Purple/Blue (night sky)

### Animations
- **Bounce**: Emoji animation on welcome banner
- **Fade-in**: Smooth opacity transition on mount
- **Slide-in**: Toast slides from right side
- **Progress bar**: Visual countdown on toast

## Twi Language Reference

Common Twi words and phrases used:

| Twi | English | Context |
|-----|---------|---------|
| Akwaaba | Welcome | General greeting |
| Maakye | Good morning | Morning greeting |
| Maaha | Good afternoon | Afternoon greeting |
| Maadwo | Good evening | Evening greeting |
| Da yie | Good night/Sleep well | Night greeting |
| Ɛte sɛn? | How is it? | Informal "how are you?" |
| Sahene | Chief/Leader | Respectful title |
| Dwamaofoɔ | Trader/Seller | Shop keeper title |
| Adwumayɛfoɔ | Worker | General worker |
| Nyame | God | Religious reference |
| Yɛn ani agye | We are happy | Expression of joy |
| Wobɛyɛ yie | You will do well | Encouragement |
| Kɔ so | Keep going | Motivation |

## Customization

### Adding New Greetings

To add new greetings, edit `frontend/src/services/ghanaianGreetings.ts`:

```typescript
// Add to morning greetings
const greetings = {
  morning: [
    { twi: 'Your new greeting', english: 'Translation', emoji: '🌅' },
    // ... existing greetings
  ],
  // ...
};
```

### Adding New Roles

```typescript
const roleGreetings: Record<string, string[]> = {
  your_new_role: [
    'Twi greeting for this role',
    'Another greeting variant',
  ],
  // ... existing roles
};
```

### Adding New Motivational Phrases

```typescript
const motivationalPhrases = [
  { twi: 'Your Twi phrase', english: 'English translation' },
  // ... existing phrases
];
```

## Browser Compatibility

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile responsive
- ✅ Works offline (uses localStorage)
- ✅ No external API dependencies

## Performance

- **Lightweight**: All logic runs client-side
- **Fast**: Instant greeting generation
- **No API calls**: Reduces server load
- **Cached**: User tracking uses localStorage

## Future Enhancements

Potential improvements:

1. **Language Selection**: Allow users to choose between Twi, English, or other Ghanaian languages (Ga, Ewe, etc.)
2. **Voice Greetings**: Add audio pronunciation of Twi phrases
3. **Cultural Events**: Special greetings for Ghanaian holidays and festivals
4. **Personalization**: Let users customize greeting preferences
5. **Analytics**: Track which greetings users engage with most
6. **Regional Variations**: Support for different Twi dialects (Asante, Akuapem)

## Cultural Notes

This system respects Ghanaian culture by:
- Using authentic Twi language
- Recognizing the importance of greetings in Ghanaian culture
- Incorporating respect titles based on roles
- Including religious references (God/Nyame) common in Ghana
- Acknowledging the business mindset of Ghanaian entrepreneurs

## Testing

To test the system:

1. **Time-based greetings**: Change your system time to see different greetings
2. **Role greetings**: Login with different user roles
3. **Returning user**: Clear localStorage and login again to test first-time vs returning
4. **Responsive design**: Test on mobile, tablet, and desktop

## Support

For issues or suggestions related to the Ghanaian Welcome System:
- Check the code in `frontend/src/services/ghanaianGreetings.ts`
- Review component implementations
- Test with different user roles and times

## Credits

Developed as part of SwapSync v1.0.0 to bring cultural authenticity and warmth to the Ghanaian phone repair and swap business management system.

---

**Medaase!** (Thank you!) 🇬🇭


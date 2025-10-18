# Greetings API Documentation

Comprehensive API documentation for the Ghanaian/Twi Greeting System endpoints.

## Base URL

```
/api/greetings
```

All endpoints are prefixed with `/api/greetings`.

---

## Endpoints

### 1. Get Current User Greeting
Get a personalized greeting for the currently authenticated user.

**Endpoint:** `GET /api/greetings/current`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "success": true,
  "data": {
    "greeting": {
      "twi": "Maakye",
      "english": "Good morning",
      "emoji": "🌅"
    },
    "message": "Dwamaofoɔ, akwaaba! Kwame Mensah! Akwaaba! Yɛn ani agye sɛ woaba. Wobɛyɛ yie!",
    "time_of_day": "morning",
    "motivation": {
      "twi": "Wobɛyɛ yie!",
      "english": "You will do well!"
    },
    "day_motivation": {
      "twi": "Dwowda pa! Yɛnfiri aseɛ yie",
      "english": "Happy Monday! Let's start well"
    },
    "business_phrase": {
      "twi": "Ɛnnɛ bɛyɛ da pa!",
      "english": "Today will be a good day!"
    }
  },
  "user": {
    "name": "Kwame Mensah",
    "role": "shop_keeper"
  }
}
```

---

### 2. Get Login Success Message
Get a welcome message for successful login.

**Endpoint:** `GET /api/greetings/login-message`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Maakye, Kwame Mensah!",
    "subtitle": "Akwaaba! Yɛn ani agye sɛ woaba (Welcome! We are happy you came)",
    "emoji": "🌅"
  }
}
```

---

### 3. Get Time-Based Greeting
Get a greeting for a specific time of day.

**Endpoint:** `GET /api/greetings/time-based`

**Authentication:** Not Required

**Query Parameters:**
- `time_of_day` (optional): `morning`, `afternoon`, `evening`, or `night`

**Example Request:**
```
GET /api/greetings/time-based?time_of_day=evening
```

**Response:**
```json
{
  "success": true,
  "data": {
    "greeting": {
      "twi": "Maadwo",
      "english": "Good evening",
      "emoji": "🌆"
    },
    "current_time_of_day": "afternoon",
    "requested_time": "evening"
  }
}
```

---

### 4. Get Motivational Phrase
Get a random motivational phrase in Twi.

**Endpoint:** `GET /api/greetings/motivational`

**Authentication:** Not Required

**Response:**
```json
{
  "success": true,
  "data": {
    "twi": "Kɔ so!",
    "english": "Keep going!"
  }
}
```

---

### 5. Get Day Motivation
Get motivation for the current day of the week.

**Endpoint:** `GET /api/greetings/day-motivation`

**Authentication:** Not Required

**Response:**
```json
{
  "success": true,
  "data": {
    "twi": "Fida pa! Nnaawɔtwe yi aba nʼawieeɛ",
    "english": "Happy Friday! The week has come to an end"
  }
}
```

---

### 6. Get Business Phrase
Get a business-related phrase for the time of day.

**Endpoint:** `GET /api/greetings/business-phrase`

**Authentication:** Not Required

**Query Parameters:**
- `time_of_day` (optional): `morning`, `afternoon`, `evening`, or `night`

**Example Request:**
```
GET /api/greetings/business-phrase?time_of_day=morning
```

**Response:**
```json
{
  "success": true,
  "data": {
    "twi": "Ɛnnɛ bɛyɛ da pa!",
    "english": "Today will be a good day!"
  }
}
```

---

### 7. Get Role Greeting
Get a greeting for a specific role.

**Endpoint:** `GET /api/greetings/role-greeting`

**Authentication:** Required (Bearer Token)

**Query Parameters:**
- `role` (required): `manager`, `ceo`, `shop_keeper`, `repairer`, `admin`, or `super_admin`

**Example Request:**
```
GET /api/greetings/role-greeting?role=manager
```

**Response:**
```json
{
  "success": true,
  "data": {
    "greeting": "Sahene, yɛma wo akwaaba",
    "role": "manager"
  }
}
```

---

### 8. Get All Greetings
Get all available greetings (for documentation/testing).

**Endpoint:** `GET /api/greetings/all`

**Authentication:** Not Required

**Response:**
```json
{
  "success": true,
  "data": {
    "time_based_greetings": {
      "morning": [
        {
          "twi": "Maakye",
          "english": "Good morning",
          "emoji": "🌅"
        },
        ...
      ],
      "afternoon": [...],
      "evening": [...],
      "night": [...]
    },
    "roles": [
      "manager",
      "ceo",
      "shop_keeper",
      "repairer",
      "admin",
      "super_admin"
    ],
    "contexts": ["general", "returning", "work"],
    "times": ["morning", "afternoon", "evening", "night"]
  }
}
```

---

### 9. Get SMS Format Greeting
Get a greeting formatted for SMS (short and concise).

**Endpoint:** `GET /api/greetings/sms-format`

**Authentication:** Required (Bearer Token)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Maakye Kwame! Dwamaofoɔ, akwaaba!",
    "length": 32,
    "user": "Kwame Mensah"
  }
}
```

**Use Case:** Use this endpoint to generate greetings for SMS notifications to customers.

---

### 10. Get Personalized Greeting
Get a personalized greeting for any name and role (open endpoint).

**Endpoint:** `GET /api/greetings/personalized`

**Authentication:** Not Required

**Query Parameters:**
- `name` (required): User's name
- `role` (required): User's role
- `context` (optional): `general`, `returning`, or `work` (default: `general`)

**Example Request:**
```
GET /api/greetings/personalized?name=Ama&role=shop_keeper&context=returning
```

**Response:**
```json
{
  "success": true,
  "data": {
    "greeting": {
      "twi": "Maaha",
      "english": "Good afternoon",
      "emoji": "☀️"
    },
    "message": "Dwamaofoɔ, akwaaba! Ama! Yɛn ani agye sɛ woaba bio. Nyame ne wo ho",
    "time_of_day": "afternoon",
    "motivation": {
      "twi": "Nyame ne wo ho",
      "english": "God is with you"
    },
    "day_motivation": {
      "twi": "Benada pa! Kɔ so yɛ adwuma",
      "english": "Happy Tuesday! Keep working"
    },
    "business_phrase": {
      "twi": "Yɛn adwuma rekɔ so yie",
      "english": "Our work is going well"
    }
  }
}
```

---

## Error Responses

### Invalid Time of Day
```json
{
  "success": false,
  "error": "Invalid time_of_day. Must be: morning, afternoon, evening, or night"
}
```

### Invalid Context
```json
{
  "success": false,
  "error": "Invalid context. Must be: general, returning, or work"
}
```

### Unauthorized (401)
```json
{
  "detail": "Not authenticated"
}
```

---

## Testing the API

### Using cURL

**Get current user greeting:**
```bash
curl -X GET "http://localhost:8000/api/greetings/current" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get time-based greeting:**
```bash
curl -X GET "http://localhost:8000/api/greetings/time-based?time_of_day=morning"
```

**Get personalized greeting:**
```bash
curl -X GET "http://localhost:8000/api/greetings/personalized?name=Kwame&role=manager&context=work"
```

---

### Using JavaScript (Frontend)

```javascript
import axios from 'axios';
import { API_URL } from './api';
import { getToken } from './authService';

// Get current user greeting
const getCurrentGreeting = async () => {
  const response = await axios.get(`${API_URL}/greetings/current`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return response.data;
};

// Get time-based greeting (no auth required)
const getTimeGreeting = async (timeOfDay = null) => {
  const params = timeOfDay ? `?time_of_day=${timeOfDay}` : '';
  const response = await axios.get(`${API_URL}/greetings/time-based${params}`);
  return response.data;
};

// Get personalized greeting
const getPersonalizedGreeting = async (name, role, context = 'general') => {
  const response = await axios.get(
    `${API_URL}/greetings/personalized?name=${name}&role=${role}&context=${context}`
  );
  return response.data;
};
```

---

### Using Python

```python
import requests

API_URL = "http://localhost:8000/api"

# Get current user greeting (with authentication)
def get_current_greeting(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/greetings/current", headers=headers)
    return response.json()

# Get time-based greeting (no auth)
def get_time_greeting(time_of_day=None):
    params = {"time_of_day": time_of_day} if time_of_day else {}
    response = requests.get(f"{API_URL}/greetings/time-based", params=params)
    return response.json()

# Get all greetings
def get_all_greetings():
    response = requests.get(f"{API_URL}/greetings/all")
    return response.json()
```

---

## Integration Examples

### SMS Notification Integration

```python
from app.core.ghanaian_greetings import GhanaianGreetingService

# In your SMS service
def send_welcome_sms(user_phone: str, user_name: str, user_role: str):
    greeting_service = GhanaianGreetingService()
    sms_message = greeting_service.generate_sms_greeting(user_name, user_role)
    
    # Add your business message
    full_message = f"{sms_message} Your repair is ready for pickup. SwapSync"
    
    # Send SMS
    send_sms(user_phone, full_message)
```

### Dashboard Welcome Integration

```typescript
// In your React dashboard component
useEffect(() => {
  const fetchWelcome = async () => {
    const response = await axios.get(`${API_URL}/greetings/current`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    
    setWelcomeData(response.data.data);
  };
  
  fetchWelcome();
}, []);
```

### Email Templates

```python
from app.core.ghanaian_greetings import GhanaianGreetingService

def generate_email_greeting(user_name: str, user_role: str) -> str:
    service = GhanaianGreetingService()
    welcome = service.generate_dashboard_welcome(user_name, user_role)
    
    return f"""
    <h1>{welcome['greeting']['twi']} {user_name}!</h1>
    <p>{welcome['greeting']['english']}</p>
    <p>{welcome['day_motivation']['twi']} - {welcome['day_motivation']['english']}</p>
    """
```

---

## Time Categories

| Time Range | Category | Typical Greetings |
|------------|----------|-------------------|
| 5 AM - 12 PM | morning | Maakye, Mema wo akye |
| 12 PM - 5 PM | afternoon | Maaha, Mema wo aha |
| 5 PM - 9 PM | evening | Maadwo, Mema wo adwo |
| 9 PM - 5 AM | night | Da yie, Me kra wo da yie |

---

## Role Categories

| Role | Twi Title | English Meaning |
|------|-----------|----------------|
| manager | Sahene | Chief/Leader |
| ceo | Wura kɛseɛ | Big Boss |
| shop_keeper | Dwamaofoɔ | Trader/Seller |
| repairer | Nsamannefoɔ | Fixer/Repairer |
| admin | Ɔhwɛfoɔ | Overseer |
| super_admin | Ɔkannifoɔ kɛseɛ | Chief Administrator |

---

## Best Practices

1. **Cache Greetings**: Cache greetings for a few minutes to reduce API calls
2. **Fallback**: Always have a fallback English greeting in case of API failure
3. **SMS Length**: Use `/sms-format` endpoint for SMS to ensure proper length
4. **Personalization**: Use the `/current` endpoint for logged-in users for best personalization
5. **Testing**: Use `/all` endpoint to explore available greetings during development

---

## Rate Limiting

Currently, there's no rate limiting on greeting endpoints. They're lightweight and designed for frequent use.

---

## Future Enhancements

- [ ] Add more Ghanaian languages (Ga, Ewe, Hausa)
- [ ] Add audio pronunciation endpoints
- [ ] Add cultural event-specific greetings
- [ ] Add greeting analytics
- [ ] Add user preference storage
- [ ] Add regional dialect variations

---

## Support

For issues or suggestions:
- Check `/api/docs` for interactive API documentation
- Test endpoints using `/api/greetings/all` 
- Review the source code in `backend/app/core/ghanaian_greetings.py`

---

**Medaase!** (Thank you!) 🇬🇭


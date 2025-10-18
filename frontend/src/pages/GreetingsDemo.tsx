import React, { useState, useEffect } from 'react';
import {
  getTimeOfDay,
  getTimeBasedGreeting,
  getRoleGreeting,
  getWelcomeMessage,
  getMotivationalPhrase,
  generateDashboardWelcome,
  getDayMotivation,
  getBusinessPhrase,
} from '../services/ghanaianGreetings';
import WelcomeBanner from '../components/WelcomeBanner';

/**
 * Demo page to showcase and test the Ghanaian/Twi greeting system
 * This page is for development/testing purposes
 */
const GreetingsDemo: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('shop_keeper');
  const [selectedTime, setSelectedTime] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [userName, setUserName] = useState('Kwame Mensah');
  const [refreshKey, setRefreshKey] = useState(0);

  const roles = [
    { value: 'shop_keeper', label: 'Shop Keeper' },
    { value: 'manager', label: 'Manager' },
    { value: 'ceo', label: 'CEO' },
    { value: 'repairer', label: 'Repairer' },
    { value: 'admin', label: 'Admin' },
    { value: 'super_admin', label: 'Super Admin' },
  ];

  const times = [
    { value: 'morning', label: 'Morning (5 AM - 12 PM)', emoji: '🌅' },
    { value: 'afternoon', label: 'Afternoon (12 PM - 5 PM)', emoji: '☀️' },
    { value: 'evening', label: 'Evening (5 PM - 9 PM)', emoji: '🌆' },
    { value: 'night', label: 'Night (9 PM - 5 AM)', emoji: '🌙' },
  ];

  // Get current actual time
  const actualTimeOfDay = getTimeOfDay();
  const currentGreeting = getTimeBasedGreeting();
  const roleGreeting = getRoleGreeting(selectedRole);
  const welcomeMsg = getWelcomeMessage('general');
  const motivation = getMotivationalPhrase();
  const dayMotivation = getDayMotivation();
  const businessPhrase = getBusinessPhrase();

  const refresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🇬🇭 Ghanaian/Twi Greeting System Demo
          </h1>
          <p className="text-gray-600">
            Test and preview the culturally relevant greeting system
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter name"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time of Day (Simulated)
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {times.map(time => (
                  <option key={time.value} value={time.value}>
                    {time.emoji} {time.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={refresh}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              🔄 Refresh Random Greetings
            </button>
            <div className="flex-1" />
            <div className="text-sm text-gray-600">
              Actual Time: <span className="font-semibold">{actualTimeOfDay}</span> ({new Date().toLocaleTimeString()})
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Live Preview</h2>
          <WelcomeBanner
            key={refreshKey}
            userName={userName}
            userRole={selectedRole}
            userId={1}
          />
        </div>

        {/* Greeting Components */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Time Greeting */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Current Time Greeting
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{currentGreeting.emoji}</span>
                <div>
                  <p className="text-xl font-bold text-gray-900">{currentGreeting.twi}</p>
                  <p className="text-sm text-gray-600 italic">{currentGreeting.english}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Role Greeting */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Role-Specific Greeting
            </h3>
            <div className="space-y-2">
              <p className="text-xl font-bold text-blue-600">{roleGreeting}</p>
              <p className="text-sm text-gray-600">
                For role: <span className="font-semibold">{selectedRole}</span>
              </p>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Welcome Message
            </h3>
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">{welcomeMsg}</p>
              <p className="text-sm text-gray-600">
                Context: General welcome
              </p>
            </div>
          </div>

          {/* Motivational Phrase */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Motivational Phrase
            </h3>
            <div className="space-y-2">
              <p className="text-lg font-bold text-green-600">{motivation.twi}</p>
              <p className="text-sm text-gray-600 italic">{motivation.english}</p>
            </div>
          </div>

          {/* Day Motivation */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Day-Specific Motivation
            </h3>
            <div className="space-y-2">
              <p className="text-lg font-bold text-purple-600">{dayMotivation.twi}</p>
              <p className="text-sm text-gray-600 italic">{dayMotivation.english}</p>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
            </div>
          </div>

          {/* Business Phrase */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Business Phrase
            </h3>
            <div className="space-y-2">
              <p className="text-lg font-bold text-orange-600">{businessPhrase.twi}</p>
              <p className="text-sm text-gray-600 italic">{businessPhrase.english}</p>
              <p className="text-xs text-gray-500">
                Time-based: {actualTimeOfDay}
              </p>
            </div>
          </div>
        </div>

        {/* All Greetings Reference */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Time-Based Greetings Reference
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {times.map(time => (
              <div key={time.value} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="text-2xl">{time.emoji}</span>
                  {time.label.split('(')[0].trim()}
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="text-xs text-gray-500">{time.label.split('(')[1]?.replace(')', '')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Twi Language Quick Reference */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg shadow-sm p-6 border border-amber-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🇬🇭 Twi Language Quick Reference
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-bold text-amber-700">Akwaaba</span>
              <span className="text-gray-600"> - Welcome</span>
            </div>
            <div>
              <span className="font-bold text-amber-700">Maakye</span>
              <span className="text-gray-600"> - Good morning</span>
            </div>
            <div>
              <span className="font-bold text-amber-700">Maaha</span>
              <span className="text-gray-600"> - Good afternoon</span>
            </div>
            <div>
              <span className="font-bold text-amber-700">Maadwo</span>
              <span className="text-gray-600"> - Good evening</span>
            </div>
            <div>
              <span className="font-bold text-amber-700">Da yie</span>
              <span className="text-gray-600"> - Good night</span>
            </div>
            <div>
              <span className="font-bold text-amber-700">Ɛte sɛn?</span>
              <span className="text-gray-600"> - How is it?</span>
            </div>
            <div>
              <span className="font-bold text-amber-700">Sahene</span>
              <span className="text-gray-600"> - Chief/Leader</span>
            </div>
            <div>
              <span className="font-bold text-amber-700">Nyame</span>
              <span className="text-gray-600"> - God</span>
            </div>
            <div>
              <span className="font-bold text-amber-700">Medaase</span>
              <span className="text-gray-600"> - Thank you</span>
            </div>
            <div>
              <span className="font-bold text-amber-700">Yɛn ani agye</span>
              <span className="text-gray-600"> - We are happy</span>
            </div>
            <div>
              <span className="font-bold text-amber-700">Wobɛyɛ yie</span>
              <span className="text-gray-600"> - You will do well</span>
            </div>
            <div>
              <span className="font-bold text-amber-700">Kɔ so</span>
              <span className="text-gray-600"> - Keep going</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This demo page is for testing purposes. The greetings shown are randomly selected 
            from a pool of authentic Twi phrases. Each refresh will show different variations. The actual system 
            uses the current system time to determine appropriate greetings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GreetingsDemo;


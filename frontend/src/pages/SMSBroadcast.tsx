import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Breadcrumb from '../components/Breadcrumb';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSms, 
  faUsers, 
  faPaperPlane, 
  faCheckCircle,
  faExclamationTriangle,
  faCalendar,
  faGift
} from '@fortawesome/free-solid-svg-icons';

interface Recipient {
  id: number;
  username: string;
  full_name: string;
  company_name: string;
  phone_number: string;
  role: string;
  is_manager: boolean;
  use_company_sms_branding: boolean;
}

const SMSBroadcast: React.FC = () => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('SwapSync');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'manager' | 'staff'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    try {
      const response = await api.get('/sms-broadcast/recipients');
      setRecipients(response.data.recipients || []);
    } catch (error: any) {
      setStatusMessage(`❌ Failed to load recipients: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleSelectAll = () => {
    if (selectedRecipients.length === filteredRecipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(filteredRecipients.map(r => r.id));
    }
  };

  const handleSelectRecipient = (id: number) => {
    if (selectedRecipients.includes(id)) {
      setSelectedRecipients(selectedRecipients.filter(r => r !== id));
    } else {
      setSelectedRecipients([...selectedRecipients, id]);
    }
  };

  const handleSelectAllManagers = () => {
    const managerIds = recipients.filter(r => r.is_manager).map(r => r.id);
    setSelectedRecipients(managerIds);
  };

  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRecipients.length === 0) {
      setStatusMessage('❌ Please select at least one recipient');
      return;
    }
    
    if (!message.trim()) {
      setStatusMessage('❌ Please enter a message');
      return;
    }
    
    if (!confirm(`Send SMS to ${selectedRecipients.length} recipient(s)?\n\nSender: ${senderName}\nMessage: ${message.substring(0, 50)}...`)) {
      return;
    }
    
    setLoading(true);
    setStatusMessage('');

    try {
      const response = await api.post('/sms-broadcast/send', {
        recipient_ids: selectedRecipients,
        message: message,
        sender_name: senderName
      });
      
      const result = response.data;
      setStatusMessage(`✅ SMS sent to ${result.successful}/${result.total_recipients} recipients successfully!`);
      
      // Clear form
      setMessage('');
      setSelectedRecipients([]);
      
      setTimeout(() => setStatusMessage(''), 5000);
    } catch (error: any) {
      setStatusMessage(`❌ Failed to send SMS: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMonthlyWishes = async () => {
    if (!confirm('Send New Month wishes to all managers?\n\nThis will send a greeting message to all active managers.')) {
      return;
    }
    
    setLoading(true);
    setStatusMessage('');

    try {
      const response = await api.post('/sms-broadcast/monthly-wishes');
      setStatusMessage(`✅ ${response.data.message} (${response.data.sent} sent)`);
      setTimeout(() => setStatusMessage(''), 5000);
    } catch (error: any) {
      setStatusMessage(`❌ Failed to send monthly wishes: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipients = recipients.filter(recipient => {
    const matchesSearch = searchTerm === '' || 
      recipient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.phone_number.includes(searchTerm);
    
    const matchesRole = filterRole === 'all' ||
      (filterRole === 'manager' && recipient.is_manager) ||
      (filterRole === 'staff' && !recipient.is_manager);
    
    return matchesSearch && matchesRole;
  });

  const characterCount = message.length;
  const smsCount = Math.ceil(characterCount / 160);

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb customItems={[{ label: 'Dashboard', path: '/' }, { label: 'SMS Broadcast' }]} />
      
      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FontAwesomeIcon icon={faSms} className="text-blue-600" />
            SMS Broadcasting
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Send personalized messages to managers and staff
          </p>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-lg border ${
            statusMessage.includes('✅') 
              ? 'bg-green-50 text-green-800 border-green-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <FontAwesomeIcon 
              icon={statusMessage.includes('✅') ? faCheckCircle : faExclamationTriangle} 
              className="mr-2"
            />
            {statusMessage}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleSendMonthlyWishes}
            disabled={loading}
            className="p-6 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faCalendar} className="text-3xl mb-2" />
            <h3 className="text-lg font-bold">Send Monthly Wishes</h3>
            <p className="text-sm opacity-90">Send new month greeting to all managers</p>
          </button>
          
          <div className="p-6 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg shadow-lg">
            <FontAwesomeIcon icon={faGift} className="text-3xl mb-2" />
            <h3 className="text-lg font-bold">Auto Holiday Wishes</h3>
            <p className="text-sm opacity-90">Automatic on Ghana public holidays at 8 AM</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recipients Panel */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} />
                Recipients ({selectedRecipients.length})
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Search */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search recipients..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
              
              {/* Filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Users</option>
                <option value="manager">Managers Only</option>
                <option value="staff">Staff Only</option>
              </select>
              
              {/* Quick Select */}
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm font-medium"
                >
                  {selectedRecipients.length === filteredRecipients.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleSelectAllManagers}
                  className="flex-1 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-sm font-medium"
                >
                  All Managers
                </button>
              </div>
              
              {/* Recipients List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredRecipients.map(recipient => (
                  <label
                    key={recipient.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecipients.includes(recipient.id)}
                      onChange={() => handleSelectRecipient(recipient.id)}
                      className="mt-1 w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">
                        {recipient.full_name}
                      </div>
                      {recipient.company_name && (
                        <div className="text-xs text-purple-600 font-medium">
                          {recipient.company_name}
                        </div>
                      )}
                      <div className="text-xs text-gray-600 truncate">
                        {recipient.phone_number}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          recipient.is_manager 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {recipient.role.toUpperCase()}
                        </span>
                        {recipient.use_company_sms_branding && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            📱 Custom
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
                
                {filteredRecipients.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No recipients found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Message Composer */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Compose Message</h3>
            </div>
            
            <form onSubmit={handleSendSMS} className="p-6 space-y-6">
              {/* Sender Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sender Name
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="SwapSync"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  System messages always use "SwapSync" (default)
                </p>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>{characterCount} characters ({smsCount} SMS)</span>
                  <span className={characterCount > 160 ? 'text-orange-600 font-medium' : ''}>
                    {160 - (characterCount % 160)} chars to next SMS
                  </span>
                </div>
              </div>

              {/* Message Preview */}
              {message && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Preview:</h4>
                  <div className="bg-white border border-gray-300 rounded-lg p-3 text-sm whitespace-pre-wrap">
                    {message}
                  </div>
                </div>
              )}

              {/* Selected Recipients Summary */}
              {selectedRecipients.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    Will send to {selectedRecipients.length} recipient(s):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {recipients
                      .filter(r => selectedRecipients.includes(r.id))
                      .map(r => (
                        <span key={r.id} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {r.full_name}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Send Button */}
              <button
                type="submit"
                disabled={loading || selectedRecipients.length === 0 || !message.trim()}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faPaperPlane} />
                {loading ? 'Sending...' : `Send SMS to ${selectedRecipients.length} Recipient(s)`}
              </button>
            </form>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            SMS Branding Rules:
          </h4>
          <ul className="text-sm text-yellow-800 space-y-1 ml-6 list-disc">
            <li>System messages (like this broadcast) always use &quot;SwapSync&quot; branding</li>
            <li>Transaction SMS (swaps, sales, repairs) use company name if branding is enabled</li>
            <li>Enable company branding in Staff Management &gt; All Companies tab</li>
            <li>Monthly wishes and holiday greetings automatically sent by system</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SMSBroadcast;


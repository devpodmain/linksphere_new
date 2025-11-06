import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../../services/api';
import { 
  HelpCircle, 
  MessageCircle, 
  Send, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
}

interface SupportTicket {
  id: number;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TicketForm {
  subject: string;
  message: string;
}

const Support: React.FC = () => {
  const [faq, setFaq] = useState<FAQ[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'tickets'>('faq');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TicketForm>();

  useEffect(() => {
    fetchFAQ();
    fetchTickets();
  }, []);

  const fetchFAQ = async () => {
    try {
      const response = await api.get('/support/faq');
      if (response.data.success) {
        setFaq(response.data.faq);
      }
    } catch (error) {
      console.error('Failed to fetch FAQ:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await api.get('/support/tickets');
      if (response.data.success) {
        setTickets(response.data.tickets);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TicketForm) => {
    setSubmitting(true);
    try {
      const response = await api.post('/support/ticket', data);
      if (response.data.success) {
        alert('Support ticket created successfully!');
        reset();
        fetchTickets();
        setActiveTab('tickets');
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
      alert('Failed to create support ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-blue-600 bg-blue-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'resolved':
        return 'text-green-600 bg-green-100';
      case 'closed':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading support...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Support Center</h1>
        <p className="text-secondary-600">
          Get help with your Linksphere account and profile
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('faq')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'faq'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            <HelpCircle className="h-4 w-4 inline mr-2" />
            FAQ
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'contact'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            <MessageCircle className="h-4 w-4 inline mr-2" />
            Contact Us
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tickets'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            <MessageCircle className="h-4 w-4 inline mr-2" />
            My Tickets
          </button>
        </nav>
      </div>

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-secondary-900 mb-6">Frequently Asked Questions</h2>
          {faq.map((item, index) => (
            <div key={index} className="card">
              <h3 className="text-lg font-medium text-secondary-900 mb-3">{item.question}</h3>
              <p className="text-secondary-600">{item.answer}</p>
            </div>
          ))}
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <div className="card">
          <h2 className="text-2xl font-semibold text-secondary-900 mb-6">Contact Support</h2>
          <p className="text-secondary-600 mb-6">
            Can't find what you're looking for? Send us a message and we'll get back to you as soon as possible.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-secondary-700 mb-2">
                Subject *
              </label>
              <input
                {...register('subject', { required: 'Subject is required' })}
                type="text"
                id="subject"
                className={`input-field ${errors.subject ? 'border-red-300' : ''}`}
                placeholder="Brief description of your issue"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-secondary-700 mb-2">
                Message *
              </label>
              <textarea
                {...register('message', { required: 'Message is required' })}
                id="message"
                rows={6}
                className={`input-field ${errors.message ? 'border-red-300' : ''}`}
                placeholder="Please provide as much detail as possible about your issue..."
              />
              {errors.message && (
                <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-6">My Support Tickets</h2>
          
          {tickets.length === 0 ? (
            <div className="card text-center py-12">
              <MessageCircle className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">No tickets yet</h3>
              <p className="text-secondary-600 mb-4">
                You haven't submitted any support tickets yet.
              </p>
              <button
                onClick={() => setActiveTab('contact')}
                className="btn-primary"
              >
                Create a Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-secondary-900 mb-2">
                        {ticket.subject}
                      </h3>
                      <p className="text-sm text-secondary-600">
                        Created: {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Support;



// app/help/page.tsx - Help & Support Center

'use client';

import { useState } from 'react';
import { 
  Search, Book, MessageCircle, Mail, Phone, 
  ChevronDown, ChevronRight, Send, ExternalLink 
} from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    category: 'Getting Started',
    question: 'How do I create my first project?',
    answer: 'Navigate to the Projects page and click the "New Project" button. Fill in the project details including title, description, and budget, then click "Create Project".',
  },
  {
    category: 'Getting Started',
    question: 'How do I invite team members?',
    answer: 'Go to your project settings, navigate to the Team tab, and click "Invite Member". Enter their email address and select their role.',
  },
  {
    category: 'Account',
    question: 'How do I change my password?',
    answer: 'Go to Settings > Account, scroll to the "Change Password" section, enter your current password and new password, then click "Save Changes".',
  },
  {
    category: 'Account',
    question: 'Can I delete my account?',
    answer: 'Yes, go to Settings > Privacy and scroll to the "Danger Zone" section. Click "Delete My Account" and confirm your decision. This action cannot be undone.',
  },
  {
    category: 'Billing',
    question: 'How do I upgrade my plan?',
    answer: 'Visit the Billing & Plans page, review the available plans, and click "Upgrade" on the plan you want. Follow the payment process to complete your upgrade.',
  },
  {
    category: 'Billing',
    question: 'Can I get a refund?',
    answer: 'We offer a 30-day money-back guarantee. Contact our support team within 30 days of your purchase to request a refund.',
  },
  {
    category: 'Features',
    question: 'How do I export my data?',
    answer: 'Go to Settings > Privacy and click "Download My Data". We\'ll prepare an export of all your data and email you a download link.',
  },
  {
    category: 'Features',
    question: 'What file formats are supported?',
    answer: 'We support PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, and MP4 files up to 50MB per file.',
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('sending');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setSubmitStatus('success');
      setContactForm({ name: '', email: '', subject: '', message: '' });
      
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      setSubmitStatus('error');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">How can we help you?</h1>
        <p className="text-gray-600 mb-8">Search our knowledge base or contact support</p>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help articles..."
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <Book className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Documentation</h3>
          <p className="text-sm text-gray-600 mb-4">
            Comprehensive guides and tutorials
          </p>
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1">
            Browse Docs <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <MessageCircle className="w-8 h-8 text-green-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Community</h3>
          <p className="text-sm text-gray-600 mb-4">
            Connect with other users
          </p>
          <a href="#" className="text-green-600 hover:text-green-700 font-medium text-sm inline-flex items-center gap-1">
            Join Community <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <Mail className="w-8 h-8 text-purple-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Contact Support</h3>
          <p className="text-sm text-gray-600 mb-4">
            Get help from our team
          </p>
          <a href="#contact" className="text-purple-600 hover:text-purple-700 font-medium text-sm inline-flex items-center gap-1">
            Contact Us <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* FAQs by Category */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        
        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{category}</h3>
            <div className="space-y-3">
              {filteredFaqs
                .filter((faq) => faq.category === category)
                .map((faq, index) => {
                  const globalIndex = faqs.indexOf(faq);
                  return (
                    <div
                      key={globalIndex}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === globalIndex ? null : globalIndex)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{faq.question}</span>
                        {expandedFaq === globalIndex ? (
                          <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        )}
                      </button>
                      {expandedFaq === globalIndex && (
                        <div className="px-4 pb-4 pt-0">
                          <p className="text-gray-600">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-600">No results found for "{searchQuery}"</p>
            <p className="text-sm text-gray-500 mt-2">Try different keywords or contact support</p>
          </div>
        )}
      </div>

      {/* Contact Form */}
      <div id="contact" className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Still need help?</h2>
            <p className="text-gray-600">Send us a message and we'll get back to you within 24 hours</p>
          </div>

          <form onSubmit={handleContactSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                required
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                required
                rows={6}
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {submitStatus === 'success' && (
              <div className="bg-green-50 text-green-800 p-4 rounded-lg">
                Message sent successfully! We'll get back to you soon.
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="bg-red-50 text-red-800 p-4 rounded-lg">
                Failed to send message. Please try again.
              </div>
            )}

            <button
              type="submit"
              disabled={submitStatus === 'sending'}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitStatus === 'sending' ? 'Sending...' : 'Send Message'}
            </button>
          </form>

          {/* Contact Info */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
              <div>
                <Mail className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Email Support</p>
                <p className="text-sm text-gray-600">support@example.com</p>
              </div>
              <div>
                <Phone className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Phone Support</p>
                <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
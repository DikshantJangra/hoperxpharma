'use client';

import { useState, useEffect } from 'react';
import { FiMail, FiSend, FiCheckCircle, FiAlertCircle, FiSettings, FiFileText, FiInbox, FiEdit3, FiClock, FiRefreshCw, FiPlus, FiStar, FiTrash2, FiChevronDown, FiChevronUp, FiExternalLink, FiPaperclip, FiFile, FiUsers, FiX } from 'react-icons/fi';
import { SiGmail } from 'react-icons/si';
import EmptyState from '@/components/messages/email/EmptyState';
import EmailConfigModal from '@/components/messages/email/EmailConfigModal';
import DeleteConfirmModal from '@/components/messages/email/DeleteConfirmModal';
import RecipientSelector from '@/components/messages/email/RecipientSelector';
import QuickGroupSelector from '@/components/messages/email/QuickGroupSelector';
import AttachmentUploader from '@/components/messages/email/AttachmentUploader';
import EmailShimmer, { LogsShimmer } from '@/components/messages/email/EmailShimmer';
import { getProviderWebmailLink, getProviderInfo } from '@/utils/emailProviderLinks';

// Helper to get headers for requests (credentials: include handles auth)
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
});

type EmailSection = 'compose' | 'sent' | 'templates' | 'settings';

export default function EmailPage() {
  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<EmailSection>('compose');

  // Composer state
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [toRecipients, setToRecipients] = useState<any[]>([]);
  const [ccRecipients, setCcRecipients] = useState<any[]>([]);
  const [bccRecipients, setBccRecipients] = useState<any[]>([]);
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Email logs state
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPagination, setLogsPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [logsSearch, setLogsSearch] = useState('');

  useEffect(() => {
    // Small delay to ensure auth is ready
    const timer = setTimeout(() => {
      fetchEmailAccounts();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const fetchEmailAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/email/accounts', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const accounts = data.data?.accounts || [];
        setEmailAccounts(accounts);

        // Set primary account as default for composer
        const primaryAccount = accounts.find((acc: any) => acc.isPrimary);
        if (primaryAccount) {
          setSelectedAccountId(primaryAccount.id);
        }
      } else if (response.status === 401) {
        // Auth not ready yet, silently fail
        console.debug('Email accounts: Auth not ready');
      }
    } catch (error: any) {
      // Silently handle errors - email is optional feature
      if (error?.status !== 401) {
        console.error('Failed to fetch email accounts:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    try {
      const response = await fetch(`/api/v1/email/accounts/${accountId}/primary`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        await fetchEmailAccounts();
      }
    } catch (error) {
      console.error('Failed to set primary account:', error);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    const account = emailAccounts.find(acc => acc.id === accountId);
    if (!account) return;

    setAccountToDelete(account);
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;

    try {
      const response = await fetch(`/api/v1/email/accounts/${accountToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setAccountToDelete(null);
        await fetchEmailAccounts();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete account');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to delete account');
    }
  };

  const fetchEmailLogs = async (page = logsPagination.page, search = logsSearch) => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: logsPagination.limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/v1/email/logs?${params}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setEmailLogs(data.data?.logs || []);
        setLogsPagination({
          page: data.data?.page || 1,
          limit: logsPagination.limit,
          total: data.data?.total || 0,
          totalPages: data.data?.totalPages || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch email logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);
    setIsSending(true);

    try {
      const response = await fetch('/api/v1/email/send', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          to: toRecipients[0]?.email || '', // Primary recipient
          cc: ccRecipients.map(r => r.email),
          bcc: bccRecipients.map(r => r.email),
          subject,
          bodyHtml: `<html><body style="font-family: Arial, sans-serif; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</body></html>`,
          accountId: selectedAccountId || undefined,
          attachments: attachments.map(att => ({ filename: att.filename, path: att.path, contentType: att.mimeType })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send email');
      }

      setSendSuccess(true);

      // Delete uploaded temp files
      for (const att of attachments) {
        try {
          await fetch(`/api/v1/email/attachments/${att.filename}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            credentials: 'include',
          });
        } catch (err) {
          console.error('Failed to delete temp file:', err);
        }
      }

      // Clear form
      setToRecipients([]);
      setCcRecipients([]);
      setBccRecipients([]);
      setSubject('');
      setBody('');
      setAttachments([]);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error: any) {
      setSendError(error.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (emailAccounts.length > 0 && activeSection === 'sent') {
      fetchEmailLogs();
    }
  }, [emailAccounts, activeSection]);


  if (isLoading) {
    return <EmailShimmer />;
  }

  if (emailAccounts.length === 0) {
    // When no accounts: show config modal OR empty state, not both
    if (showConfigModal) {
      return (
        <div className="h-full flex flex-col bg-white">
          <EmailConfigModal
            isOpen={showConfigModal}
            onClose={() => setShowConfigModal(false)}
            onSuccess={fetchEmailAccounts}
          />
        </div>
      );
    }
    return <EmptyState onConfigure={() => setShowConfigModal(true)} />;
  }

  const primaryAccount = emailAccounts.find(acc => acc.isPrimary) || emailAccounts[0];

  return (
    <div className="h-screen flex bg-[#f8fafc]">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-[#e2e8f0] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-lg flex items-center justify-center">
              <FiMail className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-[#0f172a]">Email</h2>
              <p className="text-xs text-[#64748b] truncate">{primaryAccount.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <NavItem
              icon={<FiEdit3 className="w-4 h-4" />}
              label="Compose"
              active={activeSection === 'compose'}
              onClick={() => setActiveSection('compose')}
            />
            <NavItem
              icon={<FiInbox className="w-4 h-4" />}
              label="Sent"
              active={activeSection === 'sent'}
              onClick={() => setActiveSection('sent')}
              badge={emailLogs.length > 0 ? emailLogs.length : undefined}
            />
            <NavItem
              icon={<FiFileText className="w-4 h-4" />}
              label="Templates"
              active={activeSection === 'templates'}
              onClick={() => setActiveSection('templates')}
              badge="Soon"
              disabled
            />
            <div className="my-4 border-t border-[#e2e8f0]" />
            <NavItem
              icon={<FiSettings className="w-4 h-4" />}
              label="Settings"
              active={activeSection === 'settings'}
              onClick={() => setActiveSection('settings')}
              badge={emailAccounts.length}
            />
          </div>
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-[#e2e8f0]">
          <div className="flex items-center gap-2 text-xs text-[#64748b]">
            <div className="w-2 h-2 bg-[#10b981] rounded-full"></div>
            <span>{emailAccounts.length} account{emailAccounts.length !== 1 ? 's' : ''} connected</span>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1 flex items-center gap-1">
            <span>via</span>
            <span className="font-medium text-[#4285f4]">Gmail OAuth</span>
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {showConfigModal ? (
          /* Email Config Panel - replaces content when open */
          <EmailConfigModal
            isOpen={showConfigModal}
            onClose={() => setShowConfigModal(false)}
            onSuccess={fetchEmailAccounts}
          />
        ) : (
          <>
            {/* Section Header */}
            <div className="bg-white border-b border-[#e2e8f0] px-8 py-4">
              <h1 className="text-2xl font-bold text-[#0f172a]">
                {activeSection === 'compose' && 'Compose Email'}
                {activeSection === 'sent' && 'Sent Emails'}
                {activeSection === 'settings' && 'Email Settings'}
              </h1>
              <p className="text-sm text-[#64748b] mt-1">
                {activeSection === 'compose' && 'Send emails from your configured accounts'}
                {activeSection === 'sent' && 'View all sent emails and their status'}
                {activeSection === 'templates' && 'Manage your email templates'}
                {activeSection === 'settings' && `Manage your ${emailAccounts.length} email account${emailAccounts.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-8">
              {activeSection === 'compose' && (
                <ComposeSection
                  emailAccounts={emailAccounts}
                  selectedAccountId={selectedAccountId}
                  setSelectedAccountId={setSelectedAccountId}
                  toRecipients={toRecipients}
                  setToRecipients={setToRecipients}
                  ccRecipients={ccRecipients}
                  setCcRecipients={setCcRecipients}
                  bccRecipients={bccRecipients}
                  setBccRecipients={setBccRecipients}
                  showCC={showCC}
                  setShowCC={setShowCC}
                  showBCC={showBCC}
                  setShowBCC={setShowBCC}
                  subject={subject}
                  setSubject={setSubject}
                  body={body}
                  setBody={setBody}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  isSending={isSending}
                  sendSuccess={sendSuccess}
                  sendError={sendError}
                  onSubmit={handleSendEmail}
                />
              )}

              {activeSection === 'sent' && (
                <SentSection
                  logs={emailLogs}
                  loading={logsLoading}
                  pagination={logsPagination}
                  search={logsSearch}
                  onSearch={(query: string) => {
                    setLogsSearch(query);
                    setLogsPagination(prev => ({ ...prev, page: 1 }));
                    fetchEmailLogs(1, query);
                  }}
                  onPageChange={(page: number) => {
                    setLogsPagination(prev => ({ ...prev, page }));
                    fetchEmailLogs(page, logsSearch);
                  }}
                  onRefresh={() => fetchEmailLogs(logsPagination.page, logsSearch)}
                />
              )}


              {activeSection === 'settings' && (
                <SettingsSection
                  emailAccounts={emailAccounts}
                  onAddAccount={() => setShowConfigModal(true)}
                  onSetPrimary={handleSetPrimary}
                  onDelete={handleDeleteAccount}
                  onRefreshAccounts={fetchEmailAccounts}
                />
              )}
            </div>
          </>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAccountToDelete(null);
        }}
        onConfirm={confirmDeleteAccount}
        accountEmail={accountToDelete?.email || ''}
        isPrimary={accountToDelete?.isPrimary || false}
      />
    </div>
  );
}

// Navigation Item Component
function NavItem({ icon, label, active, onClick, badge, disabled }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all ${active
        ? 'bg-[#d1fae5] text-[#10b981] font-medium'
        : disabled
          ? 'text-[#cbd5e1] cursor-not-allowed'
          : 'text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]'
        }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      {badge && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${typeof badge === 'number'
          ? 'bg-[#10b981] text-white'
          : 'bg-[#f1f5f9] text-[#64748b]'
          }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// Compose Section with Advanced Recipients
function ComposeSection({
  emailAccounts,
  selectedAccountId,
  setSelectedAccountId,
  toRecipients,
  setToRecipients,
  ccRecipients,
  setCcRecipients,
  bccRecipients,
  setBccRecipients,
  showCC,
  setShowCC,
  showBCC,
  setShowBCC,
  subject,
  setSubject,
  body,
  setBody,
  attachments,
  setAttachments,
  isSending,
  sendSuccess,
  sendError,
  onSubmit,
}: any) {
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const selectedAccount = emailAccounts.find((acc: any) => acc.id === selectedAccountId) || emailAccounts[0];

  // Fetch templates when modal opens
  useEffect(() => {
    if (showTemplateModal && templates.length === 0) {
      fetchTemplatesForModal();
    }
  }, [showTemplateModal]);

  const fetchTemplatesForModal = async () => {
    setTemplatesLoading(true);
    try {
      const response = await fetch('/api/v1/email/templates', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        // Filter to only show email templates (not WhatsApp or SMS)
        const emailTemplates = (data.data.templates || []).filter(
          (t: any) => !t.channel || t.channel.toLowerCase() === 'email'
        );
        setTemplates(emailTemplates);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const applyTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      // If template has variables, render it with the values
      if (selectedTemplate.variables && selectedTemplate.variables.length > 0) {
        const response = await fetch(`/api/v1/email/templates/${selectedTemplate.id}/render`, {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify({ variables: templateVariables }),
        });
        const data = await response.json();
        if (data.success) {
          setSubject(data.data.subject);
          setBody(data.data.bodyHtml);
        }
      } else {
        // No variables, apply directly
        setSubject(selectedTemplate.subject);
        setBody(selectedTemplate.bodyHtml);
      }

      // Close modal and reset
      setShowTemplateModal(false);
      setSelectedTemplate(null);
      setTemplateVariables({});
    } catch (error) {
      console.error('Failed to apply template:', error);
      alert('Failed to apply template. Please try again.');
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="max-w-4xl space-y-5">
        {/* Account Selector */}
        {emailAccounts.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-[#0f172a] mb-2">From</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-full flex items-center justify-center">
                    <FiMail className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#0f172a]">{selectedAccount.email}</div>
                    <div className="text-xs text-[#64748b]">
                      {selectedAccount.provider}
                      {selectedAccount.isPrimary && <span className="ml-2 text-[#10b981]">• Primary</span>}
                    </div>
                  </div>
                </div>
                <FiChevronDown className={`w-5 h-5 text-[#64748b] transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showAccountDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-60 overflow-auto">
                  {emailAccounts.map((account: any) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => {
                        setSelectedAccountId(account.id);
                        setShowAccountDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-[#f8fafc] transition-colors border-b border-[#f1f5f9] last:border-0 ${account.id === selectedAccountId ? 'bg-[#d1fae5]' : ''
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${account.isPrimary ? 'bg-gradient-to-br from-[#10b981] to-[#059669]' : 'bg-[#f1f5f9]'
                          }`}>
                          {account.isPrimary ? (
                            <FiStar className="w-4 h-4 text-white" />
                          ) : (
                            <FiMail className="w-4 h-4 text-[#64748b]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[#0f172a]">{account.email}</div>
                          <div className="text-xs text-[#64748b]">
                            {account.provider}
                            {account.isPrimary && <span className="ml-2 text-[#10b981]">• Primary</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recipient Selection with Quick Groups */}
        <div className="space-y-4">
          {/* Quick Groups */}
          <div>
            <label className="block text-sm font-medium text-[#0f172a] mb-2">Quick Select Recipients</label>
            <QuickGroupSelector
              onRecipientsSelected={(recipients) => {
                const existingEmails = new Set(toRecipients.map((r: any) => r.email));
                const newRecipients = recipients.filter((r: any) => !existingEmails.has(r.email));
                setToRecipients([...toRecipients, ...newRecipients]);
              }}
            />
          </div>

          {/* To Recipients */}
          <RecipientSelector
            label="To"
            value={toRecipients}
            onChange={setToRecipients}
            placeholder="Type to search patients, doctors, or enter email..."
          />

          {/* CC/BCC Toggle Buttons */}
          <div className="flex gap-2">
            {!showCC && (
              <button
                type="button"
                onClick={() => setShowCC(true)}
                className="text-sm text-[#64748b] hover:text-[#10b981] font-medium"
              >
                + Add CC
              </button>
            )}
            {!showBCC && (
              <button
                type="button"
                onClick={() => setShowBCC(true)}
                className="text-sm text-[#64748b] hover:text-[#10b981] font-medium"
              >
                + Add BCC
              </button>
            )}
          </div>

          {/* CC Recipients */}
          {showCC && (
            <div className="relative">
              <RecipientSelector
                label="CC"
                value={ccRecipients}
                onChange={setCcRecipients}
                placeholder="Carbon copy recipients..."
              />
              <button
                type="button"
                onClick={() => {
                  setShowCC(false);
                  setCcRecipients([]);
                }}
                className="absolute top-2 right-2 text-[#64748b] hover:text-[#dc2626]"
              >
                ✕
              </button>
            </div>
          )}

          {/* BCC Recipients */}
          {showBCC && (
            <div className="relative">
              <RecipientSelector
                label="BCC"
                value={bccRecipients}
                onChange={setBccRecipients}
                placeholder="Blind carbon copy recipients..."
              />
              <button
                type="button"
                onClick={() => {
                  setShowBCC(false);
                  setBccRecipients([]);
                }}
                className="absolute top-2 right-2 text-[#64748b] hover:text-[#dc2626]"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Insert Template Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#e2e8f0] text-[#64748b] rounded-lg hover:border-[#10b981] hover:text-[#10b981] hover:bg-[#f0fdf4] transition-colors font-medium text-sm"
          >
            <FiFileText className="w-4 h-4" />
            Insert Template
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#fef3c7] text-[#92400e] ml-1">
              Demo
            </span>
          </button>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-[#0f172a] mb-2">Subject</label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
          />
        </div>

        {/* Message Body */}
        <div>
          <label className="block text-sm font-medium text-[#0f172a] mb-2">Message</label>
          <textarea
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            placeholder="Write your message here..."
            className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent resize-none"
          />
        </div>

        {/* File Attachments */}
        <div>
          <AttachmentUploader
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            maxSize={10 * 1024 * 1024}
            maxFiles={5}
          />
        </div>

        {/* Status Messages */}
        {sendSuccess && (
          <div className="p-4 bg-[#d1fae5] border border-[#10b981] rounded-lg flex items-center gap-3">
            <FiCheckCircle className="w-5 h-5 text-[#10b981]" />
            <p className="text-sm text-[#065f46] font-medium">Email sent successfully!</p>
          </div>
        )}

        {sendError && (
          <div className="p-4 bg-[#fee2e2] border border-[#ef4444] rounded-lg flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#dc2626]">{sendError}</p>
          </div>
        )}

        {/* Send Button */}
        <button
          type="submit"
          disabled={isSending}
          className="px-6 py-3 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Sending...
            </>
          ) : (
            <>
              <FiSend className="w-4 h-4" />
              Send Email
            </>
          )}
        </button>
      </form>

      {/* Template Selector Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => {
          setShowTemplateModal(false);
          setSelectedTemplate(null);
          setTemplateVariables({});
        }}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#0f172a]">
                  {selectedTemplate ? 'Customize Template' : 'Select a Template'}
                </h2>
                <p className="text-sm text-[#64748b] mt-1">
                  {selectedTemplate ? 'Fill in the variables below' : 'Choose a template to insert into your email'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setSelectedTemplate(null);
                  setTemplateVariables({});
                }}
                className="p-2 hover:bg-[#f1f5f9] rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-[#64748b]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {!selectedTemplate ? (
                /* Template Selection View */
                templatesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#e2e8f0] border-t-[#10b981] rounded-full animate-spin"></div>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-12">
                    <FiFileText className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
                    <p className="text-[#64748b]">No templates available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setSelectedTemplate(template);
                          // Initialize variables with empty values
                          const initialVars: Record<string, string> = {};
                          template.variables?.forEach((v: string) => {
                            initialVars[v] = '';
                          });
                          setTemplateVariables(initialVars);
                        }}
                        className="bg-white border border-[#e2e8f0] rounded-lg p-4 hover:border-[#10b981] hover:shadow-md transition-all text-left"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-[#0f172a]">{template.name}</h3>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#f0fdf4] text-[#065f46] shrink-0 ml-2">
                            {template.category}
                          </span>
                        </div>
                        <p className="text-sm text-[#64748b] line-clamp-1 mb-3">{template.subject}</p>
                        {template.variables && template.variables.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {template.variables.slice(0, 3).map((variable: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-[#fef3c7] text-[#92400e]">
                                {`{{${variable}}}`}
                              </span>
                            ))}
                            {template.variables.length > 3 && (
                              <span className="text-xs text-[#64748b]">+{template.variables.length - 3}</span>
                            )}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )
              ) : (
                /* Variable Substitution View */
                <div className="space-y-6">
                  {/* Template Info */}
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#0f172a]">{selectedTemplate.name}</h3>
                        <p className="text-sm text-[#64748b] mt-1">{selectedTemplate.subject}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTemplate(null);
                          setTemplateVariables({});
                        }}
                        className="text-sm text-[#10b981] hover:text-[#059669] font-medium"
                      >
                        ← Back to templates
                      </button>
                    </div>
                  </div>

                  {/* Variable Inputs */}
                  {selectedTemplate.variables && selectedTemplate.variables.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-semibold text-[#0f172a] mb-4">Fill in the Variables</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedTemplate.variables.map((variable: string) => (
                          <div key={variable}>
                            <label className="block text-sm font-medium text-[#0f172a] mb-2">
                              {/* Convert camelCase to Title Case */}
                              {variable.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </label>
                            <input
                              type="text"
                              value={templateVariables[variable] || ''}
                              onChange={(e) => setTemplateVariables({
                                ...templateVariables,
                                [variable]: e.target.value
                              })}
                              placeholder={`Enter ${variable}`}
                              className="w-full px-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#f0fdf4] border border-[#10b981] rounded-lg p-4">
                      <p className="text-sm text-[#065f46]">
                        ✓ This template has no variables. Click "Apply to Email" to insert it directly.
                      </p>
                    </div>
                  )}

                  {/* Preview */}
                  <div>
                    <h4 className="text-sm font-semibold text-[#0f172a] mb-3">Preview</h4>
                    <div className="border border-[#e2e8f0] rounded-lg p-4 bg-[#f8fafc] max-h-64 overflow-y-auto">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedTemplate.bodyHtml }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {selectedTemplate && (
              <div className="p-6 border-t border-[#e2e8f0] flex gap-3 shrink-0">
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setTemplateVariables({});
                  }}
                  className="flex-1 px-4 py-2 border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={applyTemplate}
                  className="flex-1 px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <FiCheckCircle className="w-4 h-4" />
                  Apply to Email
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}


// Sent Section with Expandable Rows, Search, and Pagination
function SentSection({ logs, loading, pagination, search, onSearch, onPageChange, onRefresh }: any) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(search || '');

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  return (
    <div className="max-w-6xl">
      {/* Header with Search and Actions */}
      <div className="flex items-center gap-4 mb-6">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by recipient or subject..."
              className="w-full px-4 py-2 pr-10 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 px-3 py-1 text-sm text-[#10b981] hover:text-[#059669] font-medium"
            >
              Search
            </button>
          </div>
        </form>

        {/* Stats and Refresh */}
        <div className="flex items-center gap-4">
          <p className="text-sm text-[#64748b]">
            {pagination.total} total • Page {pagination.page} of {pagination.totalPages || 1}
          </p>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 text-sm text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc] rounded-lg transition-colors flex items-center gap-2"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <LogsShimmer />
      ) : (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#e2e8f0] px-6 py-12 text-center text-[#94a3b8]">
              No emails sent yet
            </div>
          ) : (
            logs.map((log: any) => {
              const isExpanded = expandedId === log.id;
              const providerInfo = log.emailAccount ? getProviderInfo(log.emailAccount.provider) : null;
              const webmailLink = log.emailAccount ? getProviderWebmailLink(log.emailAccount.provider, log.subject) : null;
              const totalRecipients = (log.to?.length || 0) + (log.cc?.length || 0) + (log.bcc?.length || 0);

              return (
                <div key={log.id} className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
                  {/* Collapsed View */}
                  <button
                    onClick={() => toggleExpanded(log.id)}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-[#f8fafc] transition-colors text-left"
                  >
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <FiChevronUp className="w-5 h-5 text-[#64748b]" />
                      ) : (
                        <FiChevronDown className="w-5 h-5 text-[#64748b]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                      {/* Recipients */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <FiUsers className="w-4 h-4 text-[#64748b] flex-shrink-0" />
                          <span className="text-sm text-[#0f172a] truncate">
                            {log.to?.[0] || 'N/A'}
                          </span>
                          {totalRecipients > 1 && (
                            <span className="text-xs text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded-full flex-shrink-0">
                              +{totalRecipients - 1}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="col-span-4">
                        <p className="text-sm text-[#64748b] truncate">{log.subject}</p>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${log.status === 'SENT'
                          ? 'bg-[#d1fae5] text-[#065f46]'
                          : log.status === 'FAILED'
                            ? 'bg-[#fee2e2] text-[#991b1b]'
                            : 'bg-[#fef3c7] text-[#92400e]'
                          }`}>
                          {log.status}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="col-span-3">
                        <p className="text-sm text-[#64748b]">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Expanded View */}
                  {isExpanded && (
                    <div className="border-t border-[#e2e8f0] bg-[#f8fafc] p-6 space-y-6">
                      {/* All Recipients */}
                      <div>
                        <h4 className="text-sm font-semibold text-[#0f172a] mb-3">Recipients</h4>
                        <div className="space-y-2">
                          {/* To */}
                          {log.to && log.to.length > 0 && (
                            <div className="flex gap-2">
                              <span className="text-sm font-medium text-[#64748b] w-12">To:</span>
                              <div className="flex-1 flex flex-wrap gap-2">
                                {log.to.map((email: string, idx: number) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-[#e2e8f0] rounded text-sm text-[#0f172a]">
                                    <FiMail className="w-3 h-3" />
                                    {email}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* CC */}
                          {log.cc && log.cc.length > 0 && (
                            <div className="flex gap-2">
                              <span className="text-sm font-medium text-[#64748b] w-12">CC:</span>
                              <div className="flex-1 flex flex-wrap gap-2">
                                {log.cc.map((email: string, idx: number) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-[#e2e8f0] rounded text-sm text-[#0f172a]">
                                    <FiMail className="w-3 h-3" />
                                    {email}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* BCC */}
                          {log.bcc && log.bcc.length > 0 && (
                            <div className="flex gap-2">
                              <span className="text-sm font-medium text-[#64748b] w-12">BCC:</span>
                              <div className="flex-1 flex flex-wrap gap-2">
                                {log.bcc.map((email: string, idx: number) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-[#e2e8f0] rounded text-sm text-[#0f172a]">
                                    <FiMail className="w-3 h-3" />
                                    {email}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Email Body */}
                      <div>
                        <h4 className="text-sm font-semibold text-[#0f172a] mb-3">Message</h4>
                        <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 max-h-64 overflow-y-auto">
                          <div
                            className="text-sm text-[#0f172a] prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: log.bodyHtml || '' }}
                          />
                        </div>
                      </div>

                      {/* Attachments */}
                      {log.attachments && Array.isArray(log.attachments) && log.attachments.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
                            <FiPaperclip className="w-4 h-4" />
                            Attachments ({log.attachments.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {log.attachments.map((att: any, idx: number) => (
                              <div key={idx} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-[#e2e8f0] rounded-lg">
                                <FiFile className="w-4 h-4 text-[#64748b]" />
                                <span className="text-sm text-[#0f172a]">{att.filename || att.name || `Attachment ${idx + 1}`}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-4 border-t border-[#e2e8f0]">
                        {webmailLink && providerInfo && (
                          <a
                            href={webmailLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-lg hover:bg-[#f1f5f9] transition-colors text-sm font-medium text-[#0f172a]"
                          >
                            {providerInfo.iconType === 'gmail' && <SiGmail className="w-4 h-4" style={{ color: providerInfo.color }} />}
                            {providerInfo.iconType === 'outlook' && <FiMail className="w-4 h-4" style={{ color: providerInfo.color }} />}
                            {providerInfo.iconType === 'generic' && <FiMail className="w-4 h-4 text-[#64748b]" />}
                            View in {providerInfo.name}
                            <FiExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <div className="flex-1" />
                        <span className="text-xs text-[#64748b]">
                          Sent from: {log.emailAccount?.email || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && logs.length > 0 && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-[#e2e8f0] pt-4">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${pagination.page === pageNum
                    ? 'bg-[#10b981] text-white'
                    : 'border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// Templates Section
// Templates Section
function TemplatesSection() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

  const categories = [
    { id: 'all', label: 'All Templates', icon: FiFileText },
    { id: 'welcome', label: 'Welcome', icon: FiStar },
    { id: 'notification', label: 'Notifications', icon: FiMail },
    { id: 'confirmation', label: 'Confirmations', icon: FiCheckCircle },
    { id: 'marketing', label: 'Marketing', icon: FiSend }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/email/templates', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl">
      {/* Header with Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
          />
          <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
        </div>
        <p className="text-sm text-[#64748b]">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${isActive
                ? 'bg-[#10b981] text-white'
                : 'bg-white border border-[#e2e8f0] text-[#64748b] hover:border-[#10b981] hover:text-[#10b981]'
                }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#e2e8f0] border-t-[#10b981] rounded-full animate-spin"></div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-12 text-center">
          <FiFileText className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#0f172a] mb-2">No templates found</h3>
          <p className="text-sm text-[#64748b]">
            {searchQuery ? 'Try a different search term' : 'No templates available in this category'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:shadow-lg hover:border-[#10b981] transition-all group"
            >
              {/* Template Header */}
              <div className="p-4 border-b border-[#f1f5f9]">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-[#0f172a] line-clamp-1">{template.name}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#f0fdf4] text-[#065f46] shrink-0 ml-2">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-[#64748b] line-clamp-1">{template.subject}</p>
              </div>

              {/* Template Preview */}
              <div className="p-4 bg-[#f8fafc] min-h-[100px]">
                <div
                  className="text-xs text-[#64748b] line-clamp-4"
                  dangerouslySetInnerHTML={{ __html: template.bodyHtml.substring(0, 200) + '...' }}
                />
              </div>

              {/* Template Footer */}
              <div className="p-4 border-t border-[#f1f5f9]">
                {template.variables && template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.variables.slice(0, 3).map((variable: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-[#fef3c7] text-[#92400e]">
                        {`{{${variable}}}`}
                      </span>
                    ))}
                    {template.variables.length > 3 && (
                      <span className="text-xs text-[#64748b]">+{template.variables.length - 3}</span>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setPreviewTemplate(template)}
                  className="w-full px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors flex items-center justify-center gap-2 font-medium text-sm opacity-0 group-hover:opacity-100"
                >
                  <FiExternalLink className="w-4 h-4" />
                  Preview & Use
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setPreviewTemplate(null)}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-[#e2e8f0] flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0f172a] mb-1">{previewTemplate.name}</h2>
                <p className="text-sm text-[#64748b]">{previewTemplate.subject}</p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 hover:bg-[#f1f5f9] rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-[#64748b]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Variables Section */}
              {previewTemplate.variables && previewTemplate.variables.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Template Variables</h3>
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.variables.map((variable: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-mono bg-[#fef3c7] text-[#92400e]">
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-[#64748b] mt-2">
                    These placeholders will be replaced with actual values when using the template
                  </p>
                </div>
              )}

              {/* Email Preview */}
              <div>
                <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Email Preview</h3>
                <div className="border border-[#e2e8f0] rounded-lg p-6 bg-white">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewTemplate.bodyHtml }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#e2e8f0] flex gap-3">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="flex-1 px-4 py-2 border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // TODO: Implement template insertion into composer
                  alert('Template insertion coming soon!');
                  setPreviewTemplate(null);
                }}
                className="flex-1 px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors font-medium flex items-center justify-center gap-2"
              >
                <FiMail className="w-4 h-4" />
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Settings Section with Multiple Account Cards
function SettingsSection({ emailAccounts, onAddAccount, onSetPrimary, onDelete, onRefreshAccounts }: any) {
  const [testingAccount, setTestingAccount] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const handleTestConnection = async (accountId: string) => {
    setTestingAccount(accountId);
    try {
      const response = await fetch(`/api/v1/email/test-connection`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ accountId }), // Send accountId in body
      });
      const data = await response.json();

      setTestResults(prev => ({
        ...prev,
        [accountId]: {
          success: data.success,
          message: data.message || (data.success ? 'Connection verified!' : 'Connection failed')
        }
      }));

      // Smoothly refetch accounts without page reload!
      if (data.success && onRefreshAccounts) {
        setTimeout(() => onRefreshAccounts(), 1500);
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [accountId]: { success: false, message: 'Connection test failed' }
      }));
    } finally {
      setTestingAccount(null);
    }
  };

  const getStatusBadge = (account: any) => {
    if (account.isVerified && account.isActive) {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#d1fae5] text-[#065f46] rounded-full text-xs font-medium"><span className="w-1.5 h-1.5 bg-[#10b981] rounded-full"></span>Verified & Active</span>;
    } else if (!account.isActive) {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#fee2e2] text-[#991b1b] rounded-full text-xs font-medium"><span className="w-1.5 h-1.5 bg-[#dc2626] rounded-full"></span>Connection Failed</span>;
    } else {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#fef3c7] text-[#92400e] rounded-full text-xs font-medium"><span className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full"></span>Not Verified</span>;
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Add Account Button */}
      <button
        onClick={onAddAccount}
        className="w-full px-6 py-4 border-2 border-dashed border-[#cbd5e1] rounded-lg hover:border-[#10b981] hover:bg-[#f0fdf4] transition-colors flex items-center justify-center gap-3 text-[#64748b] hover:text-[#10b981]"
      >
        <FiPlus className="w-5 h-5" />
        <span className="font-medium">Connect Gmail Account</span>
      </button>

      {/* Account Cards */}
      <div className="space-y-4">
        {emailAccounts.map((account: any) => (
          <div
            key={account.id}
            className={`bg-white rounded-lg border-2 p-6 ${account.isPrimary ? 'border-[#10b981]' : 'border-[#e2e8f0]'
              }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${account.isPrimary
                  ? 'bg-gradient-to-br from-[#10b981] to-[#059669]'
                  : 'bg-[#f1f5f9]'
                  }`}>
                  {account.isPrimary ? (
                    <FiStar className="w-6 h-6 text-white" />
                  ) : (
                    <FiMail className="w-6 h-6 text-[#64748b]" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#0f172a]">{account.email}</h3>
                    {account.isPrimary && (
                      <span className="px-2 py-0.5 bg-[#d1fae5] text-[#065f46] text-xs font-medium rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-[#64748b]">{account.provider}</p>
                    {getStatusBadge(account)}
                  </div>
                  {testResults[account.id] && (
                    <div className={`text-xs mt-1 ${testResults[account.id].success ? 'text-[#065f46]' : 'text-[#991b1b]'}`}>
                      {testResults[account.id].message}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#94a3b8]">
                    {account.authMethod === 'OAUTH' ? (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="font-medium text-[#4285f4]">Gmail OAuth</span>
                        {account.oauthConnectedAt && (
                          <span className="text-[#94a3b8]">• Connected {new Date(account.oauthConnectedAt).toLocaleDateString()}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-[#94a3b8]">SMTP Configuration</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTestConnection(account.id)}
                  disabled={testingAccount === account.id}
                  className="px-3 py-1.5 text-sm text-[#0f172a] hover:bg-[#f1f5f9] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <FiRefreshCw className={`w-3.5 h-3.5 ${testingAccount === account.id ? 'animate-spin' : ''}`} />
                  {testingAccount === account.id ? 'Testing...' : 'Test Connection'}
                </button>
                {!account.isPrimary && (
                  <button
                    onClick={() => onSetPrimary(account.id)}
                    className="px-3 py-1.5 text-sm text-[#10b981] hover:bg-[#d1fae5] rounded-lg transition-colors"
                  >
                    Set as Primary
                  </button>
                )}
                <button
                  onClick={() => onDelete(account.id)}
                  className="px-3 py-1.5 text-sm text-[#dc2626] hover:bg-[#fee2e2] rounded-lg transition-colors flex items-center gap-1"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

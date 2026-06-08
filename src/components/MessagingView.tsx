import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Check, Search, Calendar, User, 
  ChevronRight, Landmark, ArrowLeft 
} from 'lucide-react';
import { Conversation, Message, User as UserType } from '../types';

interface MessagingViewProps {
  currentUser: UserType;
  conversations: any[]; // Augmented conversation list
  messages: Message[];
  members: UserType[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => Promise<void>;
  onSendMessage: (conversationId: string | null, recipientId: string | null, content: string) => Promise<void>;
  onMarkRead: (conversationId: string) => Promise<void>;
}

export default function MessagingView({
  currentUser,
  conversations,
  messages,
  members,
  activeConversationId,
  onSelectConversation,
  onSendMessage,
  onMarkRead
}: MessagingViewProps) {
  const [inputText, setInputText] = useState('');
  const [recipientSelectId, setRecipientSelectId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter out self from member list to start chats
  const chatPartners = members.filter(m => m.id !== currentUser.id && m.status === 'approved');

  const activeConv = conversations.find(c => c.id === activeConversationId);

  // Auto-scroll to lowest message on layout updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSending(true);
    try {
      await onSendMessage(activeConversationId, activeConversationId ? null : recipientSelectId, inputText);
      setInputText('');
      setRecipientSelectId('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleInitiateNewChat = async (mId: string) => {
    if (!mId) return;
    
    // Check if a conversation pre-exists
    const preExisting = conversations.find(c => !c.isGroup && c.participantIds.includes(mId));
    if (preExisting) {
      await onSelectConversation(preExisting.id);
    } else {
      // Send a greeting to kick off a new conversation
      await onSendMessage(null, mId, "Hi neighbor! Starting a chat discussion thread with you.");
    }
    setRecipientSelectId('');
  };

  return (
    <div className="flex-grow bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 transition-colors h-[calc(100vh-12rem)] flex flex-col md:flex-row" id="messaging-module">
      
      {/* Conversations Left Panel */}
      <div className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all h-full ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Panel Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3.5">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <MessageSquare className="h-4.5 w-4.5 text-blue-900" />
            <span>Neighbor Discussions</span>
          </h2>

          {/* Quick Initiate selector drop */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase block">New Private Chat</label>
            <select
              value={recipientSelectId}
              onChange={(e) => handleInitiateNewChat(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300"
              id="new-chat-partner-select"
            >
              <option value="">-- Choose Chat Recipient --</option>
              {chatPartners.map(p => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.memberId})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conversations list item entries */}
        <div className="flex-grow overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No private chat dialogues started yet. Use dropdown to find a neighbor.
            </div>
          ) : (
            conversations.map((conv) => {
              const worksAsActive = conv.id === activeConversationId;
              const hasUnread = conv.unreadCount > 0;

              return (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all flex items-center space-x-3 ${worksAsActive ? 'bg-blue-50/20 dark:bg-slate-800 border-l-4 border-blue-900' : ''}`}
                >
                  <img
                    src={conv.recipientAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                    alt={conv.recipientName}
                    className="h-10 w-10 rounded-full object-cover border border-slate-200"
                  />
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`text-xs truncate ${hasUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-850 dark:text-slate-200'}`}>
                        {conv.recipientName}
                      </span>
                      {conv.lastMessageDate && (
                        <span className="text-[9px] text-slate-400 font-medium">
                          {new Date(conv.lastMessageDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${hasUnread ? 'font-black text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {conv.lastMessageText}
                    </p>
                  </div>

                  {hasUnread && (
                    <span className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Messages Frame Panel Right */}
      <div className={`flex-1 flex flex-col h-full ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        {activeConversationId && activeConv ? (
          <>
            {/* Header back button for mobile */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-850 flex items-center bg-slate-50/60 dark:bg-slate-905-60 justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <button
                  onClick={() => onSelectConversation('')}
                  className="p-1 px-2 hover:bg-slate-200 rounded-lg text-slate-500 dark:text-slate-400 md:hidden flex items-center text-xs"
                >
                  <ArrowLeft className="h-4 w-4 mr-0.5" />
                  <span>List</span>
                </button>
                <img
                  src={activeConv.recipientAvatar}
                  alt={activeConv.recipientName}
                  className="h-9 w-9 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-105 truncate">{activeConv.recipientName}</h3>
                  <span className="text-[10px] text-slate-400">Secure Direct Thread</span>
                </div>
              </div>
            </div>

            {/* Messages display stream */}
            <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-slate-50/15">
              {messages.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-20">Type a message below to start chatting with your neighbor.</p>
              ) : (
                messages.map((msg) => {
                  const isSentByMe = msg.senderId === currentUser.id;

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] p-3 rounded-2xl text-xs space-y-1 shadow-sm leading-normal ${
                        isSentByMe 
                          ? 'bg-blue-900 text-white rounded-br-none' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center justify-end space-x-1 text-[9px] opacity-75">
                          <span>{new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isSentByMe && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Messaging text dispatcher input form */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 flex space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a secure message..."
                className="flex-grow pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-800 rounded-full text-xs focus:outline-none border border-slate-250 focus:ring-1 focus:ring-blue-900 text-slate-800 dark:text-slate-150"
                id="message-dispatch-input"
              />
              <button
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="bg-blue-905 bg-blue-900 hover:bg-blue-800 text-white p-2 px-3 rounded-full flex-shrink-0 disabled:opacity-40 select-none cursor-pointer"
                id="send-message-btn"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>

          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-450 space-y-3">
            <MessageSquare className="h-12 w-12 text-slate-300" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-400">Select a Conversation thread</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Use the choice selection dropdown on the left to dialogue with any registered community member instantly.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Send, AlertCircle, Clock } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Chat = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatExpired, setChatExpired] = useState(false);
  const [orderStatus, setOrderStatus] = useState('');
  const [order, setOrder] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    fetchOrderDetails();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('foodambo_token');
      const response = await axios.get(`${API_URL}/api/orders/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentOrder = response.data.find(o => o.id === orderId);
      if (currentOrder) {
        setOrder(currentOrder);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('foodambo_token');
      const response = await axios.get(`${API_URL}/api/chat/messages/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);
      setChatExpired(response.data.chat_expired || false);
      setOrderStatus(response.data.order_status || '');
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || chatExpired) return;

    setSending(true);
    try {
      const token = localStorage.getItem('foodambo_token');
      
      // Determine receiver_id
      const receiverId = order?.buyer_id === user?.id ? order?.seller_id : order?.buyer_id;
      
      await axios.post(
        `${API_URL}/api/chat/messages`,
        {
          order_id: orderId,
          receiver_id: receiverId,
          message: newMessage.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleLeaveReview = () => {
    navigate(`/order/${orderId}/review`);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Order Chat</h1>
              <p className="text-xs text-foreground-muted">
                Order #{orderId.slice(0, 8)}...
              </p>
            </div>
          </div>
          {orderStatus === 'completed' && !chatExpired && (
            <Button size="sm" variant="outline" onClick={handleLeaveReview}>
              Leave Review
            </Button>
          )}
        </div>
      </div>

      {/* Chat Expiry Warning */}
      {chatExpired && (
        <div className="m-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900">Chat Window Expired</p>
            <p className="text-xs text-yellow-700 mt-1">
              This chat expired 4 hours after delivery. You can no longer send messages.
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-foreground-muted">No messages yet</p>
            <p className="text-xs text-foreground-muted mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {!chatExpired ? (
        <div className="sticky bottom-16 bg-white border-t border-border p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-primary hover:bg-primary/90"
              size="icon"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      ) : (
        <div className="sticky bottom-16 bg-gray-50 border-t border-border p-4 text-center">
          <p className="text-sm text-foreground-muted">Chat window has expired</p>
        </div>
      )}
    </div>
  );
};

export default Chat;

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const ShareButton = ({ title, text, url, type = 'product' }) => {
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const shareUrl = url || window.location.href;
  const shareTitle = title || 'Check this out on Foodambo!';
  const shareText = text || `${shareTitle} - Authentic homemade food from your neighborhood`;

  const handleShare = async () => {
    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        toast.success('Shared successfully!');
      } catch (error) {
        if (error.name !== 'AbortError') {
          // If share was cancelled, show options
          setShowOptions(true);
        }
      }
    } else {
      // Fallback to showing share options
      setShowOptions(true);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setShowOptions(false);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.open(whatsappUrl, '_blank');
    setShowOptions(false);
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    setShowOptions(false);
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setShowOptions(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="flex items-center gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>

      {showOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-in fade-in" onClick={() => setShowOptions(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-md p-6 space-y-3 animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Share {type}</h3>
              <button onClick={() => setShowOptions(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="w-full justify-start gap-3 h-12"
            >
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Link Copied!' : 'Copy Link'}
            </Button>

            <Button
              onClick={shareToWhatsApp}
              variant="outline"
              className="w-full justify-start gap-3 h-12 bg-green-50 hover:bg-green-100"
            >
              <span className="text-xl">💬</span>
              Share on WhatsApp
            </Button>

            <Button
              onClick={shareToFacebook}
              variant="outline"
              className="w-full justify-start gap-3 h-12 bg-blue-50 hover:bg-blue-100"
            >
              <span className="text-xl">📘</span>
              Share on Facebook
            </Button>

            <Button
              onClick={shareToTwitter}
              variant="outline"
              className="w-full justify-start gap-3 h-12 bg-sky-50 hover:bg-sky-100"
            >
              <span className="text-xl">🐦</span>
              Share on Twitter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButton;

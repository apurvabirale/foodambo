import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeAPI } from '../utils/api';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Upload, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const FSSAICertificate = () => {
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [certificateFile, setCertificateFile] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(null);

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const response = await storeAPI.getMy();
      setStore(response.data);
      
      // Calculate days remaining
      if (response.data.created_at && !response.data.fssai_submitted_at) {
        const createdDate = new Date(response.data.created_at);
        const deadline = new Date(createdDate);
        deadline.setDate(deadline.getDate() + 15);
        const today = new Date();
        const days = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        setDaysRemaining(days);
      }
      
      if (response.data.fssai_number) {
        setFssaiNumber(response.data.fssai_number);
      }
    } catch (error) {
      toast.error('Failed to load store');
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fssaiNumber) {
      toast.error('Please enter FSSAI number');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('foodambo_token');
      await axios.post(
        `${API_URL}/api/fssai/upload`,
        {
          fssai_number: fssaiNumber,
          fssai_certificate_url: certificateFile ? 'uploaded' : ''
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('FSSAI certificate submitted successfully!');
      navigate('/profile');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit certificate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestAssistance = async () => {
    try {
      const token = localStorage.getItem('foodambo_token');
      const response = await axios.post(
        `${API_URL}/api/fssai/request-assistance`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(response.data.message);
      fetchStore();
    } catch (error) {
      toast.error('Failed to request assistance');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">FSSAI Certificate</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Banner */}
        {store.fssai_verified ? (
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div className="flex-1">
                <p className="font-semibold text-green-900">FSSAI Verified</p>
                <p className="text-sm text-green-700">Certificate Number: {store.fssai_number}</p>
              </div>
            </div>
          </Card>
        ) : store.fssai_submitted_at ? (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-600" />
              <div className="flex-1">
                <p className="font-semibold text-blue-900">Verification Pending</p>
                <p className="text-sm text-blue-700">Your certificate is under review</p>
              </div>
            </div>
          </Card>
        ) : daysRemaining !== null && daysRemaining > 0 ? (
          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <div className="flex-1">
                <p className="font-semibold text-orange-900">Action Required</p>
                <p className="text-sm text-orange-700">
                  {daysRemaining} days remaining to upload FSSAI certificate
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">Deadline Exceeded</p>
                <p className="text-sm text-red-700">Please upload your FSSAI certificate immediately</p>
              </div>
            </div>
          </Card>
        )}

        {/* Upload Form */}
        {!store.fssai_verified && (
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Upload FSSAI Certificate</h2>
              <p className="text-sm text-foreground-muted">
                All food businesses must have a valid FSSAI license as per government regulations.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">FSSAI License Number *</label>
                <Input
                  value={fssaiNumber}
                  onChange={(e) => setFssaiNumber(e.target.value)}
                  placeholder="Enter 14-digit FSSAI number"
                  maxLength={14}
                  disabled={store.fssai_submitted_at}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Certificate Document (Optional)</label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-foreground-muted mb-2">
                    Upload FSSAI certificate (PDF, JPG, PNG)
                  </p>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setCertificateFile(e.target.files[0])}
                    className="max-w-xs mx-auto"
                    disabled={store.fssai_submitted_at}
                  />
                </div>
              </div>

              {!store.fssai_submitted_at && (
                <Button
                  type="submit"
                  disabled={submitting || !fssaiNumber}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {submitting ? 'Submitting...' : 'Submit Certificate'}
                </Button>
              )}
            </form>
          </Card>
        )}

        {/* Foodambo Assistance Service */}
        {!store.fssai_verified && !store.fssai_assistance_requested && (
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-orange-900">Need Help Getting FSSAI License?</h3>
                <p className="text-sm text-orange-800 mt-1">
                  Foodambo can help you obtain your FSSAI certificate hassle-free!
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Service Fee:</span>
                  <span className="text-2xl font-bold text-primary">₹999</span>
                </div>
                <ul className="text-sm text-foreground-muted space-y-1">
                  <li>✓ Complete documentation assistance</li>
                  <li>✓ Application filing support</li>
                  <li>✓ Fast-track processing</li>
                  <li>✓ Expert guidance throughout</li>
                </ul>
              </div>

              <Button
                onClick={handleRequestAssistance}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                Request FSSAI Assistance (₹999)
              </Button>
            </div>
          </Card>
        )}

        {store.fssai_assistance_requested && !store.fssai_verified && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-blue-600 mb-2" />
              <p className="font-semibold text-blue-900">Assistance Request Received</p>
              <p className="text-sm text-blue-700 mt-1">
                Our team will contact you within 24 hours to help you with FSSAI certification.
              </p>
            </div>
          </Card>
        )}

        {/* Info */}
        <Card className="p-4 bg-gray-50">
          <h4 className="font-semibold mb-2">Why FSSAI License is Required?</h4>
          <ul className="text-sm text-foreground-muted space-y-1">
            <li>• Mandatory for all food businesses as per FSSAI regulations</li>
            <li>• Ensures food safety and quality standards</li>
            <li>• Builds customer trust and credibility</li>
            <li>• Required within 15 days of store creation</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default FSSAICertificate;

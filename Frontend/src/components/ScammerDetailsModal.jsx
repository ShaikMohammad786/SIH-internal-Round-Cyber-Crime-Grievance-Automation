import React, { useState, useEffect } from 'react';
import { userProfilesAPI } from '../utils/userProfilesAPI';
import './ScammerDetailsModal.css';

const ScammerDetailsModal = ({ caseId, isOpen, onClose, onScammerCreated }) => {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    email: '',
    upiId: '',
    bankAccount: '',
    ifscCode: '',
    name: '',
    address: '',
    evidenceType: 'screenshot'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingScammer, setExistingScammer] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        phoneNumber: '',
        email: '',
        upiId: '',
        bankAccount: '',
        ifscCode: '',
        name: '',
        address: '',
        evidenceType: 'screenshot'
      });
      setError('');
      setExistingScammer(null);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.phoneNumber && !formData.email && !formData.upiId && !formData.bankAccount) {
      setError('Please provide at least one contact method (phone, email, UPI, or bank account)');
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('Creating scammer with data:', {
        ...formData,
        caseId: caseId
      });

      const response = await userProfilesAPI.createScammer({
        ...formData,
        caseId: caseId
      });

      console.log('Scammer creation response:', response);

      if (response.success) {
        alert('Scammer details saved successfully!');
        if (onScammerCreated) {
          onScammerCreated(response.scammerId);
        }
        onClose();
      } else {
        setError(response.message || 'Failed to save scammer details');
      }
    } catch (error) {
      console.error('Error saving scammer details:', error);
      console.error('Error details:', error.response?.data);
      setError(error.message || 'Failed to save scammer details');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchExisting = async () => {
    if (!formData.phoneNumber && !formData.email && !formData.upiId && !formData.bankAccount) {
      setError('Please enter at least one detail to search');
      return;
    }

    try {
      setLoading(true);
      const query = formData.phoneNumber || formData.email || formData.upiId || formData.bankAccount;
      const response = await userProfilesAPI.searchScammers(query);
      
      if (response.success && response.scammers.length > 0) {
        setExistingScammer(response.scammers[0]);
        setFormData(prev => ({
          ...prev,
          name: response.scammers[0].name || '',
          address: response.scammers[0].address || ''
        }));
      } else {
        setExistingScammer(null);
      }
    } catch (error) {
      console.error('Error searching scammers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content scammer-modal">
        <div className="modal-header">
          <h2>Collect Scammer Details</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {existingScammer && (
            <div className="existing-scammer-alert">
              <h3>⚠️ Existing Scammer Found</h3>
              <p>This scammer has been reported in {existingScammer.totalCases} other case(s).</p>
              <p>Previous cases: {existingScammer.cases.length}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="scammer-form">
            <div className="form-section">
              <h3>Contact Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="scammer@example.com"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>UPI ID</label>
                  <input
                    type="text"
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleInputChange}
                    placeholder="scammer@paytm"
                  />
                </div>
                <div className="form-group">
                  <label>Bank Account</label>
                  <input
                    type="text"
                    name="bankAccount"
                    value={formData.bankAccount}
                    onChange={handleInputChange}
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>IFSC Code</label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleInputChange}
                  placeholder="SBIN0001234"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Personal Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Scammer Name"
                  />
                </div>
                <div className="form-group">
                  <label>Evidence Type</label>
                  <select
                    name="evidenceType"
                    value={formData.evidenceType}
                    onChange={handleInputChange}
                  >
                    <option value="screenshot">Screenshot</option>
                    <option value="bank_statement">Bank Statement</option>
                    <option value="call_recording">Call Recording</option>
                    <option value="email_evidence">Email Evidence</option>
                    <option value="upi_transaction">UPI Transaction</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Scammer's address (if known)"
                  rows="3"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSearchExisting}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search Existing Scammer'}
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Scammer Details'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScammerDetailsModal;

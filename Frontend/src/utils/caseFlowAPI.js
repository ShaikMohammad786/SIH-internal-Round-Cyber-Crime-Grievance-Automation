import api from './auth';

// Complete Case Flow Management API
export const caseFlowAPI = {
  // Submit case with complete flow
  submitCase: async (caseData) => {
    try {
      const response = await api.post('/case-flow/submit', caseData);
      return response.data;
    } catch (error) {
      console.error('Case submission error:', error);
      throw new Error(error.response?.data?.message || 'Failed to submit case');
    }
  },

  // Get case flow status
  getCaseStatus: async (caseId) => {
    try {
      const response = await api.get(`/case-flow/status/${caseId}`);
      return response.data;
    } catch (error) {
      console.error('Get case status error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get case status');
    }
  },

  // Manual step progression (Admin only)
  progressStep: async (caseId, step) => {
    try {
      console.log('🔍 API Debug - Progressing step:', { caseId, step });
      const response = await api.post(`/case-flow/progress/${caseId}`, { step });
      console.log('🔍 API Debug - Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Progress step error:', error);
      console.error('❌ Error response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to progress step');
    }
  },

  // Get 91CRPC document
  getCRPCDocument: async (caseId) => {
    try {
      const response = await api.get(`/case-flow/crpc/${caseId}`);
      return response.data;
    } catch (error) {
      console.error('Get CRPC document error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get CRPC document');
    }
  },

  // Download 91CRPC document
  downloadCRPCDocument: async (documentId) => {
    try {
      console.log('📥 Frontend - Downloading document:', documentId);
      
      // Get the token for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Create download URL
      const downloadUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/case-flow/crpc/download/${documentId}`;
      console.log('📥 Download URL:', downloadUrl);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `91CRPC_${documentId}.pdf`;
      
      // Add authorization header by creating a fetch request
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/pdf'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `91CRPC_${documentId}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(downloadLink);
      
      console.log('✅ Document downloaded successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error downloading CRPC document:', error);
      throw new Error(error.message || 'Failed to download document');
    }
  }
};

// Enhanced form data structure for complete flow
export const createCompleteCaseData = (formData) => {
  console.log('=== Creating Complete Case Data ===');
  console.log('Form data:', formData);

  // Extract scammer information
  const scammerInfo = {
    name: formData.scammerName || '',
    phone: formData.scammerPhone || '',
    email: formData.scammerEmail || '',
    upiId: formData.scammerUPI || formData.scammerBankAccount || '',
    bankAccount: formData.scammerBankAccount || '',
    ifscCode: formData.scammerIFSC || '',
    address: formData.scammerAddress || '',
    website: formData.scammerWebsite || '',
    socialMedia: formData.scammerSocialMedia || ''
  };

  // Create comprehensive case data
  const caseData = {
    caseType: formData.scamType || formData.caseType || 'Other',
    description: formData.incidentDescription || 'No description provided',
    amount: Number(String(formData.moneyLost || formData.financialLoss || '0').replace(/[₹,\s]/g, '')) || 0,
    incidentDate: formData.incidentDate || new Date().toISOString().split('T')[0],
    location: {
      state: formData.state || 'Unknown',
      city: formData.city || 'Unknown',
      address: formData.streetAddress || 'Unknown'
    },
    contactInfo: {
      email: formData.email || '',
      phone: formData.primaryPhone || '',
      alternatePhone: formData.alternatePhone || ''
    },
    evidence: formData.evidenceFiles || [],
    formData: {
      personalInfo: {
        firstName: formData.firstName || '',
        middleName: formData.middleName || '',
        lastName: formData.lastName || '',
        dateOfBirth: formData.dateOfBirth || '',
        gender: formData.gender || '',
        nationality: formData.nationality || ''
      },
      contactInfo: {
        email: formData.email || '',
        phone: formData.primaryPhone || '',
        alternatePhone: formData.alternatePhone || '',
        emergencyContact: {
          name: formData.emergencyContactName || '',
          phone: formData.emergencyContactPhone || '',
          relation: formData.emergencyContactRelation || ''
        }
      },
      addressInfo: {
        currentAddress: {
          street: formData.streetAddress || '',
          city: formData.city || '',
          state: formData.state || '',
          postalCode: formData.postalCode || '',
          country: formData.country || 'India'
        }
      },
      governmentIds: {
        aadhaarNumber: formData.aadhaarNumber || '',
        panNumber: formData.panNumber || '',
        otherIds: formData.otherGovernmentIds ? [formData.otherGovernmentIds] : []
      },
      incidentInfo: {
        incidentDate: formData.incidentDate || '',
        incidentTime: formData.incidentTime || '',
        location: {
          state: formData.state || '',
          city: formData.city || '',
          address: formData.streetAddress || ''
        },
        description: formData.incidentDescription || '',
        scamType: formData.scamType || '',
        communicationMethod: formData.communicationMethod || '',
        witnesses: formData.witnesses || '',
        suspectInfo: {
          name: formData.scammerName || '',
          phone: formData.scammerPhone || '',
          email: formData.scammerEmail || '',
          website: formData.scammerWebsite || '',
          bankAccount: formData.scammerBankAccount || '',
          upiId: formData.scammerUPI || '',
          ifscCode: formData.scammerIFSC || '',
          address: formData.scammerAddress || '',
          socialMedia: formData.scammerSocialMedia || '',
          additionalInfo: formData.scammerOtherDetails || ''
        }
      },
      financialInfo: {
        amountLost: Number(String(formData.moneyLost || formData.financialLoss || '0').replace(/[₹,\s]/g, '')) || 0,
        currency: 'INR',
        paymentMethod: formData.paymentMethod || '',
        bankDetails: {
          accountNumber: formData.bankAccountNumber || '',
          ifscCode: formData.ifscCode || '',
          bankName: formData.bankName || ''
        },
        transactionDetails: formData.transactionDetails || ''
      },
      evidenceInfo: {
        evidence: formData.evidence || [],
        evidenceFiles: formData.evidenceFiles || [],
        screenshots: formData.screenshots || [],
        documents: formData.documents || [],
        emails: formData.emails || [],
        phoneRecords: formData.phoneRecords || []
      },
      additionalInfo: {
        additionalDetails: formData.additionalDetails || '',
        policeReport: formData.policeReport || false,
        policeStation: formData.policeStation || '',
        reportNumber: formData.reportNumber || '',
        previousReports: formData.previousReports || '',
        actionsTaken: formData.actionsTaken || '',
        sensitiveInfoShared: formData.sensitiveInfoShared || ''
      }
    },
    scammerInfo: scammerInfo
  };

  console.log('Complete case data created:', caseData);
  return caseData;
};

// Case flow status constants
export const CASE_FLOW_STEPS = {
  1: { name: 'Report Submitted', description: 'Initial report received and logged', icon: '📄' },
  2: { name: 'Information Verified', description: 'Personal and contact details verified', icon: '🔍' },
  3: { name: '91CRPC Generated', description: 'Legal document generated under Section 91 of CrPC', icon: '📋' },
  4: { name: 'Email Sent', description: 'Emails sent to telecom, banking, and nodal authorities', icon: '📧' },
  5: { name: 'Authorized', description: 'Case authorized by system and ready for police assignment', icon: '✅' },
  6: { name: 'Assigned to Police', description: 'Case assigned to police for investigation', icon: '👮' },
  7: { name: 'Evidence Collected', description: 'Evidence collected and case ready for resolution', icon: '📋' },
  8: { name: 'Resolved', description: 'Case resolved by police and ready for closure', icon: '✅' },
  9: { name: 'Case Closed', description: 'Case successfully closed and archived', icon: '🔒' }
};

// Case status mapping
export const CASE_STATUS_MAP = {
  'submitted': 1,
  'verified': 2,
  'crpc_generated': 3,
  'emails_sent': 4,
  'authorized': 5,
  'assigned_to_police': 6,
  'evidence_collected': 7,
  'resolved': 8,
  'closed': 9
};

export default caseFlowAPI;

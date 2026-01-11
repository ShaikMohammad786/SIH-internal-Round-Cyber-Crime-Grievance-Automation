import api from './auth';

// User Profile Management API
export const userProfilesAPI = {
  // Create or update user profile
  createProfile: async (profileData) => {
    try {
      const response = await api.post('/user/profile', profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create/update profile');
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  },

  // Get previous cases by Aadhaar or PAN
  getPreviousCases: async (aadhaarNumber = null, panNumber = null) => {
    try {
      const params = new URLSearchParams();
      if (aadhaarNumber) params.append('aadhaarNumber', aadhaarNumber);
      if (panNumber) params.append('panNumber', panNumber);

      const response = await api.get(`/user/previous-cases?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch previous cases');
    }
  },

  // Get only current user's cases
  getMyCases: async () => {
    try {
      const response = await api.get('/user/my-cases', { timeout: 15000 });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Fetching cases timed out. Please retry.');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch my cases');
    }
  },

  // Create case with comprehensive form data
  createCaseWithFormData: async (caseData) => {
    try {
      const response = await api.post('/user/create-case', caseData);
      return response.data;
    } catch (error) {
      console.error('API error creating case:', error);
      throw new Error(error.response?.data?.message || 'Failed to create case');
    }
  },

  // Get fresh dashboard data
  getDashboardFresh: async () => {
    try {
      const response = await api.get('/user/dashboard-fresh');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard data');
    }
  },

  // Get case details with timeline
  getCaseDetails: async (caseId) => {
    try {
      const response = await api.get(`/user/case/${caseId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch case details');
    }
  },

  // Update case status
  updateCaseStatus: async (caseId, status, description, assignedTo) => {
    try {
      const response = await api.put(`/user/case/${caseId}/status`, {
        status,
        description,
        assignedTo
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update case status');
    }
  },

  // Generate 91 CrPC document
  generate91CrPC: async (caseId, scammerId) => {
    try {
      console.log('📋 Generating 91CRPC for case:', caseId);
      const response = await api.post(`/case-flow/progress/${caseId}`, {
        step: 3
      });
      console.log('📋 91CRPC generation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 91CRPC generation error:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate 91 CrPC document');
    }
  },

  // Send emails to authorities
  sendEmails: async (caseId, scammerId, emailTypes) => {
    try {
      console.log('📧 Sending emails for case:', caseId);
      console.log('📧 Email types:', emailTypes);

      const response = await api.post(`/case-flow/progress/${caseId}`, {
        step: 4
      });

      console.log('📧 Email sending response:', response.data);
      return response.data;
    } catch (error) {
      console.error('🔍 API Error Debug:');
      console.error('  Error:', error);
      console.error('  Response:', error.response?.data);
      console.error('  Status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Failed to send emails');
    }
  },

  // Get CRPC documents for a case
  getCRPCDocuments: async (caseId) => {
    try {
      const response = await api.get(`/crpc/documents/${caseId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch CRPC documents');
    }
  },

  // Download CRPC document
  downloadCRPCDocument: async (documentId) => {
    try {
      const response = await api.get(`/crpc/download/${documentId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to download document');
    }
  },

  // Get email configuration
  getEmailConfig: async () => {
    try {
      const response = await api.get('/admin/email-config');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch email configuration');
    }
  },

  // Update email status
  updateEmailStatus: async (caseId, emailStatus) => {
    try {
      const response = await api.put(`/admin/cases/${caseId}/email-status`, {
        emailStatus: emailStatus
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update email status');
    }
  },

  // Download CRPC document from admin route
  downloadCRPCFromAdmin: async (caseId) => {
    try {
      console.log('📥 Downloading CRPC for case:', caseId);

      // First get the CRPC document details
      const crpcResponse = await api.get(`/case-flow/crpc/${caseId}`);
      console.log('📥 CRPC document response:', crpcResponse.data);

      if (!crpcResponse.data.success) {
        throw new Error(crpcResponse.data.message || 'CRPC document not found');
      }

      const documentId = crpcResponse.data.data.documentId;
      console.log('📥 Document ID:', documentId);

      // Now download the document
      const response = await api.get(`/case-flow/crpc/download/${documentId}`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });

      // Create download link
      console.log('📥 Response data type:', typeof response.data);
      console.log('📥 Response data length:', response.data?.length || 'unknown');
      console.log('📥 Response headers:', response.headers);
      console.log('📥 Content-Type:', response.headers['content-type']);

      // Check if response is actually a PDF
      if (response.headers['content-type'] !== 'application/pdf') {
        throw new Error('Invalid response type - expected PDF');
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      console.log('📥 Blob created:', blob.size, 'bytes');

      // Verify blob is not empty
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `91CRPC_${documentId}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      // Clean up after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);

      return { success: true };
    } catch (error) {
      console.error('❌ Download CRPC error:', error);
      throw new Error(error.response?.data?.message || 'Failed to download CRPC document');
    }
  },

  // Police Portal APIs
  getPoliceDashboard: async () => {
    try {
      const response = await api.get('/police/dashboard');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch police dashboard data');
    }
  },

  getPoliceCases: async () => {
    try {
      const response = await api.get('/police/cases');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch police cases');
    }
  },

  getPoliceCaseDetails: async (caseId) => {
    try {
      const response = await api.get(`/police/cases/${caseId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch police case details');
    }
  },

  updatePoliceCaseStatus: async (caseId, status, additionalData = {}) => {
    try {
      const response = await api.put(`/police/cases/${caseId}/status`, {
        status: status,
        ...additionalData
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update police case status');
    }
  },

  addPoliceEvidence: async (caseId, evidenceData) => {
    try {
      const response = await api.post(`/police/cases/${caseId}/evidence`, evidenceData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add police evidence');
    }
  },

  // Admin APIs for police management
  getPoliceOfficers: async () => {
    try {
      const response = await api.get('/admin/police-officers');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch police officers');
    }
  },

  assignCaseToPolice: async (caseId, policeId, policeName) => {
    try {
      const response = await api.put(`/admin/cases/${caseId}/assign-police`, {
        policeId: policeId,
        policeName: policeName
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to assign case to police');
    }
  },

  // Get admin dashboard data
  getAdminDashboard: async () => {
    try {
      const response = await api.get('/admin/dashboard-stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admin dashboard data');
    }
  },

  // Get detailed case information
  getCaseDetails: async (caseId) => {
    try {
      const response = await api.get(`/cases/${caseId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch case details');
    }
  },

  // Get admin case details
  getAdminCaseDetails: async (caseId) => {
    try {
      const response = await api.get(`/admin/cases/${caseId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admin case details');
    }
  },

  // Update case status
  updateCaseStatus: async (caseId, status, comment) => {
    try {
      const response = await api.put(`/cases/${caseId}/status`, { status, adminComment: comment });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update case status');
    }
  },

  // Add case comment
  addCaseComment: async (caseId, comment) => {
    try {
      const response = await api.post(`/cases/${caseId}/comment`, { comment });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add comment');
    }
  },

  // Admin stage action
  performStageAction: async (caseId, action, stage, comment) => {
    try {
      console.log('API: performStageAction called with:', { caseId, action, stage, comment });
      const response = await api.post(`/cases/${caseId}/stage-action`, {
        action,
        stage,
        comment
      });
      console.log('API: performStageAction response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: performStageAction error:', error);
      console.error('API: Error response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to perform stage action');
    }
  },

  // Scammer management
  createScammer: async (scammerData) => {
    try {
      console.log('API: Creating scammer with data:', scammerData);
      const response = await api.post('/scammers/create', scammerData);
      console.log('API: Scammer creation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Scammer creation error:', error);
      console.error('API: Error response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to create scammer profile');
    }
  },

  searchScammers: async (query) => {
    try {
      const response = await api.get(`/scammers/search/${query}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to search scammers');
    }
  },

  getScammerDetails: async (scammerId) => {
    try {
      const response = await api.get(`/scammers/${scammerId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get scammer details');
    }
  },


  generate91CrPC: async (caseId, scammerId) => {
    try {
      const response = await api.post('/email/generate-91crpc', {
        caseId,
        scammerId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate 91 CrPC document');
    }
  },

  getCaseEmails: async (caseId) => {
    try {
      const response = await api.get(`/email/case/${caseId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get case emails');
    }
  }
};

// Helper function to create comprehensive form data structure
export const createFormDataStructure = (formData) => {
  console.log('=== createFormDataStructure DEBUG ===');
  console.log('Input formData:', JSON.stringify(formData, null, 2));
  console.log('firstName:', formData.firstName);
  console.log('streetAddress:', formData.streetAddress);
  console.log('dateOfBirth:', formData.dateOfBirth);
  console.log('=====================================');

  return {
    caseType: formData.scamType || formData.caseType || 'Other',
    description: formData.incidentDescription || formData.description || '',
    amount: Number(String(formData.moneyLost || formData.financialLoss || '0').replace(/[₹,\s]/g, '')) || 0,
    incidentDate: formData.incidentDate || new Date().toISOString().split('T')[0],
    location: {
      state: formData.state || formData.incidentState || 'Unknown',
      city: formData.city || formData.incidentCity || 'Unknown',
      address: formData.streetAddress || formData.incidentStreet || 'Unknown'
    },
    contactInfo: {
      email: formData.email || '',
      phone: formData.phone || formData.primaryPhone || '',
      alternatePhone: formData.alternatePhone || ''
    },
    evidence: [],
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
        suspectInfo: [
          formData.scammerName || '',
          formData.scammerPhone || '',
          formData.scammerEmail || '',
          formData.scammerWebsite || '',
          formData.scammerBankAccount || ''
        ].filter(Boolean).join(' ')
      },
      financialInfo: {
        amountLost: Number(String(formData.moneyLost || '0').replace(/[₹,\s]/g, '')) || 0,
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
      },
      scammerInfo: {
        name: formData.scammerName || '',
        phoneNumber: formData.scammerPhone || '',
        email: formData.scammerEmail || '',
        upiId: formData.scammerUPI || '',
        bankAccount: formData.scammerBankAccount || '',
        ifscCode: formData.scammerIFSC || '',
        address: formData.scammerAddress || '',
        website: formData.scammerWebsite || '',
        socialMedia: formData.scammerSocialMedia || '',
        otherDetails: formData.scammerOtherDetails || ''
      }
    }
  };
};

// Helper function to validate form data
export const validateFormData = (formData) => {
  const errors = [];

  // Personal Information
  if (!formData.firstName?.trim()) errors.push('First name is required');
  if (!formData.lastName?.trim()) errors.push('Last name is required');
  if (!formData.dateOfBirth) errors.push('Date of birth is required');
  if (!formData.gender) errors.push('Gender is required');
  if (!formData.nationality?.trim()) errors.push('Nationality is required');

  // Contact Information
  if (!formData.email?.trim()) errors.push('Email is required');
  if (!formData.primaryPhone?.trim()) errors.push('Phone number is required');

  // Government IDs
  if (!formData.aadhaarNumber?.trim()) errors.push('Aadhaar number is required');
  if (!formData.panNumber?.trim()) errors.push('PAN number is required');

  // Incident Information
  if (!formData.incidentDate) errors.push('Incident date is required');
  if (!formData.scamType) errors.push('Scam type is required');
  if (!formData.incidentDescription?.trim()) errors.push('Incident description is required');
  if (!formData.communicationMethod) errors.push('Communication method is required');

  // Scammer Information
  if (!formData.scammerName?.trim()) errors.push('Scammer name is required');
  if (!formData.scammerPhone?.trim()) errors.push('Scammer phone is required');
  if (!formData.scammerEmail?.trim()) errors.push('Scammer email is required');

  // Financial Information
  const amount = Number(String(formData.moneyLost || formData.financialLoss || '0').replace(/[₹,\s]/g, '')) || 0;
  if (amount <= 0) errors.push('Amount lost is required and must be greater than 0');

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to check if profile is complete
export const hasCompleteProfile = (profile) => {
  if (!profile) return false;

  return !!(
    profile.personalInfo?.firstName &&
    profile.personalInfo?.lastName &&
    profile.contactInfo?.email &&
    profile.contactInfo?.phone &&
    (profile.governmentIds?.aadhaarNumber || profile.governmentIds?.panNumber)
  );
};

export default userProfilesAPI;
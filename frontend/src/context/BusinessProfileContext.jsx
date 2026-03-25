import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BusinessProfileContext = createContext(null);

export const useBusinessProfile = () => {
  const context = useContext(BusinessProfileContext);
  if (!context) {
    throw new Error('useBusinessProfile must be used within a BusinessProfileProvider');
  }
  return context;
};

export const BusinessProfileProvider = ({ children, user }) => {
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const [profileRes, summaryRes] = await Promise.all([
        axios.get(`${API}/profile`),
        axios.get(`${API}/profile/summary`)
      ]);
      setProfile(profileRes.data);
      setSummary(summaryRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateSection = async (section, data) => {
    try {
      const response = await axios.put(`${API}/profile`, {
        section,
        data
      });
      setProfile(response.data);
      // Refresh summary after update
      const summaryRes = await axios.get(`${API}/profile/summary`);
      setSummary(summaryRes.data);
      return response.data;
    } catch (err) {
      console.error('Error updating profile section:', err);
      throw err;
    }
  };

  const updateOnboardingStep = async (step, completed = false) => {
    try {
      const response = await axios.put(`${API}/profile/onboarding-step`, {
        step,
        completed
      });
      setProfile(prev => ({
        ...prev,
        onboarding_step: step,
        onboarding_completed: completed
      }));
      return response.data;
    } catch (err) {
      console.error('Error updating onboarding step:', err);
      throw err;
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  // Helper getters for common data
  const getRestaurantName = () => profile?.concept?.restaurant_name || 'Your Restaurant';
  const getConceptType = () => profile?.concept?.concept_type || '';
  const getLocation = () => {
    const loc = profile?.location || {};
    if (loc.city && loc.state) return `${loc.city}, ${loc.state}`;
    return loc.address || '';
  };
  const getTotalBudget = () => profile?.financial?.total_budget || 0;
  const getTargetOpenDate = () => profile?.operational?.target_open_date || '';
  const isOnboardingComplete = () => profile?.onboarding_completed || false;

  const value = {
    profile,
    summary,
    loading,
    error,
    updateSection,
    updateOnboardingStep,
    refreshProfile,
    getRestaurantName,
    getConceptType,
    getLocation,
    getTotalBudget,
    getTargetOpenDate,
    isOnboardingComplete
  };

  return (
    <BusinessProfileContext.Provider value={value}>
      {children}
    </BusinessProfileContext.Provider>
  );
};

export default BusinessProfileContext;

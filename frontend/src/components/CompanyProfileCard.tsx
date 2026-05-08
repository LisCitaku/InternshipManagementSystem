import { useEffect, useState } from 'react';
import { Building2, Globe, MapPin, Loader, RefreshCw } from 'lucide-react';
import type { Company } from '@/types';
import { lookupsApi } from '@/api/lookupsApi';

interface CompanyProfileCardProps {
  showLink?: boolean;
  onCompanyUpdate?: (company: Company) => void;
}

export function CompanyProfileCard({ showLink = false, onCompanyUpdate }: CompanyProfileCardProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const loadCompany = async () => {
    try {
      setLoading(true);
      const response = await lookupsApi.myCompany();
      if (response.data.data) {
        setCompany(response.data.data);
        onCompanyUpdate?.(response.data.data);
      } else {
        setError('No company found');
      }
    } catch (err) {
      setError('Failed to load company profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCompany();
    setRefreshing(false);
  };

  useEffect(() => {
    loadCompany();
  }, []);

  useEffect(() => {
    // Listen for company profile updates via custom event
    const handleCompanyUpdate = (event: CustomEvent) => {
      const updatedCompany = event.detail;
      setCompany(updatedCompany);
      onCompanyUpdate?.(updatedCompany);
    };

    window.addEventListener('company-profile-updated', handleCompanyUpdate as EventListener);

    return () => {
      window.removeEventListener('company-profile-updated', handleCompanyUpdate as EventListener);
    };
  }, [onCompanyUpdate]);

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-center gap-2">
          <Loader className="animate-spin" size={20} />
          <span className="text-sm text-ink-600 dark:text-ink-300">Loading company profile...</span>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return null;
  }

  return (
    <div className="glass-panel rounded-2xl p-5 border border-sky-500/20 bg-gradient-to-br from-sky-50/50 to-transparent dark:from-sky-500/5 dark:to-transparent">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="rounded-lg bg-sky-500/10 p-3">
            <Building2 size={24} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-ink-950 dark:text-white">{company.name}</h3>
              {company.isVerified && (
                <div className="px-2 py-0.5 rounded-full bg-mint-100 dark:bg-mint-500/20 text-xs font-semibold text-mint-700 dark:text-mint-300">
                  Verified
                </div>
              )}
            </div>
            {company.description && (
              <p className="mt-1 text-sm text-ink-600 dark:text-ink-300 line-clamp-2">{company.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {company.location && (
                <div className="flex items-center gap-1.5 text-ink-600 dark:text-ink-300">
                  <MapPin size={16} className="flex-shrink-0" />
                  <span>{company.location}</span>
                </div>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 hover:underline"
                >
                  <Globe size={16} className="flex-shrink-0" />
                  <span>Visit website</span>
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-ink-600 dark:text-ink-300 hover:bg-sky-500/10 rounded-lg transition disabled:opacity-50"
            title="Refresh company profile"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          {showLink && (
            <a
              href="/recruiter/company-profile"
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap"
            >
              Edit →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

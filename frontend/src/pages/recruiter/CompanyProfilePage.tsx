import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Input } from '@/components/Input';
import { SectionHeader } from '@/components/SectionHeader';
import { Button } from '@/components/Button';
import { lookupsApi } from '@/api/lookupsApi';
import type { Company } from '@/types';

export default function CompanyProfilePage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    location: '',
    description: '',
  });

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const response = await lookupsApi.myCompany();
        if (response.data.data) {
          const comp = response.data.data;
          setCompany(comp);
          setFormData({
            name: comp.name || '',
            website: comp.website || '',
            location: comp.location || '',
            description: comp.description || '',
          });
        }
      } catch (err) {
        console.error('Failed to load company profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, []);

  useEffect(() => {
    const refreshCompany = () => {
      void lookupsApi.myCompany().then((response) => {
        if (response.data.data) {
          const comp = response.data.data;
          setCompany(comp);
          setFormData({
            name: comp.name || '',
            website: comp.website || '',
            location: comp.location || '',
            description: comp.description || '',
          });
        }
      });
    };

    window.addEventListener('workspace.updated', refreshCompany as EventListener);
    window.addEventListener('dashboard.updated', refreshCompany as EventListener);

    return () => {
      window.removeEventListener('workspace.updated', refreshCompany as EventListener);
      window.removeEventListener('dashboard.updated', refreshCompany as EventListener);
    };
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await lookupsApi.updateMyCompany({
        name: formData.name,
        website: formData.website,
        location: formData.location,
        description: formData.description,
      });

      const updatedCompany = response.data.data;
      setCompany(updatedCompany);
      setFormData({
        name: updatedCompany.name || '',
        website: updatedCompany.website || '',
        location: updatedCompany.location || '',
        description: updatedCompany.description || '',
      });
      toast.success('Company changes saved.');

      window.dispatchEvent(
        new CustomEvent('company-profile-updated', {
          detail: updatedCompany,
        })
      );
      window.dispatchEvent(new CustomEvent('workspace.updated', { detail: updatedCompany }));
    } catch (err) {
      console.error('Failed to save company profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const response = await lookupsApi.createMyCompany({
        name: formData.name,
        website: formData.website,
        location: formData.location,
        description: formData.description,
      });
      const createdCompany = response.data.data;
      setCompany(createdCompany);
      toast.success('Company created successfully.');
      window.dispatchEvent(new CustomEvent('company-profile-updated', { detail: createdCompany }));
      window.dispatchEvent(new CustomEvent('workspace.updated', { detail: createdCompany }));
    } catch (err) {
      console.error('Failed to create company:', err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <SectionHeader title="Company profile" description="Loading..." />
        <div className="glass-panel rounded-lg p-8 text-center">Loading company profile...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-5">
        <SectionHeader title="Company profile" description="Create your company or ask admin to link an existing one." />
        <div className="glass-panel grid gap-5 rounded-3xl p-5 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-4">
            <Input label="Company name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
            <Input label="Website" type="url" value={formData.website} onChange={(e) => handleInputChange('website', e.target.value)} placeholder="https://example.com" />
            <Input label="Location" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} placeholder="City / Remote" />
            <label className="flex flex-col gap-2 text-sm text-ink-700 dark:text-ink-200">
              <span className="font-medium">About</span>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={5}
                className="rounded-2xl border border-black/8 bg-white px-4 py-3 outline-none transition focus:border-sky-500/40 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-white/6"
              />
            </label>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleCreate} disabled={creating || !formData.name.trim()} className="flex-1">
                {creating ? 'Creating...' : 'Create company'}
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
              <div className="text-sm font-semibold">Need an existing company?</div>
              <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-300">
                Ask an admin to link your recruiter account to a company record already in the system.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Company profile"
        description="Shape the recruiting presence students see before they apply. Changes are reflected live across the platform."
      />
      <div className="glass-panel grid gap-5 rounded-3xl p-5 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4">
          <Input
            label="Company name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
          <Input
            label="Website"
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="https://example.com"
          />
          <Input
            label="Location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="City / Remote"
          />
          <label className="flex flex-col gap-2 text-sm text-ink-700 dark:text-ink-200">
            <span className="font-medium">About</span>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={5}
              className="rounded-2xl border border-black/8 bg-white px-4 py-3 outline-none transition focus:border-sky-500/40 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-white/6"
            />
          </label>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
            <div className="text-sm font-semibold">Brand assets</div>
            <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-300">Keep the recruiting page recognizable and clean.</p>
          </div>
          {company.isVerified && (
            <div className="rounded-3xl border border-mint-200 dark:border-mint-500/30 bg-mint-50 dark:bg-mint-500/10 p-4">
              <div className="text-xs font-semibold text-mint-700 dark:text-mint-400 uppercase">Verified Company</div>
              <p className="mt-2 text-xs leading-5 text-mint-600 dark:text-mint-300">Your company has been verified by our team.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

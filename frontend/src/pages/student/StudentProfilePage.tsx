import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { profileApi } from '@/api/profileApi';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Loader } from '@/components/Loader';
import { SectionHeader } from '@/components/SectionHeader';
import type { CurrentUserProfileDto } from '@/types';
import { getProfileCompletion } from '@/utils/studentInsights';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5112';

const emptyProfile: CurrentUserProfileDto = {
  userId: '',
  email: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  roles: ['Student'],
  university: '',
  fieldOfStudy: '',
  headline: '',
  bio: '',
  avatarUrl: null,
  avatarFileName: null,
  cvUrl: null,
  cvFileName: null,
};

const resolveAssetUrl = (url?: string | null) => {
  if (!url) {
    return null;
  }

  return url.startsWith('http') ? url : `${API_URL}${url}`;
};

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<CurrentUserProfileDto>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cvPreview, setCvPreview] = useState<string | null>(null);
  const [cvPreviewName, setCvPreviewName] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void profileApi
      .getMine()
      .then((response) => {
        if (response.data.data) {
          setProfile(response.data.data);
        }
      })
      .catch(() => {
        setProfile(emptyProfile);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      if (cvPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(cvPreview);
      }
    };
  }, [avatarPreview, cvPreview]);

  const initials = useMemo(() => `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() || 'U', [profile.firstName, profile.lastName]);
  const avatarUrl = avatarPreview ?? resolveAssetUrl(profile.avatarUrl);
  const cvUrl = cvPreview ?? resolveAssetUrl(profile.cvUrl);
  const profileCompletion = useMemo(() => getProfileCompletion(profile), [profile]);

  const updateField = (field: keyof CurrentUserProfileDto, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const response = await profileApi.updateMine({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber || null,
        university: profile.university,
        fieldOfStudy: profile.fieldOfStudy,
        headline: profile.headline,
        bio: profile.bio,
      });

      if (response.data.data) {
        setProfile(response.data.data);
      }

      toast.success('Profile saved successfully.');
    } finally {
      setSaving(false);
    }
  };

  const selectAvatar = () => avatarInputRef.current?.click();
  const selectCv = () => cvInputRef.current?.click();

  const uploadAvatar = async (file: File | null | undefined) => {
    if (!file) {
      return;
    }

    if (avatarPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    setUploadingAvatar(true);
    try {
      const response = await profileApi.uploadAvatar(file);
      if (response.data.data) {
        setProfile(response.data.data);
        setAvatarPreview(null);
      }
      toast.success('Avatar uploaded.');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const uploadCv = async (file: File | null | undefined) => {
    if (!file) {
      return;
    }

    if (cvPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(cvPreview);
    }

    const localPreview = URL.createObjectURL(file);
    setCvPreview(localPreview);
    setCvPreviewName(file.name);
    setUploadingCv(true);
    try {
      const response = await profileApi.uploadCv(file);
      if (response.data.data) {
        setProfile(response.data.data);
        setCvPreview(null);
        setCvPreviewName(null);
      }
      toast.success('CV uploaded.');
    } finally {
      setUploadingCv(false);
      if (cvInputRef.current) {
        cvInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return <Loader label="Loading your profile..." />;
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Profile"
        description="These fields are now saved on the backend, so your student profile stays in sync across refreshes."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="glass-panel rounded-3xl p-5 lg:p-6">
          <div className="grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)]">
            <div className="rounded-3xl border border-black/6 bg-white/55 p-5 text-center dark:border-white/8 dark:bg-white/[0.03]">
              <div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500/20 to-mint-500/20 text-3xl font-semibold text-ink-950 dark:text-white">
                {avatarUrl ? <img src={avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" /> : initials}
              </div>
              <div className="mt-4 text-lg font-semibold text-ink-950 dark:text-white">
                {profile.firstName} {profile.lastName}
              </div>
              <div className="text-sm text-ink-600 dark:text-ink-300">{profile.email}</div>
              <div className="mt-4 rounded-2xl bg-black/[0.03] px-4 py-3 text-left dark:bg-white/[0.03]">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">Connected profile</div>
                <div className="mt-2 text-sm font-semibold text-ink-950 dark:text-white">Saved on backend</div>
                <p className="mt-2 text-xs leading-5 text-ink-600 dark:text-ink-300">
                  Name, phone, university, field of study, headline, bio, avatar, and CV persist after refresh.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First name" value={profile.firstName} onChange={(event) => updateField('firstName', event.target.value)} className="rounded-2xl" />
              <Input label="Last name" value={profile.lastName} onChange={(event) => updateField('lastName', event.target.value)} className="rounded-2xl" />
              <Input label="Email" value={profile.email} readOnly className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.04]" />
              <Input label="Phone number" value={profile.phoneNumber ?? ''} onChange={(event) => updateField('phoneNumber', event.target.value)} className="rounded-2xl" />
              <Input label="University" value={profile.university} onChange={(event) => updateField('university', event.target.value)} className="rounded-2xl" />
              <Input label="Field of study" value={profile.fieldOfStudy} onChange={(event) => updateField('fieldOfStudy', event.target.value)} className="rounded-2xl" />
              <Input label="Headline" value={profile.headline} onChange={(event) => updateField('headline', event.target.value)} className="rounded-2xl sm:col-span-2" />
              <label className="flex flex-col gap-2 text-sm text-ink-700 dark:text-ink-200 sm:col-span-2">
                <span className="font-medium">Bio</span>
                <textarea
                  value={profile.bio}
                  onChange={(event) => updateField('bio', event.target.value)}
                  rows={6}
                  placeholder="Tell recruiters what you want to work on."
                  className="rounded-2xl border border-black/8 bg-white px-4 py-3 outline-none transition focus:border-sky-500/40 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-white/6"
                />
              </label>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Profile assets</div>
                  <p className="mt-1 text-sm leading-6 text-ink-600 dark:text-ink-300">
                    Upload the avatar and CV that recruiters will see.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                <button
                  type="button"
                  onClick={selectAvatar}
                  className="flex items-center gap-3 rounded-3xl border border-dashed border-black/12 bg-black/[0.02] px-4 py-5 text-left transition hover:border-sky-500/30 hover:bg-sky-500/[0.03] dark:border-white/12 dark:bg-white/[0.03]"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500/12 text-sky-700 dark:text-sky-200">
                    <ImageIcon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">Upload avatar</div>
                    <div className="truncate text-xs text-ink-500 dark:text-ink-300">
                      {profile.avatarFileName ?? avatarPreview ? 'Preview ready' : 'PNG, JPG, or WEBP'}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={selectCv}
                  className="flex items-center gap-3 rounded-3xl border border-dashed border-black/12 bg-black/[0.02] px-4 py-5 text-left transition hover:border-sky-500/30 hover:bg-sky-500/[0.03] dark:border-white/12 dark:bg-white/[0.03]"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-mint-500/12 text-mint-700 dark:text-mint-200">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">Upload CV</div>
                    <div className="truncate text-xs text-ink-500 dark:text-ink-300">
                      {profile.cvFileName ?? cvPreviewName ?? 'PDF, DOC, or DOCX'}
                    </div>
                  </div>
                </button>
              </div>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void uploadAvatar(event.target.files?.[0] ?? null)}
              />
              <input
                ref={cvInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(event) => void uploadCv(event.target.files?.[0] ?? null)}
              />
            </div>

            <div className="rounded-3xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
              <div className="text-sm font-semibold">Public profile preview</div>
              <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-300">
                This is the summary recruiters will scan first.
              </p>
              <div className="mt-4 space-y-3">
                {[
                  ['Name', `${profile.firstName} ${profile.lastName}`.trim() || '—'],
                  ['Email', profile.email || '—'],
                  ['University', profile.university || 'Not added yet'],
                  ['Field', profile.fieldOfStudy || 'Not added yet'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl bg-black/[0.03] px-4 py-3 text-sm dark:bg-white/[0.03]">
                    <span className="text-ink-600 dark:text-ink-300">{label}</span>
                    <span className="font-semibold text-ink-950 dark:text-white">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">Avatar preview</div>
                  <div className="mt-3 overflow-hidden rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar preview" className="h-44 w-full object-cover" />
                    ) : (
                      <div className="grid h-44 place-items-center text-sm text-ink-500 dark:text-ink-300">No avatar uploaded yet.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">CV preview</div>
                  <div className="mt-3 flex items-center gap-3 rounded-2xl bg-black/[0.03] px-4 py-4 dark:bg-white/[0.03]">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-mint-500/12 text-mint-700 dark:text-mint-200">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink-950 dark:text-white">
                        {profile.cvFileName ?? cvPreviewName ?? 'No CV uploaded yet'}
                      </div>
                      <div className="text-xs text-ink-500 dark:text-ink-300">PDF / DOC / DOCX</div>
                    </div>
                    {cvUrl ? (
                      <a
                        href={cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-sky-500/12 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-200"
                      >
                        Open
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setProfile(emptyProfile)}>
              Reset
            </Button>
            <Button type="button" onClick={() => void saveProfile()} disabled={saving}>
              {saving ? 'Saving...' : 'Save profile'}
            </Button>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="glass-panel rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">Profile progress</div>
                <div className="mt-2 text-2xl font-semibold text-ink-950 dark:text-white">{profileCompletion.score}%</div>
              </div>
              <div className="rounded-full border border-sky-500/15 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-200">
                {profileCompletion.completed}/{profileCompletion.total}
              </div>
            </div>

            <div className="mt-4 h-2 rounded-full bg-black/6 dark:bg-white/10">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-mint-500 transition-all"
                style={{ width: `${profileCompletion.score}%` }}
              />
            </div>

            <p className="mt-3 text-sm leading-6 text-ink-600 dark:text-ink-300">
              A more complete profile helps recruiters understand you faster and improves recommendations.
            </p>

            {profileCompletion.missing.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {profileCompletion.missing.slice(0, 5).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-black/6 bg-black/[0.03] px-2.5 py-1 text-[11px] font-medium text-ink-600 dark:border-white/8 dark:bg-white/[0.04] dark:text-ink-200"
                  >
                    Missing {item}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-mint-500/15 bg-mint-500/10 px-4 py-3 text-sm text-mint-700 dark:text-mint-200">
                Your profile looks complete.
              </div>
            )}
          </div>

          <div className="glass-panel rounded-3xl p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-600">Profile tips</div>
            <div className="mt-3 space-y-3 text-sm leading-6 text-ink-600 dark:text-ink-300">
              <p>Fill the field of study exactly as you want it shown.</p>
              <p>Keep the headline short and specific.</p>
              <p>Upload a clean CV PDF and a square avatar.</p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">Current account</div>
            <div className="mt-3 space-y-3 text-sm leading-6 text-ink-600 dark:text-ink-300">
              <div className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">Role</div>
                <div className="mt-2 font-semibold text-ink-950 dark:text-white">{profile.roles[0] ?? 'Student'}</div>
              </div>
              <div className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">User ID</div>
                <div className="mt-2 break-all font-mono text-xs text-ink-800 dark:text-ink-100">{profile.userId || '—'}</div>
              </div>
              {uploadingAvatar || uploadingCv ? (
                <div className="rounded-2xl border border-sky-500/15 bg-sky-500/10 p-4 text-sm text-sky-700 dark:text-sky-200">
                  {uploadingAvatar ? 'Uploading avatar...' : 'Uploading CV...'}
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

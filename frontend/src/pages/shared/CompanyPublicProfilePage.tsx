import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Building2, Globe, MapPin, ArrowLeft, BriefcaseBusiness } from 'lucide-react';
import { lookupsApi } from '@/api/lookupsApi';
import { internshipsApi } from '@/api/internshipsApi';
import { Button } from '@/components/Button';
import { Loader } from '@/components/Loader';
import { SectionHeader } from '@/components/SectionHeader';
import { Table } from '@/components/Table';
import type { Company, Internship } from '@/types';
import { getOpportunityCapacityLabel, isOpportunityOpen } from '@/utils/internshipCapacity';

export default function CompanyPublicProfilePage() {
  const { companyId = '' } = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      setLoading(true);
      try {
        const [companyResponse, internshipsResponse] = await Promise.all([
          lookupsApi.companies(),
          internshipsApi.list({ pageNumber: 1, pageSize: 100, companyId, includeInactive: true, descending: true }),
        ]);

        const companyList = companyResponse.data.data?.items ?? [];
        setCompany(companyList.find((item) => item.id === companyId) ?? null);
        setInternships(internshipsResponse.data.data?.items ?? []);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      void loadCompany();
    }
  }, [companyId]);

  if (loading) {
    return <Loader label="Loading company profile..." />;
  }

  if (!company) {
    return (
      <div className="space-y-5">
        <SectionHeader title="Company profile" description="This company could not be found." />
        <div className="glass-panel rounded-3xl p-6">
          <Link to="/student/saved-jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 dark:text-sky-300">
            <ArrowLeft size={16} />
            Back to opportunities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Company profile"
        description="A quick look at the employer behind this opportunity."
        action={
          <Link to="/student/saved-jobs">
            <Button variant="ghost" className="inline-flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to opportunities
            </Button>
          </Link>
        }
      />

      <div className="glass-panel grid gap-5 rounded-3xl p-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-500/12 text-sky-600 dark:text-sky-300">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-3xl font-semibold tracking-tight text-ink-950 dark:text-white">{company.name}</h2>
                {company.isVerified ? (
                  <span className="rounded-full border border-mint-400/20 bg-mint-500/10 px-3 py-1 text-xs font-semibold text-mint-700 dark:text-mint-200">
                    Verified
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-600 dark:text-ink-300">
                {company.location ? (
                  <div className="inline-flex items-center gap-1.5">
                    <MapPin size={16} />
                    <span>{company.location}</span>
                  </div>
                ) : null}
                {company.website ? (
                  <a href={company.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sky-600 hover:underline dark:text-sky-300">
                    <Globe size={16} />
                    <span>Visit website</span>
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {company.description ? (
            <div className="rounded-3xl border border-black/6 bg-black/[0.02] p-5 text-sm leading-7 text-ink-700 dark:border-white/8 dark:bg-white/[0.03] dark:text-ink-200">
              {company.description}
            </div>
          ) : null}
        </div>

          <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Active opportunities', String(internships.filter((item) => isOpportunityOpen(item)).length)],
            ['Total opportunities', String(internships.length)],
            ['Open positions', String(internships.filter((item) => isOpportunityOpen(item)).length)],
            ['Capacity spots', String(internships.reduce((sum, item) => sum + Math.max(item.maxApplicants - item.currentApplicants, 0), 0))],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-black/6 bg-white/55 p-4 dark:border-white/8 dark:bg-white/[0.03]">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-300">{label}</div>
              <div className="mt-2 text-2xl font-semibold text-ink-950 dark:text-white">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-ink-950 dark:text-white">Active opportunities</h3>
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">Opportunities from this company that are still visible to students.</p>
          </div>
          <BriefcaseBusiness className="text-sky-500" size={18} />
        </div>

        <div className="mt-5">
          <Table
            data={internships.filter((item) => isOpportunityOpen(item))}
            columns={[
              { key: 'title', header: 'Role' },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <div className="space-y-1">
                    <div>{row.status}</div>
                    <div className="text-xs text-ink-500 dark:text-ink-300">{getOpportunityCapacityLabel(row)}</div>
                  </div>
                ),
              },
              { key: 'location', header: 'Location' },
              {
                key: 'deadlineAt',
                header: 'Deadline',
                render: (row) => (row.deadlineAt ? new Date(row.deadlineAt).toLocaleDateString() : '-'),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

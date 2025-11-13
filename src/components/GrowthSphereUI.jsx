import { useEffect, useState } from 'react'
import Spline from '@splinetool/react-spline'

const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function InfoBadge({ children }) {
  return (
    <div className="text-xs rounded-full bg-blue-50 text-blue-700 px-2 py-1 border border-blue-100">
      {children}
    </div>
  )
}

function Card({ title, subtitle, children, right }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-100">
      <div className="flex items-start justify-between p-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {right}
      </div>
      <div className="px-4 pb-4 pt-0">{children}</div>
    </div>
  )
}

function LabeledField({ label, help, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {help && <p className="text-xs text-gray-500">{help}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function Input({ disabled, ...props }) {
  return (
    <input
      {...props}
      disabled={disabled}
      className={`w-full text-sm rounded-md border px-3 py-2 outline-none transition focus:ring-2 focus:ring-blue-200 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 ${
        props.className || ''
      }`}
    />
  )
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full text-sm rounded-md border px-3 py-2 outline-none transition focus:ring-2 focus:ring-blue-200 focus:border-blue-500 ${
        props.className || ''
      }`}
    >
      {children}
    </select>
  )
}

const regions = ['US', 'UK', 'EU', 'MENA', 'APAC', 'Other']
const orgTypes = [
  'Public pension',
  'Corporate pension',
  'Endowment',
  'Foundation',
  'Family office',
  'Sovereign wealth fund',
  'Insurance',
  'Fund-of-funds',
  'Other',
]

function EligibilityToggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        {['Eligible', 'Not eligible'].map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`text-xs px-2.5 py-1 rounded-md border transition ${
              value === opt
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function SectorMultiSelect({ value, onChange }) {
  const sectors = [
    'Software',
    'Fintech',
    'Healthcare',
    'Energy',
    'Industrial',
    'Consumer',
    'Climate',
    'Deep Tech',
    'Real Assets',
  ]

  const selected = new Set(value)

  function toggle(item) {
    const next = new Set(selected)
    if (next.has(item)) next.delete(item)
    else next.add(item)
    onChange(Array.from(next))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Choose as many sectors as required</p>
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span key={v} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-0.5">
              {v}
            </span>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {sectors.map((s) => {
          const active = selected.has(s)
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={`flex items-center gap-3 w-full text-left rounded-lg border p-3 transition shadow-sm hover:shadow ${
                active
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
            >
              <span
                className={`h-4 w-4 rounded border flex items-center justify-center ${
                  active ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}
              >
                {active && <span className="h-2 w-2 bg-white rounded-sm" />}
              </span>
              <span className="text-sm text-gray-800">{s}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function GrowthSphereUI() {
  const [program, setProgram] = useState({
    organization_name: '',
    organization_type: 'Public pension',
    organization_type_other: '',
    website: '',
    primary_contact: { name: '', title: '', email: '', phone: '' },
    domicile_region: 'US',
    regulatory_flags: { ERISA: false, AIFMD: false, SFDR_Art_8_9: false, FOIA: false, Other: '' },
    marketing_eligibility: { NA: 'Eligible', EU: 'Eligible', UK: 'Eligible', APAC: 'Eligible' },
  })
  const [creating, setCreating] = useState(false)
  const [createdProgram, setCreatedProgram] = useState(null)

  const [strategy, setStrategy] = useState({
    program_id: '',
    metadata: { name: '', notes: '' },
    sectors: [],
    overrides: {},
  })
  const [strategies, setStrategies] = useState([])

  async function submitProgram() {
    setCreating(true)
    try {
      const res = await fetch(`${baseUrl}/api/programs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(program),
      })
      const data = await res.json()
      setCreatedProgram(data)
      setStrategy((s) => ({ ...s, program_id: data.id }))
    } finally {
      setCreating(false)
    }
  }

  async function createStrategy() {
    const res = await fetch(`${baseUrl}/api/strategies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(strategy),
    })
    const data = await res.json()
    await loadStrategies()
    return data
  }

  async function loadStrategies() {
    if (!strategy.program_id) return
    const res = await fetch(`${baseUrl}/api/strategies?program_id=${strategy.program_id}`)
    const data = await res.json()
    setStrategies(data.items || [])
  }

  useEffect(() => {
    loadStrategies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategy.program_id])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Spline scene="https://prod.spline.design/41MGRk-UDPKO-l6W/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        </div>
        <div className="relative pointer-events-none bg-gradient-to-b from-white/80 to-white/40">
          <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24">
            <div className="max-w-2xl space-y-4">
              <InfoBadge>GrowthSphere</InfoBadge>
              <h1 className="text-3xl sm:text-5xl font-semibold text-slate-900 leading-tight">
                LP Program Profiles and Strategy Workflows
              </h1>
              <p className="text-slate-700 text-sm sm:text-base">
                These settings will be inherited by all Strategy Profiles. You may override specific fields.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 -mt-8 pb-24 space-y-6 relative z-10">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Organization Basics" subtitle="Clarity-first forms with structured fields">
              <div className="grid sm:grid-cols-2 gap-4">
                <LabeledField label="Organization name">
                  <Input value={program.organization_name} onChange={(e) => setProgram({ ...program, organization_name: e.target.value })} placeholder="e.g., CalSTRS" />
                </LabeledField>
                <LabeledField label="Organization type">
                  <Select value={program.organization_type} onChange={(e) => setProgram({ ...program, organization_type: e.target.value })}>
                    {orgTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                </LabeledField>
                {program.organization_type === 'Other' && (
                  <LabeledField label="Specify organization type">
                    <Input value={program.organization_type_other} onChange={(e) => setProgram({ ...program, organization_type_other: e.target.value })} />
                  </LabeledField>
                )}
                <LabeledField label="Website">
                  <Input value={program.website} onChange={(e) => setProgram({ ...program, website: e.target.value })} placeholder="https://" />
                </LabeledField>
                <LabeledField label="Primary contact – name">
                  <Input value={program.primary_contact.name} onChange={(e) => setProgram({ ...program, primary_contact: { ...program.primary_contact, name: e.target.value } })} />
                </LabeledField>
                <LabeledField label="Primary contact – title">
                  <Input value={program.primary_contact.title} onChange={(e) => setProgram({ ...program, primary_contact: { ...program.primary_contact, title: e.target.value } })} />
                </LabeledField>
                <LabeledField label="Primary contact – email">
                  <Input value={program.primary_contact.email} onChange={(e) => setProgram({ ...program, primary_contact: { ...program.primary_contact, email: e.target.value } })} />
                </LabeledField>
                <LabeledField label="Primary contact – phone">
                  <Input value={program.primary_contact.phone} onChange={(e) => setProgram({ ...program, primary_contact: { ...program.primary_contact, phone: e.target.value } })} />
                </LabeledField>
                <LabeledField label="HQ / Domicile region">
                  <Select value={program.domicile_region} onChange={(e) => setProgram({ ...program, domicile_region: e.target.value })}>
                    {regions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </Select>
                </LabeledField>
              </div>
            </Card>

            <Card title="Regulatory / policy flags">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ['ERISA', 'US retirement plan constraints'],
                  ['AIFMD', 'EU marketing directive'],
                  ['SFDR_Art_8_9', 'Sustainable Finance Disclosure'],
                  ['FOIA', 'Freedom of Information Act'],
                ].map(([key, help]) => (
                  <LabeledField key={key} label={key} help={help}>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={program.regulatory_flags[key]}
                        onChange={(e) => setProgram({ ...program, regulatory_flags: { ...program.regulatory_flags, [key]: e.target.checked } })}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-200"
                      />
                      <span className="text-sm text-gray-700">Enabled</span>
                    </div>
                  </LabeledField>
                ))}
                <LabeledField label="Other (optional)">
                  <Input value={program.regulatory_flags.Other}
                    onChange={(e) => setProgram({ ...program, regulatory_flags: { ...program.regulatory_flags, Other: e.target.value } })}
                    placeholder="Describe other flags"
                  />
                </LabeledField>
              </div>
            </Card>

            <Card title="Marketing eligibility by region" subtitle="Region eligibility determines where this fund can be marketed.">
              <div className="space-y-2">
                <EligibilityToggle label="North America" value={program.marketing_eligibility.NA} onChange={(v) => setProgram({ ...program, marketing_eligibility: { ...program.marketing_eligibility, NA: v } })} />
                <EligibilityToggle label="EU (AIFMD/NPPR)" value={program.marketing_eligibility.EU} onChange={(v) => setProgram({ ...program, marketing_eligibility: { ...program.marketing_eligibility, EU: v } })} />
                <EligibilityToggle label="United Kingdom" value={program.marketing_eligibility.UK} onChange={(v) => setProgram({ ...program, marketing_eligibility: { ...program.marketing_eligibility, UK: v } })} />
                <EligibilityToggle label="APAC" value={program.marketing_eligibility.APAC} onChange={(v) => setProgram({ ...program, marketing_eligibility: { ...program.marketing_eligibility, APAC: v } })} />
              </div>
            </Card>

            <div className="flex items-center gap-3">
              <button onClick={submitProgram} disabled={creating} className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                {creating ? 'Saving…' : 'Save Program Profile'}
              </button>
              {createdProgram?.id && (
                <InfoBadge>Saved • ID {createdProgram.id}</InfoBadge>
              )}
            </div>

            <Card title="Strategy Profile" subtitle="These settings will inherit defaults; override if needed.">
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <LabeledField label="Strategy name">
                    <Input value={strategy.metadata.name} onChange={(e) => setStrategy({ ...strategy, metadata: { ...strategy.metadata, name: e.target.value } })} placeholder="e.g., Growth Equity" />
                  </LabeledField>
                  <LabeledField label="Notes">
                    <Input value={strategy.metadata.notes} onChange={(e) => setStrategy({ ...strategy, metadata: { ...strategy.metadata, notes: e.target.value } })} placeholder="Optional" />
                  </LabeledField>
                </div>
                <LabeledField label="Sectors">
                  <SectorMultiSelect value={strategy.sectors} onChange={(v) => setStrategy({ ...strategy, sectors: v })} />
                </LabeledField>
                <div className="flex items-center gap-3">
                  <button onClick={createStrategy} disabled={!strategy.program_id} className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-black disabled:opacity-60">
                    Create Strategy
                  </button>
                  <InfoBadge>Choose as many sectors as required</InfoBadge>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Programs" subtitle="Recently created">
              <button
                onClick={async () => {
                  const res = await fetch(`${baseUrl}/api/programs`)
                  const data = await res.json()
                  alert(`${data.items.length} program(s) loaded`)
                }}
                className="text-xs px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
              >
                Refresh
              </button>
              {createdProgram?.id && (
                <p className="text-xs text-gray-600 mt-3">These settings will be inherited by all Strategy Profiles. You may override specific fields.</p>
              )}
            </Card>

            <Card title="Strategies" subtitle="Linked to current program">
              <div className="space-y-2">
                {strategies.length === 0 && (
                  <p className="text-sm text-gray-500">No strategies yet.</p>
                )}
                {strategies.map((s) => (
                  <div key={s.id} className="rounded-lg border border-gray-200 p-3 bg-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.metadata?.name}</p>
                        <p className="text-xs text-gray-500">{s.sectors?.join(', ') || 'No sectors selected'}</p>
                      </div>
                      <InfoBadge>Strategy</InfoBadge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

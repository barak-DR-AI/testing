import { TabKey } from '@/types';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'capture', label: 'Capture' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'settings', label: 'Settings' },
];

export function TabBar({ activeTab, onChange }: { activeTab: TabKey; onChange: (tab: TabKey) => void }) {
  return (
    <nav className="tab-bar" aria-label="Bottom tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={activeTab === tab.key ? 'tab active' : 'tab'}
          onClick={() => onChange(tab.key)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

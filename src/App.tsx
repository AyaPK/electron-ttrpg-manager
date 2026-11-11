import { useAppStore } from './store/useAppStore'
import { Sidebar } from './components/Sidebar'
import { CampaignSelect } from './components/CampaignSelect'
import { CampaignOverview } from './components/CampaignOverview'
import { EntityList } from './components/EntityList'
import { EntityDetail } from './components/EntityDetail'
import { SettingsPanel } from './components/SettingsPanel'

function App() {
  const view = useAppStore((s) => s.view)

  const renderMain = () => {
    switch (view) {
      case 'campaign-select': return <CampaignSelect />
      case 'campaign-overview': return <CampaignOverview />
      case 'entity-list': return <EntityList />
      case 'entity-detail': return <EntityDetail />
      case 'settings': return <SettingsPanel />
      default: return <CampaignSelect />
    }
  }

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {view !== 'campaign-select' && <Sidebar />}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {renderMain()}
      </main>
    </div>
  )
}

export default App

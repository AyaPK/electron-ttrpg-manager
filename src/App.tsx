import { useAppStore } from './store/useAppStore'
import { AppSidebar } from './components/AppSidebar'
import { Sidebar } from './components/Sidebar'
import { CampaignSelect } from './components/CampaignSelect'
import { CampaignHub } from './components/CampaignHub'
import { EntityList } from './components/EntityList'
import { EntityDetail } from './components/EntityDetail'
import { SettingsPanel } from './components/SettingsPanel'

function App() {
  const view = useAppStore((s) => s.view)

  const renderMain = () => {
    switch (view) {
      case 'campaign-select': return <CampaignSelect />
      case 'campaign-overview': return <CampaignHub />
      case 'entity-list': return <EntityList />
      case 'entity-detail': return <EntityDetail />
      case 'settings': return <SettingsPanel />
      default: return <CampaignSelect />
    }
  }

  const showInnerSidebar = view === 'entity-list' || view === 'entity-detail' || view === 'settings'

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {view !== 'campaign-select' && <AppSidebar />}
      {showInnerSidebar && <Sidebar />}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {renderMain()}
      </main>
    </div>
  )
}

export default App

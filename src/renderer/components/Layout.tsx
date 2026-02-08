import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as ArcoLayout, Tabs, Button, PageHeader, Space } from '@arco-design/web-react';
import { IconSettings } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { SettingsModal } from './SettingsModal';

const { Header, Content } = ArcoLayout;
const TabPane = Tabs.TabPane;

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Map routes to tab keys
  const activeTab = location.pathname;

  const handleTabChange = (key: string) => {
    navigate(key);
  };

  return (
    <ArcoLayout >
      <Header>
        <PageHeader
          title={t('common.appName')}
          subTitle={<Tabs 
               activeTab={activeTab} 
               onChange={handleTabChange}
               type="text"
            >
                <TabPane key="/agents" title={t('nav.agents')} />
                <TabPane key="/skills" title={t('nav.skills')} />
                <TabPane key="/rules" title={t('nav.rules')} />
            </Tabs>
          }
          extra={
            <Button 
                icon={<IconSettings />} 
                type="text"
                onClick={() => setSettingsVisible(true)}
            >设置</Button>
          }
        />
      </Header>

      <Content className="p-0 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto pl-6 pr-6 pb-6">
          <Outlet />
        </div>
      </Content>
      
      <SettingsModal 
        visible={settingsVisible} 
        onCancel={() => setSettingsVisible(false)} 
      />
    </ArcoLayout>
  );
}

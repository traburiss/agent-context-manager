import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as ArcoLayout, Menu } from '@arco-design/web-react';
import { IconRobot, IconApps, IconFile } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';

const { Sider, Content } = ArcoLayout;
const MenuItem = Menu.Item;

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { key: '/agents', icon: <IconRobot />, label: t('nav.agents') },
    { key: '/skills', icon: <IconApps />, label: t('nav.skills') },
    { key: '/rules', icon: <IconFile />, label: t('nav.rules') }
  ];

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  return (
    <ArcoLayout style={{ height: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: collapsed ? 14 : 16,
            fontWeight: 600,
            borderBottom: '1px solid var(--color-border-2)'
          }}
        >
          {collapsed ? 'ACM' : t('common.appName')}
        </div>

        <Menu
          selectedKeys={[location.pathname]}
          onClickMenuItem={handleMenuClick}
          style={{ marginTop: 16 }}
        >
          {menuItems.map(item => (
            <MenuItem key={item.key} style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 8 }}>{item.icon}</span>
              {item.label}
            </MenuItem>
          ))}
        </Menu>

        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: collapsed ? 16 : 24,
            right: collapsed ? 16 : 24
          }}
        >
          {!collapsed && <LanguageSwitcher />}
        </div>
      </Sider>

      <Content style={{ padding: 24, overflow: 'auto' }}>
        <Outlet />
      </Content>
    </ArcoLayout>
  );
}

import { Modal, Tabs, Form, Radio, Button, Typography, Space, Message, Input } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { IconGithub, IconDownload, IconFolder } from '@arco-design/web-react/icon';
import { useStore } from '../stores/useStore';
import { SystemConfig } from '../../shared/types';

interface SettingsModalProps {
  visible: boolean;
  onCancel: () => void;
}

export function SettingsModal({ visible, onCancel }: SettingsModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { systemConfig, updateSystemConfig } = useStore();
  const [appVersion, setAppVersion] = useState<string>('');

  useEffect(() => {
    if (visible) {
      loadVersion();
      if (systemConfig) {
        form.setFieldsValue({
          language: systemConfig.language || 'zh-CN',
          theme: systemConfig.theme || 'system'
        });
      }
    }
  }, [visible, systemConfig]);

  const loadVersion = async () => {
    try {
      const version = await window.api['app:get-version']();
      setAppVersion(version);
    } catch (error) {
      console.error('Failed to load app version:', error);
    }
  };

  const handleBaseDirChange = async () => {
    const path = await window.api['app:select-directory']();
    if (path) {
      try {
        await updateSystemConfig({ baseDir: path });
        Message.success(t('settings.baseDirUpdated'));
      } catch (error) {
        console.error('Failed to update base dir:', error);
        Message.error(t('settings.updateError'));
      }
    }
  };

  const handleConfigChange = async (partialConfig: Partial<SystemConfig>) => {
    try {
       await updateSystemConfig(partialConfig);
       Message.success(t('settings.saved'));
    } catch (error) {
       console.error('Failed to save config:', error);
       Message.error(t('settings.saveError'));
    }
  }

  return (
    <Modal
      title={t('settings.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      className="w-[600px]"
    >
      <Tabs defaultActiveTab="general">
        <Tabs.TabPane key="general" title={t('settings.general')}>
          <Form
            form={form}
            layout="vertical"
            initialValues={systemConfig || {}}
            className="h-[320px] pt-4"
          >
             <Form.Item label={t('settings.baseDir')}>
                <Input
                    value={systemConfig?.baseDir}
                    suffix={<IconFolder className="cursor-pointer" onClick={handleBaseDirChange} />}
                    readOnly
                />
             </Form.Item>

             <Form.Item label={t('settings.theme')} field="theme">
                <Radio.Group
                  type="button"
                  onChange={(val) => handleConfigChange({ theme: val })}
                >
                  <Radio value="light">{t('settings.themeLight')}</Radio>
                  <Radio value="dark">{t('settings.themeDark')}</Radio>
                  <Radio value="system">{t('settings.themeSystem')}</Radio>
                </Radio.Group>
             </Form.Item>

             <Form.Item label={t('settings.language')} field="language">
                <Radio.Group
                  type="button"
                  onChange={(val) => handleConfigChange({ language: val })}
                >
                   <Radio value="zh-CN">简体中文</Radio>
                   <Radio value="en-US">English</Radio>
                </Radio.Group>
             </Form.Item>
          </Form>
        </Tabs.TabPane>
        
        <Tabs.TabPane key="about" title={t('settings.about')}>
           <div className="flex flex-col items-center justify-center h-[320px] pt-4 ">
              <img src="./icon.png" alt="Logo" className="w-16 h-16 mb-4" />
              <Typography.Title heading={4} className="m-0">
                  {t('common.appName')}
              </Typography.Title>
              <Typography.Text type="secondary" className="mb-6">
                  v{appVersion}
              </Typography.Text>
              
              <Space size="medium">
                  <Button 
                    icon={<IconGithub />} 
                    onClick={() => window.api['app:open-external']('https://github.com/traburiss/agent-context-manager')}
                  >
                      GitHub
                  </Button>
                  {/* TODO: Add real download link */}
                  <Button 
                    type="primary"
                    icon={<IconDownload />}
                     onClick={() => window.api['app:open-external']('https://github.com/traburiss/agent-context-manager/releases')}
                  >
                      {t('settings.download')}
                  </Button>
              </Space>
           </div>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
}

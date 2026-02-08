import { useEffect, useState } from 'react';
import { useStore } from '../stores/useStore';
import { 
    Card, Button, Switch, Modal, 
    Form, Input, Message, Typography, 
    Empty, Popconfirm 
} from '@arco-design/web-react';
import { 
    IconPlus, IconFolder, IconFile 
} from '@arco-design/web-react/icon';
import { Platform } from '../../shared/types';
import { useTranslation } from 'react-i18next';

const FormItem = Form.Item;

export default function Agents() {
  const { platforms, fetchPlatforms, updatePlatform, deletePlatform } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
      fetchPlatforms();
  }, [fetchPlatforms]);

  const handleToggle = async (platform: Platform, checked: boolean) => {
      const updated = { ...platform, enabled: checked };
      await updatePlatform(updated);
      Message.success(t(checked ? 'agents.enabledSuccess' : 'agents.disabledSuccess', { name: platform.name }));
  };

  const handleSubmit = async () => {
    try {
        const values = await form.validate();
        setIsSaving(true);
        
        await window.api['platform:create']({
            name: values.name,
            skillsDir: values.skillsDir,
            rulesFile: values.rulesFile,
            enabled: true,
            linkedSkills: [],
            linkedRules: []
        });
        
        await fetchPlatforms();
        setIsModalOpen(false);
        form.resetFields();
        Message.success(t('agents.createSuccess'));
    } catch (error) {
        console.error(error);
        Message.error(t('agents.createFailed'));
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
      try {
          await deletePlatform(id);
          Message.success(t('agents.deleteSuccess'));
      } catch (error) {
          console.error(error);
          Message.error('Failed to delete agent');
      }
  };

  const selectDir = async () => {
      const dir = await window.api['app:select-directory']();
      if (dir) {
          form.setFieldValue('skillsDir', dir);
      }
  };

  const selectFile = async () => {
      const file = await window.api['app:select-file']();
      if (file) {
          form.setFieldValue('rulesFile', file);
      }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Typography.Title heading={4} className="m-0">
            {t('agents.title')}
        </Typography.Title>
        <Button type="primary" icon={<IconPlus />} onClick={() => setIsModalOpen(true)}>
          {t('agents.addAgent')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {platforms.map((platform) => (
          <div key={platform.id}>
            <Card
              className="h-full"
              title={platform.name}
              extra={
                <Switch 
                  checked={platform.enabled} 
                  onChange={(checked) => handleToggle(platform, checked)}
                />
              }
              actions={[
                <Popconfirm
                  key="delete"
                  title={t('agents.deleteAgent')}
                  content={t('agents.deleteConfirm')}
                  onOk={() => handleDelete(platform.id)}
                >
                  <Button type="text" status="danger">
                    {t('common.delete')}
                  </Button>
                </Popconfirm>
              ]}
            >
              <div className="min-h-[80px]">
                <Typography.Paragraph className="text-xs text-text-3 mb-2">
                  <IconFolder className="mr-1" />
                  {platform.skillsDir}
                </Typography.Paragraph>
                <Typography.Paragraph className="text-xs text-text-3">
                  <IconFile className="mr-1" />
                  {platform.rulesFile}
                </Typography.Paragraph>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {platforms.length === 0 && (
          <Empty description={t('agents.noAgents')} />
      )}

      <Modal 
        title={t('agents.addAgent')}
        visible={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={isSaving}
        unmountOnExit
      >
          <Form form={form} layout="vertical">
              <FormItem label={t('agents.agentName')} field="name" rules={[{ required: true }]}>
                  <Input placeholder={t('agents.agentNamePlaceholder')} />
              </FormItem>
              <FormItem label={t('agents.skillsDir')} field="skillsDir" rules={[{ required: true }]}>
                  <Input 
                    placeholder={t('agents.skillsDirPlaceholder')}
                    suffix={<Button size="small" onClick={selectDir}>{t('common.select')}</Button>}
                  />
              </FormItem>
              <Typography.Text type="secondary" className="text-xs block -mt-4 mb-4">
                  {t('agents.skillsDirDesc')}
              </Typography.Text>
              <FormItem label={t('agents.rulesFile')} field="rulesFile" rules={[{ required: true }]}>
                  <Input 
                    placeholder={t('agents.rulesFilePlaceholder')}
                    suffix={<Button size="small" onClick={selectFile}>{t('common.select')}</Button>}
                  />
              </FormItem>
              <Typography.Text type="secondary" className="text-xs block -mt-4">
                  {t('agents.rulesFileDesc')}
              </Typography.Text>
          </Form>
      </Modal>
    </div>
  );
}

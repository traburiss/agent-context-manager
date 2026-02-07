import { useEffect, useState } from 'react';
import { useStore } from '../stores/useStore';
import { 
    Grid, Card, Button, Switch, Modal, 
    Form, Input, Message, Typography, 
    Empty, Popconfirm 
} from '@arco-design/web-react';
import { 
    IconPlus, IconFolder, IconFile 
} from '@arco-design/web-react/icon';
import { Platform } from '../../shared/types';
import { useTranslation } from 'react-i18next';

const { Row, Col } = Grid;
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Typography.Title heading={4} style={{ margin: 0 }}>
            {t('agents.title')}
        </Typography.Title>
        <Button type="primary" icon={<IconPlus />} onClick={() => setIsModalOpen(true)}>
          {t('agents.addAgent')}
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {platforms.map((platform) => (
          <Col span={8} key={platform.id} xs={24} sm={12} md={12} lg={8} xl={6}>
            <Card
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
              <div style={{ minHeight: 80 }}>
                <Typography.Paragraph style={{ fontSize: 12, color: 'var(--color-text-3)', marginBottom: 8 }}>
                  <IconFolder style={{ marginRight: 4 }} />
                  {platform.skillsDir}
                </Typography.Paragraph>
                <Typography.Paragraph style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                  <IconFile style={{ marginRight: 4 }} />
                  {platform.rulesFile}
                </Typography.Paragraph>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

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
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: -16, marginBottom: 16 }}>
                  {t('agents.skillsDirDesc')}
              </Typography.Text>
              <FormItem label={t('agents.rulesFile')} field="rulesFile" rules={[{ required: true }]}>
                  <Input 
                    placeholder={t('agents.rulesFilePlaceholder')}
                    suffix={<Button size="small" onClick={selectFile}>{t('common.select')}</Button>}
                  />
              </FormItem>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: -16 }}>
                  {t('agents.rulesFileDesc')}
              </Typography.Text>
          </Form>
      </Modal>
    </div>
  );
}

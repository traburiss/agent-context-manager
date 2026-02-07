import { useEffect, useState } from 'react';
import { useStore } from '../stores/useStore';
import { 
    List, Button, Modal, Form, Input, 
    Message, Typography, Empty, Popconfirm 
} from '@arco-design/web-react';
import { 
    IconPlus, IconDelete, IconBranch, 
    IconLaunch 
} from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';

const FormItem = Form.Item;

export default function Skills() {
  const { config, fetchConfig, updateConfig } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [isAdding, setIsAdding] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleAddRepo = async () => {
    try {
        const values = await form.validate();
        setIsAdding(true);

        const normalized = await window.api['git:normalize-url'](values.url);
        
        const currentRepos = config?.skillsRepos || [];
        if (currentRepos.includes(normalized)) {
            Message.warning(t('skills.repoExists'));
            return;
        }

        await updateConfig({
            skillsRepos: [...currentRepos, normalized]
        });

        setIsModalOpen(false);
        form.resetFields();
        Message.success(t('skills.addSuccess'));
    } catch (error) {
        console.error(error);
        Message.error(t('skills.addFailed'));
    } finally {
        setIsAdding(false);
    }
  };

  const handleDelete = async (repo: string) => {
      const currentRepos = config?.skillsRepos || [];
      const newRepos = currentRepos.filter(r => r !== repo);
      await updateConfig({ skillsRepos: newRepos });
      Message.success(t('skills.removeSuccess'));
  };

  const handleOpenExternal = (url: string) => {
      window.api['app:open-external'](url);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Typography.Title heading={4} style={{ margin: 0 }}>
            {t('skills.title')}
        </Typography.Title>
        <Button type="primary" icon={<IconPlus />} onClick={() => setIsModalOpen(true)}>
          {t('skills.addRepo')}
        </Button>
      </div>

      <div style={{ 
        background: 'var(--color-bg-2)', 
        borderRadius: 8, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid var(--color-border-2)'
      }}>
          <List
            noDataElement={<Empty description={t('skills.noRepos')} />}
            dataSource={config?.skillsRepos || []}
            render={(repo, index) => (
                <List.Item
                    key={index}
                    actions={[
                        <Button 
                            key="open" 
                            type="text" 
                            icon={<IconLaunch />} 
                            onClick={() => handleOpenExternal(repo)}
                        />,
                        <Popconfirm
                            key="delete"
                            title={t('skills.deleteRepo')}
                            onOk={() => handleDelete(repo)}
                        >
                            <Button type="text" status="danger" icon={<IconDelete />} />
                        </Popconfirm>
                    ]}
                >
                    <List.Item.Meta
                        avatar={<IconBranch style={{ fontSize: 20, color: 'var(--color-text-3)' }} />}
                        title={repo}
                    />
                </List.Item>
            )}
          />
      </div>

      <Modal 
        title={t('skills.addRepo')}
        visible={isModalOpen}
        onOk={handleAddRepo}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={isAdding}
        unmountOnExit
      >
          <Form form={form} layout="vertical">
              <FormItem label={t('skills.repoUrl')} field="url" rules={[{ required: true }]}>
                  <Input placeholder={t('skills.repoUrlPlaceholder')} />
              </FormItem>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {t('skills.repoUrlDesc')}
              </Typography.Text>
          </Form>
      </Modal>
    </div>
  );
}

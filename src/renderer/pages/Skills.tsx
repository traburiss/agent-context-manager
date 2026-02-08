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
  const { userConfig, fetchUserConfig } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [isAdding, setIsAdding] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchUserConfig();
  }, [fetchUserConfig]);

  const handleAddRepo = async () => {
    try {
        const values = await form.validate();
        setIsAdding(true);

        const normalized = await window.api['git:normalize-url'](values.url);
        
        const currentRepos = userConfig?.skills || [];
        if (currentRepos.some(s => s.url === normalized || s.name === normalized)) {
            Message.warning(t('skills.repoExists'));
            return;
        }

        if (!userConfig) return;
        
        await window.api['git:clone'](normalized);
        
        await fetchUserConfig();
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

  const handleDelete = async (repoUrl: string) => {
    try {
        if (!userConfig) return;
        
        // Find repo by URL to get ID
        const repo = userConfig.skills.find(s => s.url === repoUrl);
        if (!repo) {
            Message.error(t('skills.repoNotFound'));
            return;
        }

        await window.api['git:delete'](repo.id);
        await fetchUserConfig();
        Message.success(t('skills.deleteSuccess'));
    } catch (error) {
        console.error(error);
        Message.error(t('skills.deleteFailed'));
    }
  };

  const handleOpenExternal = (url: string) => {
      window.api['app:open-external'](url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Typography.Title heading={4} className="m-0">
            {t('skills.title')}
        </Typography.Title>
        <Button type="primary" icon={<IconPlus />} onClick={() => setIsModalOpen(true)}>
          {t('skills.addRepo')}
        </Button>
      </div>

      <div className="bg-bg-2 rounded-lg shadow-sm border border-border-2">
          <List
            noDataElement={<Empty description={t('skills.noRepos')} />}
            dataSource={userConfig?.skills || []}
            render={(repo, index) => (
                <List.Item
                    key={index}
                    actions={[
                        <Button 
                            key="open" 
                            type="text" 
                            icon={<IconLaunch />} 
                            onClick={() => handleOpenExternal(repo.url)}
                        />,
                        <Popconfirm
                            key="delete"
                            title={t('skills.deleteRepo')}
                            onOk={() => handleDelete(repo.url)}
                        >
                            <Button type="text" status="danger" icon={<IconDelete />} />
                        </Popconfirm>
                    ]}
                >
                    <List.Item.Meta
                        avatar={<IconBranch className="text-xl text-text-3" />}
                        title={repo.name}
                        description={repo.url !== repo.name ? repo.url : undefined}
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

import { useEffect, useState } from 'react';
import { useStore } from '../stores/useStore';
import { 
    Card, Button, Modal, Form, 
    Input, Message, Typography, Empty, 
    Popconfirm 
} from '@arco-design/web-react';
import { 
    IconPlus, IconEdit, IconDelete, 
    IconFile 
} from '@arco-design/web-react/icon';
import { Rule } from '../../shared/types';
import { useTranslation } from 'react-i18next';

const FormItem = Form.Item;
const TextArea = Input.TextArea;

export default function Rules() {
  const { rules, fetchRules } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleSubmit = async () => {
    try {
        const values = await form.validate();
        setIsSaving(true);

        if (editingRule) {
             await window.api['rule:update']({ ...editingRule, ...values });
             await window.api['rule:set-content'](editingRule.id, values.content);
             Message.success(t('rules.updateSuccess'));
        } else {
             const newRule = await window.api['rule:create']({ 
                 name: values.name, 
                 description: values.description 
             });
             await window.api['rule:set-content'](newRule.id, values.content);
             Message.success(t('rules.createSuccess'));
        }
        
        await fetchRules();
        setIsModalOpen(false);
        setEditingRule(null);
        form.resetFields();
    } catch (error) {
        console.error(error);
        Message.error(t('rules.saveFailed'));
    } finally {
        setIsSaving(false);
    }
  };

  const handleEdit = async (rule: Rule) => {
      try {
        const content = await window.api['rule:get-content'](rule.id);
        setEditingRule(rule);
        form.setFieldsValue({
            name: rule.name,
            description: rule.description,
            content: content
        });
        setIsModalOpen(true);
      } catch (error) {
          console.error(error);
          Message.error(t('rules.loadFailed'));
      }
  };

  const handleDelete = async (id: string) => {
      try {
          await window.api['rule:delete'](id);
          await fetchRules();
          Message.success(t('rules.deleteSuccess'));
      } catch (error) {
          console.error(error);
          Message.error(t('rules.deleteFailed'));
      }
  };

  const openCreateModal = () => {
      setEditingRule(null);
      form.resetFields();
      setIsModalOpen(true);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <Typography.Title heading={4} className="m-0">
            {t('rules.title')}
        </Typography.Title>
        <Button type="primary" icon={<IconPlus />} onClick={openCreateModal}>
          {t('rules.createRule')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rules.map((rule) => (
          <div key={rule.id}>
            <Card
              hoverable
              className="h-full"
              title={
                <div className="flex items-center gap-2">
                    <IconFile className="text-primary-6" />
                    <span>{rule.name}</span>
                </div>
              }
              actions={[
                <Button key="edit" type="text" icon={<IconEdit />} onClick={() => handleEdit(rule)} />,
                <Popconfirm
                    key="delete"
                    title={t('rules.deleteRule')}
                    content={t('rules.deleteConfirm')}
                    onOk={() => handleDelete(rule.id)}
                >
                    <Button type="text" status="danger" icon={<IconDelete />} />
                </Popconfirm>
              ]}
            >
                <div className="flex flex-col min-h-[80px]">
                    <Typography.Paragraph 
                        className="text-text-3 mb-4 flex-1"
                        ellipsis={{ rows: 3 }}
                    >
                        {rule.description || t('rules.noDescription')}
                    </Typography.Paragraph>
                    <Typography.Text type="secondary" className="text-xs">
                        {t('rules.created', { date: new Date(rule.createdAt).toLocaleDateString() })}
                    </Typography.Text>
                </div>
            </Card>
          </div>
        ))}
      </div>

      {rules.length === 0 && (
          <Empty description={t('rules.noRules')} />
      )}

      <Modal 
        title={editingRule ? t('rules.editRule') : t('rules.createRule')}
        visible={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={isSaving}
        unmountOnExit
        className="w-[600px]"
      >
          <Form form={form} layout="vertical">
              <FormItem label={t('rules.name')} field="name" rules={[{ required: true }]}>
                  <Input placeholder={t('rules.namePlaceholder')} />
              </FormItem>
              <FormItem label={t('rules.description')} field="description">
                  <Input placeholder={t('rules.descriptionPlaceholder')} />
              </FormItem>
              <FormItem label={t('rules.content')} field="content">
                  <TextArea 
                    placeholder={t('rules.contentPlaceholder')}
                    autoSize={{ minRows: 6, maxRows: 12 }}
                    className="font-mono"
                  />
              </FormItem>
          </Form>
      </Modal>
    </div>
  );
}

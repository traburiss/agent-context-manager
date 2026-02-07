import { useEffect, useState } from 'react';
import { useStore } from '../stores/useStore';
import { 
    Grid, Card, Button, Modal, Form, 
    Input, Message, Typography, Empty, 
    Popconfirm 
} from '@arco-design/web-react';
import { 
    IconPlus, IconEdit, IconDelete, 
    IconFile 
} from '@arco-design/web-react/icon';
import { Rule } from '../../shared/types';
import { useTranslation } from 'react-i18next';

const { Row, Col } = Grid;
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
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Typography.Title heading={4} style={{ margin: 0 }}>
            {t('rules.title')}
        </Typography.Title>
        <Button type="primary" icon={<IconPlus />} onClick={openCreateModal}>
          {t('rules.createRule')}
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {rules.map((rule) => (
          <Col span={8} key={rule.id} xs={24} sm={12} md={12} lg={8} xl={6}>
            <Card
              hoverable
              style={{ height: '100%' }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconFile style={{ color: 'var(--color-primary-6)' }} />
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
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 80 }}>
                    <Typography.Paragraph 
                        style={{ color: 'var(--color-text-3)', marginBottom: 16, flex: 1 }} 
                        ellipsis={{ rows: 3 }}
                    >
                        {rule.description || t('rules.noDescription')}
                    </Typography.Paragraph>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {t('rules.created', { date: new Date(rule.createdAt).toLocaleDateString() })}
                    </Typography.Text>
                </div>
            </Card>
          </Col>
        ))}
      </Row>

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
        style={{ width: 600 }}
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
                    style={{ fontFamily: 'monospace' }}
                  />
              </FormItem>
          </Form>
      </Modal>
    </div>
  );
}

import { 
    Card, Button, Typography, Empty, Popconfirm, Tag, Grid, Space, Tooltip 
} from '@arco-design/web-react';
import { 
    IconEdit, IconDelete, IconFile, IconPlus, IconFolder
} from '@arco-design/web-react/icon';
import { Rule } from '../../../shared/types';
import { useTranslation } from 'react-i18next';

const { Row, Col } = Grid;
const { Text, Paragraph } = Typography;

interface RuleListProps {
  rules: Rule[];
  onEdit: (rule: Rule) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function RuleList({ rules, onEdit, onDelete, onCreate }: RuleListProps) {
  const { t } = useTranslation();

  const handleOpenFolder = (path: string) => {
      window.api['platform:open-file'](path);
  };

  if (rules.length === 0) {
    return (
      <Row justify="center" align="center" style={{ height: '400px' }}>
        <Col span={24} style={{ textAlign: 'center' }}>
          <Empty description={t('rules.noRules')} />
          <Button type="primary" icon={<IconPlus />} onClick={onCreate} className="mt-4">
              {t('rules.createRule')}
          </Button>
        </Col>
      </Row>
    );
  }

  return (
    <Row gutter={[24, 24]}>
      {rules.map((rule) => (
        <Col key={rule.id} xs={24} sm={12} md={12} lg={8} xl={6}>
          <Card
            hoverable
            className="h-full"
            title={
              <Space>
                <IconFile className="text-primary-6" />
                <Text bold ellipsis title={rule.name}>
                  {rule.name}
                </Text>
              </Space>
            }
            actions={[
              <Tooltip content={t('common.openFolder')} key="folder">
                <Button type="text" icon={<IconFolder />} onClick={() => handleOpenFolder(rule.localPath)} >
                {t('common.openFolder')}
                </Button>
              </Tooltip>,
              <Button key="edit" type="text" icon={<IconEdit />} onClick={() => onEdit(rule)}>
                {t('common.edit')}
              </Button>,
              <Popconfirm
                  key="delete"
                  title={t('rules.deleteRule')}
                  content={t('rules.deleteConfirm')}
                  onOk={() => onDelete(rule.id)}
              >
                  <Button type="text" status="danger" icon={<IconDelete />}>
                    {t('common.delete')}
                  </Button>
              </Popconfirm>
            ]}
          >
              <Space direction="vertical" size="medium" style={{ width: '100%', minHeight: '120px' }}>
                  <Paragraph 
                      type="secondary"
                      ellipsis={{ rows: 3 }}
                      style={{ marginBottom: 0 }}
                  >
                      {rule.description || t('rules.noDescription')}
                  </Paragraph>
                  
                  <div className="mt-auto">
                    {rule.linkedPlatforms && rule.linkedPlatforms.length > 0 ? (
                        <Tag color="green">
                            {t('rules.deployedTo', { count: rule.linkedPlatforms.length })}
                        </Tag>
                    ) : (
                        <Tag color="gray">{t('rules.notDeployed')}</Tag>
                    )}
                  </div>

                  <Text type="secondary" style={{ fontSize: '12px' }}>
                      {t('rules.created', { date: new Date(rule.createdAt).toLocaleDateString() })}
                  </Text>
              </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

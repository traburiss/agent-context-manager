import { useState, useEffect } from 'react';
import { 
    Button, Input, Message, Grid, Typography, Space, Layout, Tooltip
} from '@arco-design/web-react';
import { IconArrowLeft, IconSave, IconFolder } from '@arco-design/web-react/icon';
import { useStore } from '../../stores/useStore';
import { Rule } from '../../../shared/types';
import { useTranslation } from 'react-i18next';
import { MarkdownEditor } from '../markdown/MarkdownEditor';
import { RuleDeployManager } from './RuleDeployManager';

interface RuleEditorProps {
    rule: Rule;
    onSave: (rule: Rule, content: string) => Promise<void>;
    onCancel: () => void;
    onDelete: (id: string) => void;
}

const { Row, Col } = Grid;
const { Header, Content } = Layout;
const TextArea = Input.TextArea;

export function RuleEditor({ rule, onSave, onCancel }: RuleEditorProps) {
    const { t } = useTranslation();
    const [content, setContent] = useState('');
    const [name, setName] = useState(rule.name);
    const [description, setDescription] = useState(rule.description || '');
    const [saving, setSaving] = useState(false);
    const { fetchRules } = useStore();

    useEffect(() => {
        const loadContent = async () => {
            try {
                const c = await window.api['rule:get-content'](rule.id);
                setContent(c);
            } catch (error) {
                console.error(error);
                Message.error(t('rules.loadContentFailed'));
            }
        };
        loadContent();
    }, [rule.id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({ ...rule, name, description }, content);
            Message.success(t('common.saveSuccess'));
        } catch (error) {
            console.error(error);
            Message.error(t('common.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    const handleOpenFolder = () => {
        window.api['platform:open-file'](rule.localPath);
    };

    return (
        <Layout className="h-full bg-bg-2 overflow-hidden">
            <Header className="bg-bg-1 p-4 border-b border-border flex items-center justify-between">
                <Space size="large">
                    <Button icon={<IconArrowLeft />} onClick={onCancel}>
                        {t('common.back')}
                    </Button>
                    <Input 
                        value={name} 
                        onChange={setName} 
                        className="w-64 font-bold text-lg"
                        placeholder={t('rules.name')}
                        style={{ border: 'none', background: 'transparent' }}
                    />
                </Space>
                <Space>
                    <Tooltip content={t('common.openFolder')}>
                        <Button type="text" icon={<IconFolder />} onClick={handleOpenFolder} >
                            {t('common.openFolder')}
                        </Button>
                    </Tooltip>
                    <Button 
                        type="primary" 
                        icon={<IconSave />} 
                        onClick={handleSave} 
                        loading={saving}
                    >
                        {t('common.save')}
                    </Button>
                </Space>
            </Header>

            <Content>
                <Row gutter={20}>
                    <Col span={16} >
                        <MarkdownEditor
                            title={t('rules.content')}
                            value={content}
                            onChange={setContent}
                            placeholder={t('rules.contentPlaceholder')}
                        />  
                    </Col>
                    
                    <Col span={8}>
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <div>
                                <Typography.Title heading={6} style={{ marginTop: 0, marginBottom: 8 }}>
                                    {t('rules.description')}
                                </Typography.Title>
                                <TextArea 
                                    value={description}
                                    onChange={setDescription}
                                    placeholder={t('rules.descriptionPlaceholder')}
                                    autoSize={{ minRows: 3, maxRows: 5 }}
                                />
                            </div>

                            <RuleDeployManager 
                                rule={rule}
                                onDeployChange={fetchRules}
                                onSaveContent={async () => {
                                    await onSave({ ...rule, name, description }, content);
                                }}
                            />
                        </Space>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}

import { 
    List, Checkbox, Tag, Space, Typography, Message, Modal, Button,
    Divider,
    Icon
} from '@arco-design/web-react';
import { useStore } from '../../stores/useStore';
import { Rule } from '../../../shared/types';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { IconSync } from '@arco-design/web-react/icon';

interface RuleDeployManagerProps {
    rule: Rule;
    onDeployChange: () => void;
    onSaveContent: () => Promise<void>;
}

export function RuleDeployManager({ rule, onDeployChange, onSaveContent }: RuleDeployManagerProps) {
    const { platforms } = useStore();
    const { t } = useTranslation();
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

    const handleToggle = async (platformId: string, checked: boolean) => {
        setLoadingMap(prev => ({ ...prev, [platformId]: true }));
        try {
            // Ensure content is saved before deploying
            if (checked) {
                await onSaveContent();
                
                // Check file status for conflict resolution
                const status = await window.api['rule:check-file-status'](platformId, rule.id);
                
                if (status.status === 'conflict') {
                    setConflictState({ visible: true, platformId });
                    setLoadingMap(prev => ({ ...prev, [platformId]: false })); // Pause
                    return; 
                }
            }

            await executeDeploy(platformId, 'overwrite', !checked);

        } catch (error) {
            console.error(error);
            Message.error(t('rules.deployFailed'));
        } finally {
            if (!checked) { 
                setLoadingMap(prev => ({ ...prev, [platformId]: false }));
            }
        }
    };

    const executeDeploy = async (platformId: string, mode: 'overwrite' | 'backup', undeploy = false) => {
        setLoadingMap(prev => ({ ...prev, [platformId]: true }));
        try {
            if (undeploy) {
                await window.api['rule:undeploy'](rule.id, platformId);
                Message.success(t('rules.undeployed'));
            } else {
                await window.api['rule:deploy'](rule.id, platformId, mode);
                Message.success(t('rules.deployed'));
            }
            onDeployChange();
        } catch (error) {
             console.error(error);
             Message.error(t('rules.deployFailed'));
        } finally {
            setLoadingMap(prev => ({ ...prev, [platformId]: false }));
            setConflictState({ visible: false, platformId: '' });
        }
    };

    const [conflictState, setConflictState] = useState({ visible: false, platformId: '' });

    return (
        <div className="flex flex-col h-full">
            <Typography.Title heading={6} className="mt-0 mb-4">
                {t('rules.deployToAgents')}
            </Typography.Title>
            <div className="flex-1 overflow-auto border border-gray-200 rounded p-2">
                <List
                    size="small"
                    dataSource={platforms}
                    render={(platform) => (
                        <List.Item key={platform.id}>
                            <Checkbox
                                checked={rule.linkedPlatforms?.includes(platform.id)}
                                onChange={(checked) => handleToggle(platform.id, checked)}
                                disabled={loadingMap[platform.id]}
                            >
                                <Space>
                                    <span>{platform.name}</span>
                                    {loadingMap[platform.id] && <IconSync spin/>}
                                </Space>
                            </Checkbox>
                        </List.Item>
                    )}
                />
            </div>

            <Modal
                title={t('rules.conflictTitle')}
                visible={conflictState.visible}
                onCancel={() => setConflictState({ visible: false, platformId: '' })}
                footer={null}
            >
                <div className="mb-4">
                    {t('rules.conflictContent')}
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="default" onClick={() => setConflictState({ visible: false, platformId: '' })}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="primary" onClick={() => executeDeploy(conflictState.platformId, 'backup')}>
                        {t('rules.backup')}
                    </Button>
                    <Button type="default" status="warning" onClick={() => executeDeploy(conflictState.platformId, 'overwrite')}>
                        {t('rules.overwrite')}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

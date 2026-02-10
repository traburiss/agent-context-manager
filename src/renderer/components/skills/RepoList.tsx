import React from 'react';
import { useStore } from '../../stores/useStore';
import { Button, Table, Badge, Popconfirm, Message, Tooltip, Space, Typography } from '@arco-design/web-react';
import { IconGithub, IconFolder, IconDelete, IconSync } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { SkillRepo } from '../../../shared/types';

interface RepoListProps {
    onSelectRepo: (repoId: string | null) => void;
    selectedRepoId: string | null;
}

export const RepoList: React.FC<RepoListProps> = ({ onSelectRepo, selectedRepoId }) => {
    const { t } = useTranslation();
    const { userConfig, deleteRepo, checkRepoUpdate } = useStore();
    const repos = userConfig?.skills || [];

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await deleteRepo(id);
            if (selectedRepoId === id) {
                onSelectRepo(null);
            }
            Message.success(t('skills.removeSuccess'));
        } catch (err) {
            Message.error(`${t('skills.removeFailed')}: ${(err as Error).message}`);
        }
    };

    const handleCheckUpdate = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await checkRepoUpdate(id);
            Message.success(t('skills.updateChecked'));
        } catch (err) {
            Message.error(`${t('skills.updateCheckFailed')}: ${(err as Error).message}`);
        }
    };

    const handleOpenUrl = (url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        window.api['app:open-external'](url);
    };

    const handleOpenFolder = (path: string, e: React.MouseEvent) => {
        e.stopPropagation();
        window.api['platform:open-dir'](path);
    };
    
    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'up-to-date': return 'success';
            case 'behind': return 'warning';
            case 'error': return 'error';
            case 'checking': return 'processing';
            default: return 'default';
        }
    };

const { Text } = Typography;

    const columns = [
        {
            title: t('skills.repository'),
            dataIndex: 'name',
            minWidth: 100,
            render: (_: unknown, record: SkillRepo) => (
                <div 
                    className="cursor-pointer" 
                    onClick={() => onSelectRepo(record.id)}
                    style={{ display: 'flex' }}
                >
                    <Space 
                        direction="vertical" 
                        size={0} 
                    >
                        <Tooltip content={record.name || 'Unknown'}>
                            <Text bold>{record.name}</Text>
                        </Tooltip>
                        <Tooltip content={record.url || 'Unknown'}>
                            <Text 
                                type="secondary" 
                                ellipsis 
                                style={{ maxWidth: '200px', fontSize: '12px' }}
                            >
                                {record.url}
                            </Text>
                        </Tooltip>
                    </Space>
                </div>
            )
        },
        {
            title: t('skills.status'),
            width: 70,
            align: 'center' as const,
            dataIndex: 'updateStatus',
            render: (status: string | undefined, record: SkillRepo) => (
                <div 
                    onClick={() => onSelectRepo(record.id)} 
                    className="cursor-pointer"
                >
                    <Space>
                        <Tooltip content={status || 'Unknown'}>
                            <Badge status={getStatusColor(status)} />
                        </Tooltip>
                        {record.behindCount ? <Badge count={record.behindCount} dot style={{ marginLeft: 4 }} /> : null}
                    </Space>
                </div>
            )
        },
        {
            title: t('common.actions'),
            key: 'actions',
            width: 200,
            render: (_: unknown, record: SkillRepo) => (
                <Space size="small">
                    <Tooltip content="Open Github">
                        <Button 
                            icon={<IconGithub />} 
                            shape="circle"
                            onClick={(e: React.MouseEvent) => handleOpenUrl(record.url, e)}
                        />
                    </Tooltip>
                    <Tooltip content={t('agents.openDir')}>
                         <Button 
                            icon={<IconFolder />} 
                            shape="circle" 
                             onClick={(e: React.MouseEvent) => handleOpenFolder(record.localPath, e)}
                        />
                    </Tooltip>
                    <Tooltip content={t('skills.checkUpdate')}>
                        <Button 
                            icon={<IconSync spin={record.updateStatus === 'checking'}/>} 
                            shape="circle"
                            onClick={(e: React.MouseEvent) => handleCheckUpdate(record.id, e)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title={t('skills.deleteRepo')}
                        onOk={(e: React.MouseEvent) => handleDelete(record.id, e)}
                    >
                        <Button 
                            icon={<IconDelete />} 
                            shape="circle" 
                            status="danger"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <Table
            columns={columns}
            data={repos}
            rowKey="id"
            pagination={false}
            scroll={{ x: true }}
            noDataElement={t('skills.noRepos')}
            onRow={(record) => ({
                onClick: () => onSelectRepo(record.id),
                style: { cursor: 'pointer' },
                className: `hover:bg-fill-2 transition-colors ${selectedRepoId === record.id ? 'bg-fill-3' : ''}`
            })}
        />
    );
};

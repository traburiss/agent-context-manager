import React from 'react';
import { useStore } from '../../stores/useStore';
import { Button, Table, Badge, Popconfirm, Message, Tooltip } from '@arco-design/web-react';
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

    const columns = [
        {
            title: t('skills.repository'),
            dataIndex: 'name',
            minWidth: 100,
            render: (_: unknown, record: SkillRepo) => (
                <div className="flex flex-col cursor-pointer" onClick={() => onSelectRepo(record.id)}>
                     <Tooltip content={record.name || 'Unknown'}>
                        <div className="font-bold">{record.name}</div>
                     </Tooltip>
                     <Tooltip content={record.url || 'Unknown'}>
                        <div className="text-xs text-text-3 truncate max-w-[200px]">{record.url}</div>
                     </Tooltip>
                </div>
            )
        },
        {
            title: t('skills.status'),
            width: 70,
            align: 'center' as const,
            dataIndex: 'updateStatus',
            render: (status: string | undefined, record: SkillRepo) => (
                <div onClick={() => onSelectRepo(record.id)}>
                     <Tooltip content={status || 'Unknown'}>
                        <Badge status={getStatusColor(status)} />
                     </Tooltip>
                     {record.behindCount ? <Badge count={record.behindCount} dot style={{ marginLeft: 4 }} /> : null}
                </div>
            )
        },
        {
            title: t('common.actions'),
            key: 'actions',
            width: 200,
            render: (_: unknown, record: SkillRepo) => (
                <div className="flex gap-2">
                    <Tooltip content="Open Github">
                        <Button 
                            icon={<IconGithub />} 
                            shape="circle"
                            onClick={(e) => handleOpenUrl(record.url, e as unknown as React.MouseEvent)}
                        />
                    </Tooltip>
                    <Tooltip content={t('agents.openDir')}>
                         <Button 
                            icon={<IconFolder />} 
                            shape="circle" 
                             onClick={(e) => handleOpenFolder(record.localPath, e as unknown as React.MouseEvent)}
                        />
                    </Tooltip>
                    <Tooltip content={t('skills.checkUpdate')}>
                        <Button 
                            icon={<IconSync spin={record.updateStatus === 'checking'}/>} 
                            shape="circle"
                            onClick={(e) => handleCheckUpdate(record.id, e as unknown as React.MouseEvent)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title={t('skills.deleteRepo')}
                        onOk={(e) => handleDelete(record.id, e as unknown as React.MouseEvent)}
                    >
                        <Button 
                            icon={<IconDelete />} 
                            shape="circle" 
                            status="danger"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </Popconfirm>
                </div>
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
                className: `cursor-pointer hover:bg-fill-2 transition-colors ${selectedRepoId === record.id ? 'bg-fill-3' : ''}`
            })}
        />
    );
};

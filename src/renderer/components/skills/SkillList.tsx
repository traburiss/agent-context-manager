import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import { Table, Checkbox, Message, Typography, Button, Tooltip } from '@arco-design/web-react';
import { Skill } from '../../../shared/types';
import { IconFolder } from '@arco-design/web-react/icon';

interface SkillListProps {
    repoId: string | null;
}

export const SkillList: React.FC<SkillListProps> = ({ repoId }) => {
    const { t } = useTranslation();
    const { skills, platforms, linkSkill, unlinkSkill } = useStore();

    if (!repoId) {
        return <div className="p-8 text-center text-gray-500">{t('skills.selectRepoToView')}</div>;
    }

    const repoSkills = skills.filter(s => s.repoId === repoId);

    const handleLinkToggle = async (skillId: string, platformId: string, checked: boolean) => {
        try {
            if (checked) {
                await linkSkill(skillId, platformId);
                Message.success(t('skills.skillLinked'));
            } else {
                await unlinkSkill(skillId, platformId);
                Message.success(t('skills.skillUnlinked'));
            }
        } catch (err) {
            Message.error(`${t('skills.linkFailed')}: ${(err as Error).message}`);
        }
    };
    
    const handleOpenSkillFolder = (path: string) => {
         window.api['platform:open-dir'](path);
    };

    const columns: any[] = [
        {
            title: t('skills.skillName'),
            dataIndex: 'name',
            width: 200,
            render: (name: string, record: Skill) => (
                <div>
                    <div className="font-bold flex items-center gap-2">
                        {name}
                         <Tooltip content={t('agents.openDir')}>
                             <Button 
                                size="mini" 
                                shape="circle" 
                                icon={<IconFolder />} 
                                onClick={() => handleOpenSkillFolder(record.localPath)}
                                type="text"
                            />
                        </Tooltip>
                    </div>
                    {record.description && (
                        <div className="text-gray-500 text-xs truncate max-w-xs" title={record.description}>
                            {record.description}
                        </div>
                    )}
                </div>
            )
        },
        ...platforms.map(platform => ({
            title: platform.name,
            key: platform.id,
            width: 100,
            render: (_: unknown, record: Skill) => {
                return (
                    <Checkbox
                        checked={record.linkedPlatforms?.includes(platform.id)}
                        onChange={(checked) => handleLinkToggle(record.id, platform.id, checked)}
                    />
                );
            }
        }))
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="mb-4">
                <Typography.Title heading={6} style={{ margin: 0 }}>
                    {t('skills.skillsInRepo', { repo: repoId })}
                </Typography.Title>
                <Typography.Text type="secondary">
                     {t('skills.skillsFound', { count: repoSkills.length })}
                </Typography.Text>
            </div>
            <Table
                data={repoSkills}
                columns={columns}
                rowKey="id"
                pagination={false}
                scroll={{ x: true, y: true }}
            />
        </div>
    );
};

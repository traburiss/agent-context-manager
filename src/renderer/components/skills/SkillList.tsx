import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import { Table, Checkbox, Message, Typography, Button, Tooltip, Space, Dropdown, Menu, Input } from '@arco-design/web-react';
import { Skill } from '../../../shared/types';
import { IconFolder, IconDown, IconLink, IconStop } from '@arco-design/web-react/icon';

interface SkillListProps {
  repoId: string | null;
}

export const SkillList: React.FC<SkillListProps> = ({ repoId }) => {
  const { t } = useTranslation();
  const { skills, platforms, linkSkill, unlinkSkill } = useStore();
  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>([]);
  const [searchText, setSearchText] = useState('');
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState(400);

  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setTableHeight(Math.max(entry.contentRect.height - 8, 100));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setSearchText('');
    setSelectedRowKeys([]);
  }, [repoId]);



  const repoSkills = skills.filter(s => s.repoId === repoId);

  const filteredSkills = useMemo(() => {
    if (!searchText.trim()) return repoSkills;
    const keyword = searchText.toLowerCase();
    return repoSkills.filter(s =>
      s.name.toLowerCase().includes(keyword) ||
      s.description?.toLowerCase().includes(keyword)
    );
  }, [repoSkills, searchText]);

  const getErrorMessage = (err: Error) => {
    console.info('get_error', err)
    const msg = err.message || '';
    if (msg.includes('Permission denied')) return t('skills.linkErrorPermission');
    if (msg.includes('exists and is not a symbolic link')) return t('skills.linkErrorOccupied');
    
    const parentDirMatch = msg.match(/Parent path (.+) exists and is not a directory/);
    if (parentDirMatch) {
        return t('skills.linkErrorParentNotDir', { path: parentDirMatch[1] });
    }

    return t('skills.linkErrorUnknown', { message: msg });
  };

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
      Message.error(getErrorMessage(err as Error));
    }
  };

  const handleOpenSkillFolder = (path: string) => {
    window.api['platform:open-dir'](path);
  };

  const handleBatchLink = async (platformId: string) => {
    try {
      const platform = platforms.find(p => p.id === platformId);
      if (!platform) return;

      let successCount = 0;
      for (const skillId of selectedRowKeys) {
        const skill = repoSkills.find(s => s.id === skillId);
        if (skill && !skill.linkedPlatforms?.includes(platformId)) {
          await linkSkill(skill.id, platformId);
          successCount++;
        }
      }
      if (successCount > 0) {
        Message.success(t('skills.batchLinkSuccess', { count: successCount, platform: platform.name }));
      } else {
        Message.info(t('skills.noSkillsLinked'));
      }
      setSelectedRowKeys([]);
    } catch (err) {
      Message.error(getErrorMessage(err as Error));
    }
  };

  const handleBatchUnlink = async (platformId: string) => {
    try {
      const platform = platforms.find(p => p.id === platformId);
      if (!platform) return;

      let successCount = 0;
      for (const skillId of selectedRowKeys) {
        const skill = repoSkills.find(s => s.id === skillId);
        if (skill && skill.linkedPlatforms?.includes(platformId)) {
          await unlinkSkill(skill.id, platformId);
          successCount++;
        }
      }
      if (successCount > 0) {
        Message.success(t('skills.batchUnlinkSuccess', { count: successCount, platform: platform.name }));
      } else {
        Message.info(t('skills.noSkillsUnlinked'));
      }
      setSelectedRowKeys([]);
    } catch (err) {
      Message.error(`${t('skills.batchUnlinkFailed')}: ${(err as Error).message}`);
    }
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

  const linkMenu = (
    <Menu onClickMenuItem={(key) => handleBatchLink(key)}>
      {platforms.map(p => (
        <Menu.Item key={p.id}>{p.name}</Menu.Item>
      ))}
    </Menu>
  );

  const unlinkMenu = (
    <Menu onClickMenuItem={(key) => handleBatchUnlink(key)}>
      {platforms.map(p => (
        <Menu.Item key={p.id}>{p.name}</Menu.Item>
      ))}
    </Menu>
  );

  const showSearchResult = searchText.trim().length > 0;

  if (!repoId) {
    return <div className="p-8 text-center text-gray-500">{t('skills.selectRepoToView')}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center gap-4">
        <div className="flex-shrink-0">
          <Typography.Title heading={6} style={{ margin: 0 }}>
            {t('skills.skillsInRepo', { repo: repoId })}
          </Typography.Title>
          <Typography.Text type="secondary">
            {showSearchResult
              ? t('skills.searchResult', { count: filteredSkills.length, total: repoSkills.length })
              : t('skills.skillsFound', { count: repoSkills.length })}
          </Typography.Text>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <Input.Search
            placeholder={t('skills.searchPlaceholder')}
            value={searchText}
            onChange={setSearchText}
            allowClear
            style={{ maxWidth: 280 }}
          />

          {selectedRowKeys.length > 0 && (
            <Space>
              <span className="text-sm text-gray-500 mr-2">
                {t('common.selectedItems', { count: selectedRowKeys.length })}
              </span>
              <Dropdown droplist={linkMenu} trigger="click">
                <Button type="primary" size="small">
                  <Space>
                    <IconLink />
                    {t('skills.linkTo')}
                    <IconDown />
                  </Space>
                </Button>
              </Dropdown>
              <Dropdown droplist={unlinkMenu} trigger="click">
                <Button status="danger" size="small">
                  <Space>
                    <IconStop />
                    {t('skills.unlinkFrom')}
                    <IconDown />
                  </Space>
                </Button>
              </Dropdown>
            </Space>
          )}
        </div>
      </div>

      <div ref={tableContainerRef} className="flex-1 min-h-0">
        <Table
          data={filteredSkills}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: true, y: tableHeight }}
          virtualListProps={{ height: tableHeight }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys,
            onChange: (selectedRowKeys) => {
              setSelectedRowKeys(selectedRowKeys);
            },
            checkAll: true
          }}
        />
      </div>
    </div>
  );
};

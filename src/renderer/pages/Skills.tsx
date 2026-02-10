import { useEffect, useState } from 'react';
import { useStore } from '../stores/useStore';
import { Button, Typography } from '@arco-design/web-react';
import { IconPlus, IconSync } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { RepoList } from '../components/skills/RepoList';
import { AddRepoModal } from '../components/skills/AddRepoModal';
import { SkillList } from '../components/skills/SkillList';

export default function Skills() {
  const { fetchUserConfig, fetchPlatforms } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchUserConfig();
    fetchPlatforms();
  }, [fetchUserConfig, fetchPlatforms]);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Typography.Title heading={4} className="m-0">
            {t('skills.title')}
        </Typography.Title>
        <Button type="primary" icon={<IconPlus />} onClick={() => setIsModalOpen(true)}>
          {t('skills.addRepo')}
        </Button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
          <div className="flex-1 bg-bg-2 rounded-lg shadow-sm border border-border-2 flex flex-col min-w-0 overflow-hidden">
             <div className="p-4 border-b border-border-2 font-bold flex justify-between items-center">
                 <span>{t('skills.repositories')}</span>
                 <Button 
                    shape="circle" 
                    icon={<IconSync />} 
                    onClick={async (e) => {
                        e.stopPropagation();
                        // Trigger specific refresh for all repos
                        const repos = useStore.getState().userConfig?.skills || [];
                        await Promise.all(repos.map(r => useStore.getState().checkRepoUpdate(r.id)));
                    }}
                 />
             </div>
             <div className="flex-1 overflow-auto">
                 <RepoList 
                    onSelectRepo={setSelectedRepoId} 
                    selectedRepoId={selectedRepoId} 
                />
             </div>
          </div>
          
          <div className="flex-[2] bg-bg-2 rounded-lg shadow-sm border border-border-2 flex flex-col min-w-0 overflow-hidden">
             <div className="p-4 flex-1 overflow-hidden flex flex-col">
                <SkillList repoId={selectedRepoId} />
             </div>
          </div>
      </div>

      <AddRepoModal 
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  );
}

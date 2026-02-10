import { useEffect, useState } from 'react';
import { useStore } from '../stores/useStore';
import { 
    Button, Message, Typography, Modal
} from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import { Rule } from '../../shared/types';
import { useTranslation } from 'react-i18next';
import { RuleList } from '../components/rules/RuleList';
import { RuleEditor } from '../components/rules/RuleEditor';

export default function Rules() {
  const { rules, fetchRules } = useStore();
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [currentRuleId, setCurrentRuleId] = useState<string | null>(null);
  const { t } = useTranslation();

  const currentRule = rules.find(r => r.id === currentRuleId) || null;

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleCreate = async () => {
    setCreating(true);
  };

  const [creating, setCreating] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');

  const confirmCreate = async () => {
      if (!newRuleName.trim()) {
          Message.error(t('rules.nameRequired'));
          return;
      }
      try {
          const newRule = await window.api['rule:create']({ name: newRuleName });
          await window.api['rule:set-content'](newRule.id, ''); // Init empty content
          await fetchRules();
          setCurrentRuleId(newRule.id);
          setViewMode('editor');
          setCreating(false);
          setNewRuleName('');
          Message.success(t('rules.createSuccess'));
      } catch (error) {
          console.error(error);
          Message.error(t('rules.createFailed'));
      }
  };

  const handleEdit = (rule: Rule) => {
      setCurrentRuleId(rule.id);
      setViewMode('editor');
  };

  const handleDelete = async (id: string) => {
      try {
          await window.api['rule:delete'](id);
          await fetchRules();
          Message.success(t('rules.deleteSuccess'));
          if (currentRuleId === id) {
              setViewMode('list');
              setCurrentRuleId(null);
          }
      } catch (error) {
          console.error(error);
          Message.error(t('rules.deleteFailed'));
      }
  };

  const handleSaveContent = async (rule: Rule, content: string) => {
      // Update metadata if needed
      const existingRule = rules.find(r => r.id === rule.id);
      if (existingRule && (rule.name !== existingRule.name || rule.description !== existingRule.description)) {
          await window.api['rule:update'](rule);
      }
      // Update content
      await window.api['rule:set-content'](rule.id, content);
      await fetchRules();
  };

  const handleBack = () => {
      setViewMode('list');
      setCurrentRuleId(null);
      fetchRules(); // Refresh list to show updated status
  };

  if (viewMode === 'editor' && currentRule) {
      return (
          <RuleEditor 
              rule={currentRule}
              onSave={handleSaveContent}
              onCancel={handleBack}
              onDelete={handleDelete}
          />
      );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <Typography.Title heading={4} className="m-0">
            {t('rules.title')}
        </Typography.Title>
        <Button type="primary" icon={<IconPlus />} onClick={handleCreate}>
          {t('rules.createRule')}
        </Button>
      </div>

      <div className="flex-1">
        <RuleList 
            rules={rules} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            onCreate={handleCreate}
        />
      </div>

      <Modal
        title={t('rules.createRule')}
        visible={creating}
        onOk={confirmCreate}
        onCancel={() => { setCreating(false); setNewRuleName(''); }}
        autoFocus={false}
        focusLock={true}
      >
          <div className="mb-2">{t('rules.name')}</div>
          <input 
            className="arco-input arco-input-size-default w-full" 
            value={newRuleName} 
            onChange={(e) => setNewRuleName(e.target.value)}
            placeholder={t('rules.namePlaceholder')}
            onKeyDown={(e) => { if (e.key === 'Enter') confirmCreate(); }}
          />
      </Modal>
    </div>
  );
}

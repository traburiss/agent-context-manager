import { useEffect, useState } from 'react';
import { useStore } from '../stores/useStore';
import { 
    Card, Button, Switch, Modal, 
    Form, Input, Message, Typography, 
    Empty, Popconfirm, 
    Space,
    Affix
} from '@arco-design/web-react';
import { 
    IconPlus, IconFolder, IconFile, IconEdit
} from '@arco-design/web-react/icon';
import { Platform, PlatformPreset } from '../../shared/types';
import { Tag, Tooltip } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

const FormItem = Form.Item;

export default function Agents() {
  const { platforms, fetchPlatforms, updatePlatform, deletePlatform } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [presets, setPresets] = useState<PlatformPreset[]>([]);
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
      fetchPlatforms();
      window.api['config:get-presets']().then(setPresets);
  }, [fetchPlatforms]);

  const handleToggle = async (platform: Platform, checked: boolean) => {
      const updated = { ...platform, enabled: checked };
      await updatePlatform(updated);
      Message.success(t(checked ? 'agents.enabledSuccess' : 'agents.disabledSuccess', { name: platform.name }));
  };

  const handleSubmit = async () => {
    try {
        const values = await form.validate();
        setIsSaving(true);
        
        if (editingPlatform) {
            await updatePlatform({
                ...editingPlatform,
                name: values.name,
                skillsDir: values.skillsDir,
                rulesFile: values.rulesFile
            });
            Message.success(t('agents.updateSuccess'));
        } else {
            await window.api['platform:create']({
                name: values.name,
                skillsDir: values.skillsDir,
                rulesFile: values.rulesFile,
                enabled: true,
                linkedSkills: [],
                linkedRules: []
            });
            Message.success(t('agents.createSuccess'));
        }
        
        await fetchPlatforms();
        handleCloseModal();
    } catch (error) {
        console.error(error);
        Message.error(editingPlatform ? t('agents.updateFailed') : t('agents.createFailed'));
    } finally {
        setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingPlatform(null);
      form.resetFields();
  };

  const handleEdit = (platform: Platform) => {
      setEditingPlatform(platform);
      form.setFieldsValue({
          name: platform.name,
          skillsDir: platform.skillsDir,
          rulesFile: platform.rulesFile
      });
      setIsModalOpen(true);
  };

  const handleOpenDir = async (path: string) => {
      // Message.loading(t('common.opening')); // generic loading?
      const error = await window.api['platform:open-dir'](path);
      if (error) {
          Message.error(error);
      }
  };

  const handleOpenFile = async (path: string) => {
      const error = await window.api['platform:open-file'](path);
      if (error) {
          Message.error(error);
      }
  };

  const applyPreset = (preset: PlatformPreset) => {
      form.setFieldsValue({
          name: preset.name,
          skillsDir: preset.skillsDir,
          rulesFile: preset.rulesFile
      });
  };

  const handleDelete = async (id: string) => {
      try {
          await deletePlatform(id);
          Message.success(t('agents.deleteSuccess'));
      } catch (error) {
          console.error(error);
          Message.error('Failed to delete agent');
      }
  };

  const selectDir = async () => {
      const dir = await window.api['app:select-directory']();
      if (dir) {
          form.setFieldValue('skillsDir', dir);
      }
  };

  const selectFile = async () => {
      const file = await window.api['app:select-file']();
      if (file) {
          form.setFieldValue('rulesFile', file);
      }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="flex items-center justify-between mb-6">      
        <Typography.Title heading={4} className="m-0">
            {t('agents.title')}
        </Typography.Title>
        <Affix>          
            <Button type="primary" icon={<IconPlus />} onClick={() => setIsModalOpen(true)}>
            {t('agents.addAgent')}
            </Button>
        </Affix>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {platforms.map((platform) => (
          <div key={platform.id}>
            <Card
              className="h-full"
              title={platform.name}
              extra={
                <Switch 
                  checked={platform.enabled} 
                  onChange={(checked) => handleToggle(platform, checked)}
                />
              }
              actions={[
                <Popconfirm
                  key="delete"
                  title={t('agents.deleteAgent')}
                  content={t('agents.deleteConfirm')}
                  onOk={() => handleDelete(platform.id)}
                >
                  <Button type="text" status="danger">
                    {t('common.delete')}
                  </Button>
                </Popconfirm>,
                <Button key="edit" type="text"  icon={<IconEdit />} onClick={() => handleEdit(platform)}>
                    {t('common.edit')}
                </Button>
              ]}
            >
            <div className="min-h-[80px]">        
                <Input 
                    className="mt-2" 
                    value={platform.skillsDir}
                    suffix={<IconFolder className="cursor-pointer" onClick={() => handleOpenDir(platform.skillsDir)} />}
                    readOnly
                />
                <Input 
                    className="mt-2" 
                    value={platform.rulesFile}
                    suffix={<IconFile className="cursor-pointer"  onClick={() => handleOpenFile(platform.rulesFile)} />}
                    readOnly
                />
              </div>
            </Card>
          </div>
        ))}
      </div>

      {platforms.length === 0 && (
          <Empty description={t('agents.noAgents')} />
      )}

      <Modal 
        title={editingPlatform ? t('agents.editAgent') : t('agents.addAgent')}
        visible={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={isSaving}
        unmountOnExit
      >
          {!editingPlatform && (
              <div className="mb-6">
                  <div className="mb-2 text-text-2 text-sm">{t('agents.presets')}</div>
                  <div className="flex flex-wrap gap-2">
                      {presets.map(preset => (
                          <Tag 
                            key={preset.name} 
                            className="cursor-pointer hover:bg-fill-3 transition-colors"
                            onClick={() => applyPreset(preset)}
                          >
                              {preset.name}
                          </Tag>
                      ))}
                      <Tag 
                        className="cursor-pointer hover:bg-fill-3 transition-colors"
                        onClick={() => form.resetFields()}
                      >
                          {t('agents.custom')}
                      </Tag>
                  </div>
              </div>
          )}

          <Form form={form} layout="vertical">
              <FormItem 
                label={t('agents.agentName')} 
                field="name" 
                rules={[
                    { required: true },
                    {
                        validator: (value, callback) => {
                            if (!value) {
                                callback();
                                return;
                            }
                            const exists = platforms.some(p => 
                                p.name === value && 
                                (!editingPlatform || p.id !== editingPlatform.id)
                            );
                            if (exists) {
                                callback(t('agents.nameExists'));
                            } else {
                                callback();
                            }
                        }
                    }
                ]}
              >
                  <Input placeholder={t('agents.agentNamePlaceholder')} />
              </FormItem>
              <FormItem label={t('agents.skillsDir')} field="skillsDir" rules={[{ required: true }]}>
                  <Input 
                    placeholder={t('agents.skillsDirPlaceholder')}
                    suffix={<IconFolder className="cursor-pointer"  onClick={selectDir} />}
                  />
              </FormItem>
              <Typography.Text type="secondary" className="text-xs block -mt-4 mb-4">
                  {t('agents.skillsDirDesc')}
              </Typography.Text>
              <FormItem label={t('agents.rulesFile')} field="rulesFile" rules={[{ required: true }]}>
                  <Input 
                    placeholder={t('agents.rulesFilePlaceholder')}
                    suffix={<IconFile className="cursor-pointer"  onClick={selectFile} />}
                  />
              </FormItem>
              <Typography.Text type="secondary" className="text-xs block -mt-4">
                  {t('agents.rulesFileDesc')}
              </Typography.Text>
          </Form>
      </Modal>
    </div>
  );
}

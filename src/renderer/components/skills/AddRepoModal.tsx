import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Input, Message, Button } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';

interface AddRepoModalProps {
    visible: boolean;
    onCancel: () => void;
}

const PRESET_REPOS = [
    { name: 'awesome', url: 'https://github.com/ComposioHQ/awesome-claude-skills' },
    { name: 'baoyu', url: 'https://github.com/JimLiu/baoyu-skills.git' },
    { name: 'anthropics', url: 'https://github.com/anthropics/skills' },
    { name: 'myclaude', url: 'https://github.com/cexll/myclaude' },
    { name: 'openclaw', url: 'https://github.com/openclaw/skills' }
];

export const AddRepoModal: React.FC<AddRepoModalProps> = ({ visible, onCancel }) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const { addRepo } = useStore();
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (visible) {
            setLogs([]);
            if (window.api && window.api.on) {
                const removeListener = window.api.on('git:log', (message: string) => {
                    setLogs(prev => [...prev, message]);
                });
                return () => {
                    removeListener();
                };
            }
        }
        return () => {};
    }, [visible]);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const handleSubmit = async () => {
        try {
            const values = await form.validate();
            setLoading(true);
            setLogs([]); // Clear logs on new attempt
            await addRepo(values.url);
            Message.success(t('skills.addSuccess'));
            onCancel();
            form.resetFields();
            setLogs([]);
        } catch (err) {
            Message.error(`${t('skills.addFailed')}: ${(err as Error).message}`);
            setLogs(prev => [...prev, `Error: ${(err as Error).message}`]);
        } finally {
            setLoading(false);
        }
    };

    const handlePresetSelect = (url: string) => {
        form.setFieldValue('url', url);
    };

    return (
        <Modal
            title={t('skills.addRepo')}
            visible={visible}
            footer={null}
            onCancel={onCancel}
            style={{ width: 800 }}
        >
            
            <Form form={form} layout="vertical">
                <Form.Item label={t('skills.repoUrl')} field="url" rules={[{ required: true, message: t('skills.repoUrlRequired') }]}>
                    <Input placeholder={t('skills.repoUrlPlaceholder')} />
                </Form.Item>
            </Form>

            <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                    {t('skills.recommendedRepos')}
                    {PRESET_REPOS.map(repo => (
                        <Button 
                            key={repo.url} 
                            size="mini" 
                            type="secondary"
                            onClick={() => handlePresetSelect(repo.url)}
                            disabled={loading}
                        >
                            {repo.name}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-2 mb-6">
                <Button onClick={onCancel} loading={loading}>
                    {t('common.cancel')}
                </Button>
                <Button onClick={handleSubmit} type="primary" loading={loading}>
                    {t('common.confirm')}
                </Button>
            </div>
            
            <div 
                ref={logContainerRef}
                className="p-2 font-mono text-xs h-40 overflow-y-auto rounded border bg-black text-green-400 border-gray-700"
            >
                {logs.length === 0 ? (
                    <div >{t('skills.readyToClone')}</div>
                ) : (
                    logs.map((log, index) => (
                        <div key={index} className="whitespace-pre-wrap break-all">{log}</div>
                    ))
                )}
            </div>
        </Modal>
    );
};

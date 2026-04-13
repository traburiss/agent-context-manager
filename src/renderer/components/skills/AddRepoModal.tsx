import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Input, Message, Button, Tabs } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';
import { IpcChannels } from '../../../shared/ipc-channels';

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
    const { addRepo, addLocalRepo } = useStore();
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<string>('git');
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (visible) {
            setLogs([]);
            setActiveTab('git');
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

    const handleGitSubmit = async () => {
        try {
            const values = await form.validate(['url']);
            setLoading(true);
            setLogs([]);
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

    const handleLocalSubmit = async () => {
        try {
            const values = await form.validate(['localPath']);
            setLoading(true);
            setLogs([]);
            await addLocalRepo(values.localPath);
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

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setLogs([]);
        form.resetFields();
    };

    const handleSelectLocalPath = async () => {
        const path = await window.api[IpcChannels.SelectDirectory]();
        if (path) {
            form.setFieldValue('localPath', path);
        }
    };

    return (
        <Modal
            title={t('skills.addRepo')}
            visible={visible}
            footer={null}
            onCancel={onCancel}
            style={{ width: 800 }}
        >
            <Tabs activeTab={activeTab} onChange={handleTabChange}>
                <Tabs.TabPane key="git" title={t('skills.cloneFromGit')}>
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
                        <Button onClick={handleGitSubmit} type="primary" loading={loading}>
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
                </Tabs.TabPane>

                <Tabs.TabPane key="local" title={t('skills.addLocalPath')}>
                    <Form form={form} layout="vertical">
                        <Form.Item label={t('skills.localPath')} field="localPath" rules={[{ required: true, message: t('skills.localPathRequired') }]}>
                            <Input
                                placeholder={t('skills.localPathPlaceholder')}
                                addAfter={
                                    <Button
                                        size="small"
                                        onClick={handleSelectLocalPath}
                                        disabled={loading}
                                    >
                                        {t('common.select')}
                                    </Button>
                                }
                            />
                        </Form.Item>
                    </Form>

                    <div className="flex justify-end gap-2 mb-6">
                        <Button onClick={onCancel} loading={loading}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleLocalSubmit} type="primary" loading={loading}>
                            {t('common.confirm')}
                        </Button>
                    </div>
                </Tabs.TabPane>
            </Tabs>
        </Modal>
    );
};
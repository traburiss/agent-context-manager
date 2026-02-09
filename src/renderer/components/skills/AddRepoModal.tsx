import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Message, Button } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../stores/useStore';

interface AddRepoModalProps {
    visible: boolean;
    onCancel: () => void;
}

export const AddRepoModal: React.FC<AddRepoModalProps> = ({ visible, onCancel }) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const { addRepo } = useStore();
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    
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

    return (
        <Modal
            title={t('skills.addRepo')}
            visible={visible}
            footer={null}
            onCancel={onCancel}
            style={{ width: 600 }}
        >
            <Form form={form} layout="vertical">
                <Form.Item label={t('skills.repoUrl')} field="url" rules={[{ required: true, message: t('skills.repoUrlRequired') }]}>
                    <Input placeholder={t('skills.repoUrlPlaceholder')} />
                </Form.Item>
            </Form>

            <div className="flex justify-end gap-2 mb-4">
                <Button onClick={onCancel} loading={loading}>
                    {t('common.cancel')}
                </Button>
                <Button onClick={handleSubmit} type="primary" loading={loading}>
                    {t('common.confirm')}
                </Button>
            </div>
            
            <div className="p-2 font-mono text-xs h-40 overflow-y-auto rounded border bg-black text-green-400 border-gray-700">
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

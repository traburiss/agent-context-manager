import { Input, Radio, Card } from '@arco-design/web-react';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownEditor.css';

const { TextArea } = Input;

interface MarkdownEditorProps {
    title?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
}

export function MarkdownEditor({ title, value, onChange, placeholder, className, style }: MarkdownEditorProps) {
    const [mode, setMode] = useState<'edit' | 'preview'>('edit');

    return (
        <Card
            title={title}
            extra={
                <Radio.Group
                    type="button"
                    size="mini"
                    value={mode}
                    onChange={setMode}
                >
                    <Radio value="edit">Edit</Radio>
                    <Radio value="preview">Preview</Radio>
                </Radio.Group>
            }
            bordered={false}
            className={`${className || ''}`}
            style={{...style }}
        >
            {mode === 'edit' ? (
                <TextArea
                    value={value}
                    onChange={onChange}
                    autoSize={{ minRows: 10 }}
                    placeholder={placeholder}
                    />
                ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {value || '*No content*'}
                    </ReactMarkdown>
                )}  
        </Card>
    );
}

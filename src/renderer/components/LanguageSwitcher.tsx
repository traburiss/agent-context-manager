import { Select } from '@arco-design/web-react';
import { IconLanguage } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';

const Option = Select.Option;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
    localStorage.setItem('language', value);
  };

  return (
    <Select
      value={i18n.language}
      onChange={handleChange}
      style={{ width: 120 }}
      size="small"
      prefix={<IconLanguage />}
    >
      <Option value="zh-CN">中文</Option>
      <Option value="en-US">English</Option>
    </Select>
  );
}

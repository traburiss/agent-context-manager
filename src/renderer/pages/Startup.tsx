import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../stores/useStore';
import { Card, Steps, Result, Spin, Button, Input, Typography, Space } from '@arco-design/web-react';
import { IconLoading, IconFolder } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';
import { IpcChannels } from '../../shared/ipc-channels';

const Step = Steps.Step;

export default function Startup() {
  const { gitInstalled, isLoading, error, checkGit, systemConfig, updateSystemConfig, fetchSystemConfig } = useStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [baseDir, setBaseDir] = useState('');

  useEffect(() => {
    // Initial check
    const init = async () => {
      await checkGit();
      await fetchSystemConfig();
    };
    init();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // Step 0: Check Git
    if (!gitInstalled) {
      setCurrentStep(0);
      return;
    }

    // Step 1: Check Base Dir
    // If system config is loaded and has baseDir, we are done
    if (systemConfig?.baseDir) {
      setCurrentStep(2);
      setTimeout(() => navigate('/agents'), 1000);
      return;
    }

    // Otherwise, ask for Base Dir
    setCurrentStep(1);
    
  }, [gitInstalled, isLoading, systemConfig, navigate]);

  const handleSelectDir = async () => {
    try {
      const path = await window.api[IpcChannels.SelectDirectory]();
      if (path) {
        setBaseDir(path);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmBaseDir = async () => {
    if (!baseDir) return;
    await updateSystemConfig({ baseDir });
    // updateSystemConfig will trigger re-fetch and effect will navigate
  };

  return (
    <div className="flex items-center justify-center h-screen p-6 bg-bg-2">
      <Card className="w-[600px] max-w-full shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold m-0 mb-2">
            {t('startup.title')}
          </h2>
          <Typography.Text type="secondary">
            {t('startup.subtitle')}
          </Typography.Text>
        </div>

        <Steps current={currentStep} className="mb-10">
          <Step title={t('startup.envCheck')} icon={isLoading && currentStep === 0 ? <IconLoading /> : undefined} />
          <Step title={t('startup.configBaseDir')} />
          <Step title={t('startup.ready')} />
        </Steps>

        <div className="min-h-[200px] flex flex-col items-center justify-center">
          {/* Step 0: Environment Check */}
          {currentStep === 0 && (
            <>
              {isLoading && <Spin tip={t('startup.checking')} />}
              
              {!isLoading && !gitInstalled && (
                <Result
                  status="error"
                  title={t('startup.gitNotFound')}
                  subTitle={t('startup.gitNotFoundDesc')}
                  extra={[
                    <Button key="retry" type="primary" onClick={() => checkGit()}>
                      {t('common.retry')}
                    </Button>
                  ]}
                />
              )}
            </>
          )}

          {/* Step 1: Base Dir Selection */}
          {currentStep === 1 && (
            <div className="w-full max-w-[400px]">
              <Typography.Title heading={6} className="mt-0">
                {t('startup.selectBaseDirTitle')}
              </Typography.Title>
              <Typography.Paragraph type="secondary">
                 {t('startup.selectBaseDirDesc')}
              </Typography.Paragraph>
              
              <Space direction="vertical" className="w-full" size="large">
                <Input.Search
                  readOnly
                  value={baseDir}
                  placeholder={t('startup.selectBaseDirPlaceholder')}
                  searchButton={<IconFolder />}
                  onSearch={handleSelectDir}
                  className="w-full"
                />
                
                <Button 
                  type="primary" 
                  long 
                  disabled={!baseDir}
                  onClick={handleConfirmBaseDir}
                  loading={isLoading}
                >
                  {t('common.confirm')}
                </Button>
              </Space>
            </div>
          )}

          {/* Step 2: Ready */}
          {currentStep === 2 && (
            <Result
              status="success"
              title={t('startup.allReady')}
              subTitle={t('startup.entering')}
            />
          )}

          {error && (
            <div className="mt-6 text-red-600">
              {t('common.error')}: {error}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

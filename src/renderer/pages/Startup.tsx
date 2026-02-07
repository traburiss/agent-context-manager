import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../stores/useStore';
import { Card, Steps, Result, Spin } from '@arco-design/web-react';
import { IconCheckCircle, IconLoading } from '@arco-design/web-react/icon';
import { useTranslation } from 'react-i18next';

const Step = Steps.Step;

export default function Startup() {
  const { gitInstalled, isLoading, error, checkGit } = useStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    checkGit();
  }, [checkGit]);

  useEffect(() => {
    if (gitInstalled && !isLoading) {
      setTimeout(() => navigate('/agents'), 1000);
    }
  }, [gitInstalled, isLoading, navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      padding: 24
    }}>
      <Card style={{ width: 600, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
            {t('startup.title')}
          </h2>
        </div>

        <Steps current={gitInstalled ? 1 : 0} status={error ? 'error' : 'process'}>
          <Step 
            title={t('startup.envCheck')} 
            icon={isLoading ? <IconLoading /> : gitInstalled ? <IconCheckCircle /> : undefined}
          />
          <Step 
            title={t('startup.ready')} 
            icon={gitInstalled && !isLoading ? <IconCheckCircle /> : undefined}
          />
        </Steps>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          {isLoading && (
            <Spin tip={t('startup.checking')} />
          )}

          {!isLoading && !gitInstalled && (
            <Result
              status="error"
              title={t('startup.gitNotFound')}
              subTitle={t('startup.gitNotFoundDesc')}
            />
          )}

          {!isLoading && gitInstalled && (
            <Result
              status="success"
              title={t('startup.ready')}
            />
          )}

          {error && (
            <Result
              status="error"
              title={t('startup.initFailed')}
              subTitle={error}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

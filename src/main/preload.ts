import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // IPC 通信接口将在后续添加
});

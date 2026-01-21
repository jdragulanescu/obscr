const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("obscr", {
  openImage: () => ipcRenderer.invoke("file:openImage"),
  saveOutput: (options) => ipcRenderer.invoke("file:saveOutput", options),

  encrypt: (payload) => ipcRenderer.invoke("encrypt:start", payload),
  decrypt: (payload) => ipcRenderer.invoke("decrypt:start", payload),
  estimateCapacity: (payload) => ipcRenderer.invoke("encrypt:capacity", payload),
  generateImageDiff: (payload) => ipcRenderer.invoke("images:generateDiff", payload),
});

